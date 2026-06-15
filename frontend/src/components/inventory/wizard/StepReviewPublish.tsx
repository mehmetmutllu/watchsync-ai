'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Check, Save, Rocket, ExternalLink } from 'lucide-react';
import { watchesApi } from '@/lib/watches-api';
import { usePlatformStore } from '@/stores/platformStore';
import { useToastStore } from '@/stores/toastStore';
import type { WatchWizardFormData } from './WatchWizard';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Sıfır',
  unworn: 'Kullanılmamış',
  very_good: 'Çok İyi',
  good: 'İyi',
  fair: 'Orta',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', TRY: '₺', CHF: 'CHF',
};

interface ExistingImage {
  id: number;
  url: string;
  thumb_url: string;
  is_primary: boolean;
}

interface StepReviewPublishProps {
  watchId: number;
  formData: WatchWizardFormData;
  existingImages: ExistingImage[];
  onSaveDraft: () => Promise<void>;
  onPublishComplete: () => void;
}

export default function StepReviewPublish({
  watchId,
  formData,
  existingImages,
  onSaveDraft,
  onPublishComplete,
}: StepReviewPublishProps) {
  const { platforms, fetchPlatforms } = usePlatformStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<number>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const togglePlatform = (id: number) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedPlatforms.size === 0) {
      addToast({ type: 'warning', title: 'En az 1 platform seçmelisiniz.' });
      return;
    }

    setIsPublishing(true);
    try {
      await watchesApi.publish(watchId, Array.from(selectedPlatforms));
      setPublishSuccess(true);
      setTimeout(() => {
        onPublishComplete();
      }, 2000);
    } catch {
      addToast({ type: 'error', title: 'Yayınlama sırasında hata oluştu.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await onSaveDraft();
    } finally {
      setIsSaving(false);
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[formData.currency || 'EUR'] || '€';

  if (publishSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-accent-green" />
        </div>
        <h2 className="text-xl font-semibold text-primary-text mb-2">Saat Yayınlandı!</h2>
        <p className="text-sm text-secondary-text mb-6">
          Saatiniz seçilen platformlara başarıyla gönderildi.
        </p>
        <p className="text-xs text-secondary-text">Envanter sayfasına yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">Son Kontrol & Yayınla</h2>
        <p className="text-sm text-secondary-text">Bilgileri kontrol edin, platformları seçin ve yayınlayın.</p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Image Preview */}
        <div className="lg:col-span-1">
          {existingImages.length > 0 ? (
            <div className="aspect-square rounded-xl overflow-hidden border border-border-subtle">
              <img
                src={(existingImages.find((i) => i.is_primary) || existingImages[0]).url}
                alt={`${formData.brand} ${formData.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-xl bg-surface-secondary flex items-center justify-center border border-border-subtle">
              <span className="text-secondary-text text-sm">Fotoğraf yok</span>
            </div>
          )}
          <p className="text-xs text-secondary-text text-center mt-2">{existingImages.length} fotoğraf</p>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-3">
          <div className="p-4 rounded-lg bg-surface-secondary/50 border border-border-subtle">
            <h3 className="text-lg font-semibold text-primary-text">
              {formData.brand} {formData.model}
            </h3>
            {formData.reference_number && (
              <p className="text-sm text-secondary-text">Ref: {formData.reference_number}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {formData.year && (
              <InfoItem label="Üretim Yılı" value={String(formData.year)} />
            )}
            <InfoItem label="Kondisyon" value={CONDITION_LABELS[formData.condition] || formData.condition} />
            {formData.features?.case_material && (
              <InfoItem label="Kasa" value={formData.features.case_material} />
            )}
            {formData.features?.dial_color && (
              <InfoItem label="Kadran" value={formData.features.dial_color} />
            )}
            {formData.features?.movement && (
              <InfoItem label="Hareket" value={formData.features.movement} />
            )}
            {formData.features?.bracelet_material && (
              <InfoItem label="Kayış" value={formData.features.bracelet_material} />
            )}
          </div>

          {/* Pricing */}
          <div className="flex gap-4 p-3 rounded-lg bg-accent-blue/5 border border-accent-blue/20">
            {formData.cost_price && (
              <div>
                <span className="text-xs text-secondary-text">Maliyet</span>
                <p className="text-sm font-medium text-primary-text">
                  {currencySymbol}{Number(formData.cost_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {formData.sale_price && (
              <div>
                <span className="text-xs text-secondary-text">Satış Fiyatı</span>
                <p className="text-sm font-semibold text-accent-blue">
                  {currencySymbol}{Number(formData.sale_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {/* Description Preview */}
          {formData.description && (
            <div className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle">
              <span className="text-xs text-secondary-text block mb-1">Açıklama</span>
              <p className="text-sm text-primary-text line-clamp-3">{formData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Selection */}
      <div>
        <h3 className="text-sm font-medium text-primary-text mb-3">Yayınlanacak Platformlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const isConnected = platform.status === 'connected';
            const isSelected = selectedPlatforms.has(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                disabled={!isConnected}
                onClick={() => togglePlatform(platform.id)}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border transition-all text-left
                  ${!isConnected
                    ? 'opacity-40 cursor-not-allowed border-border-subtle'
                    : isSelected
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-border-subtle hover:border-border-default'
                  }
                `}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-accent-blue text-white' : 'bg-surface-secondary text-secondary-text'}`}>
                  {isSelected ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-text">{platform.name}</p>
                  <p className="text-xs text-secondary-text">
                    {isConnected ? 'Bağlı' : 'Bağlı değil'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:border-border-default transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Taslak Olarak Kaydet
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing || selectedPlatforms.size === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-green text-white text-sm font-semibold rounded-lg hover:bg-accent-green/90 transition-colors disabled:opacity-50 flex-1 sm:flex-initial"
        >
          {isPublishing ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          Yayınla
        </button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-surface-secondary/50">
      <span className="text-[10px] text-secondary-text uppercase tracking-wider">{label}</span>
      <p className="text-sm font-medium text-primary-text">{value}</p>
    </div>
  );
}
