# WatchSync AI — Active Context

> **Son Güncelleme:** 2026-04-09  
> **Mevcut Faz:** FAZ 2 devam ediyor — Hafta 6 tamamlandı (iyileştirmeler dahil), Hafta 7'ye hazır  
> **Sıradaki:** Hafta 7 — AI Görsel İşleme Mikroservisi  
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

## Bilinen Kısıtlar / Notlar
- Broadcasting (Pusher/Reverb) henüz kurulmadı, ActivityFeed polling ile çalışıyor
- Docker Desktop Windows: `vendor/` klasörü named volume (`sail-vendor`) olarak ayrıldı — bind mount I/O yavaşlığını önlemek için
- `composer install --no-dev` sonrası `php artisan optimize` çalıştırılmalı
- `statefulApi()` kaldırıldı (bootstrap/app.php) — sadece token-based auth kullanılıyor
- `.env` ayarları: `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `BCRYPT_ROUNDS=10` (dev)
- Auth token `localStorage`'da — production'da httpOnly cookie'ye geçilecek

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
