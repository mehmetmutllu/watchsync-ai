<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use App\Models\Watch;
use App\Services\InventoryLockService;
use App\Services\InventoryStateMachine;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class InventoryLockTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;
    private User $user;
    private Watch $watch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealer = Dealer::factory()->create();
        $this->user   = User::factory()->create([
            'dealer_id' => $this->dealer->id,
            'role'      => 'owner',
        ]);
        $this->watch = Watch::create([
            'dealer_id' => $this->dealer->id,
            'brand'     => 'Rolex',
            'model'     => 'Submariner',
            'condition' => 'very_good',
            'status'    => 'active',
            'currency'  => 'EUR',
        ]);
    }

    public function test_redis_lock_prevents_concurrent_status_updates(): void
    {
        $lockService   = app(InventoryLockService::class);
        $stateMachine  = app(InventoryStateMachine::class);

        $successCount = 0;
        $failCount    = 0;
        $errors       = [];

        // İlk istek kilidi alır ve uzun süre tutar (simülasyon)
        $lockKey = "inventory_update_{$this->watch->id}";
        $lock    = Redis::lock($lockKey, 10);

        // Kilidi manuel al
        $acquired = $lock->get();
        $this->assertTrue($acquired, 'İlk kilit alınamadı');

        // İkinci işlem kilidi almaya çalışır → LockTimeoutException
        try {
            $lockService->executeWithLock(
                (string) $this->watch->id,
                function () use ($stateMachine) {
                    return $stateMachine->transition($this->watch->fresh(), 'reserved', $this->user->id);
                },
                lockTtl: 10,
                blockFor: 1, // Kısa bekleme
            );
            $successCount++;
        } catch (LockTimeoutException) {
            $failCount++;
        }

        // Kilidi serbest bırak
        $lock->release();

        $this->assertEquals(0, $successCount, 'Kilit varken hiçbir işlem başarılı olmamalı');
        $this->assertEquals(1, $failCount, 'Kilit varken işlem LockTimeoutException almalı');

        // Kilit serbest bırakıldıktan sonra işlem başarılı olmalı
        $result = $lockService->safeStatusTransition(
            $this->watch,
            'reserved',
            $stateMachine,
            $this->user->id,
            'Test reservation',
        );

        $this->assertEquals('reserved', $result->status);
    }

    public function test_only_one_of_concurrent_status_transitions_succeeds(): void
    {
        $lockService  = app(InventoryLockService::class);
        $stateMachine = app(InventoryStateMachine::class);

        $successCount = 0;
        $failCount    = 0;

        // 10 eşzamanlı istek simülasyonu
        // Sıralı olarak çalışır ama kısa block süresi ile timeout'u simüle eder
        $results = [];

        // İlk geçiş: active → reserved (bu başarılı olacak)
        try {
            $updated = $lockService->safeStatusTransition(
                $this->watch,
                'reserved',
                $stateMachine,
                $this->user->id,
                'Concurrent test #1',
            );
            $results[] = ['success', $updated->status];
            $successCount++;
        } catch (\Throwable $e) {
            $results[] = ['fail', $e->getMessage()];
            $failCount++;
        }

        // Sonraki 9 istek — saat artık "reserved" durumunda
        // active → reserved geçişi artık mümkün değil (çünkü saat reserved)
        for ($i = 2; $i <= 10; $i++) {
            try {
                $updated = $lockService->safeStatusTransition(
                    $this->watch,
                    'reserved',
                    $stateMachine,
                    $this->user->id,
                    "Concurrent test #{$i}",
                );
                $results[] = ['success', $updated->status];
                $successCount++;
            } catch (\Throwable $e) {
                $results[] = ['fail', $e->getMessage()];
                $failCount++;
            }
        }

        // Yalnızca 1 başarılı olmalı
        $this->assertEquals(1, $successCount, 'Yalnızca 1 eşzamanlı istek başarılı olmalı');
        $this->assertEquals(9, $failCount, '9 istek başarısız olmalı');

        // Veritabanında saat "reserved" durumunda olmalı
        $this->assertEquals('reserved', $this->watch->fresh()->status);
    }

    public function test_lock_released_after_successful_transition(): void
    {
        $lockService  = app(InventoryLockService::class);
        $stateMachine = app(InventoryStateMachine::class);

        // İlk geçiş
        $result = $lockService->safeStatusTransition(
            $this->watch,
            'reserved',
            $stateMachine,
            $this->user->id,
        );

        $this->assertEquals('reserved', $result->status);

        // İkinci geçiş de çalışabilmeli (kilit serbest kalmış olmalı)
        $result = $lockService->safeStatusTransition(
            $result,
            'sold',
            $stateMachine,
            $this->user->id,
        );

        $this->assertEquals('sold', $result->status);
    }

    public function test_api_returns_409_on_lock_timeout(): void
    {
        $token = $this->user->createToken('test')->plainTextToken;

        // Kilidi al (simülasyon)
        $lockKey = "inventory_update_{$this->watch->id}";
        $lock    = Redis::lock($lockKey, 30);
        $lock->get();

        // API çağrısı yap — 409 beklenir
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/watches/{$this->watch->id}/status", [
                'status' => 'reserved',
            ]);

        $response->assertStatus(409)
                 ->assertJson([
                     'message' => 'Bu saat şu anda başka bir işlem tarafından güncelleniyor. Lütfen tekrar deneyin.',
                 ]);

        $lock->release();
    }

    public function test_status_history_recorded_correctly(): void
    {
        $lockService  = app(InventoryLockService::class);
        $stateMachine = app(InventoryStateMachine::class);

        $lockService->safeStatusTransition(
            $this->watch,
            'reserved',
            $stateMachine,
            $this->user->id,
            'Lock test reservation',
        );

        $this->assertDatabaseHas('inventory_status_histories', [
            'watch_id'   => $this->watch->id,
            'user_id'    => $this->user->id,
            'old_status' => 'active',
            'new_status' => 'reserved',
            'notes'      => 'Lock test reservation',
        ]);
    }

    protected function tearDown(): void
    {
        // Testlerden kalan kilitleri temizle
        Redis::del("inventory_update_{$this->watch->id}");

        parent::tearDown();
    }
}
