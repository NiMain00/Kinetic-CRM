export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['Administrator', 'Project Manager', 'Management', 'Reviewer Departemen', 'Staf Cabang'] },
  { label: 'Prospek', path: '/prospects', icon: 'travel_explore', roles: ['Administrator', 'Project Manager', 'Management', 'Reviewer Departemen', 'Staf Cabang'] },
  { label: 'Proyek', path: '/projects', icon: 'folder', roles: ['Administrator', 'Project Manager', 'Management', 'Reviewer Departemen', 'Staf Cabang'] },
  { label: 'Approval', path: '/approvals', icon: 'approval', roles: ['Administrator', 'Project Manager', 'Management', 'Reviewer Departemen'] },
  { label: 'Laporan', path: '/reports', icon: 'report', roles: ['Administrator', 'Project Manager', 'Management'] },
  { label: 'Master Data', path: '/master-data', icon: 'database', roles: ['Administrator'] },
  { label: 'Pengguna', path: '/users', icon: 'people', roles: ['Administrator'] },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', roles: ['Administrator', 'Project Manager', 'Management', 'Reviewer Departemen', 'Staf Cabang'] },
  { label: 'Audit Log', path: '/audit', icon: 'history', roles: ['Administrator'] },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', roles: ['Administrator'] },
];

export const configNavItems: NavItem[] = [
  { label: 'Organisasi', path: '/config/org', icon: 'account_tree', roles: ['Administrator'] },
  { label: 'Status Proyek', path: '/config/status', icon: 'settings', roles: ['Administrator'] },
  { label: 'Notifikasi', path: '/config/notifications', icon: 'notifications_active', roles: ['Administrator'] },
  { label: 'SLA', path: '/config/sla', icon: 'alarm', roles: ['Administrator'] },
  { label: 'Role', path: '/config/roles', icon: 'badge', roles: ['Administrator'] },
  { label: 'Target', path: '/config/targets', icon: 'track_changes', roles: ['Administrator'] },
  { label: 'Workflow', path: '/config/workflow', icon: 'alt_route', roles: ['Administrator'] },
  { label: 'Integrasi', path: '/config/integration', icon: 'api', roles: ['Administrator'] },
  { label: 'Upload', path: '/config/upload', icon: 'cloud_upload', roles: ['Administrator'] },
  { label: 'Periode', path: '/config/period', icon: 'calendar_month', roles: ['Administrator'] },
  { label: 'Tipe Pertanyaan', path: '/config/question-types', icon: 'help_outline', roles: ['Administrator'] },
];

export function filterNavItems(items: NavItem[], role: string): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
