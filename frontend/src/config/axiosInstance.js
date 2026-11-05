
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      '/auth/register/',
      '/auth/login/',
      '/auth/verify-otp/',
      '/auth/resend-otp/',
      '/auth/forgot-password/',
      '/auth/reset-password/',
      '/auth/artisan/login/',
      '/auth/admin/login/',
      '/artisans/register/',
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const accessToken = localStorage.getItem('access');

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
