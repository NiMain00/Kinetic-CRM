import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import GlobalSearch from '@/components/shared/GlobalSearch';

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

export default function Topbar({
  userName = 'Alexander Pierce',
  roleName = 'Branch Manager',
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDEhx9DDyQcza1Ly6ob2GvUr0RcKFg_ZWPWDX3R89h599PQ2OzX6K21-q2Bb6wr08y-sjWBdJ0UmyRJEjaEB7mRRTEILqTd1oApCKVAcFeJesIsCQ52_trToPbTyXHoo1Ed8D8c6Z0inMzS44qG749ofXtaBpSw-btx_MFUMYLzJsAg_aaXXLqufa_N2Jw2s6ca5NfTPTnJJf0CH5RFHVv38b591w568UukqO4CLBCdt0GAI6TWz8IG_d8Fg4dMoJ1zEMVwF3E3rs',
  notificationsTo,
  profileTo,
  configTo,
  onMenuClick,
  onHelpClick,
  notificationCount = 3,
}: TopbarProps) {
  const { dark, toggle } = useThemeStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    <header className="w-full h-12 sm:h-14 bg-surface flex items-center justify-between px-3 sm:px-4 lg:px-8 shrink-0 relative pb-[3px]">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex items-center justify-center w-8 h-8 touch-min rounded-lg hover:bg-surface-container transition-all cursor-pointer"
          aria-label="Buka/tutup menu sidebar"
        >
          <span className="material-symbols-outlined text-on-surface text-xl" aria-hidden="true">menu</span>
        </button>

        {/* Desktop search */}
        <div className="hidden md:block w-full max-w-md">
          <GlobalSearch />
        </div>

        {/* Mobile search icon */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden flex items-center justify-center w-8 h-8 touch-min rounded-lg hover:bg-surface-container transition-all cursor-pointer ml-auto"
          aria-label="Buka pencarian"
        >
          <span className="material-symbols-outlined text-on-surface text-xl" aria-hidden="true">search</span>
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <Link
          to={notificationsTo || '#'}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all relative cursor-pointer touch-min"
          aria-label={`Notifikasi${notificationCount > 0 ? `, ${notificationCount} belum dibaca` : ''}`}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl sm:text-[24px]" aria-hidden="true">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 bg-gold rounded-full ring-2 ring-surface px-1">
              <span className="text-[9px] leading-none text-white font-bold">{notificationCount > 99 ? '99+' : notificationCount}</span>
            </span>
          )}
        </Link>

        {/* Messages - hidden on small mobile */}
        <button
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all cursor-pointer touch-min"
          aria-label="Pesan"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl sm:text-[24px]" aria-hidden="true">chat</span>
        </button>

        {/* Global Settings Gear - hidden on small mobile */}
        <Link
          to={configTo || '#'}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all cursor-pointer touch-min"
          aria-label="Pengaturan"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl sm:text-[24px]" aria-hidden="true">settings</span>
        </Link>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all cursor-pointer touch-min"
          aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl sm:text-[24px]" aria-hidden="true">{dark ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <div className="h-5 w-[1px] bg-border/60 mx-1"></div>

        {/* User Card */}
        <Link
          to={profileTo || '#'}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all cursor-pointer touch-min"
          aria-label="Profil pengguna"
          title={userName}
        >
          <img
            className="w-7 h-7 rounded-full ring-2 ring-primary/10 object-cover"
            alt="Foto profil pengguna"
            src={avatarUrl}
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
              onClick={() => setMobileSearchOpen(false)}
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
                className="bg-surface-container-low border border-border rounded-xl pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body-main text-sm outline-none"
                placeholder="Cari proyek, prospek, persetujuan..."
                type="text"
                aria-label="Cari"
              />
            </div>
          </div>
          <div className="p-4 text-center text-outline text-sm mt-16">
            Ketik untuk mulai mencari...
          </div>
        </div>
      )}
    </header>
  );
}
