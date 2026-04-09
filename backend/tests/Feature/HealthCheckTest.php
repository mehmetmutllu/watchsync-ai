<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_returns_response(): void
    {
        $response = $this->getJson('/api/health');

        // Redis yoksa degraded döner, varsa healthy
        $response->assertStatus($response->json('status') === 'healthy' ? 200 : 503)
            ->assertJsonStructure([
                'status',
                'checks' => ['database', 'redis', 'cache', 'storage'],
                'timestamp',
                'version',
            ]);
    }

    public function test_database_health_check(): void
    {
        $response = $this->getJson('/api/health/db');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'connected')
            ->assertJsonStructure(['status', 'driver', 'latency_ms']);
    }

    public function test_redis_health_check(): void
    {
        if (!extension_loaded('redis')) {
            $this->markTestSkipped('Redis extension not available');
        }

        $response = $this->getJson('/api/health/redis');

        $response->assertJsonStructure(['status']);
    }

    public function test_queue_health_check(): void
    {
        $response = $this->getJson('/api/health/queue');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'pending_jobs', 'failed_jobs']);
    }

    public function test_health_endpoints_dont_require_auth(): void
    {
        // Health check'ler auth gerektirmemeli (status kodu Redis'e bağlı)
        $this->getJson('/api/health')->assertJsonStructure(['status']);
        $this->getJson('/api/health/db')->assertStatus(200);
    }
}
