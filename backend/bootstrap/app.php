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

        $middleware->validateCsrfTokens(except: [
            'api/auth/login',
            'api/auth/register',
            'api/subscriptions/stripe-webhook',
            'api/webhooks/*',
        ]);

        // Global API middleware — güvenlik header'ları + istek dili
        $middleware->api(prepend: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\SetLocale::class,
        ]);

        // Web rotaları (e-posta doğrulama, fatura PDF vb.) da dili izlesin
        $middleware->web(prepend: [
            \App\Http\Middleware\SetLocale::class,
        ]);

        // Disabled kullanıcı hiçbir API rotasına erişemez (oturumu olsa bile)
        $middleware->api(append: [
            \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        $middleware->alias([
            'ip.whitelist'     => \App\Http\Middleware\IpWhitelist::class,
            'cache.headers'    => \App\Http\Middleware\CacheHeaders::class,
            'admin'            => \App\Http\Middleware\AdminAuth::class,
            'admin.permission' => \App\Http\Middleware\AdminPermission::class,
            'permission'       => \App\Http\Middleware\DealerPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();
