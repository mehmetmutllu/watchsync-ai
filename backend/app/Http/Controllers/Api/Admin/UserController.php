<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use App\Models\Watch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class UserController extends Controller
{
    /**
     * Kullanıcı listesi.
     *
     * GET /api/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('dealer:id,name,company_name,status')
            ->withCount('watches');

        // Arama
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Durum filtresi (dealer status)
        if ($status = $request->query('status')) {
            $query->whereHas('dealer', fn ($q) => $q->where('status', $status));
        }

        // Kayıt tarihi aralığı
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        // Sıralama
        $sortBy = $request->query('sort_by', 'created_at');
        $sortDir = $request->query('sort_dir', 'desc');
        $allowedSorts = ['name', 'email', 'created_at', 'watches_count'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $users = $query->paginate(20);

        return response()->json($users);
    }

    /**
     * Kullanıcı detayı.
     *
     * GET /api/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'dealer',
            'watches' => fn ($q) => $q->latest()->limit(50),
            'watches.images' => fn ($q) => $q->where('is_primary', true),
        ])->withCount('watches')->findOrFail($id);

        // Satış istatistikleri
        $salesCount = Watch::where('dealer_id', $user->dealer_id)
            ->where('status', 'sold')
            ->count();

        $totalSalesValue = Watch::where('dealer_id', $user->dealer_id)
            ->where('status', 'sold')
            ->sum('sale_price');

        return response()->json([
            'user'              => $user,
            'sales_count'       => $salesCount,
            'total_sales_value' => (float) $totalSalesValue,
        ]);
    }

    /**
     * Kullanıcı durumunu değiştir (aktif/pasif).
     *
     * PUT /api/admin/users/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $user = User::findOrFail($id);
        $dealer = $user->dealer;
        $dealer->update(['status' => $request->status]);

        $adminUser = $request->attributes->get('adminUser');
        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'user.status_change',
            'target_type'   => User::class,
            'target_id'     => $id,
            'details'       => ['status' => $request->status],
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => __('api.user_status_updated'),
        ]);
    }

    /**
     * Şifre sıfırlama linki gönder.
     *
     * POST /api/admin/users/{id}/reset-password
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $status = Password::sendResetLink(['email' => $user->email]);

        $adminUser = $request->attributes->get('adminUser');
        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'user.reset_password',
            'target_type'   => User::class,
            'target_id'     => $id,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => $status === Password::RESET_LINK_SENT
                ? __('api.password_reset_sent')
                : __('api.password_reset_failed'),
        ], $status === Password::RESET_LINK_SENT ? 200 : 422);
    }

    /**
     * Kullanıcı sil (soft delete — dealer'ı suspend et).
     *
     * DELETE /api/admin/users/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Admin kullanıcıyı silemez
        if ($user->adminUser) {
            return response()->json([
                'message' => __('api.admin_no_delete_here'),
            ], 403);
        }

        $user->dealer->update(['status' => 'suspended']);
        $user->update([
            'email' => "deleted_{$user->id}_{$user->email}",
            'name'  => __('api.deleted_user'),
        ]);

        $adminUser = $request->attributes->get('adminUser');
        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'user.delete',
            'target_type'   => User::class,
            'target_id'     => $id,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => __('api.user_deleted'),
        ]);
    }

    /**
     * Kullanıcı saatleri.
     *
     * GET /api/admin/users/{id}/watches
     */
    public function watches(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $watches = Watch::where('dealer_id', $user->dealer_id)
            ->with('images')
            ->latest()
            ->paginate(20);

        return response()->json($watches);
    }
}
