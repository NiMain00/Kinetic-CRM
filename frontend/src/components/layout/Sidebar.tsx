import React, { useMemo } from 'react';
import { navItems, configNavItems, filterNavItems, type NavItem } from '@/routes/nav-items';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pendingApprovalsCount: number;
  onLogout?: () => void;
  userRole?: string;
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  pendingApprovalsCount,
  onLogout,
  userRole = 'Staff',
  mobile = false,
  onClose,
}: SidebarProps) {
  const allowedNavItems = useMemo(() => filterNavItems(navItems, userRole), [userRole]);
  const allowedConfigItems = useMemo(() => filterNavItems(configNavItems, userRole), [userRole]);

  const handleNavigate = (path: string) => {
    setActiveTab(path);
    if (mobile && onClose) onClose();
  };

  const isPathActive = (itemPath: string): boolean => {
    if (activeTab === itemPath) return true;
    // Handle /project/xxx → /projects
    const activeSeg = activeTab.split('/')[1];
    const itemSeg = itemPath.split('/')[1];
    if (activeSeg === 'project' && itemSeg === 'projects') return true;
    // Highlight parent nav if on a sub-route (e.g. /projects/new → Proyek)
    if (itemPath !== '/' && activeTab.startsWith(itemPath + '/')) return true;
    return false;
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isPathActive(item.path);
    const badge = item.label === 'Approval' ? pendingApprovalsCount : undefined;

    return (
      <button
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-label-sm text-label-sm ${
          isActive
            ? 'text-primary font-bold border-l-4 border-primary bg-surface-container-high'
            : 'text-secondary hover:bg-surface-container-high hover:text-primary'
        }`}
        aria-label={item.label}
      >
        <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-primary' : 'text-secondary'}`}>
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} h-screen flex-col bg-surface-container-lowest border-r border-border shadow-sm transition-all duration-300 shrink-0 ${
        collapsed ? (mobile ? 'w-72' : 'w-20') : 'w-72'
      }`}
    >
      {/* Mobile overlay */}
      {mobile && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className={`relative z-10 flex flex-col h-full bg-surface-container-lowest py-8 ${mobile ? 'w-72 shadow-2xl' : ''}`}>
        {/* Brand Header */}
        <div className={`px-6 mb-8 transition-opacity duration-200 ${collapsed && !mobile ? 'text-center' : ''}`}>
          <h1 className="font-display-title text-display-title text-primary tracking-tight truncate">
            {collapsed && !mobile ? 'K' : 'Kinetic CRM'}
          </h1>
          {!collapsed && (
            <p className="font-caption-xs text-caption-xs text-secondary-fixed-variant uppercase tracking-widest mt-1">
              Enterprise Operations
            </p>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
          {allowedNavItems.map(renderNavItem)}

          {/* Section divider */}
          {allowedConfigItems.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                {!collapsed || mobile ? (
                  <p className="px-4 text-[10px] font-bold uppercase text-outline tracking-wider">Konfigurasi Sistem</p>
                ) : (
                  <hr className="border-border mx-2" />
                )}
              </div>
              {allowedConfigItems.map(renderNavItem)}
            </>
          )}
        </nav>

        {/* Logout button */}
        {onLogout && (
          <div className="px-4 mb-2">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-danger hover:bg-danger/5 hover:text-danger transition-all text-left font-label-sm text-label-sm cursor-pointer ${
                collapsed && !mobile ? 'justify-center' : ''
              }`}
              title="Keluar"
              aria-label="Keluar"
            >
              <span className="material-symbols-outlined text-[22px] text-danger">logout</span>
              {(!collapsed || mobile) && <span className="font-bold">Keluar</span>}
            </button>
          </div>
        )}

        {/* Collapse button (desktop only) */}
        {!mobile && (
          <div className="px-4 mt-auto">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-secondary font-label-sm text-label-sm border border-border rounded-lg hover:bg-surface-container-low transition-all"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="material-symbols-outlined text-lg transition-transform duration-300">
                {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
              </span>
              {!collapsed && <span>Ciutkan</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
