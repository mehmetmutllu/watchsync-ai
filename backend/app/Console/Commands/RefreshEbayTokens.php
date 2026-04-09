<?php

namespace App\Console\Commands;

use App\Models\Platform;
use App\Models\PlatformConnection;
use App\Services\EbayOAuthService;
use Illuminate\Console\Command;

class RefreshEbayTokens extends Command
{
    protected $signature = 'ebay:refresh-tokens';
    protected $description = 'Süresi dolmak üzere olan eBay access token\'larını yeniler.';

    public function handle(EbayOAuthService $ebayOAuth): int
    {
        $platform = Platform::where('name', 'eBay')->first();

        if (!$platform) {
            $this->info('eBay platform not found. Skipping.');
            return self::SUCCESS;
        }

        $connections = PlatformConnection::where('platform_id', $platform->id)
            ->where('status', 'connected')
            ->whereNotNull('refresh_token')
            ->get();

        $refreshed = 0;
        $failed = 0;

        foreach ($connections as $connection) {
            if (!$connection->isTokenExpiringSoon()) {
                continue;
            }

            $this->info("Refreshing token for dealer #{$connection->dealer_id}...");

            try {
                $ebayOAuth->refreshConnectionToken($connection);
                $refreshed++;
                $this->info("  ✓ Token refreshed successfully.");
            } catch (\Exception $e) {
                $failed++;
                $this->error("  ✗ Failed: {$e->getMessage()}");
            }
        }

        $this->info("Done. Refreshed: {$refreshed}, Failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
