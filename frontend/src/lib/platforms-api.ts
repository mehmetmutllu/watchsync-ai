import api from '@/lib/api';
import type { PlatformInfo, PlatformCredentials, PlatformSyncStatus, BulkPublishResponse, BulkPublishStatusResponse, NotificationResponse } from '@/types';

export const platformsApi = {
  /**
   * Tüm platformları ve bağlantı durumlarını getirir.
   */
  list: async (): Promise<PlatformInfo[]> => {
    const { data } = await api.get('/platforms');
    return data.platforms;
  },

  /**
   * Platform API key/secret günceller.
   */
  updateCredentials: async (
    platformId: number,
    credentials: PlatformCredentials
  ): Promise<void> => {
    await api.put(`/platforms/${platformId}/credentials`, credentials);
  },

  /**
   * Platform bağlantısını kopar.
   */
  disconnect: async (platformId: number): Promise<void> => {
    await api.post(`/platforms/${platformId}/disconnect`);
  },

  /**
   * eBay OAuth URL'i alır.
   */
  getEbayAuthUrl: async (): Promise<string> => {
    const { data } = await api.get('/ebay/auth-url');
    return data.auth_url;
  },

  /**
   * eBay bağlantısını kopar.
   */
  disconnectEbay: async (): Promise<void> => {
    await api.post('/ebay/disconnect');
  },

  /**
   * Saat için platform senkronizasyonunu toggle eder.
   */
  toggleSync: async (
    watchId: number,
    platformId: number,
    enabled: boolean
  ): Promise<{ sync_status: string }> => {
    const { data } = await api.post(
      `/watches/${watchId}/platforms/${platformId}/toggle`,
      { enabled }
    );
    return data;
  },

  /**
   * Tek bir saatin platform senkronizasyon durumlarını getirir.
   */
  getSyncStatus: async (watchId: number): Promise<PlatformSyncStatus[]> => {
    const { data } = await api.get(`/watches/${watchId}/sync-status`);
    return data.sync_statuses;
  },

  /**
   * Toplu yayınlama — birden fazla saati belirli platforma yayınlar.
   */
  bulkPublish: async (
    watchIds: number[],
    platformId: number
  ): Promise<BulkPublishResponse> => {
    const { data } = await api.post('/watches/bulk-publish', {
      watch_ids: watchIds,
      platform_id: platformId,
    });
    return data;
  },

  /**
   * Toplu yayınlama ilerleme durumu (polling).
   */
  getBulkPublishStatus: async (
    batchId: string
  ): Promise<BulkPublishStatusResponse> => {
    const { data } = await api.get(`/watches/bulk-publish/${batchId}/status`);
    return data;
  },

  /**
   * Bildirimleri getirir.
   */
  getNotifications: async (limit = 20): Promise<NotificationResponse> => {
    const { data } = await api.get('/notifications', { params: { limit } });
    return data;
  },

  /**
   * Tüm bildirimleri okundu olarak işaretler.
   */
  markAllNotificationsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  /**
   * Tek bir bildirimi okundu olarak işaretler.
   */
  markNotificationRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  /**
   * Platform bağlantısını test eder (credential doğrulama).
   */
  testConnection: async (platformId: number): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post(`/platforms/${platformId}/test-connection`);
    return data;
  },
};
