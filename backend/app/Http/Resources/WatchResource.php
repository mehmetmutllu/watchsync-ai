<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WatchResource extends JsonResource
{
    /**
     * Watch modelini diziye çevirir; kullanıcının izni yoksa fiyat alanları
     * (satış/maliyet) yanıttan tamamen çıkarılır.
     *
     * Not: Controller'da modele eklenen dinamik alanlar (thumbnail_url,
     * primary_image_url, sync_statuses, allowed_transitions) ve yüklü
     * ilişkiler parent::toArray() ile korunur.
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        $user = $request->user();

        if (! $user || ! $user->hasPermission('inventory.view_price')) {
            unset($data['sale_price']);
        }

        if (! $user || ! $user->hasPermission('inventory.view_cost')) {
            unset($data['cost_price']);
        }

        return $data;
    }
}
