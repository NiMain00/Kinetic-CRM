import { useQuery } from '@tanstack/react-query';
import { notificationService, type NotificationItem } from '@/services/notifications';
import { unwrap } from '@/services/api-client';

export function useNotifications(params?: { page?: number; type?: string; read?: boolean }) {
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const res = await notificationService.list(params);
      return unwrap<NotificationItem[]>(res);
    },
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      const data = unwrap<{ count: number }>(res);
      return data?.count ?? 0;
    },
    refetchInterval: 30000,
  });
}
