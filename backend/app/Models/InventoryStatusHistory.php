<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class InventoryStatusHistory extends Model
{
    protected $fillable = [
        'watch_id',
        'user_id',
        'old_status',
        'new_status',
        'notes',
    ];

    // ─── Relationships ─────────────────────────────────────────

    public function watch(): BelongsTo
    {
        return $this->belongsTo(Watch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ────────────────────────────────────────────────

    public function scopeForWatch(Builder $query, int $watchId): Builder
    {
        return $query->where('watch_id', $watchId);
    }
}
