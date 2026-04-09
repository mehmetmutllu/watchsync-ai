<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IpWhitelist
{
    /**
     * IP Whitelist middleware — sadece izin verilen IP adreslerinden gelen istekleri kabul eder.
     * Boş whitelist = tüm IP'lere izin ver (geliştirme ortamı).
     */
    public function handle(Request $request, Closure $next, string $configKey = 'chrono24'): Response
    {
        $allowedIps = config("services.{$configKey}.ip_whitelist", []);

        // Whitelist boşsa (geliştirme ortamı), tüm isteklere izin ver
        if (empty($allowedIps)) {
            return $next($request);
        }

        $clientIp = $request->ip();

        if (!in_array($clientIp, $allowedIps, true)) {
            abort(403, 'IP address not authorized.');
        }

        return $next($request);
    }
}
