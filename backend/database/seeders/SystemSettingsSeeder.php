<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'site_name', 'value' => 'WatchSync AI', 'type' => 'string'],
            ['key' => 'site_description', 'value' => 'Saat envanter yönetimi ve platformlara senkronizasyon', 'type' => 'string'],
            ['key' => 'maintenance_mode', 'value' => '0', 'type' => 'boolean'],
            ['key' => 'registration_enabled', 'value' => '1', 'type' => 'boolean'],
            ['key' => 'email_verification_required', 'value' => '1', 'type' => 'boolean'],
            ['key' => 'max_watches_per_dealer', 'value' => '500', 'type' => 'number'],
            ['key' => 'ai_auto_process', 'value' => '1', 'type' => 'boolean'],
            ['key' => 'ai_confidence_threshold', 'value' => '0.8', 'type' => 'number'],
            ['key' => 'commission_rate', 'value' => '5', 'type' => 'number'],
            ['key' => 'support_email', 'value' => 'support@watchsync.ai', 'type' => 'string'],
            ['key' => 'default_currency', 'value' => 'EUR', 'type' => 'string'],
            ['key' => 'smtp_settings', 'value' => json_encode([
                'host'       => 'smtp.example.com',
                'port'       => 587,
                'encryption' => 'tls',
            ]), 'type' => 'json'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting,
            );
        }
    }
}
