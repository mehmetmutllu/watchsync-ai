<?php

namespace App\Jobs;

use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\Watch;
use App\Services\EbayListingService;
use App\Services\InventoryLockService;
use App\Services\ShopifyService;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;

/**
 * Belirli bir platformdaki stok bilgisini günceller.
 * Saat satıldığında diğer platformlardaki stoku 0'lar.
 */
class UpdatePlatformStockJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [5, 30, 120];

    public function __construct(
        public readonly int $watchId,
        public readonly int $platformId,
        public readonly int $quantity,
        public readonly int $dealerId,
    ) {
        $this->onQueue('platform-stock');
    }

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("platform_stock_{$this->watchId}_{$this->platformId}"))
                ->releaseAfter(30)
                ->expireAfter(180),
        ];
    }

    public function handle(InventoryLockService $lockService): void
    {
        $watch = Watch::find($this->watchId);

        if (! $watch) {
            Log::warning("UpdatePlatformStockJob: Watch not found", ['watch_id' => $this->watchId]);
            return;
        }

        try {
            $lockService->executeWithLock(
                "platform_stock_{$this->watchId}_{$this->platformId}",
                function () use ($watch) {
                    $this->updateStock($watch);
                },
                lockTtl: 15,
                blockFor: 5,
            );
        } catch (LockTimeoutException) {
            Log::warning("UpdatePlatformStockJob: Lock timeout, will retry", [
                'watch_id'    => $this->watchId,
                'platform_id' => $this->platformId,
                'attempt'     => $this->attempts(),
            ]);

            $this->release(10);
        }
    }

    private function updateStock(Watch $watch): void
    {
        try {
            $connection = PlatformConnection::where('platform_id', $this->platformId)
                ->where('dealer_id', $this->dealerId)
                ->connected()
                ->with('platform')
                ->first();

            if (!$connection) {
                Log::info("UpdatePlatformStockJob: No active connection", [
                    'watch_id'    => $watch->id,
                    'platform_id' => $this->platformId,
                ]);
                return;
            }

            $platformName = strtolower($connection->platform->name ?? '');

            match (true) {
                str_contains($platformName, 'ebay') => app(EbayListingService::class)
                    ->updateInventoryQuantity($watch, $connection, $this->quantity),
                str_contains($platformName, 'shopify') => $this->updateShopifyStock($watch, $connection),
                default => null,
            };

            Log::info("UpdatePlatformStockJob: Stock updated", [
                'watch_id'    => $watch->id,
                'platform'    => $connection->platform->name,
                'quantity'    => $this->quantity,
            ]);

            SyncLog::create([
                'watch_id'      => $this->watchId,
                'platform_id'   => $this->platformId,
                'status'        => 'success',
                'error_message' => null,
            ]);
        } catch (\Throwable $e) {
            SyncLog::create([
                'watch_id'      => $this->watchId,
                'platform_id'   => $this->platformId,
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function updateShopifyStock(Watch $watch, PlatformConnection $connection): void
    {
        $shopifyService = app(ShopifyService::class);
        // Delta: mevcut stoktan hedefe ulaşmak için
        // quantity=0 → stok sıfırla (-1), quantity=1 → stok geri aç (+1)
        $delta = $this->quantity === 0 ? -1 : 1;
        $inventoryItemId = $connection->settings['inventory_item_id_' . $watch->id] ?? '';

        if ($inventoryItemId) {
            $shopifyService->inventoryAdjustQuantities($connection, $inventoryItemId, $delta, $watch);
        }
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error("UpdatePlatformStockJob: DEAD LETTER — Job failed permanently", [
            'watch_id'    => $this->watchId,
            'platform_id' => $this->platformId,
            'quantity'    => $this->quantity,
            'attempts'    => $this->attempts(),
            'error'       => $exception?->getMessage(),
        ]);

        SyncLog::create([
            'watch_id'      => $this->watchId,
            'platform_id'   => $this->platformId,
            'status'        => 'failed',
            'error_message' => "Job permanently failed after {$this->tries} attempts: " . $exception?->getMessage(),
        ]);
    }
}
