<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_returns_healthy(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'checks' => ['database', 'redis', 'cache', 'storage'],
                'timestamp',
                'version',
            ])
            ->assertJsonPath('status', 'healthy');
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
        $response = $this->getJson('/api/health/redis');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'connected')
            ->assertJsonStructure(['status', 'latency_ms']);
    }

    public function test_queue_health_check(): void
    {
        $response = $this->getJson('/api/health/queue');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'pending_jobs', 'failed_jobs']);
    }

    public function test_health_endpoints_dont_require_auth(): void
    {
        // Health check'ler auth gerektirmemeli
        $this->getJson('/api/health')->assertStatus(200);
        $this->getJson('/api/health/db')->assertStatus(200);
        $this->getJson('/api/health/redis')->assertStatus(200);
    }
}
