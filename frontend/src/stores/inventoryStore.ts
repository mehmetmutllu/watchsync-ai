import { create } from 'zustand';
import { watchesApi } from '@/lib/watches-api';
import type {
  Watch,
  WatchFormData,
  WatchListParams,
  WatchStatus,
  PaginatedResponse,
} from '@/types';

interface InventoryState {
  watches: Watch[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: WatchListParams;
  isLoading: boolean;
  error: string | null;
  selectedWatch: Watch | null;
  isDetailLoading: boolean;

  // Actions
  fetchWatches: (params?: WatchListParams) => Promise<void>;
  setFilters: (filters: Partial<WatchListParams>) => void;
  fetchWatch: (id: number) => Promise<Watch>;
  createWatch: (data: WatchFormData) => Promise<Watch>;
  updateWatch: (id: number, data: Partial<WatchFormData>) => Promise<Watch>;
  deleteWatch: (id: number) => Promise<void>;
  updateWatchStatus: (id: number, status: WatchStatus, notes?: string) => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  watches: [],
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  },
  filters: {},
  isLoading: false,
  error: null,
  selectedWatch: null,
  isDetailLoading: false,

  fetchWatches: async (params?: WatchListParams) => {
    set({ isLoading: true, error: null });
    try {
      const mergedParams = { ...get().filters, ...params };
      const response: PaginatedResponse<Watch> = await watchesApi.list(mergedParams);
      set({
        watches: response.data,
        pagination: {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        },
        filters: mergedParams,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_load_watches';
      set({ error: message, isLoading: false });
    }
  },

  setFilters: (filters: Partial<WatchListParams>) => {
    const current = get().filters;
    const newFilters = { ...current, ...filters, page: 1 };
    set({ filters: newFilters });
    get().fetchWatches(newFilters);
  },

  fetchWatch: async (id: number) => {
    set({ isDetailLoading: true, error: null });
    try {
      const watch = await watchesApi.get(id);
      set({ selectedWatch: watch, isDetailLoading: false });
      return watch;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_load_watch';
      set({ error: message, isDetailLoading: false });
      throw err;
    }
  },

  createWatch: async (data: WatchFormData) => {
    set({ error: null });
    try {
      const watch = await watchesApi.create(data);
      // Optimistic: listeyi yenile
      get().fetchWatches();
      return watch;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_create_watch';
      set({ error: message });
      throw err;
    }
  },

  updateWatch: async (id: number, data: Partial<WatchFormData>) => {
    set({ error: null });
    try {
      const updated = await watchesApi.update(id, data);
      // Optimistic update — listedeki saati güncelle
      set((state) => ({
        watches: state.watches.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        selectedWatch: state.selectedWatch?.id === id ? updated : state.selectedWatch,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_update_watch';
      set({ error: message });
      throw err;
    }
  },

  deleteWatch: async (id: number) => {
    set({ error: null });
    try {
      // Optimistic delete
      set((state) => ({
        watches: state.watches.filter((w) => w.id !== id),
        pagination: { ...state.pagination, total: state.pagination.total - 1 },
      }));

      await watchesApi.delete(id);
    } catch (err: unknown) {
      // Rollback on error
      get().fetchWatches();
      const message = err instanceof Error ? err.message : 'error_delete_watch';
      set({ error: message });
      throw err;
    }
  },

  updateWatchStatus: async (id: number, status: WatchStatus, notes?: string) => {
    set({ error: null });
    try {
      const updated = await watchesApi.updateStatus(id, status, notes);
      set((state) => ({
        watches: state.watches.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        selectedWatch: state.selectedWatch?.id === id ? updated : state.selectedWatch,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error_update_status';
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
