<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────

    public function adminUsers(): HasMany
    {
        return $this->hasMany(AdminUser::class);
    }

    // ─── Helpers ───────────────────────────────────────────────

    public function hasPermission(string $permission): bool
    {
        // Super admin her şeye yetkili
        if ($this->slug === 'super_admin') {
            return true;
        }

        return in_array($permission, $this->permissions ?? [], true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->slug === 'super_admin';
    }

    public function isAdmin(): bool
    {
        return $this->slug === 'admin';
    }

    public function isModerator(): bool
    {
        return $this->slug === 'moderator';
    }
}
