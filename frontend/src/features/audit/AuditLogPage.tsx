import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import type { AuditLogEntry } from '@/types/domain/users';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'aud-001', timestamp: '2026-06-22 08:30:00', actor: 'Ahmad Sulistyo', actorInitials: 'AS', action: 'CREATE', entityType: 'Project', entityId: 'PR-2026-001', entityName: 'Data Center Expansion', summary: 'Membuat proyek baru', before: '', after: '{"name":"Data Center Expansion"}', ipAddress: '192.168.1.100', impact: 'Medium' },
  { id: 'aud-002', timestamp: '2026-06-22 08:15:00', actor: 'Bambang Permadi', actorInitials: 'BP', action: 'UPDATE', entityType: 'RKS', entityId: 'RKS-2026-001', entityName: 'RKS Data Center', summary: 'Memperbarui dokumen RKS', before: '{"status":"draft"}', after: '{"status":"submitted"}', ipAddress: '192.168.1.101', impact: 'High' },
  { id: 'aud-003', timestamp: '2026-06-21 16:45:00', actor: 'Siti Aminah', actorInitials: 'SA', action: 'APPROVE', entityType: 'Prospek', entityId: 'PR-2023-08-001', entityName: 'Modernization of Data Center Jakarta', summary: 'Menyetujui prospek', before: '{"status":"waiting_pm_approval"}', after: '{"status":"approved"}', ipAddress: '192.168.1.102', impact: 'High' },
  { id: 'aud-004', timestamp: '2026-06-21 14:20:00', actor: 'Doni Wahyudi', actorInitials: 'DW', action: 'LOGIN', entityType: 'Session', entityId: 'SES-001', entityName: 'User Session', summary: 'Login ke sistem', before: '', after: '', ipAddress: '192.168.1.200', impact: 'Low' },
  { id: 'aud-005', timestamp: '2026-06-21 11:30:00', actor: 'Rina Marlina', actorInitials: 'RM', action: 'DELETE', entityType: 'Document', entityId: 'DOC-001', entityName: 'old_report_v2.pdf', summary: 'Menghapus dokumen', before: '{"file":"old_report_v2.pdf"}', after: '', ipAddress: '192.168.1.103', impact: 'Medium' },
  { id: 'aud-006', timestamp: '2026-06-21 10:00:00', actor: 'Eko Prasetyo', actorInitials: 'EP', action: 'REVISE', entityType: 'LPHS', entityId: 'LPHS-001', entityName: 'LPHS Site Survey', summary: 'Merevisi LPHS', before: '{"status":"reviewed"}', after: '{"status":"revision"}', ipAddress: '192.168.1.104', impact: 'High' },
  { id: 'aud-007', timestamp: '2026-06-20 09:15:00', actor: 'Andi Wijaya', actorInitials: 'AW', action: 'UPLOAD', entityType: 'Document', entityId: 'DOC-002', entityName: 'blueprint_v3.pdf', summary: 'Mengunggah dokumen baru', before: '', after: '{"file":"blueprint_v3.pdf","size":"4.2MB"}', ipAddress: '192.168.1.105', impact: 'Low' },
  { id: 'aud-008', timestamp: '2026-06-20 08:00:00', actor: 'Dewi Sartika', actorInitials: 'DS', action: 'REJECT', entityType: 'Approval', entityId: 'APPR-001', entityName: 'Approval Budget', summary: 'Menolak approval anggaran', before: '{"status":"pending"}', after: '{"status":"rejected"}', ipAddress: '192.168.1.106', impact: 'High' },
];

const actionVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default' | 'purple'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  APPROVE: 'success',
  REJECT: 'danger',
  REVISE: 'warning',
  UPLOAD: 'info',
  LOGIN: 'default',
  LOGOUT: 'default',
};

const impactColor = (impact: string) => {
  switch (impact) {
    case 'High': return 'text-danger bg-danger/10';
    case 'Medium': return 'text-warning bg-warning/10';
    default: return 'text-info bg-info/10';
  }
};

export default function AuditLogPage() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch = !search || log.actor.toLowerCase().includes(q) || log.entityName.toLowerCase().includes(q) || log.summary.toLowerCase().includes(q);
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const matchImpact = impactFilter === 'all' || log.impact === impactFilter;
    return matchSearch && matchAction && matchImpact;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Log Audit</h2>
          <p className="text-secondary font-body-main mt-1">Melacak semua aktivitas dan perubahan dalam sistem</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">file_download</span>}>
          Ekspor Log
        </Button>
      </div>

      <Card padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Cari aktor, entitas, atau aktivitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<span className="material-symbols-outlined">search</span>}
          />
          <Select
            label="Aksi"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Aksi' },
              { value: 'CREATE', label: 'Buat' },
              { value: 'UPDATE', label: 'Perbarui' },
              { value: 'DELETE', label: 'Hapus' },
              { value: 'APPROVE', label: 'Setujui' },
              { value: 'REJECT', label: 'Tolak' },
              { value: 'REVISE', label: 'Revisi' },
              { value: 'UPLOAD', label: 'Unggah' },
              { value: 'LOGIN', label: 'Masuk' },
              { value: 'LOGOUT', label: 'Keluar' },
            ]}
          />
          <Select
            label="Dampak"
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Dampak' },
              { value: 'Low', label: 'Rendah' },
              { value: 'Medium', label: 'Sedang' },
              { value: 'High', label: 'Tinggi' },
            ]}
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto table-mobile-compact">
          <table className="w-full text-left text-sm table-auto">
            <thead>
              <tr className="bg-surface-container-low border-b border-border">
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Aktor</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Aksi</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Entitas</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Ringkasan</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Dampak</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-outline text-sm">Tidak ada log yang ditemukan</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-xs text-outline font-mono">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold avatar-compact">{log.actorInitials}</span>
                        <span className="font-medium text-on-surface text-xs">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant={actionVariant[log.action] || 'default'} size="sm">{log.action}</Badge></td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-on-surface font-medium">{log.entityName}</p>
                      <p className="text-[10px] text-outline">{log.entityType}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-secondary max-w-[250px] truncate">{log.summary}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold badge-compact ${impactColor(log.impact)}`}>{log.impact}</span></td>
                    <td className="px-6 py-4 text-[10px] text-outline font-mono">{log.ipAddress || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-xs text-outline">
        <span>Menampilkan {filtered.length} dari {logs.length} log</span>
      </div>
    </div>
  );
}
