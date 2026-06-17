<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'dealer_id',
        'name',
        'email',
        'password',
        'role',
        'notifications_read_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
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
            'notifications_read_at' => 'datetime',
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
}
