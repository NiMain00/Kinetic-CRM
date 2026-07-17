import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/stores/notificationStore';

interface NotificationsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigateToProject?: (projectId: string) => void;
}

const TYPE_LABEL: Record<string, string> = {
  approval: 'Persetujuan',
  revision: 'Revisi',
  status_change: 'Perubahan Status',
  assignment: 'Penugasan Baru',
  system: 'Sistem',
};

export default function NotificationsView({ onShowNotification, onNavigateToProject }: NotificationsViewProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [searchText, setSearchText] = useState('');

  const [filterTypes, setFilterTypes] = useState({
    approval: true,
    revision: true,
    status_change: true,
    assignment: true,
    system: true,
  });

  const handleToggleFilterType = (key: 'approval' | 'revision' | 'status_change' | 'assignment' | 'system') => {
    setFilterTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 'unread' && n.read) return false;
      if (activeTab === 'read' && !n.read) return false;

      if (searchText) {
        const match = (n.title + ' ' + n.message + ' ' + TYPE_LABEL[n.type]).toLowerCase();
        if (!match.includes(searchText.toLowerCase())) return false;
      }

      if (!filterTypes[n.type]) return false;

      return true;
    });
  }, [notifications, activeTab, searchText, filterTypes]);

  const readCount = notifications.filter(n => n.read).length;

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(id);
    onShowNotification('Notifikasi berhasil diarsipkan.', 'success');
  };

  const formatTime = (createdAt: string) => {
    const now = new Date();
    const date = new Date(createdAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const typeBorderColor = (type: string) => {
    const map: Record<string, string> = {
      approval: 'border-l-teal-600',
      revision: 'border-l-amber-500',
      status_change: 'border-l-blue-500',
      assignment: 'border-l-indigo-600',
      system: 'border-l-outline',
    };
    return map[type] || 'border-l-outline';
  };

  const typeIconColor = (type: string) => {
    const map: Record<string, string> = {
      approval: 'bg-teal-50 text-teal-600',
      revision: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
      status_change: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
      assignment: 'bg-indigo-50 text-indigo-600',
      system: 'bg-surface-container-high text-outline',
    };
    return map[type] || 'bg-surface-container-high text-outline';
  };

  const typeTextColor = (type: string) => {
    const map: Record<string, string> = {
      approval: 'text-teal-600',
      revision: 'text-amber-600 dark:text-amber-400',
      status_change: 'text-blue-600 dark:text-blue-400',
      assignment: 'text-indigo-600',
      system: 'text-outline',
    };
    return map[type] || 'text-outline';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      {/* Search Header and Action line */}
      <div className="bg-surface border-b border-border/60 px-4 sm:px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-card z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Pusat Notifikasi
            {unreadCount > 0 && (
              <span className="text-xs bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Pantau seluruh persetujuan, permintaan revisi, dan perubahan status.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              placeholder="Cari notifikasi..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-border focus:bg-surface-container-lowest rounded-lg text-xs leading-none"
            />
          </div>

          <button
            onClick={() => {
              if (unreadCount === 0) {
                onShowNotification('Semua notifikasi sudah dibaca.', 'warning');
                return;
              }
              markAllAsRead();
              onShowNotification('Semua notifikasi ditandai telah dibaca.', 'success');
            }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/60 bg-surface text-secondary hover:bg-surface-container transition-colors font-semibold text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">checklist</span>
            Tandai Dibaca
          </button>
        </div>
      </div>

      {/* Grid Content layout */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 text-left">

          {/* Left filter side card column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface p-5 border border-border/60 rounded-2xl shadow-xs">
              <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider mb-4">Lihat</h3>

              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-semibold ${
                    activeTab === 'all'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-secondary hover:bg-surface-container-low'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">all_inbox</span> Semua
                  </span>
                  <span className="text-[10px] bg-surface-container-high/50 px-2 py-0.5 rounded-full text-secondary font-bold">{notifications.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('unread')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-semibold ${
                    activeTab === 'unread'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-secondary hover:bg-surface-container-low'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">mark_as_unread</span> Belum Dibaca
                  </span>
                  <span className="text-[10px] bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
                </button>

                <button
                  onClick={() => setActiveTab('read')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-semibold ${
                    activeTab === 'read'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-secondary hover:bg-surface-container-low'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span> Sudah Dibaca
                  </span>
                  <span className="text-[10px] bg-surface-container-high/50 px-2 py-0.5 rounded-full text-outline font-bold">{readCount}</span>
                </button>
              </div>

              <hr className="my-5 border-border" />

              <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider mb-3.5">Filter Tipe</h3>
              <div className="space-y-2.5">
                {Object.entries(TYPE_LABEL).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-secondary hover:text-on-surface">
                    <input
                      type="checkbox"
                      checked={filterTypes[key as keyof typeof filterTypes]}
                      onChange={() => handleToggleFilterType(key as keyof typeof filterTypes)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-primary hover:bg-primary-light text-white p-5 rounded-2xl shadow-md overflow-hidden relative group transition-all">
              <div className="relative z-10">
                <h4 className="font-bold text-sm mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">notifications</span>
                  Notifikasi Real-time
                </h4>
                <p className="text-[11px] opacity-90 leading-relaxed mb-4">
                  Anda akan menerima notifikasi secara otomatis saat ada prospek baru, permintaan approval, atau perubahan status proyek.
                </p>
              </div>
              <span className="material-symbols-outlined absolute -bottom-5 -right-5 text-7xl font-bold opacity-10 group-hover:scale-110 transition-transform duration-500">
                notifications_active
              </span>
            </div>
          </div>

          {/* Right main feed column */}
          <div className="lg:col-span-9 space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-surface p-12 text-center border border-border/60 rounded-2xl shadow-xs text-outline">
                <span className="material-symbols-outlined text-5xl mb-3 text-outline">notifications_off</span>
                <p className="font-bold text-sm text-secondary mb-1">Tidak ada notifikasi</p>
                <p className="text-xs">Tidak ada notifikasi yang sesuai dengan filter saat ini.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) {
                      markAsRead(n.id);
                    }
                    if (n.entityId && n.entityType) {
                      navigate(n.entityType === 'project' ? `/projects/${n.entityId}` : `/prospects/${n.entityId}`);
                    }
                  }}
                  className={`border-l-4 rounded-xl shadow-xs border border-border transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${
                    n.read                   ? 'bg-surface-container-low/50 opacity-80' : 'bg-surface'
                  } ${typeBorderColor(n.type)}`}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeIconColor(n.type)}`}>
                      <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${typeTextColor(n.type)}`}>
                          {TYPE_LABEL[n.type] || n.type}
                        </span>
                        <span className="text-[10px] text-outline font-mono">{formatTime(n.createdAt)}</span>
                      </div>

                      <h4 className="font-bold text-on-surface text-sm mb-1">{n.title}</h4>
                      <p className="text-secondary text-xs leading-relaxed mb-3 pr-2">{n.message}</p>

                      <div className="flex items-center gap-3">
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                              onShowNotification('Notifikasi ditandai telah dibaca.', 'success');
                            }}
                            className="text-[11px] font-semibold text-outline hover:text-on-surface flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">check</span> Tandai Dibaca
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleArchive(n.id, e)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
                      title="Arsipkan"
                    >
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-outline">
              <p>Menampilkan {filteredNotifications.length} dari {notifications.length} notifikasi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
