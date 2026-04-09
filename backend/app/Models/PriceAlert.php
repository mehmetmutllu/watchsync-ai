<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceAlert extends Model
{
    protected $fillable = [
        'user_id',
        'reference_number',
        'target_price',
        'direction',
        'is_active',
        'triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'target_price' => 'decimal:2',
            'is_active' => 'boolean',
            'triggered_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
