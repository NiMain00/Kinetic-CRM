import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumb from './Breadcrumb';
import ShortcutHelpModal from '@/components/shared/ShortcutHelpModal';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useMasterDataStore } from '@/stores/masterDataStore';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { unreadCount } = useNotificationStore();
  const { getPendingCount } = useApprovalStore();
  const pendingApprovalsCount = getPendingCount();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  useKeyboardShortcuts({
    navigate,
    onToggleHelp: () => setShortcutHelpOpen((v) => !v),
    onClose: () => setShortcutHelpOpen(false),
  });

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const userRole = (user as { roleName?: string })?.roleName || 'Staff';
  const userName = (user as { name?: string })?.name || (user as { fullName?: string })?.fullName || 'Alexander Pierce';
  const roleConfig = useMasterDataStore((s) => s.roles).find((r) => r.name === userRole);
  const userPermissions = roleConfig?.permissions || [];

  // Full-bleed detection: chat pages fill entire content area without padding
  const isFullBleed = location.pathname.includes('/diskusi');

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <Sidebar
          activeTab={location.pathname}
          setActiveTab={handleNavigate}
          collapsed={false}
          setCollapsed={() => {}}
          pendingApprovalsCount={pendingApprovalsCount}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          userRole={userRole}
          userPermissions={userPermissions}
          mobile
          onClose={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:flex ${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 shrink-0`}>
        <Sidebar
          activeTab={location.pathname}
          setActiveTab={handleNavigate}
          collapsed={!sidebarOpen}
          setCollapsed={(val) => { if (val === sidebarOpen) toggleSidebar(); }}
          pendingApprovalsCount={pendingApprovalsCount}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          userRole={userRole}
          userPermissions={userPermissions}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={userName}
          roleName={userRole}
          notificationCount={unreadCount}
          onNotificationsClick={() => navigate('/notifications')}
          onProfileClick={() => navigate('/profile')}
          onMenuClick={() => setMobileSidebarOpen(true)}
          onHelpClick={() => setShortcutHelpOpen((v) => !v)}
        />
        <Breadcrumb />
        <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
        <main className="flex-1 flex flex-col min-h-0 bg-surface-container-low">
          {isFullBleed ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-2 sm:px-3 lg:px-3">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
