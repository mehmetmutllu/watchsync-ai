"use client";

import { useEffect, useState, use } from "react";
import { useFormatter, useTranslations } from "next-intl";

import {
  ArrowLeft,
  Mail,
  Watch,
  ShieldAlert,
  Ban,
  CheckCircle,
  KeyRound,
  Trash2,
  Loader2,
} from "lucide-react";
import { getAdminUser, updateUserStatus, resetUserPassword, deleteAdminUser } from "@/lib/admin-api";
import type { AdminUserDetail } from "@/types/admin";
import { useRouter } from "@/i18n/routing";

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("AdminUserDetail");
  const tu = useTranslations("AdminUsers");
  const format = useFormatter();
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminUser(Number(id));
        setData(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAction = async (action: string) => {
    if (!data) return;
    setActionLoading(action);
    try {
      if (action === "toggle-status") {
        const newStatus = data.user.dealer?.status === "active" ? "suspended" : "active";
        await updateUserStatus(Number(id), newStatus);
      } else if (action === "reset-password") {
        await resetUserPassword(Number(id));
        alert(t("reset_password_sent"));
      } else if (action === "delete") {
        if (!confirm(t("delete_confirm"))) {
          setActionLoading(null);
          return;
        }
        await deleteAdminUser(Number(id));
        router.push("/admin/users");
        return;
      }
      // Refresh data
      const res = await getAdminUser(Number(id));
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-secondary-text">{tu("empty")}</div>;
  }

  const { user, sales_count, total_sales_value } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/users")}
        className="inline-flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        {t("back_to_users")}
      </button>

      {/* Header */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-text">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-secondary-text" />
                <span className="text-sm text-secondary-text">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.dealer?.status === "active"
                    ? "bg-semantic-success/10 text-semantic-success"
                    : "bg-semantic-error/10 text-semantic-error"
                }`}>
                  {user.dealer?.status === "active" ? tu("status_active") : tu("status_suspended")}
                </span>
                {user.dealer?.company_name && (
                  <span className="text-xs text-secondary-text">{user.dealer.company_name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAction("toggle-status")}
              disabled={actionLoading === "toggle-status"}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                user.dealer?.status === "active"
                  ? "bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/20"
                  : "bg-semantic-success/10 text-semantic-success hover:bg-semantic-success/20"
              }`}
            >
              {user.dealer?.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {user.dealer?.status === "active" ? tu("action_suspend") : tu("action_activate")}
            </button>
            <button
              onClick={() => handleAction("reset-password")}
              disabled={actionLoading === "reset-password"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {t("reset_password")}
            </button>
            <button
              onClick={() => handleAction("delete")}
              disabled={actionLoading === "delete"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("delete")}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <Watch className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-text">{user.watches_count ?? 0}</p>
              <p className="text-xs text-secondary-text">{t("stat_watches")}</p>
            </div>
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-semantic-success/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-semantic-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-text">{sales_count}</p>
              <p className="text-xs text-secondary-text">{t("stat_sales_count")}</p>
            </div>
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
              <span className="text-accent-purple font-bold text-sm">€</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-text">
                {format.number(total_sales_value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-secondary-text">{t("stat_sales_value")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Watches */}
      {user.watches && user.watches.length > 0 && (
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-primary-text mb-4">{t("recent_watches")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-secondary-text">
                  <th className="text-start px-4 py-2 font-medium">{t("col_brand_model")}</th>
                  <th className="text-center px-4 py-2 font-medium">{tu("col_status")}</th>
                  <th className="text-end px-4 py-2 font-medium">{t("col_price")}</th>
                </tr>
              </thead>
              <tbody>
                {user.watches.map((w) => (
                  <tr key={w.id} className="border-b border-border-subtle/50">
                    <td className="px-4 py-2 text-primary-text">
                      {w.brand} {w.model}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-secondary-text">
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-end text-secondary-text">
                      {w.sale_price ? format.number(w.sale_price, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
