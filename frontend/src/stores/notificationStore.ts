import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService } from '@/services/notifications';
import { useAuthStore } from './authStore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'revision' | 'status_change' | 'assignment' | 'system';
  read: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: 'prospect' | 'project' | 'procurement';
  icon?: string;
  color?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  approval: { icon: 'fact_check', color: 'border-emerald-500 text-teal-600 bg-emerald-50' },
  revision: { icon: 'edit_document', color: 'border-amber-500 text-amber-600 bg-amber-50' },
  status_change: { icon: 'swap_horiz', color: 'border-blue-500 text-blue-600 bg-blue-50' },
  assignment: { icon: 'person_add', color: 'border-indigo-500 text-indigo-600 bg-indigo-50' },
  system: { icon: 'dns', color: 'border-outline text-secondary bg-surface-container' },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,

      fetchNotifications: async () => {
        set({ loading: true });
        try {
          const res = await notificationService.list({ perPage: 20 });
          const list = res.data?.data || res.data || [];
          const notifications = Array.isArray(list) ? list.map((n: any) => ({
            ...n,
            icon: n.icon || (TYPE_CONFIG[n.type] || TYPE_CONFIG.system).icon,
            color: n.color || (TYPE_CONFIG[n.type] || TYPE_CONFIG.system).color,
          })) : [];
          set({
            notifications,
            unreadCount: notifications.filter((n: any) => !n.read).length,
            loading: false,
          });
        } catch {
          set({ loading: false });
        }
      },

      addNotification: async (n) => {
        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
        const notification: Notification = {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          createdAt: new Date().toISOString(),
          icon: n.icon || config.icon,
          color: n.color || config.color,
        };
        try {
          const { id, read, createdAt, ...rest } = notification;
          const userId = useAuthStore.getState().user?.id;
          await notificationService.create({ ...rest, recipientUserId: userId } as any);
        } catch (err) {
          console.error('[notificationStore] addNotification API failed:', err);
        }
        set((s) => ({
          notifications: [notification, ...s.notifications],
          unreadCount: s.unreadCount + 1,
        }));
      },

      markAsRead: async (id) => {
        try {
          await notificationService.markAsRead(id);
        } catch (err) {
          console.error('[notificationStore] markAsRead API failed:', err);
        }
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAllAsRead: async () => {
        try {
          await notificationService.markAllAsRead();
        } catch (err) {
          console.error('[notificationStore] markAllAsRead API failed:', err);
        }
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: async (id) => {
        try {
          await notificationService.archive(id);
        } catch (err) {
          console.error('[notificationStore] removeNotification API failed:', err);
        }
        set((s) => {
          const updated = s.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      clearAll: async () => {
        try {
          const ids = get().notifications.map((n) => n.id);
          for (const id of ids) {
            await notificationService.archive(id).catch(() => {});
          }
        } catch (err) {
          console.error('[notificationStore] clearAll API failed:', err);
        }
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'kinetic-notifications',
      version: 2,
      partialize: (state) => ({ notifications: state.notifications, unreadCount: state.unreadCount }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version === 0 || version === 1) {
          const notifications = current.notifications || [];
          return { notifications, unreadCount: notifications.filter((n: any) => !n.read).length };
        }
        return current;
      },
    },
  ),
);
