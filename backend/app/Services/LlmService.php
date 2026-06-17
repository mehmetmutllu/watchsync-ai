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
        $this->apiKey = config('services.gemini.api_key', '');
        $this->baseUrl = config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta/openai');
        $this->model = config('services.gemini.model', 'gemini-2.0-flash');
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

    public function generatePitchMessage(
        \App\Models\Customer $customer,
        \App\Models\Watch $watch,
        string $language = 'en',
    ): string {
        $langMap = [
            'en' => 'English',
            'de' => 'German',
            'tr' => 'Turkish',
        ];
        $lang = $langMap[$language] ?? 'English';

        $systemPrompt = "You are an elite luxury watch concierge. Your task is to write a highly exclusive, professional, and short WhatsApp message in {$lang}. The dealer is reaching out to a VIP client to inform them that a watch they were looking for has just arrived in stock. Create a strong call to action to arrange a viewing or secure the piece. Do NOT use placeholders like [Your Name]. Use the customer's name. Be polite, exciting, but very professional. Maximum 100 words.";

        $customerName = $customer->first_name . ' ' . $customer->last_name;
        $watchDetails = $watch->brand . ' ' . $watch->model . ($watch->reference_number ? ' (Ref. ' . $watch->reference_number . ')' : '');
        $condition = $watch->condition ? 'Condition: ' . $watch->condition : '';

        $prompt = "Client Name: {$customerName}\nWatch arrived: {$watchDetails}\n{$condition}\n\nPlease generate the WhatsApp pitch message.";

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 300,
                ]);

            if ($response->successful()) {
                return trim($response->json('choices.0.message.content', ''));
            }

            Log::warning('LLM Pitch API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->fallbackPitch($customer->first_name, $watchDetails, $language);
        } catch (\Throwable $e) {
            Log::error('LLM service pitch exception', ['error' => $e->getMessage()]);
            return $this->fallbackPitch($customer->first_name, $watchDetails, $language);
        }
    }

    /**
     * Generate an AI birthday email with watch suggestions.
     */
    public function generateBirthdayEmail(\App\Models\Customer $customer, array $watches, string $language = 'en'): string
    {
        $langMap = [
            'en' => 'English',
            'de' => 'German',
            'tr' => 'Turkish',
        ];
        $lang = $langMap[$language] ?? 'English';

        $systemPrompt = "You are an elite luxury watch concierge. Your task is to write a highly exclusive, professional, but warm 'Happy Birthday' message in {$lang} for a VIP client. Wish them well and subtly mention that you have selected a few exquisite timepieces that match their refined taste, just in case they wish to treat themselves. Keep it elegant and not overly salesy. Do NOT use placeholders like [Your Name]. Use the customer's name.";

        $customerName = $customer->first_name . ' ' . $customer->last_name;
        
        $prompt = "Client Name: {$customerName}\n";
        
        if (!empty($watches)) {
            $prompt .= "Selected Watches to suggest:\n";
            foreach ($watches as $w) {
                $prompt .= "- " . $w['brand'] . " " . $w['model'] . " (Ref. " . ($w['reference_number'] ?? 'N/A') . ")\n";
            }
        } else {
            $prompt .= "No specific watches to suggest. Just a general warm birthday greeting.\n";
        }
        
        $prompt .= "\nPlease generate the birthday message.";

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 400,
                ]);

            if ($response->successful()) {
                return trim($response->json('choices.0.message.content', ''));
            }
            
            Log::warning('LLM Birthday API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            
            return $this->fallbackBirthday($customer->first_name, $language);
        } catch (\Throwable $e) {
            Log::error('LLM generateBirthdayEmail exception', ['error' => $e->getMessage()]);
            return $this->fallbackBirthday($customer->first_name, $language);
        }
    }

    private function fallbackPitch(string $firstName, string $watchDetails, string $language): string
    {
        if ($language === 'de') {
            return "Hallo {$firstName}, gute Neuigkeiten! Die gesuchte Uhr ist soeben bei uns eingetroffen: {$watchDetails}. Lassen Sie uns gerne wissen, ob wir einen Besichtigungstermin vereinbaren oder die Uhr für Sie reservieren sollen. Beste Grüße!";
        }
        if ($language === 'tr') {
            return "Merhaba {$firstName}, harika bir haberimiz var! Aradığınız saat stoklarımıza girdi: {$watchDetails}. Görmek isterseniz veya adınıza rezerve etmemizi isterseniz lütfen bize bildirin. Saygılarımızla!";
        }
        return "Hello {$firstName}, great news! The watch you were looking for has just arrived: {$watchDetails}. Please let us know if you would like to arrange a viewing or have us reserve it for you. Best regards!";
    }

    private function fallbackBirthday(string $firstName, string $language): string
    {
        if ($language === 'de') {
            return "Hallo {$firstName}, wir wünschen Ihnen alles erdenklich Gute zu Ihrem Geburtstag! Genießen Sie Ihren Ehrentag. Falls Sie sich selbst eine Freude machen möchten, haben wir einige besondere Stücke für Sie zusammengestellt. Herzliche Grüße!";
        }
        if ($language === 'tr') {
            return "Merhaba {$firstName}, doğum gününüz kutlu olsun! Yeni yaşınızın size sağlık ve mutluluk getirmesini dileriz. Kendinizi şımartmak isterseniz diye zevkinize uygun bazı özel parçalar seçtik. Saygılarımızla!";
        }
        return "Happy Birthday {$firstName}! We wish you all the best on your special day. Should you wish to treat yourself, we have selected a few exquisite pieces that might catch your eye. Warm regards!";
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

    /**
     * Analyze customer sentiment and preferences based on CRM notes.
     */
    public function analyzeCustomerSentiment(\App\Models\Customer $customer, string $language = 'de'): string
    {
        $langMap = [
            'en' => 'English',
            'de' => 'German',
            'tr' => 'Turkish',
        ];
        $lang = $langMap[$language] ?? 'German';

        $systemPrompt = "Du bist ein KI-Assistent für ein Luxusuhren-CRM. Deine Aufgabe ist es, die Notizen eines Kunden zu analysieren. Extrahiere die Stimmung, die Preissensibilität und spezifische Vorlieben für Marken/Modelle. Antworte in {$lang} in 2 bis maximal 3 prägnanten, professionellen Sätzen.";

        $customerName = $customer->first_name . ' ' . $customer->last_name;
        
        $notes = $customer->notes()->latest()->take(10)->pluck('content')->implode("\n- ");
        
        $prompt = "Kunde: {$customerName}\n";
        
        if (!empty($notes)) {
            $prompt .= "Notizen:\n- {$notes}\n";
        } else {
            $prompt .= "Es gibt noch keine Notizen zu diesem Kunden.\n";
            return $language === 'de' ? "Noch keine Notizen vorhanden. Sobald Interaktionen erfasst werden, erstelle ich hier ein Profil." : "No notes available yet.";
        }
        
        $prompt .= "\nBitte erstelle eine kurze Zusammenfassung (Sentiment, Vorlieben, Preissensibilität).";

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.5,
                    'max_tokens' => 200,
                ]);

            if ($response->successful()) {
                return trim($response->json('choices.0.message.content', ''));
            }
            
            Log::warning('LLM Sentiment API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            
            return "Konnte das Sentiment derzeit nicht analysieren.";
        } catch (\Throwable $e) {
            Log::error('LLM analyzeCustomerSentiment exception', ['error' => $e->getMessage()]);
            return "Fehler bei der KI-Analyse.";
        }
    }
}
