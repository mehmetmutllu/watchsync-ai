<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminFeedbackController extends Controller
{
    /**
     * Feedback listesi.
     *
     * GET /api/admin/feedbacks
     */
    public function index(Request $request): JsonResponse
    {
        $query = Feedback::with('user:id,name,email');

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        $feedbacks = $query->latest()->paginate(20);

        return response()->json($feedbacks);
    }

    /**
     * Feedback detayı.
     *
     * GET /api/admin/feedbacks/{id}
     */
    public function show(int $id): JsonResponse
    {
        $feedback = Feedback::with(['user:id,name,email', 'responder:id,name'])->findOrFail($id);
        return response()->json(['feedback' => $feedback]);
    }

    /**
     * Feedback yanıtla/durum güncelle.
     *
     * PUT /api/admin/feedbacks/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status'         => 'sometimes|in:new,reviewing,resolved,rejected',
            'admin_response' => 'sometimes|nullable|string|max:2000',
        ]);

        $feedback = Feedback::findOrFail($id);
        $adminUser = $request->attributes->get('adminUser');

        $updateData = [];
        if ($request->has('status')) {
            $updateData['status'] = $request->status;
        }
        if ($request->has('admin_response')) {
            $updateData['admin_response'] = $request->admin_response;
            $updateData['responded_by'] = $adminUser->user_id;
            $updateData['responded_at'] = now();
        }

        $feedback->update($updateData);

        AdminActivityLog::create([
            'admin_user_id' => $adminUser->id,
            'action'        => 'feedback.update',
            'target_type'   => Feedback::class,
            'target_id'     => $id,
            'details'       => $updateData,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'message'  => 'Geri bildirim güncellendi.',
            'feedback' => $feedback->fresh(),
        ]);
    }

    /**
     * Feedback istatistikleri.
     *
     * GET /api/admin/feedbacks/stats
     */
    public function stats(): JsonResponse
    {
        $total = Feedback::count();
        $byCategory = Feedback::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');
        $byStatus = Feedback::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'total'       => $total,
            'by_category' => $byCategory,
            'by_status'   => $byStatus,
        ]);
    }
}
