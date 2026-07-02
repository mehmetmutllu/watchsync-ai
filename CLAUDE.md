# WatchSync AI — Proje Talimatları (Claude)

> Bu dosya her oturumda otomatik yüklenir. **Yalnızca bu projeye özeldir.**

## Proje özeti
AI destekli, çok platformlu lüks saat envanter & satış yönetimi SaaS'ı. Monorepo:
- `backend/` — Laravel 13 + PHP 8.3 + Sanctum (session/cookie auth) + MariaDB
- `frontend/` — Next.js 16 (App Router, i18n de/en/tr) + React 19 + Tailwind v4 + Zustand
- `ai-service/` — Python FastAPI (SAM 2 segmentasyon + scraping) — opsiyonel, başlatılmadı

## Yerel geliştirme ortamı (XAMPP — bu makineye özel)
- **PHP 8.3** `C:\php83` (sistemdeki varsayılan `php` 7.3'tür — PATH'e `C:\php83`'ü öne al).
- **Composer**: `php C:\ProgramData\ComposerSetup\bin\composer.phar` (8.3 üstünde çalıştır). Horizon için `--ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix` (Windows'ta pcntl/posix yok).
- **Backend** `php artisan serve --port=8001` → http://127.0.0.1:8001 (8000'de kullanıcının başka projesi "İkra Vakfı" var — dokunma).
- **Frontend** `npm run dev` → http://localhost:3000. `NEXT_PUBLIC_API_URL=http://localhost:8001/api` (⚠️ **localhost olmalı, 127.0.0.1 DEĞİL** — sayfa ve API aynı host olmazsa Sanctum SPA login 419 CSRF hatası verir; JS `XSRF-TOKEN` cookie'sini okuyamaz).
- **DB**: XAMPP **MariaDB :3307** (root / boş şifre), veritabanı `watchsync`. (3306'da kullanıcının Oracle MySQL 8'i var.)
- **Mail = log**, **Queue = sync**, **Redis yok** → e-postalar `backend/storage/logs/laravel.log`'a düşer; health "degraded" görünür (normal).
- Kolay başlatma: proje kökünde `start-dev.bat` (iki pencere açar, PATH'i kendi içinde ayarlar).
- Test girişleri: `demo@watchsync.ai / password` (owner) · `superadmin@watchsync.ai / SuperAdmin123!` (platform admini — ayrı sistem).

## Oturum Sürekliliği Ritüeli (watch-kaydet / watch-devam)
Kullanıcı bu komutlarla çalışır. `/watch-kaydet` ve `/watch-devam` slash komutları `.claude/commands/` içindedir; kullanıcı sadece "watch-kaydet" / "watch-devam" yazsa da aynı akışı uygula.

- **watch-kaydet** → Oturumu kaydet:
  1. `activecontext.md`'yi güncelle: "Son Güncelleme" tarihini bugüne çek; en alttaki **"Son Oturum"** bloğuna bu oturumda YAPILANLAR + MEVCUT DURUM + SONRAKİ ADIMLAR yaz.
  2. `progress.md`'de tamamlanan checkbox'ları işaretle.
  3. Bu projeye özel memory işaretçisini güncelle (`MEMORY.md` + ilgili dosya).
  4. Git: yalnız izlenen doküman/kod değişikliklerini (asla `.env`/secret/`vendor`/`node_modules`) stage'le, **conventional commit** ("feat:/fix:/docs:/chore:") ile commit et, mevcut dala **push** et.
  5. Kullanıcıya "artık /clear atabilirsin, sonra watch-devam de" bilgisini ver.
- **watch-devam** → Kaldığın yerden devam: `CLAUDE.md` + `activecontext.md` (Son Oturum + aktif Aşama spec'i) + `progress.md` (aktif Aşama checklist) + memory'yi oku; kısa bir "kaldığımız yer + sıradaki adım" özeti çıkar; onay alınca devam et.

## Kaynak-of-truth dosyaları
- `activecontext.md` — mevcut odak, kararlar, aktif aşamanın DETAYLI spec'i, "Son Oturum" logu.
- `progress.md` — faz/aşama checkbox görev listeleri.
- Bunlar git ile taşınır; **memory** yalnızca bu makinede, çapraz-chat işaretçi olarak tutulur.

## Aktif odak
**Aşama 7 — Ekip Yönetimi & İzin Sistemi.** Tam plan/spec: `activecontext.md` "AŞAMA 7 (SIRADAKİ)" + `progress.md` "AŞAMA 7". Geliştirme `feature/team-management` dalında yapılacak; her adımdan sonra Playwright testi.

## Git kuralları
- Ana dal `develop`; kod özellikleri **feature dalında** yapılır, `develop`'a PR ile döner. `main`'e doğrudan push yok.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- `.env`, credential, `vendor/`, `node_modules/` asla commit edilmez (zaten .gitignore'da).

## Frontend uyarısı
Next.js 16 breaking-change içerir (`frontend/AGENTS.md`). Frontend kodu yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili rehbere bak.
