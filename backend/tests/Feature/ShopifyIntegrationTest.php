<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\User;
use App\Models\Watch;
use App\Services\ShopifyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ShopifyIntegrationTest extends TestCase
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
        $this->user = User::factory()->create(['dealer_id' => $this->dealer->id]);
        $this->watch = Watch::factory()->active()->create([
            'dealer_id'        => $this->dealer->id,
            'brand'            => 'Omega',
            'model'            => 'Speedmaster',
            'reference_number' => '310.30.42.50.01.002',
            'year'             => 2023,
            'condition'        => 'very_good',
            'sale_price'       => 6500.00,
            'currency'         => 'EUR',
        ]);

        $this->platform = Platform::firstOrCreate(
            ['name' => 'Shopify'],
            ['name' => 'Shopify', 'api_url' => 'https://shopify.com']
        );

        $this->connection = PlatformConnection::create([
            'dealer_id'        => $this->dealer->id,
            'platform_id'      => $this->platform->id,
            'api_key'          => 'shpat_test_key_123',
            'status'           => 'connected',
            'settings'         => [
                'shop_domain'  => 'test-store.myshopify.com',
                'location_id'  => 'gid://shopify/Location/12345',
            ],
        ]);
    }

    // ─── productCreate Tests ─────────────────────────────────

    public function test_product_create_sends_graphql_mutation(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response([
                'data' => [
                    'productCreate' => [
                        'product' => [
                            'id'     => 'gid://shopify/Product/111',
                            'title'  => 'Omega Speedmaster',
                            'handle' => 'omega-speedmaster',
                            'variants' => [
                                'edges' => [[
                                    'node' => [
                                        'id' => 'gid://shopify/ProductVariant/222',
                                        'inventoryItem' => ['id' => 'gid://shopify/InventoryItem/333'],
                                    ],
                                ]],
                            ],
                        ],
                        'userErrors' => [],
                    ],
                ],
            ], 200),
        ]);

        $service = app(ShopifyService::class);
        $result  = $service->productCreate($this->watch, $this->connection);

        $this->assertArrayHasKey('product_id', $result);
        $this->assertArrayHasKey('variant_id', $result);
        $this->assertEquals('gid://shopify/Product/111', $result['product_id']);
        $this->assertEquals('gid://shopify/ProductVariant/222', $result['variant_id']);
    }

    public function test_product_create_throws_on_user_errors(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response([
                'data' => [
                    'productCreate' => [
                        'product'    => null,
                        'userErrors' => [
                            ['field' => 'title', 'message' => 'Title is required'],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $service = app(ShopifyService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Title is required');
        $service->productCreate($this->watch, $this->connection);
    }

    public function test_product_create_fails_without_credentials(): void
    {
        $this->connection->update([
            'api_key'  => null,
            'settings' => ['shop_domain' => ''],
        ]);

        $service = app(ShopifyService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('credentials are incomplete');
        $service->productCreate($this->watch, $this->connection);
    }

    // ─── productUpdate Tests ─────────────────────────────────

    public function test_product_update_sends_mutation(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response([
                'data' => [
                    'productUpdate' => [
                        'product'    => ['id' => 'gid://shopify/Product/111'],
                        'userErrors' => [],
                    ],
                ],
            ], 200),
        ]);

        $service = app(ShopifyService::class);
        $service->productUpdate($this->watch, $this->connection, 'gid://shopify/Product/111');

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return isset($body['query']) && str_contains($body['query'], 'productUpdate');
        });
    }

    // ─── inventoryAdjustQuantities Tests ─────────────────────

    public function test_inventory_adjust_sends_delta(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response([
                'data' => [
                    'inventoryAdjustQuantities' => [
                        'inventoryAdjustmentGroup' => ['createdAt' => now()->toISOString()],
                        'userErrors' => [],
                    ],
                ],
            ], 200),
        ]);

        $service = app(ShopifyService::class);
        $service->inventoryAdjustQuantities(
            $this->connection,
            'gid://shopify/InventoryItem/333',
            -1,
            $this->watch,
        );

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return isset($body['query']) && str_contains($body['query'], 'inventoryAdjustQuantities');
        });
    }

    // ─── productDelete Tests ─────────────────────────────────

    public function test_product_delete_sends_mutation(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response([
                'data' => [
                    'productDelete' => [
                        'deletedProductId' => 'gid://shopify/Product/111',
                        'userErrors'       => [],
                    ],
                ],
            ], 200),
        ]);

        $this->watch->update(['shopify_product_id' => 'gid://shopify/Product/111']);

        $service = app(ShopifyService::class);
        $service->productDelete($this->watch, $this->connection);

        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return isset($body['query']) && str_contains($body['query'], 'productDelete');
        });
    }

    // ─── publishWatch Tests ──────────────────────────────────

    public function test_publish_watch_creates_sync_log(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response([
                'data' => [
                    'productCreate' => [
                        'product' => [
                            'id'     => 'gid://shopify/Product/111',
                            'title'  => 'Omega Speedmaster',
                            'handle' => 'omega-speedmaster',
                            'variants' => [
                                'edges' => [[
                                    'node' => [
                                        'id' => 'gid://shopify/ProductVariant/222',
                                        'inventoryItem' => ['id' => 'gid://shopify/InventoryItem/333'],
                                    ],
                                ]],
                            ],
                        ],
                        'userErrors' => [],
                    ],
                ],
            ], 200),
        ]);

        $service = app(ShopifyService::class);
        $service->publishWatch($this->watch, $this->connection);

        $this->assertDatabaseHas('sync_logs', [
            'watch_id'    => $this->watch->id,
            'platform_id' => $this->platform->id,
            'status'      => 'success',
        ]);
    }

    // ─── Error Handling Tests ────────────────────────────────

    public function test_graphql_http_error_throws_exception(): void
    {
        Http::fake([
            'test-store.myshopify.com/*' => Http::response('Internal Server Error', 500),
        ]);

        $service = app(ShopifyService::class);

        $this->expectException(\Throwable::class);
        $service->productCreate($this->watch, $this->connection);
    }
}
