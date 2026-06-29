import React, { useState } from 'react';
import { exportCSV } from '@/utils/export';
import type { AuditLogEntry } from '../../types/domain/users';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-status-indigo/10 text-status-indigo',
  DELETE: 'bg-danger/10 text-danger',
  APPROVE: 'bg-emerald-50 text-emerald-700',
  REJECT: 'bg-red-50 text-red-600',
  REVISE: 'bg-warning/10 text-warning',
  UPLOAD: 'bg-status-teal/10 text-status-teal',
  LOGIN: 'bg-primary/10 text-primary',
  LOGOUT: 'bg-slate-100 text-slate-600',
};

const INITIAL_LOGS: AuditLogEntry[] = [
  { id: 'AUD-001', timestamp: '2026-06-22 09:15:32', actor: 'Eko Prasetyo', actorInitials: 'EP', action: 'CREATE', entityType: 'User', entityId: 'USR-009', entityName: 'Fajar Nugroho', summary: 'Membuat akun pengguna baru', before: undefined, after: '{"fullName":"Fajar Nugroho","role":"Staff","branch":"Makassar"}', ipAddress: '192.168.1.100', impact: 'Low' },
  { id: 'AUD-002', timestamp: '2026-06-22 08:45:12', actor: 'Doni Wahyudi', actorInitials: 'DW', action: 'UPDATE', entityType: 'Project', entityId: 'PR-2025-001', entityName: 'Infrastruktur Data Center', summary: 'Mengubah status proyek dari PENDING_REVIEW ke ACTIVE', before: '{"status":"PENDING_REVIEW","progress":45}', after: '{"status":"ACTIVE","progress":50}', ipAddress: '192.168.1.105', impact: 'Medium' },
  { id: 'AUD-003', timestamp: '2026-06-22 07:30:45', actor: 'Bambang Permadi', actorInitials: 'BP', action: 'APPROVE', entityType: 'RKS', entityId: 'RKS-89011-A', entityName: 'Pengadaan AC Central Lobby', summary: 'Menyetujui dokumen RKS untuk dilanjutkan ke tahap LPHS', before: '{"status":"PENDING_REVIEW"}', after: '{"status":"APPROVED","approved_by":"Bambang Permadi"}', ipAddress: '192.168.1.110', impact: 'High' },
  { id: 'AUD-004', timestamp: '2026-06-21 16:20:18', actor: 'Ahmad Sulistyo', actorInitials: 'AS', action: 'UPLOAD', entityType: 'Document', entityId: 'DOC-042', entityName: 'RKS_Technical_Draft_v2.pdf', summary: 'Mengunggah dokumen revisi teknis', before: undefined, after: '{"fileName":"RKS_Technical_Draft_v2.pdf","size":"6.2 MB","version":2}', ipAddress: '192.168.1.120', impact: 'Low' },
  { id: 'AUD-005', timestamp: '2026-06-21 14:10:55', actor: 'Siti Aminah', actorInitials: 'SA', action: 'REJECT', entityType: 'Prospek', entityId: 'PR-2023-08-015', entityName: 'IoT Sensor Network', summary: 'Menolak prospek karena spesifikasi teknis tidak sesuai', before: '{"status":"Waiting PM"}', after: '{"status":"Revision","reason":"Spesifikasi teknis tidak sesuai standar"}', ipAddress: '192.168.1.115', impact: 'Medium' },
  { id: 'AUD-006', timestamp: '2026-06-21 11:00:00', actor: 'Andi Wijaya', actorInitials: 'AW', action: 'LOGIN', entityType: 'Session', entityId: 'SESS-9821', entityName: 'Andi Wijaya', summary: 'Login ke sistem dari perangkat baru', before: undefined, after: '{"device":"Chrome/Windows","ip":"192.168.1.130"}', ipAddress: '192.168.1.130', impact: 'Low' },
  { id: 'AUD-007', timestamp: '2026-06-20 15:45:22', actor: 'System', actorInitials: 'SY', action: 'DELETE', entityType: 'Report', entityId: 'RPT-TEMP-01', entityName: 'Temporary Report', summary: 'Pembersihan otomatis laporan sementara', before: '{"report_name":"TMP_REPORT_01","created_at":"2026-06-18"}', after: 'null', ipAddress: 'system', impact: 'High' },
  { id: 'AUD-008', timestamp: '2026-06-20 10:30:10', actor: 'Dewi Sartika', actorInitials: 'DS', action: 'UPDATE', entityType: 'Pricing', entityId: 'PR-2025-002', entityName: 'FTTH Cluster Menteng 2', summary: 'Memperbarui harga penawaran dan margin', before: '{"value":1250000000,"margin":12.5}', after: '{"value":1180000000,"margin":11.8}', ipAddress: '192.168.1.140', impact: 'Medium' },
  { id: 'AUD-009', timestamp: '2026-06-19 09:05:33', actor: 'Rina Marlina', actorInitials: 'RM', action: 'REVISE', entityType: 'LPHS', entityId: 'SURV-902-B', entityName: 'Site K-902 Balikpapan', summary: 'Mengajukan revisi LPHS untuk koreksi data lapangan', before: '{"status":"SUBMITTED"}', after: '{"status":"REVISION","note":"Koreksi data luas bangunan"}', ipAddress: '192.168.1.125', impact: 'Medium' },
  { id: 'AUD-010', timestamp: '2026-06-19 08:00:00', actor: 'Eko Prasetyo', actorInitials: 'EP', action: 'LOGOUT', entityType: 'Session', entityId: 'SESS-9801', entityName: 'Eko Prasetyo', summary: 'Logout dari sistem', before: undefined, after: '{"session_duration":"4h 22m"}', ipAddress: '192.168.1.100', impact: 'Low' },
];

