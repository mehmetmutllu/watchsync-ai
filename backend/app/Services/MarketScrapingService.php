<?php

namespace App\Services;

use App\Models\PriceHistory;
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
     * Trigger a market scan via the AI service scraping endpoint.
     */
    public function scan(string $referenceNumber): array
    {
        try {
            $response = Http::timeout(90)
                ->post("{$this->aiServiceUrl}/api/scraping/scan", [
                    'reference_number' => $referenceNumber,
                ]);

            if (!$response->successful()) {
                Log::warning('Market scan failed', [
                    'ref' => $referenceNumber,
                    'status' => $response->status(),
                ]);
                return ['success' => false, 'message' => 'Scraping service returned an error.'];
            }

            $data = $response->json();

            // Store results to price_histories
            if (!empty($data['results'])) {
                foreach ($data['results'] as $item) {
                    PriceHistory::create([
                        'reference_number' => $referenceNumber,
                        'source' => $item['source'] ?? 'unknown',
                        'price' => $item['price'],
                        'currency' => $item['currency'] ?? 'EUR',
                        'condition' => $item['condition'] ?? null,
                        'seller' => $item['seller'] ?? null,
                        'url' => $item['url'] ?? null,
                        'country' => $item['country'] ?? null,
                        'scraped_date' => now()->toDateString(),
                    ]);
                }
            }

            return ['success' => true, 'count' => count($data['results'] ?? [])];
        } catch (\Throwable $e) {
            Log::error('Market scan exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Scraping service unavailable.'];
        }
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
            default => now()->subDays(30),
        };
    }
}
