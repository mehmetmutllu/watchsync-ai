@echo off
REM ============================================================
REM  WatchSync AI - Dev baslatici (XAMPP ortami, PHP 8.3)
REM  Iki ayri pencere acar: Backend (8000) + Frontend (3000)
REM  PATH sadece bu pencerelerde ayarlanir; sistem PATH'i
REM  degismez, diger XAMPP projen etkilenmez.
REM ============================================================

echo WatchSync AI dev sunuculari baslatiliyor...
echo   Backend : http://127.0.0.1:8001
echo   Frontend: http://localhost:3000
echo   (MySQL: XAMPP MariaDB - port 3307)
echo.

start "WatchSync Backend (8000)" cmd /k "set PATH=C:\php83;%PATH% & cd /d %~dp0backend & php artisan serve --host=127.0.0.1 --port=8001"

start "WatchSync Frontend (3000)" cmd /k "cd /d %~dp0frontend & npm run dev"

echo Iki pencere acildi. Kapatmak icin pencerelerde Ctrl+C.
