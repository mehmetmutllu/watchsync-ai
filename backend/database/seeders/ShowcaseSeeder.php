<?php

namespace Database\Seeders;

use App\Models\Dealer;
use App\Models\InventoryStatusHistory;
use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\User;
use App\Models\Watch;
use App\Models\WatchImage;
use Illuminate\Database\Seeder;

/**
 * Pazarlama/demoya yönelik zengin vitrin verisi: dolu envanter, bağlı
 * platformlar, yeşil senkron rozetleri ve canlı aktivite akışı.
 * Görseller storage/app/public/watches/demo + watches/thumbnails altındadır.
 * Idempotent: referans numarasına göre firstOrCreate kullanır.
 */
class ShowcaseSeeder extends Seeder
{
    public function run(): void
    {
        $dealer = Dealer::where('email', 'contact@watchsync.ai')->firstOrFail();
        $user   = User::where('email', 'demo@watchsync.ai')->firstOrFail();

        // ── Platform bağlantıları (rozetlerin "connected" görünmesi için) ──
        $platforms = Platform::all();
        foreach ($platforms as $platform) {
            PlatformConnection::firstOrCreate(
                ['dealer_id' => $dealer->id, 'platform_id' => $platform->id],
                ['status' => 'connected', 'last_synced_at' => now()->subMinutes(rand(2, 40))]
            );
        }

        // ── Saatler ──
        $watches = [
            ['Rolex', 'GMT-Master II', '126710BLNR', 2022, 'very_good', 'active', 14800, 17900, 'w-quarter.webp'],
            ['Rolex', 'Cosmograph Daytona', '116500LN', 2021, 'very_good', 'reserved', 24500, 28900, 'w-front.webp'],
            ['Omega', 'Speedmaster Moonwatch', '310.30.42.50.01.001', 2023, 'new', 'active', 5600, 6950, 'w-turn.webp'],
            ['Cartier', 'Santos de Cartier', 'WSSA0018', 2022, 'unworn', 'active', 6100, 7400, 'w-dial.webp'],
            ['IWC', 'Portugieser Chronograph', 'IW371605', 2020, 'very_good', 'active', 6300, 7800, 'w-angle.webp'],
            ['Jaeger-LeCoultre', 'Reverso Classic', 'Q3858520', 2019, 'good', 'sold', 5900, 7200, 'w-back.webp'],
            ['Tudor', 'Black Bay Fifty-Eight', 'M79030N-0001', 2022, 'unworn', 'sold', 2900, 3650, 'w-caseback2.webp'],
            ['Vacheron Constantin', 'Overseas', '4500V/110A-B128', 2021, 'very_good', 'active', 44000, 52500, 'w-bracelet.webp'],
            ['A. Lange & Söhne', 'Saxonia Thin', '211.088', 2018, 'very_good', 'reserved', 14200, 17500, 'w-open.webp'],
        ];

        $existingImages = [
            '126610LN'    => 'w-front.webp',
            '5711/1A-010' => 'w-angle.webp',
            '15500ST'     => 'w-quarter.webp',
        ];

        foreach ($watches as [$brand, $model, $ref, $year, $condition, $status, $cost, $sale, $img]) {
            $watch = Watch::firstOrCreate(
                ['dealer_id' => $dealer->id, 'reference_number' => $ref],
                [
                    'brand'      => $brand,
                    'model'      => $model,
                    'year'       => $year,
                    'condition'  => $condition,
                    'status'     => $status,
                    'cost_price' => $cost,
                    'sale_price' => $sale,
                    'currency'   => 'EUR',
                ]
            );
            $this->attachImage($watch, $img);
            $this->attachSyncState($watch, $platforms);

            InventoryStatusHistory::firstOrCreate(
                ['watch_id' => $watch->id, 'new_status' => $status],
                ['user_id' => $user->id, 'old_status' => 'draft', 'notes' => 'Showcase seed']
            );
        }

        // ── Mevcut 3 demo saate görsel + senkron durumu + EUR düzeltmesi ──
        foreach ($existingImages as $ref => $img) {
            $watch = Watch::where('dealer_id', $dealer->id)->where('reference_number', $ref)->first();
            if (!$watch) {
                continue;
            }
            if ($watch->currency !== 'EUR') {
                $watch->update(['currency' => 'EUR']);
            }
            $this->attachImage($watch, $img);
            $this->attachSyncState($watch, $platforms);
        }

        $this->command->info('Showcase data seeded.');
    }

    private function attachImage(Watch $watch, string $file): void
    {
        WatchImage::firstOrCreate(
            ['watch_id' => $watch->id, 'image_url' => "watches/demo/{$file}"],
            ['is_primary' => true, 'sort_order' => 0]
        );
    }

    private function attachSyncState(Watch $watch, $platforms): void
    {
        if (!in_array($watch->status, ['active', 'reserved', 'sold'], true)) {
            return;
        }
        foreach ($platforms as $platform) {
            $exists = SyncLog::where('watch_id', $watch->id)
                ->where('platform_id', $platform->id)
                ->exists();
            if (!$exists) {
                SyncLog::create([
                    'watch_id'    => $watch->id,
                    'platform_id' => $platform->id,
                    'status'      => 'success',
                ]);
            }
        }
    }
}
