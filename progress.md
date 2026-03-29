# WatchSync AI — İlerleme Takip Belgesi (Progress Tracker)

> **Versiyon:** 1.0  
> **Tarih:** 2026-03-26  
> **Güncelleme Sıklığı:** Her sprint sonunda (haftalık)

---

## FAZ 1 — TEMELLERİN ATILMASI (Hafta 1-4)

### 🏗 Hafta 1: Proje Altyapısı & Geliştirme Ortamı

#### Senior (S) — Backend Altyapısı
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

#### Junior (J) — Frontend Altyapısı
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

#### Senior (S) — API & Auth
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

#### Junior (J) — Dashboard UI
- [ ] KPI Kartları bileşeni
  - [ ] Total Inventory Value kartı
  - [ ] Sold This Month kartı
  - [ ] Pending Syncs kartı
  - [ ] Sync Success Rate kartı
- [ ] Login sayfası
  - [ ] Form yapısı (React Hook Form + Zod)
  - [ ] API bağlantısı
  - [ ] Hata gösterimi
- [ ] Register sayfası
- [ ] Dashboard → API bağlantısı (`GET /api/dashboard/stats`)
- [ ] Auth store (Zustand) kurulumu

---

### 📦 Hafta 3: Envanter CRUD & Tablo UI

#### Senior (S) — Watch CRUD API
- [ ] `GET /api/watches` — sayfalama + filtreleme + sıralama
- [ ] `POST /api/watches` — yeni saat ekleme
- [ ] `GET /api/watches/{id}` — saat detayı
- [ ] `PUT /api/watches/{id}` — saat güncelleme
- [ ] `DELETE /api/watches/{id}` — saat silme
- [ ] `POST /api/watches/{id}/images` — görsel yükleme
- [ ] `DELETE /api/watches/{id}/images/{imageId}` — görsel silme
- [ ] S3/MinIO entegrasyonu — görsel depolama
- [ ] Thumbnail oluşturma (intervention/image)
- [ ] Envanter durum makinesi (State Machine)
  - [ ] `draft → active → reserved → sold` geçişleri
  - [ ] `active → maintenance` geçişi
  - [ ] Durum geçiş kuralları ve validasyonu

#### Junior (J) — Envanter UI
- [ ] Envanter Tablosu bileşeni
  - [ ] Sütunlar: Thumbnail, Marka/Model, Ref No, Durum, Maliyet, Pazar Fiyatı
  - [ ] Platform toggle switch'leri (eBay, Chrono24, Shopify)
  - [ ] Satır seçimi (checkbox)
  - [ ] Sıralama (sort) fonksiyonu
  - [ ] Sayfalama bileşeni
- [ ] Saat Ekleme/Düzenleme Formu
  - [ ] Adım 1: Marka & Model seçimi
  - [ ] Adım 2: Detaylar (referans no, yıl, durum, kasa malzemesi vs.)
  - [ ] Adım 3: Fiyatlandırma (maliyet, satış fiyatı)
  - [ ] Adım 4: Görseller (sürükle-bırak yükleme)
  - [ ] Zod validasyon şeması
- [ ] Optimistic update mekanizması
- [ ] Boş durum (empty state) bileşeni
- [ ] Loading skeleton'lar

---

### 🔒 Hafta 4: Redis Lock & Kuyruk Mimarisi

#### Senior (S) — Kilit & Kuyruk
- [ ] Redis Mutex implementasyonu
  - [ ] `Redis::lock('inventory_update_'.$sku, 10)->block(5)`
  - [ ] Kilit edinme başarısız → LockTimeoutException handling
  - [ ] Redlock algoritması değerlendirmesi
- [ ] RabbitMQ Job yapısı
  - [ ] `SyncInventoryJob` — platform stoku güncelleme
  - [ ] `UpdatePlatformStockJob` — belirli platform stok 0'lama
  - [ ] `ProcessWebhookJob` — gelen webhook işleme
  - [ ] Retry mekanizması (max 3 deneme, exponential backoff)
  - [ ] Dead-letter queue yapılandırması
- [ ] Entegrasyon testi: eşzamanlı sipariş simülasyonu
  - [ ] 10 eşzamanlı istek → yalnızca 1 başarılı
  - [ ] Diğer 9'un doğru hata kodu alması

#### Junior (J) — Gerçek Zamanlı UI
- [ ] Aktivite Feed tablosu (Dashboard)
  - [ ] WebSocket/Pusher bağlantısı
  - [ ] `SyncStatusUpdated` event dinleme
  - [ ] Gerçek zamanlı satır ekleme animasyonu
- [ ] Market Scanner sayfa iskeleti
  - [ ] Fiyat trendi grafik alanı (placeholder)
  - [ ] Rakip fiyat tablosu (placeholder)