export default function AuditPage() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<'all' | 'Low' | 'Medium' | 'High'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.summary.toLowerCase().includes(searchQuery.toLowerCase()) || l.actor.toLowerCase().includes(searchQuery.toLowerCase()) || l.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesImpact = impactFilter === 'all' || l.impact === impactFilter;
    return matchesSearch && matchesAction && matchesImpact;
  });

  const handleOpenDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Audit Trail
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{logs.length} Events</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Jejak audit sistem untuk seluruh aktivitas pengguna dan perubahan data.</p>
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
        )} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs cursor-pointer shadow-xs">
          <span className="material-symbols-outlined text-[16px]">file_download</span> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input type="text" placeholder="Cari aktivitas, pelaku, atau entitas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none">
                <option value="all">Semua Aksi</option>
                {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={impactFilter} onChange={e => setImpactFilter(e.target.value as any)} className="bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none">
                <option value="all">Semua Impact</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <button onClick={() => { setSearchQuery(''); setActionFilter('all'); setImpactFilter('all'); toast.success('Filter direset.'); }} className="px-3 py-2 border border-border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Reset</button>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
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
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada audit log ditemukan.</td></tr>
                  ) : (
                    filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-mono text-slate-500">{l.timestamp}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${ACTION_COLORS[l.action] || ''}`}>{l.action}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 avatar-compact">{l.actorInitials}</div>
                            <span className="font-semibold text-slate-700">{l.actor}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{l.entityName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{l.entityType} • {l.entityId}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{l.summary}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${
                            l.impact === 'High' ? 'bg-danger/10 text-danger' : l.impact === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-500'
                          }`}>{l.impact}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleOpenDetail(l)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer btn-compact" title="Lihat Detail"><span className="material-symbols-outlined text-[18px] icon-compact">visibility</span></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-border flex justify-between items-center text-[10px] text-slate-400">
              <span>Showing {filteredLogs.length} of {logs.length} events</span>
              <span>Real-time audit stream (static demo)</span>
            </div>
          </div>
        </div>
      </div>

      {detailOpen && selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 animate-slide-in">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">Audit Event Detail</h3>
                <p className="text-[10px] text-slate-400 mt-1">ID: {selectedLog.id} • {selectedLog.timestamp}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{selectedLog.actorInitials}</div>
                <div>
                  <p className="font-bold text-slate-800">{selectedLog.actor}</p>
                  <p className="text-[10px] text-slate-400">IP: {selectedLog.ipAddress}</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${ACTION_COLORS[selectedLog.action] || ''}`}>{selectedLog.action}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-border"><p className="text-slate-400 uppercase font-mono text-[9px] mb-1">Entity Type</p><p className="font-bold text-slate-700">{selectedLog.entityType}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-border"><p className="text-slate-400 uppercase font-mono text-[9px] mb-1">Entity ID</p><p className="font-bold text-slate-700 font-mono">{selectedLog.entityId}</p></div>
              </div>

              <div><p className="font-bold text-slate-700 mb-1">Entity Name</p><p className="text-slate-600">{selectedLog.entityName}</p></div>
              <div><p className="font-bold text-slate-700 mb-1">Ringkasan</p><p className="text-slate-600">{selectedLog.summary}</p></div>

              <div className="space-y-2">
                <p className="font-bold text-slate-700">Data Sebelumnya (Before)</p>
                <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">{selectedLog.before || 'null'}</pre>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Data Sesudah (After)</p>
                <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">{selectedLog.after || 'null'}</pre>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 uppercase font-mono text-[9px]">Impact Level:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedLog.impact === 'High' ? 'bg-danger/10 text-danger' : selectedLog.impact === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-500'
                }`}>{selectedLog.impact}</span>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end">
              <button onClick={() => setDetailOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
