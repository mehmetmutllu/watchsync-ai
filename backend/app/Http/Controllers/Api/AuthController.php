<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Yeni kullanıcı + dealer kaydı.
     *
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $user = DB::transaction(function () use ($validated) {
                // Dealer oluştur
                $dealer = Dealer::create([
                    'name'         => $validated['name'],
                    'company_name' => $validated['company_name'] ?? null,
                    'email'        => $validated['email'],
                    'status'       => 'active',
                ]);

                // User oluştur (ilk kullanıcı = owner)
                return User::create([
                    'dealer_id' => $dealer->id,
                    'name'      => $validated['name'],
                    'email'     => $validated['email'],
                    'password'  => $validated['password'], // Otomatik hash (casts)
                    'role'      => 'owner',
                ]);
            });

            // Session-based login (httpOnly cookie)
            Auth::login($user);
            $request->session()->regenerate();

            // Doğrulama e-postası gönder
            event(new Registered($user));

            return response()->json([
                'message' => 'Kayıt başarılı.',
                'user'    => $user->load('dealer'),
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration Error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Kayıt işlemi sırasında bir sunucu hatası oluştu.',
            ], 500);
        }
    }

    /**
     * E-posta/şifre ile giriş.
     *
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (! Auth::attempt([
            'email'    => $validated['email'],
            'password' => $validated['password'],
        ])) {
            return response()->json([
                'message' => 'E-posta adresi veya şifre hatalı.',
            ], 401);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        return response()->json([
            'message' => 'Giriş başarılı.',
            'user'    => $user->load('dealer'),
        ]);
    }

    /**
     * Oturum kapat (session invalidate).
     *
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Çıkış başarılı.',
        ]);
    }

    /**
     * Oturumdaki kullanıcı bilgisi.
     *
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('dealer'),
        ]);
    }
}