- [ ] UI Polish
  - [ ] Loading skeleton bileşenleri (tablo, kart, form)
  - [ ] Error boundary bileşeni
  - [ ] Toast notification bileşeni

---

## FAZ 2 — ENTEGRASYONLAR & YAPAY ZEKA (Hafta 5-8)

### 🔗 Hafta 5: Chrono24 & eBay Bağlantıları

#### Senior (S) — API Entegrasyonları
- [ ] Chrono24 XML Feed
  - [ ] `GET /api/feeds/chrono24.xml` endpoint'i
  - [ ] Zorunlu XML düğümleri: `<article_id>`, `<price>`, `<Manufacturer>`, `<Model name>`, `<Production year>`, `<Condition>`, `<Scope of delivery>`, `<Case material>`, `<Bracelet/strap material>`, `<Dial color>`, `<Winding mechanism>`, `<Description>`, `<Photos>`
  - [ ] IP Whitelist middleware
  - [ ] XML şema validasyonu
- [ ] eBay OAuth 2.0
  - [ ] Authorization Code Grant akışı
  - [ ] Callback handler (`/api/ebay/callback`)
  - [ ] Access Token & Refresh Token depolama
  - [ ] Token yenileme cron job'u
  - [ ] eBay Sandbox test ortamı yapılandırması
- [ ] eBay Taxonomy API
  - [ ] `getItemAspectsForCategory(281)` entegrasyonu
  - [ ] Zorunlu alan eşleştirme motoru
  - [ ] Authenticity Guarantee uyumluluk kontrolleri

#### Junior (J) — Platform Ayarları UI
- [ ] Platform Ayarları sayfası
  - [ ] eBay bağlantı kartı ("Bağlan" butonu + durum göstergesi)
  - [ ] Chrono24 bağlantı kartı (durum göstergesi, IP bilgisi)
  - [ ] Shopify bağlantı kartı
  - [ ] API anahtarı giriş formları
- [ ] eBay OAuth UI akışı
  - [ ] "eBay'e Bağlan" butonu → OAuth popup
  - [ ] Callback başarı/hata geri bildirimi
  - [ ] Bağlantı durumu göstergesi (yeşil/kırmızı dot)
- [ ] Platform toggle fonksiyonelliği (envanter tablosunda)
  - [ ] Toggle → API çağrısı → senkronizasyon tetikleme
  - [ ] Toggle durumu güncelleme (optimistic)

---

### 🛒 Hafta 6: eBay Listeleme & Shopify

#### Senior (S) — Listeleme Motor'ları
- [ ] eBay Inventory API entegrasyonu
  - [ ] `createOrReplaceInventoryItem` — ürün oluşturma
  - [ ] `createOffer` — teklif oluşturma
  - [ ] `publishOffer` — yayınlama
  - [ ] Authenticity Guarantee zorunlu alan eşleştirmesi
  - [ ] Hata yönetimi ve retry mantığı
- [ ] Shopify Admin API (GraphQL)
  - [ ] `productCreate` mutation
  - [ ] `productUpdate` mutation
  - [ ] `inventoryAdjustQuantities` mutation
  - [ ] Webhook abonelikleri (sipariş, stok)
- [ ] Webhook dinleyicileri
  - [ ] eBay sipariş bildirimi → stok kilitleme
  - [ ] Shopify sipariş bildirimi → stok kilitleme
  - [ ] Webhook imza doğrulaması

#### Junior (J) — Senkronizasyon UI
- [ ] Senkronizasyon durum göstergeleri
  - [ ] `Synced ✓` (yeşil badge)
  - [ ] `Pending ⏳` (turuncu badge)
  - [ ] `Error ✗` (kırmızı badge + hata detayı tooltip)
- [ ] Toplu İşlem (Bulk Actions) UI
  - [ ] Çoklu saat seçimi
  - [ ] "Hepsini eBay'e Yayınla" aksiyonu
  - [ ] "Hepsini Chrono24'e Yayınla" aksiyonu
  - [ ] İlerleme çubuğu (progress bar) gösterimi
- [ ] Bildirim sistemi
  - [ ] Toast notification bileşeni (başarı, hata, uyarı, bilgi)
  - [ ] Bildirim çekmecesi (notification drawer)
  - [ ] Okunmamış bildirim sayacı (TopBar badge)

---

### 🤖 Hafta 7: AI Görsel İşleme Mikroservisi

#### Senior (S) — Python/FastAPI AI Servisi
- [ ] FastAPI proje yapısı kurulumu
- [ ] SAM 2 model entegrasyonu
  - [ ] Model indirme ve yükleme
  - [ ] `POST /api/ai/segment` — saat maskeleme endpoint'i
  - [ ] Maske kalitesi parametreleri
