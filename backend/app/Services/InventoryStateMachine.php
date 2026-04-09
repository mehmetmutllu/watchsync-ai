<?php

namespace App\Services;

use App\Models\InventoryStatusHistory;
use App\Models\Watch;
use Illuminate\Validation\ValidationException;

class InventoryStateMachine
{
    /**
     * Geçerli durum geçişleri tanımı.
     * [mevcut_durum => [izin_verilen_hedef_durumlar]]
     */
    private const TRANSITIONS = [
        'draft'       => ['active'],
        'active'      => ['reserved', 'sold', 'maintenance'],
        'reserved'    => ['active', 'sold'],
        'sold'        => [],
        'maintenance' => ['active'],
    ];

    /**
     * Durum geçişini kontrol eder ve uygular.
     *
     * @throws ValidationException
     */
    public function transition(Watch $watch, string $newStatus, ?int $userId = null, ?string $notes = null): Watch
    {
        $currentStatus = $watch->status;

        if ($currentStatus === $newStatus) {
            return $watch;
        }

        if (! $this->canTransition($currentStatus, $newStatus)) {
            throw ValidationException::withMessages([
                'status' => [
                    "'{$currentStatus}' durumundan '{$newStatus}' durumuna geçiş yapılamaz. "
                    . "İzin verilen geçişler: " . implode(', ', self::TRANSITIONS[$currentStatus] ?? []),
                ],
            ]);
        }

        $watch->update(['status' => $newStatus]);

        InventoryStatusHistory::create([
            'watch_id'   => $watch->id,
            'user_id'    => $userId,
            'old_status' => $currentStatus,
            'new_status' => $newStatus,
            'notes'      => $notes,
        ]);

        return $watch->fresh();
    }

    /**
     * Belirtilen geçişin mümkün olup olmadığını kontrol eder.
     */
    public function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    /**
     * Bir durumdan yapılabilecek geçişleri döner.
     */
    public function allowedTransitions(string $currentStatus): array
    {
        return self::TRANSITIONS[$currentStatus] ?? [];
    }
}
