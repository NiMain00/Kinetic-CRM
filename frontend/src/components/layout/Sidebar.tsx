import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems, filterNavItems, type NavItem } from '@/routes/nav-items';
import { useAuthStore } from '@/stores/authStore';
import { useRbacStore } from '@/stores/rbacStore';
import { authz } from '@/services/authz';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pendingApprovalsCount: number;
  unreadCount?: number;
  onLogout?: () => void;
  userRole?: string;
  userPermissions?: string[];
  mobile?: boolean;
  onClose?: () => void;
}

function useSwipe(onClose?: () => void) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && dx < -60) {
      onClose?.();
    }
    touchStartRef.current = null;
  }, [onClose]);

  return { onTouchStart, onTouchEnd };
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  pendingApprovalsCount,
  unreadCount = 0,
  onLogout,
  userRole = 'Staff',
  userPermissions = [],
  mobile = false,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const allowedNavItems = useMemo(() => filterNavItems(navItems, userRole, userPermissions), [userRole, userPermissions]);
  const swipeHandlers = useSwipe(onClose);
  const [expandedParents, setExpandedParents] = React.useState<Set<string>>(new Set());
  const [showDeptSwitch, setShowDeptSwitch] = React.useState(false);
  const authUser = useAuthStore((s) => s.user);
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (authUser as any)?.departmentId;
  const rbacDepartments = useRbacStore((s) => s.departments);
  const activeDept = rbacDepartments.find((d) => d.id === activeDeptId);
  const deptName = activeDept?.name || (authUser as any)?.departmentName || '';
  const deptCode = activeDept?.code || (authUser as any)?.departmentCode || '';

  useEffect(() => {
    if (mobile) {
      document.body.classList.add('body-scroll-lock');
    }
    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [mobile]);

  const isPathActive = (itemPath: string): boolean => {
    if (location.pathname === itemPath) return true;
    if (itemPath !== '/' && location.pathname.startsWith(itemPath + '/')) {
      const hasChildItem = navItems.some(
        (other) => other.path !== itemPath && other.path.startsWith(itemPath + '/'),
      );
      if (hasChildItem) return false;
      return true;
    }
    return false;
  };

  const navListRef = useRef<HTMLDivElement>(null);

  const onNavKeyDown = (e: React.KeyboardEvent) => {
    const links = navListRef.current?.querySelectorAll<HTMLAnchorElement>('a');
    if (!links || links.length === 0) return;
    const idx = Array.from(links).indexOf(document.activeElement as HTMLAnchorElement);
    if (idx === -1) return;
    let next: number;
    if (e.key === 'ArrowDown') next = (idx + 1) % links.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + links.length) % links.length;
    else return;
    e.preventDefault();
    links[next].focus();
  };

  const toggleParent = useCallback((path: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const renderNavItem = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      return renderExpandableItem(item);
    }
    return renderLeafItem(item);
  };

  const renderLeafItem = (item: NavItem) => {
    const isActive = isPathActive(item.path);
    const badge = item.label === 'Persetujuan' ? pendingApprovalsCount : item.label === 'Notifikasi' ? unreadCount : undefined;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => { if (mobile && onClose) onClose(); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-left font-label-sm text-label-sm touch-min-h border-l-[3px] ${
          isActive
            ? 'bg-primary-container/40 text-primary font-semibold border-primary'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent'
        }`}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true">
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full" aria-label={`${badge} notifikasi`}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const renderExpandableItem = (item: NavItem) => {
    const isExpanded = expandedParents.has(item.path);
    const hasActiveChild = item.children?.some((child) => isPathActive(child.path)) ?? false;

    return (
      <div key={item.path} className="space-y-0.5">
        {/* Parent toggle button */}
        <button
          onClick={() => {
            toggleParent(item.path);
            if (mobile && onClose) onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-left font-label-sm text-label-sm touch-min-h border-l-[3px] ${
            hasActiveChild
              ? 'bg-primary-container/40 text-primary font-semibold border-primary'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent'
          }`}
          aria-label={item.label}
          aria-expanded={isExpanded}
        >
          <span className={`material-symbols-outlined text-[22px] ${hasActiveChild ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true">
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span className="truncate flex-1 text-left">{item.label}</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                chevron_right
              </span>
            </>
          )}
        </button>

        {/* Children (only when expanded and not collapsed) */}
        {!collapsed && isExpanded && item.children && (
          <div className="ml-3 space-y-0.5 border-l-2 border-border/60 pl-2">
            {item.children.map((child) => {
              const isChildActive = isPathActive(child.path);
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={() => { if (mobile && onClose) onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-left font-label-sm text-label-sm touch-min-h ${
                    isChildActive
                      ? 'bg-primary-container/30 text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                  aria-label={child.label}
                  aria-current={isChildActive ? 'page' : undefined}
                >
                  <span className={`material-symbols-outlined text-[18px] ${isChildActive ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true">
                    {child.icon}
                  </span>
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} h-screen flex-col bg-surface border-r border-border/60 shrink-0 ${
        collapsed ? (mobile ? 'w-64' : 'w-18') : 'w-64'
      } ${mobile ? 'slide-in-left' : 'transition-all duration-300'}`}
    >
      {mobile && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`relative z-10 flex flex-col h-full py-5 ${mobile ? 'w-64 shadow-2xl' : ''}`}
        {...(mobile ? swipeHandlers : {})}
      >
        {/* Brand Header */}
        <div className={`px-5 mb-6 transition-opacity duration-200 ${collapsed && !mobile ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            {(!collapsed || mobile) && (
              <div>
                <h1 className="font-display-title text-on-surface text-lg tracking-tight truncate">
                  Kinetic CRM
                </h1>
                <p className="font-caption-xs text-outline uppercase tracking-widest text-[10px]">
                  OPERASI PERUSAHAAN
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Department Badge */}
        {(!collapsed || mobile) && deptName && (
          <div className="px-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-container/30 rounded-lg border border-primary/10">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">business</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-primary truncate">{deptName}</p>
                <p className="text-[9px] text-outline uppercase tracking-wider">{deptCode}</p>
              </div>
            </div>
          </div>
        )}

        {/* Department Switcher (multiple departments) */}
        {(!collapsed || mobile) && (() => {
          const uid = (authUser as { id?: string })?.id;
          if (!uid) return null;
          const allDepts = authz.getAccessibleDepartments(uid);
          if (allDepts.length <= 1) return null;
          const otherDepts = allDepts.filter((d) => d.id !== activeDeptId);
          if (otherDepts.length === 0) return null;
          return (
            <div className="px-3 mb-3">
              <button
                onClick={() => setShowDeptSwitch(!showDeptSwitch)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-outline hover:text-on-surface transition-colors"
              >
                <span>Ganti Department</span>
                <span className="material-symbols-outlined text-[14px]">
                  {showDeptSwitch ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {showDeptSwitch && (
                <div className="mt-1 space-y-1">
                  {otherDepts.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        useAuthStore.getState().setActiveDepartment(dept.id);
                        setShowDeptSwitch(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      <div className="w-5 h-5 rounded bg-surface-container-low flex items-center justify-center">
                        <span className="material-symbols-outlined text-[12px]">business</span>
                      </div>
                      <span className="truncate">{dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Navigation list */}
        <nav ref={navListRef} className="flex-1 px-3 space-y-0.5 overflow-y-auto" aria-label="Navigasi sidebar" role="list" onKeyDown={onNavKeyDown}>
          {allowedNavItems.map(renderNavItem)}
        </nav>

        {/* Logout button */}
        {onLogout && (
          <div className="px-3 mb-2">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-danger hover:bg-danger-container/20 transition-all text-left font-label-sm text-label-sm cursor-pointer touch-min-h border-l-[3px] border-transparent ${
                collapsed && !mobile ? 'justify-center' : ''
              }`}
              title="Keluar"
              aria-label="Keluar"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              {(!collapsed || mobile) && <span className="font-semibold">Keluar</span>}
            </button>
          </div>
        )}

        {/* Collapse button (desktop only) */}
        {!mobile && (
          <div className="px-3 mt-auto">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 text-outline font-label-sm text-label-sm rounded-lg hover:bg-surface-container hover:text-on-surface-variant transition-all touch-min-h"
              aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              <span className="material-symbols-outlined text-lg transition-transform duration-300">
                {collapsed ? 'keyboard_double_arrow_right' : 'chevron_left'}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
