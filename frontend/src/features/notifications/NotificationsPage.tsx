import React, { useState } from 'react';

interface NotificationsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigateToProject?: (projectId: string) => void;
}

interface AlertItem {
  id: string;
  type: 'Approval Required' | 'Revision Requested' | 'System Notice' | 'New Assignment';
  title: string;
  description: string;
  timeLabel: string;
  projectName?: string;
  sender?: string;
  read: boolean;
  color: string;
  icon: string;
}

export default function NotificationsView({ onShowNotification, onNavigateToProject }: NotificationsViewProps) {
  // Notification alert state
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'al-1',
      type: 'Approval Required',
      title: 'Budget Approval: Project Horizon 2024',
      description: 'The proposed marketing budget for Project Horizon has been submitted by Sarah Jenkins. Requires executive sign-off by EOD.',
      timeLabel: '2 mins ago',
      read: false,
      color: 'border-emerald-500 text-teal-600 bg-emerald-50/10',
      icon: 'fact_check'
    },
    {
      id: 'al-2',
      type: 'Revision Requested',
      title: 'Document Revision: Client Onboarding - AeroCorp',
      description: 'Legal department has flagged clause 4.2 in the Master Service Agreement. Please update the liability terms.',
      timeLabel: '45 mins ago',
      read: false,
      color: 'border-amber-500 text-amber-600 bg-amber-50/10',
      icon: 'edit_document'
    },
    {
      id: 'al-3',
      type: 'System Notice',
      title: 'Weekly System Maintenance Completed',
      description: 'Scheduled maintenance was successfully completed. New features for Dashboard Analytics are now active for all enterprise users.',
      timeLabel: '3 hours ago',
      read: true,
      color: 'border-slate-500 text-slate-500 bg-slate-50/20',
      icon: 'dns'
    },
    {
      id: 'al-4',
      type: 'New Assignment',
      title: 'New Prospect Assigned: Stellar Dynamics',
      description: 'A high-priority lead has been routed to your queue from the Midwest regional division. Initial contact expected within 24 hours.',
      timeLabel: 'Yesterday, 4:20 PM',
      read: false,
      color: 'border-indigo-500 text-teal-700 bg-indigo-50/10',
      icon: 'person_add'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [searchText, setSearchText] = useState('');
  
  // Filtering states
  const [filterTypes, setFilterTypes] = useState({
    approvals: true,
    revisions: true,
    system: true,
  });

  const handleMarkAsRead = (id: string) => {
    setAlerts(prev =>
      prev.map(a => {
        if (a.id === id) {
          if (!a.read) {
            onShowNotification('Notifikasi ditandai sebagai telah dibaca.', 'success');
          }
          return { ...a, read: true };
        }
        return a;
      })
    );
  };

  const handleMarkAllAsRead = () => {
    const unreadCount = alerts.filter(a => !a.read).length;
    if (unreadCount === 0) {
      onShowNotification('Semua notifikasi sudah dibaca.', 'warning');
      return;
    }
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    onShowNotification('Seluruh notifikasi berhasil ditandai sebagai telah dibaca.', 'success');
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts(prev => prev.filter(a => a.id !== id));
    onShowNotification('Pesan notifikasi berhasil diarsipkan dari feed utama.', 'success');
  };

  // Checkbox toggle helpers
  const handleToggleFilterType = (typeKey: 'approvals' | 'revisions' | 'system') => {
    setFilterTypes(prev => ({
      ...prev,
      [typeKey]: !prev[typeKey],
    }));
  };

  // Perform overall search and categories filters
  const filteredAlerts = alerts.filter(a => {
    // 1. Tab filter
    if (activeTab === 'unread' && a.read) return false;
    if (activeTab === 'read' && !a.read) return false;

    // 2. Search Text filter
    if (searchText) {
      const matchText = (a.title + ' ' + a.description + ' ' + a.type).toLowerCase();
      if (!matchText.includes(searchText.toLowerCase())) return false;
    }

    // 3. Type checkboxes
    if (a.type === 'Approval Required' && !filterTypes.approvals) return false;
    if (a.type === 'Revision Requested' && !filterTypes.revisions) return false;
    if (a.type === 'System Notice' && !filterTypes.system) return false;
    if (a.type === 'New Assignment' && !filterTypes.approvals) return false; // maps into approvals

    return true;
  });

  const unreadCount = alerts.filter(a => !a.read).length;
  const readCount = alerts.filter(a => a.read).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      
      {/* Search Header and Action line */}
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Workspace Live</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Alert Feed</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Notification Center
            {unreadCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} Unread
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Pantau seluruh persetujuan, permintaan revisi draf, serta pengumuman saringan sistem.</p>
        </div>

        {/* Global utility actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Cari pesan penting..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-border focus:bg-white rounded-lg text-xs leading-none"
            />
          </div>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">checklist</span>
            Mark All Read
          </button>
        </div>
      </div>

      {/* Grid Content layout */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Left filter side card column */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-white p-5 border border-border rounded-xl shadow-xs">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">View Categories</h3>
              
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-semibold ${
                    activeTab === 'all'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">all_inbox</span> All Feed
                  </span>
                  <span className="text-[10px] bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-600 font-bold">{alerts.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('unread')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-semibold ${
                    activeTab === 'unread'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">mark_as_unread</span> Unread Alerts
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-650 px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
                </button>

                <button
                  onClick={() => setActiveTab('read')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all text-left font-semibold ${
                    activeTab === 'read'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span> Read Logs
                  </span>
                  <span className="text-[10px] bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-500 font-bold">{readCount}</span>
                </button>
              </div>

              <hr className="my-5 border-border" />

              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3.5">Types Filter</h3>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={filterTypes.approvals}
                    onChange={() => handleToggleFilterType('approvals')}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Approvals &amp; Assigns</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={filterTypes.revisions}
                    onChange={() => handleToggleFilterType('revisions')}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Revision Requests</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={filterTypes.system}
                    onChange={() => handleToggleFilterType('system')}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>System Notices</span>
                </label>
              </div>

            </div>

            {/* Critical alert reminder */}
            <div className="bg-primary hover:brightness-110 text-white p-5 rounded-xl shadow-md overflow-hidden relative group transition-all">
              <div className="relative z-10">
                <h4 className="font-bold text-sm mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  Critical Escalations
                </h4>
                <p className="text-[11px] opacity-90 leading-relaxed mb-4">
                  Ada {unreadCount} persetujuan/anggaran mendesak yang menunggu tindakan otorisasi evaluasi komersial.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToProject) {
                      onNavigateToProject('PR-2025-001');
                    } else {
                      onShowNotification('Memuat draf instansi verifikasi Proyek Horizon.', 'success');
                    }
                  }}
                  className="text-xs bg-white text-primary font-extrabold px-4.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  Review Immediate <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
              <span className="material-symbols-outlined absolute -bottom-5 -right-5 text-7xl font-bold opacity-10 group-hover:scale-110 transition-transform duration-500">
                assignment_late
              </span>
            </div>

          </div>

          {/* Right main feed alerts column */}
          <div className="lg:col-span-9 space-y-4">
            
            {filteredAlerts.length === 0 ? (
              <div className="bg-white p-12 text-center border border-border rounded-xl shadow-xs text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">mail_outline</span>
                <p className="font-bold text-sm text-slate-600 mb-1">Tidak ada notifikasi dalam filter ini</p>
                <p className="text-xs">Ubah filter sebelah kiri atau perbarui kriteria pencarian Anda.</p>
              </div>
            ) : (
              filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleMarkAsRead(a.id)}
                  className={`border-l-4 rounded-xl shadow-xs border border-border transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${
                    a.read ? 'bg-slate-50/50 opacity-80' : 'bg-white'
                  } ${
                    a.type === 'Approval Required'
                      ? 'border-l-teal-600 border-l-[4px]'
                      : a.type === 'Revision Requested'
                      ? 'border-l-amber-500 border-l-[4px]'
                      : a.type === 'System Notice'
                      ? 'border-l-slate-400 border-l-[4px]'
                      : 'border-l-indigo-600 border-l-[4px]'
                  }`}
                >
                  <div className="p-5.5 flex items-start gap-4">
                    {/* Circle icon label */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      a.type === 'Approval Required'
                        ? 'bg-teal-50 text-teal-600'
                        : a.type === 'Revision Requested'
                        ? 'bg-amber-50 text-amber-600'
                        : a.type === 'System Notice'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{a.icon}</span>
                    </div>

                    {/* Content text */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                          a.type === 'Approval Required'
                            ? 'text-teal-600'
                            : a.type === 'Revision Requested'
                            ? 'text-amber-600'
                            : a.type === 'System Notice'
                            ? 'text-slate-500'
                            : 'text-indigo-600'
                        }`}>
                          {a.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.timeLabel}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mb-1">{a.title}</h4>
                      <p className="text-secondary text-xs leading-relaxed mb-3.5 pr-2">{a.description}</p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToProject) {
                              onNavigateToProject('PR-2025-001');
                            } else {
                              onShowNotification('Konteks dokumen atau proyek berhasil dimuat.', 'success');
                            }
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View Context <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        </button>

                        <div className="w-[3px] h-[3px] bg-slate-400 rounded-full"></div>

                        {!a.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(a.id);
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">check</span> Mark Read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Simple archive button on right hover or default */}
                    <button
                      onClick={(e) => handleArchive(a.id, e)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-150 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:opacity-100 pr-[1px] md:opacity-100"
                      title="Archive Notification"
                    >
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                    </button>

                  </div>
                </div>
              ))
            )}

            {/* Pagination footer */}
            <div className="pt-6 border-t border-border flex justify-between items-center text-[11px] text-slate-400">
              <p>Showing {filteredAlerts.length} of {alerts.length} inbox entries</p>
              <div className="flex gap-1.5">
                <button className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer font-bold">1</button>
                <button onClick={() => onShowNotification('Paginasi alert center tidak dimuat.', 'warning')} className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-border text-slate-500 shadow-xs cursor-pointer">2</button>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
