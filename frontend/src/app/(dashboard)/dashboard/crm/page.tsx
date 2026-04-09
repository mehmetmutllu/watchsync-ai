"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
  deleteCustomerNote,
  type Customer,
  type CustomerDetail,
  type CreateCustomerParams,
} from "@/lib/crm-api";

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        search: search || undefined,
        page: currentPage,
      });
      setCustomers(res.data);
      setTotalPages(res.meta?.last_page ?? res.last_page ?? 1);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await getCustomer(id);
      setSelectedCustomer(detail);
    } catch {
      /* empty */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (params: CreateCustomerParams) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, params);
    } else {
      await createCustomer(params);
    }
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) return;
    await deleteCustomer(id);
    setSelectedCustomer(null);
    fetchCustomers();
  };

  const handleAddNote = async () => {
    if (!selectedCustomer || !noteText.trim()) return;
    await addCustomerNote(selectedCustomer.id, noteText.trim());
    setNoteText("");
    openDetail(selectedCustomer.id);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!selectedCustomer) return;
    await deleteCustomerNote(selectedCustomer.id, noteId);
    openDetail(selectedCustomer.id);
  };

  // ─── Detail View ─────────────────────────────────────────
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-secondary-text" />
          </button>
          <div className="flex-1">
            <h1 className="text-heading text-primary-text font-bold">
              {selectedCustomer.first_name} {selectedCustomer.last_name}
            </h1>
            {selectedCustomer.company && (
              <p className="text-sm text-secondary-text">
                {selectedCustomer.company}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setEditingCustomer(selectedCustomer);
              setShowForm(true);
            }}
            className="px-4 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(selectedCustomer.id)}
            className="p-2 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary-text">
              Contact Info
            </h3>
            {selectedCustomer.email && (
              <div className="flex items-center gap-2 text-sm text-secondary-text">
                <Mail className="w-4 h-4" />
                {selectedCustomer.email}
              </div>
            )}
            {selectedCustomer.phone && (
              <div className="flex items-center gap-2 text-sm text-secondary-text">
                <Phone className="w-4 h-4" />
                {selectedCustomer.phone}
              </div>
            )}
            {(selectedCustomer.address || selectedCustomer.city) && (
              <div className="flex items-start gap-2 text-sm text-secondary-text">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>
                  {selectedCustomer.address}
                  {selectedCustomer.postal_code || selectedCustomer.city
                    ? `, ${selectedCustomer.postal_code ?? ""} ${selectedCustomer.city ?? ""}`
                    : ""}
                  {selectedCustomer.country
                    ? `, ${selectedCustomer.country}`
                    : ""}
                </span>
              </div>
            )}
            {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedCustomer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-blue/10 text-accent-blue text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes ({selectedCustomer.notes?.length ?? 0})
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-3 py-2 bg-accent-blue text-white rounded-lg text-sm hover:bg-accent-blue/90 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedCustomer.notes?.map((note) => (
                <div
                  key={note.id}
                  className="flex justify-between items-start p-3 rounded-lg bg-background"
                >
                  <div>
                    <p className="text-sm text-primary-text">{note.content}</p>
                    <p className="text-xs text-secondary-text mt-1">
                      {note.user.name} &middot;{" "}
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 rounded hover:bg-accent-red/10 text-secondary-text hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!selectedCustomer.notes ||
                selectedCustomer.notes.length === 0) && (
                <p className="text-sm text-secondary-text text-center py-4">
                  No notes yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Purchase History */}
        {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 && (
          <div className="bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices ({selectedCustomer.invoices.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-text border-b border-border-subtle">
                    <th className="pb-2 font-medium">Invoice #</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border-subtle/50"
                    >
                      <td className="py-2 font-mono text-xs">
                        {inv.invoice_number}
                      </td>
                      <td className="py-2">
                        {new Date(inv.issue_date).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-2 text-right font-medium">
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
        )}
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-primary-text font-bold">CRM</h1>
          <p className="text-sm text-secondary-text mt-1">
            Manage your customer relationships and communications.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-medium hover:bg-accent-blue/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-10 h-10 text-secondary-text mb-3" />
            <p className="text-sm text-secondary-text">No customers found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary-text border-b border-border-subtle bg-background/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium text-right">Invoices</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openDetail(c.id)}
                  className="border-b border-border-subtle/50 hover:bg-surface/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-primary-text">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-secondary-text">
                    {c.company ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags?.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 text-xs rounded bg-accent-blue/10 text-accent-blue"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-secondary-text">
                    {c.invoices_count ?? 0}
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateCustomerParams>({
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
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags?.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...(f.tags ?? []), tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-primary-text">
            {customer ? "Edit Customer" : "Add Customer"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-5 h-5 text-secondary-text" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First Name *"
              value={form.first_name}
              onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
              required
            />
            <FormField
              label="Last Name *"
              value={form.last_name}
              onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Email"
              type="email"
              value={form.email ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              icon={<Mail className="w-4 h-4" />}
            />
            <FormField
              label="Phone"
              value={form.phone ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              icon={<Phone className="w-4 h-4" />}
            />
          </div>
          <FormField
            label="Company"
            value={form.company ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, company: v }))}
            icon={<Building2 className="w-4 h-4" />}
          />
          <FormField
            label="Address"
            value={form.address ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            icon={<MapPin className="w-4 h-4" />}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="City"
              value={form.city ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
            />
            <FormField
              label="Postal Code"
              value={form.postal_code ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, postal_code: v }))}
            />
            <FormField
              label="Country"
              value={form.country ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, country: v }))}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-secondary-text mb-1.5">
              Tags
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
                placeholder="Add tag..."
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-blue/10 text-accent-blue text-xs"
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border-subtle rounded-lg hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : customer ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary-text mb-1.5">
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
          className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm bg-background border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/40`}
        />
      </div>
    </div>
  );
}
