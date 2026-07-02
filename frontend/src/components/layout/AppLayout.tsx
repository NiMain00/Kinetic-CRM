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
import { authz } from '@/services/authz';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { unreadCount } = useNotificationStore();
  const { getPendingCountByUser } = useApprovalStore();
  const pendingApprovalsCount = user?.id ? getPendingCountByUser(user.id) : 0;
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
  const oldPermissions = roleConfig?.permissions || [];
  const userId = (user as { id?: string })?.id;
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (user as any)?.departmentId;
  // Combine old + new permissions for backward-compatible sidebar filtering
  const newRbacPerms = userId
    ? ['dashboard:view', 'notification:read', 'profile:manage', 'prospect:read', 'prospect:write:prospecting',
       'prospect:approve:transition', 'project:read', 'project:create', 'project:write', 'project:manage:members',
       'project:manage:scope', 'pengadaan:read', 'pengadaan:create', 'pengadaan:write',
       'report:view:department', 'report:view:crossdept', 'config:access'].filter((p) => {
         return authz.hasPermission(userId, p, { departmentId: activeDeptId });
       })
    : [];
  const userPermissions = [...new Set([...oldPermissions, ...newRbacPerms])];

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
    <div className="flex h-screen overflow-hidden bg-background">
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
          notificationCount={pendingApprovalsCount}
          onNotificationsClick={() => navigate('/notifications')}
          onProfileClick={() => navigate('/profile')}
          onConfigClick={() => navigate('/config')}
          onMenuClick={() => setMobileSidebarOpen(true)}
          onHelpClick={() => setShortcutHelpOpen((v) => !v)}
        />
        <Breadcrumb />
        <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
        <main className="flex-1 flex flex-col min-h-0 bg-background">
          {isFullBleed ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
