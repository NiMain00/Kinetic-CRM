import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { configNavItems, filterNavItems } from '@/routes/nav-items';
import { useAuthStore } from '@/stores/authStore';
import { useMasterDataStore } from '@/stores/masterDataStore';

export default function ConfigLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = useAuthStore((s) => s.user);
  const userRole = (user as { roleName?: string })?.roleName || '';
  const roles = useMasterDataStore((s) => s.roles);
  const roleConfig = roles.find((r) => r.name === userRole);
  const userPermissions = roleConfig?.permissions || [];
  const visibleItems = filterNavItems(configNavItems, userRole, userPermissions);

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden">
      <div className={`${sidebarOpen ? 'w-56' : 'w-0'} transition-all duration-300 shrink-0 overflow-hidden border-r border-border bg-white`}>
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Konfigurasi</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Pusat pengaturan sistem</p>
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
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
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
        <div className="bg-white border-b border-border px-4 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            <span className="material-symbols-outlined text-lg">{sidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="material-symbols-outlined text-[14px]">settings</span>
            <span>Configuration</span>
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
