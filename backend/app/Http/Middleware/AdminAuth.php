<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    /**
     * Admin kullanıcısı olduğunu doğrula.
     * Opsiyonel parametre ile rol kontrolü de yapılabilir:
     *   middleware('admin')         → sadece admin_user kaydı olsun yeterli
     *   middleware('admin:super_admin')  → sadece super_admin rolü
     *   middleware('admin:admin,super_admin') → admin VEYA super_admin
     */
    public function handle(Request $request, Closure $next, ?string $roles = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Kimlik doğrulama gerekli.'], 401);
        }

        $adminUser = $user->adminUser()->with('role')->first();

        if (! $adminUser || ! $adminUser->is_active) {
            return response()->json(['message' => 'Admin yetkisi gerekli.'], 403);
        }

        // Rol kontrolü
        if ($roles) {
            $allowedRoles = explode(',', $roles);
            if (! in_array($adminUser->role->slug, $allowedRoles, true)) {
                return response()->json(['message' => 'Bu işlem için yetkiniz bulunmuyor.'], 403);
            }
        }

        // Admin bilgisini request'e ekle
        $request->attributes->set('adminUser', $adminUser);

        return $next($request);
    }
}
