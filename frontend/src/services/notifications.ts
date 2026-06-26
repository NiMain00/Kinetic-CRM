import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'revision' | 'status_change' | 'assignment' | 'system';
  read: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: 'prospect' | 'project';
  icon?: string;
}

export const notificationService = {
  list: (params?: { page?: number; perPage?: number; type?: string; read?: boolean }) =>
    apiClient.get<ApiResponse<NotificationItem[]>>('/notifications', { params }),
  getUnreadCount: () => apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markAsRead: (id: string) => apiClient.patch<ApiResponse<void>>(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch<ApiResponse<void>>('/notifications/read-all'),
  archive: (id: string) => apiClient.delete<ApiResponse<void>>(`/notifications/${id}`),
  create: (data: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) =>
    apiClient.post<ApiResponse<NotificationItem>>('/notifications', data),
};
