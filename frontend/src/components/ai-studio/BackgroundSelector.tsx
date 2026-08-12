'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

export interface BackgroundPreset {
  id: string;
  color: string;
  gradient?: string;
}

const presets: BackgroundPreset[] = [
  { id: 'white_studio', color: '#f5f5f5' },
  { id: 'black_velvet', color: '#1a1a1a' },
  { id: 'marble', color: '#e8e0d8', gradient: 'linear-gradient(135deg, #e8e0d8 0%, #d4c5b9 50%, #c9baa8 100%)' },
  { id: 'gradient_gray', color: '#9ca3af', gradient: 'radial-gradient(circle, #d1d5db 0%, #6b7280 100%)' },
];

interface BackgroundSelectorProps {
  selected: string;
  onSelect: (presetId: string) => void;
  disabled?: boolean;
}

export default function BackgroundSelector({ selected, onSelect, disabled }: BackgroundSelectorProps) {
  const t = useTranslations('AiStudio');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary-text">{t('background_title')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            disabled={disabled}
            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 ${
              selected === preset.id
                ? 'border-accent-blue bg-accent-blue/5'
                : 'border-border-subtle hover:border-border-strong bg-surface'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div
              className="w-8 h-8 rounded-md border border-border-subtle flex-shrink-0"
              style={{ background: preset.gradient || preset.color }}
            />
            <span className="text-xs font-medium text-primary-text truncate">
              {t(`bg_${preset.id as 'white_studio' | 'black_velvet' | 'marble' | 'gradient_gray'}`)}
            </span>
            {selected === preset.id && (
              <Check className="absolute top-2 end-2 w-3.5 h-3.5 text-accent-blue" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
