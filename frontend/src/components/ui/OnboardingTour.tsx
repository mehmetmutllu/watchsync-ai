'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  target: string;       // CSS selector
  key: string;          // çeviri anahtarı
  position?: 'top' | 'bottom' | 'start' | 'end';
}

const TOUR_STEPS: TourStep[] = [
  { target: '[data-tour="sidebar"]', key: 'sidebar', position: 'end' },
  { target: '[data-tour="inventory"]', key: 'inventory', position: 'bottom' },
  { target: '[data-tour="sync-status"]', key: 'sync_status', position: 'bottom' },
  { target: '[data-tour="notifications"]', key: 'notifications', position: 'bottom' },
];

const STORAGE_KEY = 'watchsync_onboarding_completed';

export default function OnboardingTour() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const positionTooltip = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pos = step.position || 'bottom';
    const gap = 12;

    const style: React.CSSProperties = { position: 'fixed', zIndex: 9999 };

    // 'start'/'end' mantıksal yönlerdir: RTL'de otomatik aynalanır.
    const physical =
      pos === 'start' ? (isRtl ? 'right' : 'left')
      : pos === 'end' ? (isRtl ? 'left' : 'right')
      : pos;

    switch (physical) {
      case 'right':
        style.top = rect.top + rect.height / 2;
        style.left = rect.right + gap;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.top = rect.top + rect.height / 2;
        style.right = window.innerWidth - rect.left + gap;
        style.transform = 'translateY(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - rect.top + gap;
        style.left = rect.left + rect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
      default:
        style.top = rect.bottom + gap;
        style.left = rect.left + rect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
    }

    setTooltipStyle(style);
  }, [currentStep, isRtl]);

  useEffect(() => {
    if (!isVisible) return;
    // Konumlandırmayı bir sonraki çerçeveye ertele: efekt gövdesinde doğrudan
    // setState çağrısı zincirleme render'a yol açıyor.
    const frame = requestAnimationFrame(positionTooltip);
    window.addEventListener('resize', positionTooltip);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', positionTooltip);
    };
  }, [isVisible, currentStep, positionTooltip]);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const next = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div
        role="dialog"
        aria-label={t('step_aria', {
          current: currentStep + 1,
          total: TOUR_STEPS.length,
          title: t(`${step.key}_title`),
        })}
        style={tooltipStyle}
        className="w-72 bg-surface-elevated border border-border-subtle rounded-xl shadow-elevated p-4 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-secondary-text font-medium">
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
          <button
            onClick={dismiss}
            className="p-1 rounded-md hover:bg-surface text-secondary-text hover:text-primary-text transition-colors"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h4 className="text-sm font-semibold text-primary-text mb-1">
          {t(`${step.key}_title`)}
        </h4>
        <p className="text-xs text-secondary-text leading-relaxed mb-4">
          {t(`${step.key}_desc`)}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentStep
                  ? 'w-4 bg-accent-blue'
                  : i < currentStep
                    ? 'w-1.5 bg-accent-blue/50'
                    : 'w-1.5 bg-border-subtle'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-xs text-secondary-text hover:text-primary-text transition-colors"
          >
            {t('skip')}
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={prev}
                className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-secondary-text hover:text-primary-text bg-surface rounded-md transition-colors"
              >
                <ChevronLeft className="w-3 h-3 rtl-flip" />
                {t('back')}
              </button>
            )}
            <button
              onClick={next}
              className="btn-press inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-accent-blue hover:bg-accent-blue-hover rounded-md transition-colors"
            >
              {isLast ? t('finish') : t('next')}
              {!isLast && <ChevronRight className="w-3 h-3 rtl-flip" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
