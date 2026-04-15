<?php

namespace App\Services;

use App\Models\PriceHistory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class MarketScrapingService
{
    private string $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = config('services.ai.base_url', 'http://ai-service:8001');
    }

    /**
     * Scan all available sources for a watch reference number.
     *
     * Priority order:
     *   1. eBay Browse API  — FREE, official, zero ban risk
     *   2. AI service (Chrono24 + Watchfinder JSON-LD) — FREE, minimal risk
     *   3. WatchCharts API  — PAID, optional (only if key configured)
     */
    public function scan(string $referenceNumber): array
    {
        $results = [];
        $sources = [];

        // Tier 1: eBay Browse API (FREE, zero risk)
        try {
            $ebayResults = $this->scanEbayBrowseApi($referenceNumber);
            $results = array_merge($results, $ebayResults);
            if (!empty($ebayResults)) {
                $sources[] = 'ebay';
            }
        } catch (\Throwable $e) {
            Log::warning('eBay Browse API scan failed', ['ref' => $referenceNumber, 'error' => $e->getMessage()]);
        }

        // Tier 2: AI service — Chrono24 + Watchfinder JSON-LD (FREE, minimal risk)
        try {
            $aiResults = $this->scanAiService($referenceNumber);
            $results = array_merge($results, $aiResults);
            if (!empty($aiResults)) {
                $sources[] = 'ai-service';
            }
        } catch (\Throwable $e) {
            Log::warning('AI service scan failed', ['ref' => $referenceNumber, 'error' => $e->getMessage()]);
        }

        // Tier 3: WatchCharts API (PAID, optional)
        try {
            $watchChartsResults = $this->scanWatchCharts($referenceNumber);
            $results = array_merge($results, $watchChartsResults);
            if (!empty($watchChartsResults)) {
                $sources[] = 'watchcharts';
            }
        } catch (\Throwable $e) {
            Log::warning('WatchCharts scan failed', ['ref' => $referenceNumber, 'error' => $e->getMessage()]);
        }

        // Store all results
        $stored = 0;
        foreach ($results as $item) {
            if (($item['price'] ?? 0) <= 0) continue;

            PriceHistory::create([
                'reference_number' => $referenceNumber,
                'source'           => $item['source'] ?? 'unknown',
                'price'            => $item['price'],
                'currency'         => $item['currency'] ?? 'EUR',
                'condition'        => $item['condition'] ?? null,
                'seller'           => $item['seller'] ?? null,
                'url'              => $item['url'] ?? null,
                'country'          => $item['country'] ?? null,
                'scraped_date'     => now()->toDateString(),
            ]);
            $stored++;
        }

        Log::info('Market scan completed', [
            'ref' => $referenceNumber,
            'sources' => $sources,
            'total' => $stored,
        ]);

        return [
            'success' => true,
            'count'   => $stored,
            'sources' => $sources,
        ];
    }

    // ================================================================
    // Tier 1: eBay Browse API (FREE, official, zero ban risk)
    // Uses client_credentials grant — app-level token, no user login.
    // Category 281 = Wristwatches.
    // ================================================================

    private function scanEbayBrowseApi(string $ref): array
    {
        $clientId = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');

        if (!$clientId || !$clientSecret) {
            return [];
        }

        $token = $this->getEbayAppToken();
        if (!$token) {
            return [];
        }

        $baseUrl = config('services.ebay.sandbox')
            ? 'https://api.sandbox.ebay.com'
            : 'https://api.ebay.com';

        $response = Http::withToken($token)
            ->withHeaders([
                'X-EBAY-C-MARKETPLACE-ID' => 'EBAY_US',
                'Content-Type'            => 'application/json',
            ])
            ->timeout(30)
            ->get("{$baseUrl}/buy/browse/v1/item_summary/search", [
                'q'              => $ref,
                'category_ids'   => '281',
                'limit'          => 20,
                'filter'         => 'buyingOptions:{FIXED_PRICE}',
                'fieldgroups'    => 'MATCHING_ITEMS',
            ]);

        if (!$response->successful()) {
            Log::warning('eBay Browse API search failed', [
                'ref'    => $ref,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return [];
        }

        $data = $response->json();
        $items = [];

        foreach ($data['itemSummaries'] ?? [] as $summary) {
            $price = (float) ($summary['price']['value'] ?? 0);
            if ($price <= 0) continue;

            $items[] = [
                'source'    => 'ebay',
                'price'     => $price,
                'currency'  => $summary['price']['currency'] ?? 'USD',
                'condition' => $summary['condition'] ?? null,
                'seller'    => $summary['seller']['username'] ?? null,
                'url'       => $summary['itemWebUrl'] ?? null,
                'country'   => $summary['itemLocation']['country'] ?? null,
            ];
        }

        Log::info('eBay Browse API returned results', ['ref' => $ref, 'count' => count($items)]);
        return $items;
    }

    /**
     * Get an eBay app-level access token via client_credentials grant.
     * Cached for its lifetime (default: 7200s / 2 hours).
     */
    private function getEbayAppToken(): ?string
    {
        return Cache::remember('ebay_app_token', 7000, function () {
            $clientId = config('services.ebay.client_id');
            $clientSecret = config('services.ebay.client_secret');
            $sandbox = config('services.ebay.sandbox');

            $tokenUrl = $sandbox
                ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
                : 'https://api.ebay.com/identity/v1/oauth2/token';

            $response = Http::asForm()
                ->withBasicAuth($clientId, $clientSecret)
                ->timeout(15)
                ->post($tokenUrl, [
                    'grant_type' => 'client_credentials',
                    'scope'      => 'https://api.ebay.com/oauth/api_scope',
                ]);

            if (!$response->successful()) {
                Log::error('eBay app token request failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            return $response->json('access_token');
        });
    }

    // ================================================================
    // Tier 2: AI service — Chrono24 + Watchfinder JSON-LD
    // ================================================================

    private function scanAiService(string $ref): array
    {
        $response = Http::timeout(90)
            ->post("{$this->aiServiceUrl}/api/scraping/scan", [
                'reference_number' => $ref,
            ]);

        if (!$response->successful()) {
            Log::warning('AI service scan failed', ['ref' => $ref, 'status' => $response->status()]);
            return [];
        }

        return $response->json('results') ?? [];
    }

    // ================================================================
    // Tier 3: WatchCharts API (optional paid, if key configured)
    // ================================================================

    private function scanWatchCharts(string $ref): array
    {
        $apiKey = config('services.watchcharts.api_key');
        if (!$apiKey) {
            return [];
        }

        $response = Http::withToken($apiKey)
            ->withHeaders(['Accept' => 'application/json', 'User-Agent' => 'WatchSyncAI/1.0'])
            ->timeout(30)
            ->get('https://watchcharts.com/api/v2/search', [
                'q'     => $ref,
                'limit' => 20,
            ]);

        if (!$response->successful()) {
            Log::warning('WatchCharts API failed', ['ref' => $ref, 'status' => $response->status()]);
            return [];
        }

        $data = $response->json();
        $items = [];

        foreach (($data['data'] ?? $data['results'] ?? $data['listings'] ?? []) as $listing) {
            $price = (float) ($listing['price'] ?? $listing['market_price'] ?? $listing['avg_price'] ?? 0);
            if ($price <= 0) continue;

            $items[] = [
                'source'    => 'watchcharts',
                'price'     => $price,
                'currency'  => $listing['currency'] ?? 'EUR',
                'condition' => $listing['condition'] ?? null,
                'seller'    => $listing['dealer'] ?? $listing['seller'] ?? null,
                'url'       => $listing['url'] ?? $listing['link'] ?? null,
                'country'   => $listing['country'] ?? null,
            ];
        }

        return $items;
    }

    /**
     * Get price stats from stored price_histories.
     */
    public function getPriceStats(string $referenceNumber, string $period = '30d'): array
    {
        $since = $this->periodToDate($period);

        $query = PriceHistory::where('reference_number', $referenceNumber)
            ->where('scraped_date', '>=', $since);

        $stats = $query->selectRaw('
            AVG(price) as avg_price,
            MIN(price) as min_price,
            MAX(price) as max_price,
            COUNT(*) as total_listings
        ')->first();

        $trend = $this->calculateTrend($referenceNumber, $since);

        $history = PriceHistory::where('reference_number', $referenceNumber)
            ->where('scraped_date', '>=', $since)
            ->selectRaw('scraped_date, AVG(price) as avg_price')
            ->groupBy('scraped_date')
            ->orderBy('scraped_date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->scraped_date->format('Y-m-d'),
                'price' => round((float) $row->avg_price, 2),
            ]);

        return [
            'reference_number' => $referenceNumber,
            'period' => $period,
            'avg_price' => round((float) ($stats->avg_price ?? 0), 2),
            'min_price' => round((float) ($stats->min_price ?? 0), 2),
            'max_price' => round((float) ($stats->max_price ?? 0), 2),
            'total_listings' => (int) ($stats->total_listings ?? 0),
            'trend' => $trend,
            'history' => $history,
        ];
    }

    /**
     * Get competitor listings (most recent per source).
     */
    public function getCompetitorListings(string $referenceNumber): array
    {
        return PriceHistory::where('reference_number', $referenceNumber)
            ->where('scraped_date', '>=', now()->subDays(7))
            ->orderByDesc('scraped_date')
            ->limit(50)
            ->get()
            ->map(fn (PriceHistory $p) => [
                'id' => $p->id,
                'source' => $p->source,
                'price' => (float) $p->price,
                'currency' => $p->currency,
                'condition' => $p->condition,
                'seller' => $p->seller,
                'url' => $p->url,
                'country' => $p->country,
                'date' => $p->scraped_date->format('Y-m-d'),
            ])
            ->values()
            ->toArray();
    }

    private function calculateTrend(string $ref, Carbon $since): string
    {
        $midpoint = $since->copy()->addDays($since->diffInDays(now()) / 2);

        $firstHalf = PriceHistory::where('reference_number', $ref)
            ->whereBetween('scraped_date', [$since, $midpoint])
            ->avg('price');

        $secondHalf = PriceHistory::where('reference_number', $ref)
            ->where('scraped_date', '>', $midpoint)
            ->avg('price');

        if (!$firstHalf || !$secondHalf) {
            return 'stable';
        }

        $change = (($secondHalf - $firstHalf) / $firstHalf) * 100;

        if ($change > 2) return 'up';
        if ($change < -2) return 'down';
        return 'stable';
    }

    private function periodToDate(string $period): Carbon
    {
        return match ($period) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '6m' => now()->subMonths(6),
            '1y' => now()->subYear(),
            '3y' => now()->subYears(3),
            default => now()->subDays(30),
        };
    }

    /**
     * Get WatchCharts fair market value and trend data.
     * Returns null if WatchCharts API is not configured.
     */
    public function getWatchChartsTrend(string $referenceNumber, string $period = '1y'): ?array
    {
        $apiKey = config('services.watchcharts.api_key');
        if (!$apiKey) {
            return null;
        }

        $cacheKey = "watchcharts_trend_{$referenceNumber}_{$period}";

        return Cache::remember($cacheKey, 3600, function () use ($referenceNumber, $period, $apiKey) {
            try {
                $response = Http::withToken($apiKey)
                    ->withHeaders(['Accept' => 'application/json', 'User-Agent' => 'WatchSyncAI/1.0'])
                    ->timeout(30)
                    ->get('https://watchcharts.com/api/v2/watch/trend', [
                        'ref' => $referenceNumber,
                        'period' => $period,
                    ]);

                if (!$response->successful()) {
                    Log::warning('WatchCharts trend API failed', [
                        'ref'    => $referenceNumber,
                        'status' => $response->status(),
                    ]);
                    return null;
                }

                $data = $response->json('data') ?? $response->json();

                return [
                    'fair_market_value' => (float) ($data['fair_market_value'] ?? $data['market_value'] ?? $data['avg_price'] ?? 0),
                    'currency'          => $data['currency'] ?? 'EUR',
                    'price_change_pct'  => (float) ($data['price_change_pct'] ?? $data['change_pct'] ?? 0),
                    'trend'             => $this->normalizeTrend($data['trend'] ?? $data['direction'] ?? null, $data['price_change_pct'] ?? 0),
                    'period'            => $period,
                    'data_points'       => collect($data['history'] ?? $data['data_points'] ?? [])
                        ->map(fn ($p) => [
                            'date'  => $p['date'] ?? $p['period'] ?? '',
                            'price' => (float) ($p['price'] ?? $p['value'] ?? $p['avg_price'] ?? 0),
                        ])
                        ->filter(fn ($p) => $p['price'] > 0)
                        ->values()
                        ->toArray(),
                    'source'            => 'watchcharts',
                    'updated_at'        => now()->toIso8601String(),
                ];
            } catch (\Throwable $e) {
                Log::warning('WatchCharts trend fetch failed', [
                    'ref'   => $referenceNumber,
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }

    private function normalizeTrend(?string $trend, float $changePct): string
    {
        if ($trend && in_array($trend, ['up', 'down', 'stable'])) {
            return $trend;
        }
        if ($changePct > 2) return 'up';
        if ($changePct < -2) return 'down';
        return 'stable';
    }
}
