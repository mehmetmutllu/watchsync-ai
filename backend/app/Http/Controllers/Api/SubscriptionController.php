<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dealer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\StripeClient;

class SubscriptionController extends Controller
{
    private StripeClient $stripe;

    public function __construct()
    {
        $secretKey = config('stripe.secret_key') ?: env('STRIPE_SECRET_KEY');
        $this->stripe = new StripeClient($secretKey ?: 'sk_test_placeholder');
    }

    /**
     * Mevcut abonelik durumunu ve paket detaylarını getir.
     *
     * GET /api/subscriptions/current
     */
    public function current(Request $request): JsonResponse
    {
        /** @var Dealer $dealer */
        $dealer = $request->user()->dealer;

        return response()->json([
            'subscription' => [
                'plan_type'            => $dealer->plan_type ?? 'starter',
                'status'               => $dealer->subscription_status ?? 'active',
                'current_period_end'   => $dealer->current_period_end ? $dealer->current_period_end->toIso8601String() : null,
                'cancel_at_period_end' => (bool) ($dealer->cancel_at_period_end ?? false),
                'has_stripe_customer'  => ! empty($dealer->stripe_customer_id),
            ],
            'plans' => config('stripe.plans'),
            'commission_rules' => config('stripe.commission'),
        ]);
    }

    /**
     * Stripe Checkout Session oluştur (Abonelik Başlatma/Yükseltme).
     *
     * POST /api/subscriptions/checkout-session
     */
    public function createCheckoutSession(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:starter,pro,enterprise'],
        ]);

        /** @var Dealer $dealer */
        $dealer = $request->user()->dealer;
        $planKey = $request->input('plan');
        $plansConfig = config("stripe.plans.{$planKey}");

        if (! $plansConfig) {
            return response()->json(['message' => __('api.invalid_plan')], 422);
        }

        try {
            // Stripe Müşterisi yoksa oluştur
            if (empty($dealer->stripe_customer_id)) {
                $customer = $this->stripe->customers->create([
                    'email' => $dealer->email,
                    'name'  => $dealer->company_name ?: $dealer->name,
                    'metadata' => [
                        'dealer_id' => $dealer->id,
                    ],
                ]);
                $dealer->update(['stripe_customer_id' => $customer->id]);
            }

            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

            // Checkout Session Oluştur
            $session = $this->stripe->checkout->sessions->create([
                'customer' => $dealer->stripe_customer_id,
                'payment_method_types' => ['card'],
                'mode' => 'subscription',
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'WatchSync AI — ' . $plansConfig['name'],
                            'description' => implode(' • ', $plansConfig['features']),
                        ],
                        'unit_amount' => $plansConfig['price_eur'] * 100, // Cent cinsinden
                        'recurring'   => ['interval' => 'month'],
                    ],
                    'quantity' => 1,
                ]],
                'success_url' => $frontendUrl . '/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true',
                'cancel_url'  => $frontendUrl . '/dashboard/billing?canceled=true',
                'metadata' => [
                    'dealer_id' => $dealer->id,
                    'plan_type' => $planKey,
                ],
            ]);

            return response()->json([
                'url'        => $session->url,
                'session_id' => $session->id,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Stripe Checkout Error: ' . $e->getMessage());

            return response()->json([
                'message' => __('api.stripe_checkout_failed', ['error' => $e->getMessage()]),
            ], 500);
        }
    }

    /**
     * Aboneliği dönem sonunda bitecek şekilde iptal et (Period-End Cancellation).
     * Müşterinin erişimi dönem sonuna kadar devralınır.
     *
     * POST /api/subscriptions/cancel
     */
    public function cancel(Request $request): JsonResponse
    {
        /** @var Dealer $dealer */
        $dealer = $request->user()->dealer;

        if (empty($dealer->stripe_subscription_id)) {
            // Stripe aboneliği yoksa lokal durumu günceller
            $dealer->update([
                'cancel_at_period_end' => true,
            ]);

            return response()->json([
                'message' => __('api.cancel_requested'),
                'cancel_at_period_end' => true,
            ]);
        }

        try {
            $subscription = $this->stripe->subscriptions->update(
                $dealer->stripe_subscription_id,
                ['cancel_at_period_end' => true]
            );

            $periodEnd = \Carbon\Carbon::createFromTimestamp($subscription->current_period_end);

            $dealer->update([
                'cancel_at_period_end' => true,
                'current_period_end'   => $periodEnd,
            ]);

            return response()->json([
                'message' => __('api.cancel_success', ['date' => $periodEnd->translatedFormat('d MMMM yyyy')]),
                'cancel_at_period_end' => true,
                'current_period_end'   => $periodEnd->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Stripe Cancel Error: ' . $e->getMessage());

            return response()->json([
                'message' => __('api.cancel_error', ['error' => $e->getMessage()]),
            ], 500);
        }
    }

    /**
     * İptal edilmiş aboneliği dönem bitmeden geri al (Resume Subscription).
     *
     * POST /api/subscriptions/resume
     */
    public function resume(Request $request): JsonResponse
    {
        /** @var Dealer $dealer */
        $dealer = $request->user()->dealer;

        if (! empty($dealer->stripe_subscription_id)) {
            try {
                $this->stripe->subscriptions->update(
                    $dealer->stripe_subscription_id,
                    ['cancel_at_period_end' => false]
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Stripe Resume Error: ' . $e->getMessage());
            }
        }

        $dealer->update([
            'cancel_at_period_end' => false,
            'subscription_status'  => 'active',
        ]);

        return response()->json([
            'message' => __('api.resume_success'),
            'cancel_at_period_end' => false,
        ]);
    }

    /**
     * Stripe Müşteri Portalı (Billing Portal) yönlendirme linki üret.
     *
     * POST /api/subscriptions/portal
     */
    public function portal(Request $request): JsonResponse
    {
        /** @var Dealer $dealer */
        $dealer = $request->user()->dealer;

        if (empty($dealer->stripe_customer_id)) {
            return response()->json(['message' => __('api.no_stripe_profile')], 404);
        }

        try {
            $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
            $session = $this->stripe->billingPortal->sessions->create([
                'customer'   => $dealer->stripe_customer_id,
                'return_url' => $frontendUrl . '/dashboard/billing',
            ]);

            return response()->json(['url' => $session->url]);
        } catch (\Exception $e) {
            return response()->json(['message' => __('api.portal_failed', ['error' => $e->getMessage()])], 500);
        }
    }
}
