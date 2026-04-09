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
        return (new MailMessage)
            ->subject("Invoice {$this->invoice->invoice_number}")
            ->greeting("Hello {$notifiable->first_name},")
            ->line("Please find your invoice #{$this->invoice->invoice_number} attached.")
            ->line("Amount due: {$this->invoice->total} {$this->invoice->currency}")
            ->when($this->invoice->due_date, function (MailMessage $message) {
                $message->line("Due date: {$this->invoice->due_date->format('d.m.Y')}");
            })
            ->line('Thank you for your business!');
    }
}
