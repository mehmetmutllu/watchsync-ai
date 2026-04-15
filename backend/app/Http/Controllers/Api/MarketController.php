<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarketScrapingService;
use App\Models\PriceAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MarketController extends Controller
{
    public function __construct(
        private MarketScrapingService $scrapingService,
    ) {}

    /**
     * GET /api/market/prices/{ref}
     */
    public function prices(Request $request, string $ref): JsonResponse
    {
        $period = $request->query('period', '30d');

        if (!in_array($period, ['7d', '30d', '90d', '6m', '1y', '3y'])) {
            $period = '30d';
        }

        $stats = $this->scrapingService->getPriceStats($ref, $period);

        return response()->json(['data' => $stats]);
    }

    /**
     * GET /api/market/competitors/{ref}
     */
    public function competitors(string $ref): JsonResponse
    {
        $listings = $this->scrapingService->getCompetitorListings($ref);

        return response()->json(['data' => $listings]);
    }

    /**
     * POST /api/market/scan
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'reference_number' => 'required|string|max:100',
        ]);

        $result = $this->scrapingService->scan($request->input('reference_number'));

        $status = $result['success'] ? 200 : 503;

        return response()->json($result, $status);
    }

    /**
     * GET /api/market/ebay-test
     * eBay Browse API connection test + sample search.
     */
    public function ebayTest(Request $request): JsonResponse
    {
        $clientId = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');
        $sandbox = config('services.ebay.sandbox');

        if (!$clientId || !$clientSecret) {
            return response()->json([
                'status' => 'not_configured',
                'message' => 'EBAY_CLIENT_ID ve EBAY_CLIENT_SECRET .env dosyasında tanımlanmalıdır.',
                'environment' => $sandbox ? 'sandbox' : 'production',
            ], 422);
        }

        // Step 1: Get app token
        try {
            $tokenUrl = $sandbox
                ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
                : 'https://api.ebay.com/identity/v1/oauth2/token';

            $tokenResponse = Http::asForm()
                ->withBasicAuth($clientId, $clientSecret)
                ->timeout(15)
                ->post($tokenUrl, [
                    'grant_type' => 'client_credentials',
                    'scope'      => 'https://api.ebay.com/oauth/api_scope',
                ]);

            if (!$tokenResponse->successful()) {
                return response()->json([
                    'status' => 'auth_failed',
                    'message' => 'eBay OAuth token alınamadı. Client ID/Secret kontrol edin.',
                    'environment' => $sandbox ? 'sandbox' : 'production',
                    'error_status' => $tokenResponse->status(),
                ], 401);
            }

            $token = $tokenResponse->json('access_token');
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'connection_error',
                'message' => 'eBay OAuth sunucusuna bağlanılamadı: ' . $e->getMessage(),
                'environment' => $sandbox ? 'sandbox' : 'production',
            ], 503);
        }

        // Step 2: Test Browse API with a sample search
        $testRef = $request->query('ref', '126610LN');
        try {
            $baseUrl = $sandbox
                ? 'https://api.sandbox.ebay.com'
                : 'https://api.ebay.com';

            $browseResponse = Http::withToken($token)
                ->withHeaders([
                    'X-EBAY-C-MARKETPLACE-ID' => 'EBAY_US',
                    'Content-Type'            => 'application/json',
                ])
                ->timeout(30)
                ->get("{$baseUrl}/buy/browse/v1/item_summary/search", [
                    'q'            => $testRef,
                    'category_ids' => '281',
                    'limit'        => 5,
                    'filter'       => 'buyingOptions:{FIXED_PRICE}',
                    'fieldgroups'  => 'MATCHING_ITEMS',
                ]);

            $browseData = $browseResponse->json();
            $totalItems = $browseData['total'] ?? 0;
            $sampleItems = collect($browseData['itemSummaries'] ?? [])
                ->take(3)
                ->map(fn ($item) => [
                    'title' => $item['title'] ?? '',
                    'price' => ($item['price']['value'] ?? 0) . ' ' . ($item['price']['currency'] ?? 'USD'),
                    'condition' => $item['condition'] ?? 'N/A',
                    'url' => $item['itemWebUrl'] ?? '',
                ])
                ->toArray();

            return response()->json([
                'status' => 'ok',
                'message' => "eBay Browse API bağlantısı başarılı. '{$testRef}' için {$totalItems} sonuç bulundu.",
                'environment' => $sandbox ? 'sandbox' : 'production',
                'token_type' => 'client_credentials',
                'test_reference' => $testRef,
                'total_results' => $totalItems,
                'sample_items' => $sampleItems,
                'browse_api_status' => $browseResponse->status(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'browse_api_error',
                'message' => 'eBay token alındı ama Browse API sorgusu başarısız: ' . $e->getMessage(),
                'environment' => $sandbox ? 'sandbox' : 'production',
                'token_acquired' => true,
            ], 503);
        }
    }

        return response()->json($result, $status);
    }

    /**
     * GET /api/market/watchcharts-trend/{ref}
     */
    public function watchChartsTrend(Request $request, string $ref): JsonResponse
    {
        $period = $request->query('period', '1y');

        if (!in_array($period, ['6m', '1y', '3y'])) {
            $period = '1y';
        }

        $trend = $this->scrapingService->getWatchChartsTrend($ref, $period);

        if ($trend === null) {
            return response()->json([
                'data' => null,
                'message' => 'WatchCharts API yapılandırılmamış veya kullanılamıyor.',
            ]);
        }

        return response()->json(['data' => $trend]);
    }

    /**
     * GET /api/price-alerts
     */
    public function alertIndex(Request $request): JsonResponse
    {
        $alerts = PriceAlert::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $alerts]);
    }

    /**
     * POST /api/price-alerts
     */
    public function alertStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference_number' => 'required|string|max:100',
            'target_price' => 'required|numeric|min:0',
            'direction' => 'required|in:below,above',
        ]);

        $alert = PriceAlert::create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        return response()->json(['data' => $alert], 201);
    }

    /**
     * DELETE /api/price-alerts/{id}
     */
    public function alertDestroy(Request $request, int $id): JsonResponse
    {
        $alert = PriceAlert::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $alert->delete();

        return response()->json(['message' => 'Fiyat uyarısı silindi.']);
    }
}
