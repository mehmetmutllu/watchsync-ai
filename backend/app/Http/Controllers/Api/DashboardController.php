<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SyncLog;
use App\Models\Watch;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Dashboard KPI istatistikleri.
     *
     * GET /api/dashboard/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        // Single aggregate query for watch stats
        $watchStats = Watch::where('dealer_id', $dealer->id)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status IN ('active','reserved','draft') THEN sale_price ELSE 0 END), 0) as total_value,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN status = 'sold' AND updated_at >= ? THEN 1 ELSE 0 END) as sold_month
            ", [Carbon::now()->startOfMonth()])
            ->first();

        // Sync stats with whereIn instead of whereHas
        $watchIds = Watch::where('dealer_id', $dealer->id)->pluck('id');

        $pendingSyncs = SyncLog::whereIn('watch_id', $watchIds)
            ->where('status', 'pending')
            ->count();

        $recentSyncs = SyncLog::whereIn('watch_id', $watchIds)
            ->where('created_at', '>=', Carbon::now()->subDays(30));

        $totalSyncs = $recentSyncs->count();
        $successfulSyncs = (clone $recentSyncs)->where('status', 'success')->count();
        $syncSuccessRate = $totalSyncs > 0
            ? round(($successfulSyncs / $totalSyncs) * 100, 1)
            : 100.0;

        // Recent activities (last 10 sync logs)
        $recentActivities = SyncLog::whereIn('watch_id', $watchIds)
            ->with(['watch:id,brand,model,reference_number', 'platform:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id'      => $log->id,
                'message' => $log->watch->full_name . ' — ' . $log->platform->name,
                'status'  => $log->status,
                'time'    => $log->created_at->diffForHumans(),
            ]);

        return response()->json([
            'stats' => [
                'total_inventory_value' => (float) ($watchStats->total_value ?? 0),
                'active_watches'        => (int) ($watchStats->active_count ?? 0),
                'sold_this_month'       => (int) ($watchStats->sold_month ?? 0),
                'pending_syncs'         => $pendingSyncs,
                'sync_success_rate'     => $syncSuccessRate,
            ],
            'recent_activities' => $recentActivities,
        ]);
    }

    /**
     * Aktivite feed — polling desteği ile.
     *
     * GET /api/dashboard/activities?since=2026-04-07T10:00:00Z&limit=20
     */
    public function activities(Request $request): JsonResponse
    {
        $request->validate([
            'since' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $dealer = $request->user()->dealer;
        $limit  = min((int) $request->input('limit', 20), 50);
        $since  = $request->input('since');

        $watchIds = Watch::where('dealer_id', $dealer->id)->pluck('id');

        $query = SyncLog::whereIn('watch_id', $watchIds)
            ->with(['watch:id,brand,model,reference_number', 'platform:id,name'])
            ->orderByDesc('created_at');

        if ($since) {
            $query->where('created_at', '>', Carbon::parse($since));
        }

        $logs = $query->limit($limit)->get();

        $activities = $logs->map(fn ($log) => [
            'id'        => $log->id,
            'message'   => $log->watch->full_name . ' — ' . ($log->platform?->name ?? 'System'),
            'status'    => $log->status,
            'time'      => $log->created_at->diffForHumans(),
            'timestamp' => $log->created_at->toISOString(),
        ]);

        return response()->json([
            'activities' => $activities,
            'has_more'   => $logs->count() === $limit,
        ]);
    }

    /**
     * Bildirimler — son senkronizasyon olayları.
     *
     * GET /api/notifications?limit=20
     */
    public function notifications(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $dealer = $request->user()->dealer;
        $limit  = min((int) $request->input('limit', 20), 50);

        $watchIds = Watch::where('dealer_id', $dealer->id)->pluck('id');

        // Son 7 günün bildirimleri
        $logs = SyncLog::whereIn('watch_id', $watchIds)
            ->with(['watch:id,brand,model,reference_number', 'platform:id,name'])
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        $lastReadAt = $request->user()->notifications_read_at;

        $notifications = $logs->map(fn ($log) => [
            'id'        => $log->id,
            'title'     => $this->buildNotificationTitle($log),
            'message'   => $this->buildNotificationMessage($log),
            'type'      => $log->status === 'failed' ? 'error' : ($log->status === 'pending' ? 'info' : 'success'),
            'read'      => $lastReadAt && $log->created_at->lte($lastReadAt),
            'timestamp' => $log->created_at->toIso8601String(),
        ]);

        $unreadCount = $lastReadAt
            ? SyncLog::whereIn('watch_id', $watchIds)
                ->where('created_at', '>', $lastReadAt)
                ->count()
            : $logs->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Tüm bildirimleri okundu olarak işaretle.
     *
     * POST /api/notifications/read-all
     */
    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        $request->user()->update(['notifications_read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    // ─── Helpers ─────────────────────────────────────────────

    private function buildNotificationTitle(SyncLog $log): string
    {
        $platformName = $log->platform?->name ?? 'Platform';

        return match ($log->status) {
            'success' => "{$platformName} Senkronizasyon Başarılı",
            'failed'  => "{$platformName} Senkronizasyon Hatası",
            'pending' => "{$platformName} Senkronizasyon Bekliyor",
            default   => "{$platformName} Bildirim",
        };
    }

    private function buildNotificationMessage(SyncLog $log): string
    {
        $watchName = $log->watch?->full_name ?? 'Bilinmeyen saat';

        return match ($log->status) {
            'success' => "{$watchName} başarıyla senkronize edildi.",
            'failed'  => "{$watchName} senkronizasyonu başarısız: " . ($log->error_message ?? 'Bilinmeyen hata'),
            'pending' => "{$watchName} senkronizasyonu kuyrukta bekliyor.",
            default   => "{$watchName}",
        };
    }
}
