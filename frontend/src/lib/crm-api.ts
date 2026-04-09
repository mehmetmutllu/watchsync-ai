import api from './api';

// ─── Types ──────────────────────────────────────────────

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  tags: string[] | null;
  notes_count?: number;
  invoices_count?: number;
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

export interface CreateCustomerParams {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tags?: string[];
}

// ─── API Functions ──────────────────────────────────────

export async function getCustomers(params?: { search?: string; tag?: string; page?: number }) {
  const { data } = await api.get('/customers', { params });
  return data;
}

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const { data } = await api.get(`/customers/${id}`);
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
