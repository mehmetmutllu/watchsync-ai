'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlatformStore } from '@/stores/platformStore';
import WatchTable from '@/components/inventory/WatchTable';
import WatchFilters from '@/components/inventory/WatchFilters';
import EmptyState from '@/components/inventory/EmptyState';
import TableSkeleton from '@/components/inventory/TableSkeleton';
import BulkActions from '@/components/inventory/BulkActions';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function InventoryPage() {
  const router = useRouter();
  const { watches, pagination, isLoading, error, fetchWatches, deleteWatch, updateWatchStatus } =
    useInventoryStore();
  const { platforms, fetchPlatforms } = usePlatformStore();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const t = useTranslations("Inventory");

  const tErrors = useTranslations("StoreErrors");

  useEffect(() => {
    fetchWatches();
    fetchPlatforms();
  }, [fetchWatches, fetchPlatforms]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-text">{t("title")}</h1>
          <p className="mt-1 text-sm text-secondary-text">
            {t("registered_watches", { total: pagination.total })}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/inventory/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          {t("add_watch")}
        </button>
      </div>

      {/* Filters */}
      <WatchFilters />

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-sm">
          {error.startsWith('error_') ? tErrors(error as any) : error}
        </div>
      )}

      {/* Table or States */}
      {isLoading && watches.length === 0 ? (
        <TableSkeleton />
      ) : watches.length === 0 ? (
        <EmptyState onAddClick={() => router.push('/dashboard/inventory/new')} />
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
            onEdit={(id) => router.push(`/dashboard/inventory/${id}/edit`)}
            onDelete={deleteWatch}
            onStatusChange={updateWatchStatus}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </>
      )}
    </div>
  );
}
