'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X, ChevronRight, ChevronLeft, Upload, Trash2, Loader2, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { watchesApi } from '@/lib/watches-api';
import { generateDescription } from '@/lib/market-api';
import type { WatchFormData, Watch } from '@/types';
import { useTranslations } from 'next-intl';

// ─── Zod Validation Schema ────────────────────────────────────

const watchSchema = z.object({
  brand: z.string().min(1, 'Marka zorunludur'),
  model: z.string().min(1, 'Model zorunludur'),
  reference_number: z.string().optional(),
  year: z.coerce.number().min(1800).max(new Date().getFullYear() + 1).optional().or(z.literal('')),
  condition: z.enum(['new', 'unworn', 'very_good', 'good', 'fair'], {
    message: 'Kondisyon seçiniz',
  }),
  status: z.enum(['draft', 'active']).optional(),
  cost_price: z.coerce.number().min(0).optional().or(z.literal('')),
  sale_price: z.coerce.number().min(0).optional().or(z.literal('')),
  currency: z.enum(['EUR', 'USD', 'GBP', 'TRY', 'CHF']).optional(),
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
  description: z.string().max(5000).optional(),
});

type WatchSchemaType = z.infer<typeof watchSchema>;

const STEPS = [
  { id: 1, label: 'Marka & Model' },
  { id: 2, label: 'Referans & Yıl' },
  { id: 3, label: 'Teknik Detaylar' },
  { id: 4, label: 'Fotoğraflar' },
  { id: 5, label: 'Fiyat & Açıklama' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Sıfır' },
  { value: 'unworn', label: 'Kullanılmamış' },
  { value: 'very_good', label: 'Çok İyi' },
  { value: 'good', label: 'İyi' },
  { value: 'fair', label: 'Orta' },
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'TRY', label: '₺ TRY' },
  { value: 'CHF', label: 'CHF' },
];

interface WatchFormModalProps {
  watchId: number | null;
  onClose: () => void;
}

