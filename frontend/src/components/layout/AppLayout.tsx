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
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import type { ApprovalItem } from '@/types/domain';
import { authz } from '@/services/authz';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { approvals, fetchApprovals } = useApprovalStore();
  const prospects = useProspectStore((s) => s.prospects);
  const projects = useProjectStore((s) => s.projects);

  // Compute pending approvals count matching the logic in ApprovalInboxPage
  const pendingApprovalsCount = user?.id
    ? (() => {
        const VALID_TYPES = new Set(['Prospek', 'RKS', 'LPHS']);
        const derived: ApprovalItem[] = [];
        prospects.forEach((p: any) => {
          if (p.status === 'Waiting Supervisor') {
            derived.push({ entityId: p.id, entityType: 'prospect', type: 'Prospek', id: `derived-prospect-${p.id}` } as ApprovalItem);
          }
        });
        projects.forEach((pr: any) => {
          if (pr.status === 'Review RKS') {
            derived.push({ entityId: pr.id, entityType: 'project', type: 'RKS', id: `derived-rks-${pr.id}` } as ApprovalItem);
          } else if (
            pr.status === 'LPHS/SIOS' &&
            pr.lphs &&
            (pr.lphs.overallStatus === 'dept_review' || pr.lphs.overallStatus === 'mgmt_review')
          ) {
            derived.push({ entityId: pr.id, entityType: 'project', type: 'LPHS', id: `derived-lphs-${pr.id}` } as ApprovalItem);
          }
        });
        const map = new Map<string, ApprovalItem>();
        derived.forEach((a) => map.set(a.entityId ?? a.id, a));
        approvals.forEach((a) => {
          if (!VALID_TYPES.has(a.type)) return;
          const key = a.entityId ?? a.id;
          if (!map.has(key)) map.set(key, a);
        });
        const combined = Array.from(map.values());
        const userItems = combined.filter((a) => {
          if (!VALID_TYPES.has(a.type)) return false;
          if (a.assigneeUserId && a.assigneeUserId !== user.id) return false;
          if (a.entityType === 'prospect' && a.entityId) {
            return prospects.some((p: any) => p.id === a.entityId);
          }
          if (a.entityType === 'project' && a.entityId) {
            return projects.some((p: any) => p.id === a.entityId);
          }
          return true;
        });
        return userItems.length;
      })()
    : 0;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  useKeyboardShortcuts({
    navigate,
    onToggleHelp: () => setShortcutHelpOpen((v) => !v),
    onClose: () => setShortcutHelpOpen(false),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApprovals();
      fetchNotifications();
    }, 2000);
    return () => clearTimeout(timer);
  }, [fetchApprovals, fetchNotifications]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 slide-in-left md:hidden">
            <Sidebar
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
          </div>
        </>
      )}

      <div className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-18'} transition-all duration-300 shrink-0`}>
        <Sidebar
          collapsed={!sidebarOpen}
          setCollapsed={(val) => { if (val === sidebarOpen) toggleSidebar(); }}
          pendingApprovalsCount={pendingApprovalsCount}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          userRole={userRole}
          userPermissions={userPermissions}
        />
      </div>

      {/* Tablet sidebar toggle button */}
      <div className="hidden md:flex lg:hidden fixed left-0 top-0 z-30 h-screen w-0">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-12 bg-surface border border-border/60 rounded-r-xl flex items-center justify-center shadow-md hover:bg-surface-container transition-all cursor-pointer"
          aria-label="Buka sidebar"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={userName}
          roleName={userRole}
          notificationCount={pendingApprovalsCount}
          notificationsTo="/notifications"
          profileTo="/profile"
          configTo="/config"
          onMenuClick={() => setMobileSidebarOpen(true)}
          onHelpClick={() => setShortcutHelpOpen((v) => !v)}
        />
        <Breadcrumb />
        <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
        <main className="flex-1 flex flex-col min-h-0 bg-background">
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-10 py-3 sm:py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
