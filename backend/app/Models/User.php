<?php

namespace App\Models;

use Illuminate\Contracts\Translation\HasLocalePreference;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements HasLocalePreference, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'dealer_id',
        'name',
        'email',
        'locale',
        'password',
        'role',
        'status',
        'permissions',
        'invited_by',
        'invited_at',
        'last_login_at',
        'notifications_read_at',
        'accepted_terms_at',
        'accepted_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Serileştirmede eklenecek türetilmiş alanlar.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'effective_permissions',
    ];

    /**
     * Attribute casting.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'     => 'datetime',
            'password'              => 'hashed',
            'permissions'           => 'array',
            'invited_at'            => 'datetime',
            'last_login_at'         => 'datetime',
            'notifications_read_at' => 'datetime',
            'accepted_terms_at'     => 'datetime',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    public function adminUser(): HasOne
    {
        return $this->hasOne(AdminUser::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    // ─── Helpers ───────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->adminUser !== null && $this->adminUser->is_active;
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    // ─── Status ────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isDisabled(): bool
    {
        return $this->status === 'disabled';
    }

    public function isInvited(): bool
    {
        return $this->status === 'invited';
    }

    // ─── Permissions ───────────────────────────────────────────

    /**
     * Kullanıcının etkin izin listesi.
     * owner → tüm izinler; explicit permissions varsa onlar; yoksa rol preset'i.
     *
     * @return array<int, string>
     */
    public function effectivePermissions(): array
    {
        if ($this->isOwner()) {
            return array_keys(config('permissions.permissions'));
        }

        if (is_array($this->permissions)) {
            return $this->permissions;
        }

        return config("permissions.presets.{$this->role}", []);
    }

    /**
     * Kullanıcı belirtilen izne sahip mi? owner her zaman true.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isOwner()) {
            return true;
        }

        return in_array($permission, $this->effectivePermissions(), true);
    }

    public function canManageTeam(): bool
    {
        return $this->isOwner() || $this->hasPermission('team.manage');
    }

    /**
     * Accessor: serileştirmede `effective_permissions` alanı olarak görünür.
     *
     * @return array<int, string>
     */
    public function getEffectivePermissionsAttribute(): array
    {
        return $this->effectivePermissions();
    }

    /**
     * Bildirimler bu kullanıcının kendi dilinde gönderilir.
     * Tercih kayıtlı değilse uygulamanın varsayılan dili kullanılır.
     */
    public function preferredLocale(): string
    {
        return $this->locale ?: config('app.locale', 'en');
    }
}
