"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Plus,
  Download,
  Send,
  Trash2,
  X,
  ChevronLeft,
  Eye,
} from "lucide-react";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePdf,
  sendInvoice,
  type Invoice,
  type CreateInvoiceParams,
} from "@/lib/invoice-api";
import { getCustomers, type Customer } from "@/lib/crm-api";

export default function InvoicesPage() {
  const t = useTranslations("Invoices");
  const tCommon = useTranslations("Common");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({
        status: statusFilter || undefined,
        page: currentPage,
      });
      setInvoices(res.data);
      setTotalPages(res.meta?.last_page ?? res.last_page ?? 1);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await getInvoice(id);
      setSelectedInvoice(detail);
    } catch {
      /* empty */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("delete_confirm"))) return;
    await deleteInvoice(id);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  const handleSend = async (id: number) => {
    try {
      await sendInvoice(id);
      if (selectedInvoice) openDetail(id);
      fetchInvoices();
    } catch {
      alert(t("email_send_error"));
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateInvoice(id, { status });
    if (selectedInvoice) openDetail(id);
    fetchInvoices();
  };

  // ─── Detail View ─────────────────────────────────────────
  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedInvoice(null)}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-secondary-text" />
          </button>
          <div className="flex-1">
            <h1 className="text-heading text-primary-text font-bold font-mono">
              {selectedInvoice.invoice_number}
            </h1>
            <p className="text-sm text-secondary-text">
              {selectedInvoice.customer
                ? `${selectedInvoice.customer.first_name} ${selectedInvoice.customer.last_name}`
                : t("no_customer")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadInvoicePdf(selectedInvoice.id, `Rechnung_${selectedInvoice.invoice_number}.pdf`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            {selectedInvoice.status !== "cancelled" && (
              <button
                onClick={() => handleSend(selectedInvoice.id)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                {t("send_btn")}
              </button>
            )}
            {selectedInvoice.status === "draft" && (
              <button
                onClick={() => handleDelete(selectedInvoice.id)}
                className="p-2 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={selectedInvoice.status} />
          {selectedInvoice.status === "sent" && (
            <button
              onClick={() =>
                handleStatusChange(selectedInvoice.id, "paid")
              }
              className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-100 transition-colors"
            >
              {t("mark_paid")}
            </button>
          )}
          {selectedInvoice.status !== "cancelled" &&
            selectedInvoice.status !== "paid" && (
              <button
                onClick={() =>
                  handleStatusChange(selectedInvoice.id, "cancelled")
                }
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-100 transition-colors"
              >
                {t("cancel_btn")}
              </button>
            )}
        </div>

        {/* Invoice Details */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <span className="text-secondary-text block">{t("issue_date")}</span>
              <span className="text-primary-text font-medium">
                {new Date(selectedInvoice.issue_date).toLocaleDateString()}
              </span>
            </div>
            {selectedInvoice.due_date && (
              <div>
                <span className="text-secondary-text block">{t("due_date")}</span>
                <span className="text-primary-text font-medium">
                  {new Date(selectedInvoice.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-secondary-text block">{t("currency")}</span>
              <span className="text-primary-text font-medium">
                {selectedInvoice.currency}
              </span>
            </div>
            <div>
              <span className="text-secondary-text block">{t("tax_rate_percent")}</span>
              <span className="text-primary-text font-medium">
                {selectedInvoice.tax_rate}%
              </span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-left text-secondary-text border-b border-border-subtle">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">{t("th_description")}</th>
                <th className="pb-2 font-medium text-right">{t("th_qty")}</th>
                <th className="pb-2 font-medium text-right">{t("th_unit_price")}</th>
                <th className="pb-2 font-medium text-right">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items?.map((item, i) => (
                <tr
                  key={item.id}
                  className="border-b border-border-subtle/50"
                >
                  <td className="py-2.5">{i + 1}</td>
                  <td className="py-2.5">
                    {item.description}
                    {item.watch && (
                      <span className="text-xs text-secondary-text ml-2">
                        Ref: {item.watch.reference_number}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">{item.quantity}</td>
                  <td className="py-2.5 text-right">
                    {Number(item.unit_price).toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2.5 text-right font-medium">
                    {Number(item.total).toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-text">{t("subtotal")}</span>
                <span className="text-primary-text">
                  {Number(selectedInvoice.subtotal).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {selectedInvoice.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-text">
                  {t("tax", { rate: selectedInvoice.tax_rate })}
                </span>
                <span className="text-primary-text">
                  {Number(selectedInvoice.tax_amount).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {selectedInvoice.currency}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-t-border-subtle text-base font-bold">
                <span>{t("total")}</span>
                <span>
                  {Number(selectedInvoice.total).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {selectedInvoice.currency}
                </span>
              </div>
            </div>
          </div>

          {selectedInvoice.notes && (
            <div className="mt-6 p-4 bg-background rounded-lg">
              <p className="text-xs text-secondary-text mb-1">{t("notes")}</p>
              <p className="text-sm text-primary-text">
                {selectedInvoice.notes}
              </p>
            </div>
          )}
        </div>
      </div>
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
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-medium hover:bg-accent-blue/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("new_invoice")}
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {["", "draft", "sent", "paid", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === s
                ? "bg-accent-blue text-white"
                : "bg-surface border border-border-subtle text-secondary-text hover:bg-background"
            }`}
          >
            {s ? t(`status_${s as "draft" | "sent" | "paid" | "cancelled"}`) : t("status_all")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-10 h-10 text-secondary-text mb-3" />
            <p className="text-sm text-secondary-text">{t("no_invoices")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary-text border-b border-border-subtle bg-background/50">
                <th className="px-4 py-3 font-medium">{t("th_invoice_num")}</th>
                <th className="px-4 py-3 font-medium">{t("th_customer")}</th>
                <th className="px-4 py-3 font-medium">{t("th_date")}</th>
                <th className="px-4 py-3 font-medium">{t("th_status")}</th>
                <th className="px-4 py-3 font-medium text-right">{t("th_total")}</th>
                <th className="px-4 py-3 font-medium text-right">{t("th_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border-subtle/50 hover:bg-surface/80 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary-text">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {inv.customer
                      ? `${inv.customer.first_name} ${inv.customer.last_name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {new Date(inv.issue_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-primary-text">
                    {Number(inv.total).toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    {inv.currency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openDetail(inv.id)}
                        className="p-1.5 rounded-lg hover:bg-background transition-colors text-secondary-text"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadInvoicePdf(inv.id, `Rechnung_${inv.invoice_number}.pdf`)}
                        className="p-1.5 rounded-lg hover:bg-background transition-colors text-secondary-text"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
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
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                p === currentPage
                  ? "bg-accent-blue text-white"
                  : "bg-surface border border-border-subtle hover:bg-background"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Invoice Form Modal */}
      {showForm && (
        <InvoiceFormModal
          onSave={async (params) => {
            await createInvoice(params);
            setShowForm(false);
            fetchInvoices();
          }}
          onClose={() => setShowForm(false)}
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
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] ?? styles.draft}`}
    >
      {t(`status_${status as "draft" | "sent" | "paid" | "cancelled"}`)}
    </span>
  );
}

function InvoiceFormModal({
  onSave,
  onClose,
}: {
  onSave: (params: CreateInvoiceParams) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("Invoices");
  const tCommon = useTranslations("Common");
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customer_id: "" as string,
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    tax_rate: "19",
    currency: "EUR",
    notes: "",
  });
  const [items, setItems] = useState([
    { description: "", quantity: "1", unit_price: "" },
  ]);

  useEffect(() => {
    getCustomers({ page: 1 }).then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", quantity: "1", unit_price: "" }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calcTotal = () => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + (parseInt(item.quantity) || 1) * (parseFloat(item.unit_price) || 0),
      0
    );
    const tax = subtotal * ((parseFloat(form.tax_rate) || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const totals = calcTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        customer_id: form.customer_id ? parseInt(form.customer_id) : undefined,
        issue_date: form.issue_date,
        due_date: form.due_date || undefined,
        tax_rate: parseFloat(form.tax_rate),
        currency: form.currency,
        notes: form.notes || undefined,
        items: items
          .filter((item) => item.description && item.unit_price)
          .map((item) => ({
            description: item.description,
            quantity: parseInt(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price),
          })),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-primary-text">
            {t("new_invoice_title")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-5 h-5 text-secondary-text" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1.5">
                {t("th_customer")}
              </label>
              <select
                value={form.customer_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_id: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              >
                <option value="">{t("no_customer_option")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.company ? ` (${c.company})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1.5">
                {t("currency")}
              </label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1.5">
                {t("issue_date")} *
              </label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issue_date: e.target.value }))
                }
                required
                className="w-full px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1.5">
                {t("due_date")}
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1.5">
                {t("tax_rate_percent")}
              </label>
              <input
                type="number"
                step="0.1"
                value={form.tax_rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tax_rate: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-secondary-text">
                {t("new_invoice")}
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-accent-blue hover:underline"
              >
                {t("add_item")}
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    placeholder={t("description_placeholder")}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, "description", e.target.value)
                    }
                    required
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                  />
                  <input
                    type="number"
                    placeholder={t("qty_placeholder")}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(i, "quantity", e.target.value)
                    }
                    min="1"
                    className="w-16 px-2 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder={t("price_placeholder")}
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(i, "unit_price", e.target.value)
                    }
                    required
                    className="w-28 px-2 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-2 text-secondary-text hover:text-accent-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals Preview */}
          <div className="flex justify-end">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between text-secondary-text">
                <span>{t("subtotal")}</span>
                <span>
                  {totals.subtotal.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-secondary-text">
                <span>{t("tax", { rate: form.tax_rate })}</span>
                <span>
                  {totals.tax.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-primary-text border-t border-border-subtle pt-1">
                <span>{t("total")}</span>
                <span>
                  {totals.total.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {form.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1.5">
              {t("notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className="w-full px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border-subtle rounded-lg hover:bg-background transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
            >
              {saving ? t("creating") : t("create_invoice_btn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
