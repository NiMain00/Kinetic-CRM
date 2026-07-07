import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { exportCSV } from '@/utils/export';
import type { AuditLogEntry } from '../../types/domain/users';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-status-indigo/10 text-status-indigo',
  DELETE: 'bg-danger/10 text-danger',
  APPROVE: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
  REJECT: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  REVISE: 'bg-gold/10 text-gold',
  UPLOAD: 'bg-status-teal/10 text-status-teal',
  LOGIN: 'bg-primary/10 text-primary',
  LOGOUT: 'bg-surface-container text-on-surface-variant',
};

export default function AuditPage() {
  const [logs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredLogs = useMemo(() => logs.filter(l => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch = !q || l.summary.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q) || l.entityName.toLowerCase().includes(q);
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesImpact = impactFilter === 'all' || l.impact === impactFilter;
    return matchesSearch && matchesAction && matchesImpact;
  }), [logs, debouncedSearch, actionFilter, impactFilter]);

  const handleOpenDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface border-b border-border/60 px-4 sm:px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-card z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Audit Trail
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{logs.length} Events</span>
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Jejak audit sistem untuk seluruh aktivitas pengguna dan perubahan data.</p>
        </div>
        <button onClick={() => exportCSV(
          filteredLogs,
          [
            { header: 'Timestamp', accessor: (l) => l.timestamp },
            { header: 'Aktor', accessor: (l) => l.actor },
            { header: 'Aksi', accessor: (l) => l.action },
            { header: 'Entitas', accessor: (l) => `${l.entityType}: ${l.entityName}` },
            { header: 'Ringkasan', accessor: (l) => l.summary },
            { header: 'Dampak', accessor: (l) => l.impact },
          ],
          'audit_trail',
        )} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/60 bg-surface text-on-surface hover:bg-surface-container transition-colors font-semibold text-xs cursor-pointer shadow-xs">
          <span className="material-symbols-outlined text-[16px]">file_download</span> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input type="text" placeholder="Cari aktivitas, pelaku, atau entitas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-surface-container-lowest border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none">
                <option value="all">Semua Aksi</option>
                {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={impactFilter} onChange={e => setImpactFilter(e.target.value as any)} className="bg-surface-container-lowest border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none">
                <option value="all">Semua Impact</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <button onClick={() => { setSearchQuery(''); setActionFilter('all'); setImpactFilter('all'); toast.success('Filter direset.'); }} className="px-3 py-2 border border-border rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low cursor-pointer">Reset</button>
            </div>
          </div>

          <div className="bg-surface border border-border/60 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-secondary uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Aksi</th>
                    <th className="px-6 py-3.5">Pelaku</th>
                    <th className="px-6 py-3.5">Entitas</th>
                    <th className="px-6 py-3.5">Ringkasan</th>
                    <th className="px-6 py-3.5 text-center">Impact</th>
                    <th className="px-6 py-3.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-outline italic">Tidak ada audit log ditemukan.</td></tr>
                  ) : (
                    filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-surface-container/65 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-mono text-secondary">{l.timestamp}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${ACTION_COLORS[l.action] || ''}`}>{l.action}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-[9px] font-bold text-on-surface-variant avatar-compact">{l.actorInitials}</div>
                            <span className="font-semibold text-on-surface">{l.actor}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-on-surface">{l.entityName}</p>
                          <p className="text-[10px] text-outline font-mono">{l.entityType} • {l.entityId}</p>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate">{l.summary}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${
                            l.impact === 'High' ? 'bg-danger/10 text-danger' : l.impact === 'Medium' ? 'bg-gold/10 text-gold' : 'bg-surface-container text-secondary'
                          }`}>{l.impact}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleOpenDetail(l)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer btn-compact" title="Lihat Detail"><span className="material-symbols-outlined text-[18px] icon-compact">visibility</span></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-border flex justify-between items-center text-[10px] text-outline">
              <span>Showing {filteredLogs.length} of {logs.length} events</span>
              <span>Real-time audit stream (static demo)</span>
            </div>
          </div>
        </div>
      </div>

      {detailOpen && selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-surface h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-slide-in">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">Audit Event Detail</h3>
                <p className="text-[10px] text-outline mt-1">ID: {selectedLog.id} • {selectedLog.timestamp}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{selectedLog.actorInitials}</div>
                <div>
                  <p className="font-bold text-on-surface">{selectedLog.actor}</p>
                  <p className="text-[10px] text-outline">IP: {selectedLog.ipAddress}</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${ACTION_COLORS[selectedLog.action] || ''}`}>{selectedLog.action}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-surface-container-low rounded-lg border border-border"><p className="text-outline uppercase font-mono text-[9px] mb-1">Entity Type</p><p className="font-bold text-on-surface">{selectedLog.entityType}</p></div>
                <div className="p-3 bg-surface-container-low rounded-lg border border-border"><p className="text-outline uppercase font-mono text-[9px] mb-1">Entity ID</p><p className="font-bold text-on-surface font-mono">{selectedLog.entityId}</p></div>
              </div>

              <div><p className="font-bold text-on-surface mb-1">Entity Name</p><p className="text-on-surface-variant">{selectedLog.entityName}</p></div>
              <div><p className="font-bold text-on-surface mb-1">Ringkasan</p><p className="text-on-surface-variant">{selectedLog.summary}</p></div>

              <div className="space-y-2">
                <p className="font-bold text-on-surface">Data Sebelumnya (Before)</p>
                <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto scrollbar-none whitespace-pre-wrap">{selectedLog.before || 'null'}</pre>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-on-surface">Data Sesudah (After)</p>
                <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto scrollbar-none whitespace-pre-wrap">{selectedLog.after || 'null'}</pre>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-outline uppercase font-mono text-[9px]">Impact Level:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedLog.impact === 'High' ? 'bg-danger/10 text-danger' : selectedLog.impact === 'Medium' ? 'bg-gold/10 text-gold' : 'bg-surface-container text-secondary'
                }`}>{selectedLog.impact}</span>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end">
              <button onClick={() => setDetailOpen(false)} className="px-4 py-2 rounded-xl border border-border/60 bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
