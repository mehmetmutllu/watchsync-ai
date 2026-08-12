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
            $ipAddress = $request->ip();
            $user = DB::transaction(function () use ($validated, $ipAddress) {
                // Dealer oluştur (7 Günlük Ücretsiz Pro Deneme Süresi ile)
                $dealer = Dealer::create([
                    'name'                => $validated['name'],
                    'company_name'        => $validated['company_name'] ?? null,
                    'email'               => $validated['email'],
                    'status'              => 'active',
                    'plan_type'           => 'pro',
                    'subscription_status' => 'trialing',
                    'trial_ends_at'       => now()->addDays(7),
                ]);

                // User oluştur (ilk kullanıcı = owner)
                return User::create([
                    'dealer_id'          => $dealer->id,
                    'name'               => $validated['name'],
                    'email'              => $validated['email'],
                    'locale'             => app()->getLocale(),
                    'password'           => $validated['password'], // Otomatik hash (casts)
                    'role'               => 'owner',
                    'accepted_terms_at'  => now(),
                    'accepted_ip'        => $ipAddress,
                ]);
            });

            // Session-based login (httpOnly cookie)
            Auth::login($user);
            $request->session()->regenerate();

            // Doğrulama e-postası gönder
            event(new Registered($user));

            return response()->json([
                'message' => __('api.register_success'),
                'user'    => $user->load('dealer'),
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration Error: ' . $e->getMessage());

            return response()->json([
                'message' => __('api.register_server_error'),
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
                'message' => __('api.login_invalid'),
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // Devre dışı bırakılmış kullanıcı giriş yapamaz
        if ($user->isDisabled()) {
            Auth::guard('web')->logout();

            return response()->json([
                'message' => __('api.account_disabled'),
            ], 401);
        }

        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => __('api.login_success'),
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
            'message' => __('api.logout_success'),
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
