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
      const url = error.config?.url ?? '';
      // Don't force a redirect/logout when the failed request itself was an
      // authentication attempt — that would wipe the login form and swallow the
      // error toast (e.g. "Username atau password salah."). Only redirect on a
      // genuine session expiry for already-authenticated requests.
      const isLoginAttempt = url.includes('/auth/login');
      if (!isLoginAttempt) {
        useAuthStore.getState().logout();
        window.location.href = ROUTES.LOGIN;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

/**
 * Normalize an Axios response to its payload.
 *
 * The backend returns the payload directly at `res.data` (e.g. an array, an
 * object, or `{ token, user }`). Some legacy call sites expected an envelope
 * at `res.data.data`. `unwrap` handles both so the whole codebase can rely on
 * a single accessor.
 */
export function unwrap<T = any>(res: { data?: any }): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return body as T;
}
