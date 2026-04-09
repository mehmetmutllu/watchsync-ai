<?php

namespace App\Services;

use App\Models\PlatformConnection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Platform bağlantısı kurulduğunda otomatik webhook subscription kaydı yapar.
 */
class WebhookSubscriptionService
{
    public function __construct(
        private readonly EbayOAuthService $ebayOAuthService,
    ) {}

    /**
     * eBay Notification API — webhook subscription oluşturur/günceller.
     */
    public function registerEbayWebhooks(PlatformConnection $connection): void
    {
        try {
            if (!$connection->access_token) {
                Log::info('WebhookSubscription: eBay — no access token, skipping');
                return;
            }

            $token = $connection->access_token;
            $baseUrl = $this->ebayOAuthService->getApiBaseUrl();
            $callbackUrl = rtrim(config('app.url'), '/') . '/api/webhooks/ebay';

            $topics = [
                'MARKETPLACE_ACCOUNT_DELETION',
            ];

            foreach ($topics as $topic) {
                $response = Http::withToken($token)
                    ->withHeaders(['Accept' => 'application/json'])
                    ->retry(2, 1000)
                    ->post("{$baseUrl}/commerce/notification/v1/subscription", [
                        'topicId'         => $topic,
                        'status'          => 'ENABLED',
                        'deliveryConfig'  => [
                            'endpoint' => $callbackUrl,
                        ],
                    ]);

                if ($response->successful() || $response->status() === 409) {
                    // 409 = already subscribed — ok
                    Log::info("WebhookSubscription: eBay topic '{$topic}' registered", [
                        'dealer_id' => $connection->dealer_id,
                    ]);
                } else {
                    Log::warning("WebhookSubscription: eBay topic '{$topic}' failed", [
                        'status' => $response->status(),
                        'body'   => $response->body(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('WebhookSubscription: eBay registration failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Shopify Admin API — webhook subscription oluşturur.
     */
    public function registerShopifyWebhooks(PlatformConnection $connection): void
    {
        try {
            $accessToken = $connection->api_key;
            $shopDomain = $connection->settings['shop_domain'] ?? '';

            if (!$accessToken || !$shopDomain) {
                Log::info('WebhookSubscription: Shopify — missing credentials, skipping');
                return;
            }

            $callbackUrl = rtrim(config('app.url'), '/') . '/api/webhooks/shopify';

            $topics = [
                'ORDERS_CREATE',
                'ORDERS_CANCELLED',
            ];

            foreach ($topics as $topic) {
                $mutation = <<<'GRAPHQL'
                mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
                  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
                    webhookSubscription {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
                GRAPHQL;

                $variables = [
                    'topic' => $topic,
                    'webhookSubscription' => [
                        'callbackUrl' => $callbackUrl,
                        'format'      => 'JSON',
                    ],
                ];

                $response = Http::withHeaders([
                    'X-Shopify-Access-Token' => $accessToken,
                    'Content-Type'           => 'application/json',
                ])
                ->retry(2, 1000)
                ->post("https://{$shopDomain}/admin/api/2024-10/graphql.json", [
                    'query'     => $mutation,
                    'variables' => $variables,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $errors = $data['data']['webhookSubscriptionCreate']['userErrors'] ?? [];

                    if (empty($errors)) {
                        Log::info("WebhookSubscription: Shopify topic '{$topic}' registered", [
                            'dealer_id' => $connection->dealer_id,
                        ]);
                    } else {
                        Log::warning("WebhookSubscription: Shopify topic '{$topic}' errors", [
                            'errors' => collect($errors)->pluck('message')->implode('; '),
                        ]);
                    }
                } else {
                    Log::warning("WebhookSubscription: Shopify topic '{$topic}' HTTP failed", [
                        'status' => $response->status(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('WebhookSubscription: Shopify registration failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Platform adına göre uygun webhook kaydını yapar.
     */
    public function registerForPlatform(PlatformConnection $connection): void
    {
        $platformName = strtolower($connection->platform?->name ?? '');

        match (true) {
            str_contains($platformName, 'ebay')    => $this->registerEbayWebhooks($connection),
            str_contains($platformName, 'shopify') => $this->registerShopifyWebhooks($connection),
            default => null,
        };
    }
}
