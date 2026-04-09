<?php

namespace App\Services;

use App\Models\PlatformConnection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EbayOAuthService
{
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;
    private bool $sandbox;
    private array $scopes;

    public function __construct()
    {
        $config = config('services.ebay');

        $this->clientId     = $config['client_id'] ?? '';
        $this->clientSecret = $config['client_secret'] ?? '';
        $this->redirectUri  = $config['redirect_uri'] ?? '';
        $this->sandbox      = (bool) ($config['sandbox'] ?? true);
        $this->scopes       = $config['scopes'] ?? [];
    }

    /**
     * eBay OAuth Authorization URL oluşturur.
     */
    public function getAuthorizationUrl(string $state): string
    {
        $baseUrl = $this->sandbox
            ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
            : 'https://auth.ebay.com/oauth2/authorize';

        $params = [
            'client_id'     => $this->clientId,
            'redirect_uri'  => $this->redirectUri,
            'response_type' => 'code',
            'scope'         => implode(' ', $this->scopes),
            'state'         => $state,
        ];

        return $baseUrl . '?' . http_build_query($params);
    }

    /**
     * Authorization code → Access Token + Refresh Token exchange.
     *
     * @return array{access_token: string, refresh_token: string, expires_in: int}
     */
    public function exchangeCodeForToken(string $code): array
    {
        $tokenUrl = $this->sandbox
            ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
            : 'https://api.ebay.com/identity/v1/oauth2/token';

        $response = Http::asForm()
            ->withBasicAuth($this->clientId, $this->clientSecret)
            ->post($tokenUrl, [
                'grant_type'   => 'authorization_code',
                'code'         => $code,
                'redirect_uri' => $this->redirectUri,
            ]);

        if (!$response->successful()) {
            Log::error('eBay token exchange failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException('eBay token exchange failed: ' . $response->body());
        }

        $data = $response->json();

        return [
            'access_token'  => $data['access_token'],
            'refresh_token' => $data['refresh_token'] ?? '',
            'expires_in'    => (int) ($data['expires_in'] ?? 7200),
        ];
    }

    /**
     * Refresh token ile yeni access token alır.
     *
     * @return array{access_token: string, expires_in: int}
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        $tokenUrl = $this->sandbox
            ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
            : 'https://api.ebay.com/identity/v1/oauth2/token';

        $response = Http::asForm()
            ->withBasicAuth($this->clientId, $this->clientSecret)
            ->post($tokenUrl, [
                'grant_type'    => 'refresh_token',
                'refresh_token' => $refreshToken,
                'scope'         => implode(' ', $this->scopes),
            ]);

        if (!$response->successful()) {
            Log::error('eBay token refresh failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException('eBay token refresh failed: ' . $response->body());
        }

        $data = $response->json();

        return [
            'access_token' => $data['access_token'],
            'expires_in'   => (int) ($data['expires_in'] ?? 7200),
        ];
    }

    /**
     * PlatformConnection üzerindeki token'ı yeniler.
     */
    public function refreshConnectionToken(PlatformConnection $connection): void
    {
        if (!$connection->refresh_token) {
            Log::warning('eBay connection has no refresh token', ['connection_id' => $connection->id]);
            return;
        }

        try {
            $result = $this->refreshAccessToken($connection->refresh_token);

            $connection->update([
                'access_token'    => $result['access_token'],
                'token_expires_at' => now()->addSeconds($result['expires_in']),
                'status'          => 'connected',
            ]);
        } catch (\RuntimeException $e) {
            $connection->update(['status' => 'error']);
            Log::error('Failed to refresh eBay token for connection', [
                'connection_id' => $connection->id,
                'error'         => $e->getMessage(),
            ]);
        }
    }

    /**
     * API temel URL'sini döner.
     */
    public function getApiBaseUrl(): string
    {
        return $this->sandbox
            ? 'https://api.sandbox.ebay.com'
            : 'https://api.ebay.com';
    }
}
