'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, RefreshCw } from 'lucide-react';
import { usePlatformStore } from '@/stores/platformStore';
import { platformsApi } from '@/lib/platforms-api';
import { toast } from '@/stores/toastStore';
import PlatformCard from '@/components/settings/PlatformCard';
import type { PlatformInfo } from '@/types';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { platforms, isLoading, fetchPlatforms, updateCredentials, disconnectPlatform } =
    usePlatformStore();
  const oauthHandledRef = useRef(false);

  // eBay OAuth callback sonucu — URL parametrelerini kontrol et
  useEffect(() => {
    if (oauthHandledRef.current) return;

    const ebayAuth = searchParams.get('ebay_auth');
    if (ebayAuth === 'success') {
      toast.success('eBay Bağlantısı', 'eBay hesabınız başarıyla bağlandı.');
      oauthHandledRef.current = true;
      // URL'deki query param'ları temizle
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (ebayAuth === 'error') {
      const message = searchParams.get('message') || 'eBay bağlantısı sırasında bir hata oluştu.';
      toast.error('eBay Bağlantı Hatası', message);
      oauthHandledRef.current = true;
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleConnect = useCallback(async (platform: PlatformInfo) => {
    if (platform.name === 'eBay') {
      try {
        const authUrl = await platformsApi.getEbayAuthUrl();
        // OAuth popup aç
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          authUrl,
          'ebay_oauth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
        );

        // Popup kapandığında platformları yenile
        if (popup) {
          const interval = setInterval(() => {
            if (popup.closed) {
              clearInterval(interval);
              fetchPlatforms();
            }
          }, 500);
        }
      } catch {
        toast.error('Bağlantı Hatası', 'eBay OAuth URL\'i alınamadı.');
      }
    }
  }, [fetchPlatforms]);

  const handleDisconnect = useCallback(async (platform: PlatformInfo) => {
    try {
      if (platform.name === 'eBay') {
        await platformsApi.disconnectEbay();
      } else {
        await disconnectPlatform(platform.id);
      }
      toast.success('Bağlantı Kesildi', `${platform.name} bağlantısı başarıyla kesildi.`);
      fetchPlatforms();
    } catch {
      toast.error('Hata', `${platform.name} bağlantısı kesilemedi.`);
    }
  }, [disconnectPlatform, fetchPlatforms]);

  const handleSaveCredentials = useCallback(async (platformId: number, apiKey: string, apiSecret: string) => {
    try {
      await updateCredentials(platformId, { api_key: apiKey, api_secret: apiSecret });
      toast.success('Kaydedildi', 'API anahtarları başarıyla güncellendi.');
    } catch {
      toast.error('Hata', 'API anahtarları kaydedilemedi.');
    }
  }, [updateCredentials]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-text">Platform Ayarları</h1>
            <p className="text-sm text-secondary-text">
              E-ticaret platformlarınızı bağlayın ve envanter senkronizasyonunu yönetin.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchPlatforms()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-strong text-secondary-text text-sm font-medium hover:text-primary-text hover:bg-surface-elevated transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Platform Cards */}
      {isLoading && platforms.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border-subtle rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-surface-elevated rounded w-24" />
                  <div className="h-3 bg-surface-elevated rounded w-48" />
                </div>
              </div>
              <div className="h-10 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      ) : platforms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSaveCredentials={handleSaveCredentials}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border-subtle rounded-lg p-12 text-center">
          <Settings className="w-12 h-12 text-disabled-text mx-auto mb-3" />
          <h3 className="text-lg font-medium text-primary-text mb-1">Platform Bulunamadı</h3>
          <p className="text-sm text-secondary-text">
            Henüz tanımlanmış platform yok. Veritabanına platform kayıtları eklenmelidir.
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-surface border border-border-subtle rounded-lg p-6">
        <h2 className="text-lg font-semibold text-primary-text mb-3">Platform Bilgileri</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-amber-400">Chrono24</h3>
            <p className="text-xs text-secondary-text">
              XML Feed üzerinden çalışır. API anahtarınızı girdikten sonra Chrono24,
              beslemenizi düzenli aralıklarla çeker.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-blue-400">eBay</h3>
            <p className="text-xs text-secondary-text">
              OAuth 2.0 bağlantısı gerektirir. &quot;eBay&apos;e Bağlan&quot; butonuna tıklayarak
              hesabınızı yetkilendirin. Token otomatik yenilenir.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-green-400">Shopify</h3>
            <p className="text-xs text-secondary-text">
              Shopify Admin API ile entegre. Mağaza URL&apos;niz ve API anahtarınız gereklidir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
