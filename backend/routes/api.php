<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Chrono24FeedController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DescriptionController;
use App\Http\Controllers\Api\EbayController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MarketController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TeamController;
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

        // Email verification
        Route::get('/email/verification-status', [EmailVerificationController::class, 'status']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:3,1');
        Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
            ->middleware('signed')
            ->name('verification.verify');
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

// Davet kabul akışı — public, token ile; brute-force koruması için throttle
Route::middleware('throttle:20,1')->group(function () {
    Route::get('/invitations/{token}', [InvitationController::class, 'show']);
    Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/activities', [DashboardController::class, 'activities']);

    // Bulk operations — düşük limit (must be before {id} routes)
    Route::middleware('throttle:bulk-operations')->group(function () {
        Route::post('/watches/bulk-publish', [PlatformController::class, 'bulkPublish'])
            ->middleware('permission:inventory.publish');
    });
    Route::get('/watches/bulk-publish/{batchId}/status', [PlatformController::class, 'bulkPublishStatus'])
        ->middleware('permission:inventory.publish');

    // Watch CRUD — yazma işlemleri ayrı limit
    Route::get('/watches', [WatchController::class, 'index'])->middleware('permission:inventory.view');
    Route::middleware('throttle:inventory-write')->group(function () {
        Route::post('/watches', [WatchController::class, 'store'])->middleware('permission:inventory.create');
        Route::put('/watches/{id}', [WatchController::class, 'update'])->middleware('permission:inventory.edit');
        Route::delete('/watches/{id}', [WatchController::class, 'destroy'])->middleware('permission:inventory.delete');
        Route::patch('/watches/{id}/status', [WatchController::class, 'updateStatus'])->middleware('permission:inventory.edit');
        Route::post('/watches/{id}/images', [WatchController::class, 'uploadImages'])->middleware('permission:inventory.edit');
        Route::delete('/watches/{watchId}/images/{imageId}', [WatchController::class, 'deleteImage'])->middleware('permission:inventory.edit');
        Route::post('/watches/{id}/ai-process', [WatchController::class, 'aiProcess'])->middleware('permission:ai.use');
        Route::put('/watches/{id}/ai-results', [WatchController::class, 'aiResults'])->middleware('permission:ai.use');
        Route::post('/watches/{id}/publish', [WatchController::class, 'publish'])->middleware('permission:inventory.publish');
    });
    Route::get('/watches/{id}', [WatchController::class, 'show'])->middleware('permission:inventory.view');
    Route::get('/watches/{id}/ai-status', [WatchController::class, 'aiStatus'])->middleware('permission:inventory.view');

    // Platform management — senkronizasyon limiti
    Route::get('/platforms', [PlatformController::class, 'index'])->middleware('permission:platforms.manage');
    Route::middleware('throttle:platform-sync')->group(function () {
        Route::put('/platforms/{id}/credentials', [PlatformController::class, 'updateCredentials'])->middleware('permission:platforms.manage');
        Route::post('/platforms/{id}/disconnect', [PlatformController::class, 'disconnect'])->middleware('permission:platforms.manage');
        Route::post('/platforms/{id}/test-connection', [PlatformController::class, 'testConnection'])->middleware('permission:platforms.manage');
        Route::post('/watches/{watchId}/platforms/{platformId}/toggle', [PlatformController::class, 'toggleSync'])->middleware('permission:inventory.publish');
    });

    // eBay OAuth
    Route::get('/ebay/auth-url', [EbayController::class, 'authUrl'])->middleware('permission:platforms.manage');
    Route::post('/ebay/disconnect', [EbayController::class, 'disconnect'])->middleware('permission:platforms.manage');

    // Watch sync status
    Route::get('/watches/{watchId}/sync-status', [PlatformController::class, 'syncStatus'])->middleware('permission:inventory.view');

    // Notifications
    Route::get('/notifications', [DashboardController::class, 'notifications']);
    Route::post('/notifications/read-all', [DashboardController::class, 'markAllNotificationsRead']);
    Route::post('/notifications/{id}/read', [DashboardController::class, 'markNotificationRead']);

    // Ekip Yönetimi — yalnızca owner || team.manage
    Route::middleware('permission:team.manage')->group(function () {
        Route::get('/team', [TeamController::class, 'index']);
        Route::get('/team/permissions', [TeamController::class, 'permissions']);
        Route::post('/team/invitations', [TeamController::class, 'storeInvitation']);
        Route::post('/team/invitations/{invitation}/resend', [TeamController::class, 'resendInvitation']);
        Route::delete('/team/invitations/{invitation}', [TeamController::class, 'destroyInvitation']);
        Route::put('/team/members/{user}/permissions', [TeamController::class, 'updateMemberPermissions']);
        Route::put('/team/members/{user}/role', [TeamController::class, 'updateMemberRole']);
        Route::post('/team/members/{user}/disable', [TeamController::class, 'disableMember']);
        Route::post('/team/members/{user}/enable', [TeamController::class, 'enableMember']);
        Route::delete('/team/members/{user}', [TeamController::class, 'destroyMember']);

        // Ekip davet varsayılanları
        Route::get('/settings/team-defaults', [SettingsController::class, 'getTeamDefaults']);
        Route::put('/settings/team-defaults', [SettingsController::class, 'updateTeamDefaults']);
    });

    // Customer CRM
    Route::middleware('permission:crm.view')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/stats', [CustomerController::class, 'stats']);
        Route::get('/customers/upcoming-birthdays', [CustomerController::class, 'upcomingBirthdays']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::get('/customers/{id}/timeline', [CustomerController::class, 'timeline']);
        Route::get('/customers/{id}/matches', [CustomerController::class, 'matches']);
    });
    Route::middleware('permission:crm.manage')->group(function () {
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
        Route::post('/customers/{id}/notes', [CustomerController::class, 'storeNote']);
        Route::delete('/customers/{customerId}/notes/{noteId}', [CustomerController::class, 'destroyNote']);
    });

    // Invoices
    Route::middleware('permission:invoices.view')->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::middleware('throttle:downloads')->group(function () {
            Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
        });
    });
    Route::middleware('permission:invoices.manage')->group(function () {
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
        Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);
        Route::post('/invoices/{id}/send', [InvoiceController::class, 'send']);
    });

    // Settings — düşük limit
    Route::middleware('throttle:settings')->group(function () {
        Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
        Route::put('/settings/password', [SettingsController::class, 'changePassword']);
        Route::middleware('permission:settings.manage')->group(function () {
            Route::put('/settings/company', [SettingsController::class, 'updateCompany']);
            Route::get('/settings/notifications', [SettingsController::class, 'getNotifications']);
            Route::put('/settings/notifications', [SettingsController::class, 'updateNotifications']);
        });
    });

    // AI Service
    Route::middleware('permission:ai.use')->group(function () {
        Route::post('/watches/{id}/ai-enhance', [AiController::class, 'enhance']);
        Route::post('/ai/segment', [AiController::class, 'segment']);
        Route::post('/ai/replace-background', [AiController::class, 'replaceBackground']);
        Route::get('/ai/health', [AiController::class, 'health']);

        // AI Text Generation
        Route::post('/ai/generate-description', [DescriptionController::class, 'generate']);
        Route::post('/watches/{id}/generate-description', [DescriptionController::class, 'generateForWatch']);
        Route::post('/customers/{id}/generate-pitch', [AiController::class, 'generatePitch']);
        Route::post('/customers/{id}/generate-birthday-pitch', [AiController::class, 'generateBirthdayPitch']);
        Route::post('/customers/{id}/sentiment', [AiController::class, 'sentiment']);
    });

    // Market Scanner
    Route::middleware('permission:market.view')->group(function () {
        Route::get('/market/ebay-test', [MarketController::class, 'ebayTest']);
        Route::get('/market/prices/{ref}', [MarketController::class, 'prices']);
        Route::get('/market/competitors/{ref}', [MarketController::class, 'competitors']);
        Route::get('/market/watchcharts-trend/{ref}', [MarketController::class, 'watchChartsTrend']);
        Route::post('/market/scan', [MarketController::class, 'scan']);

        // Price Alerts
        Route::get('/price-alerts', [MarketController::class, 'alertIndex']);
        Route::post('/price-alerts', [MarketController::class, 'alertStore']);
        Route::delete('/price-alerts/{id}', [MarketController::class, 'alertDestroy']);
    });
});

