# WatchSync AI — Sonraki Chat Prompt

> **Bu dosya her görev sonunda otomatik güncellenir.**  
> **Aşağıdaki prompt'u kopyalayıp yeni chat'e yapıştırın.**

---

## Kopyalanacak Prompt

```
WatchSync AI projesinde Hafta 7'ye devam ediyorum.

activecontext.md dosyasını oku — tamamlanan haftalar, mimari, API endpoint'leri ve teknoloji stack'i orada.

Tamamlanan: Hafta 1-6 (Altyapı, Auth, CRUD, Redis Lock & Kuyruk, Chrono24 & eBay Bağlantıları, eBay Listeleme & Shopify Entegrasyonu) + Full Audit. Build başarılı, proje çalışıyor.

Hafta 7 — AI Görsel İşleme Mikroservisi yapılacak:

Backend (Senior):
- Python FastAPI servisi kurulumu (Dockerfile + Docker Compose entegrasyonu, port 8001)
- SAM 2 model entegrasyonu — `POST /api/ai/segment` endpoint'i (saat maskeleme)
- Matting pipeline: SAM 2 kaba maske → alpha matting iyileştirmesi → color decontamination → RGBA çıktı
- Arka plan değiştirme: `POST /api/ai/replace-background` — önceden tanımlı lüks arka planlar (beyaz stüdyo, siyah kadife, mermer) + özel arka plan yükleme + gölge sentezi
- Laravel proxy endpoint: `POST /api/watches/{id}/ai-enhance` → FastAPI forward, işlenmiş görseli kaydetme

Frontend (Junior):
- AI Studio sayfası: Split layout — sol yüksek çözünürlüklü görsel önizleme, sağ taraf kontroller
- "AI Enhance" butonu: görsel seçimi → FastAPI'ye gönder → işlenmiş görseli önizle → kaydet akışı
- Arka plan seçici UI: küçük resim galerisi (preset arka planlar) + özel arka plan yükleme seçeneği
- Before/After karşılaştırma bileşeni (slider ile sürüklenebilir karşılaştırma)
- İşlem süreci göstergesi (progress/spinner)

Not: ai-service/ klasörü zaten workspace'te mevcut ama boş. FastAPI projesini oraya kur. Docker Compose'a ai-service container'ını ekle.

activecontext.md, progress.md ve plan.md dosyalarına bak, proje yapısını incele ve Hafta 7'yi implemente et. Görev bitince activecontext.md'yi güncelle, prompt.md'yi bir sonraki hafta için güncelle ve chat üzerinde promptu ver.
```
