'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle, AlertTriangle, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { watchesApi } from '@/lib/watches-api';
import { useToastStore } from '@/stores/toastStore';
import type { AiPipelineStatus, AiStepStatus } from '@/types';
import type { WatchWizardFormData } from './WatchWizard';

const PRESETS: Record<string, string> = {
  white_studio: 'Beyaz Stüdyo',
  black_velvet: 'Siyah Kadife',
  marble: 'Mermer',
  grey_gradient: 'Gri Gradyan',
};

const LANG_TABS = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

interface StepAiProcessingProps {
  watchId: number;
  existingImages: Array<{ id: number; url: string; thumb_url: string; is_primary: boolean }>;
}

function StatusIcon({ status }: { status: AiStepStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-accent-green" />;
    case 'processing':
    case 'pending':
      return <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />;
    case 'failed':
      return <AlertTriangle className="w-5 h-5 text-semantic-error" />;
    default:
      return <div className="w-5 h-5 rounded-full bg-surface-secondary" />;
  }
}

function statusLabel(status: AiStepStatus): string {
  switch (status) {
    case 'pending': return 'Bekliyor';
    case 'processing': return 'İşleniyor...';
    case 'completed': return 'Tamamlandı';
    case 'failed': return 'Hata';
    case 'skipped': return 'Atlandı';
    default: return '';
  }
}

