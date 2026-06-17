<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminUser extends Model
{
    protected $fillable = [
        'user_id',
        'role_id',
        'is_active',
        'last_login_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active'     => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(AdminActivityLog::class);
    }

    // ─── Helpers ───────────────────────────────────────────────

    public function hasPermission(string $permission): bool
    {
        return $this->role->hasPermission($permission);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role->isSuperAdmin();
    }

    public function isAdmin(): bool
    {
        return $this->role->isAdmin();
    }

    public function isModerator(): bool
    {
        return $this->role->isModerator();
    }
}
