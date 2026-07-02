export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  permissions?: string[];
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', permissions: ['dashboard:view'] },
  { label: 'Prospek', path: '/prospects', icon: 'person', permissions: ['prospect:read'] },
  { label: 'Proyek', path: '/projects', icon: 'work', permissions: ['project:read'] },
  { label: 'Pengadaan', path: '/procurement', icon: 'inventory_2', permissions: ['pengadaan:read'] },
  { label: 'Persetujuan', path: '/approvals', icon: 'how_to_reg', permissions: ['prospect:approve:transition'] },
  { label: 'Laporan', path: '/reports', icon: 'pie_chart', permissions: ['report:view:department'] },
  { label: 'Kalender', path: '/reports/calendar', icon: 'calendar_today', permissions: ['report:view:department'] },
  { label: 'Master Data', path: '/master-data', icon: 'layers', permissions: ['config:access'] },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', permissions: ['notification:read'] },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', permissions: ['config:access'] },
];

export const configNavItems: NavItem[] = [
  { label: 'Organisasi', path: '/config/org', icon: 'account_tree', permissions: ['config:access'] },
  { label: 'Status Proyek', path: '/config/status', icon: 'settings', permissions: ['config:access'] },
  { label: 'Notifikasi', path: '/config/notifications', icon: 'notifications_active', permissions: ['config:access'] },
  { label: 'SLA', path: '/config/sla', icon: 'alarm', permissions: ['config:access'] },
  { label: 'Peran', path: '/config/roles', icon: 'badge', permissions: ['config:access'] },
  { label: 'Target', path: '/config/targets', icon: 'track_changes', permissions: ['config:access'] },
  { label: 'Alur Kerja', path: '/config/workflow', icon: 'alt_route', permissions: ['config:access'] },
  { label: 'Integrasi', path: '/config/integration', icon: 'api', permissions: ['config:access'] },
  { label: 'Upload', path: '/config/upload', icon: 'cloud_upload', permissions: ['config:access'] },
  { label: 'Periode', path: '/config/period', icon: 'calendar_month', permissions: ['config:access'] },
  { label: 'Tipe Pertanyaan', path: '/config/question-types', icon: 'help_outline', permissions: ['config:access'] },
];

export function filterNavItems(items: NavItem[], role: string, userPermissions?: string[]): NavItem[] {
  return items.filter((item) => {
    // Jika item memiliki permissions, gunakan ONLY permissions (abaikan roles)
    if (item.permissions && item.permissions.length > 0) {
      if (!userPermissions) return false;
      return item.permissions.some(p => userPermissions.includes(p));
    }
    // Fallback: gunakan roles jika tidak ada permissions
    if (item.roles && !item.roles.includes(role)) return false;
    return true;
  });
}
