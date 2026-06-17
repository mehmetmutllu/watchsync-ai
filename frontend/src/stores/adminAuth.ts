import { create } from 'zustand';
import { adminLogin, adminLogout, adminMe } from '@/lib/admin-api';
import type { User } from '@/types';
import type { Role } from '@/types/admin';

interface AdminAuthState {
  user: User | null;
  adminRole: Role | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchAdminUser: () => Promise<void>;
  hydrate: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  adminRole: null,
  permissions: [],
  isLoading: true,
  isAuthenticated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    get().fetchAdminUser();
  },

  login: async (email, password) => {
    const { data } = await adminLogin(email, password);
    set({
      user: data.user,
      adminRole: data.admin.role,
      permissions: data.admin.role.permissions ?? [],
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await adminLogout();
    } catch {
      // Session might already be invalid
    }
    set({
      user: null,
      adminRole: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchAdminUser: async () => {
    try {
      const { data } = await adminMe();
      set({
        user: data.user,
        adminRole: data.admin.role,
        permissions: data.admin.permissions ?? [],
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        adminRole: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  hasPermission: (permission: string) => {
    const state = get();
    if (!state.isAuthenticated) return false;
    if (state.adminRole?.slug === 'super_admin') return true;
    return state.permissions.includes(permission);
  },
}));
