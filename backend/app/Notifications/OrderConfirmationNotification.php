<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Invoice $invoice,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->locale ?? app()->getLocale();
        $fullName = trim($notifiable->first_name . ' ' . $notifiable->last_name);
        $amount = number_format((float) $this->invoice->total, 2) . ' ' . $this->invoice->currency;

        return (new MailMessage)
            ->locale($locale)
            ->subject(__('notifications.order.subject', ['number' => $this->invoice->invoice_number], $locale))
            ->greeting(__('notifications.greeting', ['name' => $fullName], $locale))
            ->line(__('notifications.order.intro', [], $locale))
            ->line(__('notifications.order.number', ['number' => $this->invoice->invoice_number], $locale))
            ->line(__('notifications.order.total', ['amount' => $amount], $locale))
            ->line(__('notifications.order.issue_date', [
                'date' => $this->invoice->issue_date->translatedFormat('d MMMM yyyy'),
            ], $locale))
            ->action(__('notifications.order.action', [], $locale), url("/{$locale}/dashboard/invoices"))
            ->line(__('notifications.thanks', [], $locale));
    }
}
