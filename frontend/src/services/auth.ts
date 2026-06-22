import apiClient from './api-client';

export const authService = {
  login: (data: { username: string; password: string }) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};
