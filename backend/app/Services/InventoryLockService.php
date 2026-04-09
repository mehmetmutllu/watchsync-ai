<?php

namespace App\Services;

use App\Models\Watch;
use Illuminate\Cache\Lock;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class InventoryLockService
{
    /**
     * Redis Mutex ile envanter güncellemesi yapar.
     * Çifte satış (double-sell) senaryosunu önler.
     *
     * @param  string   $sku       Kilit anahtarı (SKU veya watch ID)
     * @param  int      $lockTtl   Kilit süresi (saniye)
     * @param  int      $blockFor  Maksimum bekleme süresi (saniye)
     * @param  callable $callback  Kilit içinde çalışacak işlem
     * @return mixed               Callback'in dönüş değeri
     *
     * @throws LockTimeoutException
     */
    public function executeWithLock(string $sku, callable $callback, int $lockTtl = 10, int $blockFor = 5): mixed
    {
        $lockKey = "inventory_update_{$sku}";

        /** @var Lock $lock */
        $lock = Redis::lock($lockKey, $lockTtl);

        try {
            return $lock->block($blockFor, $callback);
        } catch (LockTimeoutException $e) {
            Log::warning("InventoryLockService: Lock timeout for SKU={$sku}", [
                'lock_key'  => $lockKey,
                'lock_ttl'  => $lockTtl,
                'block_for' => $blockFor,
            ]);

            throw $e;
        }
    }

    /**
     * Durum geçişini Redis kilidi ile güvenli şekilde yapar.
     *
     * @throws LockTimeoutException
     */
    public function safeStatusTransition(
        Watch $watch,
        string $newStatus,
        InventoryStateMachine $stateMachine,
        ?int $userId = null,
        ?string $notes = null,
    ): Watch {
        return $this->executeWithLock(
            (string) $watch->id,
            function () use ($watch, $newStatus, $stateMachine, $userId, $notes) {
                // Kilidi aldıktan sonra veritabanından en güncel durumu oku
                $freshWatch = $watch->fresh();

                return $stateMachine->transition($freshWatch, $newStatus, $userId, $notes);
            },
        );
    }
}
