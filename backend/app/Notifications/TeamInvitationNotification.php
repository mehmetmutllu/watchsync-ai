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

    /**
     * Davetin dili: davetiyede kayıtlı tercih → yoksa isteğin dili.
     * Laravel, HasLocalePreference uygulayan alıcılar için dili kendi ayarlar;
     * davetli henüz kullanıcı olmadığından burada açıkça belirtiyoruz.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $locale = $this->invitation->locale ?: app()->getLocale();

        $dealerName = $this->invitation->dealer->company_name
            ?? $this->invitation->dealer->name;

        $role = __('notifications.roles.' . $this->invitation->role, [], $locale);

        return (new MailMessage)
            ->locale($locale)
            ->subject(__('notifications.invitation.subject', ['dealer' => $dealerName], $locale))
            ->greeting(__('notifications.greeting_generic', [], $locale))
            ->line(__('notifications.invitation.intro', ['dealer' => $dealerName], $locale))
            ->line(__('notifications.invitation.role', ['role' => $role], $locale))
            ->action(__('notifications.invitation.action', [], $locale), $this->acceptUrl)
            ->line(__('notifications.invitation.expires', [
                'date' => $this->invitation->expires_at->translatedFormat('d MMMM yyyy, HH:mm'),
            ], $locale))
            ->line(__('notifications.invitation.ignore', [], $locale));
    }
}
