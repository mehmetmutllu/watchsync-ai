'use client';

import { useState, useCallback } from 'react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { WatchStatus, WatchCondition } from '@/types';
import { useTranslations } from 'next-intl';

const STATUS_OPTIONS = [
  { value: '', labelKey: 'all_statuses' },
  { value: 'draft', labelKey: 'status_draft' },
  { value: 'active', labelKey: 'status_active' },
  { value: 'reserved', labelKey: 'status_reserved' },
  { value: 'sold', labelKey: 'status_sold' },
  { value: 'maintenance', labelKey: 'status_maintenance' },
] as const;

const CONDITION_OPTIONS = [
  { value: '', labelKey: 'all_conditions' },
  { value: 'new', labelKey: 'cond_new' },
  { value: 'unworn', labelKey: 'cond_unworn' },
  { value: 'very_good', labelKey: 'cond_very_good' },
  { value: 'good', labelKey: 'cond_good' },
  { value: 'fair', labelKey: 'cond_fair' },
] as const;

export default function WatchFilters() {
  const t = useTranslations("Inventory");
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
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSearch}
            className="w-full ps-10 pe-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters({ status: (e.target.value as WatchStatus) || undefined })
          }
          className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
            showAdvanced
              ? 'bg-accent-blue/10 border-accent-blue text-accent-blue'
              : 'bg-black/20 border-white/10 text-secondary-text hover:text-primary-text hover:bg-white/5'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("filters")}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-error hover:bg-semantic-error/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            {t("clear")}
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
                {t(opt.labelKey)}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder={t("min_price")}
            value={filters.min_price ?? ''}
            onChange={(e) =>
              setFilters({ min_price: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-32 px-3 py-2 bg-surface-elevated border border-border-subtle rounded-lg text-sm text-primary-text placeholder:text-disabled-text focus:outline-none focus:border-accent-blue"
          />

          <input
            type="number"
            placeholder={t("max_price")}
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
