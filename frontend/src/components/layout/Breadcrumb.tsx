import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  prospects: 'Prospects',
  projects: 'Projects',
  approvals: 'Approvals',
  kpi: 'KPI Dashboard',
  reports: 'Reports',
  'master-data': 'Master Data',
  users: 'Users',
  audit: 'Audit Log',
  notifications: 'Notifications',
  config: 'Configuration',
  profile: 'Profile',
  new: 'New',
  detail: 'Detail',
  edit: 'Edit',
  org: 'Organization Structure',
  status: 'Project Status Master',
  sla: 'SLA Configuration',
};

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="px-6 lg:px-8 py-2 bg-surface border-b border-border flex items-center gap-1 text-xs" aria-label="Breadcrumb">
      <Link to="/dashboard" className="text-outline hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-sm">home</span>
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        const isLast = i === segments.length - 1;

        return (
          <React.Fragment key={path}>
            <span className="material-symbols-outlined text-outline text-xs">chevron_right</span>
            {isLast ? (
              <span className="text-on-surface font-semibold truncate max-w-[200px]">{label}</span>
            ) : (
              <Link to={path} className="text-outline hover:text-primary transition-colors truncate max-w-[200px]">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
