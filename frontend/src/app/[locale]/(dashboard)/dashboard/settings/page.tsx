'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Settings, RefreshCw, User, Building2, Bell, Plug, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { usePlatformStore } from '@/stores/platformStore';
import { platformsApi } from '@/lib/platforms-api';
import { settingsApi, type NotificationPreferences, type UpdateCompanyParams } from '@/lib/settings-api';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/stores/toastStore';
import PlatformCard from '@/components/settings/PlatformCard';
import type { PlatformInfo } from '@/types';

type SettingsTab = 'profile' | 'company' | 'notifications' | 'platforms';

interface TabItem {
  key: SettingsTab;
  labelKey: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { key: 'profile', labelKey: 'tab_profile', icon: <User className="w-4 h-4" /> },
  { key: 'company', labelKey: 'tab_company', icon: <Building2 className="w-4 h-4" /> },
  { key: 'notifications', labelKey: 'tab_notifications', icon: <Bell className="w-4 h-4" /> },
  { key: 'platforms', labelKey: 'tab_platforms', icon: <Plug className="w-4 h-4" /> },
];

// ─── Profile Tab ───────────────────────────────────────────

function ProfileTab() {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('Common');
  const { user, fetchUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateProfile({ name, email });
      await fetchUser();
      toast.success(t('save_success'), t('save_success_desc'));
    } catch {
      toast.error(t('save_error'), t('save_error_desc'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('save_error'), t('password_mismatch'));
      return;
    }
    setChangingPassword(true);
    try {
      await settingsApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('password_success'), t('password_success_desc'));
    } catch {
      toast.error(t('save_error'), t('password_error_desc'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-surface border border-border-subtle rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary-text">{t('profile_title')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('full_name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {tCommon('save')}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-surface border border-border-subtle rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary-text">{t('change_password')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('current_password')}</label>
            <div className="relative">
              <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 pr-10 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text">
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('new_password')}</label>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 pr-10 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('confirm_password')}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={changingPassword} className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue-hover disabled:opacity-50 transition-colors">
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('change_password')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Company Tab ───────────────────────────────────────────

function CompanyTab() {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('Common');
  const { user, fetchUser } = useAuthStore();
  const dealer = user?.dealer;
  const [form, setForm] = useState<UpdateCompanyParams>({
    company_name: dealer?.company_name ?? '',
    phone: dealer?.phone ?? '',
    tax_number: dealer?.tax_number ?? '',
    address_line1: dealer?.address_line1 ?? '',
    address_line2: dealer?.address_line2 ?? '',
    city: dealer?.city ?? '',
    postal_code: dealer?.postal_code ?? '',
    country: dealer?.country ?? '',
    website: dealer?.website ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dealer) {
      setForm({
        company_name: dealer.company_name ?? '',
        phone: dealer.phone ?? '',
        tax_number: dealer.tax_number ?? '',
        address_line1: dealer.address_line1 ?? '',
        address_line2: dealer.address_line2 ?? '',
        city: dealer.city ?? '',
        postal_code: dealer.postal_code ?? '',
        country: dealer.country ?? '',
        website: dealer.website ?? '',
      });
    }
  }, [dealer]);

  const handleChange = (field: keyof UpdateCompanyParams, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateCompany(form);
      await fetchUser();
      toast.success(t('company_title'), t('company_success_desc'));
    } catch {
      toast.error(t('save_error'), t('save_error_desc'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary-text">{t('company_title')}</h3>
      <p className="text-sm text-secondary-text">{t('company_desc')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('company_name')}</label>
          <input type="text" value={form.company_name ?? ''} onChange={(e) => handleChange('company_name', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('phone')}</label>
          <input type="tel" value={form.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('tax_number')}</label>
          <input type="text" value={form.tax_number ?? ''} onChange={(e) => handleChange('tax_number', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('website')}</label>
          <input type="url" value={form.website ?? ''} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://" className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-primary-text pt-2">{t('address_title')}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('address_line1')}</label>
          <input type="text" value={form.address_line1 ?? ''} onChange={(e) => handleChange('address_line1', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('address_line2')}</label>
          <input type="text" value={form.address_line2 ?? ''} onChange={(e) => handleChange('address_line2', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('city')}</label>
          <input type="text" value={form.city ?? ''} onChange={(e) => handleChange('city', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('postal_code')}</label>
          <input type="text" value={form.postal_code ?? ''} onChange={(e) => handleChange('postal_code', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">{t('country')}</label>
          <input type="text" value={form.country ?? ''} onChange={(e) => handleChange('country', e.target.value)} className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tCommon('save')}
        </button>
      </div>
    </form>
  );
}

// ─── Notifications Tab ─────────────────────────────────────

function NotificationsTab() {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('Common');
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    invoice_emails: true,
    sync_alerts: true,
    stock_alerts: true,
    weekly_report: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.getNotificationPreferences()
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateNotificationPreferences(prefs);
      toast.success(t('tab_notifications'), t('notifications_success_desc'));
    } catch {
      toast.error(t('save_error'), t('save_error_desc'));
    } finally {
      setSaving(false);
    }
  };

  interface NotificationOption {
    key: keyof NotificationPreferences;
    titleKey: 'notify_invoice_emails_title' | 'notify_sync_alerts_title' | 'notify_stock_alerts_title' | 'notify_weekly_report_title';
    descKey: 'notify_invoice_emails_desc' | 'notify_sync_alerts_desc' | 'notify_stock_alerts_desc' | 'notify_weekly_report_desc';
  }

  const NOTIFICATION_OPTIONS: NotificationOption[] = [
    { key: 'invoice_emails', titleKey: 'notify_invoice_emails_title', descKey: 'notify_invoice_emails_desc' },
    { key: 'sync_alerts', titleKey: 'notify_sync_alerts_title', descKey: 'notify_sync_alerts_desc' },
    { key: 'stock_alerts', titleKey: 'notify_stock_alerts_title', descKey: 'notify_stock_alerts_desc' },
    { key: 'weekly_report', titleKey: 'notify_weekly_report_title', descKey: 'notify_weekly_report_desc' },
  ];

  if (loading) {
    return (
      <div className="bg-surface border border-border-subtle rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface-elevated rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary-text">{t('notifications_title')}</h3>
      <p className="text-sm text-secondary-text">{t('notifications_desc')}</p>

      <div className="space-y-3">
        {NOTIFICATION_OPTIONS.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between p-4 bg-surface-elevated border border-border-strong rounded-lg">
            <div>
              <p className="text-sm font-medium text-primary-text">{t(opt.titleKey)}</p>
              <p className="text-xs text-secondary-text mt-0.5">{t(opt.descKey)}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[opt.key]}
              onClick={() => handleToggle(opt.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs[opt.key] ? 'bg-accent-blue' : 'bg-border-strong'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                prefs[opt.key] ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tCommon('save')}
        </button>
      </div>
    </div>
  );
}

// ─── Platforms Tab ──────────────────────────────────────────

function PlatformsTab() {
  const t = useTranslations('Settings');
  const searchParams = useSearchParams();
  const { platforms, isLoading, fetchPlatforms, updateCredentials, disconnectPlatform } =
    usePlatformStore();
  const oauthHandledRef = useRef(false);

  useEffect(() => {
    if (oauthHandledRef.current) return;
    const ebayAuth = searchParams.get('ebay_auth');
    if (ebayAuth === 'success') {
      toast.success(t('ebay_connect_success'), t('ebay_connect_success_desc'));
      oauthHandledRef.current = true;
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (ebayAuth === 'error') {
      const message = searchParams.get('message') || t('ebay_connect_error');
      toast.error(t('ebay_connect_error'), message);
      oauthHandledRef.current = true;
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams, t]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleConnect = useCallback(async (platform: PlatformInfo) => {
    if (platform.name === 'eBay') {
      try {
        const authUrl = await platformsApi.getEbayAuthUrl();
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'ebay_oauth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
        );
        if (popup) {
          const interval = setInterval(() => {
            if (popup.closed) {
              clearInterval(interval);
              fetchPlatforms();
            }
          }, 500);
        }
      } catch {
        toast.error(t('save_error'), t('ebay_oauth_error'));
      }
    }
  }, [fetchPlatforms, t]);

  const handleDisconnect = useCallback(async (platform: PlatformInfo) => {
    try {
      if (platform.name === 'eBay') {
        await platformsApi.disconnectEbay();
      } else {
        await disconnectPlatform(platform.id);
      }
      toast.success(t('disconnect_success'), t('disconnect_success_desc', { name: platform.name }));
      fetchPlatforms();
    } catch {
      toast.error(t('save_error'), t('disconnect_error_desc', { name: platform.name }));
    }
  }, [disconnectPlatform, fetchPlatforms, t]);

  const handleSaveCredentials = useCallback(async (platformId: number, apiKey: string, apiSecret: string) => {
    try {
      await updateCredentials(platformId, { api_key: apiKey, api_secret: apiSecret });
      toast.success(t('credentials_saved'), t('credentials_saved_desc'));
    } catch {
      toast.error(t('save_error'), t('credentials_save_error'));
    }
  }, [updateCredentials, t]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary-text">{t('platforms_title')}</h3>
          <p className="text-sm text-secondary-text">{t('platforms_desc')}</p>
        </div>
        <button onClick={() => fetchPlatforms()} disabled={isLoading} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-strong text-secondary-text text-sm font-medium hover:text-primary-text hover:bg-surface-elevated transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('refresh_btn')}
        </button>
      </div>

      {isLoading && platforms.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-lg p-6 animate-pulse">
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
          <Plug className="w-12 h-12 text-disabled-text mx-auto mb-3" />
          <h3 className="text-lg font-medium text-primary-text mb-1">{t('platform_not_found')}</h3>
          <p className="text-sm text-secondary-text">{t('platform_not_found_desc')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-text">{t('title')}</h1>
          <p className="text-sm text-secondary-text">{t('desc')}</p>
        </div>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div role="tablist" aria-label={t('title')} className="flex gap-1 border-b border-border-subtle overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`settings-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`settings-panel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-secondary-text hover:text-primary-text'
            }`}
          >
            {tab.icon}
            <span>{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" id={`settings-panel-${activeTab}`} aria-labelledby={`settings-tab-${activeTab}`}>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'company' && <CompanyTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'platforms' && <PlatformsTab />}
      </div>
    </div>
  );
}
