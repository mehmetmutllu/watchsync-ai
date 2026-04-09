<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarketScrapingService;
use App\Models\PriceAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        if (!in_array($period, ['7d', '30d', '90d', '6m', '1y'])) {
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
