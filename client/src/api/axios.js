import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1',
  withCredentials: true, // Important for cookies
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, user must log in again
        // Could dispatch an event or redirect to login here
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
