<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Team\InviteTeamMemberRequest;
use App\Http\Requests\Team\UpdateMemberPermissionsRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    /**
     * GET /api/team — üyeler + bekleyen davetler + izin kataloğu.
     */
    public function index(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $members = User::where('dealer_id', $dealerId)
            ->orderBy('created_at')
            ->get()
            ->map(fn (User $u) => $this->memberPayload($u));

        $invitations = Invitation::where('dealer_id', $dealerId)
            ->pending()
            ->with('invitedBy:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Invitation $i) => [
                'id'         => $i->id,
                'email'      => $i->email,
                'role'       => $i->role,
                'permissions' => $i->permissions,
                'expires_at' => $i->expires_at->toIso8601String(),
                'invited_by' => $i->invitedBy?->name,
            ]);

        return response()->json([
            'members'     => $members,
            'invitations' => $invitations,
            'catalog'     => $this->catalog(),
        ]);
    }

    /**
     * GET /api/team/permissions — taksonomi + preset'ler (UI için).
     */
    public function permissions(): JsonResponse
    {
        return response()->json($this->catalog());
    }

    /**
     * POST /api/team/invitations — yeni davet oluştur.
     */
    public function storeInvitation(InviteTeamMemberRequest $request): JsonResponse
    {
        $inviter  = $request->user();
        $dealerId = $inviter->dealer_id;
        $email    = strtolower($request->input('email'));
        $role     = $request->input('role');
        $granted  = $request->input('permissions'); // null → preset'e düşer

        // Aynı e-posta zaten kayıtlı bir kullanıcıysa (herhangi bir bayide) → 422
        if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            throw ValidationException::withMessages([
                'email' => __('api.email_already_registered'),
            ]);
        }

        // Privilege escalation koruması: davet eden sahip olmadığı izni veremez
        $this->assertGrantableBy($inviter, $granted, $role);

        $expiresInInput = $request->input('expires_in_days');
        if ($expiresInInput === 0 || $expiresInInput === '0') {
            $expiresAt = null;
        } else {
            $expiresInDays = $expiresInInput
                ?? $inviter->dealer->invitation_expiry_days
                ?? config('permissions.default_invitation_expiry_days');
            $expiresAt = now()->addDays((int) $expiresInDays);
        }

        // Aynı bayide bekleyen davet varsa güncelle (yeniden oluşturma yerine)
        $invitation = Invitation::where('dealer_id', $dealerId)
            ->whereRaw('LOWER(email) = ?', [$email])
            ->pending()
            ->first();

        $token = Str::random(64);

        $attributes = [
            'dealer_id'   => $dealerId,
            'email'       => $email,
            // Davet e-postası, davet edenin o anki arayüz dilinde gönderilir.
            'locale'      => app()->getLocale(),
            'role'        => $role,
            'permissions' => $granted,
            'token_hash'  => hash('sha256', $token),
            'invited_by'  => $inviter->id,
            'expires_at'  => $expiresAt,
            'accepted_at' => null,
            'revoked_at'  => null,
        ];

        if ($invitation) {
            $invitation->update($attributes);
        } else {
            $invitation = Invitation::create($attributes);
        }

        $this->sendInvitationMail($invitation, $token);

        $payload = [
            'id'         => $invitation->id,
            'email'      => $invitation->email,
            'role'       => $invitation->role,
            'permissions' => $invitation->permissions,
            'expires_at' => $invitation->expires_at?->toIso8601String(),
        ];

        // Local/testing ortamında Playwright'ın token'ı alabilmesi için accept_url dön
        if (app()->environment('local', 'testing')) {
            $payload['accept_url'] = $this->acceptUrl($token);
        }

        return response()->json(['invitation' => $payload], 201);
    }

    /**
     * POST /api/team/invitations/{invitation}/resend — daveti yeniden gönder.
     */
    public function resendInvitation(Request $request, Invitation $invitation): JsonResponse
    {
        $this->assertSameDealer($request, $invitation->dealer_id);

        if (! $invitation->isPending()) {
            throw ValidationException::withMessages([
                'invitation' => __('api.only_pending_resend'),
            ]);
        }

        // Yeni token üret (eskisi geçersizleşir), süreyi tazele
        $token = Str::random(64);
        $expiresInDays = $invitation->dealer->invitation_expiry_days
            ?? config('permissions.default_invitation_expiry_days');

        $invitation->update([
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays((int) $expiresInDays),
        ]);

        $this->sendInvitationMail($invitation, $token);

        $payload = ['message' => __('api.invitation_resent')];
        if (app()->environment('local', 'testing')) {
            $payload['accept_url'] = $this->acceptUrl($token);
        }

        return response()->json($payload);
    }

    /**
     * DELETE /api/team/invitations/{invitation} — daveti iptal et.
     */
    public function destroyInvitation(Request $request, Invitation $invitation): JsonResponse
    {
        $this->assertSameDealer($request, $invitation->dealer_id);

        $invitation->update(['revoked_at' => now()]);

        return response()->json(['message' => 'Davet iptal edildi.']);
    }

    /**
     * PUT /api/team/members/{user}/permissions — üye izinlerini güncelle.
     */
    public function updateMemberPermissions(UpdateMemberPermissionsRequest $request, User $user): JsonResponse
    {
        $this->assertSameDealer($request, $user->dealer_id);

        if ($user->isOwner()) {
            throw ValidationException::withMessages([
                'user' => __('api.owner_perms_locked'),
            ]);
        }

        $granted = $request->input('permissions', []);
        $this->assertGrantableBy($request->user(), $granted, $user->role);

        $user->update(['permissions' => $granted]);

        return response()->json([
            'message' => __('api.perms_updated'),
            'member'  => $this->memberPayload($user->fresh()),
        ]);
    }

    /**
     * PUT /api/team/members/{user}/role — üye rolünü güncelle.
     */
    public function updateMemberRole(Request $request, User $user): JsonResponse
    {
        $this->assertSameDealer($request, $user->dealer_id);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => __('api.cannot_change_own_role'),
            ]);
        }

        $validated = $request->validate([
            'role' => ['required', Rule::in(config('permissions.invitable_roles'))],
        ]);

        // Son owner'ın rolü düşürülemez; owner üzerinde yalnız owner işlem yapabilir
        if ($user->isOwner()) {
            $this->assertOwnerActionAllowed($request);
            $this->assertNotLastOwner($user);
        }

        // permissions=null üyede etkin izinler yeni rolün preset'ine kayar —
        // preset de rolü değiştirenin izin alt kümesi olmalı
        $this->assertGrantableBy($request->user(), $user->permissions, $validated['role']);

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => __('api.role_updated'),
            'member'  => $this->memberPayload($user->fresh()),
        ]);
    }

    /**
     * POST /api/team/members/{user}/disable — üyeyi pasifleştir.
     */
    public function disableMember(Request $request, User $user): JsonResponse
    {
        $this->assertSameDealer($request, $user->dealer_id);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => __('api.cannot_deactivate_self'),
            ]);
        }

        if ($user->isOwner()) {
            $this->assertOwnerActionAllowed($request);
            $this->assertNotLastOwner($user);
        }

        $user->update(['status' => 'disabled']);

        return response()->json(['message' => __('api.member_deactivated')]);
    }

    /**
     * POST /api/team/members/{user}/enable — üyeyi tekrar aktifleştir.
     */
    public function enableMember(Request $request, User $user): JsonResponse
    {
        $this->assertSameDealer($request, $user->dealer_id);

        $user->update(['status' => 'active']);

        return response()->json(['message' => __('api.member_activated')]);
    }

    /**
     * DELETE /api/team/members/{user} — üyeyi sil.
     */
    public function destroyMember(Request $request, User $user): JsonResponse
    {
        $this->assertSameDealer($request, $user->dealer_id);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => __('api.cannot_delete_self'),
            ]);
        }

        if ($user->isOwner()) {
            $this->assertOwnerActionAllowed($request);
            $this->assertNotLastOwner($user);
        }

        $user->delete();

        return response()->json(['message' => __('api.member_deleted')]);
    }

    // ─── Yardımcılar ───────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    private function memberPayload(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'role'          => $user->role,
            'status'        => $user->status,
            'permissions'   => $user->permissions,
            'effective_permissions' => $user->effectivePermissions(),
            'last_login_at' => $user->last_login_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{permissions: array<int, array<string, string>>, presets: array<string, array<int, string>>}
     */
    private function catalog(): array
    {
        $permissions = collect(config('permissions.permissions'))
            ->map(fn ($meta, $key) => [
                'key'   => $key,
                'group' => $meta['group'],
                'label' => $meta['label'],
            ])
            ->values()
            ->all();

        return [
            'permissions' => $permissions,
            'presets'     => config('permissions.presets'),
        ];
    }

    /**
     * Davet eden yalnızca kendi sahip olduğu izinleri verebilir (owner hariç).
     * permissions=null → etkin izinler rol preset'inden gelir; preset de
     * davet edenin izin alt kümesi olmalı (privilege escalation engeli).
     *
     * @param array<int, string>|null $granted
     */
    private function assertGrantableBy(User $inviter, ?array $granted, ?string $role = null): void
    {
        if ($inviter->isOwner()) {
            return;
        }

        if ($granted === null) {
            $granted = $role !== null ? config("permissions.presets.{$role}", []) : [];
        }

        if ($granted === []) {
            return;
        }

        $inviterPerms = $inviter->effectivePermissions();
        $excess = array_diff($granted, $inviterPerms);

        if (! empty($excess)) {
            throw ValidationException::withMessages([
                'permissions' => __('api.cannot_grant_perms', ['permissions' => implode(', ', $excess)]),
            ]);
        }
    }

    private function assertOwnerActionAllowed(Request $request): void
    {
        if (! $request->user()->isOwner()) {
            abort(403, __('api.owner_only_action'));
        }
    }

    private function assertSameDealer(Request $request, int $dealerId): void
    {
        if ($request->user()->dealer_id !== $dealerId) {
            abort(403, __('api.no_resource_access'));
        }
    }

    private function assertNotLastOwner(User $user): void
    {
        $ownerCount = User::where('dealer_id', $user->dealer_id)
            ->where('role', 'owner')
            ->where('status', 'active')
            ->count();

        if ($ownerCount <= 1) {
            throw ValidationException::withMessages([
                'user' => __('api.last_owner_protected'),
            ]);
        }
    }

    private function sendInvitationMail(Invitation $invitation, string $token): void
    {
        Notification::route('mail', $invitation->email)
            ->notify(new TeamInvitationNotification(
                $invitation->load('dealer'),
                $this->acceptUrl($token, $invitation->locale),
            ));
    }

    private function acceptUrl(string $token, ?string $locale = null): string
    {
        $base = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $locale = $locale ?: app()->getLocale();

        // Frontend rotaları dil önekiyle çalışır (/tr/invite/..., /ar/invite/...).
        return "{$base}/{$locale}/invite/{$token}";
    }
}
