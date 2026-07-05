# WatchSync AI — İlerleme Takip Belgesi (Progress Tracker)

> **Versiyon:** 2.1  
> **Tarih:** 2026-04-10  
> **Güncelleme Sıklığı:** Her sprint sonunda (haftalık)  
> **Görev Dağılımı:**  
> - Hafta 1-6: Mehmet (backend + frontend tamamı)  
> - Hafta 7+: Berat (backend + frontend tamamı, AI ile çalışarak)

---

## FAZ 1 — TEMELLERİN ATILMASI (Hafta 1-4)

### 🏗 Hafta 1: Proje Altyapısı & Geliştirme Ortamı

#### Backend Altyapısı
- [x] Laravel 11 projesi oluşturuldu
- [x] `.env` yapılandırması tamamlandı
- [x] Sanctum kurulumu yapıldı
- [x] MySQL/PostgreSQL bağlantısı kuruldu
- [x] Veritabanı Migration'ları yazıldı
  - [x] `users` tablosu
  - [x] `dealers` tablosu (çok kiracılı yapı)
  - [x] `watches` tablosu (JSONB sütunlar dahil)
  - [x] `watch_images` tablosu
  - [x] `platforms` tablosu
  - [x] `platform_connections` tablosu
  - [x] `sync_logs` tablosu
  - [x] `inventory_status_history` tablosu
- [x] Redis Docker container çalışıyor
- [x] RabbitMQ Docker container çalışıyor (iptal/redis alternatifi)
- [x] Laravel Queue → Redis bağlantısı test edildi

#### Frontend Altyapısı
- [x] Next.js 16 (App Router) projesi oluşturuldu
- [x] Tailwind CSS v4 yapılandırması (globals.css @theme inline)
- [x] Inter + JetBrains Mono fontları eklendi
- [x] Dark Mode tema değişkenleri tanımlandı
- [x] Sidebar bileşeni oluşturuldu
- [x] TopBar bileşeni oluşturuldu
- [x] Dashboard Layout bileşeni oluşturuldu
- [x] Landing Page üretildi ve entegre edildi

---

### 📊 Hafta 2: Veri Modelleri & Dashboard UI

#### API & Auth
- [x] Eloquent Modelleri oluşturuldu
  - [x] `Watch` model + JSONB cast
  - [x] `Platform` model
  - [x] `SyncLog` model
  - [x] `Dealer` model
  - [x] Model ilişkileri (relationships) tanımlandı
- [x] Auth API endpoint'leri
  - [x] `POST /api/auth/register`
  - [x] `POST /api/auth/login`
  - [x] `POST /api/auth/logout`
  - [x] `GET /api/auth/me`
  - [x] Auth Middleware yapılandırması
- [x] Seeder'lar
  - [x] Marka referans verileri (brands.json)
  - [x] Model referans verileri (models.json)
  - [x] Durum (condition) referans verileri
  - [x] Demo kullanıcı ve demo saatler

#### Dashboard UI
- [x] KPI Kartları bileşeni
  - [x] Total Inventory Value kartı
  - [x] Sold This Month kartı
  - [x] Pending Syncs kartı
  - [x] Sync Success Rate kartı
- [x] Login sayfası
  - [x] Form yapısı (React Hook Form + Zod)
  - [x] API bağlantısı
  - [x] Hata gösterimi
- [x] Register sayfası
- [x] Dashboard → API bağlantısı (`GET /api/dashboard/stats`)
- [x] Auth store (Zustand) kurulumu

---

### 📦 Hafta 3: Envanter CRUD & Tablo UI

#### Watch CRUD API
- [x] `GET /api/watches` — sayfalama + filtreleme + sıralama
- [x] `POST /api/watches` — yeni saat ekleme
- [x] `GET /api/watches/{id}` — saat detayı
- [x] `PUT /api/watches/{id}` — saat güncelleme
- [x] `DELETE /api/watches/{id}` — saat silme
- [x] `POST /api/watches/{id}/images` — görsel yükleme
- [x] `DELETE /api/watches/{id}/images/{imageId}` — görsel silme
- [x] S3/MinIO entegrasyonu — görsel depolama (local disk + S3 hazır)
- [x] Thumbnail oluşturma (GD ile 300x300)
- [x] Envanter durum makinesi (State Machine)
  - [x] `draft → active → reserved → sold` geçişleri
  - [x] `active → maintenance` geçişi
  - [x] Durum geçiş kuralları ve validasyonu

#### Envanter UI
- [x] Envanter Tablosu bileşeni
  - [x] Sütunlar: Thumbnail, Marka/Model, Ref No, Durum, Maliyet, Pazar Fiyatı
  - [x] Platform toggle switch'leri (eBay, Chrono24, Shopify) — Hafta 5'te eklendi
  - [x] Satır seçimi (checkbox)
  - [x] Sıralama (sort) fonksiyonu
  - [x] Sayfalama bileşeni
- [x] Saat Ekleme/Düzenleme Formu
  - [x] Adım 1: Marka & Model seçimi
  - [x] Adım 2: Detaylar (referans no, yıl, durum, kasa malzemesi vs.)
  - [x] Adım 3: Fiyatlandırma (maliyet, satış fiyatı)
  - [x] Adım 4: Görseller (sürükle-bırak yükleme)
  - [x] Zod validasyon şeması
- [x] Optimistic update mekanizması
- [x] Boş durum (empty state) bileşeni
- [x] Loading skeleton'lar

---

### 🔒 Hafta 4: Redis Lock & Kuyruk Mimarisi

#### Kilit & Kuyruk (Backend)
- [x] Redis Mutex implementasyonu
  - [x] `Redis::lock('inventory_update_'.$sku, 10)->block(5)`
  - [x] Kilit edinme başarısız → LockTimeoutException handling (409 Conflict response)
  - [x] `InventoryLockService` — `executeWithLock()` ve `safeStatusTransition()` metodları
- [x] Redis Job yapısı
  - [x] `SyncInventoryJob` — platform stoku güncelleme (WithoutOverlapping middleware)
  - [x] `UpdatePlatformStockJob` — belirli platform stok 0'lama
  - [x] `ProcessWebhookJob` — gelen webhook işleme (order.created, order.cancelled, stock.updated)
  - [x] Retry mekanizması (max 3 deneme, exponential backoff: 5s, 30s, 120s)
  - [x] Dead-letter queue — `failed()` metodu ile kalıcı hata loglaması
- [x] `SyncStatusUpdated` event — broadcasting desteği hazır
- [x] `GET /api/dashboard/activities` — polling destekli aktivite feed endpoint'i
- [x] Entegrasyon testi: eşzamanlı sipariş simülasyonu
  - [x] 10 eşzamanlı istek → yalnızca 1 başarılı
  - [x] Diğer 9'un doğru hata kodu alması (ValidationException)
  - [x] API 409 Conflict testi (kilit varken)
  - [x] Durum geçiş geçmişi kaydı testi

#### Gerçek Zamanlı UI (Frontend)
- [x] Aktivite Feed tablosu (Dashboard)
  - [x] Polling tabanlı gerçek zamanlı güncelleme (10s interval)
  - [x] `ActivityFeed` bileşeni — `since` parametreli differential fetch
  - [x] Gerçek zamanlı satır ekleme animasyonu (slide-up + highlight)
  - [x] Live indicator (yeşil ping dot)
- [x] Market Scanner sayfa iskeleti
  - [x] Fiyat trendi grafik alanı (SVG placeholder + period selector)
  - [x] Rakip fiyat tablosu (5 satır örnek veri)
  - [x] Arama ve filtre UI (disabled, Hafta 8'de aktif)
- [x] UI Polish
  - [x] Error boundary bileşeni (retry desteği, dev-mode hata detayı)
  - [x] Toast notification sistemi (Zustand store + ToastContainer)
  - [x] 4 toast tipi: success, error, warning, info

---

## 🔍 Ara Audit — Güvenlik, Performans, SEO (2026-04-07)

- [x] Registration bug fix (password_confirmation gönderilmiyordu)
- [x] CORS kısıtlaması (`*` → `env('FRONTEND_URL')`)
- [x] Auth rate limiting (login: 10/dk, register: 5/dk)
- [x] Sanctum token 24 saat expiration
- [x] Debug error leak kaldırıldı
- [x] LIKE wildcard injection escape
- [x] Dashboard query parameters validasyonu
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, vb.)
- [x] Dashboard stats: 6 sorgu → 1 aggregate query
- [x] DB performans indexleri eklendi (5 index)
- [x] Image upload N+1 düzeltildi
- [x] ActivityFeed: tab visibility polling
- [x] WatchFormModal: memory leak fix
- [x] `robots.txt`, `sitemap.ts`, OG/Twitter meta tags
- [x] `lang="tr"`, title template, auth sayfaları noindex
- [x] `$failOnTimeout` type fix, unused code cleanup, type-safe error handling

### Bekleyen Güvenlik / Production Hazırlık Görevleri
- [ ] Auth token: `localStorage` → `httpOnly cookie` geçişi (production güvenliği)
- [x] `Content-Security-Policy` header — sertleştirildi (2026-07-04): `unsafe-eval` yalnız dev; prod'da `object-src/base-uri/form-action/frame-src` kısıtları eklendi (`frontend/next.config.ts`)
- [x] `favicon.ico` ve `apple-touch-icon` tasarımı ve eklenmesi
- [ ] FormRequest `authorize()` → role-based yetkilendirme (owner/manager/staff)
- [x] ProcessWebhookJob: platform/dealer ownership doğrulaması

---

## ⚠️ AÇILMASI GEREKEN HESAPLAR & API ANAHTARLARI

> **Her haftanın başında bu listeyi kontrol et. İlgili haftanın hesapları önceden hazır olmalı!**

### 🔓 Hafta 5-6 — Platform Entegrasyonları (ŞİMDİ GEREKLİ)
| Hesap/Servis | Durum | Açıklama | Link |
|---|---|---|---|
| eBay Developer Account | ⬜ Açılmalı | API key + secret gerekli | https://developer.ebay.com |
| eBay Sandbox Test Account | ⬜ Açılmalı | Test kullanıcısı oluştur | eBay Developer Portal → Sandbox |
| Shopify Partner Account | ⬜ Açılmalı | Custom App oluştur, Admin API erişimi | https://partners.shopify.com |
| Shopify Development Store | ⬜ Açılmalı | Test mağazası (Partner hesabından ücretsiz) | Partner Dashboard → Stores |
| Chrono24 Dealer Account | ⬜ Başvur | XML Feed erişimi için dealer başvurusu | https://www.chrono24.com/dealer |

### 🤖 Hafta 7 — AI Görsel İşleme
| Hesap/Servis | Durum | Açıklama | Link |
|---|---|---|---|
| SAM 2 Model | ✅ Ücretsiz | Meta'nın açık kaynak modeli, lokal çalışır | https://github.com/facebookresearch/sam2 |
| Python 3.10+ | ⬜ Kontrol et | FastAPI servisi için gerekli | https://python.org |
| CUDA / GPU (opsiyonel) | ⬜ Kontrol et | SAM 2 CPU'da da çalışır ama yavaş. GPU varsa CUDA kur | https://developer.nvidia.com/cuda |

### 📝 Hafta 8 — AI Metin & Pazar Tarayıcı
| Hesap/Servis | Durum | Açıklama | Link |
|---|---|---|---|
| Gemini API Key | ✅ Ücretsiz | Google AI Studio üzerinden Gemini 2.0 Flash (ücretsiz tier yeterli) | https://aistudio.google.com |
| VEYA Groq API Key | ⬜ Alternatif | Llama-3 çalıştırmak için (ücretsiz tier mevcut) | https://console.groq.com |
| ~~Playwright~~ | ❌ Kaldırıldı | IP ban riski nedeniyle kaldırıldı | — |
| WatchCharts API | ⬜ Opsiyonel | Tarihsel trend verisi gerekirse. Ücretli — ~$50-200/ay | https://watchcharts.com/api |
| eBay Browse API | ✅ Ücretsiz | eBay Developer hesabıyla birlikte geliyor (birincil Market Scanner kaynağı) | eBay Developer Account ile aynı |

