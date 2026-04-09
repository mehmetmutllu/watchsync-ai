'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { platformsApi } from '@/lib/platforms-api';
import type { PlatformSyncStatus, SyncStatus } from '@/types';

interface SyncStatusBadgesProps {
  watchId: number;
}

const STATUS_CONFIG: Record<SyncStatus, {
  icon: typeof CheckCircle;
  label: string;
  color: string;
  bg: string;
}> = {
  success: {
    icon: CheckCircle,
    label: 'Synced',
    color: 'text-semantic-success',
    bg: 'bg-semantic-success/10',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  failed: {
    icon: XCircle,
    label: 'Error',
    color: 'text-semantic-error',
    bg: 'bg-semantic-error/10',
  },
  never: {
    icon: Clock,
    label: '—',
    color: 'text-disabled-text',
    bg: 'bg-transparent',
  },
};

export default function SyncStatusBadges({ watchId }: SyncStatusBadgesProps) {
  const [statuses, setStatuses] = useState<PlatformSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const data = await platformsApi.getSyncStatus(watchId);
        if (mounted) {
          setStatuses(data);
          setIsLoading(false);
        }
      } catch {
        if (mounted) setIsLoading(false);
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [watchId]);

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-secondary-text" />;
  }

  const connectedStatuses = statuses.filter((s) => s.connected);

  if (connectedStatuses.length === 0) {
    return <span className="text-xs text-disabled-text">—</span>;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {connectedStatuses.map((syncStatus) => {
        const config = STATUS_CONFIG[syncStatus.sync_status] || STATUS_CONFIG.never;
        const Icon = config.icon;

        return (
          <div key={syncStatus.platform_id} className="group relative">
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color}`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{syncStatus.platform_name}</span>
            </div>

            {/* Tooltip — hata detayı & son sync zamanı */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap">
              <p className="font-medium text-primary-text">{syncStatus.platform_name}</p>
              <p className={`mt-0.5 ${config.color}`}>{config.label}</p>
              {syncStatus.last_synced_at && (
                <p className="text-disabled-text mt-0.5">
                  Son: {new Date(syncStatus.last_synced_at).toLocaleString('tr-TR')}
                </p>
              )}
              {syncStatus.error_message && (
                <p className="text-semantic-error mt-1 max-w-[200px] truncate">
                  {syncStatus.error_message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
