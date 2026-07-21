import { PERMISSIONS } from './constants';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  permissions?: string[];
  module?: string; // for stage-based access check (e.g., 'project')
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { label: 'Analytics', path: '/analytics', icon: 'analytics', permissions: [PERMISSIONS.ANALYTICS_VIEW] },
  {
    label: 'Prospek',
    path: '/prospects',
    icon: 'person',
    permissions: [PERMISSIONS.PROSPECT_READ],
    children: [
      { label: 'Daftar Prospek', path: '/prospects', icon: 'list_alt', permissions: [PERMISSIONS.PROSPECT_READ] },
      { label: 'Kualifikasi', path: '/prospects/qualification', icon: 'trending_up', permissions: [PERMISSIONS.PROSPECT_READ] },
    ],
  },
  { label: 'Proyek', path: '/projects', icon: 'work', module: 'project' },
  { label: 'Pengadaan', path: '/procurement', icon: 'inventory_2', permissions: [PERMISSIONS.PENGADAAN_READ] },
  { label: 'Persetujuan', path: '/approvals', icon: 'how_to_reg', permissions: [PERMISSIONS.PROSPECT_APPROVE_TRANSITION] },
  { label: 'Laporan', path: '/reports', icon: 'pie_chart', permissions: [PERMISSIONS.REPORT_VIEW_DEPARTMENT] },
  { label: 'Kalender', path: '/reports/calendar', icon: 'calendar_today', permissions: [PERMISSIONS.REPORT_VIEW_DEPARTMENT] },
  { label: 'Master Data', path: '/master-data', icon: 'layers', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', permissions: [PERMISSIONS.NOTIFICATION_READ] },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', permissions: [PERMISSIONS.CONFIG_ACCESS] },
];

export const CONFIG_NAV_ITEMS: NavItem[] = [
  { label: 'Organisasi', path: '/config/org', icon: 'account_tree', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Status Proyek', path: '/config/status', icon: 'settings', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Notifikasi', path: '/config/notifications', icon: 'notifications_active', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'SLA', path: '/config/sla', icon: 'alarm', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Target', path: '/config/targets', icon: 'track_changes', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Alur Kerja', path: '/config/workflow', icon: 'alt_route', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Stage Rules', path: '/config/stage-rules', icon: 'account_tree', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Integrasi', path: '/config/integration', icon: 'api', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Upload', path: '/config/upload', icon: 'cloud_upload', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Periode', path: '/config/period', icon: 'calendar_month', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Tipe Pertanyaan', path: '/config/question-types', icon: 'help_outline', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Access Control', path: '/config/access-control', icon: 'security', permissions: [PERMISSIONS.CONFIG_ACCESS] },
  { label: 'Konfigurasi Input', path: '/config/input-options', icon: 'checklist', permissions: [PERMISSIONS.CONFIG_ACCESS] },
];

function hasAccess(item: NavItem, role: string, userPermissions?: string[]): boolean {
  if (item.permissions && item.permissions.length > 0) {
    if (!userPermissions) return false;
    return item.permissions.some(p => userPermissions.includes(p));
  }
  if (item.roles && !item.roles.includes(role)) return false;
  return true;
}

export function filterNavItems(items: NavItem[], role: string, userPermissions?: string[]): NavItem[] {
  return items
    .map((item) => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter((c) => hasAccess(c, role, userPermissions));
      return { ...item, children: filteredChildren };
    })
    .filter((item) => {
      if (!hasAccess(item, role, userPermissions)) return false;
      if (item.children && item.children.length === 0) return false;
      return true;
    });
}
