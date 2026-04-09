<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Dealer;
use App\Models\User;
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

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Kayıt başarılı.',
                'user'    => $user->load('dealer'),
                'token'   => $token,
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

        /** @var User $user */
        $user  = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Giriş başarılı.',
            'user'    => $user->load('dealer'),
            'token'   => $token,
        ]);
    }

    /**
     * Oturum kapat (mevcut token'ı iptal et).
     *
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

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
