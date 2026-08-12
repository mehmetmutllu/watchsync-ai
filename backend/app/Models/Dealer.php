<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Builder;

class Dealer extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'company_name',
        'email',
        'phone',
        'tax_number',
        'address_line1',
        'address_line2',
        'city',
        'postal_code',
        'country',
        'website',
        'notification_preferences',
        'status',
        'invitation_expiry_days',
        'stripe_customer_id',
        'stripe_subscription_id',
        'plan_type',
        'subscription_status',
        'current_period_end',
        'cancel_at_period_end',
        'trial_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'notification_preferences' => 'array',
            'current_period_end'       => 'datetime',
            'cancel_at_period_end'     => 'boolean',
            'trial_ends_at'            => 'datetime',
        ];
    }

    // ─── Relationships ─────────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function watches(): HasMany
    {
        return $this->hasMany(Watch::class);
    }

    public function platformConnections(): HasMany
    {
        return $this->hasMany(PlatformConnection::class);
    }

    /**
     * Dealer'ın saatlerine ait tüm senkronizasyon logları.
     */
    public function syncLogs(): HasManyThrough
    {
        return $this->hasManyThrough(SyncLog::class, Watch::class);
    }

    // ─── Scopes ────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeSuspended(Builder $query): Builder
    {
        return $query->where('status', 'suspended');
    }
}
