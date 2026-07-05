<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    /**
     * Profil bilgilerini güncelle.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil başarıyla güncellendi.',
            'user'    => $user->fresh()->load('dealer'),
        ]);
    }

    /**
     * Şifre değiştir.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/'],
        ], [
            'password.min'   => 'Şifre en az 8 karakter olmalıdır.',
            'password.regex' => 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Mevcut şifre hatalı.',
                'errors'  => ['current_password' => ['Mevcut şifre hatalı.']],
            ], 422);
        }

        $user->update(['password' => $validated['password']]);

        return response()->json([
            'message' => 'Şifre başarıyla değiştirildi.',
        ]);
    }

    /**
     * Şirket bilgilerini güncelle.
     */
    public function updateCompany(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        $validated = $request->validate([
            'company_name'  => ['nullable', 'string', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:50'],
            'tax_number'    => ['nullable', 'string', 'max:50'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city'          => ['nullable', 'string', 'max:100'],
            'postal_code'   => ['nullable', 'string', 'max:20'],
            'country'       => ['nullable', 'string', 'max:100'],
            'website'       => ['nullable', 'url', 'max:255'],
        ]);

        $dealer->update($validated);

        return response()->json([
            'message' => 'Şirket bilgileri başarıyla güncellendi.',
            'dealer'  => $dealer->fresh(),
        ]);
    }

    /**
     * Bildirim tercihlerini güncelle.
     */
    public function updateNotifications(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        $validated = $request->validate([
            'invoice_emails'     => ['required', 'boolean'],
            'sync_alerts'        => ['required', 'boolean'],
            'stock_alerts'       => ['required', 'boolean'],
            'weekly_report'      => ['required', 'boolean'],
        ]);

        $dealer->update([
            'notification_preferences' => $validated,
        ]);

        return response()->json([
            'message'       => 'Bildirim tercihleri güncellendi.',
            'preferences'   => $validated,
        ]);
    }

    /**
     * Bildirim tercihlerini getir.
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        $defaults = [
            'invoice_emails' => true,
            'sync_alerts'    => true,
            'stock_alerts'   => true,
            'weekly_report'  => false,
        ];

        $preferences = array_merge($defaults, $dealer->notification_preferences ?? []);

        return response()->json([
            'preferences' => $preferences,
        ]);
    }

    /**
     * Ekip davet varsayılanlarını getir.
     */
    public function getTeamDefaults(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        return response()->json([
            'invitation_expiry_days' => $dealer->invitation_expiry_days
                ?? config('permissions.default_invitation_expiry_days'),
        ]);
    }

    /**
     * Ekip davet varsayılanlarını güncelle.
     */
    public function updateTeamDefaults(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        $validated = $request->validate([
            'invitation_expiry_days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        $dealer->update($validated);

        return response()->json([
            'message'                => 'Ekip ayarları güncellendi.',
            'invitation_expiry_days' => $dealer->invitation_expiry_days,
        ]);
    }
}
