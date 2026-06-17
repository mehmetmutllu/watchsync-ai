import api from './api';
import type { Watch } from '@/types';

// ─── Types ──────────────────────────────────────────────

export interface CustomerMetadata {
  birthday?: string;
  favorite_color?: string;
  favorite_brand?: string;
  desired_watch?: string;
  owned_watches?: Array<{
    id: string;
    brand: string;
    model: string;
    purchase_price: number;
    purchase_date: string;
    current_value: number;
  }>;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  auto_send_birthday_mail: boolean;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  tags: string[] | null;
  metadata: CustomerMetadata | null;
  pipeline_stage?: string;
  notes_count?: number;
  invoices_count?: number;
  vip_tier?: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
  needs_follow_up?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerDetail extends Customer {
  notes: CustomerNote[];
  invoices: CustomerInvoiceSummary[];
}

export interface CustomerNote {
  id: number;
  content: string;
  user: { id: number; name: string };
  created_at: string;
}

export interface CustomerInvoiceSummary {
  id: number;
  invoice_number: string;
  status: string;
  total: string;
  currency: string;
  issue_date: string;
}

export interface TimelineEvent {
  id: string;
  type: 'note' | 'invoice';
  title: string;
  description: string;
  user_name: string;
  date: string;
}

export interface CreateCustomerParams {
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  auto_send_birthday_mail?: boolean;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tags?: string[];
  metadata?: CustomerMetadata;
  pipeline_stage?: string;
}

// ─── API Functions ──────────────────────────────────────

export interface CustomerStats {
  total_customers: number;
  birthdays_this_month: number;
  total_revenue: number;
}

export async function getCustomers(params?: { search?: string; tag?: string; page?: number; limit?: number }) {
  const { data } = await api.get('/customers', { params });
  return data;
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const { data } = await api.get('/customers/stats');
  return data;
}

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const { data } = await api.get(`/customers/${id}`);
  return data.data;
}

export async function getCustomerTimeline(id: number): Promise<TimelineEvent[]> {
  const { data } = await api.get(`/customers/${id}/timeline`);
  return data.data;
}

export async function createCustomer(params: CreateCustomerParams): Promise<Customer> {
  const { data } = await api.post('/customers', params);
  return data.data;
}

export async function updateCustomer(id: number, params: Partial<CreateCustomerParams>): Promise<Customer> {
  const { data } = await api.put(`/customers/${id}`, params);
  return data.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function addCustomerNote(customerId: number, content: string): Promise<CustomerNote> {
  const { data } = await api.post(`/customers/${customerId}/notes`, { content });
  return data.data;
}

export async function deleteCustomerNote(customerId: number, noteId: number): Promise<void> {
  await api.delete(`/customers/${customerId}/notes/${noteId}`);
}

export interface ArbitrageDeal {
  id: string;
  platform: string;
  title: string;
  price: number;
  estimated_market_value: number;
  margin: number;
  condition: string;
  location: string;
  url: string;
  data_source?: string;
}

export interface CustomerMatchesResponse {
  local_inventory: Watch[];
  arbitrage_deals: ArbitrageDeal[];
}

export async function getCustomerMatches(customerId: number): Promise<CustomerMatchesResponse> {
  const { data } = await api.get(`/customers/${customerId}/matches`);
  return data.data;
}

export async function generatePitch(customerId: number, watchId: number, language: string = 'en'): Promise<string> {
  const { data } = await api.post(`/customers/${customerId}/generate-pitch`, {
    watch_id: watchId,
    language,
  });
  return data.data.pitch;
}

export async function getUpcomingBirthdays(): Promise<Customer[]> {
  const { data } = await api.get('/customers/upcoming-birthdays');
  return data.data;
}

export async function generateBirthdayPitch(customerId: number, language: string = 'en', includeWatches: boolean = true) {
  const { data } = await api.post(`/customers/${customerId}/generate-birthday-pitch`, {
    language,
    include_watches: includeWatches
  });
  return data.data;
}
