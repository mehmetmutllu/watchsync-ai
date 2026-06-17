<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AdminUser;
use App\Models\Dealer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ManagerController extends Controller
{
    /**
     * Tüm admin/manager kullanıcıları listele.
     *
     * GET /api/admin/managers
     */
    public function index(Request $request): JsonResponse
    {
        $query = AdminUser::with(['user:id,name,email,created_at', 'role:id,name,slug', 'creator:id,name']);

        // Arama
        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Rol filtresi
        if ($roleSlug = $request->query('role')) {
            $query->whereHas('role', fn ($q) => $q->where('slug', $roleSlug));
        }

        // Aktiflik filtresi
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $managers = $query->orderByDesc('created_at')->paginate(15);

        return response()->json($managers);
    }

    /**
     * Yeni admin/manager oluştur.
     *
     * POST /api/admin/managers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id'  => 'required|exists:roles,id',
        ]);

        $currentAdmin = $request->attributes->get('adminUser');

        // Super admin rolü sadece super admin atayabilir
        $targetRole = Role::findOrFail($validated['role_id']);
        if ($targetRole->slug === 'super_admin' && ! $currentAdmin->isSuperAdmin()) {
            return response()->json([
                'message' => 'Super Admin rolünü sadece Super Admin atayabilir.',
            ], 403);
        }

        $adminUser = DB::transaction(function () use ($validated, $currentAdmin) {
            // Admin dealer'ı bul veya oluştur
            $adminDealer = Dealer::firstOrCreate(
                ['email' => 'admin@watchsync.ai'],
                [
                    'name'         => 'WatchSync Admin',
                    'company_name' => 'WatchSync AI',
                    'phone'        => '+905551234567',
                    'status'       => 'active',
                ]
            );

            $user = User::create([
                'dealer_id' => $adminDealer->id,
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'password'  => Hash::make($validated['password']),
                'role'      => 'owner',
            ]);

            return AdminUser::create([
                'user_id'    => $user->id,
                'role_id'    => $validated['role_id'],
                'is_active'  => true,
                'created_by' => $currentAdmin->user_id,
            ]);
        });

        // Activity log
        AdminActivityLog::create([
            'admin_user_id' => $currentAdmin->id,
            'action'        => 'manager.create',
            'target_type'   => AdminUser::class,
            'target_id'     => $adminUser->id,
            'details'       => ['email' => $validated['email']],
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Yönetici başarıyla oluşturuldu.',
            'manager' => $adminUser->load(['user:id,name,email', 'role:id,name,slug']),
        ], 201);
    }

    /**
     * Admin/manager bilgisini güncelle.
     *
     * PUT /api/admin/managers/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $adminUser = AdminUser::with(['user', 'role'])->findOrFail($id);
        $currentAdmin = $request->attributes->get('adminUser');

        // Super admin'i sadece super admin düzenleyebilir
        if ($adminUser->isSuperAdmin() && ! $currentAdmin->isSuperAdmin()) {
            return response()->json([
                'message' => 'Super Admin hesabını düzenleme yetkiniz yok.',
            ], 403);
        }

        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => ['sometimes', 'email', Rule::unique('users')->ignore($adminUser->user_id)],
            'password'  => 'sometimes|string|min:8',
            'role_id'   => 'sometimes|exists:roles,id',
            'is_active' => 'sometimes|boolean',
        ]);

        // Super admin rolü kontrolü
        if (isset($validated['role_id'])) {
            $targetRole = Role::findOrFail($validated['role_id']);
            if ($targetRole->slug === 'super_admin' && ! $currentAdmin->isSuperAdmin()) {
                return response()->json([
                    'message' => 'Super Admin rolünü sadece Super Admin atayabilir.',
                ], 403);
            }
        }

        DB::transaction(function () use ($adminUser, $validated) {
            // User bilgilerini güncelle
            $userData = array_filter([
                'name'  => $validated['name'] ?? null,
                'email' => $validated['email'] ?? null,
            ]);
            if (isset($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }
            if (! empty($userData)) {
                $adminUser->user->update($userData);
            }

            // Admin bilgilerini güncelle
            $adminData = array_filter([
                'role_id'   => $validated['role_id'] ?? null,
                'is_active' => $validated['is_active'] ?? null,
            ], fn ($v) => $v !== null);
            if (! empty($adminData)) {
                $adminUser->update($adminData);
            }
        });

        // Activity log
        AdminActivityLog::create([
            'admin_user_id' => $currentAdmin->id,
            'action'        => 'manager.update',
            'target_type'   => AdminUser::class,
            'target_id'     => $adminUser->id,
            'details'       => $validated,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Yönetici başarıyla güncellendi.',
            'manager' => $adminUser->fresh()->load(['user:id,name,email', 'role:id,name,slug']),
        ]);
    }

    /**
     * Admin/manager sil.
     *
     * DELETE /api/admin/managers/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $adminUser = AdminUser::with('role')->findOrFail($id);
        $currentAdmin = $request->attributes->get('adminUser');

        // Kendini silme engeli
        if ($adminUser->id === $currentAdmin->id) {
            return response()->json([
                'message' => 'Kendi hesabınızı silemezsiniz.',
            ], 403);
        }

        // Super admin'i sadece super admin silebilir
        if ($adminUser->isSuperAdmin() && ! $currentAdmin->isSuperAdmin()) {
            return response()->json([
                'message' => 'Super Admin hesabını silme yetkiniz yok.',
            ], 403);
        }

        $email = $adminUser->user->email ?? 'unknown';

        // Sadece admin_user kaydını sil, user kalır
        $adminUser->delete();

        // Activity log
        AdminActivityLog::create([
            'admin_user_id' => $currentAdmin->id,
            'action'        => 'manager.delete',
            'target_type'   => AdminUser::class,
            'target_id'     => $id,
            'details'       => ['email' => $email],
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Yönetici başarıyla silindi.',
        ]);
    }

    /**
     * Mevcut rolleri listele.
     *
     * GET /api/admin/roles
     */
    public function roles(): JsonResponse
    {
        return response()->json([
            'roles' => Role::all(['id', 'name', 'slug', 'description']),
        ]);
    }
}
