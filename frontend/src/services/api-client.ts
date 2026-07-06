import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { API, ROUTES, HTTP_STATUS } from '@/config';

const apiClient = axios.create({
  baseURL: API.BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API.TIMEOUT,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      useAuthStore.getState().logout();
      window.location.href = ROUTES.LOGIN;
    }
    return Promise.reject(error);
  },
);

export default apiClient;
