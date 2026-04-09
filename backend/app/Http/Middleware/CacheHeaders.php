<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CacheHeaders
{
    /**
     * GET isteklerine uygun Cache-Control + ETag header'ları ekle.
     * Yazma istekleri (POST/PUT/DELETE) cache'lenmez.
     */
    public function handle(Request $request, Closure $next, string $maxAge = '60'): Response
    {
        $response = $next($request);

        // Sadece başarılı GET isteklerine cache header ekle
        if (!$request->isMethod('GET') || $response->getStatusCode() >= 400) {
            $response->headers->set('Cache-Control', 'no-store');
            return $response;
        }

        $content = $response->getContent();

        if ($content) {
            $etag = '"' . md5($content) . '"';

            // İstemci If-None-Match gönderdi mi?
            if ($request->header('If-None-Match') === $etag) {
                return response('', 304)->withHeaders([
                    'ETag' => $etag,
                    'Cache-Control' => "private, max-age={$maxAge}",
                ]);
            }

            $response->headers->set('ETag', $etag);
        }

        $response->headers->set('Cache-Control', "private, max-age={$maxAge}");

        return $response;
    }
}
