# WatchSync AI — Açılacak Hesaplar, API Anahtarları & Maliyet Tahmini

> **Son Güncelleme:** 2026-04-11  
> **Amaç:** Arkadaşın bu listeyi takip ederek hesapları açsın, biz kod tarafını hazırlayalım.  
> **Durum Açıklaması:** ✅ Hazır | 🔲 Açılmalı | ⏳ Başvuru yapıldı/bekleniyor | ❌ İptal

---

## 📊 ÖZET MALİYET TABLOSU

| Kategori | Aylık Maliyet | Tek Seferlik | Notlar |
|----------|:------------:|:------------:|--------|
| **Geliştirme (Dev)** | **~$0** | **~$0** | Ücretsiz tier'lar yeterli |
| **Production (Başlangıç)** | **~$10-15/ay** | **~$12-15** | eBay Browse API + JSON-LD (tamamen ücretsiz veri) |
| **Production (Büyüme)** | **~$120-350/ay** | **~$15-25** | Chrono24 Dealer + opsiyonel WatchCharts |

---

## 🆓 ÜCRETSİZ HESAPLAR (Hemen Açılabilir)

### 1. Google AI Studio — Gemini API Key
| | |
|---|---|
| **Ne için:** | AI metin üretimi (saat açıklamaları, SEO ilan metni) |
| **Durum:** | 🔲 Açılmalı |
| **Maliyet:** | Ücretsiz (15 req/dk, 1500 req/gün) |
| **Nasıl:** | https://aistudio.google.com → Sign in → Get API Key → Create |
| **Bize ver:** | `GEMINI_API_KEY=AIza...` |
| **Süre:** | 2 dakika |

### 2. eBay Developer Account
| | |
|---|---|
| **Ne için:** | eBay'de saat listeleme, stok senkronizasyonu **+ Market Scanner birincil veri kaynağı** |
| **Durum:** | 🔲 Açılmalı |
| **Maliyet:** | Ücretsiz (API kullanımı ücretsiz, eBay satış komisyonu ayrı) |
| **Nasıl:** | https://developer.ebay.com → Join → Create Application → "Production" ve "Sandbox" key'leri al |
| **Bize ver:** | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REDIRECT_URI` |
| **Süre:** | 5-10 dakika (onay 1-2 gün sürebilir) |
| **Not:** | Sandbox test hesabı da oluşturulmalı (Developer Portal → Sandbox → Test User) |
| **ÖNEMLİ:** | eBay Browse API (ücretsiz, resmi, sıfır ban riski) bu hesapla geliyor. Market Scanner'ın **birincil** fiyat kaynağı. 5000 çağrı/gün, category 281 = Wristwatches. Ekstra maliyet/hesap gerektirmez. |

### 3. eBay Sandbox Test User
| | |
|---|---|
| **Ne için:** | Gerçek para harcamadan test |
| **Durum:** | 🔲 Açılmalı |
| **Maliyet:** | Ücretsiz |
| **Nasıl:** | eBay Developer Portal → Sandbox → Create Test User (alıcı + satıcı) |
| **Bize ver:** | Test kullanıcı adı ve şifresi |
| **Süre:** | 2 dakika |

### 4. Shopify Partner Account
| | |
|---|---|
| **Ne için:** | Shopify mağazasında saat listeleme |
| **Durum:** | 🔲 Açılmalı |
| **Maliyet:** | Ücretsiz (Partner hesabı + Development Store) |
| **Nasıl:** | https://partners.shopify.com → Sign up → Stores → Create development store → Settings → Apps → Develop apps → Create an app |
| **Bize ver:** | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SHOP_DOMAIN` (xxx.myshopify.com) |
| **Süre:** | 10-15 dakika |
| **Not:** | Admin API scopes gerekli: `write_products`, `read_products`, `write_inventory`, `read_inventory`, `read_orders` |

