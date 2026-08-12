'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { platformsApi } from '@/lib/platforms-api';
import { toast } from '@/stores/toastStore';
import type { PlatformInfo } from '@/types';

interface PlatformTogglesProps {
  watchId: number;
  platforms: PlatformInfo[];
}

const PLATFORM_COLORS: Record<string, string> = {
  eBay: 'bg-blue-500',
  Chrono24: 'bg-amber-500',
  Shopify: 'bg-green-500',
};

export default function PlatformToggles({ watchId, platforms }: PlatformTogglesProps) {
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});

  // Bağlı olan platformları varsayılan olarak açık göster
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    platforms.forEach((p) => {
      initial[p.id] = p.status === 'connected';
    });
    setEnabled(initial);
  }, [platforms]);

  const handleToggle = async (platformId: number, platformName: string) => {
    const newState = !enabled[platformId];

    // Optimistic update
    setEnabled((prev) => ({ ...prev, [platformId]: newState }));
    setLoading((prev) => ({ ...prev, [platformId]: true }));

    try {
      await platformsApi.toggleSync(watchId, platformId, newState);
      toast.success(
        platformName,
        newState ? 'Senkronizasyon başlatıldı.' : 'Liste kaldırılıyor.'
      );
    } catch {
      // Rollback
      setEnabled((prev) => ({ ...prev, [platformId]: !newState }));
      toast.error(platformName, 'Platform senkronizasyonu başlatılamadı.');
    } finally {
      setLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const connectedPlatforms = platforms.filter((p) => p.status === 'connected');

  if (connectedPlatforms.length === 0) {
    return <span className="text-xs text-disabled-text">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {connectedPlatforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => handleToggle(platform.id, platform.name)}
          disabled={loading[platform.id]}
          className="group relative"
          title={`${platform.name}: ${enabled[platform.id] ? 'Aktif' : 'Pasif'}`}
        >
          {loading[platform.id] ? (
            <Loader2 className="w-4 h-4 animate-spin text-secondary-text" />
          ) : (
            <div
              className={`
                w-8 h-4 rounded-full transition-colors duration-200 relative
                ${enabled[platform.id]
                  ? PLATFORM_COLORS[platform.name] || 'bg-accent-blue'
                  : 'bg-surface-elevated border border-border-strong'
                }
              `}
            >
              <div
                className={`
                  absolute top-0.5 start-0 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200
                  ${enabled[platform.id] ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'}
                `}
              />
            </div>
          )}

          {/* Tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-elevated text-xs text-primary-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-border-subtle z-10">
            {platform.name}
          </span>
        </button>
      ))}
    </div>
  );
}
