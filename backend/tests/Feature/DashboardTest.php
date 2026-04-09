<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\Platform;
use App\Models\SyncLog;
use App\Models\User;
use App\Models\Watch;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    // ─── STATS ──────────────────────────────────────────────

    public function test_can_get_dashboard_stats(): void
    {
        Watch::factory()->active()->create([
            'dealer_id' => $this->dealer->id,
            'sale_price' => 10000,
        ]);
        Watch::factory()->active()->create([
            'dealer_id' => $this->dealer->id,
            'sale_price' => 20000,
        ]);
        Watch::factory()->sold()->create([
            'dealer_id' => $this->dealer->id,
            'sale_price' => 5000,
            'updated_at' => now(), // sold this month
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'stats' => [
                    'total_inventory_value',
                    'active_watches',
                    'sold_this_month',
                    'pending_syncs',
                    'sync_success_rate',
                ],
                'recent_activities',
            ]);

        $stats = $response->json('stats');
        $this->assertEquals(2, $stats['active_watches']);
        $this->assertEquals(1, $stats['sold_this_month']);
    }

    public function test_stats_scoped_to_dealer(): void
    {
        Watch::factory()->active()->count(2)->create(['dealer_id' => $this->dealer->id]);
        Watch::factory()->active()->count(5)->create(); // farklı dealer

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/dashboard/stats');

        $this->assertEquals(2, $response->json('stats.active_watches'));
    }

    // ─── ACTIVITIES ──────────────────────────────────────────

    public function test_can_get_activities(): void
    {
        $watch = Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);
        $platform = Platform::create(['name' => 'eBay', 'api_url' => 'https://api.ebay.com']);

        SyncLog::create([
            'watch_id' => $watch->id,
            'platform_id' => $platform->id,
            'status' => 'success',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/dashboard/activities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'activities' => [
                    '*' => ['id', 'message', 'status', 'time', 'timestamp'],
                ],
                'has_more',
            ]);
    }

    public function test_activities_since_filter(): void
    {
        $watch = Watch::factory()->create(['dealer_id' => $this->dealer->id]);
        $platform = Platform::create(['name' => 'eBay', 'api_url' => 'https://api.ebay.com']);

        // Old log
        SyncLog::create([
            'watch_id' => $watch->id,
            'platform_id' => $platform->id,
            'status' => 'success',
            'created_at' => now()->subDays(2),
        ]);

        // Recent log
        SyncLog::create([
            'watch_id' => $watch->id,
            'platform_id' => $platform->id,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $since = now()->subDay()->toIso8601String();
        $response = $this->withHeaders($this->authHeader())
            ->getJson("/api/dashboard/activities?since={$since}");

        $this->assertCount(1, $response->json('activities'));
    }

    // ─── NOTIFICATIONS ──────────────────────────────────────

    public function test_can_get_notifications(): void
    {
        $watch = Watch::factory()->create(['dealer_id' => $this->dealer->id]);
        $platform = Platform::create(['name' => 'Shopify', 'api_url' => 'https://shopify.com']);

        SyncLog::create([
            'watch_id' => $watch->id,
            'platform_id' => $platform->id,
            'status' => 'success',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'notifications' => [
                    '*' => ['id', 'title', 'message', 'type', 'read', 'timestamp'],
                ],
                'unread_count',
            ]);
    }

    public function test_can_mark_all_notifications_read(): void
    {
        $response = $this->withHeaders($this->authHeader())
            ->postJson('/api/notifications/read-all');

        $response->assertStatus(200);
        $this->assertNotNull($this->user->fresh()->notifications_read_at);
    }

    public function test_can_mark_single_notification_read(): void
    {
        $watch = Watch::factory()->create(['dealer_id' => $this->dealer->id]);
        $platform = Platform::create(['name' => 'eBay', 'api_url' => 'https://api.ebay.com']);

        $log = SyncLog::create([
            'watch_id' => $watch->id,
            'platform_id' => $platform->id,
            'status' => 'success',
        ]);

        $response = $this->withHeaders($this->authHeader())
            ->postJson("/api/notifications/{$log->id}/read");

        $response->assertStatus(200);
    }
}
