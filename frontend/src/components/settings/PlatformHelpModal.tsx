'use client';

import { X, ExternalLink, CheckCircle2, ChevronRight } from 'lucide-react';

interface PlatformHelpModalProps {
  platformName: string;
  onClose: () => void;
}

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export default function PlatformHelpModal({ platformName, onClose }: PlatformHelpModalProps) {
  const t = useTranslations('PlatformHelp');

  const title = t(`${platformName}.title`);

  const steps = useMemo(() => [
    {
      title: t(`${platformName}.s1_title`),
      desc: t(`${platformName}.s1_desc`),
      link: platformName === 'eBay' ? 'https://developer.ebay.com' : platformName === 'Chrono24' ? 'https://www.chrono24.com/dealer/' : 'https://admin.shopify.com',
    },
    {
      title: t(`${platformName}.s2_title`),
      desc: t(`${platformName}.s2_desc`),
    },
    {
      title: t(`${platformName}.s3_title`),
      desc: t(`${platformName}.s3_desc`),
    },
    {
      title: t(`${platformName}.s4_title`),
      desc: t(`${platformName}.s4_desc`),
    },
    {
      title: t(`${platformName}.s5_title`),
      desc: t(`${platformName}.s5_desc`),
    },
  ], [t, platformName]);

  const tips = useMemo(() => {
    const arr = [];
    if (platformName === 'eBay') {
      arr.push(t('eBay.t1'), t('eBay.t2'), t('eBay.t3'));
    } else if (platformName === 'Chrono24') {
      arr.push(t('Chrono24.t1'), t('Chrono24.t2'), t('Chrono24.t3'), t('Chrono24.t4'));
    } else if (platformName === 'Shopify') {
      arr.push(t('Shopify.t1'), t('Shopify.t2'), t('Shopify.t3'), t('Shopify.t4'));
    }
    return arr;
  }, [t, platformName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-primary-text">{title}</h2>
          <button onClick={onClose} className="p-1 text-secondary-text hover:text-primary-text rounded-md hover:bg-surface-elevated transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">{t('steps_title')}</h3>
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 p-4 bg-surface-elevated border border-border-strong rounded-lg">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-blue/10 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-accent-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-text">{step.title}</p>
                  <p className="text-sm text-secondary-text mt-1">{step.desc}</p>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline mt-2">
                      <ExternalLink className="w-3 h-3" />
                      {step.link}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">{t('tips_title')}</h3>
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-secondary-text">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle">
          <button onClick={onClose} className="w-full px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors">
            {t('got_it')}
          </button>
        </div>
      </div>
    </div>
  );
}
