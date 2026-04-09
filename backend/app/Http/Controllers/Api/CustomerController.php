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
            ->withCount(['notes', 'invoices']);

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

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
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
            ->findOrFail($id);

        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $validated = $request->validate([
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
        ]);

        $customer->update($validated);

        return response()->json(['data' => $customer]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $customer->delete();

        return response()->json(['message' => 'Müşteri silindi.']);
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

    public function destroyNote(Request $request, int $customerId, int $noteId): JsonResponse
    {
        $customer = Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($customerId);

        $note = $customer->notes()->findOrFail($noteId);
        $note->delete();

        return response()->json(['message' => 'Not silindi.']);
    }
}
