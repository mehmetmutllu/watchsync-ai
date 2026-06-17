<?php

namespace App\Services\Contracts;

interface IMarketProvider
{
    /**
     * Gets the current estimated market value for a given watch model/reference.
     *
     * @param string $brand
     * @param string $model
     * @param string|null $reference
     * @param string|null $condition
     * @return float|null
     */
    public function getEstimatedMarketValue(string $brand, string $model, ?string $reference = null, ?string $condition = null): ?float;
}
