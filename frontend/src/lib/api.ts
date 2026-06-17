import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Explicitly read XSRF-TOKEN cookie and set header on every mutating request
api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (match) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
    }
  }
  return config;
});

/**
 * Sanctum CSRF cookie al — login/register'dan önce çağrılmalı.
 */
export async function getCsrfCookie(): Promise<void> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
  // Strip /api suffix for the csrf-cookie endpoint
  const origin = baseURL.replace(/\/api\/?$/, '');
  await axios.get(`${origin}/sanctum/csrf-cookie`, { withCredentials: true });
}

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Admin sayfalarında admin login'e, diğerlerinde normal login'e yönlendir
      if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      } else if (!path.startsWith('/login') && !path.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Feedback (Kullanıcı) ───────────────────────────────────

export async function submitFeedback(data: {
  category: string;
  subject: string;
  message: string;
  name?: string;
  email?: string;
}) {
  return api.post('/feedbacks', data);
}

export async function getMyFeedbacks(page?: number) {
  return api.get('/feedbacks/mine', { params: { page } });
}

// ─── Sözleşmeler (Kullanıcı) ────────────────────────────────

export async function getActiveContracts() {
  return api.get('/contracts/active');
}

export async function getContractBySlug(slug: string) {
  return api.get(`/contracts/${slug}`);
}

export async function acceptContract(id: number) {
  return api.post(`/contracts/${id}/accept`);
}

export async function getPendingContracts() {
  return api.get('/contracts/pending');
}
