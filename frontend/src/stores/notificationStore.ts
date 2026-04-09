import { create } from 'zustand';
import { platformsApi } from '@/lib/platforms-api';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isDrawerOpen: boolean;

  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDrawerOpen: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await platformsApi.getNotifications(20);
      set({
        notifications: data.notifications,
        unreadCount: data.unread_count,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAllRead: async () => {
    try {
      await platformsApi.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silent fail
    }
  },

  markRead: async (id: number) => {
    try {
      await platformsApi.markNotificationRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silent fail
    }
  },

  toggleDrawer: () => {
    const wasOpen = get().isDrawerOpen;
    set({ isDrawerOpen: !wasOpen });
    if (!wasOpen) {
      // Drawer açıldığında bildirimleri yenile
      get().fetchNotifications();
    }
  },

  closeDrawer: () => set({ isDrawerOpen: false }),
}));
