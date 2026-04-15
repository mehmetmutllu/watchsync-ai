# Devam Promptu — Aşama 2'ye Geçiş

> Bu promptu yeni chat'e yapıştır (eğer bu chat kapanırsa)

---

WatchSync AI projesinde Full-Stack Developer olarak çalışıyorum. Windows kullanıyorum.
Proje path: c:\AppServ\www\saatProjesi (backend/, frontend/, ai-service/)
Backend Docker'da çalışıyor (Laravel + MySQL + Redis + RabbitMQ + AI Service).
Frontend: cd frontend && npm run dev (localhost:3000)

ÖNCELİKLE DOSYALARI OKU:
1. progress.md — tüm [ ] (boş checkbox) görevler bekliyor. [x] olanlar tamamlandı.
2. activecontext.md — mimari, kararlar, haftalık özetler
3. HESAPLAR_VE_MALIYETLER.md — API'ler, maliyetler

TAMAMLANAN:
- Aşama 1 (Acil Fix & Rebuild) ✅ — AI Studio watch ID 0 bug fix, RabbitMQ env düzeltmesi, Queue worker Supervisor ile daemonize, Docker rebuild

SIRAYLA YAPILACAK GÖREVLER — AŞAMA 2: Eksik Frontend UI'lar

5. AI Açıklama Üretimi UI (Hafta 8 frontend TODO):
   - "Generate" butonu → backend POST /api/ai/generate-description çağrısı
   - Streaming metin gösterimi (karakter karakter)
   - Düzenlenebilir metin alanı + "Yeniden Üret" / "Kopyala" butonları
   - Dil seçimi dropdown (EN, DE, TR)

6. Platform "Test Connection" butonu (Ayarlar sayfasında — credential sonrası doğrulama)

7. WatchCharts trend verisi → Market Scanner fiyat trendi grafiğine entegre et:
   - Fair market value gösterimi ("Bu saat piyasada ortalama X€")
   - 6ay / 1yıl / 3yıl trend grafiği seçici

KURALLAR:
- Her değişiklikte: cd frontend && npm run build (hata kontrolü)
- Commit: feat: / fix: / style: / refactor: prefix
- Branch: berat/feature/[görev-adı]
- git add backend/ frontend/ ai-service/ (ASLA git add . kullanma!)

GÖREV BİTTİĞİNDE:
1. git add backend/ frontend/ ai-service/ && git commit -m "feat: açıklama"
2. progress.md güncelle — tamamlanan görevleri [x] yap
3. activecontext.md güncelle — ne yaptığını yaz
4. Bana kopyalanabilir DEVAM PROMPTU üret
