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
        $fullName = $notifiable->first_name . ' ' . $notifiable->last_name;

        return (new MailMessage)
            ->subject("Sipariş Onayı — {$this->invoice->invoice_number}")
            ->greeting("Merhaba {$fullName},")
            ->line("Siparişiniz başarıyla oluşturuldu.")
            ->line("**Fatura No:** {$this->invoice->invoice_number}")
            ->line("**Toplam:** " . number_format($this->invoice->total, 2) . " {$this->invoice->currency}")
            ->line("**Düzenlenme Tarihi:** " . $this->invoice->issue_date->format('d.m.Y'))
            ->action('Faturayı Görüntüle', url("/dashboard/invoices"))
            ->line('Teşekkür ederiz!');
    }
}
