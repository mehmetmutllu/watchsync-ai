<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\Watch;
use App\Services\Chrono24FeedService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Chrono24FeedTest extends TestCase
{
    use RefreshDatabase;

    private Dealer $dealer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dealer = Dealer::factory()->create();
    }

    public function test_feed_returns_xml(): void
    {
        Watch::factory()->active()->create([
            'dealer_id' => $this->dealer->id,
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'sale_price' => 14000,
            'currency' => 'EUR',
        ]);

        // IP Whitelist devre dışı (boş whitelist = izin ver)
        $response = $this->get("/api/feeds/chrono24.xml?dealer_id={$this->dealer->id}");

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

        $xml = simplexml_load_string($response->getContent());
        $this->assertNotFalse($xml);
        $this->assertCount(1, $xml->watch);
    }

    public function test_feed_contains_required_nodes(): void
    {
        Watch::factory()->active()->create([
            'dealer_id' => $this->dealer->id,
            'brand' => 'Omega',
            'model' => 'Speedmaster',
            'reference_number' => '310.30.42.50.01.001',
            'sale_price' => 7500,
            'currency' => 'EUR',
            'year' => 2024,
            'condition' => 'very_good',
        ]);

        $response = $this->get("/api/feeds/chrono24.xml?dealer_id={$this->dealer->id}");
        $xml = simplexml_load_string($response->getContent());

        $watch = $xml->watch[0];
        $this->assertNotEmpty((string) $watch->article_id);
        $this->assertEquals('7500.00', (string) $watch->price);
        $this->assertEquals('EUR', (string) $watch->currency);
        $this->assertEquals('Omega', (string) $watch->Manufacturer);
        $this->assertEquals('Speedmaster', (string) $watch->Model_name);
    }

    public function test_feed_only_includes_active_watches(): void
    {
        Watch::factory()->active()->create(['dealer_id' => $this->dealer->id]);
        Watch::factory()->draft()->create(['dealer_id' => $this->dealer->id]);
        Watch::factory()->sold()->create(['dealer_id' => $this->dealer->id]);

        $response = $this->get("/api/feeds/chrono24.xml?dealer_id={$this->dealer->id}");
        $xml = simplexml_load_string($response->getContent());

        $this->assertCount(1, $xml->watch);
    }

    public function test_feed_service_generates_valid_xml(): void
    {
        Watch::factory()->active()->count(3)->create(['dealer_id' => $this->dealer->id]);

        $service = app(Chrono24FeedService::class);
        $xmlString = $service->generateFeed($this->dealer->id);

        $this->assertStringStartsWith('<?xml version="1.0"', $xmlString);

        $xml = simplexml_load_string($xmlString);
        $this->assertNotFalse($xml);
        $this->assertCount(3, $xml->watch);
    }
}
