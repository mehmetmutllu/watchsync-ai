<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Dealer;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Watch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;
    private User $user;
    private string $token;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealer = Dealer::factory()->create();
        $this->user = User::factory()->create([
            'dealer_id' => $this->dealer->id,
            'role' => 'owner',
        ]);
        $this->token = $this->user->createToken('test')->plainTextToken;
        $this->customer = Customer::factory()->create([
            'dealer_id' => $this->dealer->id,
            'email' => 'customer@test.com',
        ]);
    }

    private function authHeader(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    // ─── INDEX ──────────────────────────────────────────────

    public function test_can_list_invoices(): void
    {
        Invoice::factory()->count(3)->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/invoices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'invoice_number', 'status', 'total'],
                ],
            ]);
    }

    public function test_can_filter_invoices_by_status(): void
    {
        Invoice::factory()->create(['dealer_id' => $this->dealer->id, 'status' => 'draft']);
        Invoice::factory()->sent()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/invoices?status=draft');

        $this->assertCount(1, $response->json('data'));
    }

    // ─── STORE ──────────────────────────────────────────────

    public function test_can_create_invoice(): void
    {
        $watch = Watch::factory()->create(['dealer_id' => $this->dealer->id]);

        $data = [
            'customer_id' => $this->customer->id,
            'issue_date' => '2026-04-10',
            'due_date' => '2026-05-10',
            'tax_rate' => 19,
            'items' => [
                [
                    'watch_id' => $watch->id,
                    'description' => 'Rolex Submariner 126610LN',
                    'quantity' => 1,
                    'unit_price' => 14000,
                ],
            ],
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/invoices', $data);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonStructure([
                'data' => ['id', 'invoice_number', 'items', 'subtotal', 'tax_amount', 'total'],
            ]);

        // Verify totals
        $invoice = $response->json('data');
        $this->assertEquals('14000.00', $invoice['subtotal']);
        $this->assertEquals('2660.00', $invoice['tax_amount']); // 14000 * 0.19
        $this->assertEquals('16660.00', $invoice['total']);
    }

    public function test_invoice_number_auto_generated(): void
    {
        $data = [
            'customer_id' => $this->customer->id,
            'issue_date' => '2026-04-10',
            'items' => [
                ['description' => 'Test item', 'quantity' => 1, 'unit_price' => 1000],
            ],
        ];

        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/invoices', $data);

        $response->assertStatus(201);
        $invoiceNumber = $response->json('data.invoice_number');
        $this->assertStringStartsWith('INV-2026-', $invoiceNumber);
    }

    public function test_create_invoice_validation_fails(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/invoices', [
                // issue_date ve items eksik
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['issue_date', 'items']);
    }

    public function test_invoice_items_validation(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/invoices', [
                'issue_date' => '2026-04-10',
                'items' => [
                    ['description' => 'Test'], // unit_price eksik
                ],
            ]);

        $response->assertStatus(422);
    }

    // ─── SHOW ──────────────────────────────────────────────

    public function test_can_show_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'dealer_id' => $this->dealer->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/invoices/{$invoice->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $invoice->id);
    }

    // ─── UPDATE ──────────────────────────────────────────────

    public function test_can_update_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'dealer_id' => $this->dealer->id,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/invoices/{$invoice->id}", [
                'notes' => 'Updated notes',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.notes', 'Updated notes');
    }

    public function test_cannot_update_sent_invoice(): void
    {
        $invoice = Invoice::factory()->sent()->create([
            'dealer_id' => $this->dealer->id,
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->putJson("/api/invoices/{$invoice->id}", [
                'notes' => 'Should fail',
            ]);

        $response->assertStatus(404); // findOrFail with where('status', 'draft')
    }

    // ─── DESTROY ──────────────────────────────────────────────

    public function test_can_delete_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'dealer_id' => $this->dealer->id,
            'status' => 'draft',
        ]);

        $this->withHeaders($this->authHeader())
            ->deleteJson("/api/invoices/{$invoice->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
    }

    public function test_cannot_delete_sent_invoice(): void
    {
        $invoice = Invoice::factory()->sent()->create([
            'dealer_id' => $this->dealer->id,
        ]);

        $this->withHeaders($this->authHeader())
            ->deleteJson("/api/invoices/{$invoice->id}")
            ->assertStatus(404);
    }

    // ─── SEND ──────────────────────────────────────────────

    public function test_can_send_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'dealer_id' => $this->dealer->id,
            'customer_id' => $this->customer->id,
            'status' => 'draft',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/invoices/{$invoice->id}/send");

        $response->assertStatus(200);

        // Status should be updated to 'sent'
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => 'sent',
        ]);
    }

    public function test_cannot_send_invoice_without_customer_email(): void
    {
        $customerNoEmail = Customer::factory()->create([
            'dealer_id' => $this->dealer->id,
            'email' => null,
        ]);

        $invoice = Invoice::factory()->create([
            'dealer_id' => $this->dealer->id,
            'customer_id' => $customerNoEmail->id,
        ]);

        $this->withHeaders($this->authHeader())
            ->postJson("/api/invoices/{$invoice->id}/send")
            ->assertStatus(422);
    }
}