export default function StepAiProcessing({ watchId, existingImages }: StepAiProcessingProps) {
  const { setValue, watch } = useFormContext<WatchWizardFormData>();
  const addToast = useToastStore((s) => s.addToast);

  const [pipelineStatus, setPipelineStatus] = useState<AiPipelineStatus | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [descLang, setDescLang] = useState('tr');
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const triggeredRef = useRef(false);

  // Auto-trigger AI pipeline on mount
  useEffect(() => {
    if (!triggeredRef.current) {
      triggeredRef.current = true;
      triggerPipeline();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerPipeline = async () => {
    setIsTriggering(true);
    try {
      await watchesApi.aiProcess(watchId);
      startPolling();
    } catch {
      addToast({ type: 'error', title: 'AI pipeline başlatılamadı.' });
    } finally {
      setIsTriggering(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const status = await watchesApi.aiStatus(watchId);
        if (status) {
          setPipelineStatus(status);

          // Check if all done
          const allDone = ['validation_status', 'background_status', 'description_status'].every(
            (key) => {
              const val = status[key as keyof AiPipelineStatus];
              return val === 'completed' || val === 'failed' || val === 'skipped';
            }
          );

          if (allDone && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Pre-fill descriptions
          if (status.ai_descriptions && Object.keys(status.ai_descriptions).length > 0) {
            setEditedDescriptions((prev) => {
              const next = { ...prev };
              for (const [lang, desc] of Object.entries(status.ai_descriptions)) {
                if (!next[lang] && desc) next[lang] = desc;
              }
              return next;
            });
          }
        }
      } catch {
        // Silently fail polling
      }
    }, 2000);
  };

  const handleDescriptionChange = (lang: string, text: string) => {
    setEditedDescriptions((prev) => ({ ...prev, [lang]: text }));
    // Update form description with current language's text
    if (lang === 'tr') {
      setValue('description', text);
    }
  };

  const handleRegenerate = async () => {
    triggerPipeline();
    setEditedDescriptions({});
    setSelectedVariant(null);
  };

  const handleApplyDescription = async () => {
    const desc = editedDescriptions[descLang] || '';
    if (desc) {
      await watchesApi.aiResults(watchId, {
        description: desc,
        selected_variant: selectedVariant || undefined,
      });
      setValue('description', desc);
      addToast({ type: 'success', title: 'Açıklama kaydedildi.' });
    }
  };

  const isProcessing = pipelineStatus
    ? ['validation_status', 'background_status', 'description_status'].some(
        (key) => {
          const val = pipelineStatus[key as keyof AiPipelineStatus];
          return val === 'processing' || val === 'pending';
        }
      )
    : isTriggering;

  const primaryImage = existingImages.find((img) => img.is_primary) || existingImages[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">AI İşleme</h2>
        <p className="text-sm text-secondary-text">
          Fotoğraflarınız otomatik olarak AI ile işleniyor. Sonuçları inceleyip düzenleyebilirsiniz.
        </p>
      </div>

      {/* Pipeline Progress */}
      <div className="space-y-3">
        {[
          { key: 'validation_status' as const, label: 'Görsel Doğrulama', desc: 'Fotoğrafın saat olup olmadığı kontrol ediliyor' },
          { key: 'background_status' as const, label: 'Arka Plan İyileştirme', desc: 'Profesyonel arka plan varyantları oluşturuluyor' },
          { key: 'description_status' as const, label: 'Açıklama Üretimi', desc: '3 dilde ilan açıklaması üretiliyor (TR/EN/DE)' },
        ].map(({ key, label, desc }) => {
          const status = pipelineStatus?.[key] || (isTriggering ? 'pending' : 'pending');
          return (
            <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle">
              <StatusIcon status={status as AiStepStatus} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-text">{label}</p>
                <p className="text-xs text-secondary-text">{desc}</p>
              </div>
              <span className={`text-xs font-medium ${
                status === 'completed' ? 'text-accent-green' :
                status === 'failed' ? 'text-semantic-error' :
                'text-secondary-text'
              }`}>
                {statusLabel(status as AiStepStatus)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validation Result */}
      {pipelineStatus?.validation_status === 'completed' && pipelineStatus.validation_result && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          pipelineStatus.validation_result.is_watch
            ? 'bg-accent-green/10 border border-accent-green/20'
            : 'bg-amber-500/10 border border-amber-500/20'
        }`}>
          {pipelineStatus.validation_result.is_watch ? (
            <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          )}
          <span className="text-sm">
            {pipelineStatus.validation_result.is_watch
              ? `Görsel doğrulandı (güven: ${((pipelineStatus.validation_result.confidence || 0) * 100).toFixed(0)}%)`
              : 'Görsel doğrulanamadı — lütfen saat fotoğrafı yüklediğinizden emin olun.'
            }
          </span>
        </div>
      )}

      {/* Background Variants */}
      {pipelineStatus?.background_status === 'completed' && pipelineStatus.enhanced_images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-primary-text mb-3">Arka Plan Varyantları</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Original */}
            {primaryImage && (
              <button
                type="button"
                onClick={() => setSelectedVariant(null)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  !selectedVariant ? 'border-accent-blue' : 'border-border-subtle hover:border-border-default'
                }`}
              >
                <img src={primaryImage.url} alt="Orijinal" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 inset-x-1 text-center text-[10px] font-medium text-white bg-black/50 rounded px-1 py-0.5">
                  Orijinal
                </span>
              </button>
            )}
            {pipelineStatus.enhanced_images.map((variant) => (
              <button
                key={variant.preset}
                type="button"
                onClick={() => setSelectedVariant(variant.preset)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedVariant === variant.preset ? 'border-accent-blue' : 'border-border-subtle hover:border-border-default'
                }`}
              >
                {variant.url ? (
                  <img src={variant.url} alt={PRESETS[variant.preset] || variant.preset} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-secondary">
                    <ImageIcon className="w-8 h-8 text-tertiary-text" />
                  </div>
                )}
                <span className="absolute bottom-1 inset-x-1 text-center text-[10px] font-medium text-white bg-black/50 rounded px-1 py-0.5">
                  {PRESETS[variant.preset] || variant.preset}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Descriptions */}
      {pipelineStatus?.description_status === 'completed' && Object.keys(pipelineStatus.ai_descriptions).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-primary-text">AI Açıklama</h3>
            <button
              onClick={handleApplyDescription}
              className="text-xs font-medium text-accent-blue hover:text-accent-blue-hover transition-colors"
            >
              Kaydet & Uygula
            </button>
          </div>

          {/* Language Tabs */}
          <div className="flex gap-1 mb-3">
            {LANG_TABS.map((tab) => (
              <button
                key={tab.code}
                type="button"
                onClick={() => setDescLang(tab.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  descLang === tab.code
                    ? 'bg-accent-blue text-white'
                    : 'bg-surface-secondary text-secondary-text hover:text-primary-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <textarea
            value={editedDescriptions[descLang] || ''}
            onChange={(e) => handleDescriptionChange(descLang, e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue"
            placeholder="AI açıklama üretiliyor..."
          />
        </div>
      )}

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary-text border border-border-subtle rounded-lg hover:border-border-default transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          Yeniden Üret
        </button>
      </div>
    </div>
  );
}
