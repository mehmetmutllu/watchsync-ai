<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Chrono24FeedController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DescriptionController;
use App\Http\Controllers\Api\EbayController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MarketController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\WatchController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ─── Health Check (auth gerektirmez) ────────────────────────────────
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'index']);
    Route::get('/db', [HealthController::class, 'database']);
    Route::get('/redis', [HealthController::class, 'redis']);
    Route::get('/queue', [HealthController::class, 'queue']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Chrono24 XML Feed — IP Whitelist korumalı, auth gerektirmez
Route::get('/feeds/chrono24.xml', Chrono24FeedController::class)
    ->middleware('ip.whitelist:chrono24');

// eBay OAuth callback — auth gerektirmez (eBay bu URL'e yönlendirir)
Route::get('/ebay/callback', [EbayController::class, 'callback']);

// Webhook endpoints — platform imza doğrulaması ile korunur
Route::prefix('webhooks')->middleware('throttle:30,1')->group(function () {
    Route::post('/ebay', [WebhookController::class, 'ebay']);
    Route::post('/shopify', [WebhookController::class, 'shopify']);
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/activities', [DashboardController::class, 'activities']);

    // Bulk operations — düşük limit (must be before {id} routes)
    Route::middleware('throttle:bulk-operations')->group(function () {
        Route::post('/watches/bulk-publish', [PlatformController::class, 'bulkPublish']);
    });
    Route::get('/watches/bulk-publish/{batchId}/status', [PlatformController::class, 'bulkPublishStatus']);

    // Watch CRUD — yazma işlemleri ayrı limit
    Route::get('/watches', [WatchController::class, 'index']);
    Route::middleware('throttle:inventory-write')->group(function () {
        Route::post('/watches', [WatchController::class, 'store']);
        Route::put('/watches/{id}', [WatchController::class, 'update']);
        Route::delete('/watches/{id}', [WatchController::class, 'destroy']);
        Route::patch('/watches/{id}/status', [WatchController::class, 'updateStatus']);
        Route::post('/watches/{id}/images', [WatchController::class, 'uploadImages']);
        Route::delete('/watches/{watchId}/images/{imageId}', [WatchController::class, 'deleteImage']);
    });
    Route::get('/watches/{id}', [WatchController::class, 'show']);

    // Platform management — senkronizasyon limiti
    Route::get('/platforms', [PlatformController::class, 'index']);
    Route::middleware('throttle:platform-sync')->group(function () {
        Route::put('/platforms/{id}/credentials', [PlatformController::class, 'updateCredentials']);
        Route::post('/platforms/{id}/disconnect', [PlatformController::class, 'disconnect']);
        Route::post('/watches/{watchId}/platforms/{platformId}/toggle', [PlatformController::class, 'toggleSync']);
    });

    // eBay OAuth
    Route::get('/ebay/auth-url', [EbayController::class, 'authUrl']);
    Route::post('/ebay/disconnect', [EbayController::class, 'disconnect']);

    // Watch sync status
    Route::get('/watches/{watchId}/sync-status', [PlatformController::class, 'syncStatus']);

    // Notifications
    Route::get('/notifications', [DashboardController::class, 'notifications']);
    Route::post('/notifications/read-all', [DashboardController::class, 'markAllNotificationsRead']);
    Route::post('/notifications/{id}/read', [DashboardController::class, 'markNotificationRead']);

    // Customer CRM
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::post('/customers/{id}/notes', [CustomerController::class, 'storeNote']);
    Route::delete('/customers/{customerId}/notes/{noteId}', [CustomerController::class, 'destroyNote']);

    // Invoices
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
    Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);
    Route::middleware('throttle:downloads')->group(function () {
        Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
    });
    Route::post('/invoices/{id}/send', [InvoiceController::class, 'send']);

    // Settings — düşük limit
    Route::middleware('throttle:settings')->group(function () {
        Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
        Route::put('/settings/password', [SettingsController::class, 'changePassword']);
        Route::put('/settings/company', [SettingsController::class, 'updateCompany']);
        Route::get('/settings/notifications', [SettingsController::class, 'getNotifications']);
        Route::put('/settings/notifications', [SettingsController::class, 'updateNotifications']);
    });

    // AI Service
    Route::post('/watches/{id}/ai-enhance', [AiController::class, 'enhance']);
    Route::post('/ai/segment', [AiController::class, 'segment']);
    Route::post('/ai/replace-background', [AiController::class, 'replaceBackground']);
    Route::get('/ai/health', [AiController::class, 'health']);

    // AI Text Generation
    Route::post('/ai/generate-description', [DescriptionController::class, 'generate']);
    Route::post('/watches/{id}/generate-description', [DescriptionController::class, 'generateForWatch']);

    // Market Scanner
    Route::get('/market/prices/{ref}', [MarketController::class, 'prices']);
    Route::get('/market/competitors/{ref}', [MarketController::class, 'competitors']);
    Route::post('/market/scan', [MarketController::class, 'scan']);

    // Price Alerts
    Route::get('/price-alerts', [MarketController::class, 'alertIndex']);
    Route::post('/price-alerts', [MarketController::class, 'alertStore']);
    Route::delete('/price-alerts/{id}', [MarketController::class, 'alertDestroy']);
});
