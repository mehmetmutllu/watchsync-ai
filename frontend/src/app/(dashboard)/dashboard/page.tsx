"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import type { DashboardStats } from "@/types";

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
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data.stats);
      } catch {
        setError("Dashboard verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpiCards = stats
    ? [
        {
          key: "total_inventory_value" as const,
          label: "Total Inventory Value",
          value: formatCurrency(stats.total_inventory_value),
        },
        {
          key: "active_watches" as const,
          label: "Active Watches",
          value: stats.active_watches.toString(),
        },
        {
          key: "sold_this_month" as const,
          label: "Sold This Month",
          value: stats.sold_this_month.toString(),
        },
        {
          key: "pending_syncs" as const,
          label: "Pending Syncs",
          value: stats.pending_syncs.toString(),
        },
        {
          key: "sync_success_rate" as const,
          label: "Sync Success Rate",
          value: `${stats.sync_success_rate}%`,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-text">
          Welcome back, {user?.name || "User"}. Here&apos;s your inventory
          overview.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {kpiCards.map((card) => {
            const Icon = iconMap[card.key];
            return (
              <div
                key={card.key}
                className="group relative bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl p-6
                  hover:border-border-strong transition-colors duration-150
                  shadow-[var(--shadow-card)]"
              >
                <span className="text-xs font-medium uppercase tracking-wider text-secondary-text">
                  {card.label}
                </span>
                <p className="mt-2 text-2xl font-bold font-mono text-primary-text">
                  {card.value}
                </p>
                <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
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
