import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'revision' | 'status_change' | 'assignment' | 'system';
  read: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: 'prospect' | 'project';
  icon?: string;
  color?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
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
  system: { icon: 'dns', color: 'border-slate-500 text-slate-500 bg-slate-50' },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Prospek Baru: Surveillance System', message: 'Prospek baru dari Secure City Group memerlukan review.', type: 'approval', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), entityType: 'prospect', entityId: '3', icon: 'fact_check' },
  { id: 'n2', title: 'RKS Direview: Data Center Jakarta', message: 'Dokumen RKS untuk Pembangunan Infrastruktur Data Center - Tahap II sedang direview.', type: 'status_change', read: false, createdAt: new Date(Date.now() - 7200000).toISOString(), entityType: 'project', entityId: 'PR-2025-001', icon: 'swap_horiz' },
  { id: 'n3', title: 'Revisi LPHS: FTTH Menteng', message: 'Department Financial Audit meminta revisi pada dokumen LPHS.', type: 'revision', read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), entityType: 'project', entityId: 'PR-2025-002', icon: 'edit_document' },
  { id: 'n4', title: 'Penugasan Baru', message: 'Anda ditugaskan sebagai reviewer untuk proyek Modernization of Terminal 3.', type: 'assignment', read: false, createdAt: new Date(Date.now() - 172800000).toISOString(), entityType: 'project', entityId: 'PR-2025-003', icon: 'person_add' },
  { id: 'n5', title: 'Sistem: Backup Selesai', message: 'Backup data harian berhasil dilakukan pada pukul 02:00 WIB.', type: 'system', read: true, createdAt: new Date(Date.now() - 259200000).toISOString(), icon: 'dns' },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,

      addNotification: (n) => {
        const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
        const notification: Notification = {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          createdAt: new Date().toISOString(),
          icon: n.icon || config.icon,
          color: n.color || config.color,
        };
        set((s) => ({
          notifications: [notification, ...s.notifications],
          unreadCount: s.unreadCount + 1,
        }));
      },

      markAsRead: (id) =>
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),

      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((s) => {
          const updated = s.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'kinetic-notifications',
      version: 1,
    },
  ),
);
