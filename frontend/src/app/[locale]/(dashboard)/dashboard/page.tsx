"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { usePermission } from "@/hooks/usePermission";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import type { DashboardStats } from "@/types";
import { useTranslations } from "next-intl";

const iconMap = {
  total_inventory_value: TrendingUp,
  active_watches: Package,
  sold_this_month: ShoppingCart,
  pending_syncs: Clock,
  sync_success_rate: CheckCircle,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const user = useAuthStore((s) => s.user);
  const { can } = usePermission();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data.stats);
      } catch {
        setError(t("error_loading"));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

      const kpiCards = stats
    ? [
        ...(can('inventory.view_price') && stats.total_inventory_value !== undefined
          ? [
              {
                key: "total_inventory_value" as const,
                label: t("total_inventory_value"),
                value: formatCurrency(stats.total_inventory_value),
              },
            ]
          : []),
        {
          key: "active_watches" as const,
          label: t("active_watches"),
          value: stats.active_watches.toString(),
        },
        {
          key: "sold_this_month" as const,
          label: t("sold_this_month"),
          value: stats.sold_this_month.toString(),
        },
        {
          key: "pending_syncs" as const,
          label: t("pending_syncs"),
          value: stats.pending_syncs.toString(),
        },
        {
          key: "sync_success_rate" as const,
          label: t("sync_success_rate"),
          value: `${stats.sync_success_rate}%`,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">{t("title")}</h1>
        <p className="mt-1 text-sm text-secondary-text">
          {t("welcome", { name: user?.name || "User" })}
          <span className="hidden sm:inline"> {t("overview")}</span>
        </p>
      </div>

      {/* Loading skeleton — KPI kartlarının şeklini korur (algılanan hızı artırır) */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-strong rounded-2xl p-6 space-y-3">
              <div className="h-3 w-20 rounded bg-surface-elevated animate-pulse" />
              <div className="h-7 w-28 rounded bg-surface-elevated animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-sm text-semantic-error">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      {stats && !loading && (
        <div data-tour="sync-status" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {kpiCards.map((card) => {
            const Icon = iconMap[card.key];
            return (
              <div
                key={card.key}
                className="group relative glass-strong glass-hover rounded-2xl p-6 shadow-lg overflow-hidden"
              >
                {/* Subtle background glow depending on type */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-30 ${
                  card.key === 'total_inventory_value' ? 'bg-accent-gold' : 
                  card.key === 'active_watches' ? 'bg-accent-blue' :
                  card.key === 'sync_success_rate' ? 'bg-semantic-success' : 'bg-accent-blue'
                }`} />

                <span className="relative z-10 text-xs font-medium uppercase tracking-wider text-secondary-text">
                  {card.label}
                </span>
                <p className="relative z-10 mt-2 text-2xl font-bold font-mono text-primary-text">
                  {card.value}
                </p>
                <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Icon className="w-10 h-10" strokeWidth={1} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity Feed — Real-time with polling */}
      {!loading && <ActivityFeed />}
    </div>
  );
}
