# WatchSync AI — Active Context

> **Son Güncelleme:** 2026-07-01  
> **Mevcut Faz:** Aşama 5 — API Key Girişi & Gerçek Veri Testi DEVAM EDİYOR 🔄  
> **Sıradaki (PLANLANDI):** Aşama 7 — Ekip Yönetimi & İzin Sistemi (detaylı plan bu dosyanın SONUNDA; geliştirme sonraki chat'te başlayacak, her adımda Playwright testi)  
> **Sıradaki (bekleyen):** eBay Developer hesap açılması ve Rolex 126610LN gerçek veri testi  
> **Görev Dağılımı:** Hafta 1-6 Mehmet yaptı (backend + frontend). Hafta 7+ Berat devam edecek (backend + frontend, AI ile çalışarak). Junior/Senior ayrımı kaldırıldı.

---

## ⚠️ Görev Sonu Kuralları (HER CHAT SONUNDA YAPILACAK)

1. Bu dosyayı (`activecontext.md`) güncelle — tamamlanan iş, yeni dosyalar, mimari değişiklikler
2. `prompt.md` dosyasını güncelle — bir sonraki haftanın prompt'unu yaz
3. `progress.md` dosyasını güncelle — checkbox'ları işaretle
4. Chat üzerinde "prompt.md dosyasını aç ve kopyala" uyarısı ver

---

## Tamamlanan Haftalar (1–4)

### Hafta 1 — Proje Altyapısı ✅
- Laravel 13 + Sanctum + MySQL + Redis + RabbitMQ (Docker)
- Next.js 16 (App Router) + React 19 + Tailwind v4 + Zustand + Zod v4
- Dark mode tasarım sistemi, Sidebar/TopBar/DashboardLayout

### Hafta 2 — Auth & Dashboard ✅
- Auth API: register/login/logout/me (Sanctum token)
- Login/Register sayfaları (RHF + Zod)
- Dashboard KPI kartları (5 metrik, API bağlantılı)
- Zustand auth store, seeder'lar (brands.json, models.json)

### Hafta 3 — Envanter CRUD ✅
- Watch CRUD API (8 endpoint), InventoryStateMachine
- Görsel yükleme + GD thumbnail (300x300)
- Envanter tablosu + filtreler + sayfalama
- 4 adımlı saat ekleme/düzenleme formu (Zod), optimistic update

### Hafta 4 — Redis Lock & Kuyruk ✅
- `InventoryLockService` — Redis Mutex (executeWithLock, safeStatusTransition)
- WatchController.updateStatus → 409 Conflict on lock timeout
- `SyncInventoryJob`, `UpdatePlatformStockJob`, `ProcessWebhookJob`
  - tries:3, backoff:[5,30,120], WithoutOverlapping, dead-letter (failed())
- `SyncStatusUpdated` event (broadcasting-ready)
- `GET /api/dashboard/activities?since=` — polling endpoint
- `ActivityFeed` bileşeni (10s polling, slide-up animasyon, live indicator)
- Market Scanner sayfa iskeleti (SVG grafik placeholder, rakip fiyat tablosu)
- `ErrorBoundary` (retry, dev-mode detay), `ToastContainer` + `toastStore`
- Entegrasyon testleri: 10 eşzamanlı istek, 409 testi, geçmiş kaydı

---

## Proje Mimarisi

### Backend (Laravel 13)
```
backend/
├── app/
│   ├── Console/Commands/ → RefreshEbayTokens
│   ├── Events/           → SyncStatusUpdated
│   ├── Http/
│   │   ├── Controllers/Api/ → AuthController, DashboardController, WatchController, PlatformController, EbayController, Chrono24FeedController, WebhookController
│   │   ├── Middleware/      → IpWhitelist
│   │   └── Requests/Watch/  → Store, Update, UpdateStatus, UploadImage
│   ├── Jobs/             → SyncInventoryJob, UpdatePlatformStockJob, ProcessWebhookJob
│   ├── Models/           → Watch, WatchImage, Dealer, User, Platform, PlatformConnection, SyncLog, InventoryStatusHistory
│   ├── Services/         → InventoryStateMachine, InventoryLockService, WatchImageService, EbayOAuthService, EbayTaxonomyService, Chrono24FeedService, EbayListingService, ShopifyService
│   └── Providers/
├── config/               → queue.php, sanctum.php, database.php, services.php (eBay/Chrono24 config)
├── database/migrations/  → dealers, users, watches, watch_images, platforms, platform_connections (+oauth fields), sync_logs, inventory_status_histories, users(notifications_read_at)
├── routes/api.php
├── routes/console.php    → eBay token refresh cron (hourly)
└── tests/Feature/        → AuthTest, InventoryLockTest
```

### Frontend (Next.js 16)
```
frontend/src/
├── app/
│   ├── layout.tsx                         → Root (Inter, JetBrains Mono, ToastContainer)
│   ├── (auth)/login, register/
│   ├── (dashboard)/
│   │   ├── layout.tsx                     → AuthGuard + Sidebar + TopBar + ErrorBoundary
│   │   ├── dashboard/page.tsx             → KPI + ActivityFeed
│   │   ├── inventory/page.tsx             → WatchTable + WatchFormModal
│   │   ├── market-scanner/page.tsx        → Placeholder (Hafta 8)
│   │   └── settings/page.tsx              → Platform Ayarları (eBay/Chrono24/Shopify)
│   └── (public)/page.tsx                  → Landing
├── components/
│   ├── auth/       → AuthGuard
│   ├── dashboard/  → ActivityFeed
│   ├── inventory/  → WatchTable, WatchFormModal, WatchFilters, StatusBadge, EmptyState, TableSkeleton, PlatformToggles, SyncStatusBadges, BulkActions
│   ├── layout/     → Sidebar, TopBar, NotificationDrawer
│   ├── settings/   → PlatformCard
│   └── ui/         → ErrorBoundary, ToastContainer
├── lib/            → api.ts (Axios), watches-api.ts, platforms-api.ts
├── stores/         → auth.ts, inventoryStore.ts, toastStore.ts, platformStore.ts, notificationStore.ts
└── types/          → index.ts (..., PlatformInfo, PlatformCredentials, PlatformStatus, SyncStatus, PlatformSyncStatus, Notification)
```

### API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout          (auth)
GET    /api/auth/me              (auth)
GET    /api/dashboard/stats      (auth)
GET    /api/dashboard/activities (auth) ?since=&limit=
GET    /api/watches              (auth)
POST   /api/watches              (auth)
GET    /api/watches/{id}         (auth)
PUT    /api/watches/{id}         (auth)
DELETE /api/watches/{id}         (auth)
PATCH  /api/watches/{id}/status  (auth) → Redis Lock → 409 on conflict
POST   /api/watches/{id}/images  (auth)
DELETE /api/watches/{watchId}/images/{imageId} (auth)

--- Hafta 5: Platform & eBay ---
GET    /api/feeds/chrono24.xml   (IP Whitelist) ?dealer_id=
GET    /api/ebay/callback         (public — OAuth redirect)
GET    /api/ebay/auth-url         (auth) → eBay OAuth URL
POST   /api/ebay/disconnect       (auth)
GET    /api/platforms             (auth) → tüm platformlar + bağlantı durumları
PUT    /api/platforms/{id}/credentials (auth) → API key/secret kaydet
POST   /api/platforms/{id}/disconnect  (auth) → bağlantıyı kes
POST   /api/watches/{watchId}/platforms/{platformId}/toggle (auth) → sync tetikle

--- Hafta 6: eBay Listeleme & Shopify ---
POST   /api/webhooks/ebay        (public — webhook, imza doğrulamalı)
POST   /api/webhooks/shopify     (public — webhook, HMAC-SHA256)
POST   /api/watches/bulk-publish (auth) → toplu yayınlama (max 50)
GET    /api/watches/{id}/sync-status (auth) → platform bazında sync durumu
GET    /api/notifications        (auth) → son 7 gün bildirimleri
POST   /api/notifications/read-all (auth) → tümünü okundu işaretle
```

### Docker (compose.yaml)
- `laravel.test` → PHP 8.5 (port 80)
- `mysql:8.4` → port 3306
- `redis:alpine` → port 6379
- `rabbitmq:4-management` → port 5672/15672

### Teknoloji Versiyonları
- Backend: Laravel 13, PHP 8.5, Sanctum, MySQL 8.4, Redis
- Frontend: Next.js 16.2.1, React 19.2.4, TypeScript 5, Tailwind v4, Zustand 5, Zod 4.3, RHF 7.72, Axios 1.14, Lucide 1.7
- Queue: Redis driver, 3 retry, exponential backoff

### Hafta 5 — Chrono24 & eBay Bağlantıları ✅
- `Chrono24FeedService` — XML feed oluşturma, zorunlu düğümler, koşul/mekanizma eşleştirme
- `GET /api/feeds/chrono24.xml` — IP Whitelist middleware korumalı
- `IpWhitelist` middleware — config tabanlı IP kısıtlama, boş whitelist = izin ver (dev)
- `EbayOAuthService` — Authorization Code Grant, token exchange, refresh, sandbox/prod
- `EbayController` — `GET /api/ebay/auth-url`, `GET /api/ebay/callback`, `POST /api/ebay/disconnect`
- OAuth state cache (CSRF koruması), frontend popup redirect
- `EbayTaxonomyService` — `getItemAspectsForCategory(281)`, zorunlu alan eşleştirme, Authenticity Guarantee
- `PlatformController` — `GET /api/platforms`, `PUT /api/platforms/{id}/credentials`, `POST /api/platforms/{id}/disconnect`
- `POST /api/watches/{watchId}/platforms/{platformId}/toggle` — senkronizasyon tetikleme
- `RefreshEbayTokens` artisan komutu — saatlik cron job (console.php Schedule)
- Migration: `refresh_token`, `token_expires_at`, `settings` → platform_connections
- Platform Ayarları sayfası (`/dashboard/settings`) — eBay/Chrono24/Shopify kartları
- `PlatformCard` bileşeni — bağlantı durumu, API key formu, OAuth popup
- `PlatformToggles` bileşeni — envanter tablosunda platform toggle switch'leri
- `platformStore` (Zustand) + `platforms-api.ts` — platform state yönetimi
- TypeScript tipleri: `PlatformInfo`, `PlatformCredentials`, `PlatformStatus`

---

## Hafta 6 — eBay Listeleme & Shopify Entegrasyonu ✅

### Backend
- `EbayListingService` — eBay Inventory API tam entegrasyonu
  - `createOrReplaceInventoryItem`, `createOffer`, `publishOffer`, `publishWatch` (tam akış), `updateInventoryQuantity`
  - Authenticity Guarantee zorunlu alan eşleştirmesi, condition ID mapping (1000/1500/3000), aspect formatting
  - Token auto-refresh (`getValidToken`), SKU formatı: `WS-00000123`
  - eBay title max 80 char, default listing description builder
- `ShopifyService` — Shopify Admin API (GraphQL 2024-10)
  - `productCreate` mutation (title, tags, variants, metafields, media)
  - `productUpdate` mutation, `inventoryAdjustQuantities` mutation (delta-based stok)
  - GraphQL düzeyinde hata yönetimi + userErrors kontrolü
- `WebhookController` — eBay ve Shopify webhook handler'ları
  - `POST /api/webhooks/ebay` — eBay notification → SKU'dan watch_id çıkarma → ProcessWebhookJob
  - `POST /api/webhooks/shopify` — Shopify `orders/create` ve `orders/cancelled` → stok kilitleme/açma
  - eBay webhook imza doğrulaması (X-EBAY-SIGNATURE header)
  - Shopify HMAC-SHA256 imza doğrulaması (hash_equals ile güvenli karşılaştırma)
  - Dev mode: boş verification token = bypass (geliştirme kolaylığı)
- `SyncInventoryJob` güncellendi — gerçek platform API entegrasyonu (EbayListingService/ShopifyService)
- `UpdatePlatformStockJob` güncellendi — gerçek eBay/Shopify stok güncelleme API çağrıları
- `PlatformController` genişletildi — `bulkPublish` (max 50), `syncStatus` endpoint'leri
- `DashboardController` genişletildi — `notifications`, `markAllNotificationsRead` endpoint'leri
- Migration: `notifications_read_at` sütunu users tablosuna eklendi
- Config: `services.shopify.webhook_secret`, `services.ebay.webhook_verification_token`

### Frontend
- `SyncStatusBadges` bileşeni — platform bazında `Synced ✓ / Pending ⏳ / Error ✗` badge'leri + tooltip
- `BulkActions` bileşeni — çoklu seçim → platform bazında toplu yayınlama + progress bar + sonuç göstergesi
- `NotificationDrawer` bileşeni — sağdan açılan bildirim paneli, okunmamış dot, türe göre ikon/renk, zaman formatı
- `TopBar` güncellendi — bildirim sayacı (badge, max "99+"), 30s polling, drawer entegrasyonu
- `WatchTable` güncellendi — seçim state yukarı taşındı (lifted), Sync Status sütunu eklendi
- `notificationStore.ts` (Zustand) — fetchNotifications, markAllRead, toggleDrawer, closeDrawer
- Envanter sayfası güncellendi — BulkActions + selectedIds state + platform fetch
- TypeScript: `SyncStatus`, `PlatformSyncStatus`, `Notification`, `NotificationResponse`, `BulkPublishResponse`
- `platforms-api.ts` genişletildi: `getSyncStatus`, `bulkPublish`, `getNotifications`, `markAllNotificationsRead`
- CSS: `slideInRight` animasyonu (NotificationDrawer giriş efekti)

---

## Hafta 6 İyileştirmeleri ✅

### Backend
- Migration: `ebay_listing_id`, `ebay_offer_id`, `shopify_product_id`, `shopify_variant_id` → watches tablosu (indexli)
- `EbayListingService`: `updateOffer()`, `updateWatch()`, `withdrawOffer()` metodları eklendi
- `EbayListingService`: `ebayHttp()` helper — retry(3, exponential backoff, 429/5xx handling)
- `ShopifyService`: `productDelete()` metodu (GraphQL mutation), `graphql()` retry(3, Retry-After)
- `publishWatch()` → ebay_listing_id/ebay_offer_id, `productCreate()` → shopify_product_id/shopify_variant_id kaydediyor
- `SyncInventoryJob`: mevcut listing varsa update, yoksa publish (akıllı sync)
- `RemovePlatformListingJob` — toggle off yapıldığında listing kaldırma (eBay withdrawOffer / Shopify productDelete)
- `PlatformController.toggleSync()` — enabled=false → RemovePlatformListingJob dispatch
- `WebhookSubscriptionService` — platform bağlantısı kurulunca otomatik webhook kayıt (eBay Notification API + Shopify GraphQL)
- `PlatformController.updateCredentials()` ve `EbayController.callback()` → webhook registration trigger
- `PlatformController.bulkPublish()` → batch_id + cache tracking, `bulkPublishStatus()` endpoint
- `DashboardController.markNotificationRead()` — cache-based tek bildirim okundu; `notifications()` → watch_id eklendi
- `ProcessWebhookJob` — platform/dealer ownership doğrulaması (PlatformConnection üzerinden)
- Routes: `GET /api/watches/bulk-publish/{batchId}/status`, `POST /api/notifications/{id}/read`

### Frontend
- `SyncStatusBadges`: N+1 çözüldü — prop-based, artık per-row fetch yok
- `WatchController.index()`: bulk-fetch platforms/connections/sync_logs → `sync_statuses` array
- `BulkActions`: gerçek polling progress (2s interval, batch_id), `onPublishComplete` callback
- `NotificationDrawer`: per-notification "okundu" butonu (Check ikonu), click-to-navigate (watch_id)
- `notificationStore`: `markRead(id)` action eklendi
- `inventory/page.tsx`: `onPublishComplete={() => fetchWatches()}` — publish sonrası tablo yenileme
- Watch type: `sync_statuses?: PlatformSyncStatus[]`, Notification type: `watch_id?: number`
- Favicon: özel SVG ikon (saat + sync motifi) — `icon.svg`

### Güvenlik
- `ProcessWebhookJob`: verifyOwnership — watch'ın dealer'ının ilgili platform'a aktif bağlantısı olduğunu doğrular
- Favicon/apple-touch-icon metadata layout.tsx'e eklendi

---

## Hafta 7 Planı — AI Görsel İşleme Mikroservisi

### Senior (S)
- Python FastAPI servisi kurulumu (Dockerfile + compose entegrasyonu)
- SAM 2 model entegrasyonu — `POST /api/ai/segment` endpoint'i
- Matting pipeline: SAM 2 maske → alpha matting → color decontamination → RGBA çıktı
- Arka plan değiştirme: Önceden tanımlı lüks arka planlar (beyaz stüdyo, siyah kadife, mermer)
- Laravel proxy endpoint'i: `POST /api/watches/{id}/ai-enhance` → FastAPI forward

### Junior (J)
- AI Studio sayfası: Split layout — sol yüksek çözünürlüklü görsel önizleme, sağ taraf kontroller
- "AI Enhance" butonu: görsel yükleme → FastAPI'ye gönder → işlenmiş görseli önizle → kaydet
- Arka plan seçici UI: küçük resim galerisi + özel arka plan yükleme seçeneği
- Before/After karşılaştırma bileşeni (slider)

---

## Aşama 1: Acil Fix & Rebuild ✅ (2026-04-10)

### Tamamlanan İşler
- **AI Studio watch ID 0 bug fix:** Saat seçici dropdown eklendi (`page.tsx`). `watchesApi.list()` ile aktif saatler yükleniyor. Saat seçilmeden "AI ile İşle" butonu disabled. Seçilen watch ID `enhanceWatchImage()` fonksiyonuna geçiriliyor.
- **RabbitMQ `.env` düzeltmesi:** `compose.yaml`'daki RabbitMQ env vars düzeltildi — `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` (resmi image env adları).
- **Queue worker daemonize:** `docker/supervisord-queue.conf` oluşturuldu — PHP + queue-worker Supervisor programları. `compose.yaml`'da volume mount ile container'a enjekte edildi. `php artisan queue:work redis` otomatik başlıyor.
- **Docker rebuild:** `ai-service` yeniden build edildi (Playwright kaldırılmış, ban-free strateji).
- **Frontend build:** `npm run build` hatasız geçti.

### Yeni / Değişen Dosyalar
```
frontend/src/app/(dashboard)/dashboard/ai-studio/page.tsx (watch selector eklendi)
backend/docker/supervisord-queue.conf (yeni — Supervisor PHP + queue-worker config)
backend/compose.yaml (RabbitMQ env fix, supervisor volume mount, ai-service rebuild)
```

---

## Aşama 2: Eksik Frontend UI'lar ✅ (2026-04-10)

### Tamamlanan İşler

**Görev 5 — AI Açıklama Üretimi UI:**
- `AiDescriptionGenerator.tsx` bileşeni oluşturuldu — dil seçici (EN/DE/TR), streaming text simülasyonu (15ms interval, 1-3 karakter chunk), düzenlenebilir textarea, "Açıklama Üret" / "Yeniden Üret" / "Kopyala" / "Uygula" butonları
- AI Studio sayfasına entegre edildi — sağ panel kontrolleri
- `market-api.ts` güncellendi — watch_id varsa `/watches/{id}/generate-description`, yoksa generic endpoint

**Görev 6 — Platform Test Connection:**
- `PlatformController.php`'ye `testConnection()` metodu eklendi + 3 private helper:
  - eBay: OAuth access_token ile `/sell/account/v1/privilege` kontrolü
  - Shopify: GraphQL `{ shop { name } }` sorgusu
  - Chrono24: API key veya bağlantı durumu kontrolü
- `api.php`'ye `POST /api/platforms/{id}/test-connection` route'u eklendi
- `platforms-api.ts`'ye `testConnection()` metodu eklendi
- `PlatformCard.tsx`'ye "Bağlantıyı Test Et" butonu + başarı/hata feedback UI eklendi

**Görev 7 — WatchCharts Trend Grafiği:**
- `MarketScrapingService.php`'ye `getWatchChartsTrend()` + `normalizeTrend()` metodları eklendi — WatchCharts API'den fair market value, trend yönü, tarihsel veri noktaları çekiyor, 1 saatlik cache
- `periodToDate()` güncellendi — `3y` (3 yıl) period desteği eklendi
- `MarketController.php`'ye `GET /api/market/watchcharts-trend/{ref}` endpoint'i eklendi — 6m/1y/3y period seçenekleri
- `market-api.ts`'ye `WatchChartsTrend` tipi ve `getWatchChartsTrend()` fonksiyonu eklendi
- Market Scanner sayfasına entegre edildi:
  - Period selector: `3y` seçeneği eklendi (7d/30d/90d/6m/1y/3y)
  - **WatchCharts Piyasa Değeri kartı:** gold vurgulu, fair market value gösterimi, "Bu saat piyasada ortalama X€ değerinde", trend badge + yüzde değişim
  - **WatchCharts Trend grafiği:** ayrı panel, 6m/1y/3y period seçici (gold tema), horizontal bar chart, kaynak + güncelleme tarihi, API anahtarı yoksa bilgilendirme mesajı
- Frontend build hatasız geçti ✅

### Yeni / Değişen Dosyalar
```
frontend/src/components/inventory/AiDescriptionGenerator.tsx (yeni)
frontend/src/app/(dashboard)/dashboard/ai-studio/page.tsx (AiDescriptionGenerator entegrasyonu)
frontend/src/lib/market-api.ts (generateDescription güncellendi, WatchChartsTrend eklendi)
frontend/src/lib/platforms-api.ts (testConnection eklendi)
frontend/src/components/settings/PlatformCard.tsx (test connection UI eklendi)
frontend/src/app/(dashboard)/dashboard/market-scanner/page.tsx (WatchCharts trend entegrasyonu)
backend/app/Http/Controllers/Api/PlatformController.php (testConnection endpoint)
backend/app/Http/Controllers/Api/MarketController.php (watchChartsTrend endpoint, 3y period)
backend/app/Services/MarketScrapingService.php (getWatchChartsTrend, normalizeTrend, 3y period)
backend/routes/api.php (test-connection, watchcharts-trend route'ları)
```

### API Endpoint'leri (Yeni)
```
POST   /api/platforms/{id}/test-connection  (auth) → platform bağlantı testi
GET    /api/market/watchcharts-trend/{ref}   (auth) → ?period=6m|1y|3y → WatchCharts trend verisi
```

---

## Aşama 3: UX İyileştirmeleri ✅ (2026-04-10)

### Tamamlanan İşler

**Görev 8 — 5 Adımlı Saat Ekleme Wizard:**
- `WatchFormModal.tsx` yeniden yapılandırıldı — 4 adımdan 5 adıma:
  1. **Marka & Model** — brand, model, condition seçimi
  2. **Referans & Yıl** — reference_number, year (ayrı adım — pazar tarayıcı önemini vurgulayan bilgi notu)
  3. **Teknik Detaylar** — movement, case_material, bracelet, dial_color, diameter, water_resistance, power_reserve, scope_of_delivery (compact 2-column grid)
  4. **Fotoğraflar** — drag&drop image upload + existing image management
  5. **Fiyat & Açıklama** — currency, cost/sale price, profit preview, status, description + AI butonu
- Step indicator, navigation, validation logic güncellendi (5 step desteği)

**Görev 9 — "AI ile Tamamla" Butonu:**
- Fiyat & Açıklama adımında (Step 5) Sparkles ikonu ile "AI ile Tamamla" butonu
- `generateDescription()` API çağrısı — marka, model, referans, yıl, kondisyon bilgilerini gönderir
- Gemini 2.0 Flash ile Türkçe profesyonel açıklama üretir
- Sadece boş açıklama alanını doldurur (mevcut açıklamayı ezmez)
- Loading state + hata mesajı feedback UI

**Görev 10 — Mobil Bottom Navigation:**
- `BottomNav.tsx` yeni bileşen oluşturuldu — 5 nav item (Dashboard, Envanter, AI Studio, Pazar, Ayarlar)
- `md:hidden` ile sadece mobilde görünür
- Active state indicator (mavi renk + nokta)
- iOS safe area desteği (`env(safe-area-inset-bottom)`)
- Dashboard layout'a entegre edildi — `pb-20 md:pb-8` ile bottom nav altında kalan içerik koruması

**Görev 11 — AI Studio Tablet Layout:**
- Grid breakpoint `lg:grid-cols-3` → `xl:grid-cols-3` (tablet'te tam width stacking)
- Kontroller paneli: `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1` — tablet'te yatay, masaüstünde dikey
- AiDescriptionGenerator tam genişlik span (`col-span-2 md:col-span-3 xl:col-span-1`)
- 768px-1280px arası optimize edildi

### Yeni / Değişen Dosyalar
```
frontend/src/components/inventory/WatchFormModal.tsx (5-step wizard + AI ile Tamamla)
frontend/src/components/layout/BottomNav.tsx (yeni — mobil bottom navigation)
frontend/src/app/(dashboard)/layout.tsx (BottomNav entegrasyonu + pb-20 mobile padding)
frontend/src/app/(dashboard)/dashboard/ai-studio/page.tsx (xl breakpoint + tablet grid)
```

---

## Bilinen Kısıtlar / Notlar
- Broadcasting (Pusher/Reverb) henüz kurulmadı, ActivityFeed polling ile çalışıyor
- Docker Desktop Windows: `vendor/` klasörü named volume (`sail-vendor`) olarak ayrıldı — bind mount I/O yavaşlığını önlemek için
- `composer install --no-dev` sonrası `php artisan optimize` çalıştırılmalı
- `statefulApi()` kaldırıldı (bootstrap/app.php) — sadece token-based auth kullanılıyor
- `.env` ayarları: `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `BCRYPT_ROUNDS=10` (dev)
- Auth token `localStorage`'da — production'da httpOnly cookie'ye geçilecek
- **LLM:** OpenAI kaldırıldı → Gemini 2.0 Flash (`LlmService.php`, `config/services.php`, `.env.example` güncellendi)
- **Gemini API:** Google AI Studio üzerinden ücretsiz — `https://generativelanguage.googleapis.com/v1beta/openai` (OpenAI-uyumlu endpoint, kod değişikliği minimum)
- **AI Görsel İşleme (SAM 2):** Sadece arka plan kaldırma/değiştirme yapar. Saatin çiziklerini düzeltmez, model koluna giydirmez, yeni görsel üretmez. Tamamen ücretsiz (açık kaynak, lokal çalışır).
- **Market Scanner — Ban-Free Strateji (Yeniden Yazıldı):**
  - **Tier 1 — eBay Browse API (BİRİNCİL):** Ücretsiz, resmi, sıfır ban riski. Laravel MarketScrapingService'den doğrudan çağrılır. client_credentials OAuth, category 281 = Wristwatches, 5000 çağrı/gün.
  - **Tier 2 — Chrono24 + Watchfinder JSON-LD:** Ücretsiz, minimal risk. AI servisinden çağrılır (schema.org structured data okuma).
  - **Tier 3 — WatchCharts API (TREND ANALİZİ):** Ücretli ($49-199/ay), tarihsel fiyat trendi + fair market value için önerilen. `WATCHCHARTS_API_KEY` varsa Laravel'den çağrılır. Frontend Market Scanner sayfasında trend grafiğine veri sağlar.
  - **~~Playwright~~ KALDIRILDI:** IP ban riski nedeniyle tüm headless browser kodu temizlendi.
  - Tüm kaynaklar sırayla çalışır, sonuçlar birleşir, dedup + price>0 filtre, price_histories'e kaydedilir.

---

## Hafta 11 — Uçtan Uca Test & Hata Giderme ✅ (TAMAMLANDI)

### Tamamlanan İşler
- Branch: `berat/feature/week11-testing` (develop'tan, CRM + AI branch'ları merge edildi)
- **Backend Test Suite (PHPUnit):** 130 test, 353 assertion — TAMAMI GEÇİYOR (1 skip: Redis health)
  - Factory'ler: WatchFactory, CustomerFactory, InvoiceFactory
  - Feature testler: WatchCrud, CustomerCrud, Invoice, Dashboard, Settings, Chrono24Feed, Webhook, HealthCheck, Auth
  - Unit testler: InventoryStateMachine (11 test — tüm geçerli/geçersiz geçişler)
  - **YENİ:** EbayIntegrationTest (11 test), ShopifyIntegrationTest (9 test), AiServiceTest (14 test)
  - Bug bash: 128 hata → 0'a indirildi (Mass Assignment, FK constraint, Content-Type, URL encoding düzeltmeleri)
  - InventoryLockService: Redis::lock → Cache::lock (test ortamında array driver ile çalışır)
  - bootstrap/providers.php: Horizon/Telescope koşullu yükleme (class_exists + extension_loaded)
  - composer.json: dont-discover (horizon, telescope)
- **Frontend Test Suite (Vitest):** 12 test dosyası, 63 test (tamamı geçiyor)
  - Store testleri: auth, inventory, notification, platform, toast (5 dosya, 37 test)
  - Bileşen testleri: AuthGuard, EmptyState, ErrorBoundary, StatusBadge, SyncStatusBadges, TableSkeleton, WatchFilters (7 dosya, 26 test)
- **E2E Altyapısı (Playwright):** Config + Chromium + 3 spec dosyası
  - auth.spec.ts, navigation.spec.ts, visual.spec.ts
- **AI Servis Testleri (Python):** `test_ai_endpoints.py` — SAM2, LLM, scraping pipeline mock testleri
- **UI/UX Son Dokunuşlar:**
  - Mikro-animasyonlar: CSS keyframes (scaleIn, bounceIn, shimmer, pageEnter) + utility classes (btn-press, card-hover, input-glow, stagger, shimmer)
  - `PageTransition.tsx` — sayfa geçiş animasyon wrapper'ı (dashboard layout'a entegre)
  - `EmptyState.tsx` — inline SVG saat illüstrasyonu + animasyonlar (Package ikonu yerine)
  - `OnboardingTour.tsx` — 4 adımlı ilk kullanım rehberi (localStorage ile tek sefer gösterim)

### Yeni / Değişen Dosyalar (Hafta 11)
```
backend/database/factories/WatchFactory.php
backend/database/factories/CustomerFactory.php
backend/database/factories/InvoiceFactory.php
backend/tests/Feature/WatchCrudTest.php
backend/tests/Feature/CustomerCrudTest.php
backend/tests/Feature/InvoiceTest.php
backend/tests/Feature/DashboardTest.php
backend/tests/Feature/SettingsTest.php
backend/tests/Feature/Chrono24FeedTest.php
backend/tests/Feature/WebhookTest.php
backend/tests/Feature/HealthCheckTest.php
backend/tests/Feature/AuthTest.php (düzeltildi)
backend/tests/Feature/InventoryLockTest.php (yeniden yazıldı — Cache::lock)
backend/tests/Feature/EbayIntegrationTest.php (yeni — 11 test)
backend/tests/Feature/ShopifyIntegrationTest.php (yeni — 9 test)
backend/tests/Feature/AiServiceTest.php (yeni — 14 test)
backend/tests/Unit/InventoryStateMachineTest.php
backend/app/Services/InventoryLockService.php (Redis::lock → Cache::lock)
backend/bootstrap/providers.php (koşullu Horizon/Telescope)
backend/composer.json (dont-discover)
ai-service/tests/test_ai_endpoints.py (yeni — Python pytest)
frontend/vitest.config.ts
frontend/playwright.config.ts
frontend/src/__tests__/setup.tsx
frontend/src/__tests__/stores/authStore.test.ts
frontend/src/__tests__/stores/inventoryStore.test.ts
frontend/src/__tests__/stores/notificationStore.test.ts
frontend/src/__tests__/stores/platformStore.test.ts
frontend/src/__tests__/stores/toastStore.test.ts
frontend/src/__tests__/components/AuthGuard.test.tsx
frontend/src/__tests__/components/EmptyState.test.tsx
frontend/src/__tests__/components/ErrorBoundary.test.tsx
frontend/src/__tests__/components/StatusBadge.test.tsx
frontend/src/__tests__/components/SyncStatusBadges.test.tsx
frontend/src/__tests__/components/TableSkeleton.test.tsx
frontend/src/__tests__/components/WatchFilters.test.tsx
frontend/e2e/auth.spec.ts
frontend/e2e/navigation.spec.ts
frontend/e2e/visual.spec.ts
frontend/src/app/globals.css (animasyonlar eklendi)
frontend/src/app/(dashboard)/layout.tsx (PageTransition + OnboardingTour)
frontend/src/components/ui/PageTransition.tsx (yeni)
frontend/src/components/ui/OnboardingTour.tsx (yeni)
frontend/src/components/inventory/EmptyState.tsx (SVG illüstrasyon)
```

---

## Full Audit (2026-04-07) — Düzeltilen Sorunlar

### BUG FIX
- ✅ Registration `password_confirmation` frontend'den gönderilmiyordu → `auth.ts` + `register/page.tsx`

### GÜVENLİK
- ✅ CORS `*` → `env('FRONTEND_URL')` kısıtlandı (`config/cors.php`)
- ✅ Auth rate limit: login `throttle:10,1`, register `throttle:5,1`
- ✅ Sanctum token expiration: `null` → `1440` (24 saat)
- ✅ Debug error leak kaldırıldı (`AuthController` 500 response)
- ✅ LIKE wildcard injection escape (`WatchController::index`)
- ✅ `since` parametresi validasyona alındı (`DashboardController::activities`)
- ✅ Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- ✅ `poweredByHeader: false`

### PERFORMANS
- ✅ Dashboard stats: 6 sorgu → 1 aggregate + whereIn
- ✅ DB indexleri: `watches(dealer_id,status)`, `watches(brand)`, `sync_logs(status,created_at)`, `platform_connections(dealer_id,platform_id) UNIQUE`
- ✅ Image upload N+1 düzeltildi
- ✅ ActivityFeed: tab gizliyken polling durur
- ✅ WatchFormModal: `URL.createObjectURL` memory leak düzeltildi

### SEO
- ✅ `robots.txt`, `sitemap.ts`, OG/Twitter meta, `lang="tr"`, title template, auth noindex

### KOD KALİTESİ
- ✅ `SyncInventoryJob::$failOnTimeout` string→bool, unused import/variable temizliği, `axios.isAxiosError` type guard

### PRODUCTION İÇİN BEKLEYEN
- ⏳ Auth token: `localStorage` → `httpOnly cookie`
- ⏳ `Content-Security-Policy` header (production domain)
- ⏳ `favicon.ico` / `apple-touch-icon` tasarımı
- ⏳ FormRequest `authorize()` → role-based (owner/manager/staff)
- ⏳ ProcessWebhookJob: platform/dealer ownership doğrulaması
- Platform toggle switch'leri Hafta 5'te eklenecek
- Market Scanner gerçek veri Hafta 8'de gelecek
- `toastStore` helper'lar: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`

---

## Aşama 5: API Key Girişi & Gerçek Veri Testi 🔄 (2026-04-10)

### Tamamlanan İşler

**Görev 18 — .env API Key Yapılandırması:**
- `backend/.env` dosyasına tüm API key placeholder'ları eklendi:
  - `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REDIRECT_URI`, `EBAY_ENVIRONMENT=sandbox`
  - `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_API_VERSION`
  - `GEMINI_API_KEY`, `GEMINI_BASE_URL`, `GEMINI_MODEL`
  - `WATCHCHARTS_API_KEY`, `SENTRY_LARAVEL_DSN`, `SANCTUM_STATEFUL_DOMAINS`
- **Bug Fix:** `EBAY_ENVIRONMENT` config mismatch — `env('EBAY_SANDBOX', true)` → `env('EBAY_ENVIRONMENT', 'sandbox') === 'sandbox'`

**Görev 19 — eBay Browse API + Sandbox Test:**
- `GET /api/market/ebay-test` endpoint'i: OAuth token + Browse API arama testi, detaylı JSON yanıt
- `php artisan market:test-scan` komutu: config doğrulama, token testi, Browse API arama, tam tarama (tüm kaynaklar)
  - `--ebay-only`, `--skip-store` flagları
  - Fiyat istatistikleri + rakip ilanları tablosu

**Görev 20 — Market Scanner Gerçek Veri UI:**
- `testEbayConnection()` + `EbayTestResult` tipi eklendi
- Market Scanner'a **Veri Kaynakları** durum banner'ı: otomatik eBay testi, durum ikonları, örnek sonuçlar

### Yeni / Değişen Dosyalar
```
backend/.env (API key placeholder'ları eklendi)
backend/config/services.php (EBAY_ENVIRONMENT fix)
backend/app/Console/Commands/TestMarketScan.php (yeni)
backend/app/Http/Controllers/Api/MarketController.php (ebayTest endpoint)
backend/routes/api.php (GET /api/market/ebay-test)
frontend/src/lib/market-api.ts (testEbayConnection, EbayTestResult)
frontend/src/app/(dashboard)/dashboard/market-scanner/page.tsx (eBay status banner)
```

### ⏳ Kalan İşler (Kullanıcı Aksiyonu Gerekli)
1. **eBay Developer Account:** https://developer.ebay.com → Client ID + Secret → `.env`'ye gir
2. **GEMINI_API_KEY:** https://aistudio.google.com → API key oluştur → `.env`'ye gir
3. **Shopify Partner Account** (opsiyonel): https://partners.shopify.com
4. **WatchCharts API** (opsiyonel, ücretli): https://watchcharts.com/api
5. Key'ler girildikten sonra: `php artisan market:test-scan 126610LN` ile doğrula
6. Production geçişinde: `EBAY_ENVIRONMENT=production` yap

---

## 🧑‍🤝‍🧑 AŞAMA 7 (SIRADAKİ) — EKİP YÖNETİMİ & İZİN SİSTEMİ — DETAYLI SPEC

> **Plan tarihi:** 2026-07-01 · **Durum:** ⬜ Geliştirme sonraki chat'te başlar · **Görev listesi:** `progress.md` → "AŞAMA 7"
> Bu bölüm bir sonraki chat'in **tek referansı**. Kararlar kilitli; belirsizlik yok.

### 0) Yerel geliştirme ortamı gerçekleri (ÖNEMLİ — bu makine XAMPP)
- Backend: `php artisan serve` **:8001** (8000'de kullanıcının başka projesi "İkra Vakfı" var). `APP_URL=http://127.0.0.1:8001`.
- Frontend: Next.js **:3000**. `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api`. Davet linki `FRONTEND_URL=http://localhost:3000/invite/{token}`.
- DB: XAMPP MariaDB **:3307** (root/boş), DB `watchsync`. PHP **8.3** `C:\php83`. Composer'ı `php C:\ProgramData\ComposerSetup\bin\composer.phar` ile 8.3 üstünde çalıştır; PATH'e `C:\php83` öne al.
- **Mail = log**, **Queue = sync**, **Redis yok** → davet e-postası `backend/storage/logs/laravel.log`'a düşer. Linki almak için: log'da `/invite/` ara.
- Başlatma kolaylığı: proje kökünde `start-dev.bat`.
- Giriş: `demo@watchsync.ai / password` (owner), `superadmin@watchsync.ai / SuperAdmin123!` (platform admin — ayrı sistem).

### 1) Kilitlenen kararlar
- Kimlik: session/cookie (Sanctum SPA) — değişmez.
- İzin modeli: **hibrit** = rol preset (`owner/manager/staff`) + kullanıcı bazında `permissions` JSON override. Çözümleme: owner → tüm izinler; `permissions!=null` → onu kullan; değilse `config('permissions.presets')[role]`.
- Davet edebilen: **owner || `team.manage`'li manager**.
- Davet süresi: **ayarlanabilir** — davet başına `expires_in_days` (opsiyonel) + bayi varsayılanı `invitation_expiry_days` (default 7).
- Veri kapsamı: mevcut `dealer_id` filtresi yeterli (WatchController zaten böyle). Yeni çalışan = aynı dealer_id.

### 2) İzin taksonomisi (kanonik — `config/permissions.php`)
```
inventory.view, inventory.create, inventory.edit, inventory.delete, inventory.publish
inventory.view_cost   (alan düzeyi: maliyet fiyatı)
inventory.view_price  (alan düzeyi: satış fiyatı)
crm.view, crm.manage
invoices.view, invoices.manage
market.view
platforms.manage
ai.use
settings.manage
team.manage
```
Preset başlangıç değerleri (owner=implicit tümü):
- `manager`: team.manage HARİÇ hepsi
- `staff`: `inventory.view`, `ai.use` (owner override ile genişletir)

### 3) Veri modeli (migration'lar)
`users` (eklenecek): `status enum('active','invited','disabled') default 'active'`, `permissions json null`, `invited_by FK users null`, `invited_at ts null`, `last_login_at ts null`.
`invitations` (yeni): `id, dealer_id FK, email, role enum('manager','staff'), permissions json null, token_hash string unique, invited_by FK users, expires_at, accepted_at null, revoked_at null, timestamps`. Index (dealer_id,email).
Backfill: mevcut kullanıcılar `status=active`, `permissions=null` (preset'e düşer).

### 4) API sözleşmesi
**Auth (owner || team.manage)** — grup `permission:team.manage`:
- `GET /api/team` → `{ members:[{id,name,email,role,status,permissions,last_login_at}], invitations:[{id,email,role,expires_at,invited_by}], catalog:{...} }`
- `GET /api/team/permissions` → `{ permissions:[...], presets:{owner,manager,staff} }`
- `POST /api/team/invitations` body `{ email, role:'manager'|'staff', permissions:string[], expires_in_days?:int }` → 201 `{ invitation }` (local/testing'de ayrıca `accept_url` döner — Playwright için)
- `POST /api/team/invitations/{id}/resend` · `DELETE /api/team/invitations/{id}`
- `PUT /api/team/members/{user}/permissions` `{ permissions:string[] }`
- `PUT /api/team/members/{user}/role` `{ role }`
- `POST /api/team/members/{user}/disable` · `.../enable` · `DELETE /api/team/members/{user}`
**Public:**
- `GET /api/invitations/{token}` → `{ email, role, dealer_name, expires_at }` (geçersiz→404, süresi dolmuş→410)
- `POST /api/invitations/{token}/accept` `{ name, password, password_confirmation }` → user yarat + auto-login → `{ user }`
**Settings:** `GET/PUT /api/settings/team-defaults` `{ invitation_expiry_days }`

### 5) Yetkilendirme zorlaması (mevcut güvenlik borcu da kapanır)
- `DealerPermission` middleware + `permission` alias; rotalara `permission:inventory.edit` vb.
- FormRequest `authorize()` → `$this->user()->hasPermission('...')` (şu an hepsi `true`).
- `login`: `status=disabled` → 401; başarı → `last_login_at=now`.
- Fiyat gizleme: `WatchResource` → izin yoksa `sale_price`/`cost_price` alanı **çıkarılır**; Dashboard KPI envanter değeri `inventory.view_price` yoksa gizlenir.

### 6) Güvenlik kuralları (TeamController'da zorla)
owner rolü davet edilemez · davet eden sahip olmadığı izni veremez (subset) · hedef aynı dealer · son owner korunur · e-posta global unique çakışması net 422 · token yalnız hash, tek kullanımlık, süreli, throttle · disabled giriş yapamaz.

### 7) Oluşturulacak/değişecek dosyalar (özet)
```
backend/
  config/permissions.php                                  (yeni)
  database/migrations/*_add_team_fields_to_users.php      (yeni)
  database/migrations/*_create_invitations_table.php      (yeni)
  app/Models/Invitation.php                               (yeni)
  app/Models/User.php                                     (güncelle: fillable/casts/hasPermission/effectivePermissions/canManageTeam/status)
  app/Http/Middleware/DealerPermission.php                (yeni)  + bootstrap/app.php alias
  app/Http/Controllers/Api/TeamController.php             (yeni)
  app/Http/Controllers/Api/InvitationController.php       (yeni)
  app/Http/Requests/Team/{Invite,UpdateMemberPermissions}Request.php, Auth/AcceptInvitationRequest.php (yeni)
  app/Http/Resources/WatchResource.php                    (yeni)  + WatchController kullansın
  app/Notifications/TeamInvitationNotification.php        (yeni)
  app/Http/Controllers/Api/AuthController.php             (login: status + last_login_at)
  app/Http/Controllers/Api/SettingsController.php         (team-defaults)
  app/Http/Requests/Watch/*                               (authorize güncelle)
  routes/api.php                                          (team + invitations + settings/team-defaults + permission middleware)
frontend/
  src/types/index.ts                                      (User: status/permissions; TeamMember, Invitation, PermissionCatalog)
  src/lib/team-api.ts, src/lib/permissions.ts             (yeni)
  src/hooks/usePermission.ts (veya store selector) + <Can>  (yeni)
  src/app/[locale]/(dashboard)/dashboard/team/page.tsx    (yeni)
  src/components/team/{MemberList,InviteMemberModal,PendingInvitations,PermissionMatrix,MemberRow}.tsx (yeni)
  src/app/[locale]/(auth)/invite/[token]/page.tsx         (yeni)
  src/components/layout/Sidebar.tsx                        (Ekip öğesi, izne göre)
  src/components/inventory/WatchTable.tsx + saat detay + dashboard KPI (fiyat gizleme)
  messages/{de,en,tr}.json                                (Team namespace)
e2e/team.spec.ts                                          (yeni)
```

### 8) Playwright test planı (her adımda çalıştır)
Kapsam: owner davet → bekleyen listede görünür → token ile kabul → giriş; `inventory.view_price` yok → fiyat sütunları gizli; `team.manage` yok → Ekip menüsü yok; disable → giriş engeli; manager `team.manage` veremez (403); süresi dolmuş token → kabul başarısız; son owner silinemez. Token'ı almak için: davet POST yanıtı **local/testing'de** `accept_url` döndürür (prod'da dönmez). Her ekranda mobil+masaüstü görsel kontrol.

### 9) Sonraki chat — buradan başla
1. `develop`'tan feature dalı aç: `git checkout develop && git checkout -b feature/team-management` (repo başlangıçta `develop`'ta).
2. Backend'i XAMPP kurulumuyla ayağa kaldır (`start-dev.bat` veya manuel; PHP 8.3 + composer.phar). 
3. progress.md "AŞAMA 7" sırasını uygula: A→B→C→D→G (backend), sonra E→F, sonra H→I→J (frontend), her blok sonrası K (Playwright).
4. Her adımda ilgili checkbox'ları işaretle; bitişte activecontext + progress güncelle.
5. Özellik biterse: kullanıcıyla UX/UI + responsive incelemesi (skill'lerle) yapılacak.

---

## 📌 Son Oturum (2026-07-01)

**Yapılanlar:**
- GitHub repo `develop` dalı `C:\xampp\watchsync-ai`'ye klonlandı; proje XAMPP ortamında sıfırdan ayağa kaldırıldı.
- PHP 8.3.31 portable `C:\php83`'e kuruldu (sistem `php` 7.3'tü, Laravel 13 `^8.3` istiyor). Composer 8.3 üstünde çalıştırıldı.
- Backend: `composer install` (Horizon pcntl/posix ignore), `.env` XAMPP'e göre (DB_PORT=**3307** MariaDB, cache=file, queue=sync, mail=log), key:generate, `watchsync` DB, `migrate --seed` ✅.
- Port çakışması çözüldü: 8000'de kullanıcının "İkra Vakfı" projesi vardı → backend **:8001**'e alındı (`APP_URL`, `NEXT_PUBLIC_API_URL`, `start-dev.bat` güncellendi).
- Frontend: `npm install`, `.env.local`, `npm run dev` :3000 ✅. Doğrulandı (login `/de`'ye yönleniyor, 200).
- Tüm sistem detaylı incelendi (backend + frontend + docs) — 21 model, 27 controller, 31 migration.
- **Aşama 7 (Ekip Yönetimi & İzin Sistemi)** en ince detayına kadar planlandı → progress.md "AŞAMA 7" (49 görev) + activecontext "AŞAMA 7 DETAYLI SPEC".
- Oturum sürekliliği ritüeli kuruldu: proje kökü `CLAUDE.md`, `.claude/commands/watch-kaydet.md` + `watch-devam.md`, projeye özel memory.

**Mevcut durum:**
- Backend :8001 ve frontend :3000 çalışır durumda (bu oturumda). Kod değişikliği YOK — sadece kurulum + planlama + doküman.
- Aşama 7 için henüz kod yazılmadı; plan hazır.

**Sonraki adımlar (watch-devam ile):**
1. `git checkout develop && git checkout -b feature/team-management`.
2. `start-dev.bat` ile ortamı ayağa kaldır.
3. progress.md "AŞAMA 7" sırasını uygula (A→B→C→D→G backend, E→F, H→I→J frontend), her blok sonrası Playwright (K).
