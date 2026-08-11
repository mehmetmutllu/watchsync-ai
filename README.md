# WatchSync AI

**AI-assisted inventory and multi-channel listing platform for luxury watch dealers.**

Luxury watch dealers manage the same inventory across marketplaces (eBay, Shopify, chrono platforms) by hand — re-typing listings, juggling prices and stock in spreadsheets. WatchSync AI centralizes the inventory and uses AI for enrichment (spec extraction, pricing signals, listing copy), then syncs listings to every connected channel.

## Architecture

Three services, each with a clear responsibility:

```
├── backend/     → Laravel 11 — REST API, business logic, channel integrations
├── frontend/    → Next.js 14 — dealer dashboard UI
└── ai-service/  → FastAPI (Python) — AI enrichment & market-data scraping
```

- **Backend (Laravel 11):** inventory domain model, multi-channel listing sync (eBay / Shopify APIs, webhook verification), queue-driven jobs (Redis + RabbitMQ), mail flows.
- **Frontend (Next.js 14):** dealer-facing dashboard for inventory, listings and channel status.
- **AI service (FastAPI):** Python service for AI-powered enrichment and market data (watch pricing references), containerized with Docker.

## Tech Stack

Laravel 11 · PHP · MySQL · Redis · RabbitMQ · Next.js 14 · React · TypeScript · FastAPI · Python · Docker · Sentry

## Key Engineering Decisions

- **Service split by workload type** — PHP for transactional business logic, Python for AI/scraping workloads, isolated so they scale and fail independently.
- **Queue-first channel sync** — marketplace APIs are slow and rate-limited; all channel operations run through queues instead of blocking requests.
- **Webhook-verified integrations** — eBay/Shopify webhooks are signature-verified before touching inventory state.
- **AI-assisted development workflow** — the repo carries persistent project context (`CLAUDE.md`, `progress.md`, design docs) so AI-assisted sessions continue with full project knowledge.

## Running Locally

```bash
# Backend
cd backend && composer install && php artisan serve

# Frontend
cd frontend && npm install && npm run dev

# AI service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8001
```

Each service has its own `.env.example` — copy to `.env` and fill in credentials.

## Project Status

Active development. Core inventory + dashboard implemented; channel integrations and AI enrichment expanding.
