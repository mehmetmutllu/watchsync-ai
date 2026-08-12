<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Watch;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ReportController extends Controller
{
    /**
     * Gelir tablosu.
     *
     * GET /api/admin/reports/revenue
     */
    public function revenue(Request $request): JsonResponse
    {
        $query = Invoice::with('dealer:id,name,company_name')
            ->where('status', 'paid');

        if ($from = $request->query('from')) {
            $query->where('updated_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('updated_at', '<=', $to);
        }
        if ($dealerId = $request->query('dealer_id')) {
            $query->where('dealer_id', $dealerId);
        }

        $invoices = $query->latest('updated_at')->paginate(20);

        $totalRevenue = (clone $query)->sum('total');

        return response()->json([
            'invoices'      => $invoices,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }

    /**
     * Platform bazında komisyon raporu.
     *
     * GET /api/admin/reports/commissions
     */
    public function commissions(): JsonResponse
    {
        // Platform bazında satış kırılımı
        $platforms = \App\Models\SyncLog::selectRaw('
                platform_id,
                COUNT(CASE WHEN status = \'success\' THEN 1 END) as successful_syncs,
                COUNT(*) as total_syncs
            ')
            ->groupBy('platform_id')
            ->with('platform:id,name')
            ->get()
            ->map(fn ($log) => [
                'platform'         => $log->platform->name ?? 'Bilinmiyor',
                'successful_syncs' => $log->successful_syncs,
                'total_syncs'      => $log->total_syncs,
                'success_rate'     => $log->total_syncs > 0
                    ? round(($log->successful_syncs / $log->total_syncs) * 100, 1)
                    : 0,
            ]);

        return response()->json(['commissions' => $platforms]);
    }

    /**
     * CSV export.
     *
     * GET /api/admin/reports/export
     */
    public function export(Request $request)
    {
        $request->validate([
            'type' => 'required|in:revenue,watches,users',
            'from' => 'nullable|date',
            'to'   => 'nullable|date',
        ]);

        $type = $request->query('type');
        $from = $request->query('from');
        $to = $request->query('to');

        $rows = collect();
        $headers = [];

        if ($type === 'revenue') {
            $headers = ['Fatura No', 'Bayi', 'Toplam', 'Durum', 'Tarih'];
            $query = Invoice::with('dealer:id,name')->where('status', 'paid');
            if ($from) $query->where('updated_at', '>=', $from);
            if ($to) $query->where('updated_at', '<=', $to);

            $rows = $query->get()->map(fn ($inv) => [
                $inv->invoice_number,
                $inv->dealer->name ?? '-',
                $inv->total,
                $inv->status,
                $inv->updated_at->toDateString(),
            ]);
        } elseif ($type === 'watches') {
            $headers = ['Marka', 'Model', 'Referans', 'Fiyat', 'Durum', __('api.col_validation'), 'Bayi'];
            $query = Watch::with('dealer:id,name');
            if ($from) $query->where('created_at', '>=', $from);
            if ($to) $query->where('created_at', '<=', $to);

            $rows = $query->get()->map(fn ($w) => [
                $w->brand,
                $w->model,
                $w->reference_number ?? '-',
                $w->sale_price ?? '-',
                $w->status,
                $w->validation_status ?? 'pending',
                $w->dealer->name ?? '-',
            ]);
        } elseif ($type === 'users') {
            $headers = ['İsim', 'E-posta', 'Rol', __('api.col_registered_at'), 'Bayi'];
            $query = \App\Models\User::with('dealer:id,name');
            if ($from) $query->where('created_at', '>=', $from);
            if ($to) $query->where('created_at', '<=', $to);

            $rows = $query->get()->map(fn ($u) => [
                $u->name,
                $u->email,
                $u->role,
                $u->created_at->toDateString(),
                $u->dealer->name ?? '-',
            ]);
        }

        $csv = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"', $row)) . "\n";
        }

        return Response::make($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$type}_report.csv",
        ]);
    }
}
