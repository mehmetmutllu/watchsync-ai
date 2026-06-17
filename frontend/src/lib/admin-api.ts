import api, { getCsrfCookie } from '@/lib/api';
import type {
  AdminDashboardStats,
  AdminUser,
  AdminActivity,
  AdminWatch,
  AdminUserDetail,
  RevenueChartItem,
  RevenueReport,
  CommissionReport,
  Feedback,
  FeedbackStats,
  Contract,
  ContractAcceptance,
  PaginatedResponse,
  SystemHealth,
  Role,
  UserGrowthItem,
} from '@/types/admin';

// ─── Admin Auth ────────────────────────────────────────────

export async function adminLogin(email: string, password: string) {
  await getCsrfCookie();
  return api.post('/admin/auth/login', { email, password });
}

export async function adminLogout() {
  return api.post('/admin/auth/logout');
}

export async function adminMe() {
  return api.get('/admin/auth/me');
}

// ─── Admin Dashboard ───────────────────────────────────────

export async function getAdminDashboardStats() {
  return api.get<{ stats: AdminDashboardStats }>('/admin/dashboard/stats');
}

export async function getRevenueChart() {
  return api.get<{ chart: RevenueChartItem[] }>('/admin/dashboard/revenue-chart');
}

export async function getRecentAdminActivities() {
  return api.get<{ activities: AdminActivity[] }>('/admin/dashboard/recent-activities');
}

export async function getUserGrowth() {
  return api.get<{ chart: UserGrowthItem[] }>('/admin/dashboard/user-growth');
}

// ─── Manager CRUD ──────────────────────────────────────────

export async function getManagers(params?: {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
}) {
  return api.get<{
    data: AdminUser[];
    current_page: number;
    last_page: number;
    total: number;
  }>('/admin/managers', { params });
}

export async function createManager(data: {
  name: string;
  email: string;
  password: string;
  role_id: number;
}) {
  return api.post<{ message: string; manager: AdminUser }>('/admin/managers', data);
}

export async function updateManager(
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role_id?: number;
    is_active?: boolean;
  }
) {
  return api.put<{ message: string; manager: AdminUser }>(`/admin/managers/${id}`, data);
}

export async function deleteManager(id: number) {
  return api.delete<{ message: string }>(`/admin/managers/${id}`);
}

// ─── Roles ─────────────────────────────────────────────────

export async function getRoles() {
  return api.get<{ roles: Role[] }>('/admin/roles');
}

// ─── C: Kullanıcı Yönetimi ─────────────────────────────────

export async function getAdminUsers(params?: {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
}) {
  return api.get<PaginatedResponse<AdminUserDetail['user']>>('/admin/users', { params });
}

export async function getAdminUser(id: number) {
  return api.get<AdminUserDetail>(`/admin/users/${id}`);
}

export async function updateUserStatus(id: number, status: 'active' | 'suspended') {
  return api.put<{ message: string }>(`/admin/users/${id}/status`, { status });
}

export async function resetUserPassword(id: number) {
  return api.post<{ message: string }>(`/admin/users/${id}/reset-password`);
}

export async function deleteAdminUser(id: number) {
  return api.delete<{ message: string }>(`/admin/users/${id}`);
}

export async function getAdminUserWatches(id: number) {
  return api.get<PaginatedResponse<AdminWatch>>(`/admin/users/${id}/watches`);
}

// ─── D: Saat Doğrulama ──────────────────────────────────────

export async function getAdminWatches(params?: {
  search?: string;
  validation_status?: string;
  status?: string;
  dealer_id?: number;
  page?: number;
}) {
  return api.get<PaginatedResponse<AdminWatch>>('/admin/watches', { params });
}

export async function getAdminFlaggedWatches(page?: number) {
  return api.get<PaginatedResponse<AdminWatch>>('/admin/watches/flagged', { params: { page } });
}

export async function getAdminWatch(id: number) {
  return api.get<{ watch: AdminWatch }>(`/admin/watches/${id}`);
}

export async function validateWatch(id: number, data: { validation_status: 'validated' | 'rejected'; reason?: string }) {
  return api.put<{ message: string; watch: AdminWatch }>(`/admin/watches/${id}/validate`, data);
}

// ─── E: Gelir Raporları ─────────────────────────────────────

export async function getRevenueReport(params?: { from?: string; to?: string; dealer_id?: number; page?: number }) {
  return api.get<{ invoices: unknown; total_revenue: number }>('/admin/reports/revenue', { params });
}

export async function getCommissionReport() {
  return api.get<CommissionReport>('/admin/reports/commissions');
}

export async function exportReport(type: 'revenue' | 'watches' | 'users', params?: { from?: string; to?: string }) {
  return api.get('/admin/reports/export', {
    params: { type, ...params },
    responseType: 'blob',
  });
}

// ─── F: Feedback Yönetimi ────────────────────────────────────

export async function getAdminFeedbacks(params?: {
  category?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  return api.get<PaginatedResponse<Feedback>>('/admin/feedbacks', { params });
}

export async function getAdminFeedback(id: number) {
  return api.get<{ feedback: Feedback }>(`/admin/feedbacks/${id}`);
}

export async function updateFeedback(id: number, data: { status?: string; admin_response?: string }) {
  return api.put<{ message: string; feedback: Feedback }>(`/admin/feedbacks/${id}`, data);
}

export async function getFeedbackStats() {
  return api.get<FeedbackStats>('/admin/feedbacks/stats');
}

// ─── G: Sözleşme Yönetimi ───────────────────────────────────

export async function getAdminContracts(page?: number) {
  return api.get<PaginatedResponse<Contract>>('/admin/contracts', { params: { page } });
}

export async function createContract(data: { type: string; title: string; content: string; version?: string }) {
  return api.post<{ message: string; contract: Contract }>('/admin/contracts', data);
}

export async function updateContract(id: number, data: { title?: string; content?: string; version?: string }) {
  return api.put<{ message: string; contract: Contract }>(`/admin/contracts/${id}`, data);
}

export async function publishContract(id: number) {
  return api.post<{ message: string; contract: Contract }>(`/admin/contracts/${id}/publish`);
}

export async function getContractAcceptances(id: number, page?: number) {
  return api.get<PaginatedResponse<ContractAcceptance>>(`/admin/contracts/${id}/acceptances`, { params: { page } });
}

// ─── H: Sistem Ayarları ──────────────────────────────────────

export async function getSystemSettings() {
  return api.get<{ settings: Record<string, string> }>('/admin/settings');
}

export async function updateSystemSettings(settings: Array<{ key: string; value: unknown }>) {
  return api.put<{ message: string }>('/admin/settings', { settings });
}

export async function getSystemHealth() {
  return api.get<SystemHealth>('/admin/system/health');
}
