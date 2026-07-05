<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCrudTest extends TestCase
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

    public function test_can_list_customers(): void
    {
        Customer::factory()->count(3)->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/customers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'first_name', 'last_name', 'email'],
                ],
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_customers_scoped_to_dealer(): void
    {
        Customer::factory()->count(2)->create(['dealer_id' => $this->dealer->id]);
        Customer::factory()->count(3)->create(); // başka dealer

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/customers');

        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_search_customers(): void
    {
        Customer::factory()->create([
            'dealer_id' => $this->dealer->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'company' => 'Doe Watches',
        ]);
        Customer::factory()->create([
            'dealer_id' => $this->dealer->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'company' => 'Smith Timepieces',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/customers?search=John');

        $this->assertCount(1, $response->json('data'));
    }

    public function test_can_filter_customers_by_tag(): void
    {
        Customer::factory()->create([
            'dealer_id' => $this->dealer->id,
            'tags' => ['vip', 'collector'],
        ]);
        Customer::factory()->create([
            'dealer_id' => $this->dealer->id,
            'tags' => ['wholesale'],
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/customers?tag=vip');

        $this->assertCount(1, $response->json('data'));
    }

    // ─── STORE ──────────────────────────────────────────────

    public function test_can_create_customer(): void
    {
        $data = [
            'first_name' => 'Max',
            'last_name' => 'Müller',
            'email' => 'max@example.com',
            'phone' => '+49 123 456',
            'company' => 'Watch GmbH',
            'tags' => ['vip'],
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/customers', $data);

        $response->assertStatus(201)
            ->assertJsonPath('data.first_name', 'Max')
            ->assertJsonPath('data.last_name', 'Müller');

        $this->assertDatabaseHas('customers', [
            'dealer_id' => $this->dealer->id,
            'email' => 'max@example.com',
        ]);
    }

    public function test_create_customer_validation_fails(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/customers', [
                'email' => 'not-an-email',
                // first_name ve last_name eksik
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name']);
    }

    // ─── SHOW ──────────────────────────────────────────────

    public function test_can_show_customer(): void
    {
        $customer = Customer::factory()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $customer->id)
            ->assertJsonStructure([
                'data' => ['id', 'first_name', 'last_name', 'notes', 'invoices'],
            ]);
    }

    public function test_cannot_show_other_dealers_customer(): void
    {
        $otherCustomer = Customer::factory()->create();

        $this->withHeaders($this->authHeader())
            ->getJson("/api/customers/{$otherCustomer->id}")
            ->assertStatus(404);
    }

    // ─── UPDATE ──────────────────────────────────────────────

    public function test_can_update_customer(): void
    {
        $customer = Customer::factory()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/customers/{$customer->id}", [
                'first_name' => 'Updated',
                'last_name' => 'Name',
                'tags' => ['premium', 'collector'],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.first_name', 'Updated');
    }

    // ─── DESTROY ──────────────────────────────────────────────

    public function test_can_delete_customer(): void
    {
        $customer = Customer::factory()->create(['dealer_id' => $this->dealer->id]);

        $this->withHeaders($this->authHeader())
            ->deleteJson("/api/customers/{$customer->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    // ─── NOTES ──────────────────────────────────────────────

    public function test_can_add_note_to_customer(): void
    {
        $customer = Customer::factory()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/customers/{$customer->id}/notes", [
                'content' => 'VIP müşteri, özel fiyat uygula.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.content', 'VIP müşteri, özel fiyat uygula.');

        $this->assertDatabaseHas('customer_notes', [
            'customer_id' => $customer->id,
            'user_id' => $this->user->id,
        ]);
    }

    public function test_note_validation_fails(): void
    {
        $customer = Customer::factory()->create(['dealer_id' => $this->dealer->id]);

        $this->withHeaders($this->authHeader())
            ->postJson("/api/customers/{$customer->id}/notes", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['content']);
    }

    public function test_can_delete_note(): void
    {
        $customer = Customer::factory()->create(['dealer_id' => $this->dealer->id]);
        $note = $customer->notes()->create([
            'user_id' => $this->user->id,
            'content' => 'To be deleted',
        ]);

        $this->withHeaders($this->authHeader())
            ->deleteJson("/api/customers/{$customer->id}/notes/{$note->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('customer_notes', ['id' => $note->id]);
    }
}
