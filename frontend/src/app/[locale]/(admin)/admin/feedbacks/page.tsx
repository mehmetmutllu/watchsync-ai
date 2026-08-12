"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Search,
  MessageSquare,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { getAdminFeedbacks, updateFeedback, getFeedbackStats } from "@/lib/admin-api";
import type { Feedback, FeedbackStats, PaginatedResponse } from "@/types/admin";

const categoryIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="w-3.5 h-3.5" />,
  suggestion: <Lightbulb className="w-3.5 h-3.5" />,
  complaint: <AlertTriangle className="w-3.5 h-3.5" />,
  general: <HelpCircle className="w-3.5 h-3.5" />,
};

const CATEGORIES = ["bug", "suggestion", "complaint", "general"] as const;
const STATUSES = ["new", "reviewing", "resolved", "rejected"] as const;

const statusColors: Record<string, string> = {
  new: "bg-accent-blue/10 text-accent-blue",
  reviewing: "bg-semantic-warning/10 text-semantic-warning",
  resolved: "bg-semantic-success/10 text-semantic-success",
  rejected: "bg-semantic-error/10 text-semantic-error",
};

export default function AdminFeedbacksPage() {
  const t = useTranslations("AdminFeedbacks");
  const tc = useTranslations("Common");
  const format = useFormatter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedbackRes, statsRes] = await Promise.all([
        getAdminFeedbacks({
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          page,
        }),
        getFeedbackStats(),
      ]);
      const data = feedbackRes.data as PaginatedResponse<Feedback>;
      setFeedbacks(data.data);
      setLastPage(data.last_page);
      setStats(statsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespond = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const data: { status?: string; admin_response?: string } = {};
      if (response.trim()) data.admin_response = response;
      if (newStatus) data.status = newStatus;
      await updateFeedback(selected.id, data);
      setSelected(null);
      setResponse("");
      setNewStatus("");
      fetchData();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-text">{t("title")}</h1>
        <p className="text-sm text-secondary-text mt-1">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUSES.map((key) => (
            <div key={key} className="glass-strong rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary-text">{stats.by_status[key] ?? 0}</p>
              <p className="text-xs text-secondary-text mt-1">{t(`status_${key}`)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          aria-label={t("filter_category")}
          className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
        >
          <option value="">{t("category_all")}</option>
          {CATEGORIES.map((k) => (
            <option key={k} value={k}>{t(`category_${k}`)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label={t("filter_status")}
          className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
        >
          <option value="">{t("status_all")}</option>
          {STATUSES.map((k) => (
            <option key={k} value={k}>{t(`status_${k}`)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
            <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
            <p>{t("empty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                onClick={() => { setSelected(fb); setNewStatus(fb.status); setResponse(fb.admin_response ?? ""); }}
                className="p-5 hover:bg-surface-elevated/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[fb.status]}`}>
                        {t(`status_${fb.status}`)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-secondary-text">
                        {categoryIcons[fb.category]}
                        {t(`category_${fb.category}`)}
                      </span>
                    </div>
                    <h3 className="font-medium text-primary-text truncate">{fb.subject}</h3>
                    <p className="text-sm text-secondary-text line-clamp-2 mt-1">{fb.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-secondary-text">
                      <span>{fb.name} ({fb.email})</span>
                      <span>{format.dateTime(new Date(fb.created_at), "short")}</span>
                    </div>
                  </div>
                  {fb.admin_response && (
                    <span className="flex-shrink-0 text-xs text-semantic-success bg-semantic-success/10 px-2 py-0.5 rounded-full">{t("answered")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text disabled:opacity-40">{tc("previous")}</button>
          <span className="text-sm text-secondary-text">{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text disabled:opacity-40">{tc("next")}</button>
        </div>
      )}

      {/* Response Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selected.status]}`}>{t(`status_${selected.status}`)}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-secondary-text">
                {categoryIcons[selected.category]} {t(`category_${selected.category}`)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-primary-text mb-2">{selected.subject}</h3>
            <p className="text-sm text-secondary-text mb-1">{selected.name} — {selected.email}</p>
            <p className="text-sm text-secondary-text mb-4">{format.dateTime(new Date(selected.created_at), "long")}</p>

            <div className="bg-surface-elevated rounded-xl p-4 mb-4">
              <p className="text-sm text-primary-text whitespace-pre-wrap">{selected.message}</p>
            </div>

            <label htmlFor="fb-status" className="block text-sm font-medium text-primary-text mb-1">{t("field_status")}</label>
            <select
              id="fb-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm mb-4"
            >
              {STATUSES.map((k) => (
                <option key={k} value={k}>{t(`status_${k}`)}</option>
              ))}
            </select>

            <label htmlFor="fb-response" className="block text-sm font-medium text-primary-text mb-1">{t("field_response")}</label>
            <textarea
              id="fb-response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={t("response_placeholder")}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text placeholder:text-secondary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40 resize-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl text-sm text-secondary-text hover:text-primary-text">{tc("cancel")}</button>
              <button
                onClick={handleRespond}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-40 transition-colors"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {tc("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
