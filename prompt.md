# WatchSync AI — Sonraki Chat Prompt

> **Bu dosya her görev sonunda otomatik güncellenir.**  
> **Aşağıdaki prompt'u kopyalayıp yeni chat'e yapıştırın.**

---

## Kopyalanacak Prompt (Mehmet — Hafta 6 Kalan Görevler)

```
WatchSync AI projesinde Hafta 6 kalan iyileştirme görevlerini tamamlıyorum. Hafta 7'ye geçmeden önce bu görevler bitirilmeli.

activecontext.md dosyasını oku — tamamlanan haftalar, mimari, API endpoint'leri ve teknoloji stack'i orada.
progress.md dosyasını oku — "Hafta 6 Tamamlama Görevleri (İyileştirme)" bölümündeki [ ] olan görevler yapılacak.

Tamamlanan: Hafta 1-6 ana görevleri (Altyapı, Auth, CRUD, Redis Lock & Kuyruk, Chrono24 & eBay Bağlantıları, eBay Listeleme & Shopify) + Full Audit. Build başarılı, proje çalışıyor.

Yapılacak Hafta 6 İyileştirme Görevleri (progress.md'den):

Backend:
1. Platform referans ID'leri migration (watches tablosuna ebay_listing_id, ebay_offer_id, shopify_product_id, shopify_variant_id sütunları)
2. eBay listing güncelleme — fiyat/stok değiştiğinde mevcut listing update
3. eBay listing kaldırma (withdrawOffer) — toggle off yapıldığında
4. Shopify product silme (productDelete) — toggle off yapıldığında
5. Shopify/eBay rate limiting yönetimi (API throttle handling + retry)
6. toggleSync endpoint'inde enabled: false → platformdan listing kaldırma
7. SyncStatusBadges N+1 sorunu: sync status verisini GET /api/watches tablo API'sine dahil et
8. Webhook subscription otomasyonu (platform bağlantısı kurulunca otomatik kayıt)

Frontend:
9. BulkActions: gerçek ilerleme yüzdesi (polling ile job durumu takibi)
10. BulkActions: publish sonrası envanter tablosu otomatik yenileme
11. NotificationDrawer: tek bildirim okundu işaretleme
12. NotificationDrawer: bildirime tıklayınca ilgili saate yönlendirme

Bekleyen Güvenlik Görevleri (bunları da tamamla):
13. favicon.ico ve apple-touch-icon tasarımı ve eklenmesi
14. ProcessWebhookJob: platform/dealer ownership doğrulaması

NOT: Docker (Laravel + MySQL + Redis) zaten çalışıyor. Port config: APP_PORT=8000, FORWARD_DB_PORT=3307, FORWARD_REDIS_PORT=6380.
Demo giriş: demo@watchsync.ai / password

Her görevi sırayla implemente et, ardından build kontrol et (cd frontend && npm run build). Hepsini bitirince:
1. activecontext.md güncelle
2. progress.md checkbox'ları [x] yap
3. Git commit + push yap
4. prompt.md'yi Hafta 7 için güncelle
```

