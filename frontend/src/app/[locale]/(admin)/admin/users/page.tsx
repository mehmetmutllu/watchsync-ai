"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { getAdminUsers, updateUserStatus } from "@/lib/admin-api";
import type { AdminUserDetail, PaginatedResponse } from "@/types/admin";

type UserRow = AdminUserDetail["user"];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
      });
      const data = res.data as PaginatedResponse<UserRow>;
      setUsers(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusToggle = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-secondary-text mt-1">{total} kayıtlı kullanıcı</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text placeholder:text-secondary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-primary-text text-sm"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p>Kullanıcı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-secondary-text">
                  <th className="text-left px-5 py-3 font-medium">Kullanıcı</th>
                  <th className="text-left px-5 py-3 font-medium">Bayi</th>
                  <th className="text-center px-5 py-3 font-medium">Saatler</th>
                  <th className="text-center px-5 py-3 font-medium">Durum</th>
                  <th className="text-left px-5 py-3 font-medium">Kayıt</th>
                  <th className="text-right px-5 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border-subtle/50 hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-primary-text">{user.name}</p>
                        <p className="text-xs text-secondary-text">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-secondary-text">
                      {user.dealer?.company_name || "-"}
                    </td>
                    <td className="px-5 py-3 text-center text-secondary-text">
                      {user.watches_count ?? 0}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.dealer?.status === "active"
                          ? "bg-semantic-success/10 text-semantic-success"
                          : "bg-semantic-error/10 text-semantic-error"
                      }`}>
                        {user.dealer?.status === "active" ? "Aktif" : "Askıda"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-secondary-text text-xs">
                      {new Date(user.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="p-1.5 rounded-lg hover:bg-accent-blue/10 text-secondary-text hover:text-accent-blue transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user.id, user.dealer?.status || "active")}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.dealer?.status === "active"
                              ? "hover:bg-semantic-error/10 text-secondary-text hover:text-semantic-error"
                              : "hover:bg-semantic-success/10 text-secondary-text hover:text-semantic-success"
                          }`}
                          title={user.dealer?.status === "active" ? "Askıya Al" : "Aktif Et"}
                        >
                          {user.dealer?.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text hover:text-primary-text disabled:opacity-40 transition-colors"
          >
            Önceki
          </button>
          <span className="text-sm text-secondary-text">
            {page} / {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-lg bg-surface-elevated text-sm text-secondary-text hover:text-primary-text disabled:opacity-40 transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
