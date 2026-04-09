<?php

namespace App\Notifications;

use App\Models\Watch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected int $activeCount,
        protected int $threshold = 5,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('⚠️ Düşük Stok Uyarısı — WatchSync AI')
            ->greeting("Merhaba {$notifiable->name},")
            ->line("Aktif envanter sayınız **{$this->activeCount}** adede düştü.")
            ->line("Stok seviyeniz belirlenen eşik değerinin ({$this->threshold}) altına indi.")
            ->action('Envanteri Görüntüle', url('/dashboard/inventory'))
            ->line('Yeni saat ekleyerek stok seviyenizi güncelleyebilirsiniz.');
    }
}
