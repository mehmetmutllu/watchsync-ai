'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { watchesApi } from '@/lib/watches-api';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useToastStore } from '@/stores/toastStore';
import StepBrandModel from './StepBrandModel';
import StepDetails from './StepDetails';
import StepPricing from './StepPricing';
import StepPhotos from './StepPhotos';
import StepAiProcessing from './StepAiProcessing';
import StepReviewPublish from './StepReviewPublish';
import type { Watch, WatchFormData, WatchImage } from '@/types';
import { useTranslations } from 'next-intl';



export interface WatchWizardFormData {
  brand: string;
  model: string;
  condition: 'new' | 'unworn' | 'very_good' | 'good' | 'fair';
  reference_number?: string;
  year?: number;
  features?: {
    case_material?: string;
    bracelet_material?: string;
    dial_color?: string;
    movement?: string;
    case_diameter?: string;
    water_resistance?: string;
    power_reserve?: string;
    scope_of_delivery?: string;
  };
  cost_price?: number;
  sale_price?: number;
  currency?: 'EUR' | 'USD' | 'GBP' | 'TRY' | 'CHF';
  description?: string;
}

interface WatchWizardProps {
  watchId?: number;
}

export default function WatchWizard({ watchId }: WatchWizardProps) {
  const router = useRouter();
  const isEdit = !!watchId;
  const { fetchWatches } = useInventoryStore();
  const addToast = useToastStore((s) => s.addToast);
  const t = useTranslations('Wizard');

  const [step, setStep] = useState(1);
  const [savedWatchId, setSavedWatchId] = useState<number | null>(watchId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWatch, setIsLoadingWatch] = useState(false);

  // Image state
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string; thumb_url: string; is_primary: boolean }>>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const watchWizardSchema = useMemo(() => z.object({
    brand: z.string().min(1, t('brand_required')),
    model: z.string().min(1, t('model_required')),
    condition: z.enum(['new', 'unworn', 'very_good', 'good', 'fair'], {
      message: t('condition_required'),
    }),
    reference_number: z.string().optional(),
    year: z.coerce.number().min(1800).max(new Date().getFullYear() + 1).optional().or(z.literal('')),
    features: z.object({
      case_material: z.string().optional(),
      bracelet_material: z.string().optional(),
      dial_color: z.string().optional(),
      movement: z.string().optional(),
      case_diameter: z.string().optional(),
      water_resistance: z.string().optional(),
      power_reserve: z.string().optional(),
      scope_of_delivery: z.string().optional(),
    }).optional(),
    cost_price: z.coerce.number().min(0).optional().or(z.literal('')),
    sale_price: z.coerce.number().min(0).optional().or(z.literal('')),
    currency: z.enum(['EUR', 'USD', 'GBP', 'TRY', 'CHF']).optional(),
    description: z.string().max(10000).optional(),
  }), [t]);

  const localizedSteps = useMemo(() => [
    { id: 1, label: t('step_brand_model') },
    { id: 2, label: t('step_details') },
    { id: 3, label: t('step_pricing') },
    { id: 4, label: t('step_photos') },
    { id: 5, label: t('step_ai_processing') },
    { id: 6, label: t('step_review_publish') },
  ], [t]);

  const methods = useForm<WatchWizardFormData>({
    resolver: zodResolver(watchWizardSchema) as any,
    defaultValues: {
      brand: '',
      model: '',
      condition: 'new',
      reference_number: '',
      currency: 'EUR',
      features: {},
      description: '',
    },
    mode: 'onTouched',
  });

  const { trigger, getValues, reset } = methods;

  // Load watch for editing
  useEffect(() => {
    if (!isEdit || !watchId) return;
    setIsLoadingWatch(true);
    watchesApi
      .get(watchId)
      .then((w: Watch) => {
        reset({
          brand: w.brand,
          model: w.model,
          reference_number: w.reference_number || '',
          year: w.year || ('' as unknown as undefined),
          condition: w.condition,
          cost_price: w.cost_price ? parseFloat(w.cost_price) : ('' as unknown as undefined),
          sale_price: w.sale_price ? parseFloat(w.sale_price) : ('' as unknown as undefined),
          currency: (w.currency as 'EUR' | 'USD' | 'GBP' | 'TRY' | 'CHF') || 'EUR',
          features: w.features || {},
          description: w.description || '',
        });
        if (w.images) {
          setExistingImages(
            w.images.map((img) => ({
              id: img.id,
              url: img.url || img.image_url,
              thumb_url: img.thumb_url || img.url || img.image_url,
              is_primary: img.is_primary,
            }))
          );
        }
      })
      .catch(() => addToast({ type: 'error', title: t('error_load_watch') }))
      .finally(() => setIsLoadingWatch(false));
  }, [isEdit, watchId, reset, addToast, t]);

  // Save watch (create or update) — called when leaving step 3 or earlier
  const saveWatch = useCallback(async (): Promise<number | null> => {
    const data = getValues();
    const payload: WatchFormData = {
      brand: data.brand,
      model: data.model,
      reference_number: data.reference_number || undefined,
      year: data.year ? Number(data.year) : undefined,
      condition: data.condition,
      cost_price: data.cost_price ? Number(data.cost_price) : undefined,
      sale_price: data.sale_price ? Number(data.sale_price) : undefined,
      currency: data.currency || 'EUR',
      features: data.features || {},
      description: data.description || undefined,
      status: 'draft',
    };

    try {
      if (savedWatchId) {
        await watchesApi.update(savedWatchId, payload);
        return savedWatchId;
      } else {
        const watch = await watchesApi.create(payload);
        setSavedWatchId(watch.id);
        return watch.id;
      }
    } catch {
      addToast({ type: 'error', title: t('error_save_watch') });
      return null;
    }
  }, [getValues, savedWatchId, addToast, t]);

  // Upload pending files when moving from step 4
  const uploadPendingFiles = useCallback(async (wId: number) => {
    if (pendingFiles.length === 0) return;
    setIsUploading(true);
    try {
      const newImages = await watchesApi.uploadImages(wId, pendingFiles, existingImages.length === 0);
      setExistingImages((prev) => [
        ...prev,
        ...newImages.map((img) => ({
          id: img.id,
          url: img.url || img.image_url,
          thumb_url: img.thumb_url || img.url || img.image_url,
          is_primary: img.is_primary,
        })),
      ]);
      setPendingFiles([]);
    } catch {
      addToast({ type: 'error', title: t('error_upload_failed') });
    } finally {
      setIsUploading(false);
    }
  }, [pendingFiles, existingImages.length, addToast, t]);

  const goNext = async () => {
    let valid = true;

    if (step === 1) {
      valid = await trigger(['brand', 'model', 'condition']);
    } else if (step === 2) {
      valid = await trigger(['reference_number', 'year']);
    } else if (step === 3) {
      valid = await trigger(['cost_price', 'sale_price', 'currency']);
      if (valid) {
        setIsSubmitting(true);
        const wId = await saveWatch();
        setIsSubmitting(false);
        if (!wId) return;
      }
    } else if (step === 4) {
      // Must have at least 1 photo
      if (existingImages.length === 0 && pendingFiles.length === 0) {
        addToast({ type: 'warning', title: t('warning_min_photos') });
        return;
      }
      if (savedWatchId && pendingFiles.length > 0) {
        await uploadPendingFiles(savedWatchId);
      }
    }

    if (valid && step < 6) {
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const totalImages = existingImages.length + pendingFiles.length;
  const hasPhotos = totalImages > 0;

  if (isLoadingWatch) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {localizedSteps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors
                  ${s.id === step
                    ? 'bg-accent-blue text-white'
                    : s.id < step
                      ? 'bg-accent-green text-white cursor-pointer'
                      : 'bg-surface-secondary text-secondary-text'
                  }
                `}
              >
                {s.id < step ? <Check className="w-4 h-4" /> : s.id}
              </button>
              {i < localizedSteps.length - 1 && (
                <div className={`w-8 sm:w-16 lg:w-24 h-0.5 mx-1 ${s.id < step ? 'bg-accent-green' : 'bg-border-subtle'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {localizedSteps.map((s) => (
            <span key={s.id} className={`text-[10px] sm:text-xs ${s.id === step ? 'text-accent-blue font-medium' : 'text-secondary-text'}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <FormProvider {...methods}>
        <div className="glass-strong rounded-xl p-6 sm:p-8 min-h-[400px]">
          {step === 1 && <StepBrandModel />}
          {step === 2 && <StepDetails />}
          {step === 3 && <StepPricing />}
          {step === 4 && (
            <StepPhotos
              watchId={savedWatchId}
              existingImages={existingImages}
              pendingFiles={pendingFiles}
              onExistingImagesChange={setExistingImages}
              onPendingFilesChange={setPendingFiles}
              isUploading={isUploading}
            />
          )}
          {step === 5 && savedWatchId && (
            <StepAiProcessing
              watchId={savedWatchId}
              existingImages={existingImages}
            />
          )}
          {step === 6 && savedWatchId && (
            <StepReviewPublish
              watchId={savedWatchId}
              formData={getValues()}
              existingImages={existingImages}
              onSaveDraft={async () => {
                await saveWatch();
                fetchWatches();
                addToast({ type: 'success', title: t('toast_draft_saved') });
                router.push('/dashboard/inventory');
              }}
              onPublishComplete={() => {
                fetchWatches();
                addToast({ type: 'success', title: t('toast_publish_success') });
                router.push('/dashboard/inventory');
              }}
            />
          )}
        </div>
      </FormProvider>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:border-border-default transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('back_btn')}
        </button>

        {step < 6 ? (
          <button
            onClick={goNext}
            disabled={isSubmitting || isUploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                {t('next_btn')}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
