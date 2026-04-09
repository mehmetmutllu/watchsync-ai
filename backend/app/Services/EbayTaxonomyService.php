<?php

namespace App\Services;

use App\Models\Watch;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EbayTaxonomyService
{
    /**
     * eBay Wristwatches category ID.
     */
    private const CATEGORY_ID = 281;

    /**
     * Taxonomy API → Wristwatches categorisi için zorunlu item aspect'leri çeker.
     * Sonuçları 24 saat cache'ler.
     *
     * @return array<string, array{required: bool, values: array<string>}>
     */
    public function getItemAspects(string $accessToken): array
    {
        $cacheKey = 'ebay_item_aspects_' . self::CATEGORY_ID;

        return Cache::remember($cacheKey, 86400, function () use ($accessToken) {
            $ebayService = app(EbayOAuthService::class);
            $baseUrl = $ebayService->getApiBaseUrl();

            $response = Http::withToken($accessToken)
                ->get("{$baseUrl}/commerce/taxonomy/v1/category_tree/0/get_item_aspects_for_category", [
                    'category_id' => self::CATEGORY_ID,
                ]);

            if (!$response->successful()) {
                Log::error('eBay Taxonomy API failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return [];
            }

            return $this->parseAspects($response->json());
        });
    }

    /**
     * Watch modelini eBay zorunlu alanlarına eşleştirir.
     *
     * @return array<string, string>
     */
    public function mapWatchToAspects(Watch $watch): array
    {
        $features = $watch->features ?? [];

        $aspects = [
            'Brand'                => $watch->brand,
            'Model'                => $watch->model,
            'Reference Number'     => $watch->reference_number ?? '',
            'Year of Manufacture'  => (string) ($watch->year ?? ''),
            'Condition'            => $this->mapCondition($watch->condition),
            'Case Material'        => $features['case_material'] ?? '',
            'Band Material'        => $features['bracelet_material'] ?? '',
            'Dial Color'           => $features['dial_color'] ?? '',
            'Movement'             => $this->mapMovement($features['movement'] ?? ''),
            'Case Size'            => $features['case_diameter'] ?? '',
            'Water Resistance'     => $features['water_resistance'] ?? '',
            'Type'                 => 'Wristwatch',
            'Department'           => 'Unisex Adults',
            'Country/Region of Manufacture' => 'Switzerland',
        ];

        // Authenticity Guarantee uyumluluk
        $aspects['Authenticity Guarantee'] = 'Yes';

        return array_filter($aspects, fn ($v) => $v !== '');
    }

    /**
     * Zorunlu alanlardan eksik olanları bulur.
     *
     * @return array<string>
     */
    public function getMissingRequiredFields(Watch $watch, array $itemAspects): array
    {
        $mapped  = $this->mapWatchToAspects($watch);
        $missing = [];

        foreach ($itemAspects as $name => $aspect) {
            if (!empty($aspect['required']) && empty($mapped[$name])) {
                $missing[] = $name;
            }
        }

        return $missing;
    }

    /**
     * eBay Taxonomy API response'unu parse eder.
     */
    private function parseAspects(array $data): array
    {
        $aspects = [];

        foreach ($data['aspects'] ?? [] as $aspect) {
            $name = $aspect['localizedAspectName'] ?? '';
            if (!$name) {
                continue;
            }

            $values = [];
            foreach ($aspect['aspectValues'] ?? [] as $val) {
                if (isset($val['localizedValue'])) {
                    $values[] = $val['localizedValue'];
                }
            }

            $aspects[$name] = [
                'required' => ($aspect['aspectConstraint']['aspectRequired'] ?? false) === true,
                'values'   => $values,
            ];
        }

        return $aspects;
    }

    private function mapCondition(string $condition): string
    {
        return match ($condition) {
            'new'       => 'New with tags',
            'unworn'    => 'New without tags',
            'very_good' => 'Pre-owned',
            'good'      => 'Pre-owned',
            'fair'      => 'Pre-owned',
            default     => 'Pre-owned',
        };
    }

    private function mapMovement(string $movement): string
    {
        return match (strtolower($movement)) {
            'automatic', 'auto' => 'Automatic',
            'manual', 'hand-wound' => 'Mechanical (Manual)',
            'quartz' => 'Quartz',
            default  => $movement,
        };
    }
}
