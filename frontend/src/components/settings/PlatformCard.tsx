'use client';

import { useState } from 'react';
import {
  Globe,
  Key,
  Unlink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { PlatformInfo } from '@/types';

// Lazy load — modal sadece kullanıcı ? butonuna tıklayınca yüklenir
const PlatformHelpModal = dynamic(() => import('./PlatformHelpModal'), {
  ssr: false,
});

interface PlatformCardProps {
  platform: PlatformInfo;
  onConnect: (platform: PlatformInfo) => void;
  onDisconnect: (platform: PlatformInfo) => void;
  onSaveCredentials: (platformId: number, apiKey: string, apiSecret: string) => Promise<void>;
}

const PLATFORM_CONFIG: Record<string, { color: string; description: string; icon: string }> = {
  eBay: {
    color: 'text-blue-400',
    description: 'eBay OAuth bağlantısı ile saatlerinizi eBay\'de listeleyin.',
    icon: '🛒',
  },
  Chrono24: {
    color: 'text-amber-400',
    description: 'Chrono24 XML Feed ile saatlerinizi otomatik yayınlayın.',
    icon: '⌚',
  },
  Shopify: {
    color: 'text-green-400',
    description: 'Shopify mağazanız ile envanter senkronizasyonu.',
    icon: '🏪',
  },
};

export default function PlatformCard({
  platform,
  onConnect,
  onDisconnect,
  onSaveCredentials,
}: PlatformCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const config = PLATFORM_CONFIG[platform.name] || {
    color: 'text-accent-blue',
    description: 'Platform bağlantısı.',
    icon: '🔗',
  };

  const StatusIcon = () => {
    switch (platform.status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-semantic-success" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-semantic-error" />;
      default:
        return <XCircle className="w-5 h-5 text-disabled-text" />;
    }
  };

  const statusLabel = {
    connected: 'Bağlı',
    disconnected: 'Bağlı Değil',
    error: 'Hata',
  };

  const statusColor = {
    connected: 'text-semantic-success',
    disconnected: 'text-secondary-text',
    error: 'text-semantic-error',
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveCredentials(platform.id, apiKey, apiSecret);
      setShowForm(false);
      setApiKey('');
      setApiSecret('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`${platform.name} bağlantısını kesmek istediğinize emin misiniz?`)) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect(platform);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // eBay OAuth entegrasyonu
  const isOAuthPlatform = platform.name === 'eBay';

  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-border-strong transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`text-lg font-semibold ${config.color}`}>{platform.name}</h3>
            <p className="text-sm text-secondary-text mt-0.5">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(true)}
            title="Nasıl bağlanılır?"
            className="p-1 text-secondary-text hover:text-accent-blue rounded-md hover:bg-surface-elevated transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <StatusIcon />
          <span className={`text-sm font-medium ${statusColor[platform.status]}`}>
            {statusLabel[platform.status]}
          </span>
        </div>
      </div>

      {/* Connection Info */}
      {platform.status === 'connected' && (
        <div className="mb-4 p-3 bg-surface-elevated rounded-md space-y-1.5">
          {platform.last_synced_at && (
            <p className="text-xs text-secondary-text">
              Son Senkronizasyon:{' '}
              <span className="text-primary-text">
                {new Date(platform.last_synced_at).toLocaleString('tr-TR')}
              </span>
            </p>
          )}
          {platform.token_expires_at && (
            <p className="text-xs text-secondary-text">
              Token Süresi:{' '}
              <span className="text-primary-text">
                {new Date(platform.token_expires_at).toLocaleString('tr-TR')}
              </span>
            </p>
          )}
          {platform.has_api_key && (
            <p className="text-xs text-secondary-text flex items-center gap-1">
              <Key className="w-3 h-3" /> API Anahtarı Kayıtlı
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {platform.status === 'disconnected' || platform.status === 'error' ? (
          <>
            {isOAuthPlatform ? (
              <button
                onClick={() => onConnect(platform)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-hover transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                eBay&apos;e Bağlan
              </button>
            ) : (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-hover transition-colors"
              >
                <Key className="w-4 h-4" />
                API Anahtarı Gir
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-semantic-error/30 text-semantic-error text-sm font-medium hover:bg-semantic-error/10 transition-colors disabled:opacity-50"
          >
            {isDisconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unlink className="w-4 h-4" />
            )}
            Bağlantıyı Kes
          </button>
        )}

        {platform.name === 'Chrono24' && platform.status === 'connected' && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/feeds/chrono24.xml?dealer_id=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-strong text-secondary-text text-sm font-medium hover:text-primary-text hover:bg-surface-elevated transition-colors"
          >
            <Globe className="w-4 h-4" />
            XML Feed Önizle
          </a>
        )}
      </div>

      {showForm && !isOAuthPlatform && (
        <div className="mt-4 p-4 bg-surface-elevated rounded-lg border border-border-subtle space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1.5">
              API Anahtarı
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API anahtarınızı girin..."
              className="w-full px-3 py-2 rounded-md bg-surface border border-border-strong text-primary-text text-sm placeholder:text-disabled-text focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1.5">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="API secret'ınızı girin..."
              className="w-full px-3 py-2 rounded-md bg-surface border border-border-strong text-primary-text text-sm placeholder:text-disabled-text focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving || (!apiKey && !apiSecret)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-hover transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Kaydet
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setApiKey('');
                setApiSecret('');
              }}
              className="px-4 py-2 rounded-lg border border-border-strong text-secondary-text text-sm font-medium hover:text-primary-text hover:bg-surface transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <PlatformHelpModal
          platformName={platform.name}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}
