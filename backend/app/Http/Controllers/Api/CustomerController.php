<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $query = Customer::where('dealer_id', $dealerId)
            ->withCount(['notes', 'invoices'])
            ->withSum(['invoices' => function($q) {
                $q->where('status', 'paid');
            }], 'total')
            ->withMax('notes', 'created_at');

        if ($search = $request->input('search')) {
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $search);
            $query->where(function ($q) use ($escaped) {
                $q->where('first_name', 'like', "%{$escaped}%")
                  ->orWhere('last_name', 'like', "%{$escaped}%")
                  ->orWhere('email', 'like', "%{$escaped}%")
                  ->orWhere('company', 'like', "%{$escaped}%");
            });
        }

        if ($tag = $request->input('tag')) {
            $query->whereJsonContains('tags', $tag);
        }

        $customers = $query->orderBy('last_name')->paginate(20);

        $customers->getCollection()->transform(function ($customer) {
            return $this->appendVipAndFollowUp($customer);
        });

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pipeline_stage'=> 'nullable|string|in:lead,sourcing,negotiating,sold',
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'email'       => 'nullable|email|max:255',
            'phone'       => 'nullable|string|max:50',
            'company'     => 'nullable|string|max:200',
            'address'     => 'nullable|string|max:1000',
            'city'        => 'nullable|string|max:100',
            'country'     => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tags'        => 'nullable|array',
            'tags.*'      => 'string|max:50',
            'birth_date'  => 'nullable|date',
            'auto_send_birthday_mail' => 'boolean',
            'metadata'    => 'nullable|array',
        ]);

        $validated['dealer_id'] = $request->user()->dealer_id;

        $customer = Customer::create($validated);

        return response()->json(['data' => $customer], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->with(['notes.user:id,name', 'invoices:id,customer_id,invoice_number,status,total,currency,issue_date'])
            ->withCount(['notes', 'invoices'])
            ->withSum(['invoices' => function($q) { $q->where('status', 'paid'); }], 'total')
            ->findOrFail($id);

        $customer = $this->appendVipAndFollowUp($customer);

        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'pipeline_stage'=> 'sometimes|string|in:lead,sourcing,negotiating,sold',
            'first_name'  => 'sometimes|string|max:100',
            'last_name'   => 'sometimes|string|max:100',
            'email'       => 'nullable|email|max:255',
            'phone'       => 'nullable|string|max:50',
            'company'     => 'nullable|string|max:200',
            'address'     => 'nullable|string|max:1000',
            'city'        => 'nullable|string|max:100',
            'country'     => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tags'        => 'nullable|array',
            'tags.*'      => 'string|max:50',
            'birth_date'  => 'nullable|date',
            'auto_send_birthday_mail' => 'boolean',
            'metadata'    => 'nullable|array',
        ]);

        $customer->update($validated);

        return response()->json(['data' => $customer]);
    }

    public function timeline(Request $request, int $id): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $notes = $customer->notes()->with('user:id,name')->get()->map(function ($note) {
            return [
                'id' => 'note_' . $note->id,
                'type' => 'note',
                'title' => 'Notiz hinzugefügt',
                'description' => $note->content,
                'user_name' => $note->user->name ?? 'System',
                'date' => $note->created_at,
            ];
        });

        $invoices = $customer->invoices()->get()->map(function ($invoice) {
            return [
                'id' => 'invoice_' . $invoice->id,
                'type' => 'invoice',
                'title' => 'Rechnung erstellt: ' . $invoice->invoice_number,
                'description' => $invoice->total . ' ' . $invoice->currency . ' (' . ucfirst($invoice->status) . ')',
                'user_name' => 'System',
                'date' => $invoice->created_at,
            ];
        });

        $timeline = collect($notes)->merge($invoices)->sortByDesc('date')->values()->all();

        return response()->json(['data' => $timeline]);
    }

    public function stats(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $totalCustomers = Customer::where('dealer_id', $dealerId)->count();

        $month = now()->format('m');
        $birthdaysThisMonth = Customer::where('dealer_id', $dealerId)
            ->whereNotNull('birth_date')
            ->whereRaw('MONTH(birth_date) = ?', [$month])
            ->count();

        $totalRevenue = \App\Models\Invoice::where('dealer_id', $dealerId)
            ->where('status', 'paid')
            ->sum('total');

        return response()->json([
            'total_customers' => $totalCustomers,
            'birthdays_this_month' => $birthdaysThisMonth,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $customer->delete();

        return response()->json(['message' => 'Müşteri silindi.']);
    }

    public function upcomingBirthdays(Request $request): JsonResponse
    {
        // Find customers whose birthday is in the next 7 days, ignoring the year
        $dealerId = $request->user()->dealer_id;
        
        // MySQL specific: we can format date as MM-DD and compare
        $today = now()->format('m-d');
        $nextWeek = now()->addDays(7)->format('m-d');
        
        $query = Customer::where('dealer_id', $dealerId)
            ->whereNotNull('birth_date');
            
        if ($nextWeek < $today) {
            // crosses year boundary
            $query->where(function($q) use ($today, $nextWeek) {
                $q->whereRaw("DATE_FORMAT(birth_date, '%m-%d') >= ?", [$today])
                  ->orWhereRaw("DATE_FORMAT(birth_date, '%m-%d') <= ?", [$nextWeek]);
            });
        } else {
            $query->whereRaw("DATE_FORMAT(birth_date, '%m-%d') BETWEEN ? AND ?", [$today, $nextWeek]);
        }
        
        $customers = $query->orderByRaw("DATE_FORMAT(birth_date, '%m-%d') ASC")->get();
        
        return response()->json(['data' => $customers]);
    }

    // ─── Matches ────────────────────────────────────────────

    public function matches(Request $request, int $id, \App\Services\Contracts\IMarketProvider $marketProvider): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $desiredWatch = $customer->metadata['desired_watch'] ?? null;
        
        if (!$desiredWatch) {
            return response()->json(['data' => ['local_inventory' => [], 'arbitrage_deals' => []]]);
        }

        $words = array_filter(explode(' ', trim($desiredWatch)));
        
        $query = \App\Models\Watch::where('dealer_id', $request->user()->dealer_id)
            ->whereIn('status', ['draft', 'available', 'reserved']); // excluding sold
        
        if (count($words) > 0) {
            foreach ($words as $word) {
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $word);
                $query->where(function ($q) use ($escaped) {
                    $q->where('brand', 'like', "%{$escaped}%")
                      ->orWhere('model', 'like', "%{$escaped}%")
                      ->orWhere('reference_number', 'like', "%{$escaped}%")
                      ->orWhere('title', 'like', "%{$escaped}%");
                });
            }
        }
        
        $matches = $query->latest()->limit(20)->get();
        
        // Generate Mock Arbitrage Deals
        $basePrice = rand(8000, 25000);
        
        // Use the injected MarketDataService implementation
        $estimatedMarketValue = $marketProvider->getEstimatedMarketValue($desiredWatch, '');
        $margin = $estimatedMarketValue - $basePrice;

        $mockDeals = [
            [
                'id' => 'chr-' . rand(1000, 9999),
                'platform' => 'Chrono24',
                'title' => 'Neu: ' . $desiredWatch . ' (Full Set)',
                'price' => $basePrice,
                'estimated_market_value' => $estimatedMarketValue,
                'margin' => $margin,
                'condition' => 'Ungetragen',
                'location' => 'Deutschland',
                'url' => 'https://www.chrono24.de/search/index.htm?query=' . urlencode($desiredWatch),
                'data_source' => 'MarketDataService (Mock)'
            ],
            [
                'id' => 'chr-' . rand(1000, 9999),
                'platform' => 'WatchCharts',
                'title' => $desiredWatch . ' - Top Zustand',
                'price' => $basePrice - 500,
                'estimated_market_value' => $basePrice + 800,
                'margin' => 1300,
                'condition' => 'Sehr gut',
                'location' => 'Italien',
                'url' => '#'
            ]
        ];
        
        return response()->json([
            'data' => [
                'local_inventory' => $matches,
                'arbitrage_deals' => $mockDeals,
            ]
        ]);
    }

    // ─── Notes ──────────────────────────────────────────────

    public function storeNote(Request $request, int $customerId): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($customerId);

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $note = $customer->notes()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $note->load('user:id,name');

        return response()->json(['data' => $note], 201);
    }

    private function appendVipAndFollowUp($customer)
    {
        // 1. VIP Tier
        $totalRevenue = $customer->invoices_sum_total ?? 0;
        if (!isset($customer->invoices_sum_total) && $customer->relationLoaded('invoices')) {
            $totalRevenue = $customer->invoices->where('status', 'paid')->sum('total');
        }

        $tier = 'Standard';
        if ($totalRevenue >= 50000) {
            $tier = 'Platinum';
        } elseif ($totalRevenue >= 20000) {
            $tier = 'Gold';
        } elseif ($totalRevenue >= 5000) {
            $tier = 'Silver';
        }

        $customer->vip_tier = $tier;

        // 2. Follow up logic
        $needsFollowUp = false;
        if ($customer->pipeline_stage !== 'sold') {
            $lastInteraction = null;
            
            if (isset($customer->notes_max_created_at)) {
                $lastInteraction = \Carbon\Carbon::parse($customer->notes_max_created_at);
            } elseif ($customer->relationLoaded('notes') && $customer->notes->isNotEmpty()) {
                $lastInteraction = clone $customer->notes->max('created_at');
            }

            if (!$lastInteraction) {
                $lastInteraction = clone $customer->created_at;
            }

            if ($lastInteraction && $lastInteraction->diffInDays(now()) > 90) {
                $needsFollowUp = true;
            }
        }
        $customer->needs_follow_up = $needsFollowUp;

        return $customer;
    }

    public function destroyNote(Request $request, int $customerId, int $noteId): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($customerId);

        $note = $customer->notes()->findOrFail($noteId);
        $note->delete();

        return response()->json(['message' => 'Not silindi.']);
    }
}
