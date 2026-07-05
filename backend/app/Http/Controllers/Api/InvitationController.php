<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AcceptInvitationRequest;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    /**
     * GET /api/invitations/{token} — token doğrula, davet bilgisi dön.
     */
    public function show(string $token): JsonResponse
    {
        $invitation = $this->findByToken($token);

        if (! $invitation || $invitation->accepted_at || $invitation->revoked_at) {
            return response()->json(['message' => 'Geçersiz veya kullanılmış davet.'], 404);
        }

        if ($invitation->isExpired()) {
            return response()->json(['message' => 'Davetin süresi dolmuş.'], 410);
        }

        return response()->json([
            'email'       => $invitation->email,
            'role'        => $invitation->role,
            'dealer_name' => $invitation->dealer->company_name ?? $invitation->dealer->name,
            'expires_at'  => $invitation->expires_at->toIso8601String(),
        ]);
    }

    /**
     * POST /api/invitations/{token}/accept — hesabı oluştur + otomatik giriş.
     */
    public function accept(AcceptInvitationRequest $request, string $token): JsonResponse
    {
        $invitation = $this->findByToken($token);

        if (! $invitation || $invitation->accepted_at || $invitation->revoked_at) {
            return response()->json(['message' => 'Geçersiz veya kullanılmış davet.'], 404);
        }

        if ($invitation->isExpired()) {
            return response()->json(['message' => 'Davetin süresi dolmuş.'], 410);
        }

        // E-posta bu arada başka bir yerde kayıt olduysa çakışmayı engelle
        if (User::whereRaw('LOWER(email) = ?', [strtolower($invitation->email)])->exists()) {
            return response()->json(['message' => 'Bu e-posta adresi zaten kayıtlı.'], 422);
        }

        $validated = $request->validated();

        $user = DB::transaction(function () use ($invitation, $validated) {
            // Satırı kilitle ve durumu yeniden oku: aynı token ile eşzamanlı iki
            // kabul isteğinin ikisinin de geçip çift kullanıcı (500) yaratmasını
            // engeller. Kilit alındıktan sonra biri kabul etmişse diğeri 404 alır.
            $locked = Invitation::whereKey($invitation->id)->lockForUpdate()->first();

            if (! $locked || $locked->accepted_at || $locked->revoked_at) {
                abort(response()->json(['message' => 'Geçersiz veya kullanılmış davet.'], 404));
            }

            $user = User::create([
                'dealer_id'   => $locked->dealer_id,
                'name'        => $validated['name'],
                'email'       => $locked->email,
                'password'    => $validated['password'],
                'role'        => $locked->role,
                'status'      => 'active',
                'permissions' => $locked->permissions,
                'invited_by'  => $locked->invited_by,
                'invited_at'  => $locked->created_at,
            ]);

            // email_verified_at fillable değil → forceFill ile ata (davet zaten e-postayı doğrular)
            $user->forceFill(['email_verified_at' => now()])->save();

            $locked->update(['accepted_at' => now()]);

            return $user;
        });

        // Otomatik giriş (session/cookie)
        Auth::login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => 'Hesabınız oluşturuldu.',
            'user'    => $user->load('dealer'),
        ], 201);
    }

    private function findByToken(string $token): ?Invitation
    {
        return Invitation::where('token_hash', hash('sha256', $token))
            ->with('dealer')
            ->first();
    }
}
