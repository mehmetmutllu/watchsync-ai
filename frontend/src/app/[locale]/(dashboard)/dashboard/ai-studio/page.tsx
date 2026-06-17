'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Sparkles, Download, Loader2, AlertCircle, ImageIcon, ChevronDown } from 'lucide-react';
import BeforeAfterSlider from '@/components/ai-studio/BeforeAfterSlider';
import BackgroundSelector from '@/components/ai-studio/BackgroundSelector';
import { enhanceWatchImage, type AiEnhanceResult, type AiBackgroundVariant } from '@/lib/ai-api';
import { watchesApi } from '@/lib/watches-api';
import AiDescriptionGenerator from '@/components/inventory/AiDescriptionGenerator';
import type { Watch } from '@/types';

type StudioStep = 'upload' | 'processing' | 'result';

export default function AiStudioPage() {
  const t = useTranslations('AiStudio');

  const [step, setStep] = useState<StudioStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bgPreset, setBgPreset] = useState('white_studio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiEnhanceResult | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch selector state
  const [watches, setWatches] = useState<Watch[]>([]);
  const [selectedWatchId, setSelectedWatchId] = useState<number | null>(null);
  const [isLoadingWatches, setIsLoadingWatches] = useState(true);

  useEffect(() => {
    const loadWatches = async () => {
      try {
        const response = await watchesApi.list({ per_page: 100, status: 'active' });
        setWatches(response.data);
      } catch {
        // Watches couldn't be loaded — selector will show empty state
      } finally {
        setIsLoadingWatches(false);
      }
    };
    loadWatches();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('image_error'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(t('size_error'));
      return;
    }
    setError(null);
    setSelectedFile(file);
    setResult(null);
    setStep('upload');

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleProcess = async () => {
    if (!selectedFile || !selectedWatchId) return;
    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const data = await enhanceWatchImage(selectedWatchId, selectedFile);
      setResult(data);
      setActiveVariant(0);
      setStep('result');
    } catch (err: any) {
      const message = err?.response?.data?.message || t('api_error');
      setError(message);
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchsync-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep('upload');
  };

  const currentVariant: AiBackgroundVariant | null = result?.results?.[activeVariant] ?? null;
  const selectedWatch = watches.find((w) => w.id === selectedWatchId) ?? null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary-text">{t('title')}</h1>
          <p className="mt-1 text-sm text-secondary-text">
            {t('desc')}
          </p>
        </div>
        {/* Watch Selector */}
        <div className="w-full sm:w-72">
          <label htmlFor="watch-select" className="block text-xs font-medium text-secondary-text mb-1">
            {t('select_watch')}
          </label>
          <div className="relative">
            <select
              id="watch-select"
              value={selectedWatchId ?? ''}
              onChange={(e) => setSelectedWatchId(e.target.value ? Number(e.target.value) : null)}
              disabled={isLoadingWatches || isProcessing}
              className="w-full appearance-none rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2 pr-8 text-sm text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 disabled:opacity-50"
            >
              <option value="">
                {isLoadingWatches ? t('select_watch_loading') : t('select_watch_placeholder')}
              </option>
              {watches.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.brand} {w.model}{w.reference_number ? ` (${w.reference_number})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/20">
          <AlertCircle className="w-5 h-5 text-semantic-error flex-shrink-0" />
          <p className="text-sm text-semantic-error">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Image Area */}
        <div className="xl:col-span-2">
          <div className="glass rounded-xl p-6">
            {step === 'upload' && !preview && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 py-20 border-2 border-dashed border-border-subtle rounded-xl cursor-pointer hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-accent-blue" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary-text">
                    {t('upload_click_drag')}
                  </p>
                  <p className="mt-1 text-xs text-secondary-text">
                    {t('upload_specs')}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            )}

            {step === 'upload' && preview && (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-elevated flex items-center justify-center">
                  <img
                    src={preview}
                    alt={t('uploaded_image')}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
                  >
                    {t('change_btn')}
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={!selectedWatchId}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    {selectedWatchId ? t('process_btn') : t('select_watch_first')}
                  </button>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="w-12 h-12 text-accent-blue animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-primary-text">{t('processing')}</p>
                  <p className="mt-1 text-xs text-secondary-text">
                    {t('processing_desc')}
                  </p>
                </div>
              </div>
            )}

            {step === 'result' && result && preview && currentVariant && (
              <div className="space-y-4">
                <BeforeAfterSlider
                  beforeSrc={preview}
                  afterSrc={currentVariant.result_url}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-sm font-medium rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
                  >
                    {t('new_image')}
                  </button>
                  <button
                    onClick={() => handleDownload(currentVariant.result_url)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {t('download')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls — horizontal on tablet, vertical on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-6">
          {/* Background Selector */}
          <div className="glass rounded-xl p-5 col-span-2 md:col-span-1">
            <BackgroundSelector
              selected={bgPreset}
              onSelect={setBgPreset}
              disabled={isProcessing}
            />
          </div>

          {/* Result Variants */}
          {result && result.results.length > 1 && (
            <div className="glass rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-primary-text">{t('variants')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {result.results.map((variant, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVariant(i)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeVariant === i
                        ? 'border-accent-blue ring-2 ring-accent-blue/20'
                        : 'border-border-subtle hover:border-border-default'
                    }`}
                  >
                    <img
                      src={variant.result_url}
                      alt={t('variant_label', { num: i + 1 })}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Info */}
          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-primary-text">{t('about_ai')}</h3>
            <div className="space-y-2 text-xs text-secondary-text">
              <p>{t('about_ai_sam2')}</p>
              <p>{t('about_ai_bg')}</p>
              <p>{t('about_ai_shadow')}</p>
            </div>
          </div>

          {/* AI Description Generator */}
          <div className="col-span-2 md:col-span-3 xl:col-span-1">
            <AiDescriptionGenerator watch={selectedWatch} />
          </div>
        </div>
      </div>
    </div>
  );
}
