<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Customer extends Model
{
    use HasFactory, Notifiable;
    protected $fillable = [
        'dealer_id',
        'pipeline_stage',
        'first_name',
        'last_name',
        'birth_date',
        'auto_send_birthday_mail',
        'email',
        'phone',
        'company',
        'address',
        'city',
        'country',
        'postal_code',
        'tags',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'auto_send_birthday_mail' => 'boolean',
            'tags' => 'array',
            'metadata' => 'array',
        ];
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CustomerNote::class)->latest();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->latest();
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
