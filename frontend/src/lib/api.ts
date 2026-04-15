import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // httpOnly cookie auth
  withXSRFToken: true,   // Axios auto-sends XSRF-TOKEN cookie as header
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

/**
 * Sanctum CSRF cookie al — login/register'dan önce çağrılmalı.
 */
export async function getCsrfCookie(): Promise<void> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  // Strip /api suffix for the csrf-cookie endpoint
  const origin = baseURL.replace(/\/api\/?$/, '');
  await axios.get(`${origin}/sanctum/csrf-cookie`, { withCredentials: true });
}

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
