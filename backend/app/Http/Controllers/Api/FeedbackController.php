<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Yeni feedback gönder (auth opsiyonel).
     *
     * POST /api/feedbacks
     */
    public function store(Request $request): JsonResponse
    {
        $rules = [
            'category' => 'required|in:bug,suggestion,complaint,general',
            'subject'  => 'required|string|max:255',
            'message'  => 'required|string|max:5000',
        ];

        // Auth yoksa isim ve email zorunlu
        if (! $request->user()) {
            $rules['name']  = 'required|string|max:255';
            $rules['email'] = 'required|email|max:255';
        }

        $validated = $request->validate($rules);

        $feedback = Feedback::create([
            'user_id'  => $request->user()?->id,
            'name'     => $validated['name'] ?? $request->user()?->name,
            'email'    => $validated['email'] ?? $request->user()?->email,
            'category' => $validated['category'],
            'subject'  => $validated['subject'],
            'message'  => $validated['message'],
        ]);

        return response()->json([
            'message'  => 'Geri bildiriminiz alındı. Teşekkür ederiz!',
            'feedback' => $feedback,
        ], 201);
    }

    /**
     * Kullanıcının kendi feedbackleri.
     *
     * GET /api/feedbacks/mine
     */
    public function mine(Request $request): JsonResponse
    {
        $feedbacks = Feedback::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($feedbacks);
    }
}
