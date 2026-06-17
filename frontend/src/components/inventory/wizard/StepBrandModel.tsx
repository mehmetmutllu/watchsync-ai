'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { WatchWizardFormData } from './WatchWizard';

const BRANDS = [
  'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier',
  'IWC', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'A. Lange & Söhne',
  'Breitling', 'Tudor', 'Panerai', 'Hublot', 'TAG Heuer', 'Zenith',
  'Chopard', 'Girard-Perregaux', 'Blancpain', 'Ulysse Nardin', 'Grand Seiko',
  'Seiko', 'Tissot', 'Longines', 'Oris', 'Bell & Ross', 'Nomos',
  'Baume & Mercier', 'Maurice Lacroix', 'Montblanc', 'Piaget',
];

export default function StepBrandModel() {
  const t = useTranslations('Wizard');
  const { register, formState: { errors }, watch, setValue } = useFormContext<WatchWizardFormData>();
  const selectedBrand = watch('brand');
  const selectedCondition = watch('condition');

  const CONDITION_OPTIONS = [
    { value: 'new', label: t('cond_new_label'), desc: t('cond_new_desc') },
    { value: 'unworn', label: t('cond_unworn_label'), desc: t('cond_unworn_desc') },
    { value: 'very_good', label: t('cond_very_good_label'), desc: t('cond_very_good_desc') },
    { value: 'good', label: t('cond_good_label'), desc: t('cond_good_desc') },
    { value: 'fair', label: t('cond_fair_label'), desc: t('cond_fair_desc') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">{t('brand_model_title')}</h2>
        <p className="text-sm text-secondary-text">{t('brand_model_desc')}</p>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">{t('brand_label')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-2">
          {BRANDS.slice(0, 15).map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setValue('brand', brand, { shouldValidate: true })}
              className={`
                px-3 py-2 text-xs font-medium rounded-lg border transition-colors
                ${selectedBrand === brand
                  ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                  : 'border-border-subtle text-secondary-text hover:border-border-default hover:text-primary-text'
                }
              `}
            >
              {brand}
            </button>
          ))}
        </div>
        <input
          {...register('brand')}
          placeholder={t('brand_placeholder')}
          className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
        />
        {errors.brand && <p className="mt-1 text-xs text-semantic-error">{errors.brand.message}</p>}
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">{t('model_label')}</label>
        <input
          {...register('model')}
          placeholder={t('model_placeholder')}
          className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
        />
        {errors.model && <p className="mt-1 text-xs text-semantic-error">{errors.model.message}</p>}
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">{t('condition_label')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CONDITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('condition', opt.value as WatchWizardFormData['condition'], { shouldValidate: true })}
              className={`
                flex flex-col items-start p-3 rounded-lg border transition-colors text-left
                ${selectedCondition === opt.value
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-border-subtle hover:border-border-default'
                }
              `}
            >
              <span className={`text-sm font-medium ${selectedCondition === opt.value ? 'text-accent-blue' : 'text-primary-text'}`}>
                {opt.label}
              </span>
              <span className="text-xs text-secondary-text mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
        {errors.condition && <p className="mt-1 text-xs text-semantic-error">{errors.condition.message}</p>}
      </div>
    </div>
  );
}
