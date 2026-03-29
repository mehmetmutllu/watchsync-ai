<?php

namespace Database\Seeders;

use App\Models\Platform;
use Illuminate\Database\Seeder;

class PlatformSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $platforms = [
            ['name' => 'eBay', 'api_url' => 'https://api.ebay.com'],
            ['name' => 'Chrono24', 'api_url' => 'https://api.chrono24.com'],
            ['name' => 'Shopify', 'api_url' => 'https://<shop-name>.myshopify.com'],
        ];

        foreach ($platforms as $platform) {
            Platform::updateOrCreate(['name' => $platform['name']], $platform);
        }
    }
}
