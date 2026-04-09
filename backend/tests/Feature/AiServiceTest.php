<?php

namespace Tests\Feature;

use App\Services\AiService;
use App\Services\LlmService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiServiceTest extends TestCase
{
    use RefreshDatabase;

    // ─── AiService — Segment ────────────────────────────────

    public function test_segment_sends_multipart_request(): void
    {
        Http::fake([
            '*/api/ai/segment' => Http::response([
                'mask_url' => '/outputs/mask_123.png',
                'rgba_url' => '/outputs/rgba_123.png',
                'width'    => 800,
                'height'   => 600,
            ], 200),
        ]);

        $file    = UploadedFile::fake()->image('watch.jpg', 800, 600);
        $service = app(AiService::class);
        $result  = $service->segment($file, 0.5, 0.5);

        $this->assertArrayHasKey('mask_url', $result);
        $this->assertArrayHasKey('rgba_url', $result);
        $this->assertEquals(800, $result['width']);
    }

    // ─── AiService — Replace Background ─────────────────────

    public function test_replace_background_with_preset(): void
    {
        Http::fake([
            '*/api/ai/replace-background' => Http::response([
                'result_url'   => '/outputs/result_123.png',
                'original_url' => '/outputs/original_123.png',
                'width'        => 800,
                'height'       => 800,
            ], 200),
        ]);

        $file    = UploadedFile::fake()->image('rgba.png', 800, 600);
        $service = app(AiService::class);
        $result  = $service->replaceBackground($file, 'white_studio', true);

        $this->assertEquals('/outputs/result_123.png', $result['result_url']);
    }

    public function test_replace_background_with_custom_bg(): void
    {
        Http::fake([
            '*/api/ai/replace-background' => Http::response([
                'result_url'   => '/outputs/custom_bg.png',
                'original_url' => '/outputs/original.png',
                'width'        => 1024,
                'height'       => 1024,
            ], 200),
        ]);

        $file     = UploadedFile::fake()->image('rgba.png', 800, 600);
        $bgFile   = UploadedFile::fake()->image('custom-bg.jpg', 1024, 1024);
        $service  = app(AiService::class);
        $result   = $service->replaceBackground($file, 'white_studio', true, $bgFile);

        $this->assertArrayHasKey('result_url', $result);
    }

    // ─── AiService — Enhance (Full Pipeline) ────────────────

    public function test_enhance_returns_multiple_variants(): void
    {
        Http::fake([
            '*/api/ai/enhance' => Http::response([
                'original_url' => '/outputs/original.png',
                'rgba_url'     => '/outputs/rgba.png',
                'results'      => [
                    ['result_url' => '/outputs/white.png', 'width' => 1024, 'height' => 1024],
                    ['result_url' => '/outputs/black.png', 'width' => 1024, 'height' => 1024],
                    ['result_url' => '/outputs/marble.png', 'width' => 1024, 'height' => 1024],
                ],
            ], 200),
        ]);

        $file    = UploadedFile::fake()->image('watch.jpg', 800, 600);
        $service = app(AiService::class);
        $result  = $service->enhance($file, 0.5, 0.5, true);

        $this->assertCount(3, $result['results']);
        $this->assertArrayHasKey('rgba_url', $result);
    }

    // ─── AiService — Health ─────────────────────────────────

    public function test_health_check_returns_status(): void
    {
        Http::fake([
            '*/api/ai/health' => Http::response([
                'status'       => 'ok',
                'model_loaded' => true,
            ], 200),
        ]);

        $service = app(AiService::class);
        $result  = $service->health();

        $this->assertEquals('ok', $result['status']);
        $this->assertTrue($result['model_loaded']);
    }

    // ─── AiService — URL Resolution ─────────────────────────

    public function test_resolve_url_builds_absolute_path(): void
    {
        $service = app(AiService::class);
        $url     = $service->resolveUrl('/outputs/test.png');

        $this->assertStringEndsWith('/outputs/test.png', $url);
        $this->assertStringStartsWith('http', $url);
    }

    // ─── LlmService — Description Generation ────────────────

    public function test_generate_description_english(): void
    {
        Http::fake([
            '*/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => 'Discover this exceptional Rolex Submariner, a masterpiece of horological engineering.',
                    ],
                ]],
            ], 200),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            '126610LN',
            'Rolex',
            'Submariner',
            'en',
            ['year' => '2024', 'condition' => 'Unworn'],
        );

        $this->assertStringContainsString('Rolex', $result);
    }

    public function test_generate_description_german(): void
    {
        Http::fake([
            '*/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => 'Entdecken Sie diese außergewöhnliche Rolex Submariner.',
                    ],
                ]],
            ], 200),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            '126610LN',
            'Rolex',
            'Submariner',
            'de',
        );

        $this->assertNotEmpty($result);
    }

    public function test_generate_description_turkish(): void
    {
        Http::fake([
            '*/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => 'Bu olağanüstü Rolex Submariner saatini keşfedin.',
                    ],
                ]],
            ], 200),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            '126610LN',
            'Rolex',
            'Submariner',
            'tr',
        );

        $this->assertNotEmpty($result);
    }

    public function test_fallback_on_api_error(): void
    {
        Http::fake([
            '*/chat/completions' => Http::response('Service Unavailable', 503),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            '126610LN',
            'Rolex',
            'Submariner',
            'en',
        );

        // Should return fallback description, not throw
        $this->assertStringContainsString('Rolex', $result);
        $this->assertStringContainsString('Submariner', $result);
        $this->assertStringContainsString('126610LN', $result);
    }

    public function test_fallback_on_network_exception(): void
    {
        Http::fake([
            '*/chat/completions' => fn () => throw new \Exception('Connection timeout'),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            'REF-001',
            'Patek Philippe',
            'Nautilus',
            'tr',
        );

        // Turkish fallback
        $this->assertStringContainsString('Patek Philippe', $result);
        $this->assertStringContainsString('Nautilus', $result);
    }

    public function test_german_fallback_text(): void
    {
        Http::fake([
            '*/chat/completions' => Http::response('Error', 500),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            'REF-001',
            'IWC',
            'Portugieser',
            'de',
        );

        $this->assertStringContainsString('Entdecken', $result);
        $this->assertStringContainsString('IWC', $result);
    }

    public function test_description_includes_specs(): void
    {
        Http::fake([
            '*/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => 'A stunning watch with automatic movement.'],
                ]],
            ], 200),
        ]);

        $service = app(LlmService::class);
        $result  = $service->generateDescription(
            '5711/1A-010',
            'Patek Philippe',
            'Nautilus',
            'en',
            [
                'year'           => '2020',
                'condition'      => 'Very Good',
                'case_material'  => 'Stainless Steel',
                'movement'       => 'Automatic',
                'dial_color'     => 'Blue',
                'case_size'      => '40',
                'box_papers'     => 'Full Set',
            ],
        );

        // API was called with the specs included
        Http::assertSent(function ($request) {
            $body = $request->data();
            $content = $body['messages'][1]['content'] ?? '';
            return str_contains($content, 'Stainless Steel')
                && str_contains($content, 'Automatic')
                && str_contains($content, 'Blue');
        });
    }
}
