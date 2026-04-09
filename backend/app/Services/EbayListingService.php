<?php

namespace App\Services;

use App\Models\PlatformConnection;
use App\Models\SyncLog;
use App\Models\Watch;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EbayListingService
{
    private EbayOAuthService $oauthService;
    private EbayTaxonomyService $taxonomyService;

    public function __construct(EbayOAuthService $oauthService, EbayTaxonomyService $taxonomyService)
    {
        $this->oauthService = $oauthService;
        $this->taxonomyService = $taxonomyService;
    }

    /**
     * eBay Inventory API — createOrReplaceInventoryItem
     * Saat bilgilerini eBay envanter öğesi olarak oluşturur/günceller.
     *
     * @throws \RuntimeException
     */
    public function createOrReplaceInventoryItem(Watch $watch, PlatformConnection $connection): string
    {
        $accessToken = $this->getValidToken($connection);
        $baseUrl = $this->oauthService->getApiBaseUrl();
        $sku = $this->generateSku($watch);

        // eBay Taxonomy zorunlu alan eşleştirmesi
        $aspects = $this->taxonomyService->mapWatchToAspects($watch);

        // İlk görseli al
        $imageUrls = $watch->images->pluck('image_url')->filter()->values()->toArray();

        $payload = [
            'product' => [
                'title'       => $this->buildTitle($watch),
                'description' => $watch->description ?? $this->buildDefaultDescription($watch),
                'aspects'     => $this->formatAspects($aspects),
                'imageUrls'   => $imageUrls ?: [],
            ],
            'condition'          => $this->mapConditionId($watch->condition),
            'conditionDescription' => $this->buildConditionDescription($watch),
            'availability'       => [
                'shipToLocationAvailability' => [
                    'quantity' => $watch->status === 'active' ? 1 : 0,
                ],
            ],
        ];

        $response = $this->ebayHttp($accessToken)
            ->put("{$baseUrl}/sell/inventory/v1/inventory_item/{$sku}", $payload);

        if (!$response->successful()) {
            $this->logAndThrow('createOrReplaceInventoryItem', $response, $watch);
        }

        Log::info('eBay: Inventory item created/updated', [
            'watch_id' => $watch->id,
            'sku'      => $sku,
            'status'   => $response->status(),
        ]);

        return $sku;
    }

    /**
     * eBay Inventory API — createOffer
     * Envanter öğesi için satış teklifi oluşturur.
     *
     * @throws \RuntimeException
     */
    public function createOffer(Watch $watch, PlatformConnection $connection, string $sku): string
    {
        $accessToken = $this->getValidToken($connection);
        $baseUrl = $this->oauthService->getApiBaseUrl();

        $payload = [
            'sku'             => $sku,
            'marketplaceId'   => 'EBAY_US',
            'format'          => 'FIXED_PRICE',
            'listingDescription' => $watch->description ?? $this->buildDefaultDescription($watch),
            'availableQuantity'  => 1,
            'categoryId'      => '31387', // Wristwatches
            'merchantLocationKey' => $connection->settings['merchant_location_key'] ?? 'default',
            'pricingSummary'  => [
                'price' => [
                    'value'    => (string) $watch->sale_price,
                    'currency' => $watch->currency ?: 'USD',
                ],
            ],
            'listingPolicies' => [
                'fulfillmentPolicyId' => $connection->settings['fulfillment_policy_id'] ?? '',
                'paymentPolicyId'     => $connection->settings['payment_policy_id'] ?? '',
                'returnPolicyId'      => $connection->settings['return_policy_id'] ?? '',
            ],
            // Authenticity Guarantee — zorunlu alan ($2,000+ saatler)
            'extendedProducerResponsibility' => null,
            'regulatory'      => [
                'energyEfficiencyLabel' => null,
            ],
        ];

        $response = $this->ebayHttp($accessToken)
            ->post("{$baseUrl}/sell/inventory/v1/offer", $payload);

        if (!$response->successful()) {
            $this->logAndThrow('createOffer', $response, $watch);
        }

        $offerId = $response->json('offerId');

        Log::info('eBay: Offer created', [
            'watch_id' => $watch->id,
            'sku'      => $sku,
            'offer_id' => $offerId,
        ]);

        return $offerId;
    }

    /**
     * eBay Inventory API — publishOffer
     * Teklifi yayınlayarak listeyi canlıya alır.
     *
     * @throws \RuntimeException
     */
    public function publishOffer(string $offerId, PlatformConnection $connection): string
    {
        $accessToken = $this->getValidToken($connection);
        $baseUrl = $this->oauthService->getApiBaseUrl();

        $response = Http::withToken($accessToken)
            ->withHeaders([
                'Accept' => 'application/json',
            ])
            ->retry(3, function (int $attempt, \Throwable $exception) {
                return (int) (1000 * pow(2, $attempt - 1));
            }, fn (\Throwable $e) => $e instanceof \Illuminate\Http\Client\RequestException
                && in_array($e->response?->status(), [429, 500, 502, 503, 504]))
            ->post("{$baseUrl}/sell/inventory/v1/offer/{$offerId}/publish");

        if (!$response->successful()) {
            Log::error('eBay publishOffer failed', [
                'offer_id' => $offerId,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            throw new \RuntimeException('eBay publishOffer failed: ' . $response->body());
        }

        $listingId = $response->json('listingId');

        Log::info('eBay: Offer published', [
            'offer_id'   => $offerId,
            'listing_id' => $listingId,
        ]);

        return $listingId;
    }

    /**
     * Tam listeleme akışı: createOrReplaceInventoryItem → createOffer → publishOffer
     */
    public function publishWatch(Watch $watch, PlatformConnection $connection): array
    {
        $sku = $this->createOrReplaceInventoryItem($watch, $connection);
        $offerId = $this->createOffer($watch, $connection, $sku);
        $listingId = $this->publishOffer($offerId, $connection);

        // Platform referans ID'lerini kaydet
        $watch->update([
            'ebay_listing_id' => $listingId,
            'ebay_offer_id'   => $offerId,
        ]);

        // Sync log kaydı
        SyncLog::create([
            'watch_id'      => $watch->id,
            'platform_id'   => $connection->platform_id,
            'status'        => 'success',
            'error_message' => null,
        ]);

        // Bağlantı son senkronizasyon zamanını güncelle
        $connection->update(['last_synced_at' => now()]);

        return [
            'sku'        => $sku,
            'offer_id'   => $offerId,
            'listing_id' => $listingId,
        ];
    }

    /**
     * eBay Inventory API — updateOffer (fiyat/miktar güncelleme)
     *
     * @throws \RuntimeException
     */
    public function updateOffer(Watch $watch, PlatformConnection $connection, string $offerId): void
    {
        $accessToken = $this->getValidToken($connection);
        $baseUrl = $this->oauthService->getApiBaseUrl();
        $sku = $this->generateSku($watch);

        $payload = [
            'sku'                => $sku,
            'marketplaceId'      => 'EBAY_US',
            'format'             => 'FIXED_PRICE',
            'listingDescription' => $watch->description ?? $this->buildDefaultDescription($watch),
            'availableQuantity'  => $watch->status === 'active' ? 1 : 0,
            'categoryId'         => '31387',
            'merchantLocationKey' => $connection->settings['merchant_location_key'] ?? 'default',
            'pricingSummary'     => [
                'price' => [
                    'value'    => (string) $watch->sale_price,
                    'currency' => $watch->currency ?: 'USD',
                ],
            ],
            'listingPolicies'    => [
                'fulfillmentPolicyId' => $connection->settings['fulfillment_policy_id'] ?? '',
                'paymentPolicyId'     => $connection->settings['payment_policy_id'] ?? '',
                'returnPolicyId'      => $connection->settings['return_policy_id'] ?? '',
            ],
        ];

        $response = $this->ebayHttp($accessToken)
            ->put("{$baseUrl}/sell/inventory/v1/offer/{$offerId}", $payload);

        if (!$response->successful()) {
            $this->logAndThrow('updateOffer', $response, $watch);
        }

        Log::info('eBay: Offer updated', [
            'watch_id' => $watch->id,
            'offer_id' => $offerId,
        ]);
    }

    /**
     * Mevcut listing'i günceller (inventory item + offer).
     * Fiyat/stok değiştiğinde çağrılır.
     */
    public function updateWatch(Watch $watch, PlatformConnection $connection): void
    {
        $this->createOrReplaceInventoryItem($watch, $connection);

        if ($watch->ebay_offer_id) {
            $this->updateOffer($watch, $connection, $watch->ebay_offer_id);
        }

        SyncLog::create([
            'watch_id'      => $watch->id,
            'platform_id'   => $connection->platform_id,
            'status'        => 'success',
            'error_message' => null,
        ]);

        $connection->update(['last_synced_at' => now()]);

        Log::info('eBay: Watch listing updated', ['watch_id' => $watch->id]);
    }

    /**
     * eBay Inventory API — withdrawOffer
     * Teklifi geri çeker (listing'i kaldırır).
     *
     * @throws \RuntimeException
     */
    public function withdrawOffer(Watch $watch, PlatformConnection $connection): void
    {
        if (!$watch->ebay_offer_id) {
            Log::info('eBay: No offer to withdraw', ['watch_id' => $watch->id]);
            return;
        }

        $accessToken = $this->getValidToken($connection);
        $baseUrl = $this->oauthService->getApiBaseUrl();

        $response = $this->ebayHttp($accessToken)
            ->post("{$baseUrl}/sell/inventory/v1/offer/{$watch->ebay_offer_id}/withdraw");

        if (!$response->successful()) {
            Log::error('eBay withdrawOffer failed', [
                'watch_id' => $watch->id,
                'offer_id' => $watch->ebay_offer_id,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            throw new \RuntimeException('eBay withdrawOffer failed: ' . $response->body());
        }

        // Referans ID'lerini temizle
        $watch->update([
            'ebay_listing_id' => null,
            'ebay_offer_id'   => null,
        ]);

        SyncLog::create([
            'watch_id'      => $watch->id,
            'platform_id'   => $connection->platform_id,
            'status'        => 'success',
            'error_message' => null,
        ]);

        Log::info('eBay: Offer withdrawn', [
            'watch_id' => $watch->id,
        ]);
    }

    /**
     * eBay stok miktarını günceller (satış/iptal durumlarında).
     */
    public function updateInventoryQuantity(Watch $watch, PlatformConnection $connection, int $quantity): void
    {
        $accessToken = $this->getValidToken($connection);
        $baseUrl = $this->oauthService->getApiBaseUrl();
        $sku = $this->generateSku($watch);

        $payload = [
            'availability' => [
                'shipToLocationAvailability' => [
                    'quantity' => $quantity,
                ],
            ],
        ];

        $response = $this->ebayHttp($accessToken)
            ->put("{$baseUrl}/sell/inventory/v1/inventory_item/{$sku}", $payload);

        if (!$response->successful()) {
            Log::error('eBay updateInventoryQuantity failed', [
                'watch_id' => $watch->id,
                'sku'      => $sku,
                'quantity'  => $quantity,
                'status'   => $response->status(),
            ]);
            throw new \RuntimeException('eBay inventory quantity update failed: ' . $response->body());
        }

        Log::info('eBay: Inventory quantity updated', [
            'watch_id' => $watch->id,
            'sku'      => $sku,
            'quantity'  => $quantity,
        ]);
    }

    // ─── Private Helpers ───────────────────────────────────────

    private function getValidToken(PlatformConnection $connection): string
    {
        if ($connection->isTokenExpiringSoon()) {
            $this->oauthService->refreshConnectionToken($connection);
            $connection->refresh();
        }

        if (!$connection->access_token) {
            throw new \RuntimeException('eBay access token is missing. Please reconnect.');
        }

        return $connection->access_token;
    }

    private function generateSku(Watch $watch): string
    {
        return 'WS-' . str_pad((string) $watch->id, 8, '0', STR_PAD_LEFT);
    }

    private function buildTitle(Watch $watch): string
    {
        $parts = [$watch->brand, $watch->model];

        if ($watch->reference_number) {
            $parts[] = $watch->reference_number;
        }

        if ($watch->year) {
            $parts[] = "({$watch->year})";
        }

        // eBay title max 80 chars
        $title = implode(' ', $parts);
        return mb_substr($title, 0, 80);
    }

    private function buildDefaultDescription(Watch $watch): string
    {
        $features = $watch->features ?? [];
        $desc = "{$watch->brand} {$watch->model}";

        if ($watch->reference_number) {
            $desc .= " — Ref. {$watch->reference_number}";
        }

        if ($watch->year) {
            $desc .= ", Year: {$watch->year}";
        }

        $conditionLabel = match ($watch->condition) {
            'new'       => 'Brand New',
            'unworn'    => 'Unworn',
            'very_good' => 'Very Good',
            'good'      => 'Good',
            'fair'      => 'Fair',
            default     => $watch->condition,
        };
        $desc .= ". Condition: {$conditionLabel}.";

        if (!empty($features['movement'])) {
            $desc .= " Movement: {$features['movement']}.";
        }
        if (!empty($features['case_material'])) {
            $desc .= " Case: {$features['case_material']}.";
        }
        if (!empty($features['dial_color'])) {
            $desc .= " Dial: {$features['dial_color']}.";
        }

        $desc .= ' Authenticity Guarantee eligible. Ships worldwide with full insurance.';

        return $desc;
    }

    private function buildConditionDescription(Watch $watch): string
    {
        return match ($watch->condition) {
            'new'       => 'Brand new, sealed with manufacturer warranty.',
            'unworn'    => 'Unworn condition. Complete set with box and papers.',
            'very_good' => 'Very good pre-owned condition. Minor signs of wear. Fully functional.',
            'good'      => 'Good pre-owned condition. Normal wear consistent with age. Fully functional.',
            'fair'      => 'Fair pre-owned condition. Visible signs of wear. Fully functional.',
            default     => 'Pre-owned condition.',
        };
    }

    /**
     * eBay item condition ID eşleştirmesi (Wristwatches).
     */
    private function mapConditionId(string $condition): string
    {
        return match ($condition) {
            'new'       => '1000', // New with tags
            'unworn'    => '1500', // New without tags
            'very_good' => '3000', // Pre-owned
            'good'      => '3000',
            'fair'      => '3000',
            default     => '3000',
        };
    }

    /**
     * Aspect array'ini eBay formatına dönüştürür.
     * eBay: { "Brand": ["Rolex"], "Model": ["Submariner"] }
     */
    private function formatAspects(array $aspects): array
    {
        $formatted = [];

        foreach ($aspects as $name => $value) {
            if ($value !== '' && $value !== null) {
                $formatted[$name] = [(string) $value];
            }
        }

        return $formatted;
    }

    private function logAndThrow(string $method, $response, Watch $watch): never
    {
        Log::error("eBay {$method} failed", [
            'watch_id' => $watch->id,
            'status'   => $response->status(),
            'body'     => $response->body(),
        ]);

        SyncLog::create([
            'watch_id'      => $watch->id,
            'platform_id'   => $watch->dealer->platformConnections()
                ->whereHas('platform', fn ($q) => $q->where('name', 'eBay'))
                ->value('platform_id'),
            'status'        => 'failed',
            'error_message' => "eBay {$method}: HTTP {$response->status()} — " . mb_substr($response->body(), 0, 500),
        ]);

        throw new \RuntimeException("eBay {$method} failed: " . $response->body());
    }

    /**
     * eBay API çağrısı için retry + rate limit middleware ile HTTP client döndürür.
     */
    private function ebayHttp(string $accessToken): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withToken($accessToken)
            ->withHeaders([
                'Content-Language' => 'en-US',
                'Accept'           => 'application/json',
            ])
            ->retry(3, function (int $attempt, \Throwable $exception) {
                $delay = (int) (1000 * pow(2, $attempt - 1));
                if ($exception instanceof \Illuminate\Http\Client\RequestException
                    && $exception->response?->status() === 429) {
                    $retryAfter = (int) ($exception->response->header('Retry-After') ?? 2);
                    return $retryAfter * 1000;
                }
                return $delay;
            }, fn (\Throwable $e) => $e instanceof \Illuminate\Http\Client\RequestException
                && in_array($e->response?->status(), [429, 500, 502, 503, 504]));
    }
}
