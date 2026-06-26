export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  permissions?: string[];
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'], permissions: ['dashboard_view'] },
  { label: 'Prospek', path: '/prospects', icon: 'travel_explore', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'], permissions: ['prospek_view'] },
  { label: 'Proyek', path: '/projects', icon: 'folder', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'], permissions: ['proyek_view'] },
  { label: 'Persetujuan', path: '/approvals', icon: 'approval', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer'], permissions: ['approval_view'] },
  { label: 'Laporan', path: '/reports', icon: 'report', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management'], permissions: ['laporan_view'] },
  { label: 'Master Data', path: '/master-data', icon: 'database', roles: ['Super Admin', 'Admin'], permissions: ['master_data'] },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'] },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', permissions: ['config_access'] },
];

export const configNavItems: NavItem[] = [
  { label: 'Organisasi', path: '/config/org', icon: 'account_tree', permissions: ['config_access'] },
  { label: 'Status Proyek', path: '/config/status', icon: 'settings', permissions: ['config_access'] },
  { label: 'Notifikasi', path: '/config/notifications', icon: 'notifications_active', permissions: ['config_access'] },
  { label: 'SLA', path: '/config/sla', icon: 'alarm', permissions: ['config_access'] },
  { label: 'Peran', path: '/config/roles', icon: 'badge', permissions: ['config_access'] },
  { label: 'Target', path: '/config/targets', icon: 'track_changes', permissions: ['config_access'] },
  { label: 'Alur Kerja', path: '/config/workflow', icon: 'alt_route', permissions: ['config_access'] },
  { label: 'Integrasi', path: '/config/integration', icon: 'api', permissions: ['config_access'] },
  { label: 'Upload', path: '/config/upload', icon: 'cloud_upload', permissions: ['config_access'] },
  { label: 'Periode', path: '/config/period', icon: 'calendar_month', permissions: ['config_access'] },
  { label: 'Tipe Pertanyaan', path: '/config/question-types', icon: 'help_outline', permissions: ['config_access'] },
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
