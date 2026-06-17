// ─── Admin Types ───────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions?: string[];
}

export interface AdminUser {
  id: number;
  user_id: number;
  role_id: number;
  is_active: boolean;
  last_login_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    created_at: string;
  };
  role: Role;
  creator?: {
    id: number;
    name: string;
  } | null;
}

export interface AdminDashboardStats {
  total_dealers: number;
  active_dealers: number;
  total_users: number;
  new_users_this_month: number;
  total_watches: number;
  active_watches: number;
  sold_this_month: number;
  total_inventory_value: number;
  total_revenue: number;
  revenue_this_month: number;
}

export interface RevenueChartItem {
  month: string;
  label: string;
  revenue: number;
  sales: number;
}

export interface UserGrowthItem {
  month: string;
  label: string;
  new_users: number;
  new_dealers: number;
}

export interface AdminActivity {
  id: number;
  admin_name: string;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  time_ago: string;
}

export interface AdminAuthResponse {
  message: string;
  user: import('./index').User;
  admin: {
    id: number;
    role: Role;
  };
}

export interface AdminMeResponse {
  user: import('./index').User;
  admin: {
    id: number;
    role: Role;
    permissions: string[];
  };
}

// ─── C: Kullanıcı Yönetimi ─────────────────────────────────

export interface AdminUserDetail {
  user: import('./index').User & {
    watches_count: number;
    dealer: {
      id: number;
      name: string;
      company_name: string;
      status: string;
    } | null;
    watches?: Array<{
      id: number;
      brand: string;
      model: string;
      status: string;
      sale_price: number | null;
      images?: Array<{ id: number; url: string; is_primary: boolean }>;
    }>;
  };
  sales_count: number;
  total_sales_value: number;
}

// ─── D: Saat Doğrulama ──────────────────────────────────────

export interface AdminWatch {
  id: number;
  brand: string;
  model: string;
  reference_number: string | null;
  sale_price: number | null;
  status: string;
  validation_status: 'pending' | 'validated' | 'flagged' | 'rejected';
  validation_details: Record<string, unknown> | null;
  created_at: string;
  dealer?: {
    id: number;
    name: string;
    company_name: string;
  };
  images?: Array<{ id: number; url: string; is_primary: boolean }>;
}

// ─── E: Gelir Raporları ─────────────────────────────────────

export interface RevenueReport {
  invoices: PaginatedResponse<{
    id: number;
    invoice_number: string;
    total: number;
    status: string;
    updated_at: string;
    dealer?: { id: number; name: string; company_name: string };
  }>;
  total_revenue: number;
}

export interface CommissionReport {
  commissions: Array<{
    platform: string;
    successful_syncs: number;
    total_syncs: number;
    success_rate: number;
  }>;
}

// ─── F: Feedback ─────────────────────────────────────────────

export interface Feedback {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  category: 'bug' | 'suggestion' | 'complaint' | 'general';
  subject: string;
  message: string;
  status: 'new' | 'reviewing' | 'resolved' | 'rejected';
  admin_response: string | null;
  responded_by: number | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; email: string } | null;
  responder?: { id: number; name: string } | null;
}

export interface FeedbackStats {
  total: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
}

// ─── G: Sözleşme Yönetimi ───────────────────────────────────

export interface Contract {
  id: number;
  type: 'terms_of_service' | 'privacy_policy' | 'kvkk_gdpr' | 'cookie_policy';
  title: string;
  slug: string;
  content: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  acceptances_count?: number;
}

export interface ContractAcceptance {
  id: number;
  user_id: number;
  contract_id: number;
  version: string;
  ip_address: string;
  accepted_at: string;
  user?: { id: number; name: string; email: string };
}

// ─── H: Sistem Ayarları ──────────────────────────────────────

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  checks: Record<string, {
    status: 'ok' | 'error' | 'warning' | 'unknown';
    message?: string;
    used_percent?: number;
    failed_jobs?: number;
  }>;
}

// ─── Genel ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
