import api from './api';

// ─── Types ──────────────────────────────────────────────

export interface Invoice {
  id: number;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  notes: string | null;
  company_name: string | null;
  company_address: string | null;
  tax_id: string | null;
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    company: string | null;
  } | null;
  items?: InvoiceItem[];
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
  watch?: {
    id: number;
    brand: string;
    model_name: string;
    reference_number: string;
  } | null;
}

export interface CreateInvoiceParams {
  customer_id?: number | null;
  issue_date: string;
  due_date?: string;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  company_name?: string;
  company_address?: string;
  tax_id?: string;
  items: {
    watch_id?: number | null;
    description: string;
    quantity?: number;
    unit_price: number;
  }[];
}

// ─── API Functions ──────────────────────────────────────

export async function getInvoices(params?: { status?: string; page?: number }) {
  const { data } = await api.get('/invoices', { params });
  return data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const { data } = await api.get(`/invoices/${id}`);
  return data.data;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
  const { data } = await api.post('/invoices', params);
  return data.data;
}

export async function updateInvoice(id: number, params: Partial<CreateInvoiceParams> & { status?: string }): Promise<Invoice> {
  const { data } = await api.put(`/invoices/${id}`, params);
  return data.data;
}

export async function deleteInvoice(id: number): Promise<void> {
  await api.delete(`/invoices/${id}`);
}

export async function downloadInvoicePdf(id: number, filename: string): Promise<void> {
  const response = await api.get(`/invoices/${id}/pdf`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
}

export async function sendInvoice(id: number): Promise<{ message: string }> {
  const { data } = await api.post(`/invoices/${id}/send`);
  return data;
}
