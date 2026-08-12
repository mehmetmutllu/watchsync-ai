<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        $response = $this->withHeader('Referer', 'http://localhost')
            ->postJson('/api/auth/register', [
                'name'                  => 'Test Owner',
                'email'                 => 'owner@watchsync.ai',
                'password'              => 'Password123',
                'password_confirmation' => 'Password123',
                'company_name'          => 'Test Watch Co.',
                'terms_accepted'        => true,
            ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'user' => [
                         'id',
                         'name',
                         'email',
                         'dealer_id',
                         'role',
                         'dealer' => [
                             'id',
                             'name',
                             'company_name',
                         ],
                     ],
                 ]);

        $this->assertDatabaseHas('dealers', ['company_name' => 'Test Watch Co.']);
        $this->assertDatabaseHas('users', ['email' => 'owner@watchsync.ai', 'role' => 'owner']);
    }

    public function test_register_validation_fails()
    {
        $response = $this->postJson('/api/auth/register', [
            'name'  => 'Test User',
            'email' => 'invalid-email',
            // Missing password
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email', 'password', 'terms_accepted']);
    }

    public function test_register_fails_without_terms_accepted()
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test Owner',
            'email'                 => 'owner-noterms@watchsync.ai',
            'password'              => 'Password123',
            'password_confirmation' => 'Password123',
            'terms_accepted'        => false,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['terms_accepted']);
    }

    public function test_user_can_login()
    {
        $dealer = Dealer::create([
            'name'   => 'Login Test Dealer',
            'email'  => 'login-dealer@test.com',
            'status' => 'active',
        ]);

        $user = User::create([
            'dealer_id' => $dealer->id,
            'name'      => 'Login User',
            'email'     => 'login@test.com',
            'password'  => Hash::make('secretpass'),
            'role'      => 'manager',
        ]);

        $response = $this->withHeader('Referer', 'http://localhost')
            ->postJson('/api/auth/login', [
                'email'    => 'login@test.com',
                'password' => 'secretpass',
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'user']);
    }

    public function test_login_fails_with_wrong_credentials()
    {
        $dealer = Dealer::create([
            'name'   => 'Login Fail Dealer',
            'email'  => 'fail-dealer@test.com',
            'status' => 'active',
        ]);

        $user = User::create([
            'dealer_id' => $dealer->id,
            'name'      => 'Login User',
            'email'     => 'login@test.com',
            'password'  => Hash::make('secretpass'),
            'role'      => 'manager',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'login@test.com',
            'password' => 'wrongpass',
        ]);

        $response->assertStatus(401)
                 ->assertJson(['message' => __('api.login_invalid')]);
    }

    public function test_user_can_get_profile()
    {
        $dealer = Dealer::create(['name' => 'Me Dealer', 'email' => 'me-dealer@test.com', 'status' => 'active']);
        $user = User::create([
            'dealer_id' => $dealer->id,
            'name'      => 'Me User',
            'email'     => 'me@test.com',
            'password'  => Hash::make('12345678'),
            'role'      => 'staff',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('user.email', 'me@test.com')
                 ->assertJsonPath('user.dealer.name', 'Me Dealer');
    }

    public function test_unauthenticated_user_cannot_access_profile()
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }
}
