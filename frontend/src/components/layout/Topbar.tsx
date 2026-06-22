import React from 'react';

interface TopbarProps {
  userName?: string;
  roleName?: string;
  avatarUrl?: string;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onMenuClick?: () => void;
  notificationCount?: number;
}

export default function Topbar({
  userName = 'Alexander Pierce',
  roleName = 'Branch Manager',
  avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDEhx9DDyQcza1Ly6ob2GvUr0RcKFg_ZWPWDX3R89h599PQ2OzX6K21-q2Bb6wr08y-sjWBdJ0UmyRJEjaEB7mRRTEILqTd1oApCKVAcFeJesIsCQ52_trToPbTyXHoo1Ed8D8c6Z0inMzS44qG749ofXtaBpSw-btx_MFUMYLzJsAg_aaXXLqufa_N2Jw2s6ca5NfTPTnJJf0CH5RFHVv38b591w568UukqO4CLBCdt0GAI6TWz8IG_d8Fg4dMoJ1zEMVwF3E3rs',
  onNotificationsClick,
  onProfileClick,
  onMenuClick,
  notificationCount = 3,
}: TopbarProps) {
  return (
    <header className="w-full h-16 bg-surface sticky top-0 z-40 border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center transition-all cursor-pointer"
          aria-label="Toggle sidebar menu"
        >
          <span className="material-symbols-outlined text-on-surface">menu</span>
        </button>

        <div className="relative group w-full max-w-md hidden sm:block">
          <span className="absolute inset-y-0 left-3 flex items-center text-outline">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-body-main text-sm outline-none"
            placeholder="Cari proyek, prospek, approval..."
            type="text"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notification Bell */}
        <button
          onClick={onNotificationsClick}
          className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center transition-all relative cursor-pointer"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
        >
          <span className="material-symbols-outlined text-on-surface">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-danger rounded-full ring-2 ring-surface flex items-center justify-center text-[8px] text-white font-extrabold">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Global Settings Gear */}
        <button className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center transition-all cursor-pointer" aria-label="Settings">
          <span className="material-symbols-outlined text-on-surface">settings</span>
        </button>

        <div className="h-8 w-[1px] bg-border mx-1 lg:mx-2"></div>

        {/* User Card */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-3 hover:bg-slate-100 p-1.5 rounded-lg transition-all text-left cursor-pointer outline-none"
          aria-label="User profile"
        >
          <div className="text-right hidden sm:block">
            <p className="font-label-sm text-label-sm text-on-surface leading-none font-bold">{userName}</p>
            <p className="font-caption-xs text-caption-xs text-outline mt-1">{roleName}</p>
          </div>
          <img
            className="w-10 h-10 rounded-full border border-border object-cover"
            alt="User profile photo"
            src={avatarUrl}
            referrerPolicy="no-referrer"
          />
        </button>
      </div>
    </header>
  );
}
