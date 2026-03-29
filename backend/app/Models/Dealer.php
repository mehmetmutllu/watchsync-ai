<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Builder;

class Dealer extends Model
{
    protected $fillable = [
        'name',
        'company_name',
        'email',
        'phone',
        'tax_number',
        'status',
    ];

    // ─── Relationships ─────────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function watches(): HasMany
    {
        return $this->hasMany(Watch::class);
    }

    public function platformConnections(): HasMany
    {
        return $this->hasMany(PlatformConnection::class);
    }

    /**
     * Dealer'ın saatlerine ait tüm senkronizasyon logları.
     */
    public function syncLogs(): HasManyThrough
    {
        return $this->hasManyThrough(SyncLog::class, Watch::class);
    }

    // ─── Scopes ────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeSuspended(Builder $query): Builder
    {
        return $query->where('status', 'suspended');
    }
}
