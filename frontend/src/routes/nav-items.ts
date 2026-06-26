export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
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
  { label: 'Organisasi', path: '/config/org', icon: 'account_tree', roles: ['Super Admin'] },
  { label: 'Status Proyek', path: '/config/status', icon: 'settings', roles: ['Super Admin'] },
  { label: 'Notifikasi', path: '/config/notifications', icon: 'notifications_active', roles: ['Super Admin'] },
  { label: 'SLA', path: '/config/sla', icon: 'alarm', roles: ['Super Admin'] },
  { label: 'Role', path: '/config/roles', icon: 'badge', roles: ['Super Admin'] },
  { label: 'Target', path: '/config/targets', icon: 'track_changes', roles: ['Super Admin'] },
  { label: 'Workflow', path: '/config/workflow', icon: 'alt_route', roles: ['Super Admin'] },
  { label: 'Integrasi', path: '/config/integration', icon: 'api', roles: ['Super Admin'] },
  { label: 'Upload', path: '/config/upload', icon: 'cloud_upload', roles: ['Super Admin'] },
  { label: 'Periode', path: '/config/period', icon: 'calendar_month', roles: ['Super Admin'] },
  { label: 'Tipe Pertanyaan', path: '/config/question-types', icon: 'help_outline', roles: ['Super Admin'] },
];

export function filterNavItems(items: NavItem[], role: string): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
