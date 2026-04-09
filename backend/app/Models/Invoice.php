<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'dealer_id',
        'customer_id',
        'invoice_number',
        'status',
        'issue_date',
        'due_date',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
        'currency',
        'notes',
        'company_name',
        'company_address',
        'tax_id',
    ];

    protected function casts(): array
    {
        return [
            'issue_date'  => 'date',
            'due_date'    => 'date',
            'subtotal'    => 'decimal:2',
            'tax_rate'    => 'decimal:2',
            'tax_amount'  => 'decimal:2',
            'total'       => 'decimal:2',
        ];
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function recalculate(): void
    {
        $subtotal = $this->items()->sum('total');
        $taxAmount = round($subtotal * ($this->tax_rate / 100), 2);

        $this->update([
            'subtotal'   => $subtotal,
            'tax_amount' => $taxAmount,
            'total'      => $subtotal + $taxAmount,
        ]);
    }
}