### 5. Sentry Account (Hata Takibi)
| | |
|---|---|
| **Ne için:** | Production'da hata yakalama (Laravel + Next.js) |
| **Durum:** | 🔲 Açılmalı |
| **Maliyet:** | Ücretsiz (Developer tier — 5K event/ay) |
| **Nasıl:** | https://sentry.io → Sign up → Create Project (Laravel) → Create Project (Next.js) |
| **Bize ver:** | `SENTRY_LARAVEL_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| **Süre:** | 5 dakika |

### 6. Mailtrap (Test E-posta)
| | |
|---|---|
| **Ne için:** | Geliştirme ortamında e-posta test etme (fatura gönderimi, bildirimler) |
| **Durum:** | 🔲 Açılmalı |
| **Maliyet:** | Ücretsiz (100 email/ay test) |
| **Nasıl:** | https://mailtrap.io → Sign up → Email Testing → SMTP Settings |
| **Bize ver:** | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` |
| **Süre:** | 3 dakika |

### 7. Plausible / Google Analytics
| | |
|---|---|
| **Ne için:** | Kullanıcı analitiğ (sayfa görüntüleme, kullanıcı davranışı) |
| **Durum:** | 🔲 Açılmalı (production'a yakın) |
| **Maliyet:** | Google Analytics ücretsiz / Plausible $9/ay |
| **Nasıl:** | GA: https://analytics.google.com / Plausible: https://plausible.io |
| **Bize ver:** | GA tracking ID veya Plausible site ID |
| **Süre:** | 5 dakika |

---

## 💰 ÜCRETLİ HESAPLAR — Platform Entegrasyonları

### 8. Chrono24 Dealer Account
| | |
|---|---|
| **Ne için:** | Chrono24'te saat listeleme (XML Feed) + olası API erişimi |
| **Durum:** | 🔲 Başvurulmalı |
| **Maliyet:** | Aylık abonelik — **~€99-299/ay** (ilan sayısına göre değişir) |
| **Nasıl:** | https://www.chrono24.com/dealer → Dealer başvurusu yap |
| **Bize ver:** | Dealer ID, XML Feed URL onayı, varsa API credentials |
| **Süre:** | Başvuru 5 dk, onay **1-4 hafta** |
| **Not:** | Dealer hesabı olmadan XML Feed endpoint'imiz çalışır ama Chrono24 onu çekmez. Market Scanner için Chrono24 Partner API de bu hesapla gelebilir. |

---

## 💰 MARKET SCANNER VERİ KAYNAKLARI

> **STRATEJİ:** eBay Browse API = birincil (ücretsiz, sıfır risk). Chrono24 + Watchfinder JSON-LD = tamamlayıcı (ücretsiz, minimal risk). WatchCharts API = opsiyonel (ücretli, sadece tarihsel trend verisi lazımsa).
> **Playwright KALDIRILDI:** IP ban riski nedeniyle tüm headless browser scraping kodu kaldırıldı.

### 9. eBay Browse API ⭐ BİRİNCİL — ÜCRETSİZ
| | |
|---|---|
| **Ne için:** | Gerçek zamanlı saat pazar fiyatları (eBay ilanları) |
| **Durum:** | ✅ **KODLANDI** — eBay Developer hesabı açılınca otomatik devreye girer |
| **Maliyet:** | **Ücretsiz** (eBay Developer hesabı = yukarıdaki #2 ile aynı) |
| **Nasıl:** | Ek hesap gerekmez — #2'deki eBay Developer hesabı yeterli |
| **Bize ver:** | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` (zaten #2'de alınacak) |
| **API:** | `GET /buy/browse/v1/item_summary/search?q={ref}&category_ids=281` |
| **OAuth:** | client_credentials grant (app-level token, kullanıcı girişi gerektirmez) |
| **Rate limit:** | 5000 çağrı/gün (production'da yeterli) |
| **Döndürdüğü:** | Fiyat, para birimi, kondisyon, satıcı adı, feedback score, ilan URL, ülke/şehir |
| **Avantaj:** | Resmi API, sıfır ban riski, ücretsiz, aynı hesap listeleme için de kullanılıyor |
| **Dezavantaj:** | Sadece eBay ilanları (Chrono24/Watchfinder kapsamı yok) |

### 10. Chrono24 + Watchfinder JSON-LD — ÜCRETSİZ
| | |
|---|---|
| **Ne için:** | Chrono24 ve Watchfinder'dan tamamlayıcı fiyat verisi |
| **Durum:** | ✅ **KODLANDI** — ek hesap gerekmez, otomatik çalışır |
| **Maliyet:** | **Ücretsiz** |
| **Teknik:** | schema.org JSON-LD structured data okuma (arama motorlarının yaptığı gibi) |
| **Risk:** | Minimal — agrresif scraping yok, headless browser yok |
| **Dezavantaj:** | Siteler JSON-LD yapısını değiştirirse çalışmaz (kırılgan) |

### 11. WatchCharts API — ÖNERİLEN (Trend Analizi İçin)
| | |
|---|---|
| **Ne için:** | Tarihsel fiyat trendleri ("bu saat son 6 ayda %12 değer kazandı"), fair market value, çapraz platform pazar değeri |
| **Durum:** | ✅ **KODLANDI** — key geldiğinde otomatik devreye girer |
| **Maliyet:** | **~$49-199/ay** (API tier'a göre) |
| **Nasıl:** | https://watchcharts.com → API erişimi için contact/apply |
| **Bize ver:** | `WATCHCHARTS_API_KEY=wc_xxx` |
| **Avantaj:** | Tarihsel trend analizi, cross-platform data (Chrono24+eBay+özel bayiler), fair market value |
| **Neden gerekli:** | eBay + JSON-LD sadece **anlık fiyat** veriyor. "Bu saat değer kazanıyor mu kaybediyor mu?" sorusuna cevap vermek için WatchCharts **şart**. Kendi verimizle trend hesaplamak aylar sürer — WatchCharts anında yılların verisini veriyor. |
| **Kod durumu:** | ✅ **KODLANDI** — key varsa Laravel'den çağrılır, yoksa atlanır |

### ~~Playwright Scraping~~ — KALDIRILDI ❌
| | |
|---|---|
| **Neden kaldırıldı:** | IP ban riski — birinci önceliğimiz ban riskinden kaçınmak |
| **Alternatif:** | eBay Browse API (ücretsiz, resmi, sıfır risk) bunu tamamen karşılıyor |

---

## 💰 ÜCRETLİ HESAPLAR — Production Altyapı

### 12. VPS / Cloud Sunucu
| | |
|---|---|
| **Ne için:** | Uygulamanın çalışacağı sunucu (Laravel + MySQL + Redis + AI Service) |
| **Durum:** | 🔲 Seçilmeli (production'a yakın) |
| **Seçenekler:** | |
| | **Hetzner CX31** — 4 vCPU, 8GB RAM, 80GB SSD → **€8.49/ay** ⭐ En uygun |
| | **DigitalOcean Droplet** — 4 vCPU, 8GB RAM → **$48/ay** |
| | **AWS EC2 t3.large** — 2 vCPU, 8GB RAM → **~$60/ay** |
| **Öneri:** | Hetzner (Avrupa lokasyon, ucuz, performanslı). GPU lazımsa Hetzner GPU €45/ay |
| **Not:** | Docker Compose ile deploy edeceğiz, minimum 4GB RAM gerekli |

### 13. Domain Name
| | |
|---|---|
| **Ne için:** | watchsync.ai veya benzeri domain |
| **Durum:** | 🔲 Satın alınmalı |
| **Maliyet:** | **~$10-15/yıl** (.com) veya **~$20-70/yıl** (.ai) |
| **Nasıl:** | https://www.cloudflare.com/products/registrar/ veya https://www.namecheap.com |
| **Bize ver:** | Domain adı + Cloudflare nameserver ayarı |

### 14. E-posta Gönderim Servisi (Production)
| | |
|---|---|
| **Ne için:** | Gerçek e-posta gönderimi (fatura, bildirimler, şifre sıfırlama) |
| **Durum:** | 🔲 Seçilmeli (production'a yakın) |
| **Seçenekler:** | |
| | **Mailgun** — 1000 email/ay ücretsiz, sonra $0.80/1000 → **~$0-5/ay** |
| | **Amazon SES** — $0.10/1000 email → **~$1-3/ay** |
| | **Resend** — 3000 email/ay ücretsiz → **$0/ay** (başlangıç için ideal) ⭐ |
| **Öneri:** | Resend (ücretsiz başlangıç, kolay kurulum) |

### 15. Cloudflare R2 (Dosya Depolama)
| | |
|---|---|
| **Ne için:** | Saat fotoğrafları, AI işlenmiş görseller, fatura PDF'leri |
| **Durum:** | 🔲 Açılmalı (production'a yakın) |
| **Maliyet:** | **10GB ücretsiz**, sonra $0.015/GB/ay → pratikte **~$0-2/ay** |
| **Nasıl:** | https://dash.cloudflare.com → R2 → Create bucket |
| **Bize ver:** | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` |
| **Avantaj:** | S3 uyumlu (Laravel'in S3 driver'ı ile direkt çalışır), egress ücretsiz |

---

## 📋 ÖNCELİK SIRASI (Arkadaşın İçin)

### 🔴 Hemen Açılmalı (Geliştirme İçin)
| # | Hesap | Maliyet | Süre |
|---|-------|---------|------|
| 1 | Google AI Studio (Gemini Key) | Ücretsiz | 2 dk |
| 2 | Mailtrap (test e-posta) | Ücretsiz | 3 dk |
| 3 | eBay Developer Account | Ücretsiz | 10 dk + 1-2 gün onay |
| 4 | Shopify Partner Account | Ücretsiz | 15 dk |

### 🟡 Yakın Zamanda Açılmalı (Entegrasyonlar İçin)
| # | Hesap | Maliyet | Süre |
|---|-------|---------|------|
| 5 | Chrono24 Dealer Başvurusu | €99-299/ay | 5 dk başvuru + 1-4 hafta onay |
| 6 | WatchCharts API (trend analizi) | $49-199/ay | Başvuru + 3-7 gün |
| 7 | Sentry (hata takibi) | Ücretsiz | 5 dk |

### 🟢 Production'a Yakın (Lansman Öncesi)
| # | Hesap | Maliyet | Süre |
|---|-------|---------|------|
| 8 | Domain (.ai veya .com) | $10-70/yıl | 5 dk |
| 9 | Hetzner VPS | €8.49/ay | 10 dk |
| 10 | Cloudflare R2 | ~$0-2/ay | 5 dk |
| 11 | Resend (production e-posta) | Ücretsiz başlangıç | 5 dk |
| 12 | Plausible / GA (analitik) | Ücretsiz-$9/ay | 5 dk |

---

## 💶 TAHMİNİ AYLIK MALİYET SENARYOLARI

### Senaryo 1: Minimum Viable (Ücretsiz Veri) ⭐ ÖNERİLEN BAŞLANGIÇ
| Kalem | Aylık |
|-------|------:|
| Hetzner CX31 | €8.49 |
| Domain (.com) | ~€1 |
| Gemini API | $0 |
| eBay Browse API (Market Scanner birincil) | $0 |
| Chrono24 + Watchfinder JSON-LD (tamamlayıcı) | $0 |
| Resend (e-posta) | $0 |
| Cloudflare R2 | $0 |
| Sentry (free tier) | $0 |
| **TOPLAM** | **~€10/ay (~$11)** |
| **Market Scanner veri kaynağı:** | eBay (resmi) + Chrono24/Watchfinder (JSON-LD) |

### Senaryo 2: Tam Entegrasyon (Chrono24 Dealer eklendi)
| Kalem | Aylık |
|-------|------:|
| Hetzner CX31 | €8.49 |
| Domain (.ai) | ~€5 |
| Chrono24 Dealer (temel) | €99 |
| Gemini API | $0 |
| eBay Browse API (Market Scanner birincil) | $0 |
| Resend (e-posta) | $0 |
| Cloudflare R2 | ~$1 |
| Sentry (free tier) | $0 |
| WatchCharts API (trend analizi) | $49 |
| **TOPLAM** | **~€165/ay (~$180)** |
| **Not:** | WatchCharts Market Scanner'da fiyat trendi grafiği için kullanılıyor |

### Senaryo 3: Büyüme (Ölçekleme — Tüm Premium)
| Kalem | Aylık |
|-------|------:|
| Hetzner AX42 (dedicated) | €52 |
| Domain (.ai) | ~€5 |
| Chrono24 Dealer (premium) | €299 |
| WatchCharts API (pro) | $199 |
| Gemini API (ücretli tier) | ~$5 |
| Resend (pro) | $20 |
| Cloudflare R2 (50GB+) | ~$5 |
| Sentry (team) | $26 |
| **TOPLAM** | **~€615/ay (~$670)** |

---

## 📌 API KEY FORMAT ÖRNEKLERİ (.env dosyasına eklenecek)

```env
# Gemini (Google AI Studio)
GEMINI_API_KEY=AIzaSy...

# eBay
EBAY_CLIENT_ID=YourApp-PRD-xxx
EBAY_CLIENT_SECRET=PRD-xxx-xxx
EBAY_REDIRECT_URI=https://yourdomain.com/api/ebay/callback

# Shopify
SHOPIFY_API_KEY=shpat_xxx
SHOPIFY_API_SECRET=shpss_xxx
SHOPIFY_SHOP_DOMAIN=yourstore.myshopify.com

# Sentry
SENTRY_LARAVEL_DSN=https://xxx@o123.ingest.sentry.io/456
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123.ingest.sentry.io/789

# Mailtrap (dev)
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=xxx
MAIL_PASSWORD=xxx

# WatchCharts (Market Scanner — opsiyonel)
WATCHCHARTS_API_KEY=wc_xxx

# Cloudflare R2 (Production storage)
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=watchsync-assets
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Production E-posta (Resend)
RESEND_API_KEY=re_xxx
```

---

## 🚀 ADIM ADIM HESAP AÇMA REHBERİ

> Aşağıdaki sırayla yap. Toplam süre: ~30 dakika (onay süreleri hariç).

### Adım 1: Google AI Studio → Gemini API Key (2 dk)
1. https://aistudio.google.com adresine git
2. Google hesabınla giriş yap
3. Sol menüden **"Get API Key"** tıkla
4. **"Create API Key"** → proje seç veya yeni oluştur
5. Kopyala → `.env` dosyasına yapıştır: `GEMINI_API_KEY=AIzaSy...`

### Adım 2: eBay Developer Account (10 dk + 1-2 gün onay)
1. https://developer.ebay.com adresine git → **"Join"** tıkla
2. eBay hesabınla giriş yap (yoksa yeni aç)
3. **Application Access Keys** sayfasına git
4. **"Create a keyset"** → uygulama adı: `WatchSyncAI`
5. **Sandbox** ve **Production** key'leri al:
   - `EBAY_CLIENT_ID=YourApp-PRD-xxx`
   - `EBAY_CLIENT_SECRET=PRD-xxx-xxx`
6. **User Tokens** → **"Get a Token from eBay via Your Application"**
   - Auth Accepted URL: `https://yourdomain.com/api/ebay/callback`
   - → `EBAY_REDIRECT_URI` olarak kullan
7. **Sandbox Test User** oluştur: Developer Portal → Sandbox → Create Test User
8. ⚠️ Production key'leri 1-2 gün onay bekleyebilir, Sandbox hemen çalışır

### Adım 3: Shopify Partner Account (15 dk)
1. https://partners.shopify.com → **"Sign up"**
2. **Stores** → **"Add store"** → **"Development store"** seç
3. Store oluştur → **Settings** → **Apps** → **"Develop apps"**
4. **"Create an app"** → ad: `WatchSyncAI`
5. **Configure Admin API scopes**: `write_products`, `read_products`, `write_inventory`, `read_inventory`, `read_orders`
6. **Install app** → API key'leri kopyala:
   - `SHOPIFY_API_KEY=shpat_xxx`
   - `SHOPIFY_API_SECRET=shpss_xxx`
   - `SHOPIFY_SHOP_DOMAIN=senin-store.myshopify.com`

### Adım 4: Mailtrap — Test E-posta (3 dk)
1. https://mailtrap.io → **"Sign up"**
2. Sol menüden **"Email Testing"** → **"Inboxes"**
3. Inbox'a tıkla → **"SMTP Settings"** → **"Show Credentials"**
4. `.env`'ye kopyala: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`

### Adım 5: Sentry — Hata Takibi (5 dk)
1. https://sentry.io → **"Sign up"** (GitHub ile giriş en hızlı)
2. **"Create Project"** → Platform: **Laravel** → `SENTRY_LARAVEL_DSN` al
3. **"Create Project"** → Platform: **Next.js** → `NEXT_PUBLIC_SENTRY_DSN` al

### Adım 6 (İleride): Chrono24 Dealer Başvurusu
1. https://www.chrono24.com/dealer adresine git
2. Dealer başvuru formunu doldur
3. Onay 1-4 hafta sürer

### Adım 7 (Opsiyonel): WatchCharts API
1. https://watchcharts.com → API erişimi için contact/apply
2. Onay 3-7 gün sürer
3. `WATCHCHARTS_API_KEY=wc_xxx` → `.env`'ye ekle

---

## 📊 TÜM API'LER: NE İŞE YARAR, NEREDE KULLANILIR, ALTERNATİFLERİ

### WatchCharts Tam Olarak Ne Yapar?
WatchCharts, saat piyasasının **tarihsel fiyat trendlerini** takip eden bir veri platformu. Mesela "Rolex Submariner 126610LN son 6 ayda %12 değer kazandı" gibi **cross-platform trend analizi** yapıyor. Chrono24, eBay, özel bayiler gibi birçok kaynaktan veri toplayıp agrege ediyor.

**Bizim projede kullanımı:**
- Market Scanner sayfasındaki **fiyat trendi grafiği** (6ay/1yıl/3yıl)
- "Bu saat değer kazanıyor mu kaybediyor mu?" göstergesi (↑ up / ↓ down / → stable)
- **Fair market value** — "Bu saatin piyasa değeri ~ €8,500" bilgisi
- Arbit raj fırsatı tespiti (eğer satış fiyatın < market value ise)

**Neden sadece kendi verimizle yapamıyoruz?** eBay + JSON-LD ile topladığımız veriler sadece **anlık fiyatlar**. Trend hesaplamak için aylarca veri biriktirmemiz lazım. WatchCharts **yılların verisini anında** veriyor.

### API Karşılaştırma Tablosu

| API / Servis | Projede Nerede Kullanılıyor | Ne İş Yapıyor | Maliyet | Alternatifler | Neden Bunu Seçtik |
|---|---|---|---|---|---|
| **eBay Browse API** | `MarketScrapingService.php` → `scanEbayBrowseApi()` | Market Scanner birincil veri kaynağı. eBay'deki saat ilanlarının fiyat, kondisyon, satıcı, ülke bilgisini çeker | **Ücretsiz** (5000 çağrı/gün) | Chrono24 Partner API (€99+/ay), WatchCharts ($49+/ay), manuel scraping (ban riski) | **Resmi API, sıfır ban riski, ücretsiz, zaten eBay listeleme için hesap açılacak — ek maliyet yok** |
| **eBay Inventory API** | `EbayListingService.php` | eBay'de saat ilan oluşturma, güncelleme, kaldırma | **Ücretsiz** (satış komisyonu ayrı) | Chrono24 XML Feed, Shopify API | eBay en büyük ikinci el saat pazarı, zorunlu platform |
| **eBay OAuth 2.0** | `EbayOAuthService.php` | eBay API'lerine erişim tokeni alma (2 tip: app-level + user-level) | **Ücretsiz** | — | eBay API'si OAuth zorunlu kılıyor |
| **Chrono24 JSON-LD** | `ai-service/scraping.py` → `scrape_chrono24()` | Chrono24'teki ilanların fiyatlarını schema.org yapısal veriden okur | **Ücretsiz** | Chrono24 Partner API (€99+/ay dealer hesabı), Playwright scraping (ban riski) | **Ücretsiz, ban riski minimal (arama motoru gibi veri okuma), ek hesap gerektirmiyor** |
| **Watchfinder JSON-LD** | `ai-service/scraping.py` → `scrape_watchfinder()` | Watchfinder'daki ilanların fiyatlarını aynı teknikle okur | **Ücretsiz** | Watchfinder API (yok/kapalı), Playwright (ban riski) | **Tek seçenek bu — Watchfinder'ın herkese açık API'si yok** |
| **WatchCharts API** | `MarketScrapingService.php` → `scanWatchCharts()` | Tarihsel fiyat trendi, fair market value, cross-platform fiyat karşılaştırma | **$49-199/ay** | Manuel trend hesaplama (kendi verimizden — aylar sürer), yok | **Trend analizi için şart — anında yılların verisini veriyor. Kendi verimizle trend hesaplama en az 3-6 ay veri biriktirme gerektirir** |
| **Gemini 2.0 Flash** | `LlmService.php` | SEO uyumlu ilan açıklaması üretme (EN/DE/TR), saat detaylarından metin oluşturma | **Ücretsiz** (15 req/dk) | OpenAI GPT-4 ($20+/ay), Groq Llama-3 (ücretsiz), Anthropic Claude ($20+/ay) | **Ücretsiz tier yeterli, OpenAI-uyumlu endpoint (kod değişikliği minimum), Türkçe iyi** |
| **Shopify Admin API** | `ShopifyService.php` | Shopify mağazada ürün oluşturma/güncelleme/silme, stok yönetimi | **Ücretsiz** (Shopify aboneliği ayrı) | WooCommerce (self-hosted, ücretsiz), BigCommerce | Kullanıcı tabanı geniş, dev ekosistemi, kolay entegrasyon |
| **Chrono24 XML Feed** | `Chrono24FeedService.php` | Chrono24'e saat ilanı yayınlama (XML formatında) | **Dealer hesabı** (€99-299/ay) | Manuel ilan girme, API (varsa) | Chrono24 sadece XML Feed veya manuel kabul ediyor |
| **SAM 2 (Meta)** | `ai-service` → `/api/ai/segment` | Saat fotoğrafından arka plan kaldırma/değiştirme (AI görsel işleme) | **Ücretsiz** (açık kaynak, lokal) | remove.bg ($9+/ay), Adobe API ($50+/ay) | **Tamamen ücretsiz, lokal çalışıyor, internet bağımlılığı yok, kalitesi yüksek** |
| **Sentry** | Laravel + Next.js | Production hata takibi ve loglama | **Ücretsiz** (5K event/ay) | Bugsnag ($25+/ay), Rollbar ($14+/ay) | Ücretsiz tier yeterli, Laravel + Next.js entegrasyonu hazır |
| **Resend** | Laravel Mail | Production e-posta gönderimi (fatura, bildirim) | **Ücretsiz** (3K email/ay) | Mailgun (1K ücretsiz), Amazon SES ($0.10/1K), Postmark ($10+/ay) | Ücretsiz başlangıç limiti en yüksek, kurulumu en kolay |
| **Cloudflare R2** | Laravel Filesystem (S3 driver) | Saat fotoğrafları, AI çıktıları, fatura PDF depolama | **Ücretsiz** (10GB) | AWS S3 ($0.023/GB + egress), DigitalOcean Spaces ($5/ay) | **Egress ücretsiz (S3'te en büyük maliyet), S3 uyumlu, 10GB free tier** |

### Neden Bu Seçimleri Yaptık — Kısa Özet

| Karar | Neden |
|-------|-------|
| eBay Browse API birincil (anlık fiyat), WatchCharts önerilen (trend) | eBay ücretsiz + anlık veri. WatchCharts ücretli ama yılların tarihsel trend verisini anında veriyor — kendi verimizle yapmak aylar sürer |
| Playwright kaldırıldı | IP ban riski #1 önceliğimiz. Resmi API varken gereksiz risk |
| Gemini, OpenAI yerine | Ücretsiz tier yeterli, aynı API formatı (minimum kod değişikliği) |
| JSON-LD scraping, Playwright yerine | Schema.org okumak arama motorlarının yaptığı şey — ban riski minimal |
| SAM 2, remove.bg yerine | Ücretsiz, lokal, internet bağımlılığı yok |
| Resend, Mailgun yerine | 3x daha yüksek ücretsiz limit (3K vs 1K email/ay) |
| Cloudflare R2, AWS S3 yerine | Egress ücretsiz — S3'te download başına para ödüyorsun |
