import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { navItems, filterNavItems, type NavItem } from '@/routes/nav-items';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  activeTab,
  setActiveTab,
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
  const allowedNavItems = useMemo(() => filterNavItems(navItems, userRole, userPermissions), [userRole, userPermissions]);
  const swipeHandlers = useSwipe(onClose);

  useEffect(() => {
    if (mobile) {
      document.body.classList.add('body-scroll-lock');
    }
    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [mobile]);

  const handleNavigate = (path: string) => {
    setActiveTab(path);
    if (mobile && onClose) onClose();
  };

  const isPathActive = (itemPath: string): boolean => {
    if (activeTab === itemPath) return true;
    const activeSeg = activeTab.split('/')[1];
    const itemSeg = itemPath.split('/')[1];
    if (activeSeg === 'project' && itemSeg === 'projects') return true;
    if (itemPath !== '/' && activeTab.startsWith(itemPath + '/')) {
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
    const buttons = navListRef.current?.querySelectorAll<HTMLButtonElement>('button');
    if (!buttons || buttons.length === 0) return;
    const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    let next: number;
    if (e.key === 'ArrowDown') next = (idx + 1) % buttons.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + buttons.length) % buttons.length;
    else return;
    e.preventDefault();
    buttons[next].focus();
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isPathActive(item.path);
    const badge = item.label === 'Persetujuan' ? pendingApprovalsCount : item.label === 'Notifikasi' ? unreadCount : undefined;

    return (
      <button
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-label-sm text-label-sm touch-min-h ${
          isActive
            ? 'bg-primary-container/20 text-primary font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }`}
        aria-label={item.label}
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
      </button>
    );
  };

  return (
    <aside
      className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} h-screen flex-col bg-surface border-r border-border shrink-0 ${
        collapsed ? (mobile ? 'w-72' : 'w-20') : 'w-72'
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
        className={`relative z-10 flex flex-col h-full py-6 ${mobile ? 'w-72 shadow-2xl' : ''}`}
        {...(mobile ? swipeHandlers : {})}
      >
        {/* Brand Header */}
        <div className={`px-6 mb-8 transition-opacity duration-200 ${collapsed && !mobile ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-2xl">K</span>
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

        {/* Navigation list */}
        <nav ref={navListRef} className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Navigasi sidebar" role="list" onKeyDown={onNavKeyDown}>
          {allowedNavItems.map(renderNavItem)}
        </nav>

        {/* Logout button */}
        {onLogout && (
          <div className="px-3 mb-2">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger-container/20 transition-all text-left font-label-sm text-label-sm cursor-pointer touch-min-h ${
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
              className="w-full flex items-center justify-center gap-2 py-2.5 text-outline font-label-sm text-label-sm border border-border rounded-xl hover:bg-surface-container hover:text-on-surface-variant transition-all touch-min-h"
              aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              <span className="material-symbols-outlined text-lg transition-transform duration-300">
                {collapsed ? 'keyboard_double_arrow_right' : 'chevron_left'}
              </span>
              {!collapsed && <span>Ciutkan Menu</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
