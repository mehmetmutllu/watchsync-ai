"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Building2,
  UserPlus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getAdminDashboardStats, getRecentAdminActivities } from "@/lib/admin-api";
import { useAdminAuthStore } from "@/stores/adminAuth";
import type { AdminDashboardStats, AdminActivity } from "@/types/admin";

const ACTION_KEYS: Record<string, string> = {
  "auth.login": "action_login",
  "auth.logout": "action_logout",
  "manager.create": "action_manager_create",
  "manager.update": "action_manager_update",
  "manager.delete": "action_manager_delete",
};

export default function AdminDashboardPage() {
  const t = useTranslations("AdminDashboard");
  const format = useFormatter();
  const formatCurrency = (value: number) =>
    format.number(value, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const user = useAdminAuthStore((s) => s.user);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          getAdminDashboardStats(),
          getRecentAdminActivities(),
        ]);
        setStats(statsRes.data.stats);
        setActivities(activitiesRes.data.activities);
      } catch {
        setError(t("load_error"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpiCards = stats
    ? [
        {
          label: t("kpi_dealers"),
          value: stats.total_dealers.toString(),
          sub: t("kpi_dealers_sub", { count: stats.active_dealers }),
          icon: Building2,
          color: "text-accent-blue",
          bg: "bg-accent-blue/10",
        },
        {
          label: t("kpi_users"),
          value: stats.total_users.toString(),
          sub: t("kpi_users_sub", { count: stats.new_users_this_month }),
          icon: Users,
          color: "text-accent-green",
          bg: "bg-accent-green/10",
        },
        {
          label: t("kpi_active_watches"),
          value: stats.active_watches.toString(),
          sub: t("kpi_active_watches_sub", { count: stats.total_watches }),
          icon: Package,
          color: "text-accent-gold",
          bg: "bg-accent-gold/10",
        },
        {
          label: t("kpi_sold_this_month"),
          value: stats.sold_this_month.toString(),
          sub: formatCurrency(stats.revenue_this_month),
          icon: ShoppingCart,
          color: "text-semantic-success",
          bg: "bg-semantic-success/10",
        },
        {
          label: t("kpi_inventory_value"),
          value: formatCurrency(stats.total_inventory_value),
          sub: t("kpi_inventory_value_sub"),
          icon: TrendingUp,
          color: "text-accent-blue",
          bg: "bg-accent-blue/10",
        },
        {
          label: t("kpi_total_revenue"),
          value: formatCurrency(stats.total_revenue),
          sub: t("kpi_total_revenue_sub", { amount: formatCurrency(stats.revenue_this_month) }),
          icon: DollarSign,
          color: "text-accent-gold",
          bg: "bg-accent-gold/10",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-text">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-secondary-text">
          {t("welcome", { name: user?.name || t("admin_fallback") })}
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

      {/* KPI Cards */}
      {stats && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl p-6
                    hover:border-border-strong transition-colors duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-secondary-text">{card.label}</p>
                      <p className="text-2xl font-bold text-primary-text">
                        {card.value}
                      </p>
                      <p className="text-xs text-disabled-text">{card.sub}</p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activities */}
          <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl">
            <div className="px-6 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-primary-text">
                {t("recent_activities")}
              </h2>
            </div>
            <div className="divide-y divide-border-subtle">
              {activities.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-secondary-text">
                  {t("no_activities")}
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 text-accent-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-primary-text truncate">
                          <span className="font-medium">
                            {activity.admin_name}
                          </span>{" "}
                          {ACTION_KEYS[activity.action] ? t(ACTION_KEYS[activity.action]) : activity.action}
                        </p>
                        {activity.ip_address && (
                          <p className="text-xs text-disabled-text">
                            {t("ip_label")}: <span dir="ltr" className="ltr-nums">{activity.ip_address}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-disabled-text whitespace-nowrap ms-4">
                      {activity.time_ago}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
