'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { WatchWizardFormData } from './WatchWizard';

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
  { value: 'TRY', label: '₺ TRY', symbol: '₺' },
  { value: 'CHF', label: 'CHF', symbol: 'CHF' },
];

export default function StepPricing() {
  const t = useTranslations('Wizard');
  const { register, formState: { errors }, watch, setValue } = useFormContext<WatchWizardFormData>();
  const selectedCurrency = watch('currency') || 'EUR';
  const currencySymbol = CURRENCY_OPTIONS.find((c) => c.value === selectedCurrency)?.symbol || '€';

  const costPrice = watch('cost_price');
  const salePrice = watch('sale_price');
  const profit = costPrice && salePrice ? Number(salePrice) - Number(costPrice) : null;
  const margin = profit && salePrice ? ((profit / Number(salePrice)) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">{t('pricing_title')}</h2>
        <p className="text-sm text-secondary-text">{t('pricing_desc')}</p>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">{t('currency_label')}</label>
        <div className="flex gap-2">
          {CURRENCY_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setValue('currency', c.value as WatchWizardFormData['currency'], { shouldValidate: true })}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                ${selectedCurrency === c.value
                  ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                  : 'border-border-subtle text-secondary-text hover:border-border-default'
                }
              `}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cost Price */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('cost_label')}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary-text">{currencySymbol}</span>
            <input
              {...register('cost_price')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
            />
          </div>
          {errors.cost_price && <p className="mt-1 text-xs text-semantic-error">{errors.cost_price.message}</p>}
        </div>

        {/* Sale Price */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('sale_label')}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary-text">{currencySymbol}</span>
            <input
              {...register('sale_price')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
            />
          </div>
          {errors.sale_price && <p className="mt-1 text-xs text-semantic-error">{errors.sale_price.message}</p>}
        </div>
      </div>

      {/* Profit Preview */}
      {profit !== null && (
        <div className={`p-4 rounded-lg border ${profit >= 0 ? 'border-accent-green/30 bg-accent-green/5' : 'border-semantic-error/30 bg-semantic-error/5'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-text">{t('estimated_profit')}</span>
            <span className={`text-lg font-semibold ${profit >= 0 ? 'text-accent-green' : 'text-semantic-error'}`}>
              {currencySymbol}{Math.abs(profit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {margin && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-secondary-text">{t('profit_margin')}</span>
              <span className={`text-sm font-medium ${profit >= 0 ? 'text-accent-green' : 'text-semantic-error'}`}>
                {profit >= 0 ? '+' : '-'}{Math.abs(Number(margin))}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
