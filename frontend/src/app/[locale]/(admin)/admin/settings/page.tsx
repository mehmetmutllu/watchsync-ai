"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Activity,
  Database,
  HardDrive,
  Wifi,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { getSystemSettings, updateSystemSettings, getSystemHealth } from "@/lib/admin-api";
import type { SystemHealth } from "@/types/admin";

const settingLabels: Record<string, { label: string; description: string; type: "text" | "toggle" | "number" }> = {
  site_name: { label: "Site Adı", description: "Platform adı", type: "text" },
  site_description: { label: "Site Açıklaması", description: "Platform açıklaması", type: "text" },
  maintenance_mode: { label: "Bakım Modu", description: "Siteyi bakım moduna al", type: "toggle" },
  registration_enabled: { label: "Kayıt Aktif", description: "Yeni kullanıcı kaydına izin ver", type: "toggle" },
  email_verification_required: { label: "E-posta Doğrulama", description: "Kayıtta e-posta doğrulaması zorunlu", type: "toggle" },
  max_watches_per_dealer: { label: "Maks Saat/Bayi", description: "Bayi başına maksimum saat sayısı", type: "number" },
  ai_auto_process: { label: "AI Otomatik İşleme", description: "Yeni saatleri otomatik AI ile işle", type: "toggle" },
  ai_confidence_threshold: { label: "AI Güven Eşiği", description: "Minimum AI güven skoru (0-1)", type: "number" },
  commission_rate: { label: "Komisyon Oranı (%)", description: "Platform komisyon oranı", type: "number" },
  support_email: { label: "Destek E-posta", description: "Destek e-posta adresi", type: "text" },
  default_currency: { label: "Varsayılan Para Birimi", description: "Sistemde kullanılan para birimi", type: "text" },
};

const healthIcons: Record<string, React.ReactNode> = {
  mysql: <Database className="w-4 h-4" />,
  redis: <Wifi className="w-4 h-4" />,
  disk: <HardDrive className="w-4 h-4" />,
  queue: <Activity className="w-4 h-4" />,
};

const healthStatusIcon = (status: string) => {
  switch (status) {
    case "ok": return <CheckCircle className="w-4 h-4 text-semantic-success" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-semantic-warning" />;
    case "error": return <XCircle className="w-4 h-4 text-semantic-error" />;
    default: return <Activity className="w-4 h-4 text-secondary-text" />;
  }
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [settingsRes, healthRes] = await Promise.all([
          getSystemSettings(),
          getSystemHealth(),
        ]);
        setSettings(settingsRes.data.settings);
        setHealth(healthRes.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const items = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await updateSystemSettings(items);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Sistem Ayarları</h1>
          <p className="text-sm text-secondary-text mt-1">Platform yapılandırması ve sistem durumu</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Kaydedildi" : "Kaydet"}
        </button>
      </div>

      {/* System Health */}
      {health && (
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-accent-blue" />
            <h2 className="text-lg font-semibold text-primary-text">Sistem Durumu</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              health.status === "healthy" ? "bg-semantic-success/10 text-semantic-success" : "bg-semantic-warning/10 text-semantic-warning"
            }`}>
              {health.status === "healthy" ? "Sağlıklı" : "Sorunlu"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(health.checks).map(([key, check]) => (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated">
                <span className="text-secondary-text">{healthIcons[key] || <Activity className="w-4 h-4" />}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-text capitalize">{key}</p>
                  {check.used_percent !== undefined && (
                    <p className="text-xs text-secondary-text">%{check.used_percent} kullanım</p>
                  )}
                  {check.failed_jobs !== undefined && (
                    <p className="text-xs text-secondary-text">{check.failed_jobs} başarısız iş</p>
                  )}
                </div>
                {healthStatusIcon(check.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-accent-blue" />
          <h2 className="text-lg font-semibold text-primary-text">Ayarlar</h2>
        </div>

        <div className="space-y-5">
          {Object.entries(settingLabels).map(([key, config]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3 border-b border-border-subtle/50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-text">{config.label}</p>
                <p className="text-xs text-secondary-text">{config.description}</p>
              </div>
              <div className="flex-shrink-0">
                {config.type === "toggle" ? (
                  <button
                    onClick={() => updateSetting(key, settings[key] === "1" ? "0" : "1")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      settings[key] === "1" ? "bg-accent-blue" : "bg-surface-elevated border border-border-subtle"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings[key] === "1" ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                ) : config.type === "number" ? (
                  <input
                    type="number"
                    value={settings[key] ?? ""}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle text-primary-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                  />
                ) : (
                  <input
                    type="text"
                    value={settings[key] ?? ""}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    className="w-48 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
