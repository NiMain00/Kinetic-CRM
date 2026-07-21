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

/** Section grouping keys for visual organization */
const SECTION_MAP: Record<string, { title: string; paths: string[] }> = {
  main: {
    title: 'Menu Utama',
    paths: ['/dashboard', '/prospects', '/projects', '/procurement'],
  },
  operations: {
    title: 'Operasional',
    paths: ['/approvals', '/reports', '/reports/calendar'],
  },
  system: {
    title: 'Sistem',
    paths: ['/analytics', '/master-data', '/notifications', '/config'],
  },
};

/** Bottom menu items that always appear at the bottom */
const BOTTOM_MENU_PATHS = new Set(['/config']);

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

const Sidebar = React.memo(function Sidebar({
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

  const allPaths = useMemo(() => {
    const paths = new Set<string>();
    const collect = (items: NavItem[]) => {
      for (const item of items) {
        paths.add(item.path);
        if (item.children) collect(item.children);
      }
    };
    collect(navItems);
    return paths;
  }, []);

  const isPathActive = (itemPath: string): boolean => {
    if (location.pathname === itemPath) return true;
    if (itemPath !== '/' && location.pathname.startsWith(itemPath + '/')) {
      const hasChildItem = [...allPaths].some(
        (p) => p !== itemPath && p.startsWith(itemPath + '/'),
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

  /** Split allowed nav items into sections and bottom items */
  const { sectionedItems, bottomItems } = useMemo(() => {
    const bottom: NavItem[] = [];
    const sectionBuckets: Record<string, NavItem[]> = { main: [], operations: [], system: [] };
    const ungrouped: NavItem[] = [];

    for (const item of allowedNavItems) {
      if (BOTTOM_MENU_PATHS.has(item.path)) {
        bottom.push(item);
        continue;
      }
      let placed = false;
      for (const [key, section] of Object.entries(SECTION_MAP)) {
        if (section.paths.includes(item.path)) {
          sectionBuckets[key].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) ungrouped.push(item);
    }

    return { sectionedItems: sectionBuckets, bottomItems: bottom };
  }, [allowedNavItems]);

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
        title={collapsed && !mobile ? item.label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-left font-medium touch-min-h ${
          isActive
            ? 'bg-primary-container/40 text-primary font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        } ${collapsed && !mobile ? 'justify-center px-0' : ''}`}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`material-symbols-outlined text-[16px] shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true">
          {item.icon}
        </span>
        {!collapsed && <span className="truncate text-[12px]">{item.label}</span>}
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-surface-container text-on-surface-variant text-[9px] font-semibold px-1.5 py-0.5 rounded-full" aria-label={`${badge} notifikasi`}>
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
          onClick={() => toggleParent(item.path)}
          title={collapsed && !mobile ? item.label : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-left font-medium touch-min-h ${
            hasActiveChild
              ? 'bg-primary-container/40 text-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          } ${collapsed && !mobile ? 'justify-center px-0' : ''}`}
          aria-label={item.label}
          aria-expanded={isExpanded}
        >
          <span className={`material-symbols-outlined text-[16px] shrink-0 ${hasActiveChild ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true">
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span className="truncate flex-1 text-left text-[12px]">{item.label}</span>
              <span className={`material-symbols-outlined text-[12px] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} text-on-surface-variant`}>
                chevron_right
              </span>
            </>
          )}
        </button>

        {/* Children (only when expanded and not collapsed) */}
        {!collapsed && isExpanded && item.children && (
          <div className="ml-3 pl-3 border-l-2 border-border/60">
            {item.children.map((child, idx) => {
              const isChildActive = isPathActive(child.path);
              const isLast = idx === (item.children?.length ?? 0) - 1;
              return (
                <div key={child.path} className="relative">
                  {/* Horizontal connector line */}
                  <div className="absolute left-[-13px] top-[14px] w-3 border-t-2 border-border/60" />
                  <Link
                    to={child.path}
                    onClick={() => { if (mobile && onClose) onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-left text-[12px] font-medium ${
                      isChildActive
                        ? 'bg-primary-container/30 text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                    aria-label={child.label}
                    aria-current={isChildActive ? 'page' : undefined}
                  >
                    <span className={`material-symbols-outlined text-[14px] ${isChildActive ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true">
                      {child.icon}
                    </span>
                    <span className="truncate">{child.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="mb-4">
        {!collapsed && (
          <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-outline select-none">
            {title}
          </p>
        )}
        <div className="space-y-0.5">
          {items.map(renderNavItem)}
        </div>
      </div>
    );
  };

  const sidebarWidth = collapsed && !mobile ? 'w-[56px]' : 'w-60';

  return (
    <aside
      className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} h-full flex-col shrink-0 rounded-2xl bg-surface shadow-[0_1px_3px_0_rgb(0,0,0/0.04),0_1px_2px_-1px_rgb(0,0,0/0.04)] border border-border/60 overflow-hidden antialiased ${sidebarWidth} ${
        mobile ? 'slide-in-left w-64 rounded-none' : 'transition-all duration-300'
      }`}
    >
      {mobile && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`relative z-10 flex flex-col h-full ${mobile ? 'w-64 shadow-2xl' : ''} ${collapsed && !mobile ? 'py-3 px-1.5' : 'py-4 px-3'}`}
        {...(mobile ? swipeHandlers : {})}
      >
        {/* Brand Header + Collapse Toggle */}
        <div className={`mb-4 ${collapsed && !mobile ? 'flex flex-col items-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            {(!collapsed || mobile) && (
              <div className="flex-1 min-w-0">
                <h1 className="text-[13px] font-bold text-on-surface tracking-tight truncate leading-tight">
                  Kinetic CRM
                </h1>
                <p className="text-[8px] text-outline uppercase tracking-widest font-medium">
                  Operasi Perusahaan
                </p>
              </div>
            )}
            {/* Collapse toggle - right side of header */}
            {!mobile && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center w-6 h-6 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-all duration-200 shrink-0"
                aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
                title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              >
                <span className="material-symbols-outlined text-[16px] transition-transform duration-300">
                  {collapsed ? 'keyboard_double_arrow_right' : 'chevron_left'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Active Department Badge */}
        {(!collapsed || mobile) && deptName && (
          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-container/30 rounded-xl border border-primary/10">
              <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[12px]">business</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-primary truncate">{deptName}</p>
                <p className="text-[8px] text-outline uppercase tracking-wider font-medium">{deptCode}</p>
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
            <div className="mb-3">
              <button
                onClick={() => setShowDeptSwitch(!showDeptSwitch)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] text-outline hover:text-on-surface transition-colors font-medium"
              >
                <span>Ganti Department</span>
                <span className="material-symbols-outlined text-[14px]">
                  {showDeptSwitch ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {showDeptSwitch && (
                <div className="mt-1 space-y-0.5">
                  {otherDepts.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        useAuthStore.getState().setActiveDepartment(dept.id);
                        setShowDeptSwitch(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[12px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                      <div className="w-4 h-4 rounded-lg bg-surface-container-low flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-on-surface-variant">business</span>
                      </div>
                      <span className="truncate">{dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Navigation list - sections */}
        <nav ref={navListRef} className="flex-1 overflow-y-auto scrollbar-none" aria-label="Navigasi sidebar" role="list" onKeyDown={onNavKeyDown}>
          {/* Render sections */}
          {Object.entries(SECTION_MAP).map(([key, section]) =>
            renderSection(section.title, sectionedItems[key] || [])
          )}
        </nav>

        {/* Bottom menu */}
        <div className="mt-auto pt-2 border-t border-border/60 space-y-0.5">
          {/* Bottom nav items (e.g. Konfigurasi) */}
          {bottomItems.map(renderNavItem)}

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title={collapsed && !mobile ? 'Keluar' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-danger hover:bg-danger-container/20 transition-all duration-200 text-left text-[12px] font-medium cursor-pointer touch-min-h ${
                collapsed && !mobile ? 'justify-center px-0' : ''
              }`}
              aria-label="Keluar"
            >
              <span className="material-symbols-outlined text-[16px] shrink-0">logout</span>
              {(!collapsed || mobile) && <span>Keluar</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
