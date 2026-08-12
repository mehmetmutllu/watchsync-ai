<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * İsteğin dilini belirler ve uygulama diline uygular.
 *
 * Öncelik sırası:
 *   1. `X-Locale` başlığı (frontend her istekte gönderir)
 *   2. `locale` sorgu parametresi (webhook/geri dönüş bağlantıları için)
 *   3. Oturum açmış kullanıcının kayıtlı dil tercihi
 *   4. `Accept-Language` başlığı
 *   5. config('app.locale')
 */
class SetLocale
{
    public const SUPPORTED = ['tr', 'de', 'en', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolve($request);

        App::setLocale($locale);

        $response = $next($request);
        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    protected function resolve(Request $request): string
    {
        $candidates = [
            $request->header('X-Locale'),
            $request->query('locale'),
            $request->user()?->locale,
        ];

        foreach ($candidates as $candidate) {
            $normalized = $this->normalize($candidate);
            if ($normalized) {
                return $normalized;
            }
        }

        $accept = $request->header('Accept-Language');
        if ($accept) {
            foreach (explode(',', $accept) as $part) {
                $tag = trim(explode(';', $part)[0]);
                $normalized = $this->normalize($tag);
                if ($normalized) {
                    return $normalized;
                }
            }
        }

        return config('app.locale', 'en');
    }

    protected function normalize(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $base = strtolower(explode('-', trim($value))[0]);

        return in_array($base, self::SUPPORTED, true) ? $base : null;
    }
}
