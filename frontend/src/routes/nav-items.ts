export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  permissions?: string[];
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'] },
  { label: 'Prospek', path: '/prospects', icon: 'travel_explore', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'] },
  { label: 'Proyek', path: '/projects', icon: 'folder', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'] },
  { label: 'Approval', path: '/approvals', icon: 'approval', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer'] },
  { label: 'Laporan', path: '/reports', icon: 'report', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management'] },
  { label: 'Master Data', path: '/master-data', icon: 'database', roles: ['Super Admin', 'Admin'] },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'] },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', roles: ['Super Admin'] },
];

export const configNavItems: NavItem[] = [
  { label: 'Organisasi', path: '/config/org', icon: 'account_tree', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Status Proyek', path: '/config/status', icon: 'settings', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Notifikasi', path: '/config/notifications', icon: 'notifications_active', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'SLA', path: '/config/sla', icon: 'alarm', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Role', path: '/config/roles', icon: 'badge', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Target', path: '/config/targets', icon: 'track_changes', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Workflow', path: '/config/workflow', icon: 'alt_route', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Integrasi', path: '/config/integration', icon: 'api', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Upload', path: '/config/upload', icon: 'cloud_upload', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Periode', path: '/config/period', icon: 'calendar_month', roles: ['Super Admin'], permissions: ['config_access'] },
  { label: 'Tipe Pertanyaan', path: '/config/question-types', icon: 'help_outline', roles: ['Super Admin'], permissions: ['config_access'] },
];

export function filterNavItems(items: NavItem[], role: string, userPermissions?: string[]): NavItem[] {
  return items.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.permissions && item.permissions.length > 0) {
      if (!userPermissions) return false;
      return item.permissions.some(p => userPermissions.includes(p));
    }
    return true;
  });
}
