import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui';

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Pelanggan', path: '/master-data/customers', icon: 'groups' },
  { label: 'Kompetitor', path: '/master-data/competitors', icon: 'factory' },
  { label: 'Kategori Proyek', path: '/master-data/categories', icon: 'folder' },
  { label: 'Tipe Dokumen', path: '/master-data/document-types', icon: 'description' },
  { label: 'Pertanyaan', path: '/master-data/questions', icon: 'list_alt' },
  { label: 'Hari Libur', path: '/master-data/holidays', icon: 'celebration' },
  { label: 'Alasan Kekalahan', path: '/master-data/loss-reasons', icon: 'sentiment_dissatisfied' },
  { label: 'Periode', path: '/master-data/periods', icon: 'calendar_month' },
];

export default function MasterDataLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">database</span>
              Data Master
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Pengelolaan data referensi terpusat untuk seluruh sistem.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-border shrink-0">
        <nav className="flex overflow-x-auto custom-scrollbar scrollbar-hide px-8" aria-label="Navigasi Data Master">
          {NAV_LINKS.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-secondary hover:text-primary hover:bg-slate-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-sm">{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}
