# WatchSync AI — Proje Yönetim Planı (Master Plan)

> **Versiyon:** 1.0  
> **Tarih:** 2026-03-26  
> **Ekip:** 2 Geliştirici (1 Senior, 1 Junior)  
> **Toplam Süre:** ~12 Hafta (3 Faz)

---

## Genel Bakış

Bu belge, WatchSync AI projesinin sıfırdan üretime alınmasına kadar geçecek süreci haftalık kırılımlarla tanımlar. Her hafta için **Senior (S)** ve **Junior (J)** geliştiricinin paralel görevleri listelenmiştir.

---

## FAZ 1 — TEMELLERİN ATILMASI (Hafta 1-4)

### Hafta 1: Proje Altyapısı & Geliştirme Ortamı

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Laravel 11 projesini oluştur, `.env` yapılandırması, Sanctum kurulumu | Next.js App Router projesi oluştur, TailwindCSS + `Inter` font yapılandırması |
| 3-4 | MySQL/PostgreSQL şema tasarımı (Migration'lar): `watches`, `platforms`, `sync_logs`, `users`, `dealers` tabloları | Google Stitch ile Landing Page üretimi → Next.js'e entegre et |
| 5 | Redis & RabbitMQ Docker container kurulumu, Laravel Queue bağlantı testi | Sidebar + Layout bileşen iskeletini kur, Dark Mode tema değişkenleri |

**Hafta 1 Çıktısı:** Her iki proje ayağa kalkmış, DB migration'ları hazır, temel layout render ediliyor.

---

### Hafta 2: Veri Modelleri & Dashboard UI

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Eloquent Modelleri: `Watch`, `Platform`, `SyncLog`, `Dealer` — JSONB sütun cast'leri, ilişkiler (relationships) | Dashboard sayfası: KPI kartları (Total Inventory Value, Sold this Month, Pending Syncs) — statik verilerle |
| 3-4 | Sanctum Auth API: `POST /login`, `POST /register`, `GET /me` endpoint'leri + Middleware | Auth sayfaları: Login & Register formları, React Hook Form + Zod validasyonu |
| 5 | Seeder'lar: Marka/Model referans verileri (Rolex, Patek, AP vs.) JSON dosyasından seed etme | Dashboard'u API'ye bağla: `GET /api/dashboard/stats` → KPI kartlarına veri akışı (SWR/React Query) |

**Hafta 2 Çıktısı:** Kullanıcı sisteme giriş yapıp Dashboard'daki KPI kartlarını canlı verilerle görebilir.

---

### Hafta 3: Envanter CRUD & Tablo UI

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Watch CRUD API: `GET/POST/PUT/DELETE /api/watches` — filtreleme, sayfalama (cursor pagination), sıralama | Envanter Tablosu: veri-yoğun tablo bileşeni (thumbnail, marka/model, durum, fiyat, platform toggle'ları) |
| 3-4 | Görsel yükleme: `POST /api/watches/{id}/images` — S3/MinIO entegrasyonu, thumbnail oluşturma | Saat Ekleme/Düzenleme Formu: çok adımlı form (brand→model→details→images), Zod şema validasyonu |
| 5 | Envanter durum makinesi (State Machine): `Satışta → Rezerve → Satıldı → Bakımda` geçiş kuralları | Form → API bağlantısı, iyimser güncelleme (optimistic update) ile tablo yenileme |

**Hafta 3 Çıktısı:** Saat ekleme, listeleme, düzenleme, silme tam çalışır. Görseller yüklenebilir.

---

### Hafta 4: Redis Lock & Kuyruk Mimarisi

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Redis Mutex implementasyonu: `Redis::lock('inventory_update_'.$sku, 10)->block(5)` — çifte satış senaryosu testleri | Gerçek zamanlı aktivite feed tablosu (Dashboard), WebSocket/Pusher ile `SyncStatusUpdated` event dinleme |
| 3-4 | RabbitMQ Job sistemi: `SyncInventoryJob`, `UpdatePlatformStockJob` — retry & dead-letter queue yapılandırması | Market Scanner sayfası iskelet UI: fiyat trendi grafik alanı (Recharts/Chart.js) + rakip fiyat tablosu |
| 5 | Entegrasyon testi: Eşzamanlı 10 sipariş simülasyonu → kilit mekanizmasının doğrulanması | UI Polish: loading skeleton'lar, boş durum (empty state) bileşenleri, hata sınırları (error boundary) |

**Hafta 4 Çıktısı:** Kritik çifte satış önleme mekanizması test edilmiş ve çalışır durumda.

---

## FAZ 2 — ENTEGRASYONLAR & YAPAY ZEKA (Hafta 5-8)

### Hafta 5: Chrono24 XML Feed & eBay OAuth

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Chrono24 XML Feed endpoint: `/api/feeds/chrono24.xml` — zorunlu düğümler (`<article_id>`, `<price>`, `<Manufacturer>` vs.), IP Whitelist middleware | Platform ayarları sayfası: eBay/Chrono24/Shopify bağlantı kartları, API anahtarı giriş formları |
| 3-4 | eBay OAuth 2.0 Authorization Code Grant akışı: callback handler, token yenileme (refresh) cron job'u | eBay bağlantı akışı UI: "eBay'e Bağlan" butonu → OAuth popup → başarı/hata geri bildirimi |
| 5 | eBay Taxonomy API: `getItemAspectsForCategory(281)` → zorunlu alan eşleştirme motoru | Toggle switch fonksiyonelliği: platform bazında yayınla/kaldır aksiyonları → API çağrıları |

**Hafta 5 Çıktısı:** Chrono24 XML feed canlı, eBay OAuth akışı tamamlanmış.

---

### Hafta 6: eBay Listeleme & Shopify Entegrasyonu

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | eBay Inventory API: `createOrReplaceInventoryItem`, `createOffer`, `publishOffer` — Authenticity Guarantee uyumu | Senkronizasyon durumu göstergeleri: platform bazında "Synced ✓ / Pending ⏳ / Error ✗" badge'leri |
| 3-4 | Shopify Admin API (GraphQL): `productCreate`, `productUpdate`, `inventoryAdjustQuantities` mutation'ları | Toplu işlem (Bulk Actions) UI: çoklu saat seçimi → "Hepsini eBay'e Yayınla" akışı |
| 5 | Webhook dinleyicileri: eBay notification → sipariş geldiğinde stok kilitleme tetiklenmesi | Bildirim sistemi UI: toast notification bileşeni + bildirim çekmecesi (notification drawer) |

**Hafta 6 Çıktısı:** Saat tek tuşla eBay ve Shopify'a yayınlanabiliyor.

---

### Hafta 7: AI Mikroservisi — Görsel İşleme

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Python FastAPI servisi kurulumu, SAM 2 model entegrasyonu, `/api/ai/segment` endpoint'i | AI Studio sayfası: Split layout — sol taraf yüksek çözünürlüklü görsel önizleme, sağ taraf form |
| 3-4 | Matting pipeline: SAM 2 maske → alpha matting → color decontamination → RGBA çıktı | "AI Enhance" butonu: görsel yükleme → FastAPI'ye gönder → işlenmiş görseli önizle → kaydet |
| 5 | Arka plan değiştirme: Önceden tanımlı lüks arka planlar (beyaz stüdyo, siyah kadife, mermer) | Arka plan seçici UI: küçük resim galerisi, özel arka plan yükleme seçeneği |

**Hafta 7 Çıktısı:** AI ile saat görseli arka planı değiştirilip orijinal piksel bütünlüğü korunabiliyor.

---

### Hafta 8: AI Metin Motoru & Pazar Tarayıcı

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | LLM entegrasyonu (Gemini 2.0 Flash): saat referans numarasından SEO uyumlu açıklama üretme | AI açıklama UI: "Generate" butonu → streaming metin gösterimi → düzenleme alanı |
| 3-4 | Web scraping servisi: Chrono24/Watchfinder fiyat çekme (Playwright), veri normalleştirme pipeline | Market Scanner veri bağlama: fiyat trendi grafiği (gerçek veri), rakip fiyat karşılaştırma tablosu |
| 5 | Fine-tuning veri seti hazırlığı: saat katalog verilerinden eğitim seti oluşturma scripti | Fiyat uyarı sistemi UI: "Bu referans X€'nun altına düştüğünde bildir" kuralları formu |

**Hafta 8 Çıktısı:** AI metin üretimi ve pazar tarayıcı çalışır durumda.

---

## FAZ 3 — CİLALAMA, TEST & LANSMAN (Hafta 9-12)

### Hafta 9: CRM & Finans Modülü

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | CRM API: `customers` tablosu, satın alma geçmişi, notlar, etiketleme sistemi | CRM sayfası: müşteri listesi, müşteri detay sayfası, iletişim geçmişi zaman çizelgesi |
| 3-4 | Fatura motoru: PDF fatura oluşturma (DomPDF/Snappy), yasal uyumluluk alanları (KDV, fatura no) | Fatura sayfası: fatura listesi, fatura önizleme modal'ı, PDF indirme butonu |
| 5 | E-posta bildirimleri: Sipariş onayı, fatura gönderimi, stok uyarıları (Laravel Notification) | Ayarlar sayfası: profil düzenleme, bildirim tercihleri, API anahtarları yönetimi |

**Hafta 9 Çıktısı:** Müşteri takibi ve faturalama sistemi hazır.

---

### Hafta 10: Performans & Güvenlik

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Rate limiting (API), input sanitization, SQL injection / XSS korumaları gözden geçirme | Lighthouse performans optimizasyonu: lazy loading, code splitting, görsel optimizasyonu |
| 3-4 | Laravel Telescope / Horizon kurulumu: kuyruk izleme, yavaş sorgu tespiti, hata takibi | Erişilebilirlik (a11y) denetimi: ARIA label'ları, klavye navigasyonu, renk kontrast kontrolü |
| 5 | Yük testi: 100 eşzamanlı kullanıcı simülasyonu (k6/Artillery), darboğaz tespiti | Responsive tasarım denetimi: tablet/mobil kırılım noktalarında UI kontrolü |

**Hafta 10 Çıktısı:** Sistem güvenlik taramasından ve performans testlerinden geçmiş durumda.

---

### Hafta 11: Uçtan Uca Test & Hata Giderme

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-3 | Backend entegrasyon testleri (PHPUnit/Pest): tüm API endpoint'leri, kilit mekanizması, webhook senaryoları | Frontend E2E testleri (Cypress/Playwright): kritik kullanıcı akışları (giriş → saat ekle → yayınla) |
| 4-5 | Bug bash: kritik/yüksek hataların giderilmesi, edge case'lerin çözümü | UI/UX ince ayar: animasyon geçişleri, mikro-etkileşimler, son görsel dokunuşlar |

**Hafta 11 Çıktısı:** Tüm kritik akışlar test edilmiş, bilinen hata kalmamış.

---

### Hafta 12: Staging & Lansman

| Gün | Senior (S) | Junior (J) |
|-----|-----------|------------|
| 1-2 | Staging ortamı kurulumu: Docker Compose / AWS ECS yapılandırması, CI/CD pipeline (GitHub Actions) | Landing Page son hali: SEO meta tag'leri, OG image'lar, performans skoru > 90 |
| 3-4 | Production veritabanı migration'ı, SSL sertifikası, DNS yapılandırması, izleme (monitoring) kurulumu | Kullanıcı dokümantasyonu: başlangıç kılavuzu, SSS, bilinen sınırlamalar |
| 5 | **🚀 Canlıya alınma (Go-Live)** — izleme, ilk geri bildirim toplama | Hata raporlama formu, kullanıcı onboarding akışı |

**Hafta 12 Çıktısı:** 🎉 WatchSync AI canlı ortamda!

---

## Risk Matrisi

| Risk | Olasılık | Etki | Azaltma Stratejisi |
|------|----------|------|---------------------|
| eBay API değişikliği | Orta | Yüksek | Adapter pattern ile soyutlama, versiyon pinleme |
| Chrono24 IP Whitelist reddi | Düşük | Yüksek | Erken başvuru, yedek statik IP havuzu |
| SAM 2 model performansı düşük | Orta | Orta | Fallback: basit arka plan kaldırma (rembg) |
| Çifte satış (Race Condition) | Yüksek | Kritik | Redis Mutex + entegrasyon testleri + izleme uyarıları |
| LLM halüsinasyonu (yanlış bilgi) | Orta | Yüksek | Saat veritabanı cross-check, insan onay adımı |

---

## Bağımlılık Diyagramı

```
Senior Hafta 1 (Laravel) ──→ Junior Hafta 2 (Dashboard API bağlantısı)
Senior Hafta 3 (CRUD API) ──→ Junior Hafta 3 (Envanter UI)
Senior Hafta 4 (Redis/RabbitMQ) ──→ Senior Hafta 5-6 (Platform Entegrasyonları)
Senior Hafta 7 (AI Servis) ──→ Junior Hafta 7 (AI Studio UI)
Her iki kişi Hafta 11 ──→ Hafta 12 (Staging & Lansman)
```
