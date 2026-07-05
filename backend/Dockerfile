# syntax=docker/dockerfile:1
# WatchSync AI — Backend (Laravel 13 / PHP 8.3) production image.
# Multi-target: `app` = PHP-FPM (serves via FastCGI, also runs Horizon/scheduler),
#               `web` = nginx serving public/ and proxying PHP to the app service.

########################  Stage 1 — composer dependencies  ####################
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
# Platform reqs (gd, redis, pcntl, intl) are validated in the app stage where the
# extensions actually exist, so ignore them here in the composer base image.
RUN composer install \
        --no-dev --no-scripts --no-autoloader \
        --prefer-dist --no-interaction --no-progress \
        --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

########################  Stage 2 — PHP-FPM application  ######################
FROM php:8.3-fpm-alpine AS app

# Runtime + build libraries for the required PHP extensions.
RUN set -eux; \
    apk add --no-cache \
        fcgi libpng libjpeg-turbo freetype libzip icu-libs oniguruma; \
    apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS libpng-dev libjpeg-turbo-dev freetype-dev libzip-dev \
        icu-dev oniguruma-dev linux-headers; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install -j"$(nproc)" \
        gd pdo_mysql bcmath zip intl pcntl mbstring opcache; \
    pecl install redis; \
    docker-php-ext-enable redis; \
    apk del .build-deps

WORKDIR /var/www/html

# Production PHP + OPcache tuning.
COPY docker/php/php-prod.ini /usr/local/etc/php/conf.d/zz-watchsync.ini
COPY docker/php/opcache.ini  /usr/local/etc/php/conf.d/zz-opcache.ini

# Application code with the optimized autoloader from the vendor stage.
COPY --from=vendor /app /var/www/html

# Laravel needs write access to storage + the compiled-view cache.
RUN chown -R www-data:www-data storage bootstrap/cache

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

USER www-data
EXPOSE 9000
ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]

########################  Stage 3 — nginx web server  ########################
FROM nginx:1.27-alpine AS web
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
# Static assets (public/) are served directly by nginx; PHP is proxied to `app`.
COPY --from=app /var/www/html/public /var/www/html/public
# Uploaded files live in the shared storage volume mounted at runtime.
RUN ln -sf /var/www/html/storage/app/public /var/www/html/public/storage
