<?php

namespace App\Services;

use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\Watch;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopifyService
{
    /**
     * Shopify Admin API (GraphQL) — productCreate mutation
     * Saat bilgilerinden Shopify ürünü oluşturur.
     *
     * @return array{product_id: string, variant_id: string}
     * @throws \RuntimeException
     */
    public function productCreate(Watch $watch, PlatformConnection $connection): array
    {
        $accessToken = $connection->api_key;
        $shopDomain = $connection->settings['shop_domain'] ?? '';

        if (!$accessToken || !$shopDomain) {
            throw new \RuntimeException('Shopify credentials are incomplete. Please configure shop domain and API key.');
        }

        $imageUrls = $watch->images->pluck('image_url')->filter()->values()->toArray();

        $mutation = <<<'GRAPHQL'
        mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
          productCreate(input: $input, media: $media) {
            product {
              id
              title
              handle
              variants(first: 1) {
                edges {
                  node {
                    id
                    inventoryItem {
                      id
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
        GRAPHQL;

        $features = $watch->features ?? [];

        $variables = [
            'input' => [
                'title'       => "{$watch->brand} {$watch->model}" . ($watch->reference_number ? " ({$watch->reference_number})" : ''),
                'descriptionHtml' => $watch->description ?? $this->buildDescription($watch),
                'vendor'      => $watch->brand,
                'productType' => 'Watch',
                'tags'        => array_filter([
                    $watch->brand,
                    $watch->model,
                    $watch->condition,
                    $features['movement'] ?? null,
                    $features['case_material'] ?? null,
                    'luxury-watch',
                ]),
                'variants'    => [
                    [
                        'price'              => (string) ($watch->sale_price ?? '0'),
                        'sku'                => 'WS-' . str_pad((string) $watch->id, 8, '0', STR_PAD_LEFT),
                        'inventoryQuantities' => [
                            [
                                'availableQuantity' => $watch->status === 'active' ? 1 : 0,
                                'locationId'        => $connection->settings['location_id'] ?? '',
                            ],
                        ],
                        'inventoryManagement' => 'SHOPIFY',
                        'requiresShipping'    => true,
                        'weight'              => 0.5,
                        'weightUnit'          => 'KILOGRAMS',
                    ],
                ],
                'metafields'  => [
                    [
                        'namespace' => 'watchsync',
                        'key'       => 'reference_number',
                        'value'     => $watch->reference_number ?? '',
                        'type'      => 'single_line_text_field',
                    ],
                    [
                        'namespace' => 'watchsync',
                        'key'       => 'watch_year',
                        'value'     => (string) ($watch->year ?? ''),
                        'type'      => 'single_line_text_field',
                    ],
                    [
                        'namespace' => 'watchsync',
                        'key'       => 'watch_condition',
                        'value'     => $watch->condition,
                        'type'      => 'single_line_text_field',
                    ],
                ],
            ],
            'media' => array_map(fn (string $url) => [
                'originalSource' => $url,
                'mediaContentType' => 'IMAGE',
            ], $imageUrls),
        ];

        $result = $this->graphql($shopDomain, $accessToken, $mutation, $variables);

        if (!empty($result['data']['productCreate']['userErrors'])) {
            $errors = collect($result['data']['productCreate']['userErrors'])
                ->pluck('message')
                ->implode('; ');
            Log::error('Shopify productCreate errors', ['watch_id' => $watch->id, 'errors' => $errors]);
            throw new \RuntimeException("Shopify productCreate failed: {$errors}");
        }

        $product = $result['data']['productCreate']['product'] ?? null;

        if (!$product) {
            throw new \RuntimeException('Shopify productCreate returned no product data.');
        }

        $variantEdge = $product['variants']['edges'][0] ?? null;
        $productId = $product['id'];
        $variantId = $variantEdge['node']['id'] ?? '';

        // Sync log
        SyncLog::create([
            'watch_id'      => $watch->id,
            'platform_id'   => $connection->platform_id,
            'status'        => 'success',
            'error_message' => null,
        ]);

        $connection->update(['last_synced_at' => now()]);

        Log::info('Shopify: Product created', [
            'watch_id'   => $watch->id,
            'product_id' => $productId,
            'variant_id' => $variantId,
        ]);

        return [
            'product_id' => $productId,
            'variant_id' => $variantId,
        ];
    }

    /**
     * Shopify Admin API (GraphQL) — productUpdate mutation
     *
     * @throws \RuntimeException
     */
    public function productUpdate(Watch $watch, PlatformConnection $connection, string $shopifyProductId): void
    {
        $accessToken = $connection->api_key;
        $shopDomain = $connection->settings['shop_domain'] ?? '';

        $mutation = <<<'GRAPHQL'
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
            }
            userErrors {
              field
              message
            }
          }
        }
        GRAPHQL;

        $features = $watch->features ?? [];

        $variables = [
            'input' => [
                'id'              => $shopifyProductId,
                'title'           => "{$watch->brand} {$watch->model}" . ($watch->reference_number ? " ({$watch->reference_number})" : ''),
                'descriptionHtml' => $watch->description ?? $this->buildDescription($watch),
                'vendor'          => $watch->brand,
                'tags'            => array_filter([
                    $watch->brand,
                    $watch->model,
                    $watch->condition,
                    $features['movement'] ?? null,
                    $features['case_material'] ?? null,
                    'luxury-watch',
                ]),
            ],
        ];

        $result = $this->graphql($shopDomain, $accessToken, $mutation, $variables);

        if (!empty($result['data']['productUpdate']['userErrors'])) {
            $errors = collect($result['data']['productUpdate']['userErrors'])
                ->pluck('message')
                ->implode('; ');
            throw new \RuntimeException("Shopify productUpdate failed: {$errors}");
        }

        SyncLog::create([
            'watch_id'      => $watch->id,
            'platform_id'   => $connection->platform_id,
            'status'        => 'success',
            'error_message' => null,
        ]);

        $connection->update(['last_synced_at' => now()]);

        Log::info('Shopify: Product updated', [
            'watch_id'    => $watch->id,
            'product_id'  => $shopifyProductId,
        ]);
    }

    /**
     * Shopify Admin API (GraphQL) — inventoryAdjustQuantities mutation
     * Stok miktarını ayarlar.
     *
     * @throws \RuntimeException
     */
    public function inventoryAdjustQuantities(
        PlatformConnection $connection,
        string $inventoryItemId,
        int $delta,
        Watch $watch,
    ): void {
        $accessToken = $connection->api_key;
        $shopDomain = $connection->settings['shop_domain'] ?? '';
        $locationId = $connection->settings['location_id'] ?? '';

        $mutation = <<<'GRAPHQL'
        mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
          inventoryAdjustQuantities(input: $input) {
            inventoryAdjustmentGroup {
              reason
              changes {
                name
                delta
              }
            }
            userErrors {
              field
              message
            }
          }
        }
        GRAPHQL;

        $variables = [
            'input' => [
                'reason'  => 'correction',
                'name'    => 'available',
                'changes' => [
                    [
                        'inventoryItemId' => $inventoryItemId,
                        'locationId'      => $locationId,
                        'delta'           => $delta,
                    ],
                ],
            ],
        ];

        $result = $this->graphql($shopDomain, $accessToken, $mutation, $variables);

        if (!empty($result['data']['inventoryAdjustQuantities']['userErrors'])) {
            $errors = collect($result['data']['inventoryAdjustQuantities']['userErrors'])
                ->pluck('message')
                ->implode('; ');
            throw new \RuntimeException("Shopify inventoryAdjustQuantities failed: {$errors}");
        }

        Log::info('Shopify: Inventory adjusted', [
            'watch_id'          => $watch->id,
            'inventory_item_id' => $inventoryItemId,
            'delta'             => $delta,
        ]);
    }

    /**
     * Tam listeleme akışı: productCreate
     */
    public function publishWatch(Watch $watch, PlatformConnection $connection): array
    {
        return $this->productCreate($watch, $connection);
    }

    // ─── Private Helpers ───────────────────────────────────────

    /**
     * Shopify Admin GraphQL API çağrısı yapar.
     */
    private function graphql(string $shopDomain, string $accessToken, string $query, array $variables = []): array
    {
        $url = "https://{$shopDomain}/admin/api/2024-10/graphql.json";

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $accessToken,
            'Content-Type'           => 'application/json',
        ])->post($url, [
            'query'     => $query,
            'variables' => $variables,
        ]);

        if (!$response->successful()) {
            Log::error('Shopify GraphQL request failed', [
                'shop_domain' => $shopDomain,
                'status'      => $response->status(),
                'body'        => $response->body(),
            ]);
            throw new \RuntimeException('Shopify API request failed: HTTP ' . $response->status());
        }

        $data = $response->json();

        // GraphQL düzeyinde hatalar
        if (!empty($data['errors'])) {
            $errors = collect($data['errors'])->pluck('message')->implode('; ');
            Log::error('Shopify GraphQL errors', ['errors' => $errors]);
            throw new \RuntimeException("Shopify GraphQL error: {$errors}");
        }

        return $data;
    }

    private function buildDescription(Watch $watch): string
    {
        $features = $watch->features ?? [];
        $html = "<h2>{$watch->brand} {$watch->model}</h2>";

        if ($watch->reference_number) {
            $html .= "<p><strong>Reference:</strong> {$watch->reference_number}</p>";
        }
        if ($watch->year) {
            $html .= "<p><strong>Year:</strong> {$watch->year}</p>";
        }

        $conditionLabel = match ($watch->condition) {
            'new'       => 'Brand New',
            'unworn'    => 'Unworn',
            'very_good' => 'Very Good',
            'good'      => 'Good',
            'fair'      => 'Fair',
            default     => ucfirst($watch->condition),
        };
        $html .= "<p><strong>Condition:</strong> {$conditionLabel}</p>";

        if (!empty($features['movement'])) {
            $html .= "<p><strong>Movement:</strong> {$features['movement']}</p>";
        }
        if (!empty($features['case_material'])) {
            $html .= "<p><strong>Case Material:</strong> {$features['case_material']}</p>";
        }
        if (!empty($features['dial_color'])) {
            $html .= "<p><strong>Dial Color:</strong> {$features['dial_color']}</p>";
        }
        if (!empty($features['case_diameter'])) {
            $html .= "<p><strong>Case Size:</strong> {$features['case_diameter']}</p>";
        }
        if (!empty($features['water_resistance'])) {
            $html .= "<p><strong>Water Resistance:</strong> {$features['water_resistance']}</p>";
        }

        return $html;
    }
}
