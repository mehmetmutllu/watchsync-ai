<?php

namespace Tests\Unit;

use App\Models\Dealer;
use App\Models\User;
use App\Models\Watch;
use App\Services\InventoryStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class InventoryStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private InventoryStateMachine $stateMachine;
    private Dealer $dealer;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->stateMachine = new InventoryStateMachine();
        $this->dealer = Dealer::factory()->create();
        $this->user = User::factory()->create(['dealer_id' => $this->dealer->id]);
    }

    public function test_draft_can_transition_to_active(): void
    {
        $watch = Watch::factory()->draft()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'active');

        $this->assertEquals('active', $result->status);
    }

    public function test_active_can_transition_to_reserved(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'reserved');

        $this->assertEquals('reserved', $result->status);
    }

    public function test_active_can_transition_to_sold(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'sold');

        $this->assertEquals('sold', $result->status);
    }

    public function test_active_can_transition_to_maintenance(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'maintenance');

        $this->assertEquals('maintenance', $result->status);
    }

    public function test_reserved_can_transition_to_sold(): void
    {
        $watch = Watch::factory()->reserved()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'sold');

        $this->assertEquals('sold', $result->status);
    }

    public function test_reserved_can_transition_back_to_active(): void
    {
        $watch = Watch::factory()->reserved()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'active');

        $this->assertEquals('active', $result->status);
    }

    public function test_maintenance_can_transition_to_active(): void
    {
        $watch = Watch::factory()->maintenance()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'active');

        $this->assertEquals('active', $result->status);
    }

    public function test_sold_cannot_transition(): void
    {
        $watch = Watch::factory()->sold()->create(['dealer_id' => $this->dealer->id]);

        $this->expectException(ValidationException::class);

        $this->stateMachine->transition($watch, 'active');
    }

    public function test_draft_cannot_transition_to_sold(): void
    {
        $watch = Watch::factory()->draft()->create(['dealer_id' => $this->dealer->id]);

        $this->expectException(ValidationException::class);

        $this->stateMachine->transition($watch, 'sold');
    }

    public function test_same_status_returns_unchanged(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $result = $this->stateMachine->transition($watch, 'active');

        $this->assertEquals('active', $result->status);
    }

    public function test_transition_records_history(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $this->stateMachine->transition($watch, 'reserved', $this->user->id, 'Test transition');

        $this->assertDatabaseHas('inventory_status_histories', [
            'watch_id' => $watch->id,
            'old_status' => 'active',
            'new_status' => 'reserved',
            'notes' => 'Test transition',
        ]);
    }
}
