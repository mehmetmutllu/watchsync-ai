<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Watch\StoreWatchRequest;
use App\Http\Requests\Watch\UpdateWatchRequest;
use App\Http\Requests\Watch\UpdateWatchStatusRequest;
use App\Http\Requests\Watch\UploadWatchImageRequest;
use App\Models\Watch;
use App\Models\WatchImage;
use App\Services\InventoryLockService;
use App\Services\InventoryStateMachine;
use App\Services\WatchImageService;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WatchController extends Controller
{
    public function __construct(
        private readonly WatchImageService $imageService,
        private readonly InventoryStateMachine $stateMachine,
        private readonly InventoryLockService $lockService,
    ) {}

    /**
     * Saatleri listeler — sayfalama + filtreleme + sıralama.
     *
     * GET /api/watches
     */
    public function index(Request $request): JsonResponse
    {
        $dealerId = $request->user()->dealer_id;
        $perPage  = min((int) $request->input('per_page', 15), 100);

        $query = Watch::where('dealer_id', $dealerId)
            ->with(['images' => fn ($q) => $q->where('is_primary', true)->limit(1)]);

        // Filtreleme
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('brand')) {
            $query->where('brand', $request->input('brand'));
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->input('condition'));
        }

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('min_price')) {
            $query->where('sale_price', '>=', (float) $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('sale_price', '<=', (float) $request->input('max_price'));
        }

        // Sıralama
        $sortField = $request->input('sort_by', 'created_at');
        $sortDir   = $request->input('sort_dir', 'desc');

        $allowedSorts = ['created_at', 'brand', 'model', 'sale_price', 'cost_price', 'status', 'year'];
        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $watches = $query->paginate($perPage);

        // Thumbnail URL'lerini ekle
        $watches->getCollection()->transform(function ($watch) {
            $primaryImage = $watch->images->first();
            $watch->thumbnail_url = $primaryImage
                ? $this->imageService->url(
                    str_replace(
                        basename(dirname($primaryImage->image_url)),
                        'thumbnails',
                        $primaryImage->image_url
                    )
                )
                : null;
            $watch->primary_image_url = $primaryImage
                ? $this->imageService->url($primaryImage->image_url)
                : null;
            unset($watch->images);
            return $watch;
        });

        return response()->json($watches);
    }

    /**
     * Yeni saat oluşturur.
     *
     * POST /api/watches
     */
    public function store(StoreWatchRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['dealer_id'] = $request->user()->dealer_id;
        $validated['status']    = $validated['status'] ?? 'draft';

        $watch = Watch::create($validated);
        $watch->load('images');

        return response()->json([
            'message' => 'Saat başarıyla oluşturuldu.',
            'watch'   => $watch,
        ], 201);
    }

    /**
     * Saat detayını getirir.
     *
     * GET /api/watches/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->with(['images', 'statusHistory' => fn ($q) => $q->latest()->limit(10)])
            ->findOrFail($id);

        // Görsel URL'lerini ekle
        $watch->images->transform(function ($image) {
            $image->url       = $this->imageService->url($image->image_url);
            $image->thumb_url = $this->imageService->url(
                dirname($image->image_url) . '/thumbnails/' . basename($image->image_url)
            );
            return $image;
        });

        // İzin verilen geçişleri ekle
        $watch->allowed_transitions = $this->stateMachine->allowedTransitions($watch->status);

        return response()->json(['watch' => $watch]);
    }

    /**
     * Saati günceller.
     *
     * PUT /api/watches/{id}
     */
    public function update(UpdateWatchRequest $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $watch->update($request->validated());
        $watch->load('images');

        return response()->json([
            'message' => 'Saat başarıyla güncellendi.',
            'watch'   => $watch,
        ]);
    }

    /**
     * Saati siler.
     *
     * DELETE /api/watches/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->with('images')
            ->findOrFail($id);

        // Görselleri sil
        foreach ($watch->images as $image) {
            $this->imageService->delete($image->image_url);
        }

        $watch->delete();

        return response()->json([
            'message' => 'Saat başarıyla silindi.',
        ]);
    }

    /**
     * Saat durumunu günceller (state machine).
     *
     * PATCH /api/watches/{id}/status
     */
    public function updateStatus(UpdateWatchStatusRequest $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        try {
            $watch = $this->lockService->safeStatusTransition(
                $watch,
                $request->validated('status'),
                $this->stateMachine,
                $request->user()->id,
                $request->validated('notes'),
            );
        } catch (LockTimeoutException) {
            return response()->json([
                'message' => 'Bu saat şu anda başka bir işlem tarafından güncelleniyor. Lütfen tekrar deneyin.',
            ], 409);
        }

        $watch->allowed_transitions = $this->stateMachine->allowedTransitions($watch->status);

        return response()->json([
            'message' => 'Durum başarıyla güncellendi.',
            'watch'   => $watch,
        ]);
    }

    /**
     * Görselleri yükler.
     *
     * POST /api/watches/{id}/images
     */
    public function uploadImages(UploadWatchImageRequest $request, int $id): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($id);

        $isPrimary     = $request->boolean('is_primary', false);
        $currentMax    = $watch->images()->max('sort_order') ?? 0;
        $uploadedImages = [];
        $hasImages     = $watch->images()->exists();

        foreach ($request->file('images') as $index => $file) {
            $paths = $this->imageService->store($file, $watch->dealer_id, $watch->id);

            // İlk yüklenen görsel ve is_primary istenmişse veya hiç görsel yoksa
            $shouldBePrimary = ($isPrimary && $index === 0) || (!$hasImages && $index === 0);

            if ($shouldBePrimary) {
                // Mevcut primary'leri kaldır
                $watch->images()->where('is_primary', true)->update(['is_primary' => false]);
            }

            $image = $watch->images()->create([
                'image_url'  => $paths['original'],
                'is_primary' => $shouldBePrimary,
                'sort_order' => $currentMax + $index + 1,
            ]);

            $image->url       = $this->imageService->url($paths['original']);
            $image->thumb_url = $this->imageService->url($paths['thumbnail']);

            $uploadedImages[] = $image;
        }

        return response()->json([
            'message' => count($uploadedImages) . ' görsel başarıyla yüklendi.',
            'images'  => $uploadedImages,
        ], 201);
    }

    /**
     * Görseli siler.
     *
     * DELETE /api/watches/{watchId}/images/{imageId}
     */
    public function deleteImage(Request $request, int $watchId, int $imageId): JsonResponse
    {
        $watch = Watch::where('dealer_id', $request->user()->dealer_id)
            ->findOrFail($watchId);

        $image = $watch->images()->findOrFail($imageId);

        $this->imageService->delete($image->image_url);

        $wasPrimary = $image->is_primary;
        $image->delete();

        // Eğer silinen primary idi, ilk görseli primary yap
        if ($wasPrimary) {
            $firstImage = $watch->images()->orderBy('sort_order')->first();
            $firstImage?->update(['is_primary' => true]);
        }

        return response()->json([
            'message' => 'Görsel başarıyla silindi.',
        ]);
    }
}
