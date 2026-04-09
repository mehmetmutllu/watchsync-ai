<?php

namespace App\Services;

use App\Models\Watch;
use SimpleXMLElement;

class Chrono24FeedService
{
    /**
     * Dealer'ın aktif saatlerinden Chrono24 XML feed oluşturur.
     */
    public function generateFeed(int $dealerId): string
    {
        $watches = Watch::where('dealer_id', $dealerId)
            ->where('status', 'active')
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')])
            ->get();

        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><watchlist/>');

        foreach ($watches as $watch) {
            $this->addWatchNode($xml, $watch);
        }

        $dom = dom_import_simplexml($xml)->ownerDocument;
        $dom->formatOutput = true;

        return $dom->saveXML();
    }

    /**
     * Tek bir saat düğümünü XML'e ekler — Chrono24 zorunlu alanları.
     */
    private function addWatchNode(SimpleXMLElement $xml, Watch $watch): void
    {
        $item = $xml->addChild('watch');

        // Zorunlu düğümler
        $item->addChild('article_id', $this->escape((string) $watch->id));
        $item->addChild('price', $this->escape((string) $watch->sale_price));
        $item->addChild('currency', $this->escape($watch->currency));
        $item->addChild('Manufacturer', $this->escape($watch->brand));
        $item->addChild('Model_name', $this->escape($watch->model));

        if ($watch->reference_number) {
            $item->addChild('Reference_number', $this->escape($watch->reference_number));
        }

        $item->addChild('Production_year', $this->escape((string) ($watch->year ?? '')));
        $item->addChild('Condition', $this->escape($this->mapCondition($watch->condition)));

        // Features alanlarından gelen detaylar
        $features = $watch->features ?? [];

        $item->addChild('Scope_of_delivery', $this->escape($features['scope_of_delivery'] ?? 'Watch only'));
        $item->addChild('Case_material', $this->escape($features['case_material'] ?? ''));
        $item->addChild('Bracelet_strap_material', $this->escape($features['bracelet_material'] ?? ''));
        $item->addChild('Dial_color', $this->escape($features['dial_color'] ?? ''));
        $item->addChild('Winding_mechanism', $this->escape($this->mapMovement($features['movement'] ?? '')));

        // Açıklama
        $item->addChild('Description', $this->escape($watch->description ?? ''));

        // Görseller
        $photos = $item->addChild('Photos');
        foreach ($watch->images as $image) {
            $url = $image->image_url
                ? url('/storage/' . $image->image_url)
                : '';
            if ($url) {
                $photos->addChild('Photo', $this->escape($url));
            }
        }
    }

    /**
     * Chrono24 koşul değerlerini eşleştirir.
     */
    private function mapCondition(string $condition): string
    {
        return match ($condition) {
            'new'       => 'New',
            'unworn'    => 'Unworn',
            'very_good' => 'Very good',
            'good'      => 'Good',
            'fair'      => 'Fair',
            default     => $condition,
        };
    }

    /**
     * Mekanizma türünü Chrono24 formatına dönüştürür.
     */
    private function mapMovement(string $movement): string
    {
        return match (strtolower($movement)) {
            'automatic', 'auto' => 'Automatic',
            'manual', 'hand-wound' => 'Manual winding',
            'quartz' => 'Quartz',
            default  => $movement,
        };
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
