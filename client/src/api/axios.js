import axios from 'axios';

/**
 * API base URL:
 * - VITE_API_URL if set
 * - Relative `/api/v1` by default (Vite proxy in dev, nginx in production)
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

let csrfReady;

/** Ensure CSRF double-submit cookie exists (call once on app boot). */
export async function ensureCsrf() {
  if (csrfReady) return csrfReady;
  csrfReady = axios
    .get(`${API_BASE}/auth/csrf`, { withCredentials: true })
    .then(() => true)
    .catch(() => {
      csrfReady = null;
      return false;
    });
  return csrfReady;
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    await ensureCsrf();
    const token = readCookie('csrfToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest?.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register') || url.includes('/auth/activate')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        await ensureCsrf();
        const token = readCookie('csrfToken');
        await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: token ? { 'X-CSRF-Token': token } : {},
          }
        );
        return api(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event('clinova:auth-expired'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
