# WatchSync AI — Production Deployment Rehberi (Non-Docker)

> **Hedef:** Tek bir VPS/sunucu üzerinde tüm servisleri çalıştırmak.  
> **Amaç:** Sadece API key'leri `.env` dosyalarına yazmak yeterli olsun.
>
> **Docker ile kurmak isterseniz** (tek komutla tüm stack): [`DEPLOYMENT.docker.md`](./DEPLOYMENT.docker.md) — `docker-compose.prod.yml`, çok aşamalı Dockerfile'lar ve Caddy otomatik-HTTPS.

---

## Sunucu Gereksinimleri

| Bileşen | Minimum |
|---|---|
| OS | Ubuntu 22.04 LTS / 24.04 LTS |
| RAM | 4 GB (8 GB önerilir, SAM 2 için) |
| Disk | 40 GB SSD |
| CPU | 2 vCPU |
| PHP | 8.5+ |
| Node.js | 22 LTS |
| Python | 3.10+ |
| MySQL | 8.4 |
| Redis | 7+ |
| Nginx | latest |
| Supervisor | latest |

---

## 1. Sunucu Hazırlığı

```bash
# Sistem güncelle
sudo apt update && sudo apt upgrade -y

# Temel paketler
sudo apt install -y curl git unzip supervisor ufw certbot python3-certbot-nginx
```

### 1.1 PHP 8.5 Kurulumu

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.5-fpm php8.5-cli php8.5-mysql php8.5-redis \
  php8.5-gd php8.5-bcmath php8.5-mbstring php8.5-xml php8.5-curl \
  php8.5-zip php8.5-intl php8.5-tokenizer

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 1.2 Node.js 22 Kurulumu

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2
```

### 1.3 Python 3.10+ & venv

```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 1.4 MySQL 8.4

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# DB ve kullanıcı oluştur
sudo mysql -e "CREATE DATABASE watchsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'watchsync'@'localhost' IDENTIFIED BY 'GÜÇLÜ_ŞİFRE_BURAYA';"
sudo mysql -e "GRANT ALL PRIVILEGES ON watchsync.* TO 'watchsync'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 1.5 Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

---

## 2. Proje Dosyalarını Yükle

```bash
# Proje dizini
sudo mkdir -p /var/www/watchsync
sudo chown $USER:www-data /var/www/watchsync

# Git ile çek (veya SCP/rsync ile yükle)
cd /var/www/watchsync
git clone https://github.com/YOUR_REPO/watchsync.git .
```

---

## 3. Backend (Laravel) Kurulumu

```bash
cd /var/www/watchsync/backend

# Bağımlılıklar
composer install --no-dev --optimize-autoloader

# .env dosyası
cp .env.example .env
nano .env   # ← API key'lerini ve DB bilgilerini yaz
```

### 3.1 Backend `.env` Production Ayarları

```env
APP_NAME=WatchSync
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.watchsync.ai

BCRYPT_ROUNDS=12

LOG_CHANNEL=daily
LOG_LEVEL=warning

# ── Database ──
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=watchsync
DB_USERNAME=watchsync
DB_PASSWORD=GÜÇLÜ_ŞİFRE_BURAYA

# ── Session (httpOnly cookie auth) ──
SESSION_DRIVER=database
SESSION_LIFETIME=1440
SESSION_DOMAIN=.watchsync.ai
SESSION_SECURE_COOKIE=true

# ── Cache & Queue ──
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ── Sanctum ──
SANCTUM_STATEFUL_DOMAINS=watchsync.ai,www.watchsync.ai

# ── CORS ──
FRONTEND_URL=https://watchsync.ai

# ── Mail (SMTP) ──
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@watchsync.ai
MAIL_PASSWORD=MAIL_ŞİFRE_BURAYA
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@watchsync.ai
MAIL_FROM_NAME=WatchSync

# ── Sentry ──
SENTRY_LARAVEL_DSN=https://xxx@sentry.io/yyy
SENTRY_TRACES_SAMPLE_RATE=0.1

# ── Gemini ──
GEMINI_API_KEY=

# ── eBay ──
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_REDIRECT_URI=https://api.watchsync.ai/api/ebay/callback
EBAY_ENVIRONMENT=production

# ── Shopify ──
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SHOP_DOMAIN=
SHOPIFY_API_VERSION=2024-01
SHOPIFY_WEBHOOK_SECRET=
```

```bash
# Key oluştur & migrate
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=BrandModelSeeder --force

# Cache & optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Storage link
php artisan storage:link

# İzinler
sudo chown -R $USER:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 4. Frontend (Next.js) Kurulumu

```bash
cd /var/www/watchsync/frontend

