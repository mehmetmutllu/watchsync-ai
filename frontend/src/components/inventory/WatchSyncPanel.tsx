'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { platformsApi } from '@/lib/platforms-api';
import { useToastStore } from '@/stores/toastStore';
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { PlatformSyncStatus } from '@/types';

interface WatchSyncPanelProps {
  watchId: number;
}

export default function WatchSyncPanel({ watchId }: WatchSyncPanelProps) {
  const t = useTranslations('Inventory');
  const addToast = useToastStore((s) => s.addToast);
  const [statuses, setStatuses] = useState<PlatformSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await platformsApi.getSyncStatus(watchId);
      setStatuses(data);
    } catch {
      addToast({ type: 'error', title: 'Failed to load sync status' });
    } finally {
      setIsLoading(false);
    }
  }, [watchId, addToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async (platformId: number, currentStatus: string) => {
    const isCurrentlySynced = currentStatus === 'success' || currentStatus === 'pending';
    const newEnabledState = !isCurrentlySynced;
    
    setToggling(platformId);
    try {
      await platformsApi.toggleSync(watchId, platformId, newEnabledState);
      addToast({ 
        type: 'success', 
        title: newEnabledState ? 'Sync initiated' : 'Unlist initiated' 
      });
      fetchStatus();
    } catch {
      addToast({ type: 'error', title: 'Failed to toggle sync' });
    } finally {
      setToggling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-text">Platform Sync</h3>
        <button 
          onClick={fetchStatus}
          className="p-2 text-secondary-text hover:text-primary-text hover:bg-surface-secondary rounded-lg transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((s) => {
          const isConnected = s.connected;
          const isSynced = s.sync_status === 'success';
          const isPending = s.sync_status === 'pending';
          const isFailed = s.sync_status === 'failed';

          return (
            <div key={s.platform_id} className="p-4 rounded-xl border border-border-subtle bg-surface/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-primary-text">{s.platform_name}</span>
                {!isConnected ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-surface-secondary text-secondary-text">Not Connected</span>
                ) : isSynced ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent-green/10 text-accent-green">
                    <CheckCircle2 className="w-3 h-3" /> Synced
                  </span>
                ) : isPending ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent-blue/10 text-accent-blue">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                ) : isFailed ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-semantic-error/10 text-semantic-error">
                    <XCircle className="w-3 h-3" /> Failed
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-surface-secondary text-secondary-text">Unlisted</span>
                )}
              </div>

              {s.error_message && (
                <p className="text-xs text-semantic-error mb-3 line-clamp-2" title={s.error_message}>
                  {s.error_message}
                </p>
              )}

              <button
                disabled={!isConnected || toggling === s.platform_id}
                onClick={() => handleToggle(s.platform_id, s.sync_status)}
                className={`
                  w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${!isConnected 
                    ? 'bg-surface-secondary text-secondary-text opacity-50 cursor-not-allowed'
                    : isSynced || isPending
                      ? 'border border-semantic-error text-semantic-error hover:bg-semantic-error/5'
                      : 'bg-accent-blue text-white hover:bg-accent-blue-hover'
                  }
                `}
              >
                {toggling === s.platform_id ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : isSynced || isPending ? (
                  'Unlist from Platform'
                ) : (
                  'Publish to Platform'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
