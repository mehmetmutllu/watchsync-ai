<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminPermission
{
    /**
     * Admin kullanıcısının belirli bir yetkiye sahip olduğunu doğrula.
     *   middleware('admin.permission:admin.users.create')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $adminUser = $request->attributes->get('adminUser');

        if (! $adminUser) {
            return response()->json(['message' => 'Admin yetkisi gerekli.'], 403);
        }

        if (! $adminUser->hasPermission($permission)) {
            return response()->json(['message' => 'Bu işlem için yetkiniz bulunmuyor.'], 403);
        }

        return $next($request);
    }
}
