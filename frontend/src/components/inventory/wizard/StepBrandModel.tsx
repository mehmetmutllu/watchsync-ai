'use client';

import { useFormContext } from 'react-hook-form';
import type { WatchWizardFormData } from './WatchWizard';

const BRANDS = [
  'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier',
  'IWC', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'A. Lange & Söhne',
  'Breitling', 'Tudor', 'Panerai', 'Hublot', 'TAG Heuer', 'Zenith',
  'Chopard', 'Girard-Perregaux', 'Blancpain', 'Ulysse Nardin', 'Grand Seiko',
  'Seiko', 'Tissot', 'Longines', 'Oris', 'Bell & Ross', 'Nomos',
  'Baume & Mercier', 'Maurice Lacroix', 'Montblanc', 'Piaget',
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Sıfır', desc: 'Hiç kullanılmamış, etiketli' },
  { value: 'unworn', label: 'Kullanılmamış', desc: 'Açılmış ama takılmamış' },
  { value: 'very_good', label: 'Çok İyi', desc: 'Minimal kullanım izleri' },
  { value: 'good', label: 'İyi', desc: 'Normal kullanım izleri' },
  { value: 'fair', label: 'Orta', desc: 'Belirgin kullanım izleri' },
];

export default function StepBrandModel() {
  const { register, formState: { errors }, watch, setValue } = useFormContext<WatchWizardFormData>();
  const selectedBrand = watch('brand');
  const selectedCondition = watch('condition');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary-text mb-1">Marka & Model</h2>
        <p className="text-sm text-secondary-text">Saatinizin marka, model ve kondisyon bilgilerini girin.</p>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">Marka *</label>
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
          placeholder="Veya marka yazın..."
          className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
        />
        {errors.brand && <p className="mt-1 text-xs text-semantic-error">{errors.brand.message}</p>}
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">Model *</label>
        <input
          {...register('model')}
          placeholder="Örn: Submariner, Nautilus, Royal Oak..."
          className="w-full px-4 py-2.5 bg-surface-secondary border border-border-subtle rounded-lg text-primary-text placeholder:text-tertiary-text focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue text-sm"
        />
        {errors.model && <p className="mt-1 text-xs text-semantic-error">{errors.model.message}</p>}
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-secondary-text mb-2">Kondisyon *</label>
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
