export interface User {
  id: number;
  dealer_id: number;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  created_at: string;
  updated_at: string;
  dealer: Dealer;
}

export interface Dealer {
  id: number;
  name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  tax_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  website: string | null;
  notification_preferences: Record<string, boolean> | null;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_inventory_value: number;
  active_watches: number;
  sold_this_month: number;
  pending_syncs: number;
  sync_success_rate: number;
}

export interface RecentActivity {
  id: number;
  message: string;
  status: 'success' | 'failed' | 'pending';
  time: string;
  timestamp?: string;
}

export interface ActivityFeedResponse {
  activities: RecentActivity[];
  has_more: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_activities: RecentActivity[];
}

// ─── Watch Types ───────────────────────────────────────────

export type WatchCondition = 'new' | 'unworn' | 'very_good' | 'good' | 'fair';
export type WatchStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'maintenance';

export interface WatchImage {
  id: number;
  watch_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  url?: string;
  thumb_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WatchFeatures {
  case_material?: string;
  bracelet_material?: string;
  dial_color?: string;
  movement?: string;
  case_diameter?: string;
  water_resistance?: string;
  power_reserve?: string;
  scope_of_delivery?: string;
}

export interface Watch {
  id: number;
  dealer_id: number;
  brand: string;
  model: string;
  reference_number: string | null;
  year: number | null;
  condition: WatchCondition;
  status: WatchStatus;
  cost_price: string | null;
  sale_price: string | null;
  currency: string;
  features: WatchFeatures | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  images?: WatchImage[];
  thumbnail_url?: string | null;
  primary_image_url?: string | null;
  allowed_transitions?: WatchStatus[];
  sync_statuses?: PlatformSyncStatus[];
}

export interface WatchFormData {
  brand: string;
  model: string;
  reference_number?: string;
  year?: number;
  condition: WatchCondition;
  status?: WatchStatus;
  cost_price?: number;
  sale_price?: number;
  currency?: string;
  features?: WatchFeatures;
  description?: string;
}

export interface WatchListParams {
  page?: number;
  per_page?: number;
  status?: WatchStatus;
  brand?: string;
  condition?: WatchCondition;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

// ─── Platform Types ────────────────────────────────────────

export type PlatformStatus = 'connected' | 'disconnected' | 'error';

export interface PlatformInfo {
  id: number;
  name: string;
  api_url: string | null;
  status: PlatformStatus;
  last_synced_at: string | null;
  token_expires_at: string | null;
  has_api_key: boolean;
  has_access_token: boolean;
  settings: Record<string, unknown>;
}

export interface PlatformCredentials {
  api_key?: string;
  api_secret?: string;
  settings?: Record<string, unknown>;
}

// ─── Sync Status Types ─────────────────────────────────────

export type SyncStatus = 'success' | 'failed' | 'pending' | 'never';

export interface PlatformSyncStatus {
  platform_id: number;
  platform_name: string;
  connected: boolean;
  sync_status: SyncStatus;
  last_synced_at?: string | null;
  error_message?: string | null;
}

// ─── Notification Types ────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
  watch_id?: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
}

// ─── Bulk Publish Types ────────────────────────────────────

export interface BulkPublishResponse {
  message: string;
  queued: number;
  skipped: number;
  total: number;
  batch_id: string;
}

export interface BulkPublishStatusResponse {
  completed: boolean;
  progress: number;
  success: number;
  failed: number;
  pending: number;
  total: number;
}

// ─── AI Pipeline Types ─────────────────────────────────────

export type AiStepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface AiPipelineStatus {
  validation_status: AiStepStatus;
  validation_result: {
    is_watch?: boolean;
    confidence?: number;
    message?: string;
    error?: string;
  } | null;
  background_status: AiStepStatus;
  enhanced_images: Array<{
    preset: string;
    url: string | null;
  }>;
  original_url: string | null;
  description_status: AiStepStatus;
  ai_descriptions: Record<string, string>;
  ai_condition?: string | null;
  ai_findings?: string[];
  selected_variant: string | null;
  started_at: string;
}
