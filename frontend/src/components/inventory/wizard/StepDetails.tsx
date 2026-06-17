'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { WatchWizardFormData } from './WatchWizard';

const CASE_MATERIALS = ['Stainless Steel', 'Yellow Gold', 'White Gold', 'Rose Gold', 'Platinum', 'Titanium', 'Ceramic', 'Carbon'];
const DIAL_COLORS = ['Black', 'White', 'Blue', 'Green', 'Silver', 'Champagne', 'Grey', 'Brown', 'Red', 'Mother of Pearl'];
const MOVEMENTS = ['Automatic', 'Manual Winding', 'Quartz'];
const BRACELET_MATERIALS = ['Stainless Steel', 'Leather', 'Rubber', 'NATO/Fabric', 'Yellow Gold', 'White Gold', 'Rose Gold', 'Titanium'];

export default function StepDetails() {
  const t = useTranslations('Wizard');
  const { register, formState: { errors }, watch, setValue } = useFormContext<WatchWizardFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">{t('details_title')}</h2>
        <p className="text-sm text-secondary-text">{t('details_desc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('ref_label')}</label>
          <input
            {...register('reference_number')}
            placeholder={t('ref_placeholder')}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('year_label')}</label>
          <input
            {...register('year')}
            type="number"
            placeholder={t('year_placeholder')}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          />
          {errors.year && <p className="mt-1 text-xs text-semantic-error">{errors.year.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Case Material */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('case_label')}</label>
          <select
            value={watch('features.case_material') || ''}
            onChange={(e) => setValue('features.case_material', e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          >
            <option value="">{t('select_placeholder')}</option>
            {CASE_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Dial Color */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('dial_label')}</label>
          <select
            value={watch('features.dial_color') || ''}
            onChange={(e) => setValue('features.dial_color', e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          >
            <option value="">{t('select_placeholder')}</option>
            {DIAL_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Movement */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('movement_label')}</label>
          <select
            value={watch('features.movement') || ''}
            onChange={(e) => setValue('features.movement', e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          >
            <option value="">{t('select_placeholder')}</option>
            {MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Bracelet Material */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('bracelet_label')}</label>
          <select
            value={watch('features.bracelet_material') || ''}
            onChange={(e) => setValue('features.bracelet_material', e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          >
            <option value="">{t('select_placeholder')}</option>
            {BRACELET_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Case Diameter */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('diameter_label')}</label>
          <input
            value={watch('features.case_diameter') || ''}
            onChange={(e) => setValue('features.case_diameter', e.target.value)}
            placeholder={t('diameter_placeholder')}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          />
        </div>

        {/* Water Resistance */}
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('water_label')}</label>
          <input
            value={watch('features.water_resistance') || ''}
            onChange={(e) => setValue('features.water_resistance', e.target.value)}
            placeholder={t('water_placeholder')}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          />
        </div>

        {/* Scope of Delivery */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-secondary-text mb-1.5">{t('scope_label')}</label>
          <select
            value={watch('features.scope_of_delivery') || ''}
            onChange={(e) => setValue('features.scope_of_delivery', e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
          >
            <option value="">{t('select_placeholder')}</option>
            <option value="Full Set (Box & Papers)">{t('scope_full')}</option>
            <option value="Box Only">{t('scope_box')}</option>
            <option value="Papers Only">{t('scope_papers')}</option>
            <option value="Watch Only">{t('scope_watch')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
