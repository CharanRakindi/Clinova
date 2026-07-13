import axios from 'axios';

/**
 * API base URL:
 * - VITE_API_URL if set
 * - Relative `/api/v1` by default (Vite proxy in dev, nginx in production)
 */
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest?.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
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
