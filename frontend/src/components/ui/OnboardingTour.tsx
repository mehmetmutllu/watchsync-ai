'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  target: string;       // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigasyon Menüsü',
    description: 'Sol menüden envanter, siparişler, CRM ve diğer modüllere hızlıca erişebilirsiniz.',
    position: 'right',
  },
  {
    target: '[data-tour="inventory"]',
    title: 'Envanter Yönetimi',
    description: 'Saatlerinizi ekleyin, düzenleyin ve tüm platformlarda stok durumunu takip edin.',
    position: 'bottom',
  },
  {
    target: '[data-tour="sync-status"]',
    title: 'Senkronizasyon Durumu',
    description: 'Platform senkronizasyon durumlarını gerçek zamanlı olarak buradan izleyebilirsiniz.',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Bildirimler',
    description: 'Stok uyarıları, sipariş bildirimleri ve sistem güncellemelerini burada göreceksiniz.',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'watchsync_onboarding_completed';

export default function OnboardingTour() {
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

    let style: React.CSSProperties = { position: 'fixed', zIndex: 9999 };

    switch (pos) {
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
  }, [currentStep]);

  useEffect(() => {
    if (!isVisible) return;
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
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
        aria-label={`Adım ${currentStep + 1} / ${TOUR_STEPS.length}: ${step.title}`}
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
            aria-label="Turu kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h4 className="text-sm font-semibold text-primary-text mb-1">
          {step.title}
        </h4>
        <p className="text-xs text-secondary-text leading-relaxed mb-4">
          {step.description}
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
            Atla
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={prev}
                className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-secondary-text hover:text-primary-text bg-surface rounded-md transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                Geri
              </button>
            )}
            <button
              onClick={next}
              className="btn-press inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-accent-blue hover:bg-accent-blue-hover rounded-md transition-colors"
            >
              {isLast ? 'Bitir' : 'İleri'}
              {!isLast && <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
