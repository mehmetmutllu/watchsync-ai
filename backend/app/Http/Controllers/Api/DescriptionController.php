<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LlmService;
use App\Models\Watch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DescriptionController extends Controller
{
    public function __construct(
        private LlmService $llmService,
    ) {}

    /**
     * POST /api/ai/generate-description
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference_number' => 'required|string|max:100',
            'brand' => 'required|string|max:100',
            'model_name' => 'required|string|max:200',
            'language' => 'sometimes|in:en,de,tr',
            'specs' => 'sometimes|array',
            'specs.year' => 'sometimes|string',
            'specs.condition' => 'sometimes|string',
            'specs.case_material' => 'sometimes|string',
            'specs.movement' => 'sometimes|string',
            'specs.dial_color' => 'sometimes|string',
            'specs.case_size' => 'sometimes|string',
            'specs.box_papers' => 'sometimes|string',
        ]);

        $description = $this->llmService->generateDescription(
            referenceNumber: $validated['reference_number'],
            brand: $validated['brand'],
            modelName: $validated['model_name'],
            language: $validated['language'] ?? 'en',
            specs: $validated['specs'] ?? [],
        );

        return response()->json([
            'data' => [
                'description' => $description,
                'language' => $validated['language'] ?? 'en',
                'reference_number' => $validated['reference_number'],
            ],
        ]);
    }

    /**
     * POST /api/watches/{id}/generate-description
     */
    public function generateForWatch(Request $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $language = $request->input('language', 'en');

        if (!in_array($language, ['en', 'de', 'tr'])) {
            $language = 'en';
        }

        $specs = array_filter([
            'year' => $watch->year ? (string) $watch->year : null,
            'condition' => $watch->condition,
            'case_material' => $watch->features['case_material'] ?? null,
            'movement' => $watch->features['movement'] ?? null,
            'dial_color' => $watch->features['dial_color'] ?? null,
            'case_size' => $watch->features['case_diameter'] ?? null,
            'box_papers' => $watch->features['scope_of_delivery'] ?? null,
        ]);

        $description = $this->llmService->generateDescription(
            referenceNumber: $watch->reference_number,
            brand: $watch->brand,
            modelName: $watch->model,
            language: $language,
            specs: $specs,
        );

        return response()->json([
            'data' => [
                'description' => $description,
                'language' => $language,
                'watch_id' => $watch->id,
            ],
        ]);
    }
}