// ─── Admin Panel API ────────────────────────────────────────────────

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminFeedbackController;
use App\Http\Controllers\Api\Admin\AdminWatchController;
use App\Http\Controllers\Api\Admin\ContractController as AdminContractController;
use App\Http\Controllers\Api\Admin\ManagerController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\SystemSettingController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\ContractPublicController;
use App\Http\Controllers\Api\FeedbackController;

// Admin auth — login CSRF-exempt ve throttle'lı
Route::prefix('admin/auth')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:5,1');
});

// Admin korumalı rotalar
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
    Route::get('/auth/me', [AdminAuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
    Route::get('/dashboard/revenue-chart', [AdminDashboardController::class, 'revenueChart']);
    Route::get('/dashboard/recent-activities', [AdminDashboardController::class, 'recentActivities']);
    Route::get('/dashboard/user-growth', [AdminDashboardController::class, 'userGrowth']);

    // Manager CRUD — sadece admin ve super_admin
    Route::middleware('admin:super_admin,admin')->group(function () {
        Route::get('/roles', [ManagerController::class, 'roles']);
        Route::get('/managers', [ManagerController::class, 'index']);
        Route::post('/managers', [ManagerController::class, 'store']);
        Route::put('/managers/{id}', [ManagerController::class, 'update']);
        Route::delete('/managers/{id}', [ManagerController::class, 'destroy']);
    });

    // C: Kullanıcı Yönetimi
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::put('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
    Route::post('/users/{id}/reset-password', [AdminUserController::class, 'resetPassword']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    Route::get('/users/{id}/watches', [AdminUserController::class, 'watches']);

    // D: Saat Doğrulama
    Route::get('/watches', [AdminWatchController::class, 'index']);
    Route::get('/watches/flagged', [AdminWatchController::class, 'flagged']);
    Route::get('/watches/{id}', [AdminWatchController::class, 'show']);
    Route::put('/watches/{id}/validate', [AdminWatchController::class, 'validateWatch']);

    // E: Gelir Raporları
    Route::get('/reports/revenue', [ReportController::class, 'revenue']);
    Route::get('/reports/commissions', [ReportController::class, 'commissions']);
    Route::get('/reports/export', [ReportController::class, 'export']);

    // F: Feedback Yönetimi (Admin)
    Route::get('/feedbacks/stats', [AdminFeedbackController::class, 'stats']);
    Route::get('/feedbacks', [AdminFeedbackController::class, 'index']);
    Route::get('/feedbacks/{id}', [AdminFeedbackController::class, 'show']);
    Route::put('/feedbacks/{id}', [AdminFeedbackController::class, 'update']);

    // G: Sözleşme Yönetimi (Admin)
    Route::get('/contracts', [AdminContractController::class, 'index']);
    Route::post('/contracts', [AdminContractController::class, 'store']);
    Route::put('/contracts/{id}', [AdminContractController::class, 'update']);
    Route::post('/contracts/{id}/publish', [AdminContractController::class, 'publish']);
    Route::get('/contracts/{id}/acceptances', [AdminContractController::class, 'acceptances']);

    // H: Sistem Ayarları
    Route::get('/settings', [SystemSettingController::class, 'index']);
    Route::put('/settings', [SystemSettingController::class, 'update']);
    Route::get('/system/health', [SystemSettingController::class, 'health']);
});

// ─── Feedback (Kullanıcı — auth opsiyonel POST, auth zorunlu GET) ───
Route::post('/feedbacks', [FeedbackController::class, 'store'])->middleware('throttle:5,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/feedbacks/mine', [FeedbackController::class, 'mine']);
});

// ─── Sözleşmeler (Public + Auth) ────────────────────────────────────
Route::get('/contracts/active', [ContractPublicController::class, 'active']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/contracts/{id}/accept', [ContractPublicController::class, 'accept']);
    Route::get('/contracts/pending', [ContractPublicController::class, 'pending']);
});
Route::get('/contracts/{slug}', [ContractPublicController::class, 'show']);
