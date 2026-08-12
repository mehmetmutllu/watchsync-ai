<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    /**
     * Admin giriş.
     *
     * POST /api/admin/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt([
            'email'    => $request->email,
            'password' => $request->password,
        ])) {
            return response()->json([
                'message' => __('api.login_invalid'),
            ], 401);
        }

        $user = Auth::user();
        $adminUser = $user->adminUser()->with('role')->first();

        if (! $adminUser || ! $adminUser->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Admin yetkisi bulunmuyor.',
            ], 403);
        }

        $request->session()->regenerate();

        // Son giriş zamanını güncelle
        $adminUser->update(['last_login_at' => now()]);

        // Activity log
        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'auth.login',
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message' => __('api.login_success'),
            'user'    => $user->load('dealer'),
            'admin'   => [
                'id'   => $adminUser->id,
                'role' => $adminUser->role,
            ],
        ]);
    }

    /**
     * Admin çıkış.
     *
     * POST /api/admin/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $adminUser = $request->attributes->get('adminUser');

        if ($adminUser) {
            AdminActivityLog::create([
                'admin_user_id' => $adminUser->id,
                'action'        => 'auth.logout',
                'ip_address'    => $request->ip(),
            ]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => __('api.logout_success'),
        ]);
    }

    /**
     * Oturumdaki admin bilgisi.
     *
     * GET /api/admin/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $adminUser = $user->adminUser()->with('role')->first();

        if (! $adminUser || ! $adminUser->is_active) {
            return response()->json([
                'message' => 'Admin yetkisi bulunmuyor.',
            ], 403);
        }

        return response()->json([
            'user'  => $user->load('dealer'),
            'admin' => [
                'id'          => $adminUser->id,
                'role'        => $adminUser->role,
                'permissions' => $adminUser->role->permissions ?? [],
            ],
        ]);
    }
}
