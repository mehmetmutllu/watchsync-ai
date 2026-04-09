<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceHistory extends Model
{
    protected $fillable = [
        'reference_number',
        'source',
        'price',
        'currency',
        'condition',
        'seller',
        'url',
        'country',
        'scraped_date',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'scraped_date' => 'date',
        ];
    }
}
