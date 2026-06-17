<?php

namespace App\Jobs;

use App\Models\Customer;
use App\Models\Watch;
use App\Services\LlmService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CheckBirthdaysJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
    }

    public function handle(LlmService $llmService): void
    {
        $today = now()->format('m-d');

        // Find customers with birthday today and auto_send enabled
        $customers = Customer::where('auto_send_birthday_mail', true)
            ->whereNotNull('birth_date')
            ->whereRaw("DATE_FORMAT(birth_date, '%m-%d') = ?", [$today])
            ->get();

        foreach ($customers as $customer) {
            try {
                $watches = [];
                // Suggest watches matching their desired_watch
                $desiredWatch = $customer->metadata['desired_watch'] ?? null;
                $query = Watch::where('dealer_id', $customer->dealer_id)
                    ->where('status', 'available');

                if ($desiredWatch) {
                    $parts = explode(' ', $desiredWatch);
                    $query->where(function($q) use ($parts) {
                        foreach ($parts as $part) {
                            $q->orWhere('brand', 'like', "%{$part}%")
                              ->orWhere('model', 'like', "%{$part}%");
                        }
                    });
                }

                $watches = $query->inRandomOrder()->take(3)->get()->toArray();

                // Assuming default language 'en' or from metadata
                $language = $customer->metadata['language'] ?? 'en';
                
                $emailBody = $llmService->generateBirthdayEmail($customer, $watches, $language);

                // Here we would normally use Laravel Mail facade to send the email
                // Mail::to($customer->email)->send(new BirthdayMail($emailBody));
                
                // For now, just log it as an action
                Log::info("Automated Birthday Mail sent to {$customer->first_name} {$customer->last_name} ({$customer->id}):\n{$emailBody}");
                
            } catch (\Exception $e) {
                Log::error("Failed to send birthday mail to customer {$customer->id}: " . $e->getMessage());
            }
        }
    }
}
