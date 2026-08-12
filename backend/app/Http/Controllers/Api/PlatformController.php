<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\RemovePlatformListingJob;
use App\Jobs\SyncInventoryJob;
use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\Watch;
use App\Services\WebhookSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PlatformController extends Controller
{
    /**
     * Tüm platformları ve dealer'ın bağlantı durumlarını döner.
     *
     * GET /api/platforms
     */
    public function index(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $platforms = Platform::all()->map(function ($platform) use ($dealerId) {
            $connection = PlatformConnection::where('platform_id', $platform->id)
                ->where('dealer_id', $dealerId)
                ->first();

            return [
                'id'              => $platform->id,
                'name'            => $platform->name,
                'api_url'         => $platform->api_url,
                'status'          => $connection?->status ?? 'disconnected',
                'last_synced_at'  => $connection?->last_synced_at?->toIso8601String(),
                'token_expires_at' => $connection?->token_expires_at?->toIso8601String(),
                'has_api_key'     => $connection && !empty($connection->api_key),
                'has_access_token' => $connection && !empty($connection->access_token),
                'settings'        => $connection?->settings ?? [],
            ];
        });

        return response()->json(['platforms' => $platforms]);
    }

    /**
     * Platform API key/secret günceller (Chrono24, Shopify gibi).
     *
     * PUT /api/platforms/{id}/credentials
     */
    public function updateCredentials(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'api_key'    => 'nullable|string|max:500',
            'api_secret' => 'nullable|string|max:500',
            'settings'   => 'nullable|array',
        ]);

        $dealerId = $request->user()->dealer_id;
        $platform = Platform::findOrFail($id);

        $connection = PlatformConnection::updateOrCreate(
            [
                'dealer_id'   => $dealerId,
                'platform_id' => $platform->id,
            ],
            array_filter([
                'api_key'    => $request->input('api_key'),
                'api_secret' => $request->input('api_secret'),
                'settings'   => $request->input('settings'),
                'status'     => 'connected',
            ], fn ($v) => $v !== null)
        );

        // Webhook subscription otomasyonu
        $connection->load('platform');
        app(WebhookSubscriptionService::class)->registerForPlatform($connection);

        return response()->json([
            'message'    => 'Credentials updated successfully.',
            'connection' => [
                'status'     => $connection->status,
                'has_api_key' => !empty($connection->api_key),
            ],
        ]);
    }

    /**
     * Platform bağlantısını kopar.
     *
     * POST /api/platforms/{id}/disconnect
     */
    public function disconnect(Request $request, int $id): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;
        $platform = Platform::findOrFail($id);

        $connection = PlatformConnection::where('dealer_id', $dealerId)
            ->where('platform_id', $platform->id)
            ->first();

        if ($connection) {
            $connection->update([
                'api_key'          => null,
                'api_secret'       => null,
                'access_token'     => null,
                'refresh_token'    => null,
                'token_expires_at' => null,
                'status'           => 'disconnected',
            ]);
        }

        return response()->json(['message' => 'Platform disconnected successfully.']);
    }

    /**
     * Tek bir saat için platform senkronizasyonu tetikler.
     *
     * POST /api/watches/{watchId}/platforms/{platformId}/toggle
     */
    public function toggleSync(Request $request, int $watchId, int $platformId): JsonResponse
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $dealerId = $request->user()->dealer_id;
        $platform = Platform::findOrFail($platformId);

        // Saat bu dealer'a ait olmalı (cross-tenant sync/kaldırma engeli)
        Watch::where('dealer_id', $dealerId)->findOrFail($watchId);

        // Dealer bağlantısını kontrol et
        $connection = PlatformConnection::where('dealer_id', $dealerId)
            ->where('platform_id', $platform->id)
            ->connected()
            ->first();

        if (!$connection) {
            return response()->json([
                'message' => 'Platform is not connected. Please connect first.',
            ], 422);
        }

        $enabled = $request->boolean('enabled');

        if ($enabled) {
            // Senkronizasyon job'unu kuyruğa ekle
            SyncInventoryJob::dispatch($watchId, $dealerId, $platform->id);
        } else {
            // Platformdan listing kaldırma job'unu kuyruğa ekle
            RemovePlatformListingJob::dispatch($watchId, $platform->id, $dealerId);
        }

        return response()->json([
            'message' => $enabled
                ? 'Sync initiated for ' . $platform->name
                : 'Listing will be removed from ' . $platform->name,
            'sync_status' => $enabled ? 'pending' : 'disabled',
        ]);
    }

    /**
     * Toplu yayınlama — birden fazla saati belirli bir platforma yayınlar.
     *
     * POST /api/watches/bulk-publish
     */
    public function bulkPublish(Request $request): JsonResponse
    {
        $request->validate([
            'watch_ids'   => 'required|array|min:1|max:50',
            'watch_ids.*' => 'integer|exists:watches,id',
            'platform_id' => 'required|integer|exists:platforms,id',
        ]);

        $dealerId = $request->user()->dealer_id;
        $platformId = $request->integer('platform_id');
        $watchIds = $request->input('watch_ids');
        $platform = Platform::findOrFail($platformId);

        // Platform bağlantısını kontrol et
        $connection = PlatformConnection::where('dealer_id', $dealerId)
            ->where('platform_id', $platformId)
            ->connected()
            ->first();

        if (!$connection) {
            return response()->json([
                'message' => 'Platform is not connected. Please connect first.',
            ], 422);
        }

        // Sadece dealer'a ait ve active olan saatleri al
        $watches = Watch::where('dealer_id', $dealerId)
            ->whereIn('id', $watchIds)
            ->where('status', 'active')
            ->pluck('id');

        $queued = 0;
        $skipped = count($watchIds) - $watches->count();

        // Batch ID oluştur (polling için)
        $batchId = 'bulk_' . uniqid();

        foreach ($watches as $watchId) {
            // Pending sync log oluştur
            SyncLog::create([
                'watch_id'      => $watchId,
                'platform_id'   => $platformId,
                'status'        => 'pending',
                'error_message' => null,
            ]);

            SyncInventoryJob::dispatch($watchId, $dealerId, $platformId);
            $queued++;
        }

        // Batch bilgisini cache'e kaydet (5 dk TTL) — anahtar dealer'a bağlı
        if ($queued > 0) {
            cache()->put("bulk_publish_{$dealerId}_{$batchId}", [
                'watch_ids'   => $watches->toArray(),
                'platform_id' => $platformId,
                'total'       => $queued,
                'started_at'  => now()->toIso8601String(),
            ], 300);
        }

        return response()->json([
            'message'  => "{$queued} watches queued for publishing to {$platform->name}.",
            'queued'   => $queued,
            'skipped'  => $skipped,
            'total'    => count($watchIds),
            'batch_id' => $batchId,
        ]);
    }

    /**
     * Toplu yayınlama ilerleme durumu (polling).
     *
     * GET /api/watches/bulk-publish/{batchId}/status
     */
    public function bulkPublishStatus(Request $request, string $batchId): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;
        $batch = cache()->get("bulk_publish_{$dealerId}_{$batchId}");

        if (!$batch) {
            return response()->json([
                'completed' => true,
                'progress'  => 100,
                'success'   => 0,
                'failed'    => 0,
                'pending'   => 0,
                'total'     => 0,
            ]);
        }

        $watchIds = $batch['watch_ids'];
        $platformId = $batch['platform_id'];
        $total = $batch['total'];

        // Her watch için en son sync log durumunu kontrol et
        $latestLogs = SyncLog::whereIn('watch_id', $watchIds)
            ->where('platform_id', $platformId)
            ->where('created_at', '>=', $batch['started_at'])
            ->selectRaw('watch_id, status, MAX(id) as max_id')
            ->groupBy('watch_id', 'status')
            ->get();

        // Watch başına en son durumu belirle
        $watchStatuses = [];
        foreach ($latestLogs as $log) {
            $wid = $log->watch_id;
            if (!isset($watchStatuses[$wid]) || $log->max_id > ($watchStatuses[$wid]['max_id'] ?? 0)) {
                $watchStatuses[$wid] = ['status' => $log->status, 'max_id' => $log->max_id];
            }
        }

        $success = 0;
        $failed = 0;
        $pending = 0;

        foreach ($watchIds as $wid) {
            $status = $watchStatuses[$wid]['status'] ?? 'pending';
            match ($status) {
                'success' => $success++,
                'failed'  => $failed++,
                default   => $pending++,
            };
        }

        $completed = ($success + $failed) >= $total;
        $progress = $total > 0 ? round((($success + $failed) / $total) * 100, 1) : 100;

        if ($completed) {
            cache()->forget("bulk_publish_{$batchId}");
        }

        return response()->json([
            'completed' => $completed,
            'progress'  => $progress,
            'success'   => $success,
            'failed'    => $failed,
            'pending'   => $pending,
            'total'     => $total,
        ]);
    }

    /**
     * Tek bir saatin platform senkronizasyon durumlarını döner.
     *
     * GET /api/watches/{watchId}/sync-status
     */
    public function syncStatus(Request $request, int $watchId): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $watch = Watch::where('dealer_id', $dealerId)->findOrFail($watchId);

        $platforms = Platform::all();
        $syncStatuses = [];

        foreach ($platforms as $platform) {
            // Son sync log'u al
            $lastLog = SyncLog::where('watch_id', $watchId)
                ->where('platform_id', $platform->id)
                ->latest()
                ->first();

            $connection = PlatformConnection::where('dealer_id', $dealerId)
                ->where('platform_id', $platform->id)
                ->first();

            $syncStatuses[] = [
                'platform_id'   => $platform->id,
                'platform_name' => $platform->name,
                'connected'     => $connection && $connection->status === 'connected',
                'sync_status'   => $lastLog?->status ?? 'never', // success | failed | pending | never
                'last_synced_at' => $lastLog?->created_at?->toIso8601String(),
                'error_message'  => $lastLog?->status === 'failed' ? $lastLog->error_message : null,
            ];
        }

        return response()->json(['sync_statuses' => $syncStatuses]);
    }

    /**
     * Test platform connection — verify credentials are working.
     *
     * POST /api/platforms/{id}/test-connection
     */
    public function testConnection(Request $request, int $id): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;
        $platform = Platform::findOrFail($id);

        $connection = PlatformConnection::where('dealer_id', $dealerId)
            ->where('platform_id', $platform->id)
            ->first();

        if (!$connection) {
            return response()->json([
                'success' => false,
                'message' => __('api.platform_not_connected'),
            ], 422);
        }

        try {
            $result = match (strtolower($platform->name)) {
                'ebay'     => $this->testEbayConnection($connection),
                'shopify'  => $this->testShopifyConnection($connection),
                'chrono24' => $this->testChrono24Connection($connection),
                default    => ['success' => false, 'message' => __('api.platform_no_test')],
            };

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Throwable $e) {
            Log::warning('Platform test connection failed', [
                'platform' => $platform->name,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('api.platform_test_error', ['error' => $e->getMessage()]),
            ], 500);
        }
    }

    private function testEbayConnection(PlatformConnection $connection): array
    {
        // If we have an access token, try to validate it
        if ($connection->access_token) {
            $sandbox = config('services.ebay.sandbox');
            $baseUrl = $sandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';

            $response = Http::withToken($connection->access_token)
                ->withHeaders(['X-EBAY-C-MARKETPLACE-ID' => 'EBAY_US'])
                ->timeout(10)
                ->get("{$baseUrl}/sell/account/v1/privilege");

            if ($response->successful()) {
                return ['success' => true, 'message' => __('api.ebay_connection_ok')];
            }

            if ($response->status() === 401) {
                return ['success' => false, 'message' => __('api.ebay_token_expired')];
            }
        }

        // Fallback: try app-level token
        $clientId = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');

        if ($clientId && $clientSecret) {
            return ['success' => true, 'message' => __('api.ebay_keys_ready')];
        }

        return ['success' => false, 'message' => __('api.ebay_keys_missing')];
    }

    private function testShopifyConnection(PlatformConnection $connection): array
    {
        $accessToken = $connection->api_key;
        $shopDomain = $connection->settings['shop_domain'] ?? '';

        if (!$accessToken || !$shopDomain) {
            return ['success' => false, 'message' => __('api.shopify_keys_missing')];
        }

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type'           => 'application/json',
        ])->timeout(10)->post("https://{$shopDomain}/admin/api/2024-10/graphql.json", [
            'query' => '{ shop { name myshopifyDomain } }',
        ]);

        if ($response->successful()) {
            $shopName = $response->json('data.shop.name');
            return ['success' => true, 'message' => "Shopify bağlantısı başarılı! Mağaza: {$shopName}"];
        }

        return ['success' => false, 'message' => __('api.shopify_no_response')];
    }

    private function testChrono24Connection(PlatformConnection $connection): array
    {
        // Chrono24 uses XML Feed — we just verify credentials exist
        if ($connection->api_key || $connection->status === 'connected') {
            return ['success' => true, 'message' => __('api.chrono24_active')];
        }

        return ['success' => false, 'message' => 'Chrono24 credentials eksik.'];
    }
}
