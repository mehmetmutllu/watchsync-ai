<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SyncInventoryJob;
use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\Watch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        return response()->json([
            'message' => "{$queued} watches queued for publishing to {$platform->name}.",
            'queued'  => $queued,
            'skipped' => $skipped,
            'total'   => count($watchIds),
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
}
