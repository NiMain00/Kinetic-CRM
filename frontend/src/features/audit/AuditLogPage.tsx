import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import apiClient from '@/services/api-client';
import type { AuditLogEntry } from '@/types/domain/users';

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
    case 'Medium': return 'text-gold bg-gold/10';
    default: return 'text-info bg-info/10';
  }
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    apiClient.get('/master/auditLogs', { params: { perPage: 100 } })
      .then((res: any) => {
        const raw = res.data?.data ?? res.data ?? [];
        const mapped: AuditLogEntry[] = raw.map((item: any) => ({
          id: item.id,
          timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-',
          actor: item.actorName || item.actor || '-',
          actorInitials: item.actorInitials || (item.actorName ? item.actorName.charAt(0).toUpperCase() : '?'),
          action: item.action || 'UNKNOWN',
          entityType: item.entityType || '-',
          entityId: item.entityId || '-',
          entityName: item.entityName || item.entityType || '-',
          summary: item.summary || '-',
          before: item.payloadBefore || undefined,
          after: item.payloadAfter || undefined,
          ipAddress: item.ipAddress || undefined,
          impact: (item.impact === 'High' || item.impact === 'Medium') ? item.impact : 'Low',
        }));
        setLogs(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <div className="overflow-x-auto scrollbar-none table-mobile-compact">
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
                  <td colSpan={7} className="px-6 py-12 text-center text-outline text-sm">{loading ? 'Memuat...' : 'Tidak ada log yang ditemukan'}</td>
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
