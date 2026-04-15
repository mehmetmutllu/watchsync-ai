<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * E-posta doğrulama durumunu kontrol et.
     *
     * GET /api/auth/email/verification-status
     */
    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'verified' => $request->user()->hasVerifiedEmail(),
        ]);
    }

    /**
     * E-posta doğrulama linkini yeniden gönder.
     *
     * POST /api/auth/email/verification-notification
     */
    public function resend(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'E-posta zaten doğrulanmış.',
            ]);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Doğrulama e-postası gönderildi.',
        ]);
    }

    /**
     * E-posta doğrulamasını gerçekleştir (signed URL callback).
     *
     * GET /api/auth/email/verify/{id}/{hash}
     */
    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $id) {
            return response()->json(['message' => 'Yetkisiz.'], 403);
        }

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return response()->json(['message' => 'Geçersiz doğrulama linki.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'E-posta zaten doğrulanmış.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json(['message' => 'E-posta başarıyla doğrulandı.']);
    }
}
