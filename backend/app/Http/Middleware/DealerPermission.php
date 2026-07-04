<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DealerPermission
{
    /**
     * Oturum açmış bayi kullanıcısının belirli bir izne sahip olduğunu doğrula.
     *   middleware('permission:inventory.edit')
     * owner her zaman izinlidir; disabled kullanıcı reddedilir.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Kimlik doğrulaması gerekli.'], 401);
        }

        if ($user->isDisabled()) {
            return response()->json(['message' => 'Hesabınız devre dışı bırakılmış.'], 403);
        }

        if (! $user->hasPermission($permission)) {
            return response()->json(['message' => 'Bu işlem için yetkiniz bulunmuyor.'], 403);
        }

        return $next($request);
    }
}
