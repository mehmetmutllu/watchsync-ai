import api from '@/lib/api';
import type {
  Watch,
  WatchFormData,
  WatchImage,
  WatchListParams,
  WatchStatus,
  PaginatedResponse,
} from '@/types';

export const watchesApi = {
  /**
   * Saatleri listeler — sayfalama + filtreleme + sıralama
   */
  list: async (params?: WatchListParams): Promise<PaginatedResponse<Watch>> => {
    const { data } = await api.get('/watches', { params });
    return data;
  },

  /**
   * Saat detayı
   */
  get: async (id: number): Promise<Watch> => {
    const { data } = await api.get(`/watches/${id}`);
    return data.watch;
  },

  /**
   * Yeni saat oluşturma
   */
  create: async (formData: WatchFormData): Promise<Watch> => {
    const { data } = await api.post('/watches', formData);
    return data.watch;
  },

  /**
   * Saat güncelleme
   */
  update: async (id: number, formData: Partial<WatchFormData>): Promise<Watch> => {
    const { data } = await api.put(`/watches/${id}`, formData);
    return data.watch;
  },

  /**
   * Saat silme
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/watches/${id}`);
  },

  /**
   * Durum güncelleme (state machine)
   */
  updateStatus: async (
    id: number,
    status: WatchStatus,
    notes?: string
  ): Promise<Watch> => {
    const { data } = await api.patch(`/watches/${id}/status`, { status, notes });
    return data.watch;
  },

  /**
   * Görsel yükleme
   */
  uploadImages: async (
    watchId: number,
    files: File[],
    isPrimary?: boolean
  ): Promise<WatchImage[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));
    if (isPrimary) formData.append('is_primary', '1');

    const { data } = await api.post(`/watches/${watchId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.images;
  },

  /**
   * Görsel silme
   */
  deleteImage: async (watchId: number, imageId: number): Promise<void> => {
    await api.delete(`/watches/${watchId}/images/${imageId}`);
  },
};
