<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Services\EbayOAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EbayController extends Controller
{
    public function __construct(
        private readonly EbayOAuthService $ebayOAuth,
    ) {}

    /**
     * eBay OAuth akışını başlatır — authorization URL döner.
     *
     * GET /api/ebay/auth-url
     */
    public function authUrl(Request $request): JsonResponse
    {
        $dealer = $request->user()->dealer;

        // CSRF benzeri state token — session'da saklanır
        $state = Str::random(40) . '|' . $dealer->id;

        // State'i cache'e koy (10 dk geçerli)
        cache()->put("ebay_oauth_state_{$dealer->id}", $state, 600);

        $url = $this->ebayOAuth->getAuthorizationUrl($state);

        return response()->json(['auth_url' => $url]);
    }

    /**
     * eBay OAuth callback handler.
     * eBay bu URL'e yönlendirir, authorization code ile gelir.
     *
     * GET /api/ebay/callback?code=xxx&state=xxx
     */
    public function callback(Request $request): RedirectResponse
    {
        $request->validate([
            'code'  => 'required|string',
            'state' => 'required|string',
        ]);

        $code  = $request->input('code');
        $state = $request->input('state');

        // State'den dealer_id çıkar
        $parts = explode('|', $state, 2);
        if (count($parts) !== 2) {
            return $this->redirectToFrontend('error', 'Invalid state parameter.');
        }

        $dealerId = (int) $parts[1];

        // State doğrulama (CSRF koruması)
        $cachedState = cache()->pull("ebay_oauth_state_{$dealerId}");
        if (!$cachedState || !hash_equals($cachedState, $state)) {
            return $this->redirectToFrontend('error', 'State mismatch. Please try again.');
        }

        try {
            $tokenData = $this->ebayOAuth->exchangeCodeForToken($code);

            // Platform'u bul/oluştur
            $platform = Platform::firstOrCreate(
                ['name' => 'eBay'],
                ['api_url' => 'https://api.ebay.com']
            );

            // Bağlantıyı güncelle veya oluştur
            PlatformConnection::updateOrCreate(
                [
                    'dealer_id'   => $dealerId,
                    'platform_id' => $platform->id,
                ],
                [
                    'access_token'     => $tokenData['access_token'],
                    'refresh_token'    => $tokenData['refresh_token'],
                    'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                    'status'           => 'connected',
                ]
            );

            Log::info('eBay OAuth connected', ['dealer_id' => $dealerId]);

            return $this->redirectToFrontend('success');
        } catch (\Exception $e) {
            Log::error('eBay OAuth callback failed', [
                'dealer_id' => $dealerId,
                'error'     => $e->getMessage(),
            ]);

            return $this->redirectToFrontend('error', 'Token exchange failed.');
        }
    }

    /**
     * eBay bağlantısını kopar.
     *
     * POST /api/ebay/disconnect
     */
    public function disconnect(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;

        $platform = Platform::where('name', 'eBay')->first();
        if (!$platform) {
            return response()->json(['message' => 'Platform not found.'], 404);
        }

        $connection = PlatformConnection::where('dealer_id', $dealerId)
            ->where('platform_id', $platform->id)
            ->first();

        if ($connection) {
            $connection->update([
                'access_token'     => null,
                'refresh_token'    => null,
                'token_expires_at' => null,
                'status'           => 'disconnected',
            ]);
        }

        return response()->json(['message' => 'eBay disconnected successfully.']);
    }

    /**
     * Frontend'e yönlendirme (OAuth popup kapatma).
     */
    private function redirectToFrontend(string $status, ?string $message = null): RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $query = http_build_query(array_filter([
            'ebay_auth' => $status,
            'message'   => $message,
        ]));

        return redirect("{$frontendUrl}/dashboard/settings?{$query}");
    }
}
