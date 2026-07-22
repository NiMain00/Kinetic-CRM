import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import GlobalSearch from '@/components/shared/GlobalSearch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const MOBILE_SEARCH_INDEX = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', category: 'Halaman' },
  { label: 'Analytics', path: '/analytics', icon: 'analytics', category: 'Analitik' },
  { label: 'Prospek', path: '/prospects', icon: 'person_search', category: 'CRM' },
  { label: 'Pipeline Prospek', path: '/prospects/pipeline', icon: 'linear_scale', category: 'CRM' },
  { label: 'Kualifikasi', path: '/prospects/qualification', icon: 'trending_up', category: 'CRM' },
  { label: 'Proyek', path: '/projects', icon: 'work', category: 'CRM' },
  { label: 'Pengadaan', path: '/procurement', icon: 'inventory_2', category: 'Operasional' },
  { label: 'Persetujuan', path: '/approvals', icon: 'how_to_reg', category: 'Alur Kerja' },
  { label: 'Laporan', path: '/reports', icon: 'pie_chart', category: 'Analitik' },
  { label: 'Kalender', path: '/reports/calendar', icon: 'calendar_today', category: 'Analitik' },
  { label: 'KPI', path: '/reports/kpi', icon: 'target', category: 'Analitik' },
  { label: 'Master Data', path: '/master-data', icon: 'layers', category: 'Admin' },
  { label: 'Notifikasi', path: '/notifications', icon: 'notifications', category: 'Sistem' },
  { label: 'Konfigurasi', path: '/config', icon: 'settings', category: 'Admin' },
  { label: 'Profil', path: '/profile', icon: 'person', category: 'Akun' },
];

interface TopbarProps {
  userName?: string;
  roleName?: string;
  avatarUrl?: string;
  notificationsTo?: string;
  profileTo?: string;
  configTo?: string;
  onMenuClick?: () => void;
  onHelpClick?: () => void;
  notificationCount?: number;
}

