#!/bin/sh
# WatchSync AI — backend container entrypoint.
# Rebuilds the framework caches against the runtime environment, optionally runs
# migrations (only on the container that sets RUN_MIGRATIONS=true), then execs
# the requested command (php-fpm, horizon, or the scheduler).
set -e

# Ensure the shared storage volume has Laravel's expected sub-directories. When a
# fresh named volume is mounted over storage/, these may be missing.
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

# Rebuild caches for the current environment (config values come from env at
# runtime, so this cannot be baked into the image).
php artisan config:cache
php artisan event:cache || true
php artisan route:cache || true
php artisan view:cache || true

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "[entrypoint] Running database migrations..."
    php artisan migrate --force
fi

exec "$@"
