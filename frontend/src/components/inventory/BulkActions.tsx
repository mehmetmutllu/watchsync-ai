'use client';

import { useState } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { platformsApi } from '@/lib/platforms-api';
import { toast } from '@/stores/toastStore';
import type { PlatformInfo } from '@/types';

interface BulkActionsProps {
  selectedIds: Set<number>;
  platforms: PlatformInfo[];
  onClearSelection: () => void;
}

type PublishState = 'idle' | 'publishing' | 'done' | 'error';

export default function BulkActions({
  selectedIds,
  platforms,
  onClearSelection,
}: BulkActionsProps) {
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [progress, setProgress] = useState({ queued: 0, skipped: 0, total: 0 });

  if (selectedIds.size === 0) return null;

  const connectedPlatforms = platforms.filter((p) => p.status === 'connected');

  const handleBulkPublish = async (platformId: number, platformName: string) => {
    const watchIds = Array.from(selectedIds);

    setPublishState('publishing');
    setProgress({ queued: 0, skipped: 0, total: watchIds.length });

    try {
      const result = await platformsApi.bulkPublish(watchIds, platformId);

      setProgress({
        queued: result.queued,
        skipped: result.skipped,
        total: result.total,
      });
      setPublishState('done');

      if (result.queued > 0) {
        toast.success(
          `${platformName} Toplu Yayınlama`,
          `${result.queued} saat kuyruğa eklendi.${result.skipped > 0 ? ` ${result.skipped} atlandı.` : ''}`
        );
      } else {
        toast.warning(
          `${platformName} Toplu Yayınlama`,
          'Yayınlanacak aktif saat bulunamadı.'
        );
      }

      // 3 saniye sonra sıfırla
      setTimeout(() => {
        setPublishState('idle');
        onClearSelection();
      }, 3000);
    } catch {
      setPublishState('error');
      toast.error(`${platformName} Toplu Yayınlama`, 'Toplu yayınlama başarısız.');

      setTimeout(() => setPublishState('idle'), 3000);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg animate-fade-in">
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-primary-text">
          {selectedIds.size} saat seçili
        </span>
        <button
          onClick={onClearSelection}
          className="p-1 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
          title="Seçimi temizle"
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
          <span className="text-sm text-secondary-text">Yayınlanıyor...</span>
          <div className="flex-1 max-w-[200px]">
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-500 animate-pulse"
                style={{ width: '60%' }}
              />
            </div>
          </div>
        </div>
      )}

      {publishState === 'done' && (
        <div className="flex items-center gap-2 flex-1">
          <CheckCircle className="w-4 h-4 text-semantic-success" />
          <span className="text-sm text-semantic-success">
            {progress.queued} saat kuyruğa eklendi
            {progress.skipped > 0 && (
              <span className="text-secondary-text"> ({progress.skipped} atlandı)</span>
            )}
          </span>
          {/* Progress bar — tamamlandı */}
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
          <span className="text-sm text-semantic-error">Yayınlama başarısız</span>
        </div>
      )}

      {/* Action buttons */}
      {publishState === 'idle' && (
        <div className="flex items-center gap-2 flex-1">
          {connectedPlatforms.length === 0 ? (
            <span className="text-xs text-disabled-text">
              Bağlı platform yok. Ayarlardan bağlantı kurun.
            </span>
          ) : (
            connectedPlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleBulkPublish(platform.id, platform.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent-blue text-white hover:bg-accent-blue-hover transition-colors"
              >
                <Upload className="w-3 h-3" />
                {platform.name}&apos;e Yayınla
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
