<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SystemSettingController extends Controller
{
    /**
     * Tüm ayarları getir.
     *
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = SystemSetting::all()
            ->mapWithKeys(fn ($s) => [$s->key => $s->value]);

        return response()->json(['settings' => $settings]);
    }

    /**
     * Ayarları güncelle (toplu).
     *
     * PUT /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings'        => 'required|array',
            'settings.*.key'  => 'required|string',
            'settings.*.value' => 'present',
        ]);

        $adminUser = $request->attributes->get('adminUser');

        foreach ($request->settings as $item) {
            $setting = SystemSetting::where('key', $item['key'])->first();
            if ($setting) {
                $oldValue = $setting->value;

                // Tipe göre value'yu dönüştür
                $newValue = match ($setting->type) {
                    'boolean' => $item['value'] ? '1' : '0',
                    'json'    => is_string($item['value']) ? $item['value'] : json_encode($item['value']),
                    default   => (string) $item['value'],
                };

                $setting->update([
                    'value'      => $newValue,
                    'updated_by' => $adminUser->user_id,
                ]);

                // Cache temizle
                Cache::forget("system_setting:{$item['key']}");

                AdminActivityLog::create([
                    'admin_user_id' => $adminUser->id,
                    'action'        => 'setting.update',
                    'target_type'   => SystemSetting::class,
                    'target_id'     => $setting->id,
                    'details'       => [
                        'key'       => $item['key'],
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                    ],
                    'ip_address' => $request->ip(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Ayarlar güncellendi.',
        ]);
    }

    /**
     * Sistem sağlık durumu.
     *
     * GET /api/admin/system/health
     */
    public function health(): JsonResponse
    {
        $health = [
            'status' => 'healthy',
            'checks' => [],
        ];

        // MySQL
        try {
            DB::select('SELECT 1');
            $health['checks']['mysql'] = ['status' => 'ok'];
        } catch (\Exception $e) {
            $health['checks']['mysql'] = ['status' => 'error', 'message' => $e->getMessage()];
            $health['status'] = 'degraded';
        }

        // Redis
        try {
            Redis::ping();
            $health['checks']['redis'] = ['status' => 'ok'];
        } catch (\Exception $e) {
            $health['checks']['redis'] = ['status' => 'error', 'message' => $e->getMessage()];
            $health['status'] = 'degraded';
        }

        // Disk
        $freeBytes = disk_free_space('/');
        $totalBytes = disk_total_space('/');
        $usedPercent = round((1 - $freeBytes / $totalBytes) * 100, 1);
        $health['checks']['disk'] = [
            'status'       => $usedPercent > 90 ? 'warning' : 'ok',
            'used_percent' => $usedPercent,
        ];

        // Queue (son 5 dk'da başarılı job var mı)
        try {
            $failedJobs = DB::table('failed_jobs')->count();
            $health['checks']['queue'] = [
                'status'      => $failedJobs > 10 ? 'warning' : 'ok',
                'failed_jobs' => $failedJobs,
            ];
        } catch (\Exception) {
            $health['checks']['queue'] = ['status' => 'unknown'];
        }

        return response()->json($health);
    }
}
