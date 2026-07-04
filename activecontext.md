# WatchSync AI — Active Context

> **Son Güncelleme:** 2026-07-04  
> **Mevcut Faz:** Frontend **P0+P1+P2 TAMAM** + ek **backend güvenlik sertleştirmesi** (eBay webhook kripto imza doğrulama + CSP prod sertleştirme) TAMAM ✅. `feature/team-management` → develop PR açık.  
> **Sıradaki (İLK İŞ):** PR'ın develop'a merge'ini bekle/incele (artık güvenlik commit'i de dahil). Merge sonrası Aşama 7 kapanır → Aşama 8'e geç (aşağıdaki roadmap'e bak). Opsiyonel P2.14 (Market Scanner bilgi mimarisi) büyük iş, ayrı oturuma bırakıldı.  
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

## 📌 Son Oturum (2026-07-02)

**Yapılanlar (Aşama 7 — Ekip Yönetimi & İzin Sistemi):**
- Dal açıldı: `feature/team-management` (develop'tan).
- **Blok A — İzin config:** `backend/config/permissions.php` (16 kanonik izin + owner/manager/staff preset'leri + invitable_roles + default_invitation_expiry_days=7).
- **Blok B — Şema:** migration `users`'a (status/permissions/invited_by/invited_at/last_login_at) + yeni `invitations` tablosu (token_hash unique, dealer/email index). `migrate` ✅, mevcut kullanıcılar active/null backfill.
- **Blok C — Model:** `Invitation` modeli (isExpired/isPending/scopePending). `User`: fillable+casts, `effectivePermissions()`, `hasPermission()`, `canManageTeam()`, status helper'ları, `effective_permissions` accessor `$appends`'e eklendi (→ /auth/me).
- **Blok D — Yetki zorlama:** `DealerPermission` middleware + `permission` alias; login `status=disabled`→401 + `last_login_at`; 4 Watch FormRequest `authorize()` gerçek izne bağlandı; `routes/api.php` 29 rotaya `permission:` (watches/crm/invoices/platforms/market/ai/settings).
- **Blok G — Fiyat gizleme:** `WatchResource` (view_price/view_cost yoksa sale_price/cost_price çıkarılır); WatchController index/show → `resolve()` ile şema korunarak; DashboardController stats → view_price yoksa `total_inventory_value` gizli.
- **Blok E — Davet API:** `TeamController` (12 uç), public `InvitationController` (show/accept), FormRequest'ler (Invite/Accept/UpdateMemberPermissions), `TeamInvitationNotification` (mail, FRONTEND_URL/invite/{token}), Settings team-defaults GET/PUT, `dealers.invitation_expiry_days` migration. **Bug fix:** accept'te `email_verified_at` mass-assignment → `forceFill`.
- **Blok F — Güvenlik:** team.manage zorunlu, owner davet edilemez, subset izin kontrolü, aynı-dealer 403, son-owner koruması, e-posta global unique, disabled giriş engeli — hepsi TeamController'da.
- **Blok H — Frontend UI:** tipler (TeamMember/TeamInvitation/PermissionCatalog...), `team-api.ts`+`invitationApi`, `permissions.ts`, `usePermission` hook + `<Can>`, `dashboard/team/page.tsx` + bileşenler (MemberList/MemberRow/PendingInvitations/InviteMemberModal/PermissionMatrix), Sidebar "Ekip" (izne göre) + i18n, WatchTable & Dashboard KPI fiyat gizleme gating.

**Mevcut durum:**
- Backend testleri: WatchCrud/CustomerCrud/Dashboard/Settings/InventoryLock geçiyor. (Önceden var olan 4 hata: AuthTest register/login session + InvoiceTest x2 — BENİM değişikliklerimle ilgisiz, baseline'da da fail.)
- Frontend `tsc --noEmit` yeni kodda temiz; team/dashboard/inventory sayfaları 200.
- Uçtan uca akış tinker ile doğrulandı (davet→token→kabul→doğru rol/izin). **Tarayıcı etkileşim testi henüz yapılmadı (Blok K).**
- Kod henüz commit'lendi (bu oturum sonu). Kalan bloklar: I, J, K.

**Sonraki adımlar (watch-devam ile):**
1. **Blok I — Davet Kabul Sayfası:** `src/app/[locale]/(auth)/invite/[token]/page.tsx` — `invitationApi.show(token)` ile doğrula → isim+şifre formu → `invitationApi.accept` → dashboard'a yönlendir; geçersiz/süresi dolmuş/kabul edilmiş hata durumları. ⚠️ Next 16 async params (bkz. AGENTS.md / node_modules/next/dist/docs).
2. **Blok J — i18n:** `messages/{de,en,tr}.json` → `Team` namespace (davet/rol/izin etiketleri, hata/başarı). Şu an team UI metinleri sabit TR string; namespace'e taşınacak.
3. **Blok K — Playwright E2E:** `e2e/team.spec.ts` (owner davet → bekleyen listede → token ile kabul → giriş; view_price yok → fiyat gizli; team.manage yok → menü yok; disable → giriş engeli; manager subset 403; expired token; son owner silinemez). Davet POST yanıtı local/testing'de `accept_url` döndürüyor (token seam hazır). Her ekran mobil+masaüstü görsel kontrol.

---

## 📌 Son Oturum (2026-07-02 · devam — Aşama 7 I/J/K bitirildi)

**Yapılanlar (Blok I, J, K + 2 gerçek bug fix):**
- **Blok I — Davet Kabul Sayfası:** `frontend/src/app/[locale]/(auth)/invite/[token]/page.tsx` (yeni). Next 16 `params: Promise` + `use(params)`. Akış: `invitationApi.show(token)` ile doğrula → loading/invalid(404)/expired(410) durumları → isim+şifre formu (RHF+Zod, auth sayfalarıyla aynı stil) → `getCsrfCookie()` + `invitationApi.accept` → `fetchUser()` → `/dashboard`. Davet özet kartı (e-posta + rol rozeti).
- **Blok J — i18n:** `messages/{tr,en,de}.json`'a `Invite` + `Team` namespace'leri eklendi (3 dil simetrik). Team bileşenleri sabit TR stringlerden `useTranslations('Team')`'e taşındı: `dashboard/team/page.tsx`, `MemberList`, `MemberRow`, `PendingInvitations`, `InviteMemberModal`, `PermissionMatrix`. (İzin `label`'ları hâlâ backend `config/permissions.php`'den TR geliyor — tam çoklu dil isterse backend gerekir. Backend davet e-posta lang'i opsiyonel, atlandı.)
- **Blok K — Playwright:** `e2e/team.spec.ts` (yeni) — **5/5 GEÇİYOR**. Kapsam: owner login→team→davet (accept_url seam ile token)→bekleyen listede; yeni context'te davet kabul→dashboard; staff'ta fiyat sütunları + "Ekip" menüsü gizli; owner disable→staff login 401 "devre dışı"; owner satırında Sil/Pasifleştir yok (son-owner UI koruması); geçersiz token→"Geçersiz Davet". Manager-subset(403) & expired-token backend Feature testine bırakıldı (UI fixture/DB-expiry gerektirir; F bloğu sunucuda zaten zorluyor). Robustluk: locale determinizmi için `/tr` öneki, dev-hydration yarışına karşı `networkidle` + göz-toggle kanıtı, OnboardingTour `addInitScript` ile kapatıldı, cömert timeout.

**Yol boyunca bulunan & düzeltilen 2 GERÇEK BUG (tarayıcı testinin amacı):**
1. **SPA login CSRF 419 (tarayıcıda giriş bozuk):** Sayfa `localhost:3000`, API `127.0.0.1:8001` farklı host → JS `XSRF-TOKEN` cookie'sini okuyamıyor → `X-XSRF-TOKEN` header'ı gitmiyor → 419. SANCTUM_STATEFUL_DOMAINS/CORS/FRONTEND_URL zaten `localhost` olduğundan **`frontend/.env.local` `NEXT_PUBLIC_API_URL=http://localhost:8001/api`** yapıldı (host birleşti → cookie okunuyor → login 200). ⚠️ CLAUDE.md hâlâ `127.0.0.1:8001` diyor — **doküman güncellenmeli** (veya API'yi de 127.0.0.1'de tutup her şeyi 127.0.0.1'e almak; ama Next dev 127.0.0.1'de HMR/hydration bozuyor, localhost tercih edildi).
2. **`lib/api.ts` 401 interceptor locale önekini yok sayıyordu:** `/tr/login`, `/login` ile başlamadığı için login 401'inde interceptor sayfayı `/login`'e sert reload edip hata mesajını bastırıyordu. `pathname.replace(/^\/(en|tr|de)(?=\/|$)/,'')` ile locale-aware düzeltildi (artık login sayfasında 401 → hata mesajı gösteriliyor).

**Mevcut durum / ortam:**
- Frontend dev sunucusu **yeni env ile yeniden başlatıldı** (eski PID 24664 kapatıldı, `npm run dev` arka planda `localhost:8001` API ile ayakta). Backend değişmedi (config cache yok, .env per-request okunuyor).
- `tsc --noEmit`: yeni kodda temiz (kalan hatalar önceden var olan `__tests__` dosyalarında, ilgisiz).
- Değişen/yeni dosyalar: `invite/[token]/page.tsx` (yeni), `e2e/team.spec.ts` (yeni), `messages/{tr,en,de}.json`, `dashboard/team/page.tsx`, `components/team/*` (5 dosya), `lib/api.ts` (interceptor fix), `frontend/.env.local` (API URL — gitignore).

**Sonraki adımlar (SONRAKİ CHAT'İN İLK İŞİ — kullanıcı talebi):**
1. **Skill'lerle TAM SİSTEM İNCELEMESİ:** tüm sistemi UI/UX ve genel sistem açısından incele; açıkları/kötü yanları bul, fikir üret ve **düzelt**. Kullanılacak skill'ler: `impeccable` + `frontend:design-review` + `emil-design-eng` (UI/UX), `security-audit` (güvenlik), `frontend:react-patterns` (React kalite), `simplify` (kod kalite). Dev ortam: `start-dev.bat` (frontend localhost:3000, backend localhost:8001) + Playwright/tarayıcı ile canlı inceleme. Giriş: demo@watchsync.ai / password.
2. **CLAUDE.md/doküman:** `NEXT_PUBLIC_API_URL=http://localhost:8001/api` kararını yansıt (aksi halde temiz kurulumda tarayıcı login 419 olur).
3. **Opsiyonel:** manager-subset(403) & expired-token için backend Feature testleri (`tests/Feature/TeamTest.php`) — F bloğu kanıtı.
4. İnceleme + düzeltmeler bitince: `feature/team-management` → `develop` PR.

---

## 📌 Son Oturum (2026-07-02 · devam 2 — TAM SİSTEM İNCELEMESİ)

**Yapılanlar:**
- **3 bağımsız inceleme tamamlandı:** (1) canlı UI/UX tasarım incelemesi (design-review ajanı, tüm sayfalar), (2) frontend kod kalitesi (react-patterns/simplify perspektifi), (3) backend güvenlik/doğruluk incelemesi. Ayrıca deterministik AI-slop taraması (`npx impeccable`).
- **PRODUCT.md yazıldı** (impeccable skill gate'i — register=product, kullanıcı onaylı: lüks saat bayisi / premium-sakin-güvenilir / anti-ref: jenerik SaaS + eski ERP + lüks kitsch). DESIGN.md zaten vardı.
- **CLAUDE.md güncellendi:** `NEXT_PUBLIC_API_URL=http://localhost:8001/api` (localhost zorunlu, 127.0.0.1 → 419 CSRF).
- **Backend blokerleri DÜZELTİLDİ (test edildi):**
  - `PlatformController.toggleSync` — watch dealer sahiplik kontrolü eklendi (cross-tenant sync/kaldırma açığı kapandı); bulk publish cache anahtarı dealer'a bağlandı (`bulk_publish_{dealerId}_{batchId}`).
  - `TeamController.assertGrantableBy(inviter, granted, role)` — `permissions=null` davet/rol değişiminde artık ROL PRESET'İ davet edenin izinleriyle karşılaştırılıyor (privilege escalation kapandı). `[]` = gerçekten izinsiz, serbest.
  - `updateMemberRole`: self-check + grantable kontrolü; owner hedefli işlemler (rol/disable/delete) yalnız owner'a (`assertOwnerActionAllowed`).
  - **Yeni:** `app/Http/Middleware/EnsureUserIsActive.php` — api grubuna append (bootstrap/app.php); disabled kullanıcı permission'sız rotalara da (notifications, profile...) erişemez.
  - `EbayIntegrationTest` gizli kırığı: factory user'a `role=owner` eklendi (Blok D'de permission middleware gelince kırılmış, fark edilmemişti).
  - `backend/testing` (SQLite) git izleminden çıkarıldı + `.gitignore`'a `backend/testing`, `frontend/test-results/` eklendi.
- **Test durumu:** Feature suite 111 passed / 4 fail — 4'ü baseline'daki bilinen hatalar (AuthTest register/login x2 + InvoiceTest x2, bu daldan önce de vardı).

**SONRAKİ CHAT'İN İŞİ — FRONTEND DÜZELTME LİSTESİ (kararlar kilitli):**

🔴 **P0 (kırık işlev):**
1. `dashboard/team/page.tsx:39-42` sonsuz fetch döngüsü — `usePermission()` her render'da yeni `canManageTeam` closure döndürüyor (hooks/usePermission.ts). Fix: effect dep'ini `user?.id`'ye bağla veya hook'tan memoize boolean döndür.
2. `OnboardingTour` hiç çalışmıyor — `[data-tour="..."]` selector'ları hiçbir bileşende yok. KARAR: data-tour attribute'ları EKLENECEK (Sidebar, dashboard KPI, TopBar bildirim).
3. `messages/tr.json` 10 eksik anahtar: `CRM.quick_actions, CRM.whatsapp_action, CRM.wa_template_{birthday,followup,offer,custom}, CRM.wa_text_{birthday,followup,offer,custom}` (en/de'den çevir).
4. Invoices form: kalemler bölüm başlığı yanlışlıkla `t("new_invoice")` — `line_items` anahtarı ekle (3 dilde) ve kullan.

🟠 **P1 (güven/marka):**
5. CRM sayfası 20+ hardcoded ALMANCA string ("Geburtstagsmail generieren", "EIGENES INVENTAR", "Kunden pitchen"...) → `useTranslations('CRM')`'e taşı (3 dil).
6. KARAR: tek tip `ConfirmModal` bileşeni YAPILACAK — `window.confirm` kullanan yerler (WatchTable, team/page, crm, invoices) değiştirilecek; onaysız yıkıcı işlemlere (CRM not silme, PendingInvitations davet iptali) onay eklenecek.
7. CRM anti-pattern'ler: `getAvatarGradient` renk döngüsü + stats kartlarındaki hover alt-kenar gradient şeridi (`h-1 bg-gradient-to-r`) → sistem paletine çek. `CustomerAiInsights.tsx:42` indigo gradient, `crm/page.tsx:230` purple gradient.
8. Ölü kod sil: `components/inventory/WatchFormModal.tsx` (842 satır, import edilmiyor), `components/auth/Can.tsx`, `teamApi.getPermissions/updateMemberRole/updateDefaults` (team-api.ts).
9. `AuthGuard.tsx` locale bug: `router.replace('/login')` next/navigation'dan — locale düşüyor; `@/i18n/routing` router'ı kullan. Ayrıca `api.ts:39` 401 interceptor'da `window.location.href` locale'i düşürüyor; regex'i `routing.locales`'ten türet.

🟡 **P2 (kalite):**
10. `lib/invoice-api.ts:92` — `URL.revokeObjectURL` ekle. `BulkActions.tsx:41` — selectedIds boşalınca polling'i durdur + setTimeout cleanup. `ActivityFeed.tsx:99` setTimeout cleanup.
11. Zustand selector'ları: `TopBar.tsx:18-19`, `WatchTable.tsx:59-60`, `inventory/page.tsx:17-19` — store'un tamamı yerine alan seç. Çift `fetchPlatforms` (inventory/page + WatchTable) tekile indir.
12. Mobil: BottomNav'a CRM+Invoices erişimi (öğe değişimi veya "Daha Fazla"); TopBar ikon butonları 36px→44px; WatchTable mobil kartta label-değer gap.
13. Görsel: landing `page.tsx:141` + auth `layout.tsx:36` gradient-text kaldır; `globals.css:104` + `EmptyState.tsx:18` bounce easing → ease-out; Settings şifre butonu `amber-600` → token; Sidebar aktif öğe `border-l-2` sol şerit → farklı aktif gösterim; landing "Fiyatlandırma" → gerçek hedef.
14. Market Scanner bilgi mimarisi: 6 eşit bölüme hiyerarşi (başlık ölçeği/divider), iki trend grafiğini toggle'a indir (opsiyonel, büyük iş — gerekirse ayrı oturum).
15. `invite/[token]/page.tsx:61-70` Zod şemasını useMemo'la, MobileLogo'yu modül seviyesine.
16. i18n kalanlar: `AuthGuard` "Yükleniyor...", layout "İçeriğe geç", aria-label'lar, "Şifreyi göster/gizle", CRM `favorite_color` placeholder. (Admin bölümü ayrı sistem — bilinçli TR, dokunma.)

**Backend opsiyonel (sonraki):** TeamTest.php (manager-subset 403 + expired token + yeni owner-guard'lar için Feature testleri); AuthController.me → dealer alan kısıtlaması; health rotalarına throttle.

**Bitiş kriteri:** düzeltmeler → `tsc --noEmit` + vitest + `e2e/team.spec.ts` (5/5) + backend Feature suite (4 bilinen hata dışında yeşil) → activecontext/progress güncelle → `feature/team-management` → develop PR.

---

## 📌 Son Oturum (2026-07-04 — Frontend P0 + P1 tamam + Playwright doğrulama)

**Yapılanlar (dal `feature/team-management`):**
- **P0 (4/4):**
  1. `hooks/usePermission.ts` — dönüş `useMemo([user])` ile sabitlendi; team page (ve Sidebar) sonsuz fetch döngüsü kırıldı.
  2. OnboardingTour — 4 `data-tour` hedefi eklendi: `sidebar` (Sidebar aside), `inventory` (envanter nav linki), `sync-status` (dashboard KPI grid), `notifications` (TopBar zil).
  3. `messages/tr.json` — 10 eksik CRM anahtarı (quick_actions, whatsapp_action, wa_template_*, wa_text_*).
  4. Invoices kalem başlığı `t("new_invoice")` → yeni `line_items` anahtarı (3 dil).
- **P1 (5/5):**
  5. **CRM i18n:** crm/page.tsx'teki ~30 hardcoded Almanca + alt bileşenler (CustomerPortfolio, CustomerAiInsights, CustomerTimeline, KanbanBoard) `useTranslations('CRM')`'e taşındı; 3 dile ~70 yeni anahtar. KanbanBoard STAGES `title`→`titleKey`.
  6. **ConfirmModal:** yeni `stores/confirmStore.ts` (promise tabanlı `confirmDialog()`) + `components/ui/ConfirmDialog.tsx` (layout'a mount). `window.confirm` yerleri dönüştürüldü: WatchTable, team, crm (müşteri), invoices, CustomerPortfolio, PlatformCard. Onaysız yıkıcılara onay eklendi: CRM not silme, davet iptali (`revoke_confirm`). Common'a `confirm` anahtarı. Admin sayfaları (ayrı sistem) dokunulmadı.
  7. **Anti-pattern renkler:** `getAvatarGradient` gökkuşağı döngüsü silindi (avatarlar `bg-accent-blue/15 text-accent-blue`); stats hover gradient şeritleri + CustomerAiInsights indigo/fuchsia gradient'i accent-blue'ya çekildi.
  8. **Ölü kod:** `WatchFormModal.tsx` (842 satır) + `components/auth/Can.tsx` silindi; `teamApi.getPermissions/updateMemberRole/updateDefaults` + gereksiz `PermissionCatalog` importu kaldırıldı.
  9. **Locale bug:** AuthGuard → `@/i18n/routing` router (locale-aware); testi de güncellendi. api.ts 401 interceptor regex'i `routing.locales`'ten türetiliyor + yönlendirmede mevcut locale korunuyor.

**Mevcut durum (doğrulama):**
- `tsc --noEmit` temiz (kalan 2 hata test dosyalarında — baseline, dokunulmadı).
- `vitest`: AuthGuard testi (güncellendi) geçiyor. 3 test dosyası (EmptyState/StatusBadge/WatchFilters) **baseline** olarak kırık — bunlar NextIntlClientProvider ile sarılmadan render ediyor (setup.tsx next-intl mock'lamıyor); dokunmadığım bileşenler, benim değişikliğimle ilgisiz.
- **Playwright:** `e2e/team.spec.ts` **5/5** (ilk çalıştırmadaki login timeout dev soğuk-derleme yarışıydı; tanı script'i login'in çalıştığını gösterdi — csrf 204, login 200). Ek geçici smoke/visual spec'lerle görsel doğrulandı (sonra silindi): ConfirmDialog aç/iptal, CRM Türkçe (Almanca sızıntı yok), OnboardingTour 4 hedefe konumlanıyor, P1.9 locale-korumalı redirect (/tr/dashboard→/tr/login, /de→/de), avatar+AiInsights accent-blue (ekran görüntüleriyle teyit).

**Sonraki adımlar (P2 — kalite, sıralı):**
10. Memory leak cleanup: `lib/invoice-api.ts:92` `URL.revokeObjectURL`; `BulkActions.tsx:41` selectedIds boşalınca polling durdur + setTimeout cleanup; `ActivityFeed.tsx:99` setTimeout cleanup.
11. Zustand selector'ları: `TopBar.tsx:18-19`, `WatchTable.tsx:59-60`, `inventory/page.tsx:17-19` — tüm store yerine alan seç. Çift `fetchPlatforms` (inventory/page + WatchTable) tekile indir.
12. Mobil: BottomNav'a CRM+Invoices; TopBar ikon butonları 36px→44px; WatchTable mobil kart label-değer gap.
13. Görsel: landing `page.tsx:141` + auth `layout.tsx:36` gradient-text kaldır; `globals.css:104` + `EmptyState.tsx:18` bounce → ease-out; Settings şifre butonu `amber-600` → token; Sidebar aktif öğe `border-l-2` şeridi → farklı gösterim; landing "Fiyatlandırma" → gerçek hedef.
14. Market Scanner bilgi mimarisi (opsiyonel, büyük — gerekirse ayrı oturum).
15. `invite/[token]/page.tsx:61-70` Zod şemasını useMemo; MobileLogo modül seviyesine.
16. i18n kalanları: `AuthGuard` "Yükleniyor...", layout "İçeriğe geç", aria-label'lar, "Şifreyi göster/gizle", CRM `favorite_color` placeholder. (Admin bölümü bilinçli TR — dokunma.)

**Not (P1 sırasında bulunan, kapsam dışı):** CRM AiInsights içeriğindeki "No notes available yet." backend `/customers/{id}/sentiment` yanıtından geliyor (frontend i18n değil) — backend tarafında lokalize edilmeli.

**Bitiş kriteri (P2 sonrası):** `tsc` + vitest + `e2e/team.spec.ts` (5/5) → activecontext/progress güncelle → `feature/team-management` → develop PR.

---

## 📌 Son Oturum (2026-07-04 · devam 2 — Frontend P2 kalite tamamlandı + PR)

**Yapılanlar (dal `feature/team-management`, 6/6):**
- **P2.10 Memory leak cleanup:** `lib/invoice-api.ts` PDF indirmede `window.URL.revokeObjectURL(url)` eklendi. `BulkActions.tsx`: idle-reset `setTimeout`'ları `resetTimeoutRef`+`scheduleIdleReset` ile tek referansa alındı ve unmount'ta temizleniyor; ayrıca `selectedIds.size===0` olunca polling durduran effect eklendi. `ActivityFeed.tsx`: "new flag" `setTimeout`'u `newFlagTimeoutRef` ile takip edilip unmount'ta clear ediliyor.
- **P2.11 Zustand selector'ları:** `TopBar`, `WatchTable`, `inventory/page` artık tüm store yerine alan-bazlı selector (`useStore((s)=>s.x)`) kullanıyor. Çift `fetchPlatforms` tekile indirildi: WatchTable'daki `useEffect`+`fetchPlatforms` kaldırıldı (platformları sadece store'dan okuyor; sayfa zaten fetch ediyor).
- **P2.12 Mobil erişilebilirlik:** `BottomNav`'a CRM (Users) + Invoices (FileText) eklendi (7 sekme; 3 dile `crm`/`invoices` anahtarı). `TopBar` ikon butonları (menu/bell/logout) `w-9 h-9`→`w-11 h-11` (44px dokunma hedefi). `WatchTable` mobil kart fiyat satırındaki label-değer çiftlerine `flex items-baseline gap-1.5`.
- **P2.13 Görsel token'lar:** landing `page.tsx` + auth `layout.tsx` `bg-clip-text` gradient metin → solid `text-accent-blue`. `EmptyState` `animate-bounce-in`→`animate-scale-in`; `globals.css`'te artık kullanılmayan `--animate-bounce-in` + `bounceIn` keyframe silindi. Settings şifre butonu `bg-amber-600`→`bg-accent-blue`/`accent-blue-hover`. Sidebar aktif öğe `border-l-2` (layout-shift yapıyordu) → absolute konumlu, kaydırmayan sol pill göstergesi. Landing yanıltıcı "Fiyatlandırma" linki (`/register`'a gidiyordu, gerçek fiyatlandırma bölümü yok) kaldırıldı.
- **P2.15:** `invite/[token]/page.tsx` Zod şeması `useMemo([t])`'ye alındı; `MobileLogo` component'i her render'da yeniden yaratılmasın diye modül seviyesine (fonksiyon bildirimi) taşındı.
- **P2.16 i18n kalanları:** 3 dile 10 yeni anahtar. `Common`: `loading`, `skip_to_content`, `show_password`, `hide_password`. `TopBar`: `top_bar`. `Sidebar`: `nav_main`, `nav_pages`, `expand`, `collapse`. `CRM`: `favorite_color_placeholder`. Bağlanan yerler: AuthGuard "Yükleniyor..." → `t("loading")`; root `layout.tsx` skip-link (server component, `getTranslations`) → `skip_to_content`; TopBar/Sidebar aria-label'ları; login/register/invite şifre göster-gizle aria'ları (`useTranslations("Common")` ikinci hook ile); CRM favorite_color placeholder. Admin bölümü bilinçli TR — dokunulmadı.

**Regresyon & düzeltme:** P2.16'da AuthGuard'a `useTranslations` eklenince `AuthGuard.test.tsx` "context bulunamadı" ile kırıldı → test `NextIntlClientProvider` (`messages/tr.json`, locale `tr`) ile saran `renderWithIntl` helper'ına geçirildi → 4/4 geçiyor.

**Doğrulama:** `tsc --noEmit` temiz (kalan 2 hata test dosyalarında — bilinen baseline). `vitest`: baseline'a döndü — 3 kırık dosya (EmptyState/StatusBadge/WatchFilters, NextIntlClientProvider ile sarılmıyor; benim değişikliğimle ilgisiz, dokunulmadı). `e2e/team.spec.ts` **5/5**. i18n parite: en/de/tr = **857/857/857**.

**Sonraki adım:** PR `feature/team-management` → develop açıldı; merge/inceleme bekleniyor. Merge sonrası Aşama 7 kapanır → Aşama 8. P2.14 (Market Scanner IA) opsiyonel/büyük, ertelendi.

---

## 📌 Son Oturum (2026-07-04 · devam 3 — eBay webhook güvenlik sertleştirmesi + CSP)

> Bu iş bir önceki oturumda **başlanmış ama commit edilmeden** kalmıştı (terminal beklenmedik kapandı). Bu oturumda tamamlanıp doğrulanıp commit edildi. Bir önceki `8cb76da backend güvenlik blokerleri` işinin devamı.

**Yapılanlar (dal `feature/team-management`):**
- **eBay webhook imza doğrulama (fail-closed):** yeni `backend/app/Services/EbayNotificationVerifier.php`. `X-EBAY-SIGNATURE` header'ı (base64 JSON: `kid/signature/digest`) eBay'in public key'i ile `openssl_verify` üzerinden kriptografik doğrulanır. Public key Notification API'den `kid` ile çekilir (client_credentials app token), 6 saat cache'lenir. Header/anahtar/imza çözülemezse `false` — sahte/şüpheli webhook reddedilir.
- **`WebhookController.php`:** eski "imza sadece var mı" kontrolü gerçek kripto doğrulamayla değiştirildi (`verifyEbaySignature` → `EbayNotificationVerifier` DI). eBay endpoint verification challenge handler'ı eklendi (`handleEbayChallenge`): `challenge_code` gelirse `SHA256(challengeCode+verificationToken+endpoint)` hex döner.
- **`routes/api.php`:** challenge için `GET /webhooks/ebay` route'u eklendi (POST'un yanına).
- **`config/services.php`:** `ebay.webhook_endpoint` config (`EBAY_WEBHOOK_ENDPOINT`) eklendi.
- **`backend/.env.example`:** `EBAY_WEBHOOK_VERIFICATION_TOKEN` + `EBAY_WEBHOOK_ENDPOINT` anahtarları eklendi (boşsa dev/test'te bypass).
- **CSP sertleştirme (`frontend/next.config.ts`):** `unsafe-eval` artık **yalnız dev'de** (Turbopack/HMR); production'da kaldırıldı. CSP'ye `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-src 'none'` eklendi.
- **Testler:** yeni `backend/tests/Unit/EbayNotificationVerifierTest.php` (5 test: geçerli imza, SHA256, kurcalanmış gövde, bozuk imza, bozuk header — gömülü prime256v1 EC anahtar çiftiyle, ağa ihtiyaç yok). `WebhookTest.php`'ye 2 test: sahte imza reddi (403), challenge yanıtı (200 + doğru hash).

**Mevcut durum (doğrulama):**
- Backend: webhook testleri **6/6** + verifier **5/5** geçiyor. Tam suite: **132 passed**, 4 fail + 1 skip — 4 fail memory'de yazılı **bilinen baseline** (AuthTest×2, InvoiceTest×2), bizim işimizle ilgisiz.
- Frontend: tek değişiklik `next.config.ts` (config, TS kaynak değil). `.next` çökme artefaktı silinip tsc tekrar koşuldu — kaynak temiz; kalan 2 tsc hatası dokunulmayan test dosyalarında (`__tests__/setup.tsx`, `stores/inventoryStore.test.ts`) — bilinen baseline.
- ⚠️ CSP prod sertleştirmesi dev'de anlamlı doğrulanamaz (dev `unsafe-eval`'ı korur); prod build ile ileride teyit edilmeli.

**Sonraki adımlar (bir sonraki chat, sıralı):**
1. PR `feature/team-management` → develop merge/inceleme (güvenlik commit'i dahil).
2. Merge sonrası Aşama 7 kapanır → Aşama 8'e geç.
3. (Opsiyonel) prod build alıp yeni CSP ile konsol/CSP ihlali kontrolü.
4. eBay Developer hesabı açılınca gerçek `EBAY_WEBHOOK_VERIFICATION_TOKEN`/`EBAY_WEBHOOK_ENDPOINT` ile canlı challenge + imza doğrulama testi.

---

## 📌 Son Oturum (2026-07-04 · devam 4 — Aşama 7 kapanışı + güvenlik turu + UI/UX pro max turu)

**1) Aşama 7 kapanışı:**
- eBay güvenlik commit'i (`29ec43a`) için PR #2 açıldı → **merge edildi** (develop merge commit `ea1cd2b`). Aşama 7 tümüyle develop'ta.
- Prod build alınıp **CSP doğrulandı**: `unsafe-eval` prod'da yok (dev'de var), `object-src/base-uri/form-action/frame-src` sertleştirmesi header+manifest'te doğru; public+dashboard sayfalarında CSP/eval ihlali yok. (Not: port 3000'i eski dev sunucusu tuttuğu için prod 3100'de test edildi.)

**2) Güvenlik/kod turu (security-audit skill) — yeni dal `feature/security-ui-polish`, commit `d724d38`:**
- **F1** WebhookController eBay/Shopify **fail-closed** (production'da token boşsa reddet + kritik log; dev/test bypass korunur). Sahte order → cross-tenant stok kilidi açığını kapatır (`processEbayOrder` dealer-scope'suz `Watch::find`).
- **F2** `InvitationController::accept` transaction'ında `lockForUpdate` + accepted/revoked yeniden kontrol (çift kabul 500→404).
- **F3** Şifre politikası: Register+AcceptInvitation+SettingsController changePassword → `min 8 + büyük/küçük + rakam` (regex, TR mesaj). Settings/AuthTest fixture'ları uyumlandı. Frontend Zod (register+invite) + i18n `password_requirements` (3 dil).
- Backend suite: **132 passed** (4 bilinen baseline: AuthTest register/login 500 ortamsal + InvoiceTest×2).

**3) UI/UX pro max turu (design-review ajanı 7-aşama + impeccable statik) — commit `4b497b8`:**
- Ortam: frontend **3001** (SANCTUM_STATEFUL_DOMAINS'te var), backend 8001; login teyit (csrf 204/login 200).
- **P0:** (a) 3 **TANIMSIZ TOKEN** bug'ı — `accent-primary`(9)→accent-blue, `surface-base`(5)→surface, `hover:border-default`(13)→border-strong (globals.css'te yok → kırık renk render'ı, CRM AI-pitch+inputlar). (b) **Mobil sidebar blocker** — tek `collapsed` state hem masaüstü hem mobili sürüyordu; ayrı `mobileOpen` (default kapalı) + nav-tıkla-kapat + mobilde collapse gizli. (c) CRM 6 tab focus baskılaması (`!outline-none`) kaldırıldı (WCAG).
- **P1:** alert()→toast (crm×2, invoices×1); auth İngilizce hero → `getTranslations("Landing")` + privacy/terms; CRM neon-glow/purple kümesi → sessiz lüks (CustomerTimeline, follow-up neon pulse, VIP tier metal metaforu, favorite-color, team ham palet→semantic+aria-label); market-scanner ilk-paint kırmızı alarm→nötr; dashboard KPI skeleton + glow token + group-hover no-op.
- Doğrulama: tsc **0 kaynak hatası**, i18n **861/861/861**, **e2e/team 5/5**, Playwright görsel (mobil sidebar off-screen x=-256 + drawer x=0, auth TR hero, CRM 0 console hatası).

**Commit & PR:** `feature/security-ui-polish` (develop'tan) → 2 commit (`d724d38` güvenlik + `4b497b8` UI) → **PR #3 açıldı**. Design-review ajanının review spec/report/config artefaktları silindi (commit'e girmedi).

**MEVCUT DURUM:** PR #3 merge/inceleme bekliyor. Backend 8001 ayakta, frontend dev kapalı. Demo DB'ye e2e'den "E2E Staff" pasif üyeler eklendi (kozmetik).

**SONRAKİ ADIMLAR (bir sonraki chat — ertelenen UI bulguları):**
1. **Medium:** Settings mobil tab etiket kırpılması (responsive tab); izin matrisi grup "tümünü seç" + preset-farkı göstergesi; invoice vade tarihi `type="date"`.
2. **Nit:** ConfirmDialog focus geri-verme; invite modal native `<select>`; CRM tab flex-1 layout-shift; Settings `role=tablist`; landing "Demo İzle" anchor; inventory satır aria-label + 44px.
3. **Ayrı sistem:** admin sidebar side-stripe. **Veri:** demo DB E2E Staff temizliği.
4. **Backlog:** F4 CSP nonce-tabanlı (script-src unsafe-inline düşür).
5. PR #3 merge sonrası bu iş kapanır.
