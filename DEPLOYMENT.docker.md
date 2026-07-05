# WatchSync AI — Production Deployment (Docker)

Single-host Docker deployment for the full stack: Next.js frontend, Laravel API
(PHP-FPM + nginx), Horizon queue workers, scheduler, the FastAPI AI service,
MySQL, and Redis — with Caddy terminating TLS.

> For a bare-metal (systemd/supervisor/PM2) setup instead, see
> [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Architecture

```
                 ┌─────────── Caddy (:80/:443, auto-HTTPS) ───────────┐
                 │                                                     │
   app.domain ──▶ frontend (Next.js standalone :3000)                 │
   api.domain ──▶ nginx (:80) ──FastCGI──▶ backend (php-fpm :9000)    │
                                             │                        │
                 horizon ── scheduler ───────┤ (same Laravel image)   │
                                             ▼                        │
                              mysql:8.4    redis:7    ai-service:8001 ─┘
```

- **backend** runs migrations on start (`RUN_MIGRATIONS=true`); horizon/scheduler
  reuse the same image without migrating.
- **nginx** and the backend containers share the `backend-storage` volume so
  uploaded files (`storage/app/public`) are served via `public/storage`.
- Redis is password-protected and persists with AOF; MySQL persists to `db-data`.

## Prerequisites

- A Linux host with Docker Engine + Compose v2.
- DNS `A` records for `APP_DOMAIN` and `API_DOMAIN` pointing at the host (Caddy
  needs them resolvable to issue certificates).
- Ports 80 and 443 open.

## 1. Configure environment

Two env files — orchestration vs. application:

```bash
cp .env.prod.example .env              # domains, DB/Redis passwords, image tags
cp backend/.env.example backend/.env   # Laravel application config
```

Edit `backend/.env` for production (see `.env.example` for the full list):

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.watchsync.ai
FRONTEND_URL=https://app.watchsync.ai

DB_CONNECTION=mysql
DB_HOST=mysql            # docker service name
DB_PORT=3306
DB_DATABASE=watchsync
DB_USERNAME=watchsync
DB_PASSWORD=<same as root .env DB_PASSWORD>

REDIS_HOST=redis         # docker service name
REDIS_PASSWORD=<same as root .env REDIS_PASSWORD>
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# SPA cookie auth — the frontend and API must be same-site.
SANCTUM_STATEFUL_DOMAINS=app.watchsync.ai
SESSION_DOMAIN=.watchsync.ai
SESSION_SECURE_COOKIE=true

# Real mail + monitoring for production.
MAIL_MAILER=smtp        # or ses/sendgrid
SENTRY_LARAVEL_DSN=<dsn>

# Integrations (see section 4).
GEMINI_API_KEY=...
EBAY_ENVIRONMENT=production
```

> The `DB_PASSWORD` / `REDIS_PASSWORD` in root `.env` and `backend/.env` **must
> match** — the infra containers are configured from root `.env`, but Laravel
> connects using `backend/.env`.

Generate an app key if you don't have one:

```bash
docker compose -f docker-compose.prod.yml run --rm backend php artisan key:generate --show
# paste the value into backend/.env as APP_KEY=
```

## 2. Build & start

```bash
docker compose -f docker-compose.prod.yml --profile proxy up -d --build
```

The `backend` container runs migrations automatically on first boot. Verify:

```bash
docker compose -f docker-compose.prod.yml ps
curl -fsS https://api.watchsync.ai/up        # Laravel health → 200
```

To run without Caddy (e.g. behind an existing load balancer / host nginx), drop
`--profile proxy` and publish `frontend:3000` / `nginx:80` yourself.

## 3. Operations

```bash
# logs
docker compose -f docker-compose.prod.yml logs -f backend horizon

# one-off artisan
docker compose -f docker-compose.prod.yml exec backend php artisan tinker

# Horizon dashboard is served by the API at /horizon (gate-protected)

# update to a new release
git pull --ff-only
docker compose -f docker-compose.prod.yml --profile proxy up -d --build
docker image prune -f
```

Backups (run on a schedule):

```bash
docker compose -f docker-compose.prod.yml exec mysql \
  mysqldump -u root -p"$DB_ROOT_PASSWORD" watchsync > backup-$(date +%F).sql
```

## 4. Integrations & AI model (pre-go-live checklist)

These need real credentials/assets and end-to-end verification before launch:

- **eBay / Shopify / Gemini** — set live API keys in `backend/.env`, run a
  sandbox (then production) round-trip for each. `EBAY_ENVIRONMENT=production`.
- **SAM2 checkpoint** — the AI service expects the `ai-models` volume to contain
  `/app/models/sam2_hiera_small.pt`. Copy the checkpoint in, then verify the
  "AI enhance" flow:
  ```bash
  docker compose -f docker-compose.prod.yml cp \
    ./sam2_hiera_small.pt ai-service:/app/models/sam2_hiera_small.pt
  ```
  Without it the service runs in fallback mode.

## 5. CI/CD

`.github/workflows/ci.yml` lints + tests backend and frontend, then a
`docker-build` job builds all production images (with GitHub Actions cache) to
catch Dockerfile regressions — no push, no secrets required.

A commented `deploy` job template (SSH pull + `compose up -d --build`) is at the
bottom of the workflow. To enable it, add repository secrets `DEPLOY_HOST`,
`DEPLOY_USER`, `DEPLOY_SSH_KEY`, create a `production` environment, and uncomment
the job.
