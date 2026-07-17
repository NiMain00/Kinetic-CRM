import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { configNavItems, filterNavItems } from '@/routes/nav-items';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { authz } from '@/services/authz';

function useSwipe(onClose?: () => void) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    if (dx < -60) onClose?.();
    touchStartRef.current = null;
  }, [onClose]);
  return { onTouchStart, onTouchEnd };
}

export default function ConfigLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const userRole = (user as { roleName?: string })?.roleName || '';
  const roles = useMasterDataStore((s) => s.roles);
  const roleConfig = roles.find((r) => r.name === userRole);
  const oldPermissions = roleConfig?.permissions || [];
  const userId = (user as { id?: string })?.id;
  const activeDeptId = useAuthStore((s) => s.activeDepartmentId) || (user as any)?.departmentId;
  const newRbacPerms = userId
    ? ['config:access'].filter((p) => authz.hasPermission(userId, p, { departmentId: activeDeptId }))
    : [];
  const userPermissions = [...new Set([...oldPermissions, ...newRbacPerms])];
  const visibleItems = filterNavItems(configNavItems, userRole, userPermissions);
  const swipeHandlers = useSwipe(() => setMobileOpen(false));

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('body-scroll-lock');
    }
    return () => { document.body.classList.remove('body-scroll-lock'); };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider">Konfigurasi</h3>
        <p className="text-[10px] text-outline mt-0.5">Pusat pengaturan sistem</p>
      </div>
      <nav className="p-2 space-y-0.5 overflow-y-auto flex-1" aria-label="Konfigurasi navigasi">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden">
      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative z-10 w-64 bg-surface flex flex-col shadow-2xl slide-in-left"
            {...swipeHandlers}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col ${sidebarOpen ? 'w-56' : 'w-0'} transition-all duration-300 shrink-0 overflow-hidden border-r border-border bg-surface-container-lowest`}>
        {sidebarContent}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-surface-container-lowest border-b border-border px-4 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => { window.innerWidth < 768 ? setMobileOpen(v => !v) : setSidebarOpen(v => !v); }}
            className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors cursor-pointer md:hidden"
            aria-label="Buka sidebar navigasi"
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors cursor-pointer hidden md:flex"
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            <span className="material-symbols-outlined text-lg">{sidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-outline">
            <span className="material-symbols-outlined text-[14px]">settings</span>
            <span>Konfigurasi</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-semibold">
              {visibleItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
