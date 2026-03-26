# 🕐 WatchSync AI

> Lüks saat satıcıları için yapay zeka destekli çoklu platform envanter ve ilan yönetim sistemi.

---

## 🏗 Proje Yapısı

```
saatProjesi/
├── backend/          → Laravel 11 (PHP API & İş Mantığı)    [Senior]
├── frontend/         → Next.js 14 (React Dashboard UI)      [Junior]
├── ai-service/       → FastAPI (Python AI & Scraping)        [Senior]
├── plan.md           → Proje yönetim planı
├── design.md         → Tasarım sistemi rehberi
└── progress.md       → İlerleme takip belgesi
```

## 🔀 Git Branch Kuralları

| Branch | Amaç |
|--------|-------|
| `main` | Canlı (production) — doğrudan push **YASAK** |
| `develop` | Geliştirme ana dalı — PR ile merge |
| `senior/feature/*` | Senior'un özellik branch'leri |
| `junior/feature/*` | Junior'un özellik branch'leri |

## ⚠️ Altın Kurallar

1. **`main` ve `develop`'a asla direkt push yapma** — her zaman PR aç
2. **Kendi klasöründe çalış** — Senior: `backend/`, `ai-service/` | Junior: `frontend/`
3. **Her feature dalı kısa ömürlü olsun** — max 2-3 gün, sonra PR aç ve merge et
4. **Commit mesajları anlamlı olsun** — `feat:`, `fix:`, `style:` prefix'leri kullan

## 🚀 Çalıştırma

```bash
# Backend
cd backend && php artisan serve

# Frontend
cd frontend && npm run dev

# AI Servisi
cd ai-service && uvicorn main:app --reload --port 8001
```
