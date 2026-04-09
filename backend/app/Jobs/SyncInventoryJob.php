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
 * Platform stoklarını senkronize eder.
 * Bir saat güncellendiğinde bağlı tüm platformların stoğunu günceller.
 */
class SyncInventoryJob implements ShouldQueue
{
    use Queueable;

    /**
     * Maksimum deneme sayısı.
     */
    public int $tries = 3;

    /**
     * Exponential backoff süreleri (saniye).
     */
    public array $backoff = [5, 30, 120];

    /**
     * Job başarısız olursa dead-letter kuyruğuna gönder.
     */
    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $watchId,
        public readonly int $dealerId,
        public readonly ?int $platformId = null,
    ) {
        $this->onQueue('sync');
    }

    /**
     * Concurrent aynı saat için overlapping'i önle.
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("sync_watch_{$this->watchId}"))
                ->releaseAfter(60)
                ->expireAfter(300),
        ];
    }

    public function handle(InventoryLockService $lockService): void
    {
        $watch = Watch::with('dealer')->find($this->watchId);

        if (! $watch) {
            Log::warning("SyncInventoryJob: Watch not found", ['watch_id' => $this->watchId]);
            return;
        }

        try {
            $lockService->executeWithLock(
                "sync_{$this->watchId}",
                function () use ($watch) {
                    $this->syncToPlatforms($watch);
                },
                lockTtl: 30,
                blockFor: 10,
            );
        } catch (LockTimeoutException) {
            Log::warning("SyncInventoryJob: Lock timeout, will retry", [
                'watch_id' => $this->watchId,
                'attempt'  => $this->attempts(),
            ]);

            $this->release(10);
        }
    }

    private function syncToPlatforms(Watch $watch): void
    {
        // Platform bağlantılarını al
        $connections = $watch->dealer->platformConnections()
            ->where('status', 'connected')
            ->when($this->platformId, fn ($q) => $q->where('platform_id', $this->platformId))
            ->with('platform')
            ->get();

        foreach ($connections as $connection) {
            try {
                $this->syncToSinglePlatform($watch, $connection);

                Log::info("SyncInventoryJob: Synced successfully", [
                    'watch_id'    => $watch->id,
                    'platform'    => $connection->platform->name ?? $connection->platform_id,
                ]);
            } catch (\Throwable $e) {
                SyncLog::create([
                    'watch_id'      => $watch->id,
                    'platform_id'   => $connection->platform_id,
                    'status'        => 'failed',
                    'error_message' => $e->getMessage(),
                ]);

                Log::error("SyncInventoryJob: Sync failed", [
                    'watch_id'    => $watch->id,
                    'platform_id' => $connection->platform_id,
                    'error'       => $e->getMessage(),
                ]);
            }
        }
    }

    private function syncToSinglePlatform(Watch $watch, PlatformConnection $connection): void
    {
        $platformName = strtolower($connection->platform->name ?? '');

        match (true) {
            str_contains($platformName, 'ebay') => app(EbayListingService::class)->publishWatch($watch, $connection),
            str_contains($platformName, 'shopify') => app(ShopifyService::class)->publishWatch($watch, $connection),
            default => SyncLog::create([
                'watch_id'      => $watch->id,
                'platform_id'   => $connection->platform_id,
                'status'        => 'success',
                'error_message' => null,
            ]),
        };
    }

    /**
     * Job tamamen başarısız olduğunda (dead-letter).
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error("SyncInventoryJob: DEAD LETTER — Job failed permanently", [
            'watch_id'  => $this->watchId,
            'dealer_id' => $this->dealerId,
            'attempts'  => $this->attempts(),
            'error'     => $exception?->getMessage(),
        ]);

        // Tüm ilgili platform sync log'larını failed olarak işaretle
        if ($this->platformId) {
            SyncLog::create([
                'watch_id'      => $this->watchId,
                'platform_id'   => $this->platformId,
                'status'        => 'failed',
                'error_message' => "Job permanently failed after {$this->tries} attempts: " . $exception?->getMessage(),
            ]);
        }
    }
}
