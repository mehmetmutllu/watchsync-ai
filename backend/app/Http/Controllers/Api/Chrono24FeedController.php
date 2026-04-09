<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dealer;
use App\Services\Chrono24FeedService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class Chrono24FeedController extends Controller
{
    public function __construct(
        private readonly Chrono24FeedService $feedService,
    ) {}

    /**
     * Chrono24 XML Feed — IP Whitelist korumalı.
     *
     * GET /api/feeds/chrono24.xml?dealer_id={id}
     */
    public function __invoke(Request $request): Response
    {
        $request->validate([
            'dealer_id' => 'required|integer|exists:dealers,id',
        ]);

        $dealerId = (int) $request->input('dealer_id');
        $dealer = Dealer::findOrFail($dealerId);

        $xml = $this->feedService->generateFeed($dealer->id);

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=300',
        ]);
    }
}
