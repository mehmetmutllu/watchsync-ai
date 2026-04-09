# WatchSync AI — İlerleme Takip Belgesi (Progress Tracker)

> **Versiyon:** 2.0  
> **Tarih:** 2026-04-09  
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
- [ ] `Content-Security-Policy` header (production domain belirlendikten sonra)
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
| OpenAI API Key | ⬜ Açılmalı | GPT-4o / GPT-4o-mini için. ~$10-20 kredi yeterli | https://platform.openai.com |
| VEYA Groq API Key | ⬜ Alternatif | Llama-3 çalıştırmak için (ücretsiz tier mevcut) | https://console.groq.com |
| Playwright | ⬜ Kur | Web scraping için headless browser | `pip install playwright && playwright install` |

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
  - [x] Webhook imza doğrulaması

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
  - [x] OpenAI API bağlantısı (`LlmService.php` — gpt-4o-mini)
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
  - [ ] eBay API entegrasyon testleri (mock)
  - [ ] Shopify API entegrasyon testleri (mock)
  - [x] Webhook işleme testleri (`WebhookTest.php` — 4 test)
  - [x] Fatura oluşturma testleri (`InvoiceTest.php` — 12 test)
  - [x] Dashboard endpoint testleri (`DashboardTest.php` — 7 test)
  - [x] Settings endpoint testleri (`SettingsTest.php` — 7 test)
  - [x] Health check testleri (`HealthCheckTest.php` — 5 test)
  - [x] Customer CRUD testleri (`CustomerCrudTest.php` — 12 test)
- [ ] AI Servis testleri
  - [ ] SAM 2 maskeleme doğruluk testleri
  - [ ] LLM açıklama üretim testleri
  - [ ] Scraping pipeline testleri
- [ ] Bug bash — kritik hataların giderilmesi

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
- [ ] UI/UX son dokunuşlar
  - [ ] Mikro-animasyonlar (buton tıklama, kart geçişleri)
  - [ ] Transition animasyonlar (sayfa geçişleri)
  - [ ] Empty state illüstrasyonları
  - [ ] Onboarding turu (ilk kullanım yönlendirmesi)

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

## 📈 Özet Metrikleri

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
