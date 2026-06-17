<?php

namespace App\Services;

use App\Services\Contracts\IMarketProvider;

class MarketDataService implements IMarketProvider
{
    /**
     * Gets the current estimated market value for a given watch model/reference.
     * MOCK IMPLEMENTATION: Returns a slightly higher value (+8%) if a base price isn't known, 
     * or calculates a simulated market value.
     *
     * @param string $brand
     * @param string $model
     * @param string|null $reference
     * @param string|null $condition
     * @return float|null
     */
    public function getEstimatedMarketValue(string $brand, string $model, ?string $reference = null, ?string $condition = null): ?float
    {
        // For the mock, we generate a pseudo-random value based on the brand string length to keep it deterministic but varied.
        $baseMockValue = (strlen($brand) + strlen($model)) * 1000;
        
        // Add 8% to represent the "fictional value bump" requested for the demo, 
        // to always show a positive return in the arbitrage radar.
        return round($baseMockValue * 1.08, 2);
    }

    /**
     * Helper to apply a +8% markup if the current estimated value is missing or to simulate the market value.
     */
    public function calculateMockArbitrage(float $currentPrice): float
    {
        return round($currentPrice * 1.08, 2);
    }
}
