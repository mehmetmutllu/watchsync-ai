<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use App\Models\Watch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WatchCrudTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;
    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealer = Dealer::factory()->create();
        $this->user = User::factory()->create([
            'dealer_id' => $this->dealer->id,
            'role' => 'owner',
        ]);
        $this->token = $this->user->createToken('test')->plainTextToken;
    }

    private function authHeader(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    // ─── INDEX ──────────────────────────────────────────────

    public function test_can_list_watches(): void
    {
        Watch::factory()->count(3)->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'brand', 'model', 'status', 'sale_price'],
                ],
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_watches_scoped_to_dealer(): void
    {
        Watch::factory()->count(2)->create(['dealer_id' => $this->dealer->id]);
        Watch::factory()->count(3)->create(); // farklı dealer

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches');

        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_filter_watches_by_status(): void
    {
        Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);
        Watch::factory()->draft()->create(['dealer_id' => $this->dealer->id]);
        Watch::factory()->sold()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches?status=active');

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('active', $response->json('data.0.status'));
    }

    public function test_can_filter_watches_by_brand(): void
    {
        Watch::factory()->create(['dealer_id' => $this->dealer->id, 'brand' => 'Rolex']);
        Watch::factory()->create(['dealer_id' => $this->dealer->id, 'brand' => 'Omega']);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches?brand=Rolex');

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Rolex', $response->json('data.0.brand'));
    }

    public function test_can_search_watches(): void
    {
        Watch::factory()->create([
            'dealer_id' => $this->dealer->id,
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'reference_number' => '126610LN',
        ]);
        Watch::factory()->create([
            'dealer_id' => $this->dealer->id,
            'brand' => 'Omega',
            'model' => 'Speedmaster',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches?search=Submariner');

        $this->assertCount(1, $response->json('data'));
    }

    public function test_can_sort_watches(): void
    {
        Watch::factory()->create([
            'dealer_id' => $this->dealer->id,
            'sale_price' => 5000,
        ]);
        Watch::factory()->create([
            'dealer_id' => $this->dealer->id,
            'sale_price' => 15000,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches?sort_by=sale_price&sort_dir=asc');

        $data = $response->json('data');
        $this->assertTrue((float) $data[0]['sale_price'] <= (float) $data[1]['sale_price']);
    }

    public function test_pagination_works(): void
    {
        Watch::factory()->count(20)->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches?per_page=5');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(20, $response->json('total'));
    }

    public function test_unauthenticated_cannot_list_watches(): void
    {
        $this->getJson('/api/watches')->assertStatus(401);
    }

    // ─── STORE ──────────────────────────────────────────────

    public function test_can_create_watch(): void
    {
        $data = [
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'reference_number' => '126610LN',
            'year' => 2024,
            'condition' => 'new',
            'cost_price' => 10000,
            'sale_price' => 14000,
            'currency' => 'EUR',
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/watches', $data);

        $response->assertStatus(201)
            ->assertJsonPath('watch.brand', 'Rolex')
            ->assertJsonPath('watch.model', 'Submariner')
            ->assertJsonPath('watch.status', 'draft');

        $this->assertDatabaseHas('watches', [
            'dealer_id' => $this->dealer->id,
            'brand' => 'Rolex',
            'reference_number' => '126610LN',
        ]);
    }

    public function test_create_watch_validation_fails(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/watches', [
                'model' => 'Submariner',
                // brand ve condition eksik
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['brand', 'condition']);
    }

    public function test_create_watch_with_features(): void
    {
        $data = [
            'brand' => 'Omega',
            'model' => 'Speedmaster',
            'condition' => 'very_good',
            'features' => [
                'case_material' => 'Steel',
                'dial_color' => 'Black',
                'movement' => 'Automatic',
            ],
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/watches', $data);

        $response->assertStatus(201);
        $this->assertEquals('Steel', $response->json('watch.features.case_material'));
    }

    // ─── SHOW ──────────────────────────────────────────────

    public function test_can_show_watch(): void
    {
        $watch = Watch::factory()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/watches/{$watch->id}");

        $response->assertStatus(200)
            ->assertJsonPath('watch.id', $watch->id)
            ->assertJsonStructure([
                'watch' => ['id', 'brand', 'model', 'images', 'allowed_transitions'],
            ]);
    }

    public function test_cannot_show_other_dealers_watch(): void
    {
        $otherWatch = Watch::factory()->create(); // farklı dealer

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/watches/{$otherWatch->id}");

        $response->assertStatus(404);
    }

    // ─── UPDATE ──────────────────────────────────────────────

    public function test_can_update_watch(): void
    {
        $watch = Watch::factory()->create([
            'dealer_id' => $this->dealer->id,
            'sale_price' => 10000,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/watches/{$watch->id}", [
                'sale_price' => 12000,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('watch.sale_price', '12000.00');
    }

    public function test_cannot_update_other_dealers_watch(): void
    {
        $otherWatch = Watch::factory()->create();

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/watches/{$otherWatch->id}", [
                'sale_price' => 999,
            ]);

        $response->assertStatus(404);
    }

    // ─── DESTROY ──────────────────────────────────────────────

    public function test_can_delete_watch(): void
    {
        $watch = Watch::factory()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->deleteJson("/api/watches/{$watch->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('watches', ['id' => $watch->id]);
    }

    public function test_cannot_delete_other_dealers_watch(): void
    {
        $otherWatch = Watch::factory()->create();

        $this->withHeaders($this->authHeader())
            ->deleteJson("/api/watches/{$otherWatch->id}")
            ->assertStatus(404);
    }

    // ─── STATUS UPDATE ──────────────────────────────────────

    public function test_can_update_watch_status(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->patchJson("/api/watches/{$watch->id}/status", [
                'status' => 'reserved',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('watch.status', 'reserved');
    }

    public function test_invalid_status_transition_fails(): void
    {
        $watch = Watch::factory()->draft()->create(['dealer_id' => $this->dealer->id]);

        // draft → sold is not allowed (must go draft → active first)
        $response = $this->withHeaders($this->authHeader())
            ->patchJson("/api/watches/{$watch->id}/status", [
                'status' => 'sold',
            ]);

        $response->assertStatus(422);
    }

    public function test_status_history_is_recorded(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);

        $this->withHeaders($this->authHeader())
            ->patchJson("/api/watches/{$watch->id}/status", [
                'status' => 'reserved',
            ]);

        $this->assertDatabaseHas('inventory_status_histories', [
            'watch_id' => $watch->id,
            'old_status' => 'active',
            'new_status' => 'reserved',
        ]);
    }

    // ─── PRICE FILTER ──────────────────────────────────────

    public function test_can_filter_by_price_range(): void
    {
        Watch::factory()->create(['dealer_id' => $this->dealer->id, 'sale_price' => 5000]);
        Watch::factory()->create(['dealer_id' => $this->dealer->id, 'sale_price' => 15000]);
        Watch::factory()->create(['dealer_id' => $this->dealer->id, 'sale_price' => 25000]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/watches?min_price=10000&max_price=20000');

        $this->assertCount(1, $response->json('data'));
    }
}