### 💰 Hafta 9 — CRM & Fatura
| Hesap/Servis | Durum | Açıklama | Link |
|---|---|---|---|
| SMTP Servisi | ⬜ Açılmalı | E-posta göndermek için (Mailtrap test, production'da Mailgun/SES) | https://mailtrap.io |

### 🔐 Hafta 10 — Monitoring
| Hesap/Servis | Durum | Açıklama | Link |
|---|---|---|---|
| Sentry Account | ⬜ Açılmalı | Hata takibi (Laravel + Next.js). Developer tier ücretsiz | https://sentry.io |

### 🚀 Hafta 12 — Production
| Hesap/Servis | Durum | Açıklama | Link |
|---|---|---|---|
| Domain Name | ⬜ Satın al | watchsync.ai veya alternatif | Namecheap / Cloudflare |
| SSL Sertifika | ✅ Ücretsiz | Let's Encrypt ile otomatik | Cloudflare veya Certbot |
| VPS / Cloud | ⬜ Seç | DigitalOcean, Hetzner, AWS EC2 | - |
| Google Analytics / Plausible | ⬜ Aç | Kullanıcı analitiği | https://plausible.io |

---

## FAZ 2 — ENTEGRASYONLAR & YAPAY ZEKA (Hafta 5-8)

### 🔗 Hafta 5: Chrono24 & eBay Bağlantıları

#### API Entegrasyonları
- [x] Chrono24 XML Feed
  - [x] `GET /api/feeds/chrono24.xml` endpoint'i
  - [x] Zorunlu XML düğümleri: `<article_id>`, `<price>`, `<Manufacturer>`, `<Model name>`, `<Production year>`, `<Condition>`, `<Scope of delivery>`, `<Case material>`, `<Bracelet/strap material>`, `<Dial color>`, `<Winding mechanism>`, `<Description>`, `<Photos>`
  - [x] IP Whitelist middleware
  - [x] XML şema validasyonu
- [x] eBay OAuth 2.0
  - [x] Authorization Code Grant akışı
  - [x] Callback handler (`/api/ebay/callback`)
  - [x] Access Token & Refresh Token depolama
  - [x] Token yenileme cron job'u
  - [x] eBay Sandbox test ortamı yapılandırması
- [x] eBay Taxonomy API
  - [x] `getItemAspectsForCategory(281)` entegrasyonu
  - [x] Zorunlu alan eşleştirme motoru
  - [x] Authenticity Guarantee uyumluluk kontrolleri

#### Platform Ayarları UI
- [x] Platform Ayarları sayfası
  - [x] eBay bağlantı kartı ("Bağlan" butonu + durum göstergesi)
  - [x] Chrono24 bağlantı kartı (durum göstergesi, IP bilgisi)
  - [x] Shopify bağlantı kartı
  - [x] API anahtarı giriş formları
- [x] eBay OAuth UI akışı
  - [x] "eBay'e Bağlan" butonu → OAuth popup
  - [x] Callback başarı/hata geri bildirimi
  - [x] Bağlantı durumu göstergesi (yeşil/kırmızı dot)
- [x] Platform toggle fonksiyonelliği (envanter tablosunda)
  - [x] Toggle → API çağrısı → senkronizasyon tetikleme
  - [x] Toggle durumu güncelleme (optimistic)

---

### 🛒 Hafta 6: eBay Listeleme & Shopify

#### Listeleme Motor'ları (Backend)
- [x] eBay Inventory API entegrasyonu
  - [x] `createOrReplaceInventoryItem` — ürün oluşturma
  - [x] `createOffer` — teklif oluşturma
  - [x] `publishOffer` — yayınlama
  - [x] Authenticity Guarantee zorunlu alan eşleştirmesi
  - [x] Hata yönetimi ve retry mantığı
- [x] Shopify Admin API (GraphQL)
  - [x] `productCreate` mutation
  - [x] `productUpdate` mutation
  - [x] `inventoryAdjustQuantities` mutation
  - [x] Webhook abonelikleri (sipariş, stok)
- [x] Webhook dinleyicileri
  - [x] eBay sipariş bildirimi → stok kilitleme
  - [x] Shopify sipariş bildirimi → stok kilitleme
  - [x] Webhook imza doğrulaması — eBay için gerçek kripto doğrulama (fail-closed) tamamlandı (2026-07-04): `EbayNotificationVerifier` (`openssl_verify` + Notification API public key) + endpoint challenge yanıtı + Unit/Feature testleri

#### Hafta 6 Tamamlama Görevleri (İyileştirme)
- [x] Platform referans ID'leri migration (`platform_connections.settings` veya `watches` tablosuna `ebay_listing_id`, `ebay_offer_id`, `shopify_product_id`, `shopify_variant_id`)
- [x] eBay listing güncelleme (fiyat/stok değiştiğinde mevcut listing update)
- [x] eBay listing kaldırma (`withdrawOffer`) metodu — toggle off yapıldığında
- [x] Shopify product silme (`productDelete`) metodu — toggle off yapıldığında
- [x] Shopify/eBay rate limiting yönetimi (API throttle handling + retry)
- [x] `toggleSync` endpoint'inde `enabled: false` → platformdan listing kaldırma
- [x] SyncStatusBadges N+1 sorunu: sync status verisini `GET /api/watches` tablo API'sine dahil et
- [x] BulkActions: gerçek ilerleme yüzdesi (polling ile job durumu takibi)
- [x] BulkActions: publish sonrası envanter tablosu otomatik yenileme
- [x] NotificationDrawer: tek bildirim okundu işaretleme
- [x] NotificationDrawer: bildirime tıklayınca ilgili saate yönlendirme
- [x] Webhook subscription otomasyonu (platform bağlantısı kurulunca otomatik kayıt)
- [x] `favicon.ico` → özel SVG ikon (saat + sync motifi)
- [x] ProcessWebhookJob: platform/dealer ownership doğrulaması

#### Senkronizasyon UI (Frontend)
- [x] Senkronizasyon durum göstergeleri
  - [x] `Synced ✓` (yeşil badge)
  - [x] `Pending ⏳` (turuncu badge)
  - [x] `Error ✗` (kırmızı badge + hata detayı tooltip)
- [x] Toplu İşlem (Bulk Actions) UI
  - [x] Çoklu saat seçimi
  - [x] "Hepsini eBay'e Yayınla" aksiyonu
  - [x] "Hepsini Chrono24'e Yayınla" aksiyonu
  - [x] İlerleme çubuğu (progress bar) gösterimi
- [x] Bildirim sistemi
  - [x] Toast notification bileşeni (başarı, hata, uyarı, bilgi)
  - [x] Bildirim çekmecesi (notification drawer)
  - [x] Okunmamış bildirim sayacı (TopBar badge)
- [x] 3 nokta (İşlem) menüsü — fixed pozisyon düzeltmesi (overflow-hidden sorunu çözüldü)

---

### 🤖 Hafta 7: AI Görsel İşleme Mikroservisi

> **Sorumlu:** Berat (backend + frontend, AI ile çalışarak)

#### Backend — Python/FastAPI AI Servisi
- [x] FastAPI proje yapısı kurulumu
- [x] SAM 2 model entegrasyonu
  - [x] Model indirme scripti (`scripts/download_model.py`)
  - [x] `POST /api/ai/segment` — saat maskeleme endpoint'i
  - [x] Maske kalitesi parametreleri
- [x] Matting pipeline
  - [x] SAM 2 kaba maske → alpha matting iyileştirmesi
  - [x] Color decontamination (renk sızıntısı temizleme)
  - [x] RGBA katman çıktısı
- [x] Arka plan değiştirme servisi
  - [x] `POST /api/ai/replace-background`
  - [x] Önceden tanımlı arka planlar (beyaz stüdyo, siyah kadife, mermer, gri gradyan)
  - [x] Özel arka plan yükleme desteği
  - [x] Gölge sentezi (shadow synthesis)
- [x] Laravel → FastAPI iletişim katmanı
  - [x] HTTP istemci servisi (`AiService.php`)
  - [x] Asenkron job entegrasyonu (`ProcessAiEnhanceJob.php`)
- [x] Docker Compose'a FastAPI servis container eklenmesi
- [x] FastAPI Dockerfile oluşturulması
- [x] SAM 2 model ağırlıkları volume mount'u (fallback mode aktif)
- [x] Laravel proxy endpoint: `POST /api/watches/{id}/ai-enhance` → FastAPI forward

#### Frontend — AI Studio UI
- [x] AI Studio sayfası route'u: `/dashboard/ai-studio`
  - [x] Sol panel: yüksek çözünürlüklü görsel önizleme
  - [x] Sağ panel: AI araçları + arka plan seçici + varyantlar
- [x] "AI ile İşle" butonu
  - [x] Görsel seçimi (drag & drop + file picker) → FastAPI'ye gönderim
  - [x] İşlem süreci göstergesi (spinner + mesaj)
  - [x] Önce/Sonra karşılaştırma (BeforeAfterSlider) bileşeni
- [x] Arka plan seçici (BackgroundSelector)
  - [x] Küçük resim galerisi (preset arka planlar)
  - [x] Seçili arka planla önizleme
- [x] Varyant seçimi ve indirme akışı
- [x] Sidebar'a AI Studio navigasyon linki eklendi

---

### 📝 Hafta 8: AI Metin Motoru & Pazar Tarayıcı

> **Sorumlu:** Berat (backend + frontend, AI ile çalışarak)

#### Backend — NLP & Scraping
- [x] LLM entegrasyonu
  - [x] Gemini API bağlantısı (`LlmService.php` — gemini-2.0-flash)
  - [x] Saat referans numarasından bağlam oluşturma (calibre, bezel tipi vs.)
  - [x] SEO uyumlu ilan açıklaması üretme prompt mühendisliği
  - [x] `POST /api/ai/generate-description` endpoint'i
  - [x] Çok dilli destek (EN, DE, TR) — fallback şablonları dahil
- [x] Web scraping servisi
  - [x] Chrono24 fiyat çekme (httpx async — FastAPI scraping router)
  - [x] Watchfinder fiyat çekme (placeholder entegrasyonu)
  - [x] Veri normalleştirme pipeline (`MarketScrapingService.php`)
  - [x] `GET /api/market/prices/{ref}` endpoint'i
  - [x] Fiyat geçmişi depolama (time-series — `price_histories` tablosu)
- [ ] Fine-tuning hazırlığı
  - [ ] Saat katalog verilerinden eğitim seti oluşturma
  - [ ] Veri temizleme ve formatlandırma scripti
- [x] LLM API anahtarı yapılandırması (`.env` + `config/services.php`)
- [x] Fiyat geçmişi veritabanı tablosu migration'ı (`price_histories`)
- [x] Fiyat uyarı tablosu migration'ı (`price_alerts`)
- [x] Fiyat uyarı CRUD API endpoint'leri (`GET/POST/DELETE /api/price-alerts`)
- [ ] Scraping servisi rate limiting ve proxy yönetimi
- [x] AI metin üretimi prompt template'leri (çok dilli: EN, DE, TR)

#### Frontend — Scanner & Metin UI
- [ ] AI Açıklama Üretimi UI
  - [ ] "Generate" butonu
  - [ ] Streaming metin gösterimi (karakter karakter)
  - [ ] Düzenlenebilir metin alanı
  - [ ] "Yeniden Üret" / "Kopyala" aksiyonları
  - [ ] Dil seçimi dropdown
- [x] Market Scanner veri bağlama
  - [x] Fiyat trendi grafiği — gerçek veri (`market-api.ts` + `PriceStats`)
  - [x] Zaman aralığı seçici (7g, 30g, 90g, 6ay, 1y)
  - [x] Rakip fiyat karşılaştırma tablosu (`CompetitorListing`)
  - [x] Arbitraj fırsatı vurgulama (kârlı fırsatlar yeşil)
- [x] Fiyat uyarı sistemi UI
  - [x] "Bu referans X€'nun altına düştüğünde bildir" form
  - [x] Aktif uyarılar listesi
  - [x] Uyarı düzenleme / silme

---

## FAZ 3 — CİLALAMA, TEST & LANSMAN (Hafta 9-12)

### 👥 Hafta 9: CRM & Finans

> **Sorumlu:** Berat (backend + frontend, AI ile çalışarak)

#### Backend — CRM & Fatura API
- [x] CRM API
  - [x] `customers` + `customer_notes` tablosu migration
  - [x] `GET/POST/PUT/DELETE /api/customers` CRUD
  - [x] Satın alma geçmişi ilişkilendirmesi (invoices relation)
  - [x] Notlar ve etiketleme sistemi (JSON tags, customer_notes)
  - [x] Müşteri arama ve filtreleme (isim, email, şirket, etiket)
- [x] Fatura motoru
  - [x] `invoices` + `invoice_items` tablosu migration
  - [x] PDF fatura oluşturma (DomPDF v3.1, profesyonel A4 şablon)
  - [x] Yasal uyumluluk: KDV hesaplama, fatura numarası sıralaması (INV-YYYY-XXXXX)
  - [x] `GET /api/invoices/{id}/pdf` — PDF indirme (stream)
  - [x] Otomatik fatura e-posta gönderimi (`POST /api/invoices/{id}/send`)
- [x] E-posta bildirimleri
  - [x] Sipariş onayı e-postası (OrderConfirmationNotification, queued)
  - [x] Fatura gönderim e-postası (InvoiceSentNotification, queued)
  - [x] Stok uyarı e-postası (LowStockAlertNotification, queued)
  - [x] Laravel Notification + Mail yapılandırması
  - [x] E-posta template'leri (Blade PDF + Notification Mail)

#### Frontend — CRM & Fatura UI
- [x] CRM sayfası
  - [x] Müşteri listesi tablosu (arama, filtreleme)
  - [x] Müşteri detay sayfası (iletişim bilgileri, notlar, fatura geçmişi)
  - [x] İletişim geçmişi zaman çizelgesi (notlar listesi)
  - [x] Not ekleme formu
  - [x] Etiket yönetimi (tag ekleme/silme)
- [x] Fatura sayfası
  - [x] Fatura listesi tablosu (durum filtreleri)
  - [x] Fatura detay görünümü (kalemler, toplamlar, PDF, e-posta)
  - [x] PDF indirme butonu
  - [x] "Yeni Fatura Oluştur" formu (müşteri seçici, kalem satırları, KDV hesaplama)
- [x] Ayarlar sayfası (4 sekmeli: Profil, Şirket, Bildirimler, Platformlar)
  - [x] Profil düzenleme formu (isim, email, şifre değiştirme)
  - [x] Bildirim tercihleri toggle'ları (fatura, senkronizasyon, stok, haftalık rapor)
  - [x] API anahtarları yönetimi sayfası (Platformlar sekmesi)
  - [x] Şirket bilgileri (fatura için — adres, vergi no, website)
- [x] **Platform "Nasıl Bağlanılır" Yardım Modal'ları**
  - [x] Her PlatformCard'a `?` yardım ikonu butonu (HelpCircle icon)
  - [x] eBay: Developer hesap → App oluşturma → OAuth URI → Sandbox test adımları
  - [x] Chrono24: Dealer başvurusu → IP Whitelist → XML Feed URL bildirimi adımları
  - [x] Shopify: Custom App oluşturma → Admin API scope'ları → Shop domain adımları
  - [ ] Bağlantı testi butonu ("Test Connection" — credential sonrası doğrulama)

---

### 🔐 Hafta 10: Performans & Güvenlik

> **Sorumlu:** Berat (backend + frontend, AI ile çalışarak)

#### Backend — Güvenlik & Backend Performans
- [x] Güvenlik taraması
  - [x] Rate limiting yapılandırması (API endpoint'leri — granüler: api, inventory-write, platform-sync, bulk-operations, downloads, settings)
  - [x] Input sanitization gözden geçirme
  - [x] SQL injection koruması kontrolü
  - [x] XSS koruması kontrolü
  - [x] CORS yapılandırması (allowed_headers kısıtlandı, max_age=3600, rate limit header'ları expose edildi)
  - [x] CSP (Content Security Policy) header'ları (backend SecurityHeaders middleware + frontend next.config.ts)
- [x] İzleme (Monitoring) altyapısı
  - [x] Laravel Telescope kurulumu (v5.20, yavaş sorgu tespiti 100ms, hassas veri gizleme)
  - [x] Laravel Horizon kurulumu (v5.45, Redis kuyruk izleme, otomatik worker ölçekleme)
  - [x] Yavaş sorgu tespiti ve indeksleme optimizasyonu (500ms üzeri sorgu loglaması, N+1 koruması)
  - [ ] Hata takibi (Sentry entegrasyonu — Laravel + Next.js) — Sentry hesabı gerekli
  - [x] Health check endpoint'leri (`/api/health`, `/api/health/db`, `/api/health/redis`, `/api/health/queue`)
  - [x] API response cache header'ları (`Cache-Control`, `ETag` — CacheHeaders middleware)
- [ ] Yük testi
  - [ ] k6/Artillery ile 100 eşzamanlı kullanıcı simülasyonu
  - [ ] Darboğaz tespiti ve iyileştirme
  - [x] Veritabanı sorgu optimizasyonu (N+1 sorgu kontrolü — Model::preventLazyLoading)

#### Frontend — Frontend Performans & UX
- [x] Lighthouse performans optimizasyonu
  - [x] Lazy loading (WatchFormModal + PlatformHelpModal dynamic import, SSR:false)
  - [x] Image optimization (next/image — avif + webp formatları, static asset cache 1y)
  - [x] Bundle boyutu analizi ve azaltma (optimizePackageImports: lucide-react)
  - [x] Critical CSS extraction (Tailwind v4 otomatik)
- [x] Erişilebilirlik (a11y) denetimi
  - [x] ARIA label'lar → tüm interaktif elemanlar (sidebar nav, topbar, search, buttons, drawer)
  - [x] Klavye navigasyonu → tüm sayfalar (focus-visible ring, skip-to-content link)
  - [x] Renk kontrast kontrolü (WCAG AA — mevcut dark theme uyumlu)
  - [x] Screen reader uyumluluğu (role="navigation", role="banner", role="main", role="dialog", aria-current, aria-modal)
- [x] Responsive tasarım denetimi
  - [x] 320px (mobil küçük)
    - [x] Sidebar → hamburger menü (off-canvas) — mevcut, doğrulandı
    - [x] WatchTable → card layout'a dönüşüm (mobilde tablo yerine kart)
    - [x] WatchFormModal → full-screen modal (mevcut, doğrulandı)
    - [x] Dashboard KPI kartları → 1 sütun (grid-cols-1)
    - [x] TopBar → kompakt versiyon (logo + hamburger + bildirim)
    - [x] BulkActions → alt sabit bar (sticky bottom) — mevcut
    - [x] NotificationDrawer → full-screen overlay (max-w-[90vw])
    - [x] Settings PlatformCard → tam genişlik, stack layout
    - [x] Filtreler → collapsible (daraltılabilir) panel
    - [x] Sayfalama → basitleştirilmiş (önceki/sonraki sayfa numarası)
  - [x] 768px (tablet)
    - [x] Sidebar → daraltılmış (icon-only) varsayılan
    - [x] WatchTable → yatay scroll + desktop table görünümü
    - [x] Dashboard grid → 2 sütun (sm:grid-cols-2)
    - [x] WatchFormModal → max-width: 600px centered
    - [ ] AI Studio → stacked layout (alt-üst) — Hafta 7'de yapılacak
  - [x] 1024px (masaüstü)
    - [x] Sidebar → genişletilmiş varsayılan
    - [x] Tüm paneller standart genişlikte
  - [x] 1440px+ (geniş ekran)
    - [x] Max-content genişliği (merkez hizalı, max-w-content)
    - [x] Dashboard → 5 sütun KPI kartları (xl:grid-cols-5)
  - [x] Touch & gesture desteği
    - [ ] Swipe-to-delete (mobilde saat kartlarında) — ileriki iterasyonda
    - [ ] Pull-to-refresh (mobilde envanter listesinde) — ileriki iterasyonda
    - [x] Touch-friendly buton boyutları (min 44x44px tap target — @media pointer:coarse)
  - [ ] Responsive test otomasyonu
    - [ ] Playwright viewport testleri (320, 768, 1024, 1440)
    - [ ] Görsel regresyon testi (screenshot karşılaştırma)

---

### 🧪 Hafta 11: Uçtan Uca Test & Hata Giderme

> **Sorumlu:** Berat (backend + frontend, AI ile çalışarak)

#### Backend Testleri
- [x] PHPUnit test suite
  - [x] Auth endpoint testleri (mevcut — `AuthTest.php`)
  - [x] Watch CRUD testleri (`WatchCrudTest.php` — 18 test)
  - [x] Envanter durum geçiş testleri (`InventoryStateMachineTest.php` — 11 test)
  - [x] Redis Lock eşzamanlılık testleri (mevcut — `InventoryLockTest.php`)
  - [x] Chrono24 XML Feed format testleri (`Chrono24FeedTest.php` — 4 test)
  - [x] eBay API entegrasyon testleri (mock) — `EbayIntegrationTest.php` (11 test)
  - [x] Shopify API entegrasyon testleri (mock) — `ShopifyIntegrationTest.php` (9 test)
  - [x] Webhook işleme testleri (`WebhookTest.php` — 4 test)
  - [x] Fatura oluşturma testleri (`InvoiceTest.php` — 12 test)
  - [x] Dashboard endpoint testleri (`DashboardTest.php` — 7 test)
  - [x] Settings endpoint testleri (`SettingsTest.php` — 7 test)
  - [x] Health check testleri (`HealthCheckTest.php` — 5 test)
  - [x] Customer CRUD testleri (`CustomerCrudTest.php` — 12 test)
- [x] AI Servis testleri — `AiServiceTest.php` (14 test) + `test_ai_endpoints.py` (Python)
  - [x] SAM 2 maskeleme doğruluk testleri
  - [x] LLM açıklama üretim testleri
  - [x] Scraping pipeline testleri
- [x] Bug bash — 130 backend test + 63 frontend test tamamı geçiyor ✅

#### Frontend Testleri & Polish
- [x] Frontend test altyapısı kurulumu (Vitest + React Testing Library + jsdom)
- [x] Birim testler — Store'lar (5 dosya, 37 test)
  - [x] `authStore.test.ts` — hydrate, login, logout, fetchUser (6 test)
  - [x] `inventoryStore.test.ts` — CRUD, filters, optimistic update, rollback (10 test)
  - [x] `notificationStore.test.ts` — fetch, markRead, drawer toggle (8 test)
  - [x] `platformStore.test.ts` — fetch, credentials, disconnect (7 test)
  - [x] `toastStore.test.ts` — add, remove, clear, limit, helpers (6 test)
- [x] Birim testler — Bileşenler (7 dosya, 26 test)
  - [x] `AuthGuard.test.tsx` — loading, auth, redirect, hydrate (4 test)
  - [x] `EmptyState.test.tsx` — render, button callback (3 test)
  - [x] `ErrorBoundary.test.tsx` — children, fallback, custom fallback, retry (4 test)
  - [x] `StatusBadge.test.tsx` — labels, dropdown, callback (4 test)
  - [x] `SyncStatusBadges.test.tsx` — empty, disconnected, connected (4 test)
  - [x] `TableSkeleton.test.tsx` — table render, 8 rows (2 test)
  - [x] `WatchFilters.test.tsx` — search, status, advanced, clear (5 test)
- [x] E2E test altyapısı kurulumu (Playwright config + Chromium)
- [x] E2E test suite (3 spec dosyası)
  - [x] `auth.spec.ts` — login/register render, validation, navigation (5 test)
  - [x] `navigation.spec.ts` — protected routes redirect (5 test)
  - [x] `visual.spec.ts` — layout, responsive, input types, password toggle (4 test)
- [x] UI/UX son dokunuşlar
  - [x] Mikro-animasyonlar (CSS keyframes + utility classes: btn-press, card-hover, shimmer)
  - [x] Transition animasyonlar (`PageTransition.tsx` — sayfa geçiş wrapperi)
  - [x] Empty state illüstrasyonları (inline SVG saat illüstrasyonu)
  - [x] Onboarding turu (`OnboardingTour.tsx` — 4 adımlı rehber, localStorage ile tek sefer)

---

### 🚀 Hafta 12: Staging & Lansman

> **Sorumlu:** Berat (backend + frontend, AI ile çalışarak)

#### DevOps & Canlıya Alınma
- [ ] Docker Compose yapılandırması
  - [ ] Laravel API container
  - [ ] MySQL/PostgreSQL container
  - [ ] Redis container
  - [ ] RabbitMQ container
  - [ ] FastAPI AI servis container
  - [ ] Nginx reverse proxy
- [ ] CI/CD Pipeline (GitHub Actions)
  - [ ] Lint & test adımı
  - [ ] Build adımı
  - [ ] Staging deploy adımı
  - [ ] Production deploy adımı
- [ ] Production ortamı
  - [ ] SSL sertifikası kurulumu
  - [ ] DNS yapılandırması
  - [ ] Veritabanı migration'ı
  - [ ] Monitoring & alerting (uptime, error rate)
  - [ ] Yedekleme (backup) stratejisi + cron job yapılandırması
  - [ ] Log yönetimi (log rotation, centralized logging)
  - [ ] `.env.production` template'i
  - [ ] Database seed stratejisi (production için temiz seed vs. migration-only)
- [ ] **🚀 GO-LIVE**

#### Dokümantasyon & Landing
- [ ] Landing Page finalizasyonu
  - [ ] SEO meta tag'leri (title, description, keywords)
  - [ ] Open Graph image'lar
  - [ ] Lighthouse skoru > 90
  - [ ] Google Analytics / Plausible entegrasyonu
- [ ] Kullanıcı dokümantasyonu
  - [ ] Başlangıç kılavuzu (Getting Started)
  - [ ] SSS (FAQ) sayfası
  - [ ] Bilinen sınırlamalar
  - [ ] API dokümantasyonu (Swagger/OpenAPI)
- [ ] Lansman sonrası
  - [ ] Hata raporlama formu
  - [ ] Kullanıcı onboarding akışı
  - [ ] İlk geri bildirim toplama mekanizması

---

## AŞAMA 4 — Production Hazırlığı (Berat + AI — 2026-04-10)

### Task 12: Sentry Entegrasyonu
- [x] Backend: `sentry/sentry-laravel` v4.25 kuruldu
- [x] `bootstrap/app.php` → `Integration::handles($exceptions)` eklendi
- [x] `.env.example` → `SENTRY_LARAVEL_DSN` + `SENTRY_TRACES_SAMPLE_RATE` eklendi
- [x] Frontend: `@sentry/nextjs` kuruldu
- [x] `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` oluşturuldu
- [x] `src/instrumentation.ts` — runtime-based Sentry import
- [x] `src/app/global-error.tsx` — Sentry.captureException ile hata yakalama
- [x] `next.config.ts` → `withSentryConfig()` sarmalandı

### Task 13: Auth token → httpOnly Cookie Geçişi
- [x] `bootstrap/app.php` → `$middleware->statefulApi()` eklendi
- [x] `AuthController.php` → Token tabanlı auth kaldırıldı, session-based auth:
  - [x] `login()`: `Auth::attempt()` + `session()->regenerate()`
  - [x] `register()`: `Auth::login($user)` + `session()->regenerate()`
  - [x] `logout()`: `Auth::guard('web')->logout()` + `session()->invalidate()`
- [x] `api.ts` → `withCredentials: true` + `getCsrfCookie()` + localStorage kaldırıldı
- [x] `auth.ts` → `token` state kaldırıldı, cookie-based session auth
- [x] Auth store testleri güncellendi (6/6 pass)

### Task 14: E-posta Doğrulama
- [x] `User.php` → `implements MustVerifyEmail`
- [x] `EmailVerificationController.php` (status, resend, verify)
- [x] `AuthController.php` → register'da `event(new Registered($user))`
- [x] Email verification route'ları (signed URL + throttle)

### Task 15: CI/CD Pipeline
- [x] `.github/workflows/ci.yml` — Backend lint+test, Frontend lint+test+build

### Task 16: Production Deploy (Non-Docker)
- [x] `DEPLOYMENT.md` — Kapsamlı rehber: Nginx, PHP-FPM, PM2, Supervisor, SSL, UFW
- [x] `next.config.ts` → Production domain images + dynamic CSP

### Task 17: Landing Page SEO
- [x] `page.tsx` → Page metadata + JSON-LD structured data (SoftwareApplication)

---

## AŞAMA 5 — API Key Yapılandırması & Gerçek Veri Testi (Berat + AI — 2026-04-10)

### Task 18: .env API Key Yapılandırması
- [x] `backend/.env`'ye tüm API key placeholder'ları eklendi:
  - [x] `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REDIRECT_URI`, `EBAY_ENVIRONMENT=sandbox`
  - [x] `EBAY_RU_NAME`, `EBAY_WEBHOOK_VERIFICATION_TOKEN`
  - [x] `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_API_VERSION`, `SHOPIFY_WEBHOOK_SECRET`
  - [x] `GEMINI_API_KEY`, `GEMINI_BASE_URL`, `GEMINI_MODEL`
  - [x] `WATCHCHARTS_API_KEY`
  - [x] `SENTRY_LARAVEL_DSN`, `SENTRY_TRACES_SAMPLE_RATE`
  - [x] `SANCTUM_STATEFUL_DOMAINS`
- [x] **Bug Fix:** `config/services.php` `EBAY_ENVIRONMENT` config mismatch düzeltildi (`env('EBAY_SANDBOX', true)` → `env('EBAY_ENVIRONMENT', 'sandbox') === 'sandbox'`)
- [ ] API key değerlerinin girilmesi (kullanıcı aksiyonu — eBay Developer, Google AI Studio, Shopify Partner)

### Task 19: eBay Browse API + Sandbox Test
- [x] `GET /api/market/ebay-test` endpoint'i (`MarketController::ebayTest()`):
  - [x] client_credentials OAuth app token testi
  - [x] Browse API `/buy/browse/v1/item_summary/search` ile örnek arama
  - [x] Detaylı JSON yanıt: status, environment, total_results, sample_items
  - [x] Hata durumları: not_configured (422), auth_failed (401), connection_error (503)
- [x] `php artisan market:test-scan` komutu (`TestMarketScan.php`):
  - [x] eBay config gösterimi (maskelenmiş)
  - [x] OAuth token testi
  - [x] Browse API arama testi
  - [x] Tam tarama — tüm kaynaklar (eBay, AI Service, WatchCharts)
  - [x] `--ebay-only` ve `--skip-store` flagları
  - [x] Fiyat istatistikleri + rakip ilanları tablosu
- [ ] eBay Developer hesabı açılıp Sandbox test yapılması (kullanıcı aksiyonu)

### Task 20: Market Scanner Gerçek Veri UI
- [x] `market-api.ts` → `testEbayConnection()` + `EbayTestResult` tipi
- [x] Market Scanner sayfasına **Veri Kaynakları** durum banner'ı:
  - [x] Sayfa yüklendiğinde otomatik eBay API bağlantı testi
  - [x] Durum ikonları (✅ Bağlı, ⚠ Yapılandırılmamış, ❌ Hata)
  - [x] Ortam bilgisi (sandbox/production)
  - [x] Test sonucu: referans + bulunan sonuç sayısı + örnek sonuçlar
- [ ] Rolex 126610LN gerçek veri testi (API key girildikten sonra)

---

## 🔲 BEKLEYEN GÖREVLER — Devam Eden Geliştirme

> **Not:** Audit, test ve geliştirme sürecinde tespit edilen ek görevler. Hafta planlarındaki mevcut unchecked item'larla birlikte takip edilmelidir.

### 🐛 Bug Fix'ler
- [x] 3-dot menü pozisyon hatası (WatchTable.tsx — `createPortal` ile düzeltildi)
- [x] ViewServiceProvider eksik hatası (bootstrap/providers.php — eklendi)
- [x] Route cache stale (65 route → 33 görünüyordu, `route:clear` ile düzeltildi)
- [x] AI Studio watch ID 0 hatası — frontend saat seçilmeden `/api/watches/0/ai-enhance` çağırıyor (404) → saat seçici dropdown eklendi, seçim olmadan buton disabled
- [x] Mobil sidebar — alt kısım navigation bar olarak refactor edildi (BottomNav bileşeni)

### ⚙️ Konfigürasyon & Altyapı
- [x] OpenAI → Gemini geçişi (LlmService.php, config/services.php, .env.example)
- [x] `.env` dosyasına tüm API key placeholder'ları eklendi (GEMINI, eBay, Shopify, WatchCharts, Sentry, Sanctum)
- [ ] API key değerlerinin girilmesi bekleniyor (GEMINI_API_KEY, EBAY_CLIENT_ID/SECRET, SHOPIFY_*, WATCHCHARTS_API_KEY)
- [x] RabbitMQ `.env` değişkenleri kontrol edildi — `.env.example` zaten doğru, `compose.yaml` env vars düzeltildi (`RABBITMQ_DEFAULT_USER`/`RABBITMQ_DEFAULT_PASS`)
- [x] Queue worker başlatma komutu — Supervisor ile daemonize edildi (`docker/supervisord-queue.conf`)
- [x] E-posta doğrulama — kayıt sonrası email verification aktif edildi (MustVerifyEmail + EmailVerificationController + Registered event)
- [ ] Storage migration — lokal dosya sistemi → Cloudflare R2 (S3 uyumlu, ucuz)

### 🎨 Frontend İyileştirmeleri
- [x] Saat ekleme UX — 5 adımlı wizard:
  - [x] Adım 1: Marka & Model seçimi
  - [x] Adım 2: Referans no & Üretim yılı
  - [x] Adım 3: Teknik detaylar (kasa, kadran, hareket)
  - [x] Adım 4: Fotoğraflar yükleme
  - [x] Adım 5: Fiyat, açıklama (AI ile Tamamla butonu)
- [x] "AI ile Tamamla" butonu — saat formunda (Adım 5) açıklamayı LLM ile otomatik üretir
- [ ] AI Açıklama Üretimi UI (streaming metin gösterimi — Hafta 8 frontend TODO)
- [x] Mobil responsive — sidebar bottom nav dönüşümü (BottomNav.tsx, layout.tsx pb-20)
- [x] AI Studio → tablet stacked layout (xl breakpoint, grid cols-2/3/1)
- [ ] Swipe-to-delete (mobil saat kartları)
- [ ] Pull-to-refresh (mobil envanter listesi)

### 🔌 Platform Entegrasyonları
- [ ] Shopify product delete webhook handler implementasyonu
- [x] Platform "Test Connection" butonu (credential doğrulama — PlatformController + PlatformCard UI)
- [x] `EBAY_ENVIRONMENT` config mismatch düzeltildi (`env('EBAY_SANDBOX')` → `env('EBAY_ENVIRONMENT') === 'sandbox'`)
- [x] eBay Browse API test endpoint'i (`GET /api/market/ebay-test`) — OAuth + Browse API bağlantı testi
- [x] `php artisan market:test-scan` komutu — config doğrulama, token testi, tam tarama
- [ ] eBay sandbox → production geçiş rehberi
- [ ] Chrono24 XML Feed endpoint'i production URL ile test

### 📈 Market Scanner — Gerçek Veri Entegrasyonu (Ban-Free Strateji)
- [x] `ai-service/app/services/scraping.py` tamamen yeniden yazıldı (ban-free strateji)
- [x] **Tier 1 — eBay Browse API (BİRİNCİL):** Ücretsiz, resmi, sıfır ban riski. Laravel'den doğrudan çağrılır.
  - [x] client_credentials OAuth token yönetimi (Cache ile 7000s)
  - [x] `GET /buy/browse/v1/item_summary/search?q={ref}&category_ids=281` — Wristwatches kategorisi
  - [x] Sandbox/Production URL otomatik seçim (`config('services.ebay.sandbox')`)
  - [x] Fiyat, para birimi, kondisyon, satıcı, ilan URL, ülke dönüyor
- [x] **Tier 2 — Chrono24 + Watchfinder JSON-LD:** Ücretsiz, minimal risk. AI servisinden çağrılır.
  - [x] Chrono24 httpx JSON-LD structured data extraction (schema.org markup)
  - [x] Watchfinder JSON-LD + regex fallback
  - [x] Sıfır/negatif fiyatlar filtreleniyor, sonuçlar deduplicate ediliyor
- [x] **Tier 3 — WatchCharts API (TREND ANALİZİ):** Ücretli ($49-199/ay), tarihsel fiyat trendi + fair market value.
  - [x] `WATCHCHARTS_API_KEY` varsa Laravel'den çağrılır, yoksa atlanır
  - [x] WatchCharts trend verisi → Market Scanner fiyat trendi grafiğine entegre et
  - [x] Fair market value gösterimi ("Bu saat piyasada ortalama X€ değerinde")
  - [x] 6 ay / 1 yıl / 3 yıl trend grafiği verisi
- [x] **~~Playwright headless browser~~ KALDIRILDI:** IP ban riski — tüm Playwright kodu temizlendi
- [x] `MarketScrapingService.php` yeniden yazıldı — 3 tier orchestration
- [x] `config/services.php` güncellendi — `watchcharts` config eklendi
- [x] `compose.yaml` güncellendi — `WATCHCHARTS_API_KEY` ai-service'den kaldırıldı (Laravel tarafına taşındı)
- [x] `HESAPLAR_VE_MALIYETLER.md` güncellendi — yeni strateji ve maliyet senaryoları
- [x] Docker container rebuild tamamlandı (`docker compose build ai-service` + `up -d`)
- [x] Market Scanner sayfasına **Veri Kaynakları** durum banner'ı eklendi (eBay API otomatik bağlantı testi, durum ikonları, örnek sonuçlar)
- [ ] Gerçek veri ile test: Rolex 126610LN referansı ile scan endpoint'ini dene (API key girildikten sonra)

### 📊 İzleme & Test
- [x] Sentry entegrasyonu (sentry/sentry-laravel v4.25 + @sentry/nextjs — bootstrap/app.php Integration::handles + sentry.client/server/edge.config.ts + global-error.tsx + instrumentation.ts)
- [ ] k6/Artillery yük testi (100 eşzamanlı kullanıcı)
- [ ] Playwright responsive viewport testleri (320, 768, 1024, 1440)
- [ ] Görsel regresyon testi (screenshot karşılaştırma)

---
---

## AŞAMA 6 — YÖNETİCİ PANELİ, SAAT EKLEME REFAKTÖRÜ & ÇOKLU DİL DESTEĞİ (Berat + AI — 2026-04-15)

> **Hedef:** Saat ekleme akışının ayrı sayfa + entegre AI pipeline olarak yeniden yazılması, sistem genelini yönetebilecek 3 kademeli admin paneli, kullanıcı geri bildirim mekanizması, sözleşme yönetimi ve 4 dil desteği (TR, EN, DE, AR).

---

### ⌚ 0. Saat Ekleme Sayfası Refaktörü — Modal → Ayrı Sayfa + Entegre AI

> **Mevcut Durum:** Saat ekleme modal olarak çalışıyor (`WatchFormModal.tsx`). Fiyat adımında kapanma bugu var, foto yüklemede validasyon eksik, AI Studio ayrı sayfa.  
> **Yeni Durum:** Modal kaldırılacak. Saat ekleme ayrı bir sayfa (`/dashboard/inventory/new`) olacak. AI özellikleri (görsel doğrulama, arka plan iyileştirme, açıklama üretimi) doğrudan wizard'a gömülecek. AI Studio ayrı sayfa olarak kaldırılacak.

#### Akış Diyagramı
```
Envanter Listesi → [+ Saat Ekle] → /dashboard/inventory/new
  ↓
Adım 1: Marka & Model (marka dropdown, model dropdown, kondisyon seçimi)
  ↓
Adım 2: Detaylar (referans no, üretim yılı, kasa malzemesi, kadran rengi, hareket tipi)
  ↓
Adım 3: Fiyatlandırma (maliyet fiyatı, satış fiyatı, para birimi — validasyonlu)
  ↓
Adım 4: Fotoğraflar (drag & drop çoklu yükleme, min 1 foto zorunlu, maks 10MB/görsel)
  ↓
Adım 5: AI İşleme (fotoğraf yüklendikten sonra otomatik tetiklenir):
  ├── AI görsel doğrulama (gerçekten saat mi? — confidence score)
  ├── AI arka plan iyileştirme (beyaz stüdyo, siyah kadife vb.)
  └── AI ilan açıklaması üretimi (marka+model+detaylardan, 3 dilde: TR/EN/DE)
  → Kullanıcı sonuçları inceler: önce/sonra görseller + üretilen açıklama
  → Açıklamayı düzenleyebilir, arka plan seçimini değiştirebilir
  ↓
Adım 6: İnceleme & Yayınla (özet + platform toggle'ları + "Taslak Kaydet" / "Yayınla")
```

#### Backend — Saat Ekleme API İyileştirmeleri
- [x] `POST /api/watches` endpoint güncelleme — görsel yükleme ve AI pipeline'ı tetikleme desteği
- [x] `POST /api/watches/{id}/ai-process` — tüm AI işlemlerini tek seferde tetikleyen endpoint:
  - [x] Görsel doğrulama (`/api/ai/validate-image` çağrısı)
  - [x] Arka plan iyileştirme (`/api/ai/replace-background` çağrısı)
  - [x] İlan açıklaması üretimi (`/api/ai/generate-description` çağrısı — 3 dilde)
  - [x] Tüm işlemler paralel (`ProcessAiPipelineJob` — dispatch chain)
- [x] `GET /api/watches/{id}/ai-status` — AI işlem durumu endpoint'i (polling için):
  - [x] `validation_status`: pending/validated/flagged
  - [x] `background_status`: pending/processing/completed/failed
  - [x] `description_status`: pending/processing/completed/failed
  - [x] `ai_description`: üretilen açıklama metni (3 dil)
  - [x] `enhanced_images`: iyileştirilmiş görsel URL'leri
- [x] `PUT /api/watches/{id}/ai-results` — kullanıcının AI sonuçlarını onaylaması/düzenlemesi:
  - [x] Seçilen arka plan varyantı
  - [x] Düzenlenmiş açıklama metni
- [x] `POST /api/watches/{id}/publish` — saat yayınlama endpoint'i:
  - [x] Seçilen platformlara (eBay/Chrono24/Shopify) toggle bazlı yayınlama
  - [x] Saat durumunu `draft` → `active` yapma
  - [x] Platform senkronizasyonu tetikleme

#### Frontend — Saat Ekleme Sayfası (Yeni)
- [x] `WatchFormModal.tsx` kaldırılması (mevcut modal deprecate)
- [x] Yeni sayfa: `/dashboard/inventory/new` — `src/app/(dashboard)/dashboard/inventory/new/page.tsx`
- [x] Düzenleme sayfası: `/dashboard/inventory/[id]/edit` — aynı wizard bileşenleri kullanarak
- [x] Wizard bileşen mimarisi:
  - [x] `WatchWizard.tsx` — ana wizard container (adım yönetimi, ileri/geri navigasyon, progress bar)
  - [x] `StepBrandModel.tsx` — Adım 1: Marka & Model seçimi + kondisyon
  - [x] `StepDetails.tsx` — Adım 2: Referans no, üretim yılı, kasa, kadran, hareket
  - [x] `StepPricing.tsx` — Adım 3: Maliyet, satış fiyatı, para birimi (Zod validasyon)
  - [x] `StepPhotos.tsx` — Adım 4: Drag & drop fotoğraf yükleme
    - [x] Min 1 fotoğraf zorunluluğu (sonraki adıma geçiş engeli)
    - [x] Maks 10MB dosya boyutu kontrolü (client-side)
    - [x] Fotoğraf sıralama (drag & drop reorder)
    - [x] Fotoğraf silme (X butonu)
    - [x] Yükleme ilerleme çubuğu (progress bar)
  - [x] `StepAiProcessing.tsx` — Adım 5: AI İşleme
    - [x] Fotoğraflar yüklendikten sonra otomatik AI pipeline tetikleme
    - [x] İşlem durumu göstergesi (3 ayrı progress: doğrulama, arka plan, açıklama)
    - [x] Doğrulama sonucu: ✅ Onaylandı / ⚠️ İnceleniyor badge'i
    - [x] Arka plan varyantları galerisi (4 seçenek: beyaz stüdyo, siyah kadife, mermer, gri gradyan)
    - [x] Önce/Sonra karşılaştırma slider'ı (mevcut `BeforeAfterSlider` bileşeni yeniden kullanım)
    - [x] AI üretilen açıklama gösterimi (düzenlenebilir textarea)
    - [x] Dil seçimi: TR / EN / DE (tab bazlı — her dilde ayrı açıklama)
    - [x] "Yeniden Üret" butonu (açıklama beğenilmediyse tekrar AI çağrısı)
  - [x] `StepReviewPublish.tsx` — Adım 6: Son Kontrol & Yayınla
    - [x] Tüm bilgilerin özet kartı (marka, model, detaylar, fiyat, görseller, açıklama)
    - [x] Platform toggle'ları: eBay ✅ / Chrono24 ✅ / Shopify ✅
    - [x] "Taslak Olarak Kaydet" butonu (saat `draft` durumunda kalır)
    - [x] "Yayınla" butonu (seçilen platformlara anında senkronizasyon)
    - [x] Yayınlama sonrası başarı ekranı (konfeti animasyonu + envantere dön linki)
- [x] Envanter listesi sayfası güncelleme:
  - [x] "Saat Ekle" butonu → `/dashboard/inventory/new` sayfasına yönlendirme (modal açmak yerine)
  - [x] Satır tıklama → `/dashboard/inventory/[id]/edit` sayfasına yönlendirme
- [x] AI Studio sayfası kaldırma:
  - [x] `src/app/(dashboard)/dashboard/ai-studio/` sayfası silinmesi
  - [x] Sidebar'dan "AI Studio" menü öğesi kaldırılması
  - [x] AI Studio'ya özel bileşenler → wizard adımlarına taşınması veya silinmesi

### 🔐 A. Rol & Yetki Sistemi

#### Backend — Rol & Yetki Altyapısı
- [ ] `roles` tablosu migration'ı (`id`, `name`, `slug`, `description`, `permissions` JSONB, `created_at`)
- [ ] `admin_users` tablosu migration'ı (`id`, `user_id` FK, `role_id` FK, `is_active`, `last_login_at`, `created_by`, `created_at`)
- [ ] `admin_activity_logs` tablosu migration'ı (`id`, `admin_user_id` FK, `action`, `target_type`, `target_id`, `details` JSONB, `ip_address`, `created_at`)
- [ ] 3 varsayılan rol seeder'ı:
  - [ ] **Super Admin** — Tam yetki (yönetici ekleme/silme, sistem ayarları, sözleşme yönetimi, tüm okuma/yazma)
  - [ ] **Admin** — Operasyonel yetki (kullanıcılar, saatler, gelir, feedbackler, raporlar — yönetici yönetimi hariç)
  - [ ] **Moderator** — Sınırlı yetki (feedbackleri görme/yanıtlama, kullanıcı listesi görme, flagged saat inceleme — yazma yetkileri sınırlı)
- [ ] `AdminUser` Eloquent model + ilişkiler (belongsTo User, belongsTo Role)
- [ ] `Role` Eloquent model + `hasPermission($permission)` metodu
- [ ] Admin Auth middleware (`admin`, `admin.role:super_admin`, `admin.role:admin,super_admin`)
- [ ] Admin Auth API endpoint'leri:
  - [ ] `POST /api/admin/auth/login` — admin girişi (sadece admin rolü olan kullanıcılar)
  - [ ] `POST /api/admin/auth/logout`
  - [ ] `GET /api/admin/auth/me` — rol & yetki bilgisi dahil
- [ ] Yönetici CRUD API (sadece Super Admin):
  - [ ] `GET /api/admin/managers` — yönetici listesi
  - [ ] `POST /api/admin/managers` — yeni yönetici ekleme (mevcut kullanıcıya rol atama veya yeni kullanıcı oluşturma)
  - [ ] `PUT /api/admin/managers/{id}` — rol değiştirme, aktif/pasif yapma
  - [ ] `DELETE /api/admin/managers/{id}` — yönetici yetkisini kaldırma (kullanıcı silinmez)
- [ ] Aktivite logu otomatik kayıt (middleware bazlı — her admin API çağrısında `admin_activity_logs`'a yazma)
- [ ] `GET /api/admin/activity-logs` — aktivite logu listesi (filtreleme: admin, aksiyon tipi, tarih aralığı)

#### Frontend — Admin Auth & Yönetici Yönetimi UI
- [ ] Admin login sayfası (`/admin/login`)
- [ ] Admin layout (ayrı sidebar — admin menü öğeleri)
- [ ] Admin AuthGuard (rol kontrolü)
- [ ] Yönetici listesi sayfası (`/admin/managers`) — tablo: isim, email, rol, durum, son giriş
- [ ] Yönetici ekleme modal'ı (email ile kullanıcı arama + rol seçimi)
- [ ] Yönetici düzenleme (rol değiştirme, aktif/pasif toggle)
- [ ] Aktivite logu sayfası (`/admin/activity-logs`) — filtrelenebilir tablo

---

### 📊 B. Admin Dashboard (Özet Ekranı)

#### Backend — Admin İstatistik API'leri
- [ ] `GET /api/admin/dashboard/stats` — özet istatistikler:
  - [ ] Toplam gelir (günlük/haftalık/aylık/yıllık)
  - [ ] Toplam kayıtlı kullanıcı sayısı + aktif kullanıcı sayısı
  - [ ] Yeni kayıtlar (son 7 gün, son 30 gün)
  - [ ] Toplam kayıtlı saat sayısı (duruma göre kırılım: active/sold/draft/flagged)
  - [ ] Flagged saat sayısı (inceleme bekleyen)
  - [ ] Açık feedback sayısı
- [ ] `GET /api/admin/dashboard/revenue-chart` — gelir grafiği verisi (tarih aralığı parametreli, günlük/haftalık/aylık gruplandırma)
- [ ] `GET /api/admin/dashboard/platform-revenue` — platform bazında gelir dağılımı (eBay / Chrono24 / Shopify)
- [ ] `GET /api/admin/dashboard/recent-activities` — son aktiviteler feed (yeni kayıt, satış, hata, feedback — son 50)
- [ ] `GET /api/admin/dashboard/user-growth` — kullanıcı büyüme grafiği (günlük yeni kayıt trendi)

#### Frontend — Admin Dashboard UI
- [ ] Admin Dashboard sayfası (`/admin`)
- [ ] KPI Kartları: Toplam Gelir, Aktif Kullanıcı, Kayıtlı Saat, Satış (Bu Ay), Flagged Saat, Açık Feedback
- [ ] Gelir grafiği (çizgi + bar chart — Recharts)
- [ ] Platform gelir dağılımı (pasta/donut grafiği)
- [ ] Kullanıcı büyüme grafiği (çizgi grafik)
- [ ] Son aktiviteler feed tablosu (canlı güncelleme)
- [ ] Flagged saat uyarı kartı (sayı + "İncele" butonu ile link)

---

### 👥 C. Kullanıcı Yönetimi

#### Backend — Kullanıcı Yönetim API'leri
- [ ] `GET /api/admin/users` — kullanıcı listesi (sayfalama, arama: isim/email, filtreleme: durum/kayıt tarihi aralığı/saat sayısı, sıralama)
- [ ] `GET /api/admin/users/{id}` — kullanıcı detayı (profil + saatleri + satış geçmişi + faturaları + kabul edilen sözleşmeler)
- [ ] `PUT /api/admin/users/{id}/status` — aktif/pasif yapma
- [ ] `POST /api/admin/users/{id}/reset-password` — şifre sıfırlama linki gönderme (e-posta ile)
- [ ] `DELETE /api/admin/users/{id}` — kullanıcı silme (soft delete + ilişkili verilerin anonimleştirilmesi)

#### Frontend — Kullanıcı Yönetimi UI
- [ ] Kullanıcı listesi sayfası (`/admin/users`) — tablo: isim, email, kayıt tarihi, durum, saat sayısı, toplam satış
- [ ] Arama çubuğu + filtre paneli (durum, tarih aralığı)
- [ ] Kullanıcı detay sayfası (`/admin/users/[id]`) — sekmeli: Profil, Saatleri, Satışları, Faturaları, Sözleşme Kabulleri
- [ ] Aksiyon butonları: Aktif/Pasif toggle, Şifre Sıfırla, Sil (onay modal'ı ile)

---

### ⌚ D. Saat Görüntüleme & AI Otomatik Doğrulama

#### Backend — AI Doğrulama Sistemi
- [ ] `watches` tablosuna `validation_status` enum sütun eklenmesi (`pending`, `validated`, `flagged`, `rejected`) — migration
- [ ] `watches` tablosuna `validation_details` JSONB sütun eklenmesi (AI doğrulama sonuç detayları) — migration
- [ ] `POST /api/ai/validate-image` endpoint'i (FastAPI):
  - [ ] Yüklenen görselin saat olup olmadığını kontrol (image classification / object detection)
  - [ ] Güven skoru döndürme (confidence score — 0.0-1.0)
  - [ ] Eşik değer: > 0.7 → `validated`, < 0.7 → `flagged`
- [ ] `ValidateWatchJob` — saat eklendikten sonra arka planda çalışan async job:
  - [ ] AI görsel doğrulama çağrısı
  - [ ] Marka-model-referans tutarlılık kontrolü (brands/models.json cross-check)
  - [ ] Fiyat aralığı mantık kontrolü (marka bazında makul fiyat aralığı referans verisi)
  - [ ] Sonuca göre `validation_status` güncelleme
  - [ ] `flagged` ise admin bildirim oluşturma
- [ ] `WatchController::store()` güncellemesi — saat eklendikten sonra `ValidateWatchJob::dispatch($watch)`
- [ ] Admin saat API'leri:
  - [ ] `GET /api/admin/watches` — tüm dealer'ların saatleri (filtreleme: validation_status, dealer, marka, durum)
  - [ ] `GET /api/admin/watches/flagged` — sadece bayraklı saatler
  - [ ] `GET /api/admin/watches/{id}` — saat detayı + doğrulama detayları + kullanıcı bilgisi
  - [ ] `PUT /api/admin/watches/{id}/validate` — yönetici aksiyonu: onayla (`validated`) veya reddet (`rejected`, sebep ile)

#### Frontend — Admin Saat Yönetimi UI
- [ ] Tüm saatler listesi sayfası (`/admin/watches`) — tablo + validation_status badge'leri
- [ ] Flagged saatler filtresi (varsayılan olarak flagged göster)
- [ ] Saat detay modal'ı — AI doğrulama sonucu gösterimi (güven skoru, tespit edilen sorunlar)
- [ ] Onayla / Reddet butonları (reddetme sebebi textarea ile)
- [ ] Kullanıcıya bildirim: "Görseliniz kontrol ediliyor" toast (saat ekleme sonrası)
- [ ] Kullanıcıya bildirim: Reddedilirse sebep ile nazik bildirim

---

### 💰 E. Gelir & Finansal Raporlar

#### Backend — Rapor API'leri
- [ ] `GET /api/admin/reports/revenue` — gelir tablosu (tarih aralığı, platform filtresi, sayfalama)
- [ ] `GET /api/admin/reports/commissions` — platform başına komisyon oranları ve kazanç özeti
- [ ] `GET /api/admin/reports/subscriptions` — kullanıcı abonelik planları ve ödeme durumları (ileride)
- [ ] `GET /api/admin/reports/export` — CSV/Excel export endpoint'i (tarih aralığı + rapor tipi parametreli)

#### Frontend — Rapor UI
- [ ] Gelir raporu sayfası (`/admin/reports/revenue`) — tablo + tarih aralığı picker + platform filtresi
- [ ] Komisyon raporu sayfası (`/admin/reports/commissions`) — platform bazında kırılım
- [ ] Export butonu (CSV / Excel indirme)

---

### 💬 F. Feedback (Geri Bildirim) Sistemi

#### Backend — Feedback Altyapısı
- [ ] `feedbacks` tablosu migration'ı (`id`, `user_id` nullable FK, `name`, `email`, `category` enum: bug/suggestion/complaint/general, `subject`, `message` text, `status` enum: new/reviewing/resolved/rejected, `admin_response` text nullable, `responded_by` FK nullable, `responded_at`, `created_at`)
- [ ] `Feedback` Eloquent model + ilişkiler
- [ ] Kullanıcı tarafı API:
  - [ ] `POST /api/feedbacks` — feedback gönderme (auth opsiyonel — misafir de gönderebilir)
  - [ ] `GET /api/feedbacks/mine` — kendi feedbacklerimi görme (auth gerekli)
- [ ] Admin tarafı API:
  - [ ] `GET /api/admin/feedbacks` — feedback listesi (filtreleme: kategori, durum, tarih aralığı, sayfalama)
  - [ ] `GET /api/admin/feedbacks/{id}` — feedback detayı
  - [ ] `PUT /api/admin/feedbacks/{id}` — durum güncelleme + yanıt yazma
  - [ ] `GET /api/admin/feedbacks/stats` — istatistikler (kategori dağılımı, ortalama çözüm süresi, durum dağılımı)
- [ ] Feedback yanıtlandığında kullanıcıya e-posta bildirimi (`FeedbackRespondedNotification`)

#### Frontend — Feedback Widget & Admin UI
- [ ] **Feedback widget bileşeni** (dashboard + landing page):
  - [ ] Sabit pozisyonlu "Geri Bildirim" butonu (sağ alt köşe)
  - [ ] Açılır form: kategori seçimi, konu, mesaj, gönder
  - [ ] Misafir kullanıcı için isim + email alanları (auth'lu kullanıcıda otomatik dolu)
  - [ ] Gönderim sonrası teşekkür mesajı
- [ ] Kullanıcı feedbacklerim sayfası (`/dashboard/feedbacks`) — kendi gönderdiğim feedbackler + admin yanıtları
- [ ] Admin feedback listesi sayfası (`/admin/feedbacks`) — tablo: tarih, kullanıcı, kategori, konu, durum badge
- [ ] Admin feedback detay sayfası — mesaj + yanıt textarea + durum değiştirme dropdown
- [ ] Admin feedback istatistikleri — kategori pasta grafiği, durum dağılımı, çözüm süresi trendi

---

### 📜 G. Sözleşme Yönetimi

#### Backend — Sözleşme Altyapısı
- [ ] `contracts` tablosu migration'ı (`id`, `type` enum: terms_of_service/privacy_policy/kvkk_gdpr/cookie_policy, `title`, `slug`, `content` longText, `version` string, `status` enum: draft/published/archived, `published_at` nullable, `created_by` FK, `created_at`, `updated_at`)
- [ ] `contract_acceptances` tablosu migration'ı (`id`, `user_id` FK, `contract_id` FK, `version` string, `ip_address`, `user_agent`, `accepted_at`, unique constraint: user_id + contract_id + version)
- [ ] `Contract` Eloquent model + versiyonlama mantığı (aynı type için yeni versiyon oluşturma)
- [ ] `ContractAcceptance` Eloquent model
- [ ] Admin sözleşme API'leri:
  - [ ] `GET /api/admin/contracts` — sözleşme listesi (tip, durum filtresi)
  - [ ] `POST /api/admin/contracts` — yeni sözleşme oluşturma (taslak olarak)
  - [ ] `PUT /api/admin/contracts/{id}` — sözleşme düzenleme (sadece taslaklar düzenlenebilir)
  - [ ] `POST /api/admin/contracts/{id}/publish` — yayınlama (mevcut yayında olanı arşive alır, yeni versiyonu yayınlar)
  - [ ] `GET /api/admin/contracts/{id}/acceptances` — bu sözleşmeyi kabul eden kullanıcılar listesi
  - [ ] `POST /api/admin/contracts/{id}/notify` — sözleşme değişiklik bildirimi gönderme (tüm kullanıcılara email)
- [ ] Kullanıcı tarafı sözleşme API'leri:
  - [ ] `GET /api/contracts/active` — aktif (yayında) sözleşmeler listesi (kayıt formunda gösterilecek)
  - [ ] `GET /api/contracts/{slug}` — sözleşme içeriğini görüntüleme (public endpoint)
  - [ ] `POST /api/contracts/{id}/accept` — sözleşme kabul etme
  - [ ] `GET /api/contracts/pending` — kullanıcının henüz kabul etmediği güncel sözleşmeler (zorunlu kabul kontrolü)
- [ ] Kayıt akışı güncellemesi: `AuthController::register()` → aktif sözleşmelerin kabul edilip edilmediği kontrolü + `contract_acceptances` kayıtları oluşturma
- [ ] Sözleşme değişiklik bildirimi (`ContractUpdatedNotification` — email)
- [ ] Middleware: Giriş yapan kullanıcının güncel sözleşmeleri kabul edip etmediği kontrolü (kabul etmediyse zorunlu kabul sayfasına yönlendirme)

#### Frontend — Sözleşme UI
- [ ] Public sözleşme sayfası (`/contracts/[slug]`) — tam metin gösterimi (SEO-friendly)
- [ ] Kayıt formuna sözleşme checkbox'ları (dinamik — API'den aktif sözleşmeler çekilir)
- [ ] Zorunlu sözleşme kabul sayfası (`/accept-contracts`) — giriş sonrası güncel sözleşmeler kabul edilmediyse yönlendirme
- [ ] Admin sözleşme listesi sayfası (`/admin/contracts`) — tablo: tip, başlık, versiyon, durum, yayınlanma tarihi
- [ ] Admin sözleşme oluşturma/düzenleme sayfası (`/admin/contracts/new`, `/admin/contracts/[id]/edit`) — zengin metin editörü (WYSIWYG — TipTap veya Quill)
- [ ] Yayınla butonu (onay modal'ı: "Bu sözleşme yayınlandığında mevcut versiyon arşivlenecek")
- [ ] Sözleşme kabul istatistikleri — kaç kullanıcı kabul etti, kabul oranı

---

### ⚙️ H. Sistem Ayarları (Admin)

#### Backend — Sistem Ayarları API'leri
- [ ] `system_settings` tablosu migration'ı (`id`, `key` unique, `value` text, `type` enum: string/boolean/json/number, `updated_by` FK, `updated_at`)
- [ ] `SystemSetting` model + cache katmanı (Redis ile — her okumada DB'ye gitmemek için)
- [ ] `GET /api/admin/settings` — tüm ayarlar
- [ ] `PUT /api/admin/settings` — ayarları toplu güncelleme
- [ ] Varsayılan ayarlar seeder'ı (site_name, contact_email, maintenance_mode, default_language vb.)
- [ ] `GET /api/admin/system/health` — tüm servislerin sağlık durumu (DB, Redis, Queue, AI Service, eBay API, Shopify API)

#### Frontend — Sistem Ayarları UI
- [ ] Sistem ayarları sayfası (`/admin/settings`):
  - [ ] Genel sekmesi: site adı, iletişim emaili, bakım modu toggle
  - [ ] Email şablonları sekmesi: bildirim emaillerini önizleme ve düzenleme
  - [ ] Servis durumu sekmesi: API bağlantı sağlık kontrolü kartları (yeşil/kırmızı dot + son kontrol zamanı)

---

### 🌍 I. Çoklu Dil Desteği (i18n) — Altyapı

#### Frontend — i18n Kurulumu
- [ ] `next-intl` paketi kurulumu ve yapılandırması
- [ ] URL yapısı: `/{locale}/dashboard`, `/{locale}/admin` (locale: `tr`, `en`, `de`, `ar`)
- [ ] Middleware: URL'den locale algılama + varsayılan dile yönlendirme
- [ ] Dil algılama önceliği: URL parametresi → kullanıcı profil tercihi → localStorage → tarayıcı dili → varsayılan (TR)
- [ ] `messages/` klasörü yapısı:
  - [ ] `tr/common.json` — ortak UI metinleri (butonlar, etiketler, navigasyon)
  - [ ] `tr/auth.json` — giriş, kayıt, şifre sıfırlama metinleri
  - [ ] `tr/dashboard.json` — dashboard sayfası metinleri
  - [ ] `tr/inventory.json` — envanter yönetimi metinleri
  - [ ] `tr/admin.json` — yönetici paneli metinleri
  - [ ] `tr/feedback.json` — geri bildirim metinleri
  - [ ] `tr/contracts.json` — sözleşme metinleri
  - [ ] `tr/settings.json` — ayarlar metinleri
  - [ ] `tr/market.json` — market scanner metinleri
  - [ ] `tr/ai.json` — AI studio metinleri
  - [ ] Aynı yapı `en/`, `de/`, `ar/` için de tekrarlanacak
- [ ] TopBar'a dil değiştirici dropdown (bayrak ikonlu: 🇹🇷 🇬🇧 🇩🇪 🇸🇦)
- [ ] Kullanıcı profil ayarlarına "Tercih edilen dil" seçeneği eklenmesi
- [ ] Tüm mevcut hardcoded metinlerin `useTranslations()` hook ile değiştirilmesi

#### Backend — i18n
- [ ] Laravel `lang/` klasörüne dil dosyaları:
  - [ ] `lang/tr/` — validation, auth, pagination, passwords, email mesajları
  - [ ] `lang/en/` — aynı yapı
  - [ ] `lang/de/` — aynı yapı
  - [ ] `lang/ar/` — aynı yapı
- [ ] API yanıtlarında `Accept-Language` header'ına göre hata mesajı dili belirleme
- [ ] E-posta şablonlarının çok dilli versiyonları (kullanıcının dil tercihine göre gönderim)
- [ ] `users` tablosuna `preferred_language` sütunu eklenmesi (migration — varsayılan: `tr`)

### 🌍 J. Çeviri İçerikleri

- [ ] **Türkçe (TR):** Ana dil — tüm arayüz, email şablonları, sözleşmeler (zaten mevcut, formalize edilecek)
- [ ] **İngilizce (EN):** Tam çeviri — tüm namespace JSON dosyaları + Laravel lang + email şablonları
- [ ] **Almanca (DE):** Tam çeviri — tüm namespace JSON dosyaları + Laravel lang + email şablonları
- [ ] **Arapça (AR) [opsiyonel]:** Tam çeviri + RTL desteği

### 🔄 K. RTL Desteği (Arapça)

- [ ] `dir="rtl"` özniteliği locale'e göre dinamik ekleme (`layout.tsx`)
- [ ] Tailwind CSS logical properties kullanımı (`ms-` / `me-` / `ps-` / `pe-` — margin/padding sağ-sol yerine start-end)
- [ ] Sidebar → RTL'de sağ tarafa geçme
- [ ] İkon yönleri aynalama (ok ikonları vb.)
- [ ] RTL uyumlu form layout'ları (label'lar sağda, input'lar solda)
- [ ] Tüm bileşenlerde RTL test kontrolü

---

### 📋 Aşama 6 — Özet Tablo

| Kategori | Görev Sayısı | Durum |
|----------|-------------|-------|
| 0. Saat Ekleme Refaktörü | 28 | ⬜ Başlanmadı |
| A. Rol & Yetki Sistemi | 17 | ⬜ Başlanmadı |
| B. Admin Dashboard | 12 | ⬜ Başlanmadı |
| C. Kullanıcı Yönetimi | 9 | ⬜ Başlanmadı |
| D. Saat & AI Doğrulama | 14 | ⬜ Başlanmadı |
| E. Gelir & Raporlar | 7 | ⬜ Başlanmadı |
| F. Feedback Sistemi | 15 | ⬜ Başlanmadı |
| G. Sözleşme Yönetimi | 20 | ⬜ Başlanmadı |
| H. Sistem Ayarları | 8 | ⬜ Başlanmadı |
| I. i18n Altyapı | 17 | ⬜ Başlanmadı |
| J. Çeviri İçerikleri | 4 | ⬜ Başlanmadı |
| K. RTL Desteği | 6 | ⬜ Başlanmadı |
| **TOPLAM** | **157** | — |

---
## �📈 Özet Metrikleri

| Metrik | Hedef |
|--------|-------|
| API Endpoint Sayısı | ~40+ |
| Frontend Sayfa Sayısı | 12+ |
| React Bileşen Sayısı | 50+ |
| Test Kapsamı (Backend) | > 80% |
| Test Kapsamı (E2E) | Kritik akışların %100'ü |
| Lighthouse Performans | > 90 |
| İlk Yükleme Süresi (FCP) | < 1.5s |
| API Yanıt Süresi (P95) | < 200ms |
| Eşzamanlı Kullanıcı Desteği | 100+ |

---

## 🧑‍🤝‍🧑 AŞAMA 7 — EKİP YÖNETİMİ & İZİN SİSTEMİ (Team Management & Permissions)

> **Durum:** ⬜ Planlandı — sonraki chat'te geliştirilecek
> **Tarih (plan):** 2026-07-01
> **Amaç:** Bir bayi (owner) veya `team.manage` iznine sahip manager, e-posta ile çalışan davet edebilsin; davet edilen kişi maildeki linkten şifre oluşturup katılsın; kendisine verilen izinler dahilinde hareket etsin (ör. saatleri görebilir ama fiyatları göremez).
> **Kilitlenen kararlar:** (1) Hibrit izin modeli = rol preset + çalışan bazında override; (2) davet edebilenler: owner **ve** `team.manage`'li manager; (3) davet geçerlilik süresi **ayarlanabilir** (varsayılan 7 gün, davet başına override + bayi varsayılanı); (4) tam kapsam bu aşamada; (5) her adımdan sonra Playwright ile test.
> **Not:** Kimlik doğrulama session/cookie (Sanctum SPA) — değişmiyor. Veri zaten `dealer_id` ile kapsamlı; aynı bayiye eklenen çalışan otomatik aynı veriyi görür.

### 🔑 A. İzin Taksonomisi & Rol Preset'leri (config)
- [x] `backend/config/permissions.php` oluştur — kanonik izin listesi + rol preset haritaları
  - [x] Modül/aksiyon izinleri: `inventory.view/create/edit/delete/publish`, `crm.view/manage`, `invoices.view/manage`, `market.view`, `platforms.manage`, `ai.use`, `settings.manage`, `team.manage`
  - [x] Alan düzeyi izinler: `inventory.view_cost` (maliyet fiyatı), `inventory.view_price` (satış fiyatı)
  - [x] Preset: `owner` = tümü (implicit `*`), `manager` = team.manage hariç geniş set, `staff` = dar set (varsayılan: `inventory.view`, `ai.use`)
  - [x] Preset'ler yalnızca başlangıç; owner çalışan bazında override eder

### 🗄 B. Veritabanı Şeması
- [x] Migration: `users` tablosuna alanlar ekle
  - [x] `status` enum('active','invited','disabled') default 'active'
  - [x] `permissions` json null (explicit izinler; null → rol preset'ine düşer)
  - [x] `invited_by` FK users null, `invited_at` timestamp null
  - [x] `last_login_at` timestamp null
- [x] Migration: `invitations` tablosu oluştur
  - [x] `id, dealer_id (FK), email, role enum('manager','staff'), permissions json null`
  - [x] `token_hash (unique), invited_by (FK users), expires_at, accepted_at null, revoked_at null, timestamps`
  - [x] Index: (dealer_id, email), token_hash unique
- [x] `migrate` çalıştır + mevcut kullanıcılar backfill (hepsi `status=active`, `permissions=null`)

### 🧩 C. Model & Yetki Mantığı
- [x] `app/Models/Invitation.php` — fillable, casts (permissions array, expires_at/accepted_at datetime), `isExpired()`, `isPending()`, scope `pending()`
- [x] `User.php` güncelle
  - [x] fillable'a `status, permissions, invited_by, invited_at, last_login_at`
  - [x] casts: `permissions => array`, `invited_at/last_login_at => datetime`
  - [x] `effectivePermissions(): array` (owner → tüm izinler; permissions!=null → permissions; değilse preset[role])
  - [x] `hasPermission(string $perm): bool` (owner her zaman true)
  - [x] `canManageTeam(): bool` (owner || hasPermission('team.manage'))
  - [x] `isActive()/isDisabled()/isInvited()`, `invitedBy()` ilişkisi

### 🛡 D. Yetkilendirme Zorlaması (mevcut güvenlik borcunu da kapatır)
- [x] `app/Http/Middleware/DealerPermission.php` — `permission:<izin>` (owner implicit izinli)
- [x] `bootstrap/app.php` alias: `'permission' => DealerPermission::class`
- [x] `login` akışı: `status=disabled` ise girişi engelle (401) + `last_login_at` güncelle
- [x] FormRequest `authorize()` metotlarını gerçek izinlerle doldur:
  - [x] `StoreWatchRequest` → `inventory.create`, `UpdateWatchRequest` → `inventory.edit`, `UpdateWatchStatusRequest` → `inventory.edit`, `UploadWatchImageRequest` → `inventory.edit`
- [x] `routes/api.php` — ilgili grup/rotalara `permission:` middleware ekle (watches, customers, invoices, platforms, market, ai, settings)

### ✉️ E. Davet & Şifre-Oluşturma Akışı (API)
- [x] `app/Http/Controllers/Api/TeamController.php`
  - [x] `GET /api/team` — bayinin üyeleri + bekleyen davetler + izin kataloğu
  - [x] `GET /api/team/permissions` — taksonomi + preset'ler (UI için)
  - [x] `POST /api/team/invitations` — { email, role, permissions[], expires_in_days? } → davet + token + notification
  - [x] `POST /api/team/invitations/{invitation}/resend`, `DELETE /api/team/invitations/{invitation}`
  - [x] `PUT /api/team/members/{user}/permissions`, `PUT /api/team/members/{user}/role`
  - [x] `POST /api/team/members/{user}/disable` / `enable`, `DELETE /api/team/members/{user}`
- [x] `app/Http/Controllers/Api/InvitationController.php` (public)
  - [x] `GET /api/invitations/{token}` — token doğrula, e-posta + davet bilgisi dön
  - [x] `POST /api/invitations/{token}/accept` — { name, password } → User yarat (dealer_id/role/permissions davetten, status=active, email_verified_at=now), daveti accepted işaretle, otomatik login
- [x] FormRequest'ler: `InviteTeamMemberRequest`, `AcceptInvitationRequest`, `UpdateMemberPermissionsRequest`
- [x] `app/Notifications/TeamInvitationNotification.php` — mail; link `FRONTEND_URL/invite/{token}` (dev'de log'a düşer)
- [x] Bayi davet varsayılanı: `GET/PUT /api/settings/team-defaults` (invitation_expiry_days) — dealers.invitation_expiry_days sütunu

### 🔒 F. Güvenlik & Sınır Durumları
- [x] Team rotaları yalnızca owner || `team.manage` (middleware) — `permission:team.manage`
- [x] `role='owner'` davet edilemez — `Rule::in(invitable_roles)`
- [x] Privilege escalation koruması: davet eden, sahip olmadığı izni/`team.manage`'i veremez (subset kontrolü) — `assertGrantableBy`
- [x] Hedef kullanıcı aynı `dealer_id`'de olmalı (aksi halde 403) — `assertSameDealer`
- [x] Son owner korunur (silinemez/rol düşürülemez/pasifleştirilemez) — `assertNotLastOwner`
- [x] E-posta global unique: başka bayide kayıtlı e-posta → 422 net mesaj; aynı bayide bekleyen davet varsa → değiştir/yeniden gönder
- [x] Token: yalnız hash saklanır, tek kullanımlık, süre kontrolü; davet oluşturma (throttle:api) + resend, accept (throttle:20,1)
- [x] Disabled kullanıcı giriş yapamaz — login guard + `DealerPermission`
- [ ] (Test kanıtı Blok K'de: feature/Playwright ile subset, last-owner, disabled, expired token senaryoları)

### 🎯 G. Alan Düzeyi Fiyat Gizleme
- [x] `app/Http/Resources/WatchResource.php` — `inventory.view_price` yoksa `sale_price`, `inventory.view_cost` yoksa `cost_price` alanını **tamamen çıkar**
- [x] `WatchController` (index/show) → WatchResource kullan
- [x] `DashboardController@stats` → envanter değeri KPI'ını `inventory.view_price` yoksa gizle/maskele
- [ ] (Takip) CRM portföy değerleri ve diğer fiyat gösterimlerinde tutarlı gizleme

### 💻 H. Frontend — Ekip Yönetimi UI
- [x] Tip güncellemeleri: `User`'a `status`, `permissions`, `effective_permissions`, `last_login_at`; yeni `TeamMember`, `TeamInvitation`, `PermissionCatalog`, `TeamResponse`
- [x] `src/lib/team-api.ts` — tüm team endpoint'leri (+ public `invitationApi`)
- [x] `src/lib/permissions.ts` — sabitler + `hasPermission(user, perm)` + `canManageTeam`
- [x] `src/hooks/usePermission.ts` + `<Can permission="...">` sarmalayıcı
- [x] Sayfa: `src/app/[locale]/(dashboard)/dashboard/team/page.tsx` (owner/`team.manage` görür)
- [x] Bileşenler: `MemberList`, `InviteMemberModal` (email + rol + izin grid + süre), `PendingInvitations`, `PermissionMatrix`, `MemberRow`
- [x] Sidebar'a "Ekip" öğesi (izne göre görünür) + i18n Sidebar.team (tr/en/de)
- [x] Gating: sidebar + fiyat sütun/alanları izne göre gizle (WatchTable desktop+mobil, dashboard KPI). Not: backend zaten alanı çıkarıyor; saat detay modalı fiyat düzenlemesi (Blok G/frontend takip)
- [ ] (Tarayıcı etkileşim testi Blok K'de: owner davet → staff fiyat göremez → team.manage yoksa menü yok)

### 🔗 I. Frontend — Davet Kabul Sayfası
- [x] `src/app/[locale]/(auth)/invite/[token]/page.tsx` — GET ile token doğrula → isim + şifre formu → POST accept → dashboard'a yönlendir
- [x] Geçersiz/süresi dolmuş/kabul edilmiş token için hata durumları (404→Geçersiz, 410→Süresi doldu)
- [x] ⚠️ Next 16: `params: Promise<{token}>` + `use(params)` deseni (admin `[id]` sayfasıyla aynı)

### 🌐 J. i18n
- [x] `messages/de|en|tr.json` → `Team` namespace (davet, roller, izin etiketleri, hata/başarı) + `Invite` namespace (davet kabul sayfası). Team bileşenleri (page, MemberList, MemberRow, PendingInvitations, InviteMemberModal, PermissionMatrix) `useTranslations`'a taşındı.
- [ ] Backend `lang/` davet e-posta metinleri (opsiyonel çok dilli — atlandı)
- [ ] (Not) İzin `label`'ları backend `config/permissions.php`'den geliyor (TR); tam çoklu dil isterse backend tarafı gerekir.

### 🧪 K. Playwright E2E Testleri — `e2e/team.spec.ts` ✅ 5/5 GEÇİYOR
- [x] Owner staff davet eder → bekleyen davet listesinde görünür
- [x] Davet kabul (accept_url token ile) → şifre oluştur → dashboard'a ulaşır
- [x] `inventory.view_price` olmayan staff fiyat sütunlarını **görmez** (+ `team.manage` yok → "Ekip" menüsü yok)
- [x] Owner staff'ı pasifleştirir → staff girişi 401 ile engellenir + "devre dışı" mesajı
- [x] Son owner korunur (owner satırında Sil/Pasifleştir aksiyonu yok)
- [x] Geçersiz token → "Geçersiz Davet" hata durumu
- [ ] Manager `team.manage` veremez (403) & süresi dolmuş token → backend Feature testine bırakıldı (UI'da manager fixture/DB-expiry gerektirir); F bloğu zaten sunucuda zorluyor
- [x] Test tohumu (seam): davet POST yanıtı local/testing'de `accept_url` döndürüyor (Playwright token'ı buradan alıyor)
- [x] Responsive: davet/team ekranları mobil+masaüstü render (auth layout responsive)
- **Yol boyunca bulunan 2 gerçek bug düzeltildi:**
  - Tarayıcı SPA login CSRF: sayfa `localhost:3000` iken API `127.0.0.1:8001` farklı host → XSRF cookie okunamıyor → 419. `frontend/.env.local` `NEXT_PUBLIC_API_URL` `localhost:8001` yapıldı (SANCTUM/CORS/FRONTEND_URL zaten localhost).
  - `lib/api.ts` 401 interceptor'ı locale önekini yok sayıyordu (`/tr/login` → `/login` başlamıyor) → login 401'inde sayfayı reload edip hata mesajını bastırıyordu. Locale-aware düzeltildi.

### 📋 Aşama 7 — Özet Tablo
| Kategori | Görev Sayısı | Durum |
|----------|-------------|-------|
| A. İzin Taksonomisi & Preset | 4 | ✅ Tamamlandı |
| B. Veritabanı Şeması | 3 | ✅ Tamamlandı |
| C. Model & Yetki Mantığı | 2 | ✅ Tamamlandı |
| D. Yetkilendirme Zorlaması | 6 | ✅ Tamamlandı |
| E. Davet & Şifre Akışı (API) | 6 | ✅ Tamamlandı |
| F. Güvenlik & Sınır Durumları | 8 | ✅ Tamamlandı (test kanıtı K'de) |
| G. Alan Düzeyi Fiyat Gizleme | 4 | ✅ 3/4 (CRM portföy takip) |
| H. Frontend Ekip UI | 8 | ✅ Tamamlandı (tarayıcı testi K'de) |
| I. Davet Kabul Sayfası | 3 | ✅ Tamamlandı |
| J. i18n | 2 | ✅ Team+Invite namespace (backend lang opsiyonel atlandı) |
| K. Playwright E2E | 3 | ✅ 5/5 test geçiyor (manager-subset & expired → backend Feature) |
| **TOPLAM** | **49** | **✅ Aşama 7 tamam · E2E yeşil · 2 gerçek bug fix** |

---

## 🔍 TAM SİSTEM İNCELEMESİ (2026-07-02) — İnceleme ✅ / Düzeltmeler 🔄

### İnceleme (tamamlandı)
- [x] Canlı UI/UX tasarım incelemesi (design-review ajanı — tüm sayfalar, Nielsen 22/40)
- [x] Frontend kod kalitesi incelemesi (react-patterns/simplify — 13 ana bulgu)
- [x] Backend güvenlik/doğruluk incelemesi (2 PR bloker + iyileştirmeler)
- [x] Deterministik AI-slop taraması (`npx impeccable` — 7 bulgu)
- [x] PRODUCT.md yazıldı (impeccable context); CLAUDE.md API URL düzeltildi

### Backend düzeltmeleri (tamamlandı, test edildi)
- [x] toggleSync cross-tenant açığı (watch dealer sahiplik kontrolü)
- [x] bulk publish cache anahtarı dealer-scoped
- [x] assertGrantableBy: null-permissions → rol preset'i subset kontrolü (privilege escalation)
- [x] updateMemberRole: self-check + grantable + owner-guard; disable/destroy owner-guard
- [x] EnsureUserIsActive global middleware (disabled → tüm API 403)
- [x] EbayIntegrationTest role=owner düzeltmesi
- [x] backend/testing git izleminden çıkarıldı + .gitignore

### Frontend düzeltmeleri (detay: activecontext.md "Son Oturum · 2026-07-04")
- [x] P0: team sonsuz fetch döngüsü (usePermission memoize) · OnboardingTour data-tour (4 hedef) · tr.json 10 anahtar · invoice line_items başlığı
- [x] P1: CRM Almanca stringler → i18n (page + alt bileşenler, ~70 anahtar) · ConfirmModal (confirmStore + ConfirmDialog; window.confirm değişimi + onaysız silmelere onay) · CRM gradient anti-pattern'leri (avatar/AiInsights/stats → accent-blue) · ölü kod (WatchFormModal, Can.tsx, teamApi metodları) · AuthGuard/api.ts locale bug
- [x] P2: objectURL leak · BulkActions/ActivityFeed cleanup · Zustand selector'lar · çift fetchPlatforms · mobil (BottomNav CRM+Invoices, 44px hedefler) · gradient-text/bounce easing/amber buton/sidebar sol şerit · invite sayfası memo+MobileLogo · kalan i18n string'leri (Common/TopBar/Sidebar/CRM 10 anahtar × 3 dil). (Market Scanner hiyerarşi/P2.14 opsiyonel — ertelendi)
- [x] Doğrulama (P0+P1): tsc temiz · vitest (AuthGuard geçti; 3 baseline-kırık dosya dokunulmadı) · e2e/team.spec **5/5** · Playwright görsel smoke (ConfirmDialog/CRM i18n/tour/locale-redirect/renkler)
- [x] P2 doğrulama: tsc temiz · vitest baseline'a döndü (AuthGuard testi NextIntlClientProvider ile sarılıp düzeltildi; 3 baseline-kırık dosya dokunulmadı) · e2e/team.spec **5/5** · i18n parite 857/857/857 → `feature/team-management` → develop **PR açıldı**
- [x] `feature/team-management` → develop PR #1 **merge edildi** (+ eBay güvenlik PR #2 merge → Aşama 7 tümüyle develop'ta)

---

## 🔒 Güvenlik Turu + 🎨 UI/UX Pro Max Turu (2026-07-04 · devam 4) — `feature/security-ui-polish` → PR #3

### Güvenlik/kod turu (security-audit) — commit d724d38
- [x] F1 Webhook prod fail-closed (eBay/Shopify token boşsa production'da reddet; cross-tenant stok kilidi açığı kapandı)
- [x] F2 Davet kabul TOCTOU kilidi (lockForUpdate; çift kabul 500→404)
- [x] F3 Şifre politikası (min 8 + büyük/küçük + rakam; back+front+i18n) · backend suite 132 passed

### UI/UX pro max turu (design-review ajanı 7-aşama + impeccable) — commit 4b497b8
- [x] P0: 3 tanımsız token bug'ı (accent-primary/surface-base/hover:border-default) · mobil sidebar blocker (ayrı mobileOpen state) · CRM tab focus baskılaması (WCAG)
- [x] P1: alert()→toast · auth İngilizce hero→i18n · CRM neon-glow/purple kümesi→sessiz lüks · market-scanner alarm tonu · dashboard KPI skeleton
- [x] Doğrulama: tsc 0 kaynak hatası · i18n 861/861/861 · e2e/team 5/5 · Playwright görsel teyit
### Ertelenen UI/a11y maddeleri (2026-07-04 · devam 5) — `feature/security-ui-polish`
- [x] Settings mobil tab etiketleri görünür + `role=tablist/tab/tabpanel` + `aria-selected`
- [x] İzin matrisi grup "Tümünü seç / Temizle" (grantable/disabled'a saygılı, gruplar bağımsız)
- [x] İzin preset-farkı göstergesi + "Varsayılana dön" (InviteMemberModal)
- [x] Invoice vade `type="date"` (zaten mevcuttu — teyit edildi)
- [x] ConfirmDialog odak geri-verme (aç→onay butonu, kapan→tetikleyen öğe)
- [x] Envanter satır `aria-label` + ikon aksiyon butonuna erişilebilir ad + 44px hedef
- [x] BULUNAN+DÜZELTİLEN bug: davet modalı preset useEffect'i arka plan refetch'te seçimi siliyordu → `[role]`'e bağlandı
- [x] Yeni `frontend/e2e/ui-polish.spec.ts` **5/5** · tsc 0 kaynak hatası · i18n 866/866/866 · e2e/team 5/5 (regresyon yok)
- [x] Dokunulmadı (gerekçeli): landing "Demo İzle" zaten `#features` anchor · CRM tab zaten flex-1/sabit font (kayma yok) · invite modal zaten native `<select>`
- [ ] **Backlog:** F4 CSP nonce · admin side-stripe (ayrı sistem) · demo DB davet kalıntıları temizliği
- [ ] PR #3 → develop merge/inceleme

---

## ✅ KALAN KOD İŞİ — OTURUM A ✅ TAMAM (2026-07-05) — "local kusursuz"
> Çekirdek ürün kodu bitti (TODO/stub yok). Kalan test temizliği + 1 sertleştirme + 1 kozmetik. Sıra K1→K2→K3→K4 uygulandı.
- [x] **K1** Frontend kırık testler (3 dosya/12 test) — `setup.tsx`'e `next-intl` mock'u (`useTranslations`→gerçek `tr.json` via `createTranslator`) + `next/dynamic` displayName + `inventoryStore.test.ts` cast → **vitest 63/63, tsc 0**
- [x] **K2** Backend kırık testler (4) + 1 flaky — GERÇEK BUG: `InvoiceController::index` `?status=` yok sayıyordu → filtre eklendi · Invoice payload fix · Auth stateful (`Referer`+`token` assertion kaldır) + `phpunit.xml SANCTUM_STATEFUL_DOMAINS` · CustomerCrud Faker flakiness fix → **136 passed, 0 failed**
- [x] **K3** Admin sidebar side-stripe — `AdminSidebar` `border-l-2` → absolute stripe (ana Sidebar pattern'i), hizalı + tutarlı
- [x] **K4** F4 CSP nonce — statik CSP `next.config.ts`'ten kaldırıldı → `middleware.ts` per-request nonce; `script-src` `unsafe-inline`→`nonce + strict-dynamic`. Kanıt: teşhis spec **CSP_VIOLATION_COUNT=0**, 35 script nonce'lu, team+ui-polish 5/5. ⚠ nonce = tüm sayfalar dynamic render
- [x] Doğrulama: vitest 63/63 · backend 136 passed · e2e team 5/5 + ui-polish 5/5 (izole/warm) · tsc 0 → watch-kaydet

## 🚀 Canlıya Alma — OTURUM B (kullanıcı isteğine göre) — doğrulanmış envanter
- [x] Tarama yapıldı: backend'de stub/TODO **yok** (API'ler gerçek), 34 migration, CI `ci.yml` var
- [ ] eBay/Shopify/Gemini gerçek API anahtarları + sandbox uçtan-uca test
- [ ] SAM2 model checkpoint indir + AI enhance uçtan-uca doğrula
- [ ] Prod env: `APP_DEBUG=false`/`APP_ENV=production`, gerçek mail, persistent+şifreli Redis, prod DB+yedek, gerçek domain'e Sanctum/CORS/`NEXT_PUBLIC_API_URL`
- [x] Deploy tooling (2026-07-05, `feature/deployment-tooling`): backend `Dockerfile` (3 target: vendor/app-fpm/web-nginx) + `frontend/Dockerfile` (Next standalone) + kök `docker-compose.prod.yml` (backend/horizon/scheduler/nginx/frontend/ai-service/mysql/redis/caddy) + `.env.prod.example` + `docker/caddy/Caddyfile` + CI `docker-build` job (+yorumlu deploy şablonu) + `DEPLOYMENT.docker.md`. `next.config.ts`→`output:standalone`. ⚠ `docker compose config` geçti ama gerçek imaj build'i HENÜZ yapılmadı. NOT: `DEPLOYMENT.md` (Non-Docker) zaten vardı, dokunulmadı.
  - [ ] Lokalde `docker compose build` ile Dockerfile'ları gerçekten doğrula (Oturum B devam)
