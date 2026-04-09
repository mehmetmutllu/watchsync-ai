import api from './api';

// ─── Types ─────────────────────────────────────────────────

export interface UpdateProfileParams {
  name: string;
  email: string;
}

export interface ChangePasswordParams {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateCompanyParams {
  company_name?: string | null;
  phone?: string | null;
  tax_number?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  website?: string | null;
}

export interface NotificationPreferences {
  invoice_emails: boolean;
  sync_alerts: boolean;
  stock_alerts: boolean;
  weekly_report: boolean;
}

// ─── API Functions ─────────────────────────────────────────

export const settingsApi = {
  updateProfile: async (params: UpdateProfileParams) => {
    const { data } = await api.put('/settings/profile', params);
    return data;
  },

  changePassword: async (params: ChangePasswordParams) => {
    const { data } = await api.put('/settings/password', params);
    return data;
  },

  updateCompany: async (params: UpdateCompanyParams) => {
    const { data } = await api.put('/settings/company', params);
    return data;
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get('/settings/notifications');
    return data.preferences;
  },

  updateNotificationPreferences: async (params: NotificationPreferences) => {
    const { data } = await api.put('/settings/notifications', params);
    return data;
  },
};
