import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/notifications';

export function useNotifications(filters?: { isRead?: boolean; page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationService.list(filters),
  });
}
