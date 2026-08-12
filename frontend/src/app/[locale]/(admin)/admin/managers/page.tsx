"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Shield,
  Check,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getManagers,
  createManager,
  updateManager,
  deleteManager,
  getRoles,
} from "@/lib/admin-api";
import { useAdminAuthStore } from "@/stores/adminAuth";
import type { AdminUser, Role } from "@/types/admin";
import axios from "axios";

// ─── Schema ────────────────────────────────────────────────

// Doğrulama mesajları anahtar olarak tutulur, gösterimde çevrilir.
const managerSchema = z.object({
  name: z.string().min(2, "err_name_min"),
  email: z.string().email("err_email"),
  password: z.string().min(8, "err_password_min"),
  role_id: z.coerce.number().min(1, "err_role_required"),
});

const managerUpdateSchema = z.object({
  name: z.string().min(2, "err_name_min"),
  email: z.string().email("err_email"),
  password: z.string().optional(),
  role_id: z.coerce.number().min(1, "err_role_required"),
  is_active: z.boolean(),
});

type ManagerFormData = z.infer<typeof managerSchema>;
type ManagerUpdateFormData = z.infer<typeof managerUpdateSchema>;

// ─── Role Badge ────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const colors: Record<string, string> = {
    super_admin: "bg-semantic-error/10 text-semantic-error",
    admin: "bg-accent-blue/10 text-accent-blue",
    moderator: "bg-accent-gold/10 text-accent-gold",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
        colors[role.slug] || "bg-surface-elevated text-secondary-text"
      }`}
    >
      <Shield className="w-3 h-3" />
      {role.name}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────

export default function ManagersPage() {
  const t = useTranslations("AdminManagers");
  const tc = useTranslations("Common");
  const { hasPermission } = useAdminAuthStore();
  const [managers, setManagers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingManager, setEditingManager] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const canCreate = hasPermission("admin.users.create");
  const canUpdate = hasPermission("admin.users.update");

  const fetchManagers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getManagers({ search, page });
      setManagers(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch {
      setError(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [search, page, t]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  useEffect(() => {
    getRoles().then(({ data }) => setRoles(data.roles)).catch(() => {});
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t("delete_confirm"))) return;
    try {
      setDeletingId(id);
      await deleteManager(id);
      await fetchManagers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || t("delete_failed"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">{t("title")}</h1>
          <p className="text-sm text-secondary-text">
            {t("registered_count", { count: total })}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-blue text-white text-sm font-semibold
              hover:bg-accent-blue/90 active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            {t("new_manager")}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-disabled-text" />
        <input
          type="text"
          placeholder={t("search_placeholder")}
          aria-label={t("search_placeholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 ps-10 pe-4 rounded-lg bg-surface text-sm text-primary-text
            placeholder-disabled-text border border-border-subtle
            focus:border-accent-blue focus:shadow-[var(--shadow-focus)]
            transition-all duration-150 outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-sm text-semantic-error">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
            <Users className="w-12 h-12 mb-3 text-disabled-text" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-start px-6 py-3 text-xs font-medium text-secondary-text uppercase tracking-wider">
                    {t("col_name")}
                  </th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-secondary-text uppercase tracking-wider">
                    {t("col_email")}
                  </th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-secondary-text uppercase tracking-wider">
                    {t("col_role")}
                  </th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-secondary-text uppercase tracking-wider">
                    {t("col_status")}
                  </th>
                  <th className="text-end px-6 py-3 text-xs font-medium text-secondary-text uppercase tracking-wider">
                    {t("col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {managers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-primary-text">
                        {manager.user.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-secondary-text">
                        {manager.user.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={manager.role} />
                    </td>
                    <td className="px-6 py-4">
                      {manager.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-semantic-success">
                          <Check className="w-3 h-3" /> {t("status_active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-semantic-error">
                          <XCircle className="w-3 h-3" /> {t("status_inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => setEditingManager(manager)}
                            className="p-2 rounded-lg text-secondary-text hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                            aria-label={tc("edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleDelete(manager.id)}
                            disabled={deletingId === manager.id}
                            className="p-2 rounded-lg text-secondary-text hover:text-semantic-error hover:bg-semantic-error/10 transition-colors disabled:opacity-50"
                            aria-label={tc("delete")}
                          >
                            {deletingId === manager.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle">
            <p className="text-xs text-secondary-text">
              {t("page_of", { page, total: lastPage })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated text-secondary-text
                  hover:text-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tc("previous")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated text-secondary-text
                  hover:text-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tc("next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateManagerModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchManagers();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingManager && (
        <EditManagerModal
          manager={editingManager}
          roles={roles}
          onClose={() => setEditingManager(null)}
          onSuccess={() => {
            setEditingManager(null);
            fetchManagers();
          }}
        />
      )}
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────

function CreateManagerModal({
  roles,
  onClose,
  onSuccess,
}: {
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("AdminManagers");
  const tc = useTranslations("Common");
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema) as never,
  });

  const fieldError = (message?: string) => (message ? t(message as "err_email") : null);

  const onSubmit = async (data: ManagerFormData) => {
    setApiError(null);
    try {
      await createManager(data);
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.message || t("create_failed"));
      } else {
        setApiError(tc("generic_error"));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-primary-text">
            {t("new_manager")}
          </h2>
          <button onClick={onClose} className="text-secondary-text hover:text-primary-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-sm text-semantic-error">
              {apiError}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("col_name")}
            </label>
            <input
              {...register("name")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            />
            {errors.name && (
              <p className="text-xs text-semantic-error">{fieldError(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("col_email")}
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            />
            {errors.email && (
              <p className="text-xs text-semantic-error">{fieldError(errors.email.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("field_password")}
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            />
            {errors.password && (
              <p className="text-xs text-semantic-error">{fieldError(errors.password.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("col_role")}
            </label>
            <select
              {...register("role_id")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            >
              <option value="">{t("select_role")}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-xs text-semantic-error">{fieldError(errors.role_id.message)}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-text hover:text-primary-text
                border border-border-subtle hover:border-border-strong transition-all"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-blue text-white
                hover:bg-accent-blue/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {tc("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────

function EditManagerModal({
  manager,
  roles,
  onClose,
  onSuccess,
}: {
  manager: AdminUser;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("AdminManagers");
  const tc = useTranslations("Common");
  const [apiError, setApiError] = useState<string | null>(null);

  const fieldError = (message?: string) => (message ? t(message as "err_email") : null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManagerUpdateFormData>({
    resolver: zodResolver(managerUpdateSchema) as never,
    defaultValues: {
      name: manager.user.name,
      email: manager.user.email,
      role_id: manager.role_id,
      is_active: manager.is_active,
    },
  });

  const onSubmit = async (data: ManagerUpdateFormData) => {
    setApiError(null);
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role_id: data.role_id,
        is_active: data.is_active,
      };
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }
      await updateManager(manager.id, payload as Parameters<typeof updateManager>[1]);
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.message || t("update_failed"));
      } else {
        setApiError(tc("generic_error"));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-primary-text">
            {t("edit_manager")}
          </h2>
          <button onClick={onClose} className="text-secondary-text hover:text-primary-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-sm text-semantic-error">
              {apiError}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("col_name")}
            </label>
            <input
              {...register("name")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            />
            {errors.name && (
              <p className="text-xs text-semantic-error">{fieldError(errors.name.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("col_email")}
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            />
            {errors.email && (
              <p className="text-xs text-semantic-error">{fieldError(errors.email.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("field_new_password")} <span className="text-disabled-text">({tc("optional")})</span>
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder={t("password_keep_hint")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all placeholder-disabled-text"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-text">
              {t("col_role")}
            </label>
            <select
              {...register("role_id")}
              className="w-full h-10 px-4 rounded-lg bg-midnight text-sm text-primary-text border border-border-subtle
                focus:border-accent-blue outline-none transition-all"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="w-4 h-4 rounded border-border-subtle bg-midnight text-accent-blue
                focus:ring-accent-blue focus:ring-offset-0"
            />
            <label htmlFor="is_active" className="text-sm text-secondary-text">
              {t("status_active")}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-text hover:text-primary-text
                border border-border-subtle hover:border-border-strong transition-all"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-blue text-white
                hover:bg-accent-blue/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {tc("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
