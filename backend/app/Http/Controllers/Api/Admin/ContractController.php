<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Contract;
use App\Models\ContractAcceptance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    /**
     * Sözleşme listesi.
     *
     * GET /api/admin/contracts
     */
    public function index(): JsonResponse
    {
        $contracts = Contract::withCount('acceptances')
            ->latest()
            ->paginate(20);

        return response()->json($contracts);
    }

    /**
     * Sözleşme oluştur.
     *
     * POST /api/admin/contracts
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'    => 'required|in:terms_of_service,privacy_policy,kvkk_gdpr,cookie_policy',
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
            'version' => 'nullable|string|max:20',
        ]);

        $adminUser = $request->attributes->get('adminUser');

        $contract = Contract::create([
            'type'       => $validated['type'],
            'title'      => $validated['title'],
            'slug'       => Str::slug($validated['title']) . '-' . Str::random(6),
            'content'    => $validated['content'],
            'version'    => $validated['version'] ?? '1.0',
            'status'     => 'draft',
            'created_by' => $adminUser->user_id,
        ]);

        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'contract.create',
            'target_type'   => Contract::class,
            'target_id'     => $contract->id,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message'  => 'Sözleşme oluşturuldu.',
            'contract' => $contract,
        ], 201);
    }

    /**
     * Sözleşme güncelle.
     *
     * PUT /api/admin/contracts/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $validated = $request->validate([
            'title'   => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'version' => 'sometimes|string|max:20',
        ]);

        $contract->update($validated);

        return response()->json([
            'message'  => 'Sözleşme güncellendi.',
            'contract' => $contract->fresh(),
        ]);
    }

    /**
     * Sözleşme yayınla (mevcut published olanı arşivle).
     *
     * POST /api/admin/contracts/{id}/publish
     */
    public function publish(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        // Aynı tipteki mevcut published sözleşmeyi arşivle
        Contract::where('type', $contract->type)
            ->where('status', 'published')
            ->where('id', '!=', $contract->id)
            ->update(['status' => 'archived']);

        $contract->update([
            'status'       => 'published',
            'published_at' => now(),
        ]);

        $adminUser = $request->attributes->get('adminUser');
        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'contract.publish',
            'target_type'   => Contract::class,
            'target_id'     => $id,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message'  => 'Sözleşme yayınlandı.',
            'contract' => $contract->fresh(),
        ]);
    }

    /**
     * Sözleşme kabul listesi.
     *
     * GET /api/admin/contracts/{id}/acceptances
     */
    public function acceptances(int $id): JsonResponse
    {
        $acceptances = ContractAcceptance::where('contract_id', $id)
            ->with('user:id,name,email')
            ->latest('accepted_at')
            ->paginate(20);

        return response()->json($acceptances);
    }
}
