'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlatformStore } from '@/stores/platformStore';
import WatchTable from '@/components/inventory/WatchTable';
import WatchFilters from '@/components/inventory/WatchFilters';
import EmptyState from '@/components/inventory/EmptyState';
import TableSkeleton from '@/components/inventory/TableSkeleton';
import BulkActions from '@/components/inventory/BulkActions';
import { Plus } from 'lucide-react';

// Ağır modal bileşenleri — lazy load (766 satır, form + validation + image upload)
const WatchFormModal = dynamic(
  () => import('@/components/inventory/WatchFormModal'),
  { ssr: false }
);

export default function InventoryPage() {
  const { watches, pagination, isLoading, error, fetchWatches, deleteWatch, updateWatchStatus } =
    useInventoryStore();
  const { platforms, fetchPlatforms } = usePlatformStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editWatchId, setEditWatchId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchWatches();
    fetchPlatforms();
  }, [fetchWatches, fetchPlatforms]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">Envanter</h1>
          <p className="mt-1 text-sm text-secondary-text">
            {pagination.total} saat kayıtlı
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Saat Ekle
        </button>
      </div>

      {/* Filters */}
      <WatchFilters />

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-sm">
          {error}
        </div>
      )}

      {/* Table or States */}
      {isLoading && watches.length === 0 ? (
        <TableSkeleton />
      ) : watches.length === 0 ? (
        <EmptyState onAddClick={() => setShowAddModal(true)} />
      ) : (
        <>
          {/* Bulk Actions */}
          <BulkActions
            selectedIds={selectedIds}
            platforms={platforms}
            onClearSelection={() => setSelectedIds(new Set())}
            onPublishComplete={() => fetchWatches()}
          />

          <WatchTable
            watches={watches}
            pagination={pagination}
            onEdit={(id) => setEditWatchId(id)}
            onDelete={deleteWatch}
            onStatusChange={updateWatchStatus}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editWatchId !== null) && (
        <WatchFormModal
          watchId={editWatchId}
          onClose={() => {
            setShowAddModal(false);
            setEditWatchId(null);
          }}
        />
      )}
    </div>
  );
}
