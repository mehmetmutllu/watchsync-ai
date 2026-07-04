"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Users,
  Plus,
  Search,
  X,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  FileText,
  Trash2,
  StickyNote,
  Send,
  ChevronLeft,
  Gift,
  Euro,
  Sparkles,
  Palette,
  Clock,
  Heart,
} from "lucide-react";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
  deleteCustomerNote,
  getCustomerStats,
  getCustomerMatches,
  generatePitch,
  type Customer,
  type CustomerDetail,
  type CreateCustomerParams,
  type CustomerStats,
  type CustomerMatchesResponse,
} from "@/lib/crm-api";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { confirmDialog } from "@/stores/confirmStore";
import type { Watch } from "@/types";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { CustomerTimeline } from "@/components/crm/CustomerTimeline";
import { CustomerPortfolio } from "@/components/crm/CustomerPortfolio";
import { CustomerAiInsights } from "@/components/crm/CustomerAiInsights";
import { CustomerQuickActions } from "@/components/crm/CustomerQuickActions";

export default function CrmPage() {
  const t = useTranslations("CRM");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeTab, setActiveTab] = useState<"general" | "notes" | "invoices" | "matches" | "timeline" | "portfolio">("general");

  const [matches, setMatches] = useState<CustomerMatchesResponse | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [pitchLoading, setPitchLoading] = useState<number | null>(null);
  const [pitchResult, setPitchResult] = useState<{ watchId?: number; isBirthday?: boolean; text: string } | null>(null);
  const [pitchLanguage, setPitchLanguage] = useState("de");

  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Customer[]>([]);
  const [birthdayPitchLoading, setBirthdayPitchLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        search: debouncedSearch || undefined,
        page: currentPage,
      });
      setCustomers(res.data);
      setTotalPages(res.meta?.last_page ?? res.last_page ?? 1);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getCustomerStats();
      setStats(res);

      const { getUpcomingBirthdays } = await import("@/lib/crm-api");
      const birthdays = await getUpcomingBirthdays();
      setUpcomingBirthdays(birthdays);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  useEffect(() => {
    if (activeTab === "matches" && selectedCustomer?.metadata?.desired_watch) {
      setMatchesLoading(true);
      getCustomerMatches(selectedCustomer.id)
        .then(setMatches)
        .catch(() => setMatches(null))
        .finally(() => setMatchesLoading(false));
    }
  }, [activeTab, selectedCustomer]);

  const handleGeneratePitch = async (watchId: number, lang: string = pitchLanguage) => {
    if (!selectedCustomer) return;
    setPitchLoading(watchId);
    try {
      const pitch = await generatePitch(selectedCustomer.id, watchId, lang);
      setPitchResult({ watchId, text: pitch });
    } catch {
      alert(tCommon("error") || "Error generating pitch.");
    } finally {
      setPitchLoading(null);
    }
  };

  const handleGenerateBirthdayPitch = async (lang: string = pitchLanguage) => {
    if (!selectedCustomer) return;
    setBirthdayPitchLoading(true);
    try {
      const { generateBirthdayPitch } = await import("@/lib/crm-api");
      const res = await generateBirthdayPitch(selectedCustomer.id, lang);
      setPitchResult({ isBirthday: true, text: res.pitch });
    } catch {
      alert(tCommon("error") || "Error generating birthday pitch.");
    } finally {
      setBirthdayPitchLoading(false);
    }
  };

  const openDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await getCustomer(id);
      setSelectedCustomer(detail);
      setActiveTab("general");
    } catch {
      /* empty */
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const customerId = searchParams.get("customer");
    if (customerId && !selectedCustomer) {
      openDetail(Number(customerId));
      // Replace state to clear the query param so it doesn't re-trigger on refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, openDetail, selectedCustomer]);

  const handleSave = async (params: CreateCustomerParams) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, params);
    } else {
      await createCustomer(params);
    }
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
    fetchStats();
    if (selectedCustomer && editingCustomer && selectedCustomer.id === editingCustomer.id) {
      openDetail(selectedCustomer.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDialog({ title: t("delete_confirm"), danger: true }))) return;
    await deleteCustomer(id);
    setSelectedCustomer(null);
    fetchCustomers();
    fetchStats();
  };

  const handleAddNote = async () => {
    if (!selectedCustomer || !noteText.trim()) return;
    await addCustomerNote(selectedCustomer.id, noteText.trim());
    setNoteText("");
    openDetail(selectedCustomer.id);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!selectedCustomer) return;
    if (!(await confirmDialog({ title: t("delete_note_confirm"), danger: true }))) return;
    await deleteCustomerNote(selectedCustomer.id, noteId);
    openDetail(selectedCustomer.id);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // ─── Detail View ─────────────────────────────────────────
  if (selectedCustomer) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="p-2.5 rounded-xl bg-surface border border-border-subtle hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-secondary-text" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary-text flex items-center gap-2">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </h1>
              <p className="text-sm text-secondary-text">
                {t("contact_info")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Profile Card */}
            <div className="bg-surface border border-border-subtle rounded-2xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border-subtle">
                <div className="w-20 h-20 rounded-full bg-accent-blue/15 flex items-center justify-center text-accent-blue text-3xl font-extrabold">
                  {getInitials(selectedCustomer.first_name, selectedCustomer.last_name)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary-text">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h2>
                  {selectedCustomer.company && (
                    <p className="text-sm text-accent-blue font-medium mt-1">
                      {selectedCustomer.company}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedCustomer.email && (
                  <div className="space-y-1">
                    <span className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("email_label")}</span>
                    <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-2 text-sm text-primary-text hover:text-accent-blue transition-colors">
                      <Mail className="w-4 h-4 text-secondary-text/75" />
                      {selectedCustomer.email}
                    </a>
                  </div>
                )}

                {selectedCustomer.phone && (
                  <div className="space-y-1">
                    <span className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("phone_label")}</span>
                    <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2 text-sm text-primary-text hover:text-accent-blue transition-colors">
                      <Phone className="w-4 h-4 text-secondary-text/75" />
                      {selectedCustomer.phone}
                    </a>
                  </div>
                )}

                {(selectedCustomer.address || selectedCustomer.city || selectedCustomer.country) && (
                  <div className="space-y-1">
                    <span className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("address_label")}</span>
                    <div className="flex items-start gap-2 text-sm text-primary-text">
                      <MapPin className="w-4 h-4 text-secondary-text/75 mt-0.5 flex-shrink-0" />
                      <span>
                        {selectedCustomer.address && <div>{selectedCustomer.address}</div>}
                        {(selectedCustomer.postal_code || selectedCustomer.city) && (
                          <div>{selectedCustomer.postal_code ?? ""} {selectedCustomer.city ?? ""}</div>
                        )}
                        {selectedCustomer.country && <div>{selectedCustomer.country}</div>}
                      </span>
                    </div>
                  </div>
                )}

                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs text-secondary-text font-medium uppercase tracking-wider block">{t("tags_label")}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue/5 border border-accent-blue/20 text-accent-blue text-xs font-medium"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border-subtle">
                <button
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setShowForm(true);
                  }}
                  className="flex-1 py-2 text-center text-sm font-semibold border border-border-subtle rounded-xl hover:bg-background transition-colors"
                >
                  {t("edit")}
                </button>
                <button
                  onClick={() => handleDelete(selectedCustomer.id)}
                  className="p-2 border border-accent-red/20 rounded-xl text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Tabbed Panel */}
            <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
              {/* Tabs list */}
              <div className="flex border-b border-border-subtle bg-background/30 p-1 gap-1">
                <button
                  onClick={() => setActiveTab("general")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 ${activeTab === "general"
                      ? "bg-surface text-primary-text shadow-sm"
                      : "text-secondary-text hover:text-primary-text hover:bg-background/40"
                    }`}
                >
                  {t("tab_general")}
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 ${activeTab === "notes"
                      ? "bg-surface text-primary-text shadow-sm"
                      : "text-secondary-text hover:text-primary-text hover:bg-background/40"
                    }`}
                >
                  {t("tab_notes")} ({selectedCustomer.notes?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 ${activeTab === "timeline"
                      ? "bg-surface text-primary-text shadow-sm"
                      : "text-secondary-text hover:text-primary-text hover:bg-background/40"
                    }`}
                >
                  {t("tab_timeline")}
                </button>
                <button
                  onClick={() => setActiveTab("portfolio")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 ${activeTab === "portfolio"
                      ? "bg-surface text-primary-text shadow-sm"
                      : "text-secondary-text hover:text-primary-text hover:bg-background/40"
                    }`}
                >
                  {t("tab_portfolio")}
                </button>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 ${activeTab === "invoices"
                      ? "bg-surface text-primary-text shadow-sm"
                      : "text-secondary-text hover:text-primary-text hover:bg-background/40"
                    }`}
                >
                  {t("tab_invoices")} ({selectedCustomer.invoices?.length ?? 0})
                </button>
                {selectedCustomer.metadata?.desired_watch && (
                  <button
                    onClick={() => setActiveTab("matches")}
                    className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all !outline-none !ring-0 focus:!outline-none focus:!ring-0 ${activeTab === "matches"
                        ? "bg-surface text-primary-text shadow-sm"
                        : "text-secondary-text hover:text-primary-text hover:bg-background/40"
                      }`}
                  >
                    <Sparkles className="w-4 h-4 inline-block mr-1 text-accent-primary" />
                    {t("tab_matches")}
                  </button>
                )}
              </div>

              <div className="p-6">
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-primary-text border-b border-border-subtle pb-3">
                      {t("preferences_title")}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Birthday */}
                      <div className="col-span-1 md:col-span-2 p-4 bg-background/50 border border-border-subtle/50 rounded-xl flex items-start gap-4">
                        <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500 mt-1">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("birthday")}</p>
                              <p className="text-sm font-semibold text-primary-text mt-0.5">
                                {selectedCustomer.birth_date
                                  ? new Date(selectedCustomer.birth_date).toLocaleDateString()
                                  : "—"}
                              </p>
                            </div>
                            {selectedCustomer.birth_date && (
                              <button
                                onClick={() => handleGenerateBirthdayPitch()}
                                disabled={birthdayPitchLoading}
                                className="px-3 py-1.5 text-xs font-semibold bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
                              >
                                {birthdayPitchLoading ? t("birthday_generating") : t("birthday_generate_mail")}
                              </button>
                            )}
                          </div>
                          {selectedCustomer.auto_send_birthday_mail && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md inline-flex">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{t("auto_send_active")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Favorite Brand */}
                      <div className="p-4 bg-background/50 border border-border-subtle/50 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-accent-blue/10 rounded-xl text-accent-blue">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("favorite_brand")}</p>
                          <p className="text-sm font-semibold text-primary-text mt-0.5">
                            {selectedCustomer.metadata?.favorite_brand || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Favorite Color */}
                      <div className="p-4 bg-background/50 border border-border-subtle/50 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                          <Palette className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("favorite_color")}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {selectedCustomer.metadata?.favorite_color && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-border-subtle/80 inline-block shadow-sm"
                                style={{ backgroundColor: selectedCustomer.metadata.favorite_color }}
                              />
                            )}
                            <span className="text-sm font-semibold text-primary-text capitalize">
                              {selectedCustomer.metadata?.favorite_color || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desired Watch Reference */}
                      <div className="p-4 bg-background/50 border border-border-subtle/50 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("desired_watch")}</p>
                          <p className="text-sm font-semibold text-primary-text mt-0.5">
                            {selectedCustomer.metadata?.desired_watch || t("no_desired_watch")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights Widget */}
                    <CustomerAiInsights customer={selectedCustomer} language={locale} />
                  </div>
                )}

                {activeTab === "portfolio" && (
                  <div className="space-y-4">
                    <CustomerPortfolio 
                      customer={selectedCustomer} 
                      onUpdate={(updatedCustomer) => {
                        setSelectedCustomer(prev => prev ? { ...prev, ...updatedCustomer, notes: prev.notes || [], invoices: prev.invoices || [] } : null);
                        fetchCustomers();
                      }} 
                    />
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                        placeholder={t("add_note_placeholder")}
                        className="flex-1 px-4 py-2.5 text-sm bg-background border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/40 transition-shadow"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                        className="px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-40 transition-all shadow-sm flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {selectedCustomer.notes?.map((note) => (
                        <div
                          key={note.id}
                          className="flex justify-between items-start p-4 rounded-xl bg-background border border-border-subtle/40 hover:border-border-subtle transition-all shadow-sm"
                        >
                          <div className="space-y-1">
                            <p className="text-sm text-primary-text leading-relaxed">{note.content}</p>
                            <p className="text-xs text-secondary-text flex items-center gap-1.5">
                              <span className="font-semibold">{note.user.name}</span>
                              <span>&middot;</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 rounded-lg hover:bg-accent-red/10 text-secondary-text hover:text-accent-red transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!selectedCustomer.notes || selectedCustomer.notes.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 text-secondary-text">
                          <StickyNote className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">{t("no_notes")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "invoices" && (
                  <div className="space-y-4">
                    {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 ? (
                      <div className="border border-border-subtle/50 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-secondary-text border-b border-border-subtle bg-background/50">
                                <th className="px-5 py-3 font-semibold">{t("th_invoice_num")}</th>
                                <th className="px-5 py-3 font-semibold">{t("th_invoice_date")}</th>
                                <th className="px-5 py-3 font-semibold">{t("th_invoice_status")}</th>
                                <th className="px-5 py-3 font-semibold text-right">{t("th_invoice_total")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle/30">
                              {selectedCustomer.invoices.map((inv) => (
                                <tr
                                  key={inv.id}
                                  className="hover:bg-background/30 transition-colors"
                                >
                                  <td className="px-5 py-3 font-mono text-xs text-primary-text">
                                    {inv.invoice_number}
                                  </td>
                                  <td className="px-5 py-3 text-secondary-text">
                                    {new Date(inv.issue_date).toLocaleDateString()}
                                  </td>
                                  <td className="px-5 py-3">
                                    <StatusBadge status={inv.status} />
                                  </td>
                                  <td className="px-5 py-3 text-right font-semibold text-primary-text">
                                    {Number(inv.total).toLocaleString("de-DE", {
                                      minimumFractionDigits: 2,
                                    })}{" "}
                                    {inv.currency}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-secondary-text">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">{t("invoices_section", { count: 0 })}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-primary-text border-b border-border-subtle pb-3">
                      {t("timeline_title")}
                    </h3>
                    <CustomerTimeline customerId={selectedCustomer.id} />
                  </div>
                )}

                {activeTab === "matches" && (
                  <div className="space-y-8">
                    {/* Header */}
                    <div className="border-b border-border-subtle pb-3">
                      <h3 className="text-lg font-bold text-primary-text flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-accent-primary" />
                        {t("radar_title", { query: selectedCustomer.metadata?.desired_watch ?? "" })}
                      </h3>
                      <p className="text-sm text-secondary-text mt-1">{t("radar_subtitle")}</p>
                    </div>

                    {matchesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* 1. Local Inventory */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-secondary-text uppercase tracking-wider flex items-center">
                            <Building2 className="w-4 h-4 mr-2" /> {t("own_inventory")}
                          </h4>
                          {matches?.local_inventory && matches.local_inventory.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {matches.local_inventory.map((watch) => (
                                <div key={watch.id} className="p-4 border border-border-subtle rounded-xl flex flex-col gap-3 glass-hover bg-background/50">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-primary-text">{watch.brand}</p>
                                      <p className="text-sm text-secondary-text">{watch.model}</p>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 bg-background/80 rounded-lg">
                                      {watch.reference_number || "-"}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-end mt-2 pt-3 border-t border-border-subtle/30">
                                    <span className="text-sm font-semibold text-emerald-400">
                                      {watch.sale_price ? `${Number(watch.sale_price).toLocaleString("de-DE")} €` : t("price_on_request")}
                                    </span>
                                    <button
                                      onClick={() => handleGeneratePitch(watch.id)}
                                      disabled={pitchLoading === watch.id}
                                      className="text-xs bg-accent-primary/10 text-accent-primary px-3 py-1.5 rounded-lg flex items-center font-medium hover:bg-accent-primary/20 transition-colors"
                                    >
                                      {pitchLoading === watch.id ? (
                                        <div className="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mr-1.5" />
                                      ) : (
                                        <Mail className="w-3 h-3 mr-1.5" />
                                      )}
                                      {t("pitch_customer")}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center p-4 text-sm text-secondary-text bg-background/30 rounded-xl border border-dashed border-border-subtle">
                              <Search className="w-4 h-4 mr-2 opacity-50" />
                              {t("no_local_matches")}
                            </div>
                          )}
                        </div>

                        {/* 2. Arbitrage Deals */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-secondary-text uppercase tracking-wider flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" /> {t("arbitrage_deals")}
                          </h4>
                          {matches?.arbitrage_deals && matches.arbitrage_deals.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                              {matches.arbitrage_deals.map((deal) => (
                                <div key={deal.id} className="p-4 border border-accent-primary/20 rounded-xl flex flex-col md:flex-row gap-4 glass bg-accent-primary/5 items-start md:items-center">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary uppercase tracking-wider">{deal.platform}</span>
                                      <span className="text-xs text-secondary-text flex items-center"><Search className="w-3 h-3 mr-1" /> {deal.location}</span>
                                    </div>
                                    <p className="font-bold text-primary-text">{deal.title}</p>
                                    <p className="text-xs text-secondary-text mt-1">{t("condition_label")} {deal.condition}</p>
                                    {deal.data_source && (
                                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full border border-accent-blue/20">
                                        <Sparkles className="w-3 h-3" />
                                        <span>{t("market_data_updated", { source: deal.data_source })}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col md:items-end gap-1">
                                    <div className="text-sm text-secondary-text">{t("purchase_label")} <span className="font-semibold text-primary-text">{deal.price.toLocaleString("de-DE")} €</span></div>
                                    <div className="text-sm text-secondary-text">{t("market_value_label")} <span className="font-semibold text-primary-text">{deal.estimated_market_value.toLocaleString("de-DE")} €</span></div>
                                    <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded mt-1">
                                      {t("margin_label")} +{deal.margin.toLocaleString("de-DE")} €
                                    </div>
                                  </div>

                                  <div className="mt-2 md:mt-0 md:ml-4">
                                    <a href={deal.url} target="_blank" rel="noreferrer" className="block text-center w-full md:w-auto px-4 py-2 bg-surface text-primary-text border border-border-subtle rounded-lg text-sm font-medium hover:bg-background/80 transition-colors">
                                      {t("view_deal")}
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center p-4 text-sm text-secondary-text bg-background/30 rounded-xl border border-dashed border-border-subtle">
                              <Search className="w-4 h-4 mr-2 opacity-50" />
                              {t("no_arbitrage")}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pitch Modal */}
        {pitchResult && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-accent-primary" />
                  {t("ai_message")}
                </h3>
                <select
                  className="bg-background border border-border-subtle rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  value={pitchLanguage}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setPitchLanguage(newLang);
                    if (pitchResult.isBirthday) {
                      handleGenerateBirthdayPitch(newLang);
                    } else if (pitchResult.watchId) {
                      handleGeneratePitch(pitchResult.watchId, newLang);
                    }
                  }}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
              <textarea
                className="w-full h-40 bg-background/50 border border-border-subtle rounded-xl p-3 text-sm focus:outline-none focus:border-accent-primary resize-none"
                value={pitchResult.text}
                onChange={(e) => setPitchResult({ ...pitchResult, text: e.target.value })}
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => setPitchResult(null)}
                  className="flex-1 py-2 rounded-xl text-secondary-text hover:bg-background/80 transition-colors font-medium text-sm border border-border-subtle"
                >
                  {t("close_btn")}
                </button>
                <a
                  href={`mailto:${selectedCustomer?.email || ''}?subject=${encodeURIComponent(pitchResult.isBirthday ? t("email_subject_birthday") : t("email_subject_watch"))}&body=${encodeURIComponent(pitchResult.text)}`}
                  className="flex-1 py-2 rounded-xl bg-accent-blue text-white flex items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t("email_btn")}
                </a>
                <a
                  href={getWhatsAppLink(selectedCustomer?.phone, pitchResult.text)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <CustomerFormModal
            customer={editingCustomer}
            onSave={async (params) => {
              await handleSave(params);
              if (selectedCustomer) {
                await openDetail(selectedCustomer.id);
              }
            }}
            onClose={() => {
              setShowForm(false);
              setEditingCustomer(null);
            }}
          />
        )}
      </>
    );
  }

  // ─── List View ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-primary-text font-bold">{t("title")}</h1>
          <p className="text-sm text-secondary-text mt-1">
            {t("desc")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-semibold hover:bg-accent-blue/90 transition-all shadow-sm shadow-accent-blue/10"
        >
          <Plus className="w-4 h-4" />
          {t("add_customer")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Customers */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 relative overflow-hidden group hover:border-accent-blue/40 transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider">{t("stats_total_customers")}</p>
              <p className="text-3xl font-bold text-primary-text mt-2">{stats?.total_customers ?? 0}</p>
            </div>
            <div className="p-3 bg-accent-blue/10 rounded-xl text-accent-blue group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-blue/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Birthdays This Month */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 relative overflow-hidden group hover:border-pink-500/40 transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider">{t("stats_birthdays_this_month")}</p>
              <p className="text-3xl font-bold text-primary-text mt-2">{stats?.birthdays_this_month ?? 0}</p>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500 group-hover:scale-110 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-blue/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Total Revenue */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider">{t("stats_total_revenue")}</p>
              <p className="text-3xl font-bold text-primary-text mt-2">
                {Number(stats?.total_revenue ?? 0).toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                EUR
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
              <Euro className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-blue/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Upcoming Birthdays Widget */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-text flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              {t("upcoming_birthdays_title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map(customer => (
              <div key={customer.id} className="bg-background border border-border-subtle rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-primary-text">{customer.first_name} {customer.last_name}</h3>
                    <span className="text-xs font-mono font-medium text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">
                      {customer.birth_date ? new Date(customer.birth_date).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' }) : ""}
                    </span>
                  </div>
                  {customer.metadata?.desired_watch && (
                    <p className="text-xs text-secondary-text mt-2 line-clamp-1">
                      {t("wishwatch_label")} <span className="text-primary-text">{customer.metadata.desired_watch}</span>
                    </p>
                  )}
                  {customer.auto_send_birthday_mail && (
                    <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {t("auto_mail_active")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openDetail(customer.id)}
                  className="mt-4 w-full py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-subtle hover:bg-accent-blue/5 hover:text-accent-blue hover:border-accent-blue/30 transition-colors"
                >
                  {t("open_customer")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center mb-2 mt-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("search_placeholder")}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/40 shadow-sm"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="bg-surface border border-border-subtle p-1 rounded-xl flex gap-1 shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === "list"
                ? "bg-background text-primary-text shadow-sm border border-border-subtle/50"
                : "text-secondary-text hover:text-primary-text hover:bg-background/40"
              }`}
          >
            {t("view_list")}
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === "kanban"
                ? "bg-background text-primary-text shadow-sm border border-border-subtle/50"
                : "text-secondary-text hover:text-primary-text hover:bg-background/40"
              }`}
          >
            {t("view_kanban")}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          customers={customers}
          onStageChange={async (customerId, newStage) => {
            // Update UI optimistically
            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, pipeline_stage: newStage } : c));
            await updateCustomer(customerId, { pipeline_stage: newStage });
          }}
          onCustomerClick={(c) => openDetail(c.id)}
        />
      ) : (
        <>
          <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
              </div>
            )}

            {customers.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Users className="w-10 h-10 text-secondary-text mb-3" />
                <p className="text-sm text-secondary-text">{t("no_customers")}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-text border-b border-border-subtle bg-background/50">
                    <th className="px-6 py-4 font-semibold">{t("th_name")}</th>
                    <th className="px-6 py-4 font-semibold">{t("th_email")}</th>
                    <th className="px-6 py-4 font-semibold">{t("th_phone")}</th>
                    <th className="px-6 py-4 font-semibold">{t("th_company")}</th>
                    <th className="px-6 py-4 font-semibold">{t("th_tags")}</th>
                    <th className="px-6 py-4 font-semibold text-right">{t("th_invoices")}</th>
                    <th className="px-6 py-4 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openDetail(c.id)}
                      className="hover:bg-surface/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-primary-text">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent-blue/15 flex items-center justify-center text-accent-blue font-bold text-xs">
                            {getInitials(c.first_name, c.last_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-primary-text hover:text-accent-blue transition-colors">
                                {c.first_name} {c.last_name}
                              </p>
                              {c.needs_follow_up && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" title={t("follow_up_due")}></span>
                              )}
                              {c.vip_tier && c.vip_tier !== 'Standard' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  c.vip_tier === 'Platinum' ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 shadow-[0_0_8px_rgba(226,232,240,0.5)]' :
                                  c.vip_tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                  'bg-gray-400/20 text-gray-300 border border-gray-400/30'
                                }`}>
                                  {c.vip_tier}
                                </span>
                              )}
                            </div>
                            {c.company && (
                              <p className="text-xs text-secondary-text md:hidden">
                                {c.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary-text">
                        {c.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-secondary-text/60" />
                            {c.email}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-secondary-text">
                        {c.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-secondary-text/60" />
                            {c.phone}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-secondary-text">
                        {c.company ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap max-w-[150px]">
                          {c.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded-full bg-accent-blue/5 border border-accent-blue/15 text-accent-blue"
                            >
                              {tag}
                            </span>
                          ))}
                          {c.tags && c.tags.length > 2 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-secondary-text/10 text-secondary-text font-medium">
                              +{c.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-secondary-text font-mono">
                        {c.invoices_count ?? 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                          <CustomerQuickActions customer={c} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors ${p === currentPage
                      ? "bg-accent-blue text-white"
                      : "bg-surface border border-border-subtle hover:bg-background"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("Invoices");
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    paid: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled:
      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status] ?? styles.draft}`}
    >
      {t(`status_${status as "draft" | "sent" | "paid" | "cancelled"}`)}
    </span>
  );
}

function CustomerFormModal({
  customer,
  onSave,
  onClose,
}: {
  customer: Customer | null;
  onSave: (params: CreateCustomerParams) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("CRM");
  const tCommon = useTranslations("Common");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: customer?.first_name ?? "",
    last_name: customer?.last_name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    company: customer?.company ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    country: customer?.country ?? "",
    postal_code: customer?.postal_code ?? "",
    tags: customer?.tags ?? [],
    birth_date: customer?.birth_date ?? "",
    auto_send_birthday_mail: customer?.auto_send_birthday_mail ?? false,
    favorite_color: customer?.metadata?.favorite_color ?? "",
    favorite_brand: customer?.metadata?.favorite_brand ?? "",
    desired_watch: customer?.metadata?.desired_watch ?? "",
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const params: CreateCustomerParams = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.company || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        postal_code: form.postal_code || undefined,
        tags: form.tags,
        birth_date: form.birth_date || null,
        auto_send_birthday_mail: form.auto_send_birthday_mail,
        metadata: {
          favorite_color: form.favorite_color || undefined,
          favorite_brand: form.favorite_brand || undefined,
          desired_watch: form.desired_watch || undefined,
          ...(customer?.metadata?.owned_watches ? { owned_watches: customer.metadata.owned_watches } : {}),
        },
      };
      await onSave(params);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-surface border border-border-subtle rounded-2xl flex flex-col shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle shrink-0">
          <h2 className="text-lg font-bold text-primary-text">
            {customer ? t("edit_customer") : t("add_customer")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-5 h-5 text-secondary-text" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("first_name")}
                value={form.first_name}
                onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
                required
              />
              <FormField
                label={t("last_name")}
                value={form.last_name}
                onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("email_label")}
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                icon={<Mail className="w-4 h-4" />}
              />
              <FormField
                label={t("phone_label")}
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                icon={<Phone className="w-4 h-4" />}
              />
            </div>
            <FormField
              label={t("company_label")}
              value={form.company}
              onChange={(v) => setForm((f) => ({ ...f, company: v }))}
              icon={<Building2 className="w-4 h-4" />}
            />
            <FormField
              label={t("address_label")}
              value={form.address}
              onChange={(v) => setForm((f) => ({ ...f, address: v }))}
              icon={<MapPin className="w-4 h-4" />}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label={t("city_label")}
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              <FormField
                label={t("postal_code_label")}
                value={form.postal_code}
                onChange={(v) => setForm((f) => ({ ...f, postal_code: v }))}
              />
              <FormField
                label={t("country_label")}
                value={form.country}
                onChange={(v) => setForm((f) => ({ ...f, country: v }))}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
                {t("tags_label")}
              </label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={t("add_tag_placeholder")}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg hover:bg-surface transition-colors"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
              {form.tags && form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-blue/5 border border-accent-blue/20 text-accent-blue text-xs font-semibold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-accent-red"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preferences Section */}
            <div className="pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-bold text-primary-text mb-3 uppercase tracking-wider">
                {t("preferences_title")}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label={t("birthday")}
                  type="date"
                  value={form.birth_date}
                  onChange={(v) => setForm((f) => ({ ...f, birth_date: v }))}
                />
                <FormField
                  label={t("favorite_brand")}
                  value={form.favorite_brand}
                  onChange={(v) => setForm((f) => ({ ...f, favorite_brand: v }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <FormField
                  label={t("favorite_color")}
                  value={form.favorite_color}
                  onChange={(v) => setForm((f) => ({ ...f, favorite_color: v }))}
                  placeholder={t("favorite_color_placeholder")}
                />
                <FormField
                  label={t("desired_watch")}
                  value={form.desired_watch}
                  onChange={(v) => setForm((f) => ({ ...f, desired_watch: v }))}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-primary-text">
                    {t("auto_birthday_toggle_label")}
                  </span>
                  <span className="block text-xs text-secondary-text">
                    {t("auto_birthday_toggle_desc")}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.auto_send_birthday_mail}
                    onChange={(e) => setForm(f => ({ ...f, auto_send_birthday_mail: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                </label>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-border-subtle shrink-0 bg-surface rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold border border-border-subtle rounded-lg hover:bg-background transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
            >
              {saving ? t("saving") : customer ? t("update") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
  icon,
  placeholder,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-secondary-text mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40 transition-shadow`}
        />
      </div>
    </div>
  );
}
