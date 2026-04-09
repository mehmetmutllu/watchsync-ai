<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    /**
     * Genel sağlık durumu — load balancer/uptime monitor için.
     */
    public function index(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
        ];

        $healthy = !in_array(false, $checks, true);

        return response()->json([
            'status' => $healthy ? 'healthy' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
        ], $healthy ? 200 : 503);
    }

    /**
     * Veritabanı bağlantı kontrolü.
     */
    public function database(): JsonResponse
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $latency = round((microtime(true) - $start) * 1000, 2);

            return response()->json([
                'status' => 'connected',
                'driver' => config('database.default'),
                'latency_ms' => $latency,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'disconnected',
                'error' => 'Database connection failed',
            ], 503);
        }
    }

    /**
     * Redis bağlantı kontrolü.
     */
    public function redis(): JsonResponse
    {
        try {
            $start = microtime(true);
            Redis::ping();
            $latency = round((microtime(true) - $start) * 1000, 2);

            $info = Redis::info();

            return response()->json([
                'status' => 'connected',
                'latency_ms' => $latency,
                'used_memory' => $info['used_memory_human'] ?? null,
                'connected_clients' => $info['connected_clients'] ?? null,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'disconnected',
                'error' => 'Redis connection failed',
            ], 503);
        }
    }

    /**
     * Queue durumu — bekleyen job sayısı.
     */
    public function queue(): JsonResponse
    {
        try {
            $pendingJobs = DB::table('jobs')->count();
            $failedJobs = DB::table('failed_jobs')->count();

            return response()->json([
                'status' => 'operational',
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'error' => 'Queue check failed',
            ], 503);
        }
    }

    private function checkDatabase(): bool
    {
        try {
            DB::select('SELECT 1');
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function checkRedis(): bool
    {
        try {
            Redis::ping();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function checkCache(): bool
    {
        try {
            Cache::put('health_check', true, 10);
            return Cache::get('health_check') === true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function checkStorage(): bool
    {
        try {
            $testFile = storage_path('app/health_check.tmp');
            file_put_contents($testFile, 'ok');
            $result = file_get_contents($testFile) === 'ok';
            @unlink($testFile);
            return $result;
        } catch (\Throwable) {
            return false;
        }
    }
}
