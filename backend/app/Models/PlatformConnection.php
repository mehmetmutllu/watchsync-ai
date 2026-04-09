<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PlatformConnection extends Model
{
    protected $fillable = [
        'dealer_id',
        'platform_id',
        'api_key',
        'api_secret',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'settings',
        'status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'api_key'          => 'encrypted',
            'api_secret'       => 'encrypted',
            'access_token'     => 'encrypted',
            'refresh_token'    => 'encrypted',
            'token_expires_at' => 'datetime',
            'settings'         => 'array',
            'last_synced_at'   => 'datetime',
        ];
    }

    /**
     * Token süresi dolmuş mu?
     */
    public function isTokenExpired(): bool
    {
        if (!$this->token_expires_at) {
            return true;
        }

        return $this->token_expires_at->isPast();
    }

    /**
     * Token yakında (15 dk içinde) dolacak mı?
     */
    public function isTokenExpiringSoon(): bool
    {
        if (!$this->token_expires_at) {
            return true;
        }

        return $this->token_expires_at->subMinutes(15)->isPast();
    }

    // ─── Relationships ─────────────────────────────────────────

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    // ─── Scopes ────────────────────────────────────────────────

    public function scopeConnected(Builder $query): Builder
    {
        return $query->where('status', 'connected');
    }

    public function scopeDisconnected(Builder $query): Builder
    {
        return $query->where('status', 'disconnected');
    }
}
