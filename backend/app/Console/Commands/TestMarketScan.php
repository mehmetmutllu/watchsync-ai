<?php

namespace App\Console\Commands;

use App\Services\MarketScrapingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestMarketScan extends Command
{
    protected $signature = 'market:test-scan
        {reference=126610LN : Saat referans numarası}
        {--ebay-only : Sadece eBay Browse API test et}
        {--skip-store : Sonuçları veritabanına kaydetme}';

    protected $description = 'Pazar tarayıcısını test et — eBay Browse API bağlantısı ve örnek arama';

    public function handle(MarketScrapingService $scrapingService): int
    {
        $reference = $this->argument('reference');
        $ebayOnly = $this->option('ebay-only');

        $this->info("🔍 Market Scanner Test — Referans: {$reference}");
        $this->newLine();

        // Step 1: Check eBay configuration
        $this->testEbayConfig();

        // Step 2: Test eBay app token
        $token = $this->testEbayToken();

        // Step 3: Test Browse API search
        if ($token) {
            $this->testBrowseApiSearch($token, $reference);
        }

        if ($ebayOnly) {
            return self::SUCCESS;
        }

        // Step 4: Full scan (all tiers)
        $this->newLine();
        $this->info('━━━ Tam Pazar Taraması (Tüm Kaynaklar) ━━━');

        if ($this->option('skip-store')) {
            $this->warn('⚠ --skip-store: Sonuçlar veritabanına kaydedilmeyecek.');
            $this->testFullScanDryRun($reference);
        } else {
            $result = $scrapingService->scan($reference);
            $this->newLine();
            $this->info("✅ Tarama tamamlandı:");
            $this->table(
                ['Metrik', 'Değer'],
                [
                    ['Kaynaklar', implode(', ', $result['sources'] ?? [])],
                    ['Kayıt Sayısı', $result['count'] ?? 0],
                    ['Durum', ($result['success'] ?? false) ? 'Başarılı' : 'Başarısız'],
                ]
            );

            // Show price stats
            $stats = $scrapingService->getPriceStats($reference, '30d');
            if ($stats['total_listings'] > 0) {
                $this->newLine();
                $this->info("📊 Fiyat İstatistikleri ({$reference}, 30 gün):");
                $this->table(
                    ['Metrik', 'Değer'],
                    [
                        ['Ortalama Fiyat', number_format($stats['avg_price'], 2) . ' EUR'],
                        ['En Düşük', number_format($stats['min_price'], 2) . ' EUR'],
                        ['En Yüksek', number_format($stats['max_price'], 2) . ' EUR'],
                        ['Toplam İlan', $stats['total_listings']],
                        ['Trend', $stats['trend']],
                    ]
                );
            }

            // Show competitor listings
            $listings = $scrapingService->getCompetitorListings($reference);
            if (!empty($listings)) {
                $this->newLine();
                $this->info("🏪 Rakip İlanları (son 7 gün):");
                $rows = array_map(fn ($l) => [
                    $l['source'],
                    number_format($l['price'], 2) . ' ' . $l['currency'],
                    $l['condition'] ?? '—',
                    $l['seller'] ?? '—',
                    $l['country'] ?? '—',
                ], array_slice($listings, 0, 10));

                $this->table(['Kaynak', 'Fiyat', 'Durum', 'Satıcı', 'Ülke'], $rows);
            }
        }

        return self::SUCCESS;
    }

    private function testEbayConfig(): void
    {
        $clientId = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');
        $sandbox = config('services.ebay.sandbox');

        $this->info('━━━ eBay Yapılandırması ━━━');

        $this->table(
            ['Ayar', 'Değer', 'Durum'],
            [
                ['EBAY_CLIENT_ID', $clientId ? substr($clientId, 0, 12) . '...' : '(boş)', $clientId ? '✅' : '❌'],
                ['EBAY_CLIENT_SECRET', $clientSecret ? '****' . substr($clientSecret, -4) : '(boş)', $clientSecret ? '✅' : '❌'],
                ['Ortam', $sandbox ? 'Sandbox' : 'Production', '✅'],
            ]
        );

        if (!$clientId || !$clientSecret) {
            $this->error('❌ eBay API anahtarları eksik! .env dosyasında EBAY_CLIENT_ID ve EBAY_CLIENT_SECRET tanımlayın.');
            $this->line('   → https://developer.ebay.com adresinden Developer hesabı açın.');
        }
    }

    private function testEbayToken(): ?string
    {
        $clientId = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');
        $sandbox = config('services.ebay.sandbox');

        if (!$clientId || !$clientSecret) {
            return null;
        }

        $this->newLine();
        $this->info('━━━ eBay OAuth Token Testi ━━━');

        $tokenUrl = $sandbox
            ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
            : 'https://api.ebay.com/identity/v1/oauth2/token';

        try {
            $response = Http::asForm()
                ->withBasicAuth($clientId, $clientSecret)
                ->timeout(15)
                ->post($tokenUrl, [
                    'grant_type' => 'client_credentials',
                    'scope'      => 'https://api.ebay.com/oauth/api_scope',
                ]);

            if ($response->successful()) {
                $token = $response->json('access_token');
                $expiresIn = $response->json('expires_in', 0);
                $this->line("  ✅ Token alındı (süresi: {$expiresIn}s)");
                return $token;
            }

            $this->error("  ❌ Token alınamadı — HTTP {$response->status()}");
            $this->line("  Yanıt: " . substr($response->body(), 0, 200));
            return null;
        } catch (\Throwable $e) {
            $this->error("  ❌ Bağlantı hatası: " . $e->getMessage());
            return null;
        }
    }

    private function testBrowseApiSearch(string $token, string $reference): void
    {
        $sandbox = config('services.ebay.sandbox');
        $baseUrl = $sandbox
            ? 'https://api.sandbox.ebay.com'
            : 'https://api.ebay.com';

        $this->newLine();
        $this->info("━━━ eBay Browse API Testi — \"{$reference}\" ━━━");

        try {
            $response = Http::withToken($token)
                ->withHeaders([
                    'X-EBAY-C-MARKETPLACE-ID' => 'EBAY_US',
                    'Content-Type'            => 'application/json',
                ])
                ->timeout(30)
                ->get("{$baseUrl}/buy/browse/v1/item_summary/search", [
                    'q'            => $reference,
                    'category_ids' => '281',
                    'limit'        => 10,
                    'filter'       => 'buyingOptions:{FIXED_PRICE}',
                    'fieldgroups'  => 'MATCHING_ITEMS',
                ]);

            if (!$response->successful()) {
                $this->error("  ❌ Browse API hatası — HTTP {$response->status()}");
                $this->line("  Yanıt: " . substr($response->body(), 0, 300));
                return;
            }

            $data = $response->json();
            $total = $data['total'] ?? 0;
            $items = $data['itemSummaries'] ?? [];

            $this->line("  ✅ Browse API yanıtı: {$total} sonuç bulundu");

            if (!empty($items)) {
                $rows = array_map(fn ($item) => [
                    substr($item['title'] ?? '', 0, 50) . (strlen($item['title'] ?? '') > 50 ? '...' : ''),
                    ($item['price']['value'] ?? '?') . ' ' . ($item['price']['currency'] ?? ''),
                    $item['condition'] ?? 'N/A',
                    $item['seller']['username'] ?? '—',
                    $item['itemLocation']['country'] ?? '—',
                ], array_slice($items, 0, 5));

                $this->table(['Başlık', 'Fiyat', 'Durum', 'Satıcı', 'Ülke'], $rows);
            }

            if ($total === 0 && $sandbox) {
                $this->warn('  ⚠ Sandbox ortamında sınırlı veri bulunur. Production ortamında daha fazla sonuç beklenmektedir.');
                $this->line('  → EBAY_ENVIRONMENT=production olarak değiştirerek tekrar deneyin.');
            }
        } catch (\Throwable $e) {
            $this->error("  ❌ Browse API bağlantı hatası: " . $e->getMessage());
        }
    }

    private function testFullScanDryRun(string $reference): void
    {
        $clientId = config('services.ebay.client_id');
        $clientSecret = config('services.ebay.client_secret');
        $watchChartsKey = config('services.watchcharts.api_key');

        $sources = [];

        // eBay test
        if ($clientId && $clientSecret) {
            $this->line('  → eBay Browse API: yapılandırılmış ✅');
            $sources[] = 'ebay';
        } else {
            $this->line('  → eBay Browse API: yapılandırılmamış ❌');
        }

        // AI Service test
        $aiUrl = config('services.ai.base_url');
        try {
            $aiHealth = Http::timeout(5)->get("{$aiUrl}/health");
            $this->line('  → AI Servis: ' . ($aiHealth->successful() ? 'çalışıyor ✅' : "yanıt: {$aiHealth->status()} ⚠"));
            if ($aiHealth->successful()) $sources[] = 'ai-service';
        } catch (\Throwable) {
            $this->line('  → AI Servis: ulaşılamıyor ⚠ (Docker çalışıyor mu?)');
        }

        // WatchCharts test
        if ($watchChartsKey) {
            $this->line('  → WatchCharts API: yapılandırılmış ✅');
            $sources[] = 'watchcharts';
        } else {
            $this->line('  → WatchCharts API: yapılandırılmamış (opsiyonel)');
        }

        $this->newLine();
        $this->info("Aktif kaynaklar: " . (empty($sources) ? 'YOK' : implode(', ', $sources)));
    }
}
