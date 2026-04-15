'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlatformStore } from '@/stores/platformStore';
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import type { Watch, WatchStatus } from '@/types';
import StatusBadge from './StatusBadge';
import PlatformToggles from './PlatformToggles';
import SyncStatusBadges from './SyncStatusBadges';

interface WatchTableProps {
  watches: Watch[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: WatchStatus) => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

const SORT_COLUMNS = [
  { key: 'brand', label: 'Marka / Model' },
  { key: 'reference_number', label: 'Ref No' },
  { key: 'status', label: 'Durum' },
  { key: 'cost_price', label: 'Maliyet' },
  { key: 'sale_price', label: 'Satış Fiyatı' },
  { key: 'created_at', label: 'Oluşturulma' },
];

export default function WatchTable({
  watches,
  pagination,
  onEdit,
  onDelete,
  onStatusChange,
  selectedIds,
  onSelectionChange,
}: WatchTableProps) {
  const { filters, setFilters, fetchWatches, isLoading } = useInventoryStore();
  const { platforms, fetchPlatforms } = usePlatformStore();
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const openMenu = useCallback((id: number, btnEl: HTMLButtonElement) => {
    if (menuOpenId === id) {
      setMenuOpenId(null);
      return;
    }
    const rect = btnEl.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = 88;
    const gap = 4;

    // Butonun sol kenarına hizala, sağa taşmasını engelle
    let left = rect.left - menuWidth + rect.width;
    let top = rect.bottom + gap;

    // Sağ kenardan taşıyorsa viewport içine çek
    if (left + menuWidth > window.innerWidth - gap) {
      left = window.innerWidth - menuWidth - gap;
    }
    // Sol kenardan taşıyorsa
    if (left < gap) {
      left = gap;
    }
    // Alt kenardan taşıyorsa yukarı aç
    if (top + menuHeight > window.innerHeight - gap) {
      top = rect.top - menuHeight - gap;
    }

    setMenuPos({ top, left });
    setMenuOpenId(id);
  }, [menuOpenId]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleSort = (column: string) => {
    const newDir =
      filters.sort_by === column && filters.sort_dir === 'asc' ? 'desc' : 'asc';
    setFilters({ sort_by: column, sort_dir: newDir });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(watches.map((w) => w.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const goToPage = (page: number) => {
    fetchWatches({ ...filters, page });
  };

  const formatPrice = (price: string | null, currency: string) => {
    if (!price) return '—';
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      TRY: '₺',
      CHF: 'CHF ',
    };
    const num = parseFloat(price);
    return (symbols[currency] || currency + ' ') + num.toLocaleString('en-US', { minimumFractionDigits: 0 });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bu saati silmek istediğinize emin misiniz?')) {
      onDelete(id);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
      {/* Mobile Card View (< 768px) */}
      <div className="md:hidden divide-y divide-border-subtle">
        {watches.map((watch) => (
          <div
            key={watch.id}
            className={`p-4 space-y-3 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox + Thumbnail */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(watch.id)}
                  onChange={() => handleSelectRow(watch.id)}
                  className="rounded border-border-strong bg-surface-elevated"
                  aria-label={`${watch.brand} ${watch.model} seç`}
                />
                {watch.thumbnail_url ? (
                  <img
                    src={watch.thumbnail_url}
                    alt={`${watch.brand} ${watch.model}`}
                    className="w-12 h-12 rounded-md object-cover bg-surface-elevated"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-surface-elevated flex items-center justify-center">
                    <Eye className="w-4 h-4 text-disabled-text" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-text truncate">
                  {watch.brand} {watch.model}
                </p>
                <p className="text-xs font-mono text-secondary-text">
                  {watch.reference_number || '—'} {watch.year ? `· ${watch.year}` : ''}
                </p>
              </div>

              {/* Status + Actions */}
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={watch.status}
                  onStatusChange={(newStatus) => onStatusChange(watch.id, newStatus)}
                  allowedTransitions={watch.allowed_transitions}
                />
                <button
                  onClick={(e) => openMenu(watch.id, e.currentTarget)}
                  className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors text-secondary-text"
                  aria-label="İşlemler"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-xs text-secondary-text">Maliyet: </span>
                <span className="font-mono text-secondary-text">
                  {formatPrice(watch.cost_price, watch.currency)}
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary-text">Satış: </span>
                <span className="font-mono text-primary-text font-medium">
                  {formatPrice(watch.sale_price, watch.currency)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === watches.length && watches.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-border-strong bg-surface-elevated"
                />
              </th>
              <th className="w-14 px-2 py-3 text-left text-xs uppercase tracking-wider text-secondary-text font-medium">
                Görsel
              </th>
              {SORT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary-text font-medium cursor-pointer hover:text-primary-text transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {filters.sort_by === col.key && (
                      filters.sort_dir === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-accent-blue" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-accent-blue" />
                      )
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary-text font-medium">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary-text font-medium">
                Sync
              </th>
              <th className="w-16 px-4 py-3 text-right text-xs uppercase tracking-wider text-secondary-text font-medium">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            {watches.map((watch) => (
              <tr
                key={watch.id}
                className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors"
              >
                {/* Checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(watch.id)}
                    onChange={() => handleSelectRow(watch.id)}
                    className="rounded border-border-strong bg-surface-elevated"
                  />
                </td>

                {/* Thumbnail */}
                <td className="px-2 py-3">
                  {watch.thumbnail_url ? (
                    <img
                      src={watch.thumbnail_url}
                      alt={`${watch.brand} ${watch.model}`}
                      className="w-10 h-10 rounded-md object-cover bg-surface-elevated"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-surface-elevated flex items-center justify-center">
                      <Eye className="w-4 h-4 text-disabled-text" />
                    </div>
                  )}
                </td>

                {/* Brand / Model */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-primary-text">
                      {watch.brand} {watch.model}
                    </p>
                    {watch.year && (
                      <p className="text-xs text-secondary-text">{watch.year}</p>
                    )}
                  </div>
                </td>

                {/* Ref No */}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-secondary-text">
                    {watch.reference_number || '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge
                    status={watch.status}
                    onStatusChange={(newStatus) => onStatusChange(watch.id, newStatus)}
                    allowedTransitions={watch.allowed_transitions}
                  />
                </td>

                {/* Cost */}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-secondary-text">
                    {formatPrice(watch.cost_price, watch.currency)}
                  </span>
                </td>

                {/* Sale Price */}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-primary-text font-medium">
                    {formatPrice(watch.sale_price, watch.currency)}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-3">
                  <span className="text-xs text-secondary-text">
                    {new Date(watch.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </td>

                {/* Platform Toggles */}
                <td className="px-4 py-3">
                  {watch.status === 'active' ? (
                    <PlatformToggles watchId={watch.id} platforms={platforms} />
                  ) : (
                    <span className="text-xs text-disabled-text">—</span>
                  )}
                </td>

                {/* Sync Status Badges */}
                <td className="px-4 py-3">
                  {watch.status === 'active' ? (
                    <SyncStatusBadges syncStatuses={watch.sync_statuses} />
                  ) : (
                    <span className="text-xs text-disabled-text">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => openMenu(watch.id, e.currentTarget)}
                    className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors text-secondary-text hover:text-primary-text"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dropdown menu — portaled to body to escape overflow:hidden */}
      {menuOpenId !== null && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setMenuOpenId(null)}
          />
          <div
            className="fixed z-[9999] w-40 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg py-1 animate-fade-in"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={() => {
                onEdit(menuOpenId);
                setMenuOpenId(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-secondary-text hover:text-primary-text hover:bg-surface transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Düzenle
            </button>
            <button
              onClick={() => handleDelete(menuOpenId)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-semantic-error hover:bg-semantic-error/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Sil
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p className="text-xs sm:text-sm text-secondary-text">
            <span className="hidden sm:inline">Toplam {pagination.total} kayıttan{' '}</span>
            {(pagination.current_page - 1) * pagination.per_page + 1}-
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            <span className="sm:hidden"> / {pagination.total}</span>
            <span className="hidden sm:inline">{' '}gösteriliyor</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="p-2 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile: sadece geçerli sayfa */}
            <span className="sm:hidden px-3 text-sm text-primary-text">
              {pagination.current_page} / {pagination.last_page}
            </span>

            {/* Desktop: sayfa numaraları */}
            <span className="hidden sm:contents">
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .filter((page) => {
                const current = pagination.current_page;
                return page === 1 || page === pagination.last_page || Math.abs(page - current) <= 1;
              })
              .reduce<(number | string)[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                typeof item === 'string' ? (
                  <span key={`dots-${idx}`} className="px-2 text-secondary-text">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    className={`w-8 h-8 rounded-md text-sm transition-colors ${
                      item === pagination.current_page
                        ? 'bg-accent-blue text-white'
                        : 'text-secondary-text hover:text-primary-text hover:bg-surface-elevated'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </span>

            <button
              onClick={() => goToPage(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="p-2 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
