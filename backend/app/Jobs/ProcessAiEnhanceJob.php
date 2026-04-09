<?php

namespace App\Jobs;

use App\Models\Watch;
use App\Services\AiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessAiEnhanceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public array $backoff = [10, 60];
    public int $timeout = 180;

    public function __construct(
        public Watch $watch,
        public string $imagePath,
        public float $pointX = 0.5,
        public float $pointY = 0.5,
    ) {}

    public function handle(AiService $aiService): void
    {
        Log::info("Processing AI enhance for watch #{$this->watch->id}");

        try {
            $result = $aiService->enhance(
                image: storage_path("app/{$this->imagePath}"),
                pointX: $this->pointX,
                pointY: $this->pointY,
            );

            Log::info("AI enhance completed for watch #{$this->watch->id}", [
                'original_url' => $result['original_url'] ?? null,
                'variants'     => count($result['results'] ?? []),
            ]);
        } catch (\Throwable $e) {
            Log::error("AI enhance failed for watch #{$this->watch->id}", [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
