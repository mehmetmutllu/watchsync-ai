import api from './api';

export interface AiEnhanceResult {
  original_url: string;
  rgba_url: string;
  results: AiBackgroundVariant[];
}

export interface AiBackgroundVariant {
  result_url: string;
  original_url: string;
  width: number;
  height: number;
}

export interface AiSegmentResult {
  mask_url: string;
  rgba_url: string;
  width: number;
  height: number;
}

export interface AiHealthResult {
  status: string;
  model_loaded: boolean;
}

export async function enhanceWatchImage(
  watchId: number,
  image: File,
  pointX = 0.5,
  pointY = 0.5,
): Promise<AiEnhanceResult> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('point_x', String(pointX));
  formData.append('point_y', String(pointY));

  const { data } = await api.post(`/watches/${watchId}/ai-enhance`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return data.data;
}

export async function segmentImage(
  image: File,
  pointX = 0.5,
  pointY = 0.5,
): Promise<AiSegmentResult> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('point_x', String(pointX));
  formData.append('point_y', String(pointY));

  const { data } = await api.post('/ai/segment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return data.data;
}

export async function replaceBackground(
  image: File,
  preset: string = 'white_studio',
  shadow = true,
  customBackground?: File,
): Promise<AiBackgroundVariant> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('preset', preset);
  formData.append('shadow', String(shadow));
  if (customBackground) {
    formData.append('custom_background', customBackground);
  }

  const { data } = await api.post('/ai/replace-background', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return data.data;
}

export async function getAiHealth(): Promise<AiHealthResult> {
  const { data } = await api.get('/ai/health');
  return data;
}