- [ ] Matting pipeline
  - [ ] SAM 2 kaba maske → alpha matting iyileştirmesi
  - [ ] Color decontamination (renk sızıntısı temizleme)
  - [ ] RGBA katman çıktısı
- [ ] Arka plan değiştirme servisi
  - [ ] `POST /api/ai/replace-background`
  - [ ] Önceden tanımlı arka planlar (beyaz stüdyo, siyah kadife, mermer)
  - [ ] Özel arka plan yükleme desteği
  - [ ] Gölge sentezi (shadow synthesis)
- [ ] Laravel → FastAPI iletişim katmanı
  - [ ] HTTP istemci servisi
  - [ ] Asenkron job entegrasyonu

#### Junior (J) — AI Studio UI
- [ ] AI Studio sayfası — Split layout
  - [ ] Sol panel: yüksek çözünürlüklü görsel önizleme
  - [ ] Sağ panel: saat bilgi formu + AI araçları
- [ ] "AI Enhance (Preserve Original)" butonu
  - [ ] Görsel seçimi → FastAPI'ye gönderim
  - [ ] İşlem süreci göstergesi (progress/spinner)
  - [ ] Önce/Sonra karşılaştırma (slider) bileşeni
- [ ] Arka plan seçici
  - [ ] Küçük resim galerisi (preset arka planlar)
  - [ ] Özel arka plan yükleme
  - [ ] Seçili arka planla önizleme
- [ ] İşlenmiş görseli kaydetme akışı

---

### 📝 Hafta 8: AI Metin Motoru & Pazar Tarayıcı

#### Senior (S) — NLP & Scraping
- [ ] LLM entegrasyonu
  - [ ] Llama-3 / OpenAI API bağlantısı
  - [ ] Saat referans numarasından bağlam oluşturma (calibre, bezel tipi vs.)
  - [ ] SEO uyumlu ilan açıklaması üretme prompt mühendisliği
  - [ ] `POST /api/ai/generate-description` endpoint'i
  - [ ] Çok dilli destek (EN, DE, TR)
- [ ] Web scraping servisi
  - [ ] Chrono24 fiyat çekme (Playwright)
  - [ ] Watchfinder fiyat çekme
  - [ ] Veri normalleştirme pipeline
  - [ ] `GET /api/market/prices/{ref}` endpoint'i
  - [ ] Fiyat geçmişi depolama (time-series)
- [ ] Fine-tuning hazırlığı
  - [ ] Saat katalog verilerinden eğitim seti oluşturma
  - [ ] Veri temizleme ve formatlandırma scripti

#### Junior (J) — Scanner & Metin UI
- [ ] AI Açıklama Üretimi UI
  - [ ] "Generate" butonu
  - [ ] Streaming metin gösterimi (karakter karakter)
  - [ ] Düzenlenebilir metin alanı
  - [ ] "Yeniden Üret" / "Kopyala" aksiyonları
  - [ ] Dil seçimi dropdown
- [ ] Market Scanner veri bağlama
  - [ ] Fiyat trendi grafiği (Recharts) — gerçek veri
  - [ ] Zaman aralığı seçici (7g, 30g, 90g, 1y)
  - [ ] Rakip fiyat karşılaştırma tablosu
  - [ ] Arbitraj fırsatı vurgulama (kârlı fırsatlar yeşil)
- [ ] Fiyat uyarı sistemi UI
  - [ ] "Bu referans X€'nun altına düştüğünde bildir" form
  - [ ] Aktif uyarılar listesi
  - [ ] Uyarı düzenleme / silme

---

## FAZ 3 — CİLALAMA, TEST & LANSMAN (Hafta 9-12)

### 👥 Hafta 9: CRM & Finans

#### Senior (S) — CRM & Fatura API
- [ ] CRM API
  - [ ] `customers` tablosu migration
  - [ ] `GET/POST/PUT/DELETE /api/customers` CRUD
  - [ ] Satın alma geçmişi ilişkilendirmesi
  - [ ] Notlar ve etiketleme sistemi
  - [ ] Müşteri arama ve filtreleme
- [ ] Fatura motoru
  - [ ] `invoices` tablosu migration
  - [ ] PDF fatura oluşturma (DomPDF/Snappy)
  - [ ] Yasal uyumluluk: KDV hesaplama, fatura numarası sıralaması
  - [ ] `GET /api/invoices/{id}/pdf` — PDF indirme
  - [ ] Otomatik fatura e-posta gönderimi
- [ ] E-posta bildirimleri
  - [ ] Sipariş onayı e-postası
  - [ ] Fatura gönderim e-postası
  - [ ] Stok uyarı e-postası
  - [ ] Laravel Notification + Mail yapılandırması

