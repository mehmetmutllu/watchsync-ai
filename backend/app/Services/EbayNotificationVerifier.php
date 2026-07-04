<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * eBay Event Notification imza doğrulaması.
 *
 * eBay, `X-EBAY-SIGNATURE` header'ında base64 kodlu bir JSON gönderir:
 *   {"alg":"ecdsa","kid":"<publicKeyId>","signature":"<base64>","digest":"SHA1"}
 * İmza, ham gövde (raw body) üzerinde eBay'in public key'i ile üretilir.
 * Public key, Notification API'den `kid` ile çekilir ve cache'lenir.
 *
 * Fail-closed: header ayrıştırılamazsa, public key çözülemezse veya
 * imza geçersizse `false` döner — şüpheli/sahte webhook reddedilir.
 */
class EbayNotificationVerifier
{
    public function verify(string $signatureHeader, string $rawBody): bool
    {
        $meta = $this->parseSignatureHeader($signatureHeader);
        if ($meta === null) {
            return false;
        }

        $publicKeyPem = $this->resolvePublicKey($meta['kid']);
        if ($publicKeyPem === null) {
            Log::warning('eBay webhook: public key çözülemedi', ['kid' => $meta['kid']]);
            return false;
        }

        $signature = base64_decode($meta['signature'], true);
        if ($signature === false || $signature === '') {
            return false;
        }

        $algo = strtoupper($meta['digest']) === 'SHA256'
            ? OPENSSL_ALGO_SHA256
            : OPENSSL_ALGO_SHA1;

        return openssl_verify($rawBody, $signature, $publicKeyPem, $algo) === 1;
    }

    /**
     * @return array{kid: string, signature: string, digest: string}|null
     */
    private function parseSignatureHeader(string $header): ?array
    {
        $decoded = base64_decode($header, true);
        if ($decoded === false) {
            return null;
        }

        $json = json_decode($decoded, true);
        if (! is_array($json) || empty($json['kid']) || empty($json['signature'])) {
            return null;
        }

        return [
            'kid'       => (string) $json['kid'],
            'signature' => (string) $json['signature'],
            'digest'    => (string) ($json['digest'] ?? 'SHA1'),
        ];
    }

    /**
     * Public key'i cache üzerinden çöz. Test alt sınıfı bu metodu override eder.
     */
    protected function resolvePublicKey(string $keyId): ?string
    {
        return Cache::remember(
            "ebay_public_key_{$keyId}",
            now()->addHours(6),
            fn () => $this->fetchPublicKey($keyId),
        );
    }

    /**
     * eBay Notification API'den public key'i çeker (PEM).
     */
    protected function fetchPublicKey(string $keyId): ?string
    {
        $token = $this->appToken();
        if ($token === null) {
            return null;
        }

        $base = config('services.ebay.sandbox')
            ? 'https://api.sandbox.ebay.com'
            : 'https://api.ebay.com';

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->get("{$base}/commerce/notification/v1/public_key/{$keyId}");

            if (! $response->successful()) {
                return null;
            }

            $key = $response->json('key');

            return $key ? $this->normalizePem((string) $key) : null;
        } catch (\Throwable $e) {
            Log::warning('eBay public key çekilemedi', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Ham base64 DER key'i PEM sarmalına al (zaten PEM ise dokunma).
     */
    private function normalizePem(string $key): string
    {
        if (str_contains($key, 'BEGIN PUBLIC KEY')) {
            return $key;
        }

        $wrapped = chunk_split(trim($key), 64, "\n");

        return "-----BEGIN PUBLIC KEY-----\n{$wrapped}-----END PUBLIC KEY-----\n";
    }

    /**
     * client_credentials app token (Notification API çağrıları için).
     */
    protected function appToken(): ?string
    {
        $clientId     = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return null;
        }

        return Cache::remember('ebay_app_token', now()->addSeconds(7000), function () use ($clientId, $clientSecret) {
            $base = config('services.ebay.sandbox')
                ? 'https://api.sandbox.ebay.com'
                : 'https://api.ebay.com';

            try {
                $response = Http::asForm()
                    ->withBasicAuth($clientId, $clientSecret)
                    ->post("{$base}/identity/v1/oauth2/token", [
                        'grant_type' => 'client_credentials',
                        'scope'      => 'https://api.ebay.com/oauth/api_scope',
                    ]);

                return $response->successful() ? $response->json('access_token') : null;
            } catch (\Throwable $e) {
                Log::warning('eBay app token alınamadı', ['message' => $e->getMessage()]);
                return null;
            }
        });
    }
}
