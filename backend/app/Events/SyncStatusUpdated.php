<?php

namespace App\Events;

use App\Models\SyncLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SyncStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $dealerId,
        public readonly array $activity,
    ) {}

    /**
     * Yayınlanacak kanal.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("dealer.{$this->dealerId}"),
        ];
    }

    /**
     * Event adı.
     */
    public function broadcastAs(): string
    {
        return 'sync.status.updated';
    }

    /**
     * Yayınlanacak veri.
     */
    public function broadcastWith(): array
    {
        return $this->activity;
    }

    /**
     * SyncLog'dan activity array oluşturan yardımcı metod.
     */
    public static function fromSyncLog(SyncLog $syncLog): self
    {
        $syncLog->load(['watch', 'platform']);

        $watch    = $syncLog->watch;
        $platform = $syncLog->platform;

        $message = match ($syncLog->status) {
            'success' => "{$watch->brand} {$watch->model}" . ($watch->reference_number ? " ({$watch->reference_number})" : '') . " → {$platform->name} synced",
            'failed'  => "{$watch->brand} {$watch->model}" . ($watch->reference_number ? " ({$watch->reference_number})" : '') . " → {$platform->name} sync failed",
            'pending' => "{$watch->brand} {$watch->model}" . ($watch->reference_number ? " ({$watch->reference_number})" : '') . " → {$platform->name} sync pending",
            default   => "{$watch->brand} {$watch->model} sync status updated",
        };

        return new self(
            dealerId: $watch->dealer_id,
            activity: [
                'id'        => $syncLog->id,
                'message'   => $message,
                'status'    => $syncLog->status,
                'time'      => $syncLog->created_at->diffForHumans(),
                'timestamp' => $syncLog->created_at->toISOString(),
            ],
        );
    }
}
