<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LlmService
{
    private string $apiKey;
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', '');
        $this->baseUrl = config('services.openai.base_url', 'https://api.openai.com/v1');
        $this->model = config('services.openai.model', 'gpt-4o-mini');
    }

    public function generateDescription(
        string $referenceNumber,
        string $brand,
        string $modelName,
        string $language = 'en',
        array $specs = [],
    ): string {
        $prompt = $this->buildPrompt($referenceNumber, $brand, $modelName, $language, $specs);

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $this->systemPrompt($language)],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 1000,
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content', '');
            }

            Log::warning('LLM API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->fallbackDescription($brand, $modelName, $referenceNumber, $language);
        } catch (\Throwable $e) {
            Log::error('LLM service exception', ['error' => $e->getMessage()]);
            return $this->fallbackDescription($brand, $modelName, $referenceNumber, $language);
        }
    }

    private function systemPrompt(string $language): string
    {
        $langMap = [
            'en' => 'English',
            'de' => 'German',
            'tr' => 'Turkish',
        ];
        $lang = $langMap[$language] ?? 'English';

        return "You are an expert luxury watch copywriter. Write compelling, SEO-optimized product descriptions for online watch marketplaces. Write in {$lang}. Keep descriptions factual — never invent specifications. Use a professional, sophisticated tone. Include relevant keywords naturally. Structure: opening hook, key features, condition/provenance, call to action. Maximum 200 words.";
    }

    private function buildPrompt(
        string $referenceNumber,
        string $brand,
        string $modelName,
        string $language,
        array $specs,
    ): string {
        $parts = ["Brand: {$brand}", "Model: {$modelName}", "Reference: {$referenceNumber}"];

        if (!empty($specs['year'])) {
            $parts[] = "Year: {$specs['year']}";
        }
        if (!empty($specs['condition'])) {
            $parts[] = "Condition: {$specs['condition']}";
        }
        if (!empty($specs['case_material'])) {
            $parts[] = "Case Material: {$specs['case_material']}";
        }
        if (!empty($specs['movement'])) {
            $parts[] = "Movement: {$specs['movement']}";
        }
        if (!empty($specs['dial_color'])) {
            $parts[] = "Dial Color: {$specs['dial_color']}";
        }
        if (!empty($specs['case_size'])) {
            $parts[] = "Case Size: {$specs['case_size']}mm";
        }
        if (!empty($specs['box_papers'])) {
            $parts[] = "Box & Papers: {$specs['box_papers']}";
        }

        return "Write a marketplace listing description for this watch:\n\n" . implode("\n", $parts);
    }

    private function fallbackDescription(string $brand, string $modelName, string $ref, string $language): string
    {
        if ($language === 'de') {
            return "Entdecken Sie die {$brand} {$modelName} (Ref. {$ref}) — ein herausragendes Beispiel feiner Uhrmacherkunst. Kontaktieren Sie uns für weitere Details zu diesem außergewöhnlichen Zeitmesser.";
        }

        if ($language === 'tr') {
            return "{$brand} {$modelName} (Ref. {$ref}) — üstün saat yapımcılığının olağanüstü bir örneği. Bu eşsiz zaman ölçer hakkında daha fazla bilgi için bizimle iletişime geçin.";
        }

        return "Discover the {$brand} {$modelName} (Ref. {$ref}) — an outstanding example of fine watchmaking. Contact us for more details about this exceptional timepiece.";
    }
}
