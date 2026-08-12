<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceSentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Invoice $invoice,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? app()->getLocale();
        $amount = number_format((float) $this->invoice->total, 2) . ' ' . $this->invoice->currency;

        $message = (new MailMessage)
            ->locale($locale)
            ->subject(__('notifications.invoice.subject', ['number' => $this->invoice->invoice_number], $locale))
            ->greeting(__('notifications.greeting', ['name' => $notifiable->first_name], $locale))
            ->line(__('notifications.invoice.intro', ['number' => $this->invoice->invoice_number], $locale))
            ->line(__('notifications.invoice.amount', ['amount' => $amount], $locale));

        if ($this->invoice->due_date) {
            $message->line(__('notifications.invoice.due_date', [
                'date' => $this->invoice->due_date->translatedFormat('d MMMM yyyy'),
            ], $locale));
        }

        return $message->line(__('notifications.invoice.thanks', [], $locale));
    }
}
