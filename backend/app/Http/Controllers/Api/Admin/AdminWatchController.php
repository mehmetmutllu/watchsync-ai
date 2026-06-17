<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Watch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWatchController extends Controller
{
    /**
     * Tüm saatleri listele.
     *
     * GET /api/admin/watches
     */
    public function index(Request $request): JsonResponse
    {
        $query = Watch::with([
            'dealer:id,name,company_name',
            'images' => fn ($q) => $q->where('is_primary', true),
        ]);

        // Arama
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        // Validation status filtresi
        if ($validationStatus = $request->query('validation_status')) {
            $query->where('validation_status', $validationStatus);
        }

        // Status filtresi
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Dealer filtresi
        if ($dealerId = $request->query('dealer_id')) {
            $query->where('dealer_id', $dealerId);
        }

        $watches = $query->latest()->paginate(20);

        return response()->json($watches);
    }

    /**
     * Flagged saatleri listele.
     *
     * GET /api/admin/watches/flagged
     */
    public function flagged(Request $request): JsonResponse
    {
        $watches = Watch::with([
            'dealer:id,name,company_name',
            'images' => fn ($q) => $q->where('is_primary', true),
        ])
            ->where('validation_status', 'flagged')
            ->latest()
            ->paginate(20);

        return response()->json($watches);
    }

    /**
     * Saat detayı.
     *
     * GET /api/admin/watches/{id}
     */
    public function show(int $id): JsonResponse
    {
        $watch = Watch::with([
            'dealer:id,name,company_name,email',
            'images',
            'syncLogs' => fn ($q) => $q->latest()->limit(10),
            'syncLogs.platform:id,name',
        ])->findOrFail($id);

        return response()->json(['watch' => $watch]);
    }

    /**
     * Saat doğrulama durumunu güncelle (onayla/reddet).
     *
     * PUT /api/admin/watches/{id}/validate
     */
    public function validateWatch(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'validation_status' => 'required|in:validated,rejected',
            'reason'            => 'required_if:validation_status,rejected|nullable|string|max:500',
        ]);

        $watch = Watch::findOrFail($id);

        $details = $watch->validation_details ?? [];
        $details['admin_review'] = [
            'status'      => $request->validation_status,
            'reason'      => $request->reason,
            'reviewed_at' => now()->toIso8601String(),
        ];

        $watch->update([
            'validation_status'  => $request->validation_status,
            'validation_details' => $details,
        ]);

        $adminUser = $request->attributes->get('adminUser');
        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => "watch.{$request->validation_status}",
            'target_type'   => Watch::class,
            'target_id'     => $id,
            'details'       => ['reason' => $request->reason],
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => $request->validation_status === 'validated'
                ? 'Saat onaylandı.'
                : 'Saat reddedildi.',
            'watch' => $watch->fresh(),
        ]);
    }
}
