<?php

namespace Tests\Feature;

use App\Models\Dealer;
use App\Models\User;
use App\Models\Watch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    // ─── eBay Webhook ──────────────────────────────────────

    public function test_ebay_webhook_rejects_missing_signature(): void
    {
        // Verification token ayarlı ise imzasız istekler reddedilmeli
        config(['services.ebay.webhook_verification_token' => 'valid-token']);

        $response = $this->postJson('/api/webhooks/ebay', [
            'metadata' => ['topic' => 'MARKETPLACE_ACCOUNT_DELETION'],
        ]);
        // No X-EBAY-SIGNATURE header → rejected
        $response->assertStatus(403);
    }

    public function test_ebay_webhook_rejects_forged_signature(): void
    {
        // Verification token ayarlı iken doğrulanamayan (sahte) imza reddedilmeli.
        // Test ortamında eBay creds yok → public key çözülemez → fail-closed 403.
        config(['services.ebay.webhook_verification_token' => 'valid-token']);

        $response = $this->postJson('/api/webhooks/ebay', [
            'metadata' => ['topic' => 'order.created'],
            'resource' => ['legacyItemId' => 'WS-00000001'],
        ], [
            'X-EBAY-SIGNATURE' => base64_encode(json_encode([
                'alg' => 'ecdsa', 'kid' => 'x', 'signature' => base64_encode('forged'), 'digest' => 'SHA1',
            ])),
        ]);

        $response->assertStatus(403);
    }

    public function test_ebay_webhook_answers_verification_challenge(): void
    {
        config([
            'services.ebay.webhook_verification_token' => 'my-token',
            'services.ebay.webhook_endpoint' => 'https://example.test/api/webhooks/ebay',
        ]);

        $response = $this->getJson('/api/webhooks/ebay?challenge_code=abc123');

        $expected = hash('sha256', 'abc123' . 'my-token' . 'https://example.test/api/webhooks/ebay');
        $response->assertStatus(200)->assertJson(['challengeResponse' => $expected]);
    }

    public function test_ebay_webhook_accepts_in_dev_mode(): void
    {
        // Dev mode: boş verification token = bypass
        config(['services.ebay.webhook_verification_token' => '']);

        $response = $this->postJson('/api/webhooks/ebay', [
            'metadata' => ['topic' => 'order.created'],
            'resource' => [
                'legacyItemId' => 'WS-00000001',
            ],
        ]);

        // Webhook processed (200 veya 202)
        $this->assertTrue(in_array($response->status(), [200, 202]));
    }

    // ─── Shopify Webhook ──────────────────────────────────────

    public function test_shopify_webhook_rejects_invalid_hmac(): void
    {
        config(['services.shopify.webhook_secret' => 'test-secret']);

        $response = $this->postJson('/api/webhooks/shopify', [
            'id' => 12345,
        ], [
            'X-Shopify-Hmac-SHA256' => 'invalid-hmac',
            'X-Shopify-Topic' => 'orders/create',
        ]);

        $response->assertStatus(403);
    }

    public function test_shopify_webhook_accepts_valid_hmac(): void
    {
        $secret = 'test-webhook-secret';
        config(['services.shopify.webhook_secret' => $secret]);

        $payload = json_encode(['id' => 12345, 'line_items' => []]);
        $hmac = base64_encode(hash_hmac('sha256', $payload, $secret, true));

        $response = $this->call('POST', '/api/webhooks/shopify', [], [], [], [
            'HTTP_X-Shopify-Hmac-SHA256' => $hmac,
            'HTTP_X-Shopify-Topic' => 'orders/create',
            'CONTENT_TYPE' => 'application/json',
        ], $payload);

        $this->assertTrue(in_array($response->status(), [200, 202]));
    }
}
