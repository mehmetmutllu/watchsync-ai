# WatchSync AI — Sonraki Chat Prompt

> **Bu dosya her görev sonunda otomatik güncellenir.**  
> **Aşağıdaki prompt'u kopyalayıp yeni chat'e yapıştırın.**

---

## Kopyalanacak Prompt (Berat — Hafta 7: AI Görsel İşleme Mikroservisi)

```
WatchSync AI projesinde Hafta 7'ye başlıyorum. AI Görsel İşleme Mikroservisi kurulacak.

activecontext.md dosyasını oku — tamamlanan haftalar (1-6 + iyileştirmeler), mimari, API endpoint'leri ve teknoloji stack'i orada.
progress.md dosyasını oku — Hafta 1-6 tamamlandı, Hafta 7 görevleri yapılacak.
plan.md dosyasını oku — Hafta 7 detaylı planı orada.

Tamamlanan: Hafta 1-6 (Altyapı, Auth, CRUD, Redis Lock & Kuyruk, Chrono24 & eBay Bağlantıları, eBay Listeleme & Shopify, tüm iyileştirmeler). Build başarılı, proje çalışıyor.

Hafta 7 Görevleri — AI Görsel İşleme Mikroservisi:

Backend (Python FastAPI):
1. ai-service/ klasöründe Python FastAPI servisi kurulumu (Dockerfile + docker-compose entegrasyonu)
2. SAM 2 model entegrasyonu — POST /api/ai/segment endpoint'i (görsel yükle → segmentasyon maskesi)
3. Matting pipeline: SAM 2 maske → alpha matting → color decontamination → RGBA çıktı
4. Arka plan değiştirme: Önceden tanımlı lüks arka planlar (beyaz stüdyo, siyah kadife, mermer)
5. Laravel proxy endpoint: POST /api/watches/{id}/ai-enhance → FastAPI forward

Frontend (Next.js):
6. AI Studio sayfası: Split layout — sol yüksek çözünürlüklü görsel önizleme, sağ taraf kontroller
7. "AI Enhance" butonu: görsel yükleme → FastAPI'ye gönder → işlenmiş görseli önizle → kaydet
8. Arka plan seçici UI: küçük resim galerisi + özel arka plan yükleme seçeneği
9. Before/After karşılaştırma bileşeni (slider)

NOT: Docker (Laravel + MySQL + Redis) zaten çalışıyor. Port config: APP_PORT=8000, FORWARD_DB_PORT=3307, FORWARD_REDIS_PORT=6380.
Demo giriş: demo@watchsync.ai / password
ai-service/ klasörü zaten var, orayı kullan.

Her görevi sırayla implemente et, ardından build kontrol et (cd frontend && npm run build). Hepsini bitirince:
1. activecontext.md güncelle
2. progress.md checkbox'ları [x] yap
3. Git commit + push yap
4. prompt.md'yi Hafta 8 için güncelle
```

