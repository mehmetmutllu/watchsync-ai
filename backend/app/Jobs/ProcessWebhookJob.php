<?php

namespace App\Jobs;

use App\Models\SyncLog;
use App\Models\Watch;
use App\Services\InventoryLockService;
use App\Services\InventoryStateMachine;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;

/**
 * Platformlardan gelen webhook'ları işler.
 * Sipariş geldiğinde stok kilitleme / satış işaretleme yapar.
 */
class ProcessWebhookJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [5, 30, 120];

    public function __construct(
        public readonly string $platform,
        public readonly string $eventType,
        public readonly array $payload,
    ) {
        $this->onQueue('webhooks');
    }

    public function middleware(): array
    {
        $watchId = $this->payload['watch_id'] ?? 'unknown';

        return [
            (new WithoutOverlapping("webhook_{$this->platform}_{$watchId}"))
                ->releaseAfter(30)
                ->expireAfter(180),
        ];
    }

    public function handle(
        InventoryLockService $lockService,
        InventoryStateMachine $stateMachine,
    ): void {
        Log::info("ProcessWebhookJob: Processing webhook", [
            'platform'   => $this->platform,
            'event_type' => $this->eventType,
            'payload'    => $this->payload,
        ]);

        match ($this->eventType) {
            'order.created'   => $this->handleOrderCreated($lockService, $stateMachine),
            'order.cancelled' => $this->handleOrderCancelled($lockService, $stateMachine),
            'stock.updated'   => $this->handleStockUpdated(),
            default           => Log::info("ProcessWebhookJob: Unknown event type", ['type' => $this->eventType]),
        };
    }

    /**
     * Sipariş oluşturulduğunda — saati reserved veya sold durumuna geçir.
     */
    private function handleOrderCreated(
        InventoryLockService $lockService,
        InventoryStateMachine $stateMachine,
    ): void {
        $watchId = $this->payload['watch_id'] ?? null;

        if (! $watchId) {
            Log::warning("ProcessWebhookJob: Missing watch_id in payload");
            return;
        }

        $watch = Watch::find($watchId);

        if (! $watch) {
            Log::warning("ProcessWebhookJob: Watch not found", ['watch_id' => $watchId]);
            return;
        }

        try {
            $lockService->safeStatusTransition(
                $watch,
                'reserved',
                $stateMachine,
                notes: "Auto-reserved via {$this->platform} webhook (order #{$this->payload['order_id'] ?? 'N/A'})",
            );

            Log::info("ProcessWebhookJob: Watch reserved via webhook", [
                'watch_id' => $watchId,
                'platform' => $this->platform,
            ]);

            // Diğer platformlardaki stoku 0'la
            $connections = $watch->dealer->platformConnections()
                ->where('status', 'active')
                ->get();

            foreach ($connections as $connection) {
                UpdatePlatformStockJob::dispatch(
                    $watchId,
                    $connection->platform_id,
                    0,
                    $watch->dealer_id,
                );
            }
        } catch (LockTimeoutException) {
            Log::warning("ProcessWebhookJob: Lock timeout on order.created, will retry", [
                'watch_id' => $watchId,
            ]);

            $this->release(10);
        }
    }

    /**
     * Sipariş iptal edildiğinde — saati tekrar active durumuna döndür.
     */
    private function handleOrderCancelled(
        InventoryLockService $lockService,
        InventoryStateMachine $stateMachine,
    ): void {
        $watchId = $this->payload['watch_id'] ?? null;

        if (! $watchId) {
            return;
        }

        $watch = Watch::find($watchId);

        if (! $watch || $watch->status !== 'reserved') {
            return;
        }

        try {
            $lockService->safeStatusTransition(
                $watch,
                'active',
                $stateMachine,
                notes: "Auto-reactivated via {$this->platform} webhook (order cancelled)",
            );

            // Platformlardaki stoku geri aç
            $connections = $watch->dealer->platformConnections()
                ->where('status', 'active')
                ->get();

            foreach ($connections as $connection) {
                UpdatePlatformStockJob::dispatch(
                    $watchId,
                    $connection->platform_id,
                    1,
                    $watch->dealer_id,
                );
            }
        } catch (LockTimeoutException) {
            $this->release(10);
        }
    }

    /**
     * Stok güncellemesi geldiğinde log kaydı oluştur.
     */
    private function handleStockUpdated(): void
    {
        Log::info("ProcessWebhookJob: Stock update received", [
            'platform' => $this->platform,
            'payload'  => $this->payload,
        ]);
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error("ProcessWebhookJob: DEAD LETTER — Webhook processing failed permanently", [
            'platform'   => $this->platform,
            'event_type' => $this->eventType,
            'payload'    => $this->payload,
            'attempts'   => $this->attempts(),
            'error'      => $exception?->getMessage(),
        ]);
    }
}
