<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Platform extends Model
{
    protected $fillable = [
        'name',
        'api_url',
    ];

    // ─── Relationships ─────────────────────────────────────────

    public function connections(): HasMany
    {
        return $this->hasMany(PlatformConnection::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SyncLog::class);
    }

    /**
     * Bu platforma bağlı dealer'lar (platform_connections pivot).
     */
    public function dealers(): BelongsToMany
    {
        return $this->belongsToMany(Dealer::class, 'platform_connections')
                    ->withPivot('status', 'last_synced_at')
                    ->withTimestamps();
    }
}