const Topbar = React.memo(function Topbar({
  userName = 'Alexander Pierce',
  roleName = 'Branch Manager',
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDEhx9DDyQcza1Ly6ob2GvUr0RcKFg_ZWPWDX3R89h599PQ2OzX6K21-q2Bb6wr08y-sjWBdJ0UmyRJEjaEB7mRRTEILqTd1oApCKVAcFeJesIsCQ52_trToPbTyXHoo1Ed8D8c6Z0inMzS44qG749ofXtaBpSw-btx_MFUMYLzJsAg_aaXXLqufa_N2Jw2s6ca5NfTPTnJJf0CH5RFHVv38b591w568UukqO4CLBCdt0GAI6TWz8IG_d8Fg4dMoJ1zEMVwF3E3rs=s96-c',
  notificationsTo,
  profileTo,
  configTo,
  onMenuClick,
  onHelpClick,
  notificationCount = 3,
}: TopbarProps) {
  const { dark, toggle } = useThemeStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const debouncedMobileQuery = useDebouncedValue(mobileQuery, 200);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const mobileResults = useMemo(() => {
    if (!debouncedMobileQuery.trim()) return [];
    const q = debouncedMobileQuery.toLowerCase();
    return MOBILE_SEARCH_INDEX.filter(
      (r) => r.label.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q),
    );
  }, [debouncedMobileQuery]);

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSearchOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileSearchOpen]);

  return (
    <header className="w-full h-12 sm:h-14 bg-surface flex items-center justify-between px-2 sm:px-4 lg:px-6 shrink-0 relative pb-[3px]">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0">
        {/* Hamburger menu - mobile & tablet */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 touch-min rounded-lg hover:bg-surface-container transition-all cursor-pointer active:scale-95"
          aria-label="Buka/tutup menu sidebar"
        >
          <span className="material-symbols-outlined text-on-surface text-lg sm:text-xl" aria-hidden="true">menu</span>
        </button>

        {/* Desktop search */}
        <div className="hidden md:block w-full max-w-md">
          <GlobalSearch />
        </div>

        {/* Mobile search trigger */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden flex items-center justify-center w-9 h-9 touch-min rounded-lg hover:bg-surface-container transition-all cursor-pointer ml-auto active:scale-95"
          aria-label="Buka pencarian"
        >
          <span className="material-symbols-outlined text-on-surface text-xl" aria-hidden="true">search</span>
        </button>

        {/* Mobile page title (shows current location hint) */}
        <span className="md:hidden text-sm font-semibold text-on-surface truncate max-w-[140px]" aria-hidden="true">
          Kinetic CRM
        </span>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1.5">
        {/* Notification Bell */}
        <Link
          to={notificationsTo || '#'}
          className="flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 rounded-lg hover:bg-surface-container transition-all relative cursor-pointer touch-min"
          aria-label={`Buka notifikasi${notificationCount > 0 ? `, ${notificationCount} belum dibaca` : ''}`}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg sm:text-xl" aria-hidden="true">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] bg-gold rounded-full ring-2 ring-surface px-1">
              <span className="text-[9px] leading-none text-white font-bold">{notificationCount > 99 ? '99+' : notificationCount}</span>
            </span>
          )}
        </Link>

        {/* Messages - hidden on small mobile */}
        <button
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-container transition-all cursor-pointer active:scale-95"
          aria-label="Pesan"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg sm:text-xl" aria-hidden="true">chat</span>
        </button>

        {/* Global Settings Gear - hidden on small mobile */}
        <Link
          to={configTo || '#'}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
          aria-label="Pengaturan"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg sm:text-xl" aria-hidden="true">settings</span>
        </Link>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
          aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-lg sm:text-xl" aria-hidden="true">{dark ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div className="h-5 sm:h-6 w-[1px] bg-border/60 mx-0.5 sm:mx-1.5"></div>

        {/* User Card */}
        <Link
          to={profileTo || '#'}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
          aria-label="Profil pengguna"
          title={userName}
        >
          <img
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-primary/10 object-cover"
            alt="Foto profil pengguna"
            src={avatarUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div
          ref={searchContainerRef}
          className="fixed inset-0 z-50 bg-surface md:hidden animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button
              onClick={() => { setMobileSearchOpen(false); setMobileQuery(''); }}
              className="flex items-center justify-center touch-min rounded-xl hover:bg-surface-container transition-all cursor-pointer"
              aria-label="Tutup pencarian"
            >
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            </button>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-outline">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input
                ref={searchInputRef}
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                className="bg-surface-container-low border border-border rounded-xl pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body-main text-sm outline-none"
                placeholder="Cari proyek, prospek, persetujuan..."
                type="text"
                aria-label="Cari"
              />
              {mobileQuery && (
                <button
                  onClick={() => setMobileQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  aria-label="Hapus"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-72px)]">
            {mobileQuery.trim() ? (
              mobileResults.length > 0 ? (
                <div className="p-2">
                  {mobileResults.map((r, i) => (
                    <Link
                      key={i}
                      to={r.path}
                      onClick={() => { setMobileSearchOpen(false); setMobileQuery(''); }}
                      className="w-full px-4 py-3 flex items-center gap-3 rounded-xl text-left hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-outline text-lg" aria-hidden="true">{r.icon || 'search'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{r.label}</p>
                        <p className="text-[10px] text-outline">{r.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2 block">search_off</span>
                  <p className="text-sm font-medium text-secondary">Tidak ada hasil</p>
                  <p className="text-xs text-outline mt-0.5">Coba kata kunci lain</p>
                </div>
              )
            ) : (
              <div className="p-4">
                <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-outline">Menu</p>
                {MOBILE_SEARCH_INDEX.slice(0, 8).map((r, i) => (
                  <Link
                    key={i}
                    to={r.path}
                    onClick={() => { setMobileSearchOpen(false); setMobileQuery(''); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 rounded-xl text-left hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg" aria-hidden="true">{r.icon}</span>
                    <span className="text-sm text-on-surface">{r.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
});

export default Topbar;
