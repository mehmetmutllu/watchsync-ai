<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Dealer $dealer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealer = Dealer::create([
            'name'                => 'Subscription Test Dealer',
            'company_name'        => 'Luxury Watches GmbH',
            'email'               => 'dealer@subtest.com',
            'status'              => 'active',
            'plan_type'           => 'starter',
            'subscription_status' => 'active',
        ]);

        $this->user = User::create([
            'dealer_id' => $this->dealer->id,
            'name'      => 'Sub User',
            'email'     => 'user@subtest.com',
            'password'  => Hash::make('secretpass123'),
            'role'      => 'owner',
        ]);
    }

    public function test_user_can_get_current_subscription()
    {
        $response = $this->actingAs($this->user)->getJson('/api/subscriptions/current');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'subscription' => [
                         'plan_type',
                         'status',
                         'current_period_end',
                         'cancel_at_period_end',
                         'has_stripe_customer',
                     ],
                     'plans',
                     'commission_rules',
                 ])
                 ->assertJsonPath('subscription.plan_type', 'starter');
    }

    public function test_user_can_cancel_subscription_at_period_end()
    {
        $response = $this->actingAs($this->user)->postJson('/api/subscriptions/cancel');

        $response->assertStatus(200)
                 ->assertJsonPath('cancel_at_period_end', true);

        $this->dealer->refresh();
        $this->assertTrue((bool) $this->dealer->cancel_at_period_end);
    }

    public function test_user_can_resume_canceled_subscription()
    {
        $this->dealer->update(['cancel_at_period_end' => true]);

        $response = $this->actingAs($this->user)->postJson('/api/subscriptions/resume');

        $response->assertStatus(200)
                 ->assertJsonPath('cancel_at_period_end', false);

        $this->dealer->refresh();
        $this->assertFalse((bool) $this->dealer->cancel_at_period_end);
    }
}
