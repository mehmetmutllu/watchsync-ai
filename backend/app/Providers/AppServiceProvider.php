<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Services\Contracts\IMarketProvider::class, \App\Services\MarketDataService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureModels();
        $this->configureSlowQueryLogging();
    }

    /**
     * Granüler rate limiting tanımları.
     */
    protected function configureRateLimiting(): void
    {
        // Genel API limiti — kullanıcı bazlı
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Envanter yazma işlemleri (create/update/delete) — daha düşük limit
        RateLimiter::for('inventory-write', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Platform senkronizasyon — platform API rate limit'lerine uyum
        RateLimiter::for('platform-sync', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // Toplu işlemler — çok düşük limit
        RateLimiter::for('bulk-operations', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // PDF/dosya indirme — abuse önleme
        RateLimiter::for('downloads', function (Request $request) {
            return Limit::perMinute(15)->by($request->user()?->id ?: $request->ip());
        });

        // Ayarlar güncelleme — düşük limit
        RateLimiter::for('settings', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Model güvenlik — lazy loading koruması (N+1 önleme).
     */
    protected function configureModels(): void
    {
        // Development ortamında lazy loading algılandığında exception fırlat
        Model::preventLazyLoading(!app()->isProduction());

        // Tabloda olmayan attribute'lara erişimi engelle
        Model::preventSilentlyDiscardingAttributes(!app()->isProduction());
    }

    /**
     * Yavaş sorgu loglaması — 500ms üzeri sorgular loglanır.
     */
    protected function configureSlowQueryLogging(): void
    {
        DB::whenQueryingForLongerThan(500, function ($connection) {
            Log::warning('Database queries exceeded 500ms on connection: ' . $connection->getName());
        });
    }
}
