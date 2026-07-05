<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessWebhookJob;
use App\Models\Platform;
use App\Models\Watch;
use App\Services\EbayNotificationVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        private readonly EbayNotificationVerifier $ebayVerifier,
    ) {}

    /**
     * eBay Marketplace Account Notification webhook.
     *
     * POST /api/webhooks/ebay
     */
    public function ebay(Request $request): JsonResponse
    {
        // Endpoint doğrulama challenge'ı (eBay onboarding — account deletion)
        if ($request->has('challenge_code')) {
            return $this->handleEbayChallenge($request);
        }

        // eBay webhook imza doğrulaması
        if (!$this->verifyEbaySignature($request)) {
            Log::warning('eBay webhook: Invalid signature', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $payload = $request->all();
        $notificationType = $payload['metadata']['topic'] ?? $request->header('X-EBAY-NOTIFICATION-TYPE', '');

        Log::info('eBay webhook received', [
            'type'    => $notificationType,
            'payload' => $payload,
        ]);

        // Sipariş bildirimi → stok kilitleme
        if (str_contains($notificationType, 'MARKETPLACE_ACCOUNT_DELETION')) {
            // GDPR: hesap silme bildirimi — log ve geç
            Log::info('eBay webhook: Account deletion notification received');
            return response()->json(['status' => 'acknowledged']);
        }

        // Order bildirimleri
        if (str_contains($notificationType, 'ORDER') || str_contains($notificationType, 'order')) {
            $this->processEbayOrder($payload);
        }

        return response()->json(['status' => 'received']);
    }

    /**
     * Shopify Webhook handler.
     *
     * POST /api/webhooks/shopify
     */
    public function shopify(Request $request): JsonResponse
    {
        // Shopify HMAC-SHA256 imza doğrulaması
        if (!$this->verifyShopifySignature($request)) {
            Log::warning('Shopify webhook: Invalid HMAC', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $topic = $request->header('X-Shopify-Topic', '');
        $payload = $request->all();

        Log::info('Shopify webhook received', [
            'topic'   => $topic,
            'payload' => $payload,
        ]);

        match ($topic) {
            'orders/create'    => $this->processShopifyOrderCreated($payload),
            'orders/cancelled' => $this->processShopifyOrderCancelled($payload),
            default            => Log::info('Shopify webhook: Unhandled topic', ['topic' => $topic]),
        };

        return response()->json(['status' => 'received']);
    }

    // ─── eBay Processing ───────────────────────────────────────

    private function processEbayOrder(array $payload): void
    {
        // eBay notification payload mapping
        $lineItems = $payload['resource']['lineItems'] ?? $payload['lineItems'] ?? [];
        $orderId = $payload['resource']['orderId'] ?? $payload['orderId'] ?? null;

        foreach ($lineItems as $item) {
            $sku = $item['sku'] ?? '';

            // SKU'dan watch_id çıkar (format: WS-00000123)
            $watchId = $this->extractWatchIdFromSku($sku);

            if (!$watchId) {
                Log::warning('eBay webhook: Could not extract watch_id from SKU', ['sku' => $sku]);
                continue;
            }

            $watch = Watch::find($watchId);
            if (!$watch) {
                Log::warning('eBay webhook: Watch not found', ['watch_id' => $watchId]);
                continue;
            }

            ProcessWebhookJob::dispatch('ebay', 'order.created', [
                'watch_id' => $watchId,
                'order_id' => $orderId,
                'sku'      => $sku,
            ]);
        }
    }

    // ─── Shopify Processing ────────────────────────────────────

    private function processShopifyOrderCreated(array $payload): void
    {
        $orderId = $payload['id'] ?? null;
        $lineItems = $payload['line_items'] ?? [];

        foreach ($lineItems as $item) {
            $sku = $item['sku'] ?? '';
            $watchId = $this->extractWatchIdFromSku($sku);

            if (!$watchId) {
                continue;
            }

            ProcessWebhookJob::dispatch('shopify', 'order.created', [
                'watch_id' => $watchId,
                'order_id' => $orderId,
                'sku'      => $sku,
            ]);
        }
    }

    private function processShopifyOrderCancelled(array $payload): void
    {
        $orderId = $payload['id'] ?? null;
        $lineItems = $payload['line_items'] ?? [];

        foreach ($lineItems as $item) {
            $sku = $item['sku'] ?? '';
            $watchId = $this->extractWatchIdFromSku($sku);

            if (!$watchId) {
                continue;
            }

            ProcessWebhookJob::dispatch('shopify', 'order.cancelled', [
                'watch_id' => $watchId,
                'order_id' => $orderId,
                'sku'      => $sku,
            ]);
        }
    }

    // ─── Signature Verification ────────────────────────────────

    /**
     * eBay notification imza doğrulaması (fail-closed).
     *
     * Verification token ayarlıysa `X-EBAY-SIGNATURE` header'ı, eBay'in
     * public key'i ile kriptografik olarak doğrulanır. Doğrulanamayan
     * (imzasız, ayrıştırılamayan, geçersiz) istekler reddedilir.
     */
    private function verifyEbaySignature(Request $request): bool
    {
        $verificationToken = config('services.ebay.webhook_verification_token', '');

        // Verification token yapılandırılmamışsa: dev/test'te geç, production'da
        // fail-CLOSED — aksi halde konfigürasyon eksikliği kimlik doğrulamasız
        // webhook'a (sahte order → cross-tenant stok kilidi) dönüşür.
        if (empty($verificationToken)) {
            if (app()->environment('production')) {
                Log::critical('eBay webhook: verification token yapılandırılmamış — production isteği reddedildi', [
                    'ip' => $request->ip(),
                ]);
                return false;
            }
            return true;
        }

        $signature = $request->header('X-EBAY-SIGNATURE');
        if (empty($signature)) {
            return false;
        }

        return $this->ebayVerifier->verify($signature, $request->getContent());
    }

    /**
     * eBay endpoint verification challenge yanıtı.
     * challengeResponse = SHA256(challengeCode + verificationToken + endpoint) (hex).
     */
    private function handleEbayChallenge(Request $request): JsonResponse
    {
        $challengeCode     = (string) $request->input('challenge_code');
        $verificationToken = (string) config('services.ebay.webhook_verification_token', '');
        $endpoint          = (string) config('services.ebay.webhook_endpoint', $request->url());

        $hash = hash('sha256', $challengeCode . $verificationToken . $endpoint);

        return response()->json(['challengeResponse' => $hash]);
    }

    /**
     * Shopify HMAC-SHA256 webhook imza doğrulaması.
     */
    private function verifyShopifySignature(Request $request): bool
    {
        $shopifySecret = config('services.shopify.webhook_secret', '');

        // Webhook secret yapılandırılmamışsa: dev'de geç, production'da fail-CLOSED.
        if (empty($shopifySecret)) {
            if (app()->environment('production')) {
                Log::critical('Shopify webhook: secret yapılandırılmamış — production isteği reddedildi', [
                    'ip' => $request->ip(),
                ]);
                return false;
            }
            return true;
        }

        $hmacHeader = $request->header('X-Shopify-Hmac-Sha256', '');
        if (empty($hmacHeader)) {
            return false;
        }

        $rawBody = $request->getContent();
        $calculatedHmac = base64_encode(hash_hmac('sha256', $rawBody, $shopifySecret, true));

        return hash_equals($calculatedHmac, $hmacHeader);
    }

    // ─── Helpers ─────────────────────────────────────────────

    /**
     * SKU'dan watch ID çıkarır.
     * Format: WS-00000123 → 123
     */
    private function extractWatchIdFromSku(string $sku): ?int
    {
        if (!str_starts_with($sku, 'WS-')) {
            return null;
        }

        $id = (int) ltrim(substr($sku, 3), '0');
        return $id > 0 ? $id : null;
    }
}
