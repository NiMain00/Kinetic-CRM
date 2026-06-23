import apiClient from './api-client';

export const notificationService = {
  list: (params?: { isRead?: boolean; page?: number; perPage?: number }) =>
    apiClient.get('/notifications', { params }),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/mark-read`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read'),
};
