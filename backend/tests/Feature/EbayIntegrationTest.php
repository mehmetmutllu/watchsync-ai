<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\User;
use App\Models\Watch;
use App\Services\EbayListingService;
use App\Services\EbayOAuthService;
use App\Services\EbayTaxonomyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EbayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;
    private User $user;
    private Watch $watch;
    private Platform $platform;
    private PlatformConnection $connection;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dealer = Dealer::factory()->create();
        $this->user = User::factory()->create(['dealer_id' => $this->dealer->id, 'role' => 'owner']);
        $this->watch = Watch::factory()->active()->create([
            'dealer_id'        => $this->dealer->id,
            'brand'            => 'Rolex',
            'model'            => 'Submariner',
            'reference_number' => '126610LN',
            'year'             => 2024,
            'condition'        => 'unworn',
            'sale_price'       => 12500.00,
            'currency'         => 'USD',
        ]);

        $this->platform = Platform::firstOrCreate(
            ['name' => 'eBay'],
            ['name' => 'eBay', 'api_url' => 'https://api.ebay.com']
        );

        $this->connection = PlatformConnection::create([
            'dealer_id'        => $this->dealer->id,
            'platform_id'      => $this->platform->id,
            'api_key'          => 'test-api-key',
            'api_secret'       => 'test-api-secret',
            'access_token'     => 'test-access-token',
            'refresh_token'    => 'test-refresh-token',
            'token_expires_at' => now()->addHour(),
            'status'           => 'connected',
            'settings'         => [
                'merchant_location_key' => 'default',
                'fulfillment_policy_id' => 'fp-123',
                'payment_policy_id'     => 'pp-123',
                'return_policy_id'      => 'rp-123',
            ],
        ]);
    }

    // ─── EbayOAuth Tests ────────────────────────────────────

    public function test_ebay_auth_url_endpoint_returns_url(): void
    {
        $this->actingAs($this->user);

        $response = $this->getJson('/api/ebay/auth-url');

        $response->assertOk()
            ->assertJsonStructure(['auth_url']);
    }

    public function test_ebay_callback_validates_state(): void
    {
        // No cached state — should fail
        $response = $this->get('/api/ebay/callback?code=test-code&state=invalid-state');

        $response->assertStatus(302); // Redirects to frontend with error
    }

    public function test_ebay_disconnect_clears_tokens(): void
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/ebay/disconnect');

        $response->assertOk();
        $this->connection->refresh();
        $this->assertNull($this->connection->access_token);
    }

    // ─── EbayListingService Tests ───────────────────────────

    public function test_publish_watch_creates_inventory_and_offer(): void
    {
        Http::fake([
            '*/sell/inventory/v1/inventory_item/*' => Http::response(null, 204),
            '*/sell/inventory/v1/offer'            => Http::response(['offerId' => 'offer-123'], 200),
            '*/sell/inventory/v1/offer/*/publish'   => Http::response(['listingId' => 'listing-456'], 200),
        ]);

        $service = app(EbayListingService::class);
        $result  = $service->publishWatch($this->watch, $this->connection);

        $this->assertEquals('offer-123', $result['offer_id']);
        $this->assertEquals('listing-456', $result['listing_id']);
        $this->assertStringStartsWith('WS-', $result['sku']);

        // DB takibi
        $this->watch->refresh();
        $this->assertEquals('listing-456', $this->watch->ebay_listing_id);
        $this->assertEquals('offer-123', $this->watch->ebay_offer_id);

        // SyncLog kaydı
        $this->assertDatabaseHas('sync_logs', [
            'watch_id'    => $this->watch->id,
            'platform_id' => $this->platform->id,
            'status'      => 'success',
        ]);
    }

    public function test_publish_watch_generates_correct_sku(): void
    {
        Http::fake([
            '*/sell/inventory/v1/inventory_item/*' => Http::response(null, 204),
            '*/sell/inventory/v1/offer'            => Http::response(['offerId' => 'o-1'], 200),
            '*/sell/inventory/v1/offer/*/publish'   => Http::response(['listingId' => 'l-1'], 200),
        ]);

        $service = app(EbayListingService::class);
        $result  = $service->publishWatch($this->watch, $this->connection);

        $expectedSku = 'WS-' . str_pad((string) $this->watch->id, 8, '0', STR_PAD_LEFT);
        $this->assertEquals($expectedSku, $result['sku']);
    }

    public function test_update_offer_sends_correct_price(): void
    {
        Http::fake([
            '*' => Http::response(null, 204),
        ]);

        $this->watch->update(['ebay_offer_id' => 'offer-existing']);

        $service = app(EbayListingService::class);
        $service->updateWatch($this->watch->fresh(), $this->connection);

        Http::assertSent(function ($request) {
            if (str_contains($request->url(), '/offer/offer-existing') && $request->method() === 'PUT') {
                $body = json_decode($request->body(), true);
                $price = $body['pricingSummary']['price']['value'] ?? null;
                return $price !== null && (float)$price === 12500.0;
            }
            return false;
        });
    }

    public function test_withdraw_offer_clears_listing_ids(): void
    {
        Http::fake([
            '*/sell/inventory/v1/offer/*/withdraw' => Http::response(null, 200),
        ]);

        $this->watch->update([
            'ebay_listing_id' => 'listing-999',
            'ebay_offer_id'   => 'offer-999',
        ]);

        $service = app(EbayListingService::class);
        $service->withdrawOffer($this->watch, $this->connection);

        $this->watch->refresh();
        $this->assertNull($this->watch->ebay_listing_id);
        $this->assertNull($this->watch->ebay_offer_id);
    }

    public function test_withdraw_skipped_when_no_offer_id(): void
    {
        Http::fake();

        $this->watch->update(['ebay_offer_id' => null]);

        $service = app(EbayListingService::class);
        $service->withdrawOffer($this->watch, $this->connection);

        Http::assertNothingSent();
    }

    public function test_api_failure_throws_exception(): void
    {
        Http::fake([
            '*/sell/inventory/v1/inventory_item/*' => Http::response(['errors' => [['message' => 'Invalid token']]], 401),
        ]);

        $service = app(EbayListingService::class);

        $this->expectException(\Throwable::class);
        $service->createOrReplaceInventoryItem($this->watch, $this->connection);
    }

    public function test_update_inventory_quantity(): void
    {
        Http::fake([
            '*/sell/inventory/v1/inventory_item/*' => Http::response(null, 204),
        ]);

        $service = app(EbayListingService::class);
        $service->updateInventoryQuantity($this->watch, $this->connection, 0);

        Http::assertSent(function ($request) {
            $body = $request->data();
            return ($body['availability']['shipToLocationAvailability']['quantity'] ?? null) === 0;
        });
    }

    public function test_token_refresh_when_expiring_soon(): void
    {
        $this->connection->update([
            'token_expires_at' => now()->addMinutes(5), // < 15 min = expiring soon
        ]);

        Http::fake([
            '*/identity/v1/oauth2/token'           => Http::response([
                'access_token' => 'new-token',
                'expires_in'   => 7200,
            ], 200),
            '*/sell/inventory/v1/inventory_item/*' => Http::response(null, 204),
            '*/sell/inventory/v1/offer'            => Http::response(['offerId' => 'o-1'], 200),
            '*/sell/inventory/v1/offer/*/publish'   => Http::response(['listingId' => 'l-1'], 200),
        ]);

        $service = app(EbayListingService::class);
        $result  = $service->publishWatch($this->watch, $this->connection);

        $this->assertNotEmpty($result['listing_id']);
    }
}
