import apiClient from './api-client';

export const authService = {
  login: (data: { username: string; password: string }) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  refresh: (data: { refreshToken: string }) => apiClient.post('/auth/refresh', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => apiClient.post('/auth/change-password', data),
};
