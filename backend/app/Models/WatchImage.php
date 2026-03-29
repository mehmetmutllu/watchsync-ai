<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchImage extends Model
{
    protected $fillable = [
        'watch_id',
        'image_url',
        'is_primary',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────

    public function watch(): BelongsTo
    {
        return $this->belongsTo(Watch::class);
    }
}
