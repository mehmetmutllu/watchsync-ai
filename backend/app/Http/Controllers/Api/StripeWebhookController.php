<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dealer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    /**
     * Stripe Webhook Handler (Gelen Stripe Event'lerini Doğrula ve İşle).
     *
     * POST /api/webhooks/stripe
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('stripe.webhook_secret') ?: env('STRIPE_WEBHOOK_SECRET');

        try {
            // Secret yapılandırılmışsa HMAC İmzasını Doğrula (OWASP Güvenlik Şartı)
            if (! empty($secret) && ! empty($sigHeader)) {
                $event = Webhook::constructEvent($payload, $sigHeader, $secret);
            } else {
                $event = json_decode($payload, false);
            }
        } catch (\UnexpectedValueException $e) {
            Log::warning('Stripe Webhook Invalid Payload: ' . $e->getMessage());

            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::warning('Stripe Webhook Signature Failed: ' . $e->getMessage());

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $eventType = $event->type ?? '';
        $object    = $event->data->object ?? null;

        Log::info("Stripe Webhook Received: {$eventType}");

        switch ($eventType) {
            case 'checkout.session.completed':
                $this->handleCheckoutSessionCompleted($object);
                break;

            case 'customer.subscription.updated':
                $this->handleSubscriptionUpdated($object);
                break;

            case 'customer.subscription.deleted':
                $this->handleSubscriptionDeleted($object);
                break;

            case 'invoice.payment_succeeded':
                $this->handleInvoicePaymentSucceeded($object);
                break;

            default:
                Log::info("Unhandled Stripe Event: {$eventType}");
                break;
        }

        return response()->json(['status' => 'success']);
    }

    private function handleCheckoutSessionCompleted($session): void
    {
        if (! $session) return;

        $dealerId   = $session->metadata->dealer_id ?? null;
        $planType   = $session->metadata->plan_type ?? 'starter';
        $customerId = $session->customer ?? null;
        $subId      = $session->subscription ?? null;

        if ($dealerId) {
            $dealer = Dealer::find($dealerId);
        } elseif ($customerId) {
            $dealer = Dealer::where('stripe_customer_id', $customerId)->first();
        } else {
            $dealer = null;
        }

        if ($dealer) {
            $dealer->update([
                'stripe_customer_id'     => $customerId ?: $dealer->stripe_customer_id,
                'stripe_subscription_id' => $subId ?: $dealer->stripe_subscription_id,
                'plan_type'              => $planType,
                'subscription_status'    => 'active',
                'cancel_at_period_end'   => false,
            ]);
            Log::info("Dealer #{$dealer->id} upgraded to plan: {$planType}");
        }
    }

    private function handleSubscriptionUpdated($subscription): void
    {
        if (! $subscription) return;

        $subId  = $subscription->id ?? null;
        $status = $subscription->status ?? 'active';
        $cancelAtPeriodEnd = (bool) ($subscription->cancel_at_period_end ?? false);
        $periodEnd = isset($subscription->current_period_end)
            ? \Carbon\Carbon::createFromTimestamp($subscription->current_period_end)
            : null;

        $dealer = Dealer::where('stripe_subscription_id', $subId)
            ->orWhere('stripe_customer_id', $subscription->customer ?? '')
            ->first();

        if ($dealer) {
            $dealer->update([
                'subscription_status'  => $status === 'active' ? 'active' : $status,
                'cancel_at_period_end' => $cancelAtPeriodEnd,
                'current_period_end'   => $periodEnd ?: $dealer->current_period_end,
            ]);
            Log::info("Dealer #{$dealer->id} subscription updated: status={$status}, cancel_at_period_end={$cancelAtPeriodEnd}");
        }
    }

    private function handleSubscriptionDeleted($subscription): void
    {
        if (! $subscription) return;

        $subId  = $subscription->id ?? null;
        $dealer = Dealer::where('stripe_subscription_id', $subId)
            ->orWhere('stripe_customer_id', $subscription->customer ?? '')
            ->first();

        if ($dealer) {
            $dealer->update([
                'plan_type'           => 'starter',
                'subscription_status' => 'canceled',
                'cancel_at_period_end'=> false,
            ]);
            Log::info("Dealer #{$dealer->id} subscription canceled and reverted to starter.");
        }
    }

    private function handleInvoicePaymentSucceeded($invoice): void
    {
        if (! $invoice) return;

        $subId  = $invoice->subscription ?? null;
        $dealer = Dealer::where('stripe_subscription_id', $subId)
            ->orWhere('stripe_customer_id', $invoice->customer ?? '')
            ->first();

        if ($dealer) {
            $dealer->update([
                'subscription_status' => 'active',
            ]);
            Log::info("Invoice payment succeeded for Dealer #{$dealer->id}");
        }
    }
}