# Bağımlılıklar
npm ci --omit=dev

# .env.local dosyası
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://api.watchsync.ai/api
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/zzz
SENTRY_ORG=watchsync
SENTRY_PROJECT=watchsync-frontend
EOF

# Build
npm run build
```

### 4.1 PM2 ile Next.js Çalıştır

```bash
# ecosystem.config.js oluştur
cat > /var/www/watchsync/frontend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'watchsync-frontend',
    cwd: '/var/www/watchsync/frontend',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup   # ← Çıkan komutu çalıştır (sudo ...)
```

---

## 5. AI Service (FastAPI + Python) Kurulumu

```bash
cd /var/www/watchsync/ai-service

# Virtual environment
python3 -m venv venv
source venv/bin/activate

# Bağımlılıklar
pip install -r requirements.txt

# SAM 2 model dosyalarını indir (~375MB)
python scripts/download_model.py
```

### 5.1 Supervisor ile AI Service

```ini
# /etc/supervisor/conf.d/watchsync-ai.conf
[program:watchsync-ai]
command=/var/www/watchsync/ai-service/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 2
directory=/var/www/watchsync/ai-service
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/watchsync-ai.log
stdout_logfile_maxbytes=10MB
environment=PYTHONPATH="/var/www/watchsync/ai-service"
```

---

## 6. Laravel Queue Worker (Supervisor)

```ini
# /etc/supervisor/conf.d/watchsync-worker.conf
[program:watchsync-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/watchsync/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
directory=/var/www/watchsync/backend
user=www-data
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/supervisor/watchsync-worker.log
stdout_logfile_maxbytes=10MB
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

---

## 7. Nginx Yapılandırması

### 7.1 Backend API (api.watchsync.ai)

```nginx
# /etc/nginx/sites-available/watchsync-api
server {
    listen 80;
    server_name api.watchsync.ai;

    root /var/www/watchsync/backend/public;
    index index.php;

    # Güvenlik header'ları
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size (saat görselleri için)
    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Storage (saat görselleri)
    location /storage {
        alias /var/www/watchsync/backend/storage/app/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static dosyalara doğrudan erişimi engelle
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

### 7.2 Frontend (watchsync.ai)

```nginx
# /etc/nginx/sites-available/watchsync-frontend
server {
    listen 80;
    server_name watchsync.ai www.watchsync.ai;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static assets — uzun cache
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3 Nginx Aktifleştir & SSL

```bash
sudo ln -s /etc/nginx/sites-available/watchsync-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/watchsync-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Let's Encrypt SSL
sudo certbot --nginx -d watchsync.ai -d www.watchsync.ai -d api.watchsync.ai
```

---

## 8. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

---

## 9. Crontab (Laravel Scheduler)

```bash
# crontab -e
* * * * * cd /var/www/watchsync/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 10. Deployment Checklist

### İlk Kurulum
- [ ] Sunucu paketleri kuruldu (PHP, Node, Python, MySQL, Redis, Nginx)
- [ ] MySQL veritabanı ve kullanıcı oluşturuldu
- [ ] Proje dosyaları yüklendi (`/var/www/watchsync/`)
- [ ] Backend `.env` düzenlendi (DB, Mail, API key'ler)
- [ ] `php artisan key:generate` çalıştırıldı
- [ ] `php artisan migrate --force` çalıştırıldı
- [ ] `php artisan storage:link` çalıştırıldı
- [ ] İzinler ayarlandı (`storage/`, `bootstrap/cache/`)
- [ ] Frontend `.env.local` düzenlendi
- [ ] `npm run build` çalıştırıldı
- [ ] PM2 ile frontend başlatıldı
- [ ] AI Service venv kuruldu ve SAM 2 modeli indirildi
- [ ] Supervisor yapılandırmaları oluşturuldu (worker + ai-service)
- [ ] Nginx sites oluşturuldu ve aktifleştirildi
- [ ] SSL sertifikaları alındı (Certbot)
- [ ] UFW firewall açıldı
- [ ] Crontab ayarlandı

### Güncelleme (Deploy)
```bash
cd /var/www/watchsync
git pull origin main

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
sudo supervisorctl restart watchsync-worker:*

# Frontend
cd ../frontend
npm ci --omit=dev
npm run build
pm2 restart watchsync-frontend

# AI Service (gerekirse)
cd ../ai-service
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart watchsync-ai
```

---

## 11. Sağlık Kontrolü

Sistemi doğrulamak için:

```bash
# Backend health
curl https://api.watchsync.ai/api/health
curl https://api.watchsync.ai/api/health/db
curl https://api.watchsync.ai/api/health/redis

# Frontend
curl -I https://watchsync.ai

# AI Service (dahili — sadece backend erişir)
curl http://127.0.0.1:8001/health

# Log kontrol
sudo supervisorctl status
pm2 status
tail -f /var/www/watchsync/backend/storage/logs/laravel.log
```

---

## Dil Desteği (i18n) — Üretim Notları

Uygulama dört dili destekler: **Türkçe (tr), Almanca (de), İngilizce (en), Arapça (ar)**.
Arapça sağdan-sola (RTL) çalışır; `<html dir="rtl">` ve mantıksal Tailwind yardımcıları
(`ms-/me-/ps-/pe-/start-/end-/text-start`) ile düzen otomatik aynalanır.

### Ülkeye göre otomatik dil seçimi

`src/middleware.ts` ziyaretçinin dilini şu sırayla belirler:

1. `NEXT_LOCALE` çerezi — kullanıcı bilinçli seçim yaptıysa buna dokunulmaz.
2. URL'deki dil öneki (`/tr/...`, `/ar/...`).
3. **Ülke** — reverse proxy / CDN başlığı, yoksa IP sorgusu.
4. `Accept-Language` başlığı.
5. Varsayılan dil (`en`).

Ülke → dil eşlemesi `src/i18n/config.ts` içindedir
(TR → tr · DE/AT/CH/LI/LU → de · 24 Arap ülkesi → ar · diğerleri → en).

#### En hızlı yol: nginx GeoIP2 ile başlık üretmek

Kendi sunucunuzda çalıştığınız için başlık üretmek IP sorgusundan çok daha hızlıdır.
`nginx` GeoIP2 modülüyle:

```nginx
# http bloğu
geoip2 /etc/nginx/geoip/GeoLite2-Country.mmdb {
    auto_reload 5m;
    $geoip2_country_code country iso_code;
}

# server / location bloğu — Next.js'e ilet
proxy_set_header X-Geo-Country $geoip2_country_code;
proxy_set_header X-Real-IP     $remote_addr;
```

Middleware `X-Geo-Country` başlığını doğrudan kullanır; ayrıca Cloudflare
(`cf-ipcountry`), Vercel, AWS CloudFront, Fastly ve Akamai başlıklarını da tanır.

#### Başlık yoksa: IP → ülke sorgusu

Başlık gelmezse middleware, anahtar gerektirmeyen HTTPS sağlayıcılara
(geojs.io, ipwho.is) tek bir sorgu atar. Sonuç 24 saat bellekte ve 30 gün
`WS_COUNTRY` çerezinde saklanır; yani sorgu yalnızca ilk ziyarette çalışır.

Ortam değişkenleri:

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `GEO_IP_LOOKUP` | (açık) | `off` yazılırsa IP sorgusu tamamen kapanır. |
| `GEO_LOOKUP_TIMEOUT_MS` | `1200` | Sağlayıcı zaman aşımı (ms). |

> Yerel/özel IP'ler (127.x, 10.x, 192.168.x …) sorgulanmaz — geliştirmede
> doğrudan `Accept-Language`'a düşülür.

### Backend (Laravel)

Frontend her API isteğinde `X-Locale` başlığı gönderir; `App\Http\Middleware\SetLocale`
bunu okuyup `App::setLocale()` uygular. Doğrulama mesajları ve bildirim e-postaları
`backend/lang/{tr,de,en,ar}/` altındaki dosyalardan gelir. Kullanıcı ve davetlerde
`locale` sütunu tutulur; e-postalar alıcının kendi dilinde gönderilir.

Yeni kurulumda migration çalıştırmayı unutmayın:

```bash
php artisan migrate    # users.locale, invitations.locale, customers.locale
```

### Çeviri katalogları

`frontend/messages/{tr,de,en,ar}.json` — dört dosya da aynı anahtar kümesine sahip
olmalıdır. Doğrulamak için:

```bash
cd frontend && npm run i18n:check
```

Script; eksik/fazla anahtarları, boş değerleri ve ICU değişken uyuşmazlıklarını
(`{name}`, `{count}`) hata olarak raporlar, çevrilmemiş görünen değerleri uyarı olarak listeler.

> **Dil eklerken:** `src/i18n/config.ts` (locales + ülke eşlemesi),
> `messages/<yeni>.json` ve `src/middleware.ts` içindeki **statik** `matcher`
> satırı birlikte güncellenmelidir.
