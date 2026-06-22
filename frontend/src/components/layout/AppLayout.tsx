import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumb from './Breadcrumb';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';

const routeToTabId: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/prospects': 'prospects',
  '/projects': 'projects',
  '/approvals': 'approvals',
  '/kpi': 'kpi',
  '/reports': 'reports',
  '/master-data': 'master_data',
  '/users': 'users',
  '/audit': 'audit',
  '/notifications': 'notifications',
  '/config': 'config_org',
  '/config/org': 'config_org',
  '/config/status': 'config_status',
  '/config/notifications': 'config_notifications',
  '/config/sla': 'config_sla',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { unreadCount } = useNotificationStore();

  const pathPrefix = '/' + location.pathname.split('/')[1];
  const activeTab = routeToTabId[location.pathname] || routeToTabId[pathPrefix] || 'dashboard';

  const handleNavigate = (tabId: string) => {
    const pathMap: Record<string, string> = {
      dashboard: '/dashboard',
      prospects: '/prospects',
      projects: '/projects',
      approvals: '/approvals',
      kpi: '/kpi',
      reports: '/reports',
      master_data: '/master-data',
      users: '/users',
      audit: '/audit',
      notifications: '/notifications',
      config_org: '/config/org',
      config_status: '/config/status',
      config_notifications: '/config/notifications',
      config_sla: '/config/sla',
    };
    navigate(pathMap[tabId] || '/dashboard');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar - visible on desktop, slide-in on mobile */}
      <div className={`hidden md:flex ${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 shrink-0`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleNavigate}
          collapsed={!sidebarOpen}
          setCollapsed={(val) => { if (val === sidebarOpen) toggleSidebar(); }}
          pendingApprovalsCount={3}
          onLogout={() => { logout(); navigate('/login'); }}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={(user as { name?: string })?.name || 'Alexander Pierce'}
          roleName="User"
          notificationCount={unreadCount}
          onNotificationsClick={() => navigate('/notifications')}
          onProfileClick={() => navigate('/profile')}
        />
        <Breadcrumb />
        <main className="flex-1 overflow-y-auto bg-surface-container-low">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