export default function WatchFormModal({ watchId, onClose }: WatchFormModalProps) {
  const t = useTranslations('WatchForm');
  const tInv = useTranslations('Inventory');
  const tCommon = useTranslations('Common');

  const steps = useMemo(() => [
    { id: 1, label: t('step_brand_model') },
    { id: 2, label: t('step_ref_year') },
    { id: 3, label: t('step_details') },
    { id: 4, label: t('step_photos') },
    { id: 5, label: t('step_pricing') },
  ], [t]);

  const conditionOptions = useMemo(() => [
    { value: 'new', label: tInv('cond_new') },
    { value: 'unworn', label: tInv('cond_unworn') },
    { value: 'very_good', label: tInv('cond_very_good') },
    { value: 'good', label: tInv('cond_good') },
    { value: 'fair', label: tInv('cond_fair') },
  ], [tInv]);

  const isEdit = watchId !== null;
  const { createWatch, updateWatch, fetchWatches } = useInventoryStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWatch, setIsLoadingWatch] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedWatchId, setSavedWatchId] = useState<number | null>(watchId);

  // Image state
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string; thumb_url: string; is_primary: boolean }>>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // AI auto-fill state
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [aiFillError, setAiFillError] = useState<string | null>(null);

  // Create object URLs for pending files and revoke on cleanup
  const pendingPreviews = useMemo(() => pendingFiles.map((f) => URL.createObjectURL(f)), [pendingFiles]);
  useEffect(() => {
    return () => { pendingPreviews.forEach((url) => URL.revokeObjectURL(url)); };
  }, [pendingPreviews]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm<WatchSchemaType>({
    defaultValues: {
      brand: '',
      model: '',
      reference_number: '',
      condition: 'new',
      status: 'draft',
      currency: 'EUR',
      features: {},
      description: '',
    },
  });

  // Load watch data for editing
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
      .catch(() => setSubmitError(t('toast_watch_load_failed')))
      .finally(() => setIsLoadingWatch(false));
  }, [isEdit, watchId, reset]);

  const goNext = async () => {
    let valid = true;
    if (step === 1) {
      valid = await trigger(['brand', 'model', 'condition']);
    }
    if (valid && step < 5) setStep(step + 1);
  };

  const goPrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAiFill = async () => {
    const brand = watch('brand');
    const model = watch('model');
    if (!brand || !model) {
      setAiFillError(t('ai_fill_error_brand_model'));
      return;
    }
    setIsAiFilling(true);
    setAiFillError(null);
    try {
      const result = await generateDescription({
        brand,
        model,
        reference_number: watch('reference_number') || undefined,
        year: watch('year') ? Number(watch('year')) : undefined,
        condition: watch('condition'),
        language: 'tr',
        tone: 'professional',
      });
      // AI description'ı sadece boşsa doldur
      const currentDesc = watch('description');
      if (!currentDesc?.trim()) {
        setValue('description', result.description);
      }
    } catch {
      setAiFillError(t('ai_fill_error_service'));
    } finally {
      setIsAiFilling(false);
    }
  };

  const onSubmit = async (data: WatchSchemaType) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: WatchFormData = {
        brand: data.brand,
        model: data.model,
        reference_number: data.reference_number,
        year: data.year ? Number(data.year) : undefined,
        condition: data.condition,
        status: data.status,
        cost_price: data.cost_price ? Number(data.cost_price) : undefined,
        sale_price: data.sale_price ? Number(data.sale_price) : undefined,
        currency: data.currency,
        features: data.features,
        description: data.description,
      };

      let resultWatch: Watch;
      if (isEdit && watchId) {
        resultWatch = await updateWatch(watchId, payload);
      } else {
        resultWatch = await createWatch(payload);
      }

      setSavedWatchId(resultWatch.id);

      // Upload pending images
      if (pendingFiles.length > 0) {
        setIsUploading(true);
        try {
          await watchesApi.uploadImages(resultWatch.id, pendingFiles, existingImages.length === 0);
          setPendingFiles([]);
        } catch {
          setSubmitError(t('toast_save_success_images_failed'));
        }
        setIsUploading(false);
      }

      fetchWatches();
      if (!submitError) onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const apiErrors = axiosErr.response?.data?.errors;
        if (apiErrors) {
          const messages = Object.values(apiErrors).flat().join(', ');
          setSubmitError(messages);
        } else {
          setSubmitError(axiosErr.response?.data?.message || tCommon('error'));
        }
      } else {
        setSubmitError(tCommon('error'));
      }
    }
    setIsSubmitting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!savedWatchId) return;
    try {
      await watchesApi.deleteImage(savedWatchId, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setSubmitError(t('toast_image_delete_failed'));
    }
  };

  if (isLoadingWatch) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-strong border border-white/10 shadow-lg rounded-2xl p-8">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin mx-auto" />
          <p className="mt-3 text-sm text-secondary-text">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] glass-strong border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-primary-text">
            {isEdit ? t('title_edit') : t('title_add')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated text-secondary-text hover:text-primary-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center px-6 py-3 border-b border-white/10 gap-1">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  step === s.id
                    ? 'text-accent-blue'
                    : step > s.id
                    ? 'text-semantic-success cursor-pointer'
                    : 'text-disabled-text'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step === s.id
                      ? 'bg-accent-blue text-white'
                      : step > s.id
                      ? 'bg-semantic-success/20 text-semantic-success'
                      : 'bg-surface-elevated text-disabled-text'
                  }`}
                >
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    step > s.id ? 'bg-semantic-success/40' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Step 1: Brand & Model */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('brand_label')}
                  </label>
                  <input
                    {...register('brand', { required: t('brand_required') })}
                    placeholder={t('brand_placeholder')}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  {errors.brand && (
                    <p className="mt-1 text-xs text-semantic-error">{errors.brand.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('model_label')}
                  </label>
                  <input
                    {...register('model', { required: t('model_required') })}
                    placeholder={t('model_placeholder')}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  {errors.model && (
                    <p className="mt-1 text-xs text-semantic-error">{errors.model.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('condition_label')}
                  </label>
                  <select
                    {...register('condition', { required: t('condition_required') })}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue transition-colors"
                  >
                    {conditionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.condition && (
                    <p className="mt-1 text-xs text-semantic-error">{errors.condition.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Reference & Year */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('ref_label')}
                  </label>
                  <input
                    {...register('reference_number')}
                    placeholder={t('ref_placeholder')}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text font-mono placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                  />
                  <p className="mt-1 text-xs text-secondary-text">
                    {t('ref_desc')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('year_label')}
                  </label>
                  <input
                    type="number"
                    {...register('year')}
                    placeholder={t('year_placeholder')}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Technical Details */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('movement_label')}
                    </label>
                    <input
                      {...register('features.movement')}
                      placeholder={t('movement_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('case_material_label')}
                    </label>
                    <input
                      {...register('features.case_material')}
                      placeholder={t('case_material_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('bracelet_material_label')}
                    </label>
                    <input
                      {...register('features.bracelet_material')}
                      placeholder={t('bracelet_material_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('dial_color_label')}
                    </label>
                    <input
                      {...register('features.dial_color')}
                      placeholder={t('dial_color_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('case_diameter_label')}
                    </label>
                    <input
                      {...register('features.case_diameter')}
                      placeholder={t('case_diameter_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('water_resistance_label')}
                    </label>
                    <input
                      {...register('features.water_resistance')}
                      placeholder={t('water_resistance_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('power_reserve_label')}
                    </label>
                    <input
                      {...register('features.power_reserve')}
                      placeholder={t('power_reserve_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('scope_label')}
                    </label>
                    <input
                      {...register('features.scope_of_delivery')}
                      placeholder={t('scope_placeholder')}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-lg hover:border-accent-blue/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="w-8 h-8 text-disabled-text mb-3" />
                  <p className="text-sm text-secondary-text mb-1">
                    {t('images_drag_drop')}
                  </p>
                  <p className="text-xs text-disabled-text">
                    {t('images_specs')}
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary-text mb-2">{t('images_existing')}</p>
                    <div className="grid grid-cols-4 gap-3">
                      {existingImages.map((img) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden bg-surface-elevated">
                          <img
                            src={img.thumb_url}
                            alt="Watch"
                            className="w-full aspect-square object-cover"
                          />
                          {img.is_primary && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-accent-blue text-white text-[10px] rounded font-medium">
                              {t('images_primary')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(img.id)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-semantic-error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending files preview */}
                {pendingFiles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary-text mb-2">
                      {t('images_pending', { count: pendingFiles.length })}
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {pendingFiles.map((file, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden bg-surface-elevated">
                          <img
                            src={pendingPreviews[i]}
                            alt={file.name}
                            className="w-full aspect-square object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePendingFile(i)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-semantic-error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                            <p className="text-[10px] text-white truncate">{file.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingImages.length === 0 && pendingFiles.length === 0 && (
                  <div className="flex flex-col items-center py-6 text-center">
                    <ImageIcon className="w-10 h-10 text-disabled-text mb-2" />
                    <p className="text-sm text-secondary-text">{t('images_empty')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Price & Description */}
            {step === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('currency_label')}
                  </label>
                  <select
                    {...register('currency')}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue transition-colors"
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('cost_price_label')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('cost_price')}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text font-mono placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1.5">
                      {t('sale_price_label')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('sale_price')}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text font-mono placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
                    />
                  </div>
                </div>

                {/* Profit preview */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-secondary-text mb-1">{t('estimated_profit')}</p>
                  <ProfitPreview
                    costPrice={watch('cost_price')}
                    salePrice={watch('sale_price')}
                    currency={watch('currency') || 'EUR'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1.5">
                    {t('initial_status')}
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-accent-blue transition-colors">
                      <input type="radio" value="draft" {...register('status')} className="text-accent-blue" />
                      <span className="text-sm text-primary-text">{t('status_draft')}</span>
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-accent-blue transition-colors">
                      <input type="radio" value="active" {...register('status')} className="text-accent-blue" />
                      <span className="text-sm text-primary-text">{t('status_active')}</span>
                    </label>
                  </div>
                </div>

                {/* Description + AI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-secondary-text">
                      {t('description_label')}
                    </label>
                    <button
                      type="button"
                      onClick={handleAiFill}
                      disabled={isAiFilling || !watch('brand') || !watch('model')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAiFilling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {isAiFilling ? t('ai_filling') : t('ai_fill_btn')}
                    </button>
                  </div>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder={t('description_placeholder')}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors resize-none"
                  />
                  {aiFillError && (
                    <p className="mt-1 text-xs text-semantic-error">{aiFillError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {submitError && (
            <div className="mx-6 mb-3 p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-sm">
              {submitError}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={step === 1 ? onClose : goPrev}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-secondary-text hover:text-primary-text rounded-lg hover:bg-surface-elevated transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? t('cancel') : t('back_btn')}
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors"
              >
                {t('next_btn')}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(isSubmitting || isUploading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isEdit ? t('submit_update') : t('submit_save')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Profit Preview Sub-component ──────────────────────────────

function ProfitPreview({
  costPrice,
  salePrice,
  currency,
}: {
  costPrice: number | '' | undefined;
  salePrice: number | '' | undefined;
  currency: string;
}) {
  const t = useTranslations("WatchForm");
  const cost = costPrice ? Number(costPrice) : 0;
  const sale = salePrice ? Number(salePrice) : 0;
  const profit = sale - cost;
  const margin = sale > 0 ? ((profit / sale) * 100).toFixed(1) : '0.0';

  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    TRY: '₺',
    CHF: 'CHF ',
  };
  const sym = symbols[currency] || currency + ' ';

  if (!cost && !sale) {
    return <p className="text-sm text-disabled-text">{t('price_not_provided')}</p>;
  }

  return (
    <div className="flex items-baseline gap-3">
      <span
        className={`text-xl font-bold font-mono ${
          profit >= 0 ? 'text-semantic-success' : 'text-semantic-error'
        }`}
      >
        {profit >= 0 ? '+' : ''}
        {sym}
        {Math.abs(profit).toLocaleString('en-US', { minimumFractionDigits: 0 })}
      </span>
      <span className="text-sm text-secondary-text">{t('margin_preview', { margin })}</span>
    </div>
  );
}
