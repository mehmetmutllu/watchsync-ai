import { create } from 'zustand';
import { platformsApi } from '@/lib/platforms-api';
import type { PlatformInfo, PlatformCredentials } from '@/types';

interface PlatformState {
  platforms: PlatformInfo[];
  isLoading: boolean;
  error: string | null;

  fetchPlatforms: () => Promise<void>;
  updateCredentials: (platformId: number, credentials: PlatformCredentials) => Promise<void>;
  disconnectPlatform: (platformId: number) => Promise<void>;
  clearError: () => void;
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  platforms: [],
  isLoading: false,
  error: null,

  fetchPlatforms: async () => {
    set({ isLoading: true, error: null });
    try {
      const platforms = await platformsApi.list();
      set({ platforms, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_load_platforms';
      set({ error: message, isLoading: false });
    }
  },

  updateCredentials: async (platformId: number, credentials: PlatformCredentials) => {
    set({ error: null });
    try {
      await platformsApi.updateCredentials(platformId, credentials);
      // Platformları yenile
      await get().fetchPlatforms();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_update_credentials';
      set({ error: message });
      throw err;
    }
  },

  disconnectPlatform: async (platformId: number) => {
    set({ error: null });
    try {
      await platformsApi.disconnect(platformId);
      // Optimistic update
      set((state) => ({
        platforms: state.platforms.map((p) =>
          p.id === platformId ? { ...p, status: 'disconnected' as const } : p
        ),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_disconnect_platform';
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
