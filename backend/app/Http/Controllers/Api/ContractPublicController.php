<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractAcceptance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractPublicController extends Controller
{
    /**
     * Aktif (published) sözleşmeler.
     *
     * GET /api/contracts/active
     */
    public function active(): JsonResponse
    {
        $contracts = Contract::published()
            ->select('id', 'type', 'title', 'slug', 'version', 'published_at')
            ->get();

        return response()->json(['contracts' => $contracts]);
    }

    /**
     * Sözleşme detayı (slug ile).
     *
     * GET /api/contracts/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $contract = Contract::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json(['contract' => $contract]);
    }

    /**
     * Sözleşmeyi kabul et.
     *
     * POST /api/contracts/{id}/accept
     */
    public function accept(Request $request, int $id): JsonResponse
    {
        $contract = Contract::where('status', 'published')->findOrFail($id);
        $user = $request->user();

        // Zaten kabul edilmiş mi kontrol et
        $existing = ContractAcceptance::where('user_id', $user->id)
            ->where('contract_id', $contract->id)
            ->where('version', $contract->version)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Bu sözleşme zaten kabul edilmiş.',
            ]);
        }

        ContractAcceptance::create([
            'user_id'     => $user->id,
            'contract_id' => $contract->id,
            'version'     => $contract->version,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Sözleşme kabul edildi.',
        ]);
    }

    /**
     * Bekleyen (henüz kabul edilmemiş) sözleşmeler.
     *
     * GET /api/contracts/pending
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        $publishedContracts = Contract::published()->get();

        $pending = $publishedContracts->filter(function ($contract) use ($user) {
            return ! ContractAcceptance::where('user_id', $user->id)
                ->where('contract_id', $contract->id)
                ->where('version', $contract->version)
                ->exists();
        })->values();

        return response()->json(['contracts' => $pending]);
    }
}
