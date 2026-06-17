<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dealer;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Watch;
use App\Models\AdminActivityLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /**
     * Admin dashboard KPI istatistikleri.
     *
     * GET /api/admin/dashboard/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $now = Carbon::now();

        // Toplam bayi sayısı
        $totalDealers = Dealer::count();
        $activeDealers = Dealer::where('status', 'active')->count();

        // Toplam kullanıcı sayısı
        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', $now->copy()->startOfMonth())->count();

        // Saat istatistikleri
        $totalWatches = Watch::count();
        $activeWatches = Watch::where('status', 'active')->count();
        $soldThisMonth = Watch::where('status', 'sold')
            ->where('updated_at', '>=', $now->copy()->startOfMonth())
            ->count();

        // Toplam envanter değeri
        $totalInventoryValue = Watch::whereIn('status', ['active', 'reserved', 'draft'])
            ->sum('sale_price');

        // Toplam satış (fatura) geliri
        $totalRevenue = Invoice::where('status', 'paid')
            ->sum('total');
        $revenueThisMonth = Invoice::where('status', 'paid')
            ->where('updated_at', '>=', $now->copy()->startOfMonth())
            ->sum('total');

        return response()->json([
            'stats' => [
                'total_dealers'        => $totalDealers,
                'active_dealers'       => $activeDealers,
                'total_users'          => $totalUsers,
                'new_users_this_month' => $newUsersThisMonth,
                'total_watches'        => $totalWatches,
                'active_watches'       => $activeWatches,
                'sold_this_month'      => $soldThisMonth,
                'total_inventory_value' => (float) $totalInventoryValue,
                'total_revenue'        => (float) $totalRevenue,
                'revenue_this_month'   => (float) $revenueThisMonth,
            ],
        ]);
    }

    /**
     * Gelir grafiği verisi (son 12 ay).
     *
     * GET /api/admin/dashboard/revenue-chart
     */
    public function revenueChart(Request $request): JsonResponse
    {
        $months = collect();

        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $revenue = Invoice::where('status', 'paid')
                ->whereBetween('updated_at', [$start, $end])
                ->sum('total');

            $sales = Watch::where('status', 'sold')
                ->whereBetween('updated_at', [$start, $end])
                ->count();

            $months->push([
                'month'   => $date->format('Y-m'),
                'label'   => $date->translatedFormat('M Y'),
                'revenue' => (float) $revenue,
                'sales'   => $sales,
            ]);
        }

        return response()->json(['chart' => $months]);
    }

    /**
     * Son admin aktiviteleri.
     *
     * GET /api/admin/dashboard/recent-activities
     */
    public function recentActivities(Request $request): JsonResponse
    {
        $activities = AdminActivityLog::with('adminUser.user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($log) => [
                'id'         => $log->id,
                'admin_name' => $log->adminUser->user->name ?? 'Bilinmiyor',
                'action'     => $log->action,
                'details'    => $log->details,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
                'time_ago'   => $log->created_at->diffForHumans(),
            ]);

        return response()->json(['activities' => $activities]);
    }

    /**
     * Kullanıcı büyüme grafiği (son 12 ay).
     *
     * GET /api/admin/dashboard/user-growth
     */
    public function userGrowth(Request $request): JsonResponse
    {
        $months = collect();

        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $newUsers = User::whereBetween('created_at', [$start, $end])->count();
            $newDealers = Dealer::whereBetween('created_at', [$start, $end])->count();

            $months->push([
                'month'       => $date->format('Y-m'),
                'label'       => $date->translatedFormat('M Y'),
                'new_users'   => $newUsers,
                'new_dealers' => $newDealers,
            ]);
        }

        return response()->json(['chart' => $months]);
    }
}