#### Junior (J) — CRM & Fatura UI
- [ ] CRM sayfası
  - [ ] Müşteri listesi tablosu (arama, filtreleme)
  - [ ] Müşteri detay sayfası
  - [ ] İletişim geçmişi zaman çizelgesi
  - [ ] Not ekleme formu
  - [ ] Etiket yönetimi
- [ ] Fatura sayfası
  - [ ] Fatura listesi tablosu
  - [ ] Fatura önizleme modal'ı
  - [ ] PDF indirme butonu
  - [ ] "Yeni Fatura Oluştur" formu
- [ ] Ayarlar sayfası
  - [ ] Profil düzenleme formu
  - [ ] Bildirim tercihleri toggle'ları
  - [ ] API anahtarları yönetimi sayfası
  - [ ] Şirket bilgileri (fatura için)

---

### 🔐 Hafta 10: Performans & Güvenlik

#### Senior (S) — Güvenlik & Backend Performans
- [ ] Güvenlik taraması
  - [ ] Rate limiting yapılandırması (API endpoint'leri)
  - [ ] Input sanitization gözden geçirme
  - [ ] SQL injection koruması kontrolü
  - [ ] XSS koruması kontrolü
  - [ ] CORS yapılandırması
  - [ ] CSP (Content Security Policy) header'ları
- [ ] İzleme (Monitoring) altyapısı
  - [ ] Laravel Telescope kurulumu
  - [ ] Laravel Horizon kurulumu (kuyruk izleme)
  - [ ] Yavaş sorgu tespiti ve indeksleme optimizasyonu
  - [ ] Hata takibi (Sentry entegrasyonu)
- [ ] Yük testi
  - [ ] k6/Artillery ile 100 eşzamanlı kullanıcı simülasyonu
  - [ ] Darboğaz tespiti ve iyileştirme
  - [ ] Veritabanı sorgu optimizasyonu (N+1 sorgu kontrolü)

#### Junior (J) — Frontend Performans & UX
- [ ] Lighthouse performans optimizasyonu
  - [ ] Lazy loading (route bazlı code splitting)
  - [ ] Image optimization (next/image)
  - [ ] Bundle boyutu analizi ve azaltma
  - [ ] Critical CSS extraction
- [ ] Erişilebilirlik (a11y) denetimi
  - [ ] ARIA label'lar → tüm interaktif elemanlar
  - [ ] Klavye navigasyonu → tüm sayfalar
  - [ ] Renk kontrast kontrolü (WCAG AA)
  - [ ] Screen reader uyumluluğu
- [ ] Responsive tasarım denetimi
  - [ ] 320px (mobil küçük)
  - [ ] 768px (tablet)
  - [ ] 1024px (masaüstü)
  - [ ] 1440px+ (geniş ekran)

---

### 🧪 Hafta 11: Uçtan Uca Test & Hata Giderme

#### Senior (S) — Backend Testleri
- [ ] PHPUnit/Pest test suite
  - [ ] Auth endpoint testleri
  - [ ] Watch CRUD testleri
  - [ ] Envanter durum geçiş testleri
  - [ ] Redis Lock eşzamanlılık testleri
  - [ ] Chrono24 XML Feed format testleri
  - [ ] eBay API entegrasyon testleri (mock)
  - [ ] Shopify API entegrasyon testleri (mock)
  - [ ] Webhook işleme testleri
  - [ ] Fatura oluşturma testleri
- [ ] AI Servis testleri
  - [ ] SAM 2 maskeleme doğruluk testleri
  - [ ] LLM açıklama üretim testleri
  - [ ] Scraping pipeline testleri
- [ ] Bug bash — kritik hataların giderilmesi

#### Junior (J) — Frontend Testleri & Polish
- [ ] E2E test suite (Cypress/Playwright)
  - [ ] Kullanıcı giriş akışı
  - [ ] Saat ekleme akışı (form → kaydet → listede göster)
  - [ ] Platform yayınlama akışı (toggle → senkronizasyon)
  - [ ] AI görsel işleme akışı
  - [ ] AI metin üretme akışı
  - [ ] CRM müşteri ekleme akışı
  - [ ] Fatura oluşturma ve indirme akışı
- [ ] UI/UX son dokunuşlar
  - [ ] Mikro-animasyonlar (buton tıklama, kart geçişleri)
  - [ ] Transition animasyonlar (sayfa geçişleri)
  - [ ] Empty state illüstrasyonları
  - [ ] Onboarding turu (ilk kullanım yönlendirmesi)

---

### 🚀 Hafta 12: Staging & Lansman

#### Senior (S) — DevOps & Canlıya Alınma
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
  - [ ] Yedekleme (backup) stratejisi
  - [ ] Log yönetimi (log rotation, centralized logging)
- [ ] **🚀 GO-LIVE**

#### Junior (J) — Dokümantasyon & Landing
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
