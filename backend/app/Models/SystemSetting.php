<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'updated_by',
    ];

    // ─── Helpers ───────────────────────────────────────────────

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember("system_setting:{$key}", 3600, function () use ($key) {
            return static::where('key', $key)->first();
        });

        if (! $setting) {
            return $default;
        }

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'number'  => is_numeric($setting->value) ? (float) $setting->value : $default,
            'json'    => json_decode($setting->value, true) ?? $default,
            default   => $setting->value,
        };
    }

    public static function setValue(string $key, mixed $value, string $type = 'string', ?int $updatedBy = null): void
    {
        $storedValue = match ($type) {
            'json'    => json_encode($value),
            'boolean' => $value ? 'true' : 'false',
            default   => (string) $value,
        };

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $storedValue, 'type' => $type, 'updated_by' => $updatedBy]
        );

        Cache::forget("system_setting:{$key}");
    }
}
