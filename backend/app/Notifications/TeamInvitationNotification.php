<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeamInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Invitation $invitation,
        public string $acceptUrl,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dealerName = $this->invitation->dealer->company_name
            ?? $this->invitation->dealer->name;

        return (new MailMessage)
            ->subject("{$dealerName} sizi ekibine davet etti")
            ->greeting('Merhaba,')
            ->line("{$dealerName}, WatchSync AI ekibine katılmanız için sizi davet etti.")
            ->line("Rolünüz: {$this->invitation->role}")
            ->action('Daveti Kabul Et', $this->acceptUrl)
            ->line("Bu davet {$this->invitation->expires_at->format('d.m.Y H:i')} tarihine kadar geçerlidir.")
            ->line('Eğer bu daveti beklemiyorsanız bu e-postayı yok sayabilirsiniz.');
    }
}
