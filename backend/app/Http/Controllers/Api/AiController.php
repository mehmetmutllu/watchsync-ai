<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Watch;
use App\Services\AiService;
use App\Services\LlmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function __construct(
        private readonly AiService $aiService,
        private readonly LlmService $llmService,
    ) {}

    /**
     * POST /api/watches/{id}/ai-enhance
     *
     * Upload an image and run the full AI enhance pipeline.
     */
    public function enhance(Request $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $request->validate([
            'image'   => 'required|image|mimes:jpeg,png,webp|max:20480',
            'point_x' => 'nullable|numeric|min:0|max:1',
            'point_y' => 'nullable|numeric|min:0|max:1',
        ]);

        $pointX = (float) $request->input('point_x', 0.5);
        $pointY = (float) $request->input('point_y', 0.5);

        try {
            $result = $this->aiService->enhance(
                image: $request->file('image'),
                pointX: $pointX,
                pointY: $pointY,
            );

            // Resolve relative URLs to absolute AI service URLs
            $result['original_url'] = $this->aiService->resolveUrl($result['original_url']);
            $result['rgba_url'] = $this->aiService->resolveUrl($result['rgba_url']);

            foreach ($result['results'] as &$variant) {
                $variant['result_url'] = $this->aiService->resolveUrl($variant['result_url']);
                $variant['original_url'] = $this->aiService->resolveUrl($variant['original_url']);
            }

            return response()->json([
                'message' => 'AI enhance completed successfully.',
                'data'    => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('AI enhance proxy failed', [
                'watch_id' => $id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'AI service is currently unavailable. Please try again later.',
            ], 503);
        }
    }

    /**
     * POST /api/ai/segment
     *
     * Proxy: segment a watch image.
     */
    public function segment(Request $request): JsonResponse
    {
        $request->validate([
            'image'   => 'required|image|mimes:jpeg,png,webp|max:20480',
            'point_x' => 'nullable|numeric|min:0|max:1',
            'point_y' => 'nullable|numeric|min:0|max:1',
        ]);

        try {
            $result = $this->aiService->segment(
                image: $request->file('image'),
                pointX: (float) $request->input('point_x', 0.5),
                pointY: (float) $request->input('point_y', 0.5),
            );

            $result['mask_url'] = $this->aiService->resolveUrl($result['mask_url']);
            $result['rgba_url'] = $this->aiService->resolveUrl($result['rgba_url']);

            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            Log::error('AI segment proxy failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI service unavailable.'], 503);
        }
    }

    /**
     * POST /api/ai/replace-background
     *
     * Proxy: replace background of an RGBA image.
     */
    public function replaceBackground(Request $request): JsonResponse
    {
        $request->validate([
            'image'             => 'required|image|mimes:png|max:20480',
            'preset'            => 'nullable|string|in:white_studio,black_velvet,marble,gradient_gray',
            'shadow'            => 'nullable|boolean',
            'custom_background' => 'nullable|image|mimes:jpeg,png,webp|max:20480',
        ]);

        try {
            $result = $this->aiService->replaceBackground(
                image: $request->file('image'),
                preset: $request->input('preset', 'white_studio'),
                shadow: (bool) $request->input('shadow', true),
                customBackground: $request->file('custom_background'),
            );

            $result['result_url'] = $this->aiService->resolveUrl($result['result_url']);
            $result['original_url'] = $this->aiService->resolveUrl($result['original_url']);

            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            Log::error('AI replace-background proxy failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI service unavailable.'], 503);
        }
    }

    /**
     * GET /api/ai/health
     */
    public function health(): JsonResponse
    {
        try {
            $result = $this->aiService->health();
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'status'       => 'unavailable',
                'model_loaded' => false,
                'error'        => $e->getMessage(),
            ], 503);
        }
    }

    /**
     * POST /api/customers/{id}/generate-pitch
     *
     * Generates an AI sales pitch (WhatsApp message) for a matched watch.
     */
    public function generatePitch(Request $request, int $id): JsonResponse
    {
        $customer = \App\Models\Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'watch_id' => 'required|integer|exists:watches,id',
            'language' => 'sometimes|string|in:en,de,tr',
        ]);

        $watch = \App\Models\Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($validated['watch_id']);

        $language = $validated['language'] ?? 'en';

        try {
            $pitch = $this->llmService->generatePitchMessage($customer, $watch, $language);

            return response()->json([
                'data' => [
                    'pitch' => $pitch,
                    'language' => $language,
                    'watch_id' => $watch->id,
                    'customer_id' => $customer->id,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('AI generatePitch failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI service unavailable.'], 503);
        }
    }

    /**
     * POST /api/customers/{id}/generate-birthday-pitch
     *
     * Generates an AI birthday message with watch suggestions.
     */
    public function generateBirthdayPitch(Request $request, int $id): JsonResponse
    {
        $customer = \App\Models\Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'language' => 'sometimes|string|in:en,de,tr',
            'include_watches' => 'sometimes|boolean'
        ]);

        $language = $validated['language'] ?? 'en';
        $includeWatches = $validated['include_watches'] ?? true;
        
        $watches = [];
        if ($includeWatches) {
            // Find watches matching desired_watch or just some random premium watches
            $query = \App\Models\Watch::where('dealer_id', $request->user()->dealer_id)
                ->where('status', 'available');
                
            $desiredWatch = $customer->metadata['desired_watch'] ?? null;
            if ($desiredWatch) {
                // Try to match
                $parts = explode(' ', $desiredWatch);
                $query->where(function($q) use ($parts) {
                    foreach ($parts as $part) {
                        $q->orWhere('brand', 'like', "%{$part}%")
                          ->orWhere('model', 'like', "%{$part}%");
                    }
                });
            }
            
            // Get up to 3 watches
            $watches = $query->inRandomOrder()->take(3)->get()->toArray();
        }

        try {
            $pitch = $this->llmService->generateBirthdayEmail($customer, $watches, $language);

            return response()->json([
                'data' => [
                    'pitch' => $pitch,
                    'language' => $language,
                    'watches' => $watches,
                    'customer_id' => $customer->id,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('AI generateBirthdayPitch failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI service unavailable.'], 503);
        }
    }

    /**
     * POST /api/customers/{id}/sentiment
     *
     * Analyzes customer notes to generate a sentiment and preferences summary.
     */
    public function sentiment(Request $request, int $id): JsonResponse
    {
        $customer = \App\Models\Customer::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $language = $request->input('language', 'de');

        try {
            $sentiment = $this->llmService->analyzeCustomerSentiment($customer, $language);

            return response()->json([
                'data' => [
                    'sentiment' => $sentiment,
                    'customer_id' => $customer->id,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('AI customer sentiment failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI service unavailable.'], 503);
        }
    }
}
