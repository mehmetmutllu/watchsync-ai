'use client';

import { useState, useCallback } from 'react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { WatchStatus, WatchCondition } from '@/types';

const STATUS_OPTIONS: { value: WatchStatus | ''; label: string }[] = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'draft', label: 'Taslak' },
  { value: 'active', label: 'Aktif' },
  { value: 'reserved', label: 'Rezerve' },
  { value: 'sold', label: 'Satıldı' },
  { value: 'maintenance', label: 'Bakımda' },
];

const CONDITION_OPTIONS: { value: WatchCondition | ''; label: string }[] = [
  { value: '', label: 'Tüm Kondisyonlar' },
  { value: 'new', label: 'Sıfır' },
  { value: 'unworn', label: 'Kullanılmamış' },
  { value: 'very_good', label: 'Çok İyi' },
  { value: 'good', label: 'İyi' },
  { value: 'fair', label: 'Orta' },
];

export default function WatchFilters() {
  const { filters, setFilters } = useInventoryStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearch = useCallback(() => {
    setFilters({ search: searchInput || undefined });
  }, [searchInput, setFilters]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: undefined,
      status: undefined,
      condition: undefined,
      brand: undefined,
      min_price: undefined,
      max_price: undefined,
      sort_by: undefined,
      sort_dir: undefined,
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.condition || filters.brand || filters.min_price || filters.max_price;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Marka, model veya referans no ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters({ status: (e.target.value as WatchStatus) || undefined })
          }
          className="px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
            showAdvanced
              ? 'bg-accent-blue/10 border-accent-blue text-accent-blue'
              : 'bg-surface border-border-subtle text-secondary-text hover:text-primary-text'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtreler
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-error hover:bg-semantic-error/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Temizle
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border-subtle animate-fade-in">
          <select
            value={filters.condition || ''}
            onChange={(e) =>
              setFilters({ condition: (e.target.value as WatchCondition) || undefined })
            }
            className="px-3 py-2 bg-surface-elevated border border-border-subtle rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue"
          >
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min fiyat"
            value={filters.min_price ?? ''}
            onChange={(e) =>
              setFilters({ min_price: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-32 px-3 py-2 bg-surface-elevated border border-border-subtle rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue"
          />

          <input
            type="number"
            placeholder="Max fiyat"
            value={filters.max_price ?? ''}
            onChange={(e) =>
              setFilters({ max_price: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-32 px-3 py-2 bg-surface-elevated border border-border-subtle rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue"
          />
        </div>
      )}
    </div>
  );
}
