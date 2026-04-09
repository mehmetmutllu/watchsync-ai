<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
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

    // ─── PROFILE ──────────────────────────────────────────

    public function test_can_update_profile(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->putJson('/api/settings/profile', [
                'name' => 'New Name',
                'email' => 'new@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.name', 'New Name')
            ->assertJsonPath('user.email', 'new@example.com');
    }

    public function test_profile_email_must_be_unique(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->withHeaders($this->authHeader())
            ->putJson('/api/settings/profile', [
                'name' => 'Test',
                'email' => 'taken@example.com',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ─── PASSWORD ──────────────────────────────────────────

    public function test_can_change_password(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->putJson('/api/settings/password', [
                'current_password' => 'password', // default factory password
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200);
    }

    public function test_wrong_current_password_fails(): void
    {
        $this->withHeaders($this->authHeader())
            ->putJson('/api/settings/password', [
                'current_password' => 'wrongpassword',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ])
            ->assertStatus(422);
    }

    // ─── COMPANY ──────────────────────────────────────────

    public function test_can_update_company(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->putJson('/api/settings/company', [
                'company_name' => 'Updated Watch Co.',
                'phone' => '+49 123 456',
                'city' => 'Berlin',
                'country' => 'Germany',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('dealer.company_name', 'Updated Watch Co.');
    }

    // ─── NOTIFICATIONS ──────────────────────────────────────

    public function test_can_get_notification_preferences(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/settings/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'preferences' => [
                    'invoice_emails',
                    'sync_alerts',
                    'stock_alerts',
                    'weekly_report',
                ],
            ]);
    }

    public function test_can_update_notification_preferences(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->putJson('/api/settings/notifications', [
                'invoice_emails' => false,
                'sync_alerts' => true,
                'stock_alerts' => false,
                'weekly_report' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('preferences.invoice_emails', false)
            ->assertJsonPath('preferences.weekly_report', true);
    }
}
