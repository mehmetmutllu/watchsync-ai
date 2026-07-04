'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { platformsApi } from '@/lib/platforms-api';
import { toast } from '@/stores/toastStore';
import type { PlatformInfo } from '@/types';

interface BulkActionsProps {
  selectedIds: Set<number>;
  platforms: PlatformInfo[];
  onClearSelection: () => void;
  onPublishComplete?: () => void;
}

type PublishState = 'idle' | 'publishing' | 'done' | 'error';

export default function BulkActions({
  selectedIds,
  platforms,
  onClearSelection,
  onPublishComplete,
}: BulkActionsProps) {
  const t = useTranslations('BulkActions');
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [progress, setProgress] = useState({ queued: 0, skipped: 0, total: 0, percent: 0, success: 0, failed: 0 });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const scheduleIdleReset = useCallback((cb: () => void) => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(cb, 3000);
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [stopPolling]);

  // Seçim boşalınca devam eden polling'i durdur
  useEffect(() => {
    if (selectedIds.size === 0) stopPolling();
  }, [selectedIds.size, stopPolling]);

  if (selectedIds.size === 0) return null;

  const connectedPlatforms = platforms.filter((p) => p.status === 'connected');

  const handleBulkPublish = async (platformId: number, platformName: string) => {
    const watchIds = Array.from(selectedIds);

    setPublishState('publishing');
    setProgress({ queued: 0, skipped: 0, total: watchIds.length, percent: 0, success: 0, failed: 0 });

    try {
      const result = await platformsApi.bulkPublish(watchIds, platformId);

      setProgress((prev) => ({
        ...prev,
        queued: result.queued,
        skipped: result.skipped,
        total: result.total,
      }));

      if (result.queued > 0 && result.batch_id) {
        // Polling başlat
        pollingRef.current = setInterval(async () => {
          try {
            const status = await platformsApi.getBulkPublishStatus(result.batch_id);

            setProgress((prev) => ({
              ...prev,
              percent: status.progress,
              success: status.success,
              failed: status.failed,
            }));

            if (status.completed) {
              stopPolling();
              setPublishState('done');

              toast.success(
                t('bulk_publish_title', { platform: platformName }),
                t('bulk_publish_success', { success: status.success, failed: status.failed })
              );

              // Envanter tablosunu yenile
              onPublishComplete?.();

              scheduleIdleReset(() => {
                setPublishState('idle');
                onClearSelection();
              });
            }
          } catch {
            // Polling hatası — sessiz devam
          }
        }, 2000);
      } else {
        setPublishState('done');
        toast.warning(
          t('bulk_publish_title', { platform: platformName }),
          t('bulk_publish_no_watches')
        );

        scheduleIdleReset(() => {
          setPublishState('idle');
          onClearSelection();
        });
      }
    } catch {
      setPublishState('error');
      toast.error(
        t('bulk_publish_title', { platform: platformName }),
        t('bulk_publish_failed')
      );

      scheduleIdleReset(() => setPublishState('idle'));
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg animate-fade-in">
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-primary-text">
          {t('selected_count', { count: selectedIds.size })}
        </span>
        <button
          onClick={onClearSelection}
          className="p-1 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
          title={t('clear_selection')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border-subtle" />

      {/* Publishing state */}
      {publishState === 'publishing' && (
        <div className="flex items-center gap-2 flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
          <span className="text-sm text-secondary-text">
            {t('publishing', { percent: Math.round(progress.percent) })}
          </span>
          <div className="flex-1 max-w-[200px]">
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progress.percent, 5)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {publishState === 'done' && (
        <div className="flex items-center gap-2 flex-1">
          <CheckCircle className="w-4 h-4 text-semantic-success" />
          <span className="text-sm text-semantic-success">
            {t('bulk_publish_success', { success: progress.success, failed: progress.failed })}
            {progress.skipped > 0 && (
              <span className="text-secondary-text"> ({t('skipped_count', { count: progress.skipped })})</span>
            )}
          </span>
          <div className="flex-1 max-w-[200px]">
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div className="h-full bg-semantic-success rounded-full w-full transition-all duration-300" />
            </div>
          </div>
        </div>
      )}

      {publishState === 'error' && (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-semantic-error" />
          <span className="text-sm text-semantic-error">{t('error')}</span>
        </div>
      )}

      {/* Action buttons */}
      {publishState === 'idle' && (
        <div className="flex items-center gap-2 flex-1">
          {connectedPlatforms.length === 0 ? (
            <span className="text-xs text-disabled-text">
              {t('no_connected_platforms')}
            </span>
          ) : (
            connectedPlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleBulkPublish(platform.id, platform.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent-blue text-white hover:bg-accent-blue-hover transition-colors"
              >
                <Upload className="w-3 h-3" />
                {t('publish_to', { platform: platform.name })}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
