import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { configNavItems, filterNavItems } from '@/routes/nav-items';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { authz } from '@/services/authz';

export default function ConfigLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden">
      <div className={`${sidebarOpen ? 'w-56' : 'w-0'} transition-all duration-300 shrink-0 overflow-hidden border-r border-border bg-surface-container-lowest`}>
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider">Konfigurasi</h3>
          <p className="text-[10px] text-outline mt-0.5">Pusat pengaturan sistem</p>
        </div>
        <nav className="p-2 space-y-0.5 overflow-y-auto" aria-label="Konfigurasi navigasi">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigasi ke ${item.label}`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-surface-container-lowest border-b border-border px-4 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-surface-container text-secondary transition-colors cursor-pointer"
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
