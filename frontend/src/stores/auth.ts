import { create } from 'zustand';
import api, { getCsrfCookie } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; password_confirmation: string; company_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    // Cookie-based auth: sadece /auth/me çağır — cookie otomatik gönderilir
    get().fetchUser();
  },

  login: async (email, password) => {
    await getCsrfCookie();
    const { data } = await api.post('/auth/login', { email, password });
    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (formData) => {
    await getCsrfCookie();
    const { data } = await api.post('/auth/register', formData);
    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Session might already be invalid
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
