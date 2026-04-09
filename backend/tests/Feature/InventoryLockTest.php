<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use App\Models\Watch;
use App\Services\InventoryLockService;
use App\Services\InventoryStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    public function test_cache_lock_prevents_concurrent_access(): void
    {
        $lockKey = "inventory_update_{$this->watch->id}";
        $lock    = Cache::lock($lockKey, 10);

        $this->assertTrue($lock->get(), 'İlk kilit alınabilmeli');

        // İkinci kilit alınamaz
        $secondLock = Cache::lock($lockKey, 10);
        $this->assertFalse($secondLock->get(), 'İkinci kilit alınamamalı');

        // Serbest bırakınca tekrar alınabilmeli
        $lock->release();

        $thirdLock = Cache::lock($lockKey, 10);
        $this->assertTrue($thirdLock->get(), 'Kilit serbest bırakıldıktan sonra alınabilmeli');
        $thirdLock->release();
    }

    public function test_lock_released_after_successful_transition(): void
    {
        $stateMachine = app(InventoryStateMachine::class);

        // İlk geçiş
        $result = $stateMachine->transition($this->watch, 'reserved', $this->user->id);
        $this->assertEquals('reserved', $result->status);

        // İkinci geçiş de çalışabilmeli
        $result = $stateMachine->transition($result, 'sold', $this->user->id);
        $this->assertEquals('sold', $result->status);
    }

    public function test_only_valid_state_transitions_succeed(): void
    {
        $stateMachine = app(InventoryStateMachine::class);

        // İlk geçiş başarılı: active → reserved
        $result = $stateMachine->transition($this->watch, 'reserved', $this->user->id);
        $this->assertEquals('reserved', $result->status);

        // Geçersiz geçiş: reserved → maintenance (izin verilmiyor)
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $stateMachine->transition($this->watch->fresh(), 'maintenance', $this->user->id);
    }

    public function test_status_history_recorded_correctly(): void
    {
        $stateMachine = app(InventoryStateMachine::class);

        $stateMachine->transition(
            $this->watch,
            'reserved',
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

    public function test_status_api_requires_valid_status(): void
    {
        $token = $this->user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/watches/{$this->watch->id}/status", [
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422);
    }
}
