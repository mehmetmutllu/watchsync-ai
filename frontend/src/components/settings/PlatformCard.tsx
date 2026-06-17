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
  Wifi,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { PlatformInfo } from '@/types';
import { platformsApi } from '@/lib/platforms-api';
import { useTranslations, useLocale } from 'next-intl';

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

export default function PlatformCard({
  platform,
  onConnect,
  onDisconnect,
  onSaveCredentials,
}: PlatformCardProps) {
  const t = useTranslations('PlatformCard');
  const locale = useLocale();

  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const config = {
    eBay: {
      color: 'text-blue-400',
      description: t('eBay_desc'),
      icon: '🛒',
    },
    Chrono24: {
      color: 'text-amber-400',
      description: t('Chrono24_desc'),
      icon: '⌚',
    },
    Shopify: {
      color: 'text-green-400',
      description: t('Shopify_desc'),
      icon: '🏪',
    },
  }[platform.name] || {
    color: 'text-accent-blue',
    description: t('default_desc'),
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
    connected: t('status_connected'),
    disconnected: t('status_disconnected'),
    error: t('status_error'),
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
    if (!window.confirm(t('confirm_disconnect', { name: platform.name }))) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect(platform);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await platformsApi.testConnection(platform.id);
      setTestResult(result);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('test_failed');
      setTestResult({ success: false, message });
    } finally {
      setIsTesting(false);
    }
  };

  // eBay OAuth entegrasyonu
  const isOAuthPlatform = platform.name === 'eBay';

  return (
    <div className="glass-strong glass-hover rounded-2xl p-6 shadow-lg border border-white/10">
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
            title={t('how_to_connect')}
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
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10 space-y-1.5">
          {platform.last_synced_at && (
            <p className="text-xs text-secondary-text">
              {t('last_synced', {
                date: new Date(platform.last_synced_at).toLocaleString(locale)
              })}
            </p>
          )}
          {platform.token_expires_at && (
            <p className="text-xs text-secondary-text">
              {t('token_expires', {
                date: new Date(platform.token_expires_at).toLocaleString(locale)
              })}
            </p>
          )}
          {platform.has_api_key && (
            <p className="text-xs text-secondary-text flex items-center gap-1">
              <Key className="w-3 h-3" /> {t('api_key_saved')}
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
                {t('connect_ebay')}
              </button>
            ) : (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue-hover transition-colors"
              >
                <Key className="w-4 h-4" />
                {t('enter_api_key')}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-blue/30 text-accent-blue text-sm font-medium hover:bg-accent-blue/10 transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              {t('test_connection')}
            </button>
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
              {t('disconnect')}
            </button>
          </>
        )}

        {platform.name === 'Chrono24' && platform.status === 'connected' && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/feeds/chrono24.xml?dealer_id=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-strong text-secondary-text text-sm font-medium hover:text-primary-text hover:bg-surface-elevated transition-colors"
          >
            <Globe className="w-4 h-4" />
            {t('preview_xml')}
          </a>
        )}
      </div>

      {/* Test Connection Result */}
      {testResult && (
        <div
          className={`mt-3 flex items-center gap-2 p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-semantic-success/10 text-semantic-success border border-semantic-success/20'
              : 'bg-semantic-error/10 text-semantic-error border border-semantic-error/20'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {testResult.message}
        </div>
      )}

      {showForm && !isOAuthPlatform && (
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1.5">
              {t('api_key_label')}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('api_key_placeholder')}
              className="w-full px-3 py-2.5 rounded-lg bg-black/20 border border-white/10 text-primary-text text-sm placeholder:text-disabled-text focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1.5">
              {t('api_secret_label')}
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={t('api_secret_placeholder')}
              className="w-full px-3 py-2.5 rounded-lg bg-black/20 border border-white/10 text-primary-text text-sm placeholder:text-disabled-text focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
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
              {t('save')}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setApiKey('');
                setApiSecret('');
              }}
              className="px-4 py-2 rounded-lg border border-border-strong text-secondary-text text-sm font-medium hover:text-primary-text hover:bg-surface transition-colors"
            >
              {t('cancel')}
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
