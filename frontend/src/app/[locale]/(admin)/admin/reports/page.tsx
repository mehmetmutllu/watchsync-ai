"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  BarChart3,
  Download,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  getRevenueReport,
  getCommissionReport,
  exportReport,
} from "@/lib/admin-api";
import type { CommissionReport } from "@/types/admin";

export default function AdminReportsPage() {
  const t = useTranslations("AdminReports");
  const format = useFormatter();
  const eur = (v: number) =>
    format.number(v, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const [activeTab, setActiveTab] = useState<"revenue" | "commissions">("revenue");
  const [revenueData, setRevenueData] = useState<{ invoices: unknown; total_revenue: number } | null>(null);
  const [commissionData, setCommissionData] = useState<CommissionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (activeTab === "revenue") {
          const res = await getRevenueReport({
            from: dateFrom || undefined,
            to: dateTo || undefined,
          });
          setRevenueData(res.data);
        } else {
          const res = await getCommissionReport();
          setCommissionData(res.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab, dateFrom, dateTo]);

  const handleExport = async (type: "revenue" | "watches" | "users") => {
    setExporting(true);
    try {
      const res = await exportReport(type, {
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">{t("title")}</h1>
          <p className="text-sm text-secondary-text mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("revenue")}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export_revenue")}
          </button>
          <button
            onClick={() => handleExport("watches")}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export_watches")}
          </button>
          <button
            onClick={() => handleExport("users")}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-semantic-success/10 text-semantic-success hover:bg-semantic-success/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export_users")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-elevated w-fit">
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "revenue"
              ? "bg-accent-blue text-white"
              : "text-secondary-text hover:text-primary-text"
          }`}
        >
          {t("tab_revenue")}
        </button>
        <button
          onClick={() => setActiveTab("commissions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "commissions"
              ? "bg-accent-blue text-white"
              : "text-secondary-text hover:text-primary-text"
          }`}
        >
          {t("tab_commissions")}
        </button>
      </div>

      {/* Date Filters */}
      {activeTab === "revenue" && (
        <div className="flex gap-3 flex-wrap">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
            aria-label={t("date_from")}
            placeholder={t("date_from")}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
            aria-label={t("date_to")}
            placeholder={t("date_to")}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
      ) : activeTab === "revenue" && revenueData ? (
        <div className="space-y-4">
          {/* Revenue Summary */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-semantic-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-semantic-success" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-text">
                  {eur(revenueData.total_revenue)}
                </p>
                <p className="text-sm text-secondary-text">{t("total_revenue")}</p>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-secondary-text">
                    <th className="text-start px-5 py-3 font-medium">{t("col_invoice_no")}</th>
                    <th className="text-start px-5 py-3 font-medium">{t("col_dealer")}</th>
                    <th className="text-end px-5 py-3 font-medium">{t("col_total")}</th>
                    <th className="text-start px-5 py-3 font-medium">{t("col_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(((revenueData.invoices as { data?: Record<string, unknown>[] })?.data ?? revenueData.invoices) as Record<string, unknown>[])?.map((inv, idx) => (
                    <tr key={idx} className="border-b border-border-subtle/50 hover:bg-surface-elevated/50">
                      <td className="px-5 py-3 text-primary-text font-mono text-xs">{String(inv.invoice_number ?? "—")}</td>
                      <td className="px-5 py-3 text-secondary-text">{String((inv.dealer as Record<string, unknown>)?.name ?? "—")}</td>
                      <td className="px-5 py-3 text-end text-primary-text">{eur(Number(inv.total ?? 0))}</td>
                      <td className="px-5 py-3 text-secondary-text text-xs">{inv.updated_at ? format.dateTime(new Date(String(inv.updated_at)), "short") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "commissions" && commissionData ? (
        <div className="glass-strong rounded-2xl overflow-hidden">
          {commissionData.commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
              <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
              <p>{t("no_commission_data")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-secondary-text">
                    <th className="text-start px-5 py-3 font-medium">{t("col_platform")}</th>
                    <th className="text-center px-5 py-3 font-medium">{t("col_successful_syncs")}</th>
                    <th className="text-center px-5 py-3 font-medium">{t("col_total_syncs")}</th>
                    <th className="text-center px-5 py-3 font-medium">{t("col_success_rate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionData.commissions.map((c, idx) => (
                    <tr key={idx} className="border-b border-border-subtle/50 hover:bg-surface-elevated/50">
                      <td className="px-5 py-3 text-primary-text font-medium">{c.platform}</td>
                      <td className="px-5 py-3 text-center text-semantic-success">{c.successful_syncs}</td>
                      <td className="px-5 py-3 text-center text-secondary-text">{c.total_syncs}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.success_rate >= 90 ? "bg-semantic-success/10 text-semantic-success" :
                          c.success_rate >= 70 ? "bg-semantic-warning/10 text-semantic-warning" :
                          "bg-semantic-error/10 text-semantic-error"
                        }`}>
                          {format.number(c.success_rate / 100, { style: "percent", maximumFractionDigits: 1 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
