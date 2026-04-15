import api from './api';

// --- eBay Browse API Test ---

export interface EbayTestResult {
  status: 'ok' | 'not_configured' | 'auth_failed' | 'connection_error' | 'browse_api_error';
  message: string;
  environment: string;
  total_results?: number;
  test_reference?: string;
  sample_items?: Array<{
    title: string;
    price: string;
    condition: string;
    url: string;
  }>;
}

export async function testEbayConnection(ref = '126610LN'): Promise<EbayTestResult> {
  const { data } = await api.get('/market/ebay-test', { params: { ref } });
  return data;
}

// --- AI Text Generation ---

export interface GenerateDescriptionParams {
  watch_id?: number;
  brand?: string;
  model?: string;
  reference_number?: string;
  year?: number;
  condition?: string;
  case_material?: string;
  case_diameter?: number;
  movement?: string;
  dial_color?: string;
  bracelet_material?: string;
  scope_of_delivery?: string;
  price?: number;
  notes?: string;
  language?: 'en' | 'de' | 'tr';
  tone?: 'professional' | 'luxury' | 'casual' | 'technical';
}

export interface GenerateDescriptionResult {
  description: string;
  language: string;
  tone: string;
  model: string;
}

export async function generateDescription(params: GenerateDescriptionParams): Promise<GenerateDescriptionResult> {
  // Use watch-specific endpoint if watch_id is available (auto-fills specs from DB)
  if (params.watch_id) {
    const { data } = await api.post(
      `/watches/${params.watch_id}/generate-description`,
      { language: params.language || 'en' },
      { timeout: 60_000 }
    );
    return data.data;
  }

  // Fallback: generic endpoint with manual params
  const { data } = await api.post('/ai/generate-description', {
    reference_number: params.reference_number,
    brand: params.brand,
    model_name: params.model,
    language: params.language || 'en',
    specs: {
      year: params.year?.toString(),
      condition: params.condition,
      case_material: params.case_material,
      movement: params.movement,
      dial_color: params.dial_color,
      case_size: params.case_diameter?.toString(),
    },
  }, { timeout: 60_000 });
  return data.data;
}

// --- Market Scanner ---

export interface PriceTimeSeriesPoint {
  date: string;
  avg_price: number;
  count: number;
}

export interface PriceStats {
  reference_number: string;
  period: string;
  count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  trend: 'up' | 'down' | 'stable';
  time_series: PriceTimeSeriesPoint[];
}

export interface CompetitorListing {
  id?: number;
  platform: string;
  price: number;
  currency: string;
  condition: string | null;
  seller_name: string | null;
  seller_country: string | null;
  source_url: string | null;
  updated_at: string;
}

export async function getMarketPrices(
  reference: string,
  period = '30d',
): Promise<PriceStats> {
  const { data } = await api.get(`/market/prices/${encodeURIComponent(reference)}`, {
    params: { period },
  });

  const raw = data.data;

  return {
    reference_number: raw.reference_number,
    period: raw.period,
    avg_price: raw.avg_price ?? 0,
    min_price: raw.min_price ?? 0,
    max_price: raw.max_price ?? 0,
    count: raw.total_listings ?? 0,
    trend: raw.trend ?? 'stable',
    time_series: (raw.history ?? []).map((p: { date: string; price: number }) => ({
      date: p.date,
      avg_price: p.price,
      count: 1,
    })),
  };
}

export async function getCompetitorListings(
  reference: string,
): Promise<CompetitorListing[]> {
  const { data } = await api.get(`/market/competitors/${encodeURIComponent(reference)}`);

  return (data.data ?? []).map((item: Record<string, unknown>) => ({
    id: item.id,
    platform: (item.source as string) ?? 'unknown',
    price: item.price as number,
    currency: (item.currency as string) ?? 'EUR',
    condition: (item.condition as string) ?? null,
    seller_name: (item.seller as string) ?? null,
    seller_country: (item.country as string) ?? null,
    source_url: (item.url as string) ?? null,
    updated_at: (item.date as string) ?? new Date().toISOString(),
  }));
}

export async function scanMarket(reference: string): Promise<void> {
  await api.post('/market/scan', { reference_number: reference });
}

// --- WatchCharts Trend ---

export interface WatchChartsTrendPoint {
  date: string;
  price: number;
}

export interface WatchChartsTrend {
  fair_market_value: number;
  currency: string;
  price_change_pct: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  data_points: WatchChartsTrendPoint[];
  source: string;
  updated_at: string;
}

export async function getWatchChartsTrend(
  reference: string,
  period = '1y',
): Promise<WatchChartsTrend | null> {
  const { data } = await api.get(
    `/market/watchcharts-trend/${encodeURIComponent(reference)}`,
    { params: { period } },
  );
  return data.data ?? null;
}

// --- Price Alerts ---

export interface PriceAlert {
  id: number;
  reference_number: string;
  target_price: number;
  direction: 'below' | 'above';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

export interface CreatePriceAlertParams {
  reference_number: string;
  target_price: number;
  direction: 'below' | 'above';
}

export async function getPriceAlerts(): Promise<PriceAlert[]> {
  const { data } = await api.get('/price-alerts');
  return data.data ?? [];
}

export async function createPriceAlert(
  params: CreatePriceAlertParams,
): Promise<PriceAlert> {
  const { data } = await api.post('/price-alerts', params);
  return data.data;
}

export async function deletePriceAlert(id: number): Promise<void> {
  await api.delete(`/price-alerts/${id}`);
}
