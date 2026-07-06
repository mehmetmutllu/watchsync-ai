# Landing Redesign — Notlar & Sonraki Adım (kare-dizisi / transparan saat)

> Amaç: Landing hero'sunu, **arka planı olmayan (transparan/PNG), karelerden oluşuyormuş gibi** scroll'la hareket eden bir saat animasyonuna çevirmek (Apple ürün-sayfası tekniği). Kullanıcı video/kareleri kendisi ayarlayıp getirecek; biz canvas kare-scrub'a bağlayacağız.

## Şu anki durum (bu oturumda yapıldı)
Landing (`frontend/src/app/[locale]/page.tsx`) sıfırdan **"Precision Instrument"** yönünde yeniden yazıldı (koyu çelik OKLCH + tek amber aksan; mavi+altın refleksi ve tüm AI-slop desenleri kaldırıldı). Yeni yapı: scroll-scrub video hero → manifesto → how-it-works (3 adım) → capabilities (alternating) → platform node → metrics → trust → ambient-video CTA → footer.

Hero şu an **iki fazlı gerçek video scroll-scrub**: saat yüzü klibi (`watch-hero-scrub.mp4`) → blur crossfade → mekanizma klibi (`watch-movement-scrub.mp4`, Frederique Constant otomatik hareket). Mixkit ücretsiz stok; ffmpeg ile her-kare-keyframe olacak şekilde yeniden kodlandı. **Kullanıcı bunu beğenmedi** — dikdörtgen video değil, transparan/PNG kare-dizisi + gerçek "exploded/parçalanma" istiyor.

İlgili dosyalar:
- `frontend/src/components/landing/VideoScrollytelling.tsx` — mevcut iki-fazlı video scrub hero (kare-diziye çevrilecek).
- `frontend/src/components/landing/Reveal.tsx` — IntersectionObserver reveal (kalıyor).
- `frontend/src/app/[locale]/landing.css` — scoped steel+amber token'ları, `.ws-vhero-*`, reveal, gauge, vb.
- `frontend/src/app/[locale]/layout.tsx` — Archivo fontu eklendi.
- `frontend/src/middleware.ts` — matcher'a `media`/`icon.svg` dışlaması eklendi (public statik asset 307/404 bug fix — ÖNEMLİ, kalıcı).
- `frontend/messages/{en,tr,de}.json` — `Landing` altına beat/manifesto/how/step/cap + trust/sync anahtarları eklendi.
- `frontend/public/media/` — `watch-hero-scrub.mp4`, `watch-movement-scrub.mp4` + posterlar (kare-diziye geçince gereksizleşebilir).

## ANA TEKNİK GERÇEK
- Tarayıcıda **mp4 şeffaflık taşımaz**. Şeffaf video = **WebM VP9 alpha** ama **Safari oynatmaz**.
- Doğru ve her yerde çalışan yol: **numaralı transparan PNG/WebP kareleri `<canvas>`'a çizip scroll'a bağlamak** (Apple tekniği). Canvas alpha destekler → saat arka plansız, çelik zeminin üstünde yüzer.

## Uçtan uca boru hattı (2026)
1. **İlk kare + son kare → video AI** (kullanıcının fikri): **Pika 2.5 "Pikaframes"** (start+end frame, en birebir) · **Luma Ray3** (first/last anchoring) · **Kling 3.0** (start+end, ucuz) · **Runway Gen-4.5** (en güçlü) · açık kaynak **Wan 2.7**.
2. **Arka plan kaldır → şeffaf kare**: videobgremover.com · Unscreen · Runway remove-bg · Cloudinary → **PNG Sequence / WebM VP9 alpha / WebP / Lottie** çıktısı. ⚠️ Parlak metal/cam saatte AI bg-removal kenarları kirli olabilir.
3. **Kareleri optimize et**: ~48–120 kare, kare format (örn. 1200×1200), WebP/AVIF (toplam birkaç MB).
4. **Scroll'a bağla**: GSAP ScrollTrigger scrub · VEYA framer-motion `useScroll`+`useTransform` · **VEYA bağımlılıksız**: mevcut rAF-scrub bileşenini `<video>`→`<canvas>` (önceden yüklenmiş PNG kareleri çiz) olarak uyarla. **Öneri: bağımlılıksız canvas**, bundle artmaz.

## Alternatif — gerçek exploded için en kontrollü: **3B**
Sketchfab'den exploded-view saat modeli → Blender explode animasyonu → **alpha'lı PNG sequence** render. Alpha kusursuz, kamera/ışık tam kontrol. (Image-to-3D: Meshy/Tripo var ama saat gibi hassas objede el işi model daha temiz.)

## Kullanıcıdan ideal çıktı (bir sonraki chat'e getirecek)
- **En iyisi:** şeffaf **PNG/WebP kare dizisi** (`frame_000.webp … frame_120.webp`), kare format, saat ortalı, ~60–120 kare → `frontend/public/media/frames/`'e.
- **Olur:** tek **WebM VP9 alpha** dosya (Safari fallback = poster).
- **Son çare:** düz mp4 (fonlu) — şeffaflık yok; fon tek renkse canvas'ta luma/blend ile temizleme denenebilir (garanti değil).
- İdeal hareket: **assembled saat → yavaşça parçalara ayrılıp mekanizma açılır → tekrar birleşir** (loop), sabit ışık, sabit/hafif dönüş kamera.

## SONRAKİ CHAT — İLK İŞ
1. Kullanıcıya bu dosyayı hatırlat; getirdiği kare/video formatını sor.
2. Frame'ler geldiyse: `VideoScrollytelling`'i **canvas kare-scrub** bileşenine dönüştür (bağımlılıksız rAF; preload → scroll index → canvas draw; reduced-motion=ilk kare; beat'ler aynı kalır).
3. Frame yoksa: kullanıcı Pika/Kling/Luma ile ilk+son kare → video üretip bg-removal ile PNG seq çıkarana kadar bekle; istersek 3B (Sketchfab+Blender) rotasını değerlendir.

## Kaynaklar
- UlazAI — Best AI Image-to-Video 2026 (Runway/Kling/Luma/Pika): https://ulazai.com/best-ai-image-to-video-generators-2026/
- Soloa — Runway vs Kling vs Pika vs Luma 2026: https://soloa.ai/blog/runway-vs-kling-vs-pika-vs-luma-ai-video-2026
- videobgremover — transparan çıktı formatları (PNG seq / WebM VP9 alpha): https://videobgremover.com/transparency
- Jake Archibald — web'de alpha video (Safari/WebM uyarıları): https://jakearchibald.com/2024/video-with-transparency/
- Remotion — transparent videos: https://www.remotion.dev/docs/transparent-videos
- GSAP Vault — Apple-style scroll image sequence: https://gsapvault.com/blog/scroll-image-sequence-tutorial
- Loopspeed — React + GSAP scroll image sequence: https://blog.loopspeed.co.uk/scroll-driven-image-sequence-header
