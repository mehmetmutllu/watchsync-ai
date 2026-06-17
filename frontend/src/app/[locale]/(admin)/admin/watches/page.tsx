"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Watch,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { getAdminWatches, validateWatch } from "@/lib/admin-api";
import type { AdminWatch, PaginatedResponse } from "@/types/admin";

const statusColors: Record<string, string> = {
  pending: "bg-accent-blue/10 text-accent-blue",
  validated: "bg-semantic-success/10 text-semantic-success",
  flagged: "bg-semantic-warning/10 text-semantic-warning",
  rejected: "bg-semantic-error/10 text-semantic-error",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  validated: <CheckCircle className="w-3.5 h-3.5" />,
  flagged: <AlertTriangle className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
};

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  validated: "Onaylı",
  flagged: "Bayraklı",
  rejected: "Reddedildi",
};

export default function AdminWatchesPage() {
  const [watches, setWatches] = useState<AdminWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [validationFilter, setValidationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedWatch, setSelectedWatch] = useState<AdminWatch | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminWatches({
        search: search || undefined,
        validation_status: validationFilter || undefined,
        page,
      });
      const data = res.data as PaginatedResponse<AdminWatch>;
      setWatches(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, validationFilter, page]);

  useEffect(() => {
    fetchWatches();
  }, [fetchWatches]);

  const handleValidate = async (watchId: number, status: "validated" | "rejected") => {
    setActionLoading(true);
    try {
      await validateWatch(watchId, {
        validation_status: status,
        reason: status === "rejected" ? rejectReason : undefined,
      });
      setSelectedWatch(null);
      setRejectReason("");
      fetchWatches();
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
        <h1 className="text-2xl font-bold text-primary-text">Saat Doğrulama</h1>
        <p className="text-sm text-secondary-text mt-1">{total} saat kayıtlı</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Marka, model veya referans ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text placeholder:text-secondary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          />
        </div>
        <select
          value={validationFilter}
          onChange={(e) => { setValidationFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
        >
          <option value="">Tüm Durumlar</option>
          <option value="pending">Bekliyor</option>
          <option value="validated">Onaylı</option>
          <option value="flagged">Bayraklı</option>
          <option value="rejected">Reddedildi</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          </div>
        ) : watches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
            <Watch className="w-10 h-10 mb-3 opacity-40" />
            <p>Saat bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-secondary-text">
                  <th className="text-left px-5 py-3 font-medium">Saat</th>
                  <th className="text-left px-5 py-3 font-medium">Bayi</th>
                  <th className="text-right px-5 py-3 font-medium">Fiyat</th>
                  <th className="text-center px-5 py-3 font-medium">Doğrulama</th>
                  <th className="text-left px-5 py-3 font-medium">Tarih</th>
                  <th className="text-right px-5 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {watches.map((watch) => (
                  <tr key={watch.id} className="border-b border-border-subtle/50 hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-primary-text">{watch.brand} {watch.model}</p>
                        {watch.reference_number && (
                          <p className="text-xs text-secondary-text">Ref: {watch.reference_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-secondary-text">
                      {watch.dealer?.company_name || watch.dealer?.name || "-"}
                    </td>
                    <td className="px-5 py-3 text-right text-secondary-text">
                      {watch.sale_price ? `€${watch.sale_price.toLocaleString("tr-TR")}` : "-"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[watch.validation_status] || ""}`}>
                        {statusIcons[watch.validation_status]}
                        {statusLabels[watch.validation_status] || watch.validation_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-secondary-text text-xs">
                      {new Date(watch.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(watch.validation_status === "pending" || watch.validation_status === "flagged") && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleValidate(watch.id, "validated")}
                            className="p-1.5 rounded-lg hover:bg-semantic-success/10 text-secondary-text hover:text-semantic-success transition-colors"
                            title="Onayla"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedWatch(watch)}
                            className="p-1.5 rounded-lg hover:bg-semantic-error/10 text-secondary-text hover:text-semantic-error transition-colors"
                            title="Reddet"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text hover:text-primary-text disabled:opacity-40 transition-colors">Önceki</button>
          <span className="text-sm text-secondary-text">{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text hover:text-primary-text disabled:opacity-40 transition-colors">Sonraki</button>
        </div>
      )}

      {/* Reject Modal */}
      {selectedWatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedWatch(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary-text mb-1">Saati Reddet</h3>
            <p className="text-sm text-secondary-text mb-4">{selectedWatch.brand} {selectedWatch.model}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ret gerekçesi..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text placeholder:text-secondary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setSelectedWatch(null); setRejectReason(""); }} className="px-4 py-2 rounded-xl text-sm text-secondary-text hover:text-primary-text transition-colors">
                İptal
              </button>
              <button
                onClick={() => handleValidate(selectedWatch.id, "rejected")}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-semantic-error text-white hover:bg-semantic-error/90 disabled:opacity-40 transition-colors"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reddet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
