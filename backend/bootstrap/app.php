<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA stateful authentication (httpOnly cookie)
        $middleware->statefulApi();

        // Global API middleware — tüm API yanıtlarına güvenlik header'ları ekle
        $middleware->api(prepend: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'ip.whitelist'     => \App\Http\Middleware\IpWhitelist::class,
            'cache.headers'    => \App\Http\Middleware\CacheHeaders::class,
            'admin'            => \App\Http\Middleware\AdminAuth::class,
            'admin.permission' => \App\Http\Middleware\AdminPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();
