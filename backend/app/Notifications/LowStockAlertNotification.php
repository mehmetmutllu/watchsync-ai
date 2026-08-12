<?php

namespace App\Notifications;

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
        $locale = $notifiable->locale ?? app()->getLocale();

        return (new MailMessage)
            ->locale($locale)
            ->subject(__('notifications.low_stock.subject', [], $locale))
            ->greeting(__('notifications.greeting', ['name' => $notifiable->name], $locale))
            ->line(__('notifications.low_stock.intro', ['count' => $this->activeCount], $locale))
            ->line(__('notifications.low_stock.threshold', ['threshold' => $this->threshold], $locale))
            ->action(__('notifications.low_stock.action', [], $locale), url("/{$locale}/dashboard/inventory"))
            ->line(__('notifications.low_stock.outro', [], $locale));
    }
}
