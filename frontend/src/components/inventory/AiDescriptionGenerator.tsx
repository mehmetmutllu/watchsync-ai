'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Copy, Check, ChevronDown, Loader2, Languages } from 'lucide-react';
import { generateDescription, type GenerateDescriptionParams, type GenerateDescriptionResult } from '@/lib/market-api';
import type { Watch } from '@/types';

type Language = 'en' | 'de' | 'tr';

interface AiDescriptionGeneratorProps {
  watch?: Watch | null;
  onDescriptionReady?: (description: string) => void;
}

const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

export default function AiDescriptionGenerator({ watch, onDescriptionReady }: AiDescriptionGeneratorProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  const simulateStreaming = (text: string) => {
    setDescription('');
    setIsStreaming(true);
    let index = 0;

    streamIntervalRef.current = setInterval(() => {
      if (index < text.length) {
        const chunkSize = Math.floor(Math.random() * 3) + 1;
        const nextIndex = Math.min(index + chunkSize, text.length);
        setDescription(text.slice(0, nextIndex));
        index = nextIndex;
      } else {
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
        setIsStreaming(false);
      }
    }, 15);
  };

  const handleGenerate = async () => {
    if (!watch) return;

    setIsGenerating(true);
    setError(null);
    setDescription('');

    try {
      const params: GenerateDescriptionParams = {
        watch_id: watch.id,
        brand: watch.brand,
        model: watch.model,
        reference_number: watch.reference_number ?? undefined,
        year: watch.year ?? undefined,
        condition: watch.condition,
        language,
      };

      if (watch.features) {
        params.case_material = watch.features.case_material;
        params.movement = watch.features.movement;
        params.dial_color = watch.features.dial_color;
        params.bracelet_material = watch.features.bracelet_material;
        params.scope_of_delivery = watch.features.scope_of_delivery;
        if (watch.features.case_diameter) {
          params.case_diameter = parseFloat(watch.features.case_diameter);
        }
      }

      if (watch.sale_price) {
        params.price = parseFloat(watch.sale_price);
      }

      const result: GenerateDescriptionResult = await generateDescription(params);
      simulateStreaming(result.description);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Açıklama üretilemedi. Lütfen tekrar deneyin.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!description) return;
    await navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (description && onDescriptionReady) {
      onDescriptionReady(description);
    }
  };

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const hasWatch = !!watch;
  const isDisabled = !hasWatch || isGenerating || isStreaming;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-blue" />
          <h3 className="text-sm font-semibold text-primary-text">AI Açıklama Üretici</h3>
        </div>
        {/* Language Selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={isGenerating || isStreaming}
            className="appearance-none pl-8 pr-7 py-1.5 rounded-lg border border-border-subtle bg-surface-elevated text-xs font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 disabled:opacity-50"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
          <Languages className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-secondary-text" />
        </div>
      </div>

      {/* Watch Info */}
      {watch && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated text-xs text-secondary-text">
          <span className="font-medium text-primary-text">{watch.brand} {watch.model}</span>
          {watch.reference_number && (
            <span className="text-disabled-text">• {watch.reference_number}</span>
          )}
        </div>
      )}

      {!watch && (
        <p className="text-xs text-secondary-text px-3 py-2 rounded-lg bg-surface-elevated">
          Açıklama üretmek için önce bir saat seçin.
        </p>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isDisabled}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Üretiliyor...
          </>
        ) : description ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Yeniden Üret
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Açıklama Üret
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-semantic-error px-3 py-2 rounded-lg bg-semantic-error/10">
          {error}
        </p>
      )}

      {/* Description Output */}
      {(description || isStreaming) && (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              autoResizeTextarea();
            }}
            onInput={autoResizeTextarea}
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-border-subtle text-sm text-primary-text resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/40 transition-colors"
            placeholder="AI açıklaması burada görünecek..."
            readOnly={isStreaming}
          />

          {/* Streaming cursor */}
          {isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-accent-blue">
              <span className="w-1.5 h-4 bg-accent-blue animate-pulse rounded-full" />
              Yazılıyor...
            </div>
          )}

          {/* Action Buttons */}
          {!isStreaming && description && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-semantic-success" />
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Kopyala
                  </>
                )}
              </button>
              {onDescriptionReady && (
                <button
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Açıklamayı Uygula
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
