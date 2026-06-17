<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Dealer;
use App\Models\WatchImage;
use App\Models\SyncLog;
use App\Models\InventoryStatusHistory;

class Watch extends Model
{
    use HasFactory;
    protected $fillable = [
        'dealer_id',
        'brand',
        'model',
        'reference_number',
        'year',
        'condition',
        'status',
        'cost_price',
        'sale_price',
        'currency',
        'features',
        'description',
        'ebay_listing_id',
        'ebay_offer_id',
        'shopify_product_id',
        'shopify_variant_id',
        'validation_status',
        'validation_details',
    ];

    /**
     * Attribute casting — JSONB sütunlar ve fiyat alanları.
     */
    protected function casts(): array
    {
        return [
            'features'           => 'array',
            'validation_details' => 'array',
            'cost_price'         => 'decimal:2',
            'sale_price'         => 'decimal:2',
            'year'               => 'integer',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(WatchImage::class)->orderBy('sort_order');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SyncLog::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(InventoryStatusHistory::class);
    }

    // ─── Accessors ─────────────────────────────────────────────

    /**
     * Tam saat adı: "Rolex Submariner (126610LN)"
     */
    public function getFullNameAttribute(): string
    {
        $name = "{$this->brand} {$this->model}";

        if ($this->reference_number) {
            $name .= " ({$this->reference_number})";
        }

        return $name;
    }

    /**
     * Formatlanmış satış fiyatı: "€12,500.00"
     */
    public function getFormattedPriceAttribute(): string
    {
        $symbols = ['EUR' => '€', 'USD' => '$', 'GBP' => '£', 'TRY' => '₺', 'CHF' => 'CHF '];
        $symbol  = $symbols[$this->currency] ?? $this->currency . ' ';

        return $symbol . number_format((float) $this->sale_price, 2, '.', ',');
    }

    // ─── Scopes ────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeSold(Builder $query): Builder
    {
        return $query->where('status', 'sold');
    }

    public function scopeByBrand(Builder $query, string $brand): Builder
    {
        return $query->where('brand', $brand);
    }

    public function scopeByDealer(Builder $query, int $dealerId): Builder
    {
        return $query->where('dealer_id', $dealerId);
    }

    public function scopePriceRange(Builder $query, ?float $min = null, ?float $max = null): Builder
    {
        if ($min !== null) {
            $query->where('sale_price', '>=', $min);
        }

        if ($max !== null) {
            $query->where('sale_price', '<=', $max);
        }

        return $query;
    }

    public function scopeByCondition(Builder $query, string $condition): Builder
    {
        return $query->where('condition', $condition);
    }
}
