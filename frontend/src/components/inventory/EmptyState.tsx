'use client';

import { Package, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border-subtle rounded-lg">
      <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-disabled-text" />
      </div>
      <h3 className="text-lg font-semibold text-primary-text mb-1">
        Henüz saat eklenmemiş
      </h3>
      <p className="text-sm text-secondary-text mb-6 max-w-sm text-center">
        Envanterinize saat ekleyerek başlayın. Saatlerinizi birden fazla platformda senkronize edin.
      </p>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors duration-150"
      >
        <Plus className="w-4 h-4" />
        İlk Saatinizi Ekleyin
      </button>
    </div>
  );
}
