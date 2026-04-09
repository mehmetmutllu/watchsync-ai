<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private string $baseUrl;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.base_url');
        $this->timeout = config('services.ai.timeout', 120);
    }

    /**
     * Segment a watch from its image using SAM 2.
     */
    public function segment(UploadedFile|string $image, float $pointX = 0.5, float $pointY = 0.5): array
    {
        $response = $this->sendMultipart('/api/ai/segment', $image, [
            'point_x' => $pointX,
            'point_y' => $pointY,
        ]);

        return $response->json();
    }

    /**
     * Replace the background of an RGBA image.
     */
    public function replaceBackground(
        UploadedFile|string $image,
        string $preset = 'white_studio',
        bool $shadow = true,
        ?UploadedFile $customBackground = null,
    ): array {
        $fields = [
            'preset' => $preset,
            'shadow' => $shadow ? 'true' : 'false',
        ];

        $attachments = [];
        if ($customBackground) {
            $attachments['custom_background'] = $customBackground;
        }

        $response = $this->sendMultipart('/api/ai/replace-background', $image, $fields, $attachments);

        return $response->json();
    }

    /**
     * Full enhance pipeline: segment + generate multiple background variants.
     */
    public function enhance(UploadedFile|string $image, float $pointX = 0.5, float $pointY = 0.5, bool $shadow = true): array
    {
        $response = $this->sendMultipart('/api/ai/enhance', $image, [
            'point_x' => $pointX,
            'point_y' => $pointY,
            'shadow'  => $shadow ? 'true' : 'false',
        ]);

        return $response->json();
    }

    /**
     * Check AI service health.
     */
    public function health(): array
    {
        $response = Http::timeout(5)
            ->baseUrl($this->baseUrl)
            ->get('/api/ai/health');

        return $response->json();
    }

    /**
     * Convert AI service relative URLs to absolute URLs accessible from the host.
     */
    public function resolveUrl(string $relativePath): string
    {
        return rtrim($this->baseUrl, '/') . '/' . ltrim($relativePath, '/');
    }

    /**
     * Send a multipart request to the AI service.
     */
    private function sendMultipart(
        string $endpoint,
        UploadedFile|string $image,
        array $fields = [],
        array $extraFiles = [],
    ): Response {
        $request = Http::timeout($this->timeout)
            ->baseUrl($this->baseUrl);

        // Attach main image
        if ($image instanceof UploadedFile) {
            $request = $request->attach(
                'image',
                $image->get(),
                $image->getClientOriginalName(),
            );
        } else {
            // Path to a file on disk
            $request = $request->attach(
                'image',
                file_get_contents($image),
                basename($image),
            );
        }

        // Attach extra files
        foreach ($extraFiles as $name => $file) {
            if ($file instanceof UploadedFile) {
                $request = $request->attach(
                    $name,
                    $file->get(),
                    $file->getClientOriginalName(),
                );
            }
        }

        $response = $request->post($endpoint, $fields);

        if ($response->failed()) {
            Log::error("AI Service request failed", [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);

            $response->throw();
        }

        return $response;
    }
}
