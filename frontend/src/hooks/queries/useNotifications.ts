import { useQuery } from '@tanstack/react-query';
import { notificationService, type NotificationItem } from '@/services/notifications';

export function useNotifications(params?: { page?: number; type?: string; read?: boolean }) {
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const res = await notificationService.list(params);
      return res.data.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return res.data.data.count;
    },
    refetchInterval: 30000,
  });
}
