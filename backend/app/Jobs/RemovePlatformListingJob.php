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
 * Platform listing'ini kaldırır (eBay withdrawOffer / Shopify productDelete).
 */
class RemovePlatformListingJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [5, 30, 120];

    public function __construct(
        public readonly int $watchId,
        public readonly int $platformId,
        public readonly int $dealerId,
    ) {
        $this->onQueue('sync');
    }

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("remove_listing_{$this->watchId}_{$this->platformId}"))
                ->releaseAfter(30)
                ->expireAfter(180),
        ];
    }

    public function handle(InventoryLockService $lockService): void
    {
        $watch = Watch::with('images')->find($this->watchId);

        if (!$watch) {
            Log::warning('RemovePlatformListingJob: Watch not found', ['watch_id' => $this->watchId]);
            return;
        }

        try {
            $lockService->executeWithLock(
                "remove_listing_{$this->watchId}_{$this->platformId}",
                function () use ($watch) {
                    $this->removeListing($watch);
                },
                lockTtl: 30,
                blockFor: 10,
            );
        } catch (LockTimeoutException) {
            Log::warning('RemovePlatformListingJob: Lock timeout, will retry', [
                'watch_id' => $this->watchId,
                'attempt'  => $this->attempts(),
            ]);
            $this->release(10);
        }
    }

    private function removeListing(Watch $watch): void
    {
        $connection = PlatformConnection::where('platform_id', $this->platformId)
            ->where('dealer_id', $this->dealerId)
            ->connected()
            ->with('platform')
            ->first();

        if (!$connection) {
            Log::info('RemovePlatformListingJob: No active connection', [
                'watch_id'    => $watch->id,
                'platform_id' => $this->platformId,
            ]);
            return;
        }

        try {
            $platformName = strtolower($connection->platform->name ?? '');

            match (true) {
                str_contains($platformName, 'ebay') => app(EbayListingService::class)
                    ->withdrawOffer($watch, $connection),
                str_contains($platformName, 'shopify') => app(ShopifyService::class)
                    ->productDelete($watch, $connection),
                default => null,
            };

            Log::info('RemovePlatformListingJob: Listing removed', [
                'watch_id' => $watch->id,
                'platform' => $connection->platform->name,
            ]);
        } catch (\Throwable $e) {
            SyncLog::create([
                'watch_id'      => $this->watchId,
                'platform_id'   => $this->platformId,
                'status'        => 'failed',
                'error_message' => 'Listing removal failed: ' . $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('RemovePlatformListingJob: DEAD LETTER — Job failed permanently', [
            'watch_id'    => $this->watchId,
            'platform_id' => $this->platformId,
            'attempts'    => $this->attempts(),
            'error'       => $exception?->getMessage(),
        ]);

        SyncLog::create([
            'watch_id'      => $this->watchId,
            'platform_id'   => $this->platformId,
            'status'        => 'failed',
            'error_message' => "Listing removal permanently failed after {$this->tries} attempts: " . $exception?->getMessage(),
        ]);
    }
}
