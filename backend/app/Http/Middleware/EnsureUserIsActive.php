<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Pasifleştirilmiş (disabled) kullanıcıyı tüm API rotalarında reddet.
     * `permission:` middleware'i olmayan rotalar (bildirimler, profil vb.)
     * aksi halde mevcut oturumla erişilebilir kalıyordu.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('sanctum');

        if ($user && method_exists($user, 'isDisabled') && $user->isDisabled()) {
            return response()->json(['message' => 'Hesabınız devre dışı bırakılmış.'], 403);
        }

        return $next($request);
    }
}
