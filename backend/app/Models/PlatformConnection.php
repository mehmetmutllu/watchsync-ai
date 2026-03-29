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
        'status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'api_key'        => 'encrypted',
            'api_secret'     => 'encrypted',
            'access_token'   => 'encrypted',
            'last_synced_at' => 'datetime',
        ];
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
