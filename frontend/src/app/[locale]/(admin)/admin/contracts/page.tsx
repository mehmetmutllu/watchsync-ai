"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  FileText,
  Plus,
  Send,
  Edit3,
  Users,
  Loader2,
  Archive,
} from "lucide-react";
import {
  getAdminContracts,
  createContract,
  updateContract,
  publishContract,
  getContractAcceptances,
} from "@/lib/admin-api";
import type { Contract, ContractAcceptance, PaginatedResponse } from "@/types/admin";

const CONTRACT_TYPES = ["terms_of_service", "privacy_policy", "kvkk_gdpr", "cookie_policy"] as const;

const statusColors: Record<string, string> = {
  draft: "bg-secondary-text/10 text-secondary-text",
  published: "bg-semantic-success/10 text-semantic-success",
  archived: "bg-semantic-warning/10 text-semantic-warning",
};

export default function AdminContractsPage() {
  const t = useTranslations("AdminContracts");
  const tc = useTranslations("Common");
  const format = useFormatter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({ type: "terms_of_service", title: "", content: "", version: "1.0" });
  const [saving, setSaving] = useState(false);
  // Acceptances modal
  const [showAcceptances, setShowAcceptances] = useState<number | null>(null);
  const [acceptances, setAcceptances] = useState<ContractAcceptance[]>([]);
  const [acceptancesLoading, setAcceptancesLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminContracts(page);
      const data = res.data as PaginatedResponse<Contract>;
      setContracts(data.data);
      setLastPage(data.last_page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingContract) {
        await updateContract(editingContract.id, {
          title: formData.title,
          content: formData.content,
          version: formData.version,
        });
      } else {
        await createContract(formData);
      }
      setShowForm(false);
      setEditingContract(null);
      setFormData({ type: "terms_of_service", title: "", content: "", version: "1.0" });
      fetchContracts();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number) => {
    if (!confirm(t("publish_confirm"))) return;
    try {
      await publishContract(id);
      fetchContracts();
    } catch {
      // ignore
    }
  };

  const handleViewAcceptances = async (id: number) => {
    setShowAcceptances(id);
    setAcceptancesLoading(true);
    try {
      const res = await getContractAcceptances(id);
      const data = res.data as PaginatedResponse<ContractAcceptance>;
      setAcceptances(data.data);
    } catch {
      // ignore
    } finally {
      setAcceptancesLoading(false);
    }
  };

  const openEdit = (c: Contract) => {
    setEditingContract(c);
    setFormData({ type: c.type, title: c.title, content: c.content, version: c.version });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">{t("title")}</h1>
          <p className="text-sm text-secondary-text mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => { setEditingContract(null); setFormData({ type: "terms_of_service", title: "", content: "", version: "1.0" }); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("new_contract")}
        </button>
      </div>

      {/* Contracts */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p>{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-secondary-text">
                  <th className="text-start px-5 py-3 font-medium">{t("col_title")}</th>
                  <th className="text-start px-5 py-3 font-medium">{t("col_type")}</th>
                  <th className="text-center px-5 py-3 font-medium">{t("col_version")}</th>
                  <th className="text-center px-5 py-3 font-medium">{t("col_status")}</th>
                  <th className="text-center px-5 py-3 font-medium">{t("col_acceptances")}</th>
                  <th className="text-end px-5 py-3 font-medium">{t("col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-border-subtle/50 hover:bg-surface-elevated/50">
                    <td className="px-5 py-3 text-primary-text font-medium">{c.title}</td>
                    <td className="px-5 py-3 text-secondary-text text-xs">{(CONTRACT_TYPES as readonly string[]).includes(c.type) ? t(`type_${c.type}`) : c.type}</td>
                    <td className="px-5 py-3 text-center text-secondary-text">v{c.version}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{t(`status_${c.status}`)}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-secondary-text">{c.acceptances_count ?? 0}</td>
                    <td className="px-5 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "draft" && (
                          <button onClick={() => handlePublish(c.id)} className="p-1.5 rounded-lg hover:bg-semantic-success/10 text-secondary-text hover:text-semantic-success" title={t("action_publish")}
                            aria-label={t("action_publish")}>
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {c.status !== "archived" && (
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-accent-blue/10 text-secondary-text hover:text-accent-blue" title={t("action_edit")}
                            aria-label={t("action_edit")}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleViewAcceptances(c.id)} className="p-1.5 rounded-lg hover:bg-accent-purple/10 text-secondary-text hover:text-accent-purple" title={t("acceptances_title")}
                          aria-label={t("acceptances_title")}>
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
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
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text disabled:opacity-40">{tc("previous")}</button>
          <span className="text-sm text-secondary-text">{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text disabled:opacity-40">{tc("next")}</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary-text mb-4">{editingContract ? t("edit_contract") : t("new_contract")}</h3>

            {!editingContract && (
              <div className="mb-4">
                <label htmlFor="contract-type" className="block text-sm font-medium text-primary-text mb-1">{t("col_type")}</label>
                <select
                  id="contract-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
                >
                  {CONTRACT_TYPES.map((k) => (
                    <option key={k} value={k}>{t(`type_${k}`)}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="contract-title" className="block text-sm font-medium text-primary-text mb-1">{t("col_title")}</label>
              <input
                id="contract-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contract-version" className="block text-sm font-medium text-primary-text mb-1">{t("col_version")}</label>
              <input
                id="contract-version"
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contract-content" className="block text-sm font-medium text-primary-text mb-1">{t("field_content")}</label>
              <textarea
                id="contract-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40 resize-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-secondary-text hover:text-primary-text">{tc("cancel")}</button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingContract ? tc("update") : tc("create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Acceptances Modal */}
      {showAcceptances !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAcceptances(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary-text mb-4">{t("acceptances_title")}</h3>
            {acceptancesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-accent-blue" />
              </div>
            ) : acceptances.length === 0 ? (
              <p className="text-sm text-secondary-text text-center py-10">{t("acceptances_empty")}</p>
            ) : (
              <div className="space-y-2">
                {acceptances.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated">
                    <div>
                      <p className="text-sm font-medium text-primary-text">{a.user?.name ?? "?"}</p>
                      <p className="text-xs text-secondary-text">{a.user?.email}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-secondary-text">v{a.version}</p>
                      <p className="text-xs text-secondary-text">{format.dateTime(new Date(a.accepted_at), "short")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAcceptances(null)} className="px-4 py-2 rounded-xl text-sm text-secondary-text hover:text-primary-text">{tc("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
