import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pendingApprovalsCount: number;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  pendingApprovalsCount,
  onLogout,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'prospects', label: 'Prospects', icon: 'group' },
    { id: 'projects', label: 'Projects', icon: 'tactic' },
    {
      id: 'approvals',
      label: 'Approval Inbox',
      icon: 'fact_check',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'kpi', label: 'KPI Dashboard', icon: 'monitoring' },
    { id: 'reports', label: 'Reports', icon: 'analytics' },
    { id: 'master_data', label: 'Master Data', icon: 'database' },
    { id: 'users', label: 'User Management', icon: 'people' },
    { id: 'audit', label: 'Audit Trail', icon: 'history' },
    { id: 'notifications', label: 'Notification Center', icon: 'notifications' },
  ];

  const configItems = [
    { id: 'config_org', label: 'Organization Structure', icon: 'account_tree' },
    { id: 'config_status', label: 'Project Status Master', icon: 'settings' },
    { id: 'config_notifications', label: 'Notification Settings', icon: 'notifications_active' },
    { id: 'config_sla', label: 'SLA Configuration', icon: 'alarm' },
  ];

  return (
    <aside
      className={`h-screen sticky left-0 top-0 bg-surface-container-lowest border-r border-border shadow-sm flex flex-col py-8 transition-all duration-300 z-50 shrink-0 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className={`px-6 mb-8 transition-opacity duration-200 ${collapsed ? 'text-center' : ''}`}>
        <h1 className="font-display-title text-display-title text-primary tracking-tight truncate">
          {collapsed ? 'K' : 'Kinetic CRM'}
        </h1>
        {!collapsed && (
          <p className="font-caption-xs text-caption-xs text-secondary-fixed-variant uppercase tracking-widest mt-1">
            Enterprise Operations
          </p>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-label-sm text-label-sm ${
                isActive
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-secondary hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-primary' : 'text-secondary'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Section divider */}
        <div className="pt-4 pb-2">
          {!collapsed ? (
            <p className="px-4 text-[10px] font-bold uppercase text-outline tracking-wider">System Config</p>
          ) : (
            <hr className="border-border mx-2" />
          )}
        </div>

        {configItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-label-sm text-label-sm ${
                isActive
                  ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
                  : 'text-secondary hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-primary' : 'text-secondary'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout button */}
      {onLogout && (
        <div className="px-4 mb-2 select-none">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all text-left font-label-sm text-label-sm cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Keluar / Log Out dari Sesi"
          >
            <span className="material-symbols-outlined text-[22px] text-red-500">
              logout
            </span>
            {!collapsed && <span className="font-bold">Log Out</span>}
          </button>
        </div>
      )}

      {/* Collapse button */}
      <div className="px-4 mt-auto">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-secondary font-label-sm text-label-sm border border-border rounded-lg hover:bg-surface-container-low transition-all"
        >
          <span className="material-symbols-outlined text-lg transition-transform duration-300">
            {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
