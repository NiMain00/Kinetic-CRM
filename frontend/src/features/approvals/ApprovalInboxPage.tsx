import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '@/components/ui';
import { PageContainer, PageHeader } from '@/components/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ApprovalItem, SlaConfig } from '../../types/domain';
import { useApprovalStore } from '@/stores/approvalStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSlaConfigs, useNextPhaseMap } from '@/hooks/useConfigData';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import MentionTextarea from '@/components/shared/MentionTextarea';
import { formatRelativeTime } from '@/utils/formatters';

interface ApprovalInboxViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

type FilterType = 'Semua' | 'Prospek' | 'RKS' | 'LPHS';

function parseSlaConfig(type: string, slaConfigs: SlaConfig[]): { critH: number; warnH: number } | null {
  const entityMap: Record<string, SlaConfig['entityType']> = { Prospek: 'prospek', RKS: 'rks', LPHS: 'lphs' };
  const config = slaConfigs.find(s => s.entityType === entityMap[type] && s.active);
  if (!config) return null;
  const critH = config.unit === 'days' ? config.criticalThreshold * 24 : config.criticalThreshold;
  const warnH = config.unit === 'days' ? config.warningThreshold * 24 : config.warningThreshold;
  return { critH, warnH };
}

export default function ApprovalInboxView({
  onShowNotification,
}: ApprovalInboxViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { approvals, approvalHistory, approveItem, rejectItem } = useApprovalStore();
  const { prospects, updateProspect } = useProspectStore();
  const { projects, updateProject } = useProjectStore();
  const slaConfigs = useSlaConfigs();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const NEXT_PHASE_MAP = useNextPhaseMap();
  const user = useAuthStore((s) => s.user);
  const [filterType, setFilterType] = React.useState<FilterType>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = React.useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isBulkReject, setIsBulkReject] = useState(false);
  const allUsers = useUserStore((s) => s.users);
  const mentionUsers = useMemo(
    () => allUsers.map((u) => ({ id: u.id, name: u.fullName, role: u.role })),
    [allUsers],
  );
  const currentUserId = user?.id || '';

  const userApprovals = user?.id ? approvals.filter((a) => a.assigneeUserId === user.id) : [];

  const computeSlaStatus = (waitingSince: string, type: string): 'Overdue' | 'Near Deadline' | 'Normal' => {
    const sla = parseSlaConfig(type, slaConfigs);
    if (!sla) return 'Normal';
    const elapsedHours = (Date.now() - new Date(waitingSince).getTime()) / 3_600_000;
    if (elapsedHours >= sla.critH) return 'Overdue';
    if (elapsedHours >= sla.warnH) return 'Near Deadline';
    return 'Normal';
  };

  const filteredApprovals = useMemo(() => {
    const validApprovals = userApprovals.filter((a) => {
      if (a.entityType === 'prospect' && a.entityId) {
        return prospects.some((p) => p.id === a.entityId);
      }
      if (a.entityType === 'project' && a.entityId) {
        return projects.some((p) => p.id === a.entityId);
      }
      return true;
    });
    const typeFiltered = filterType === 'Semua' ? validApprovals : validApprovals.filter((a) => a.type === filterType);
    if (!searchQuery.trim()) return typeFiltered;
    const q = searchQuery.toLowerCase();
    return typeFiltered.filter(
      (a) => a.name.toLowerCase().includes(q) || a.ref.toLowerCase().includes(q),
    );
  }, [userApprovals, filterType, searchQuery, prospects, projects]);

  const handleReview = (item: ApprovalItem) => {
    if (item.entityType === 'prospect' && item.entityId) {
      navigate(`/prospects/${item.entityId}`);
    } else if (item.entityType === 'project' && item.entityId) {
      const tabMap: Record<string, string> = {
        'RKS': 'review-rks',
        'LPHS': 'lphs',
      };
      const tab = tabMap[item.type] || 'overview';
      navigate(`/project/${item.entityId}/${tab}`);
    }
  };

  const handleInlineApprove = (item: ApprovalItem) => {
    approveItem(item.id);
    if (item.entityType === 'prospect' && item.entityId) {
      const prospect = prospects.find(p => p.id === item.entityId);
      if (prospect) {
        updateProspect(item.entityId, { status: 'Approved' });
        onShowNotification(`Prospek "${prospect.name}" berhasil disetujui.`, 'success');
      }
    } else if (item.entityType === 'project' && item.entityId) {
      const project = projects.find(p => p.id === item.entityId);
      if (project) {
        const next = NEXT_PHASE_MAP[project.status];
        if (next) {
          updateProject(item.entityId, next);
          onShowNotification(`Proyek "${project.name}" maju ke fase "${next.status}".`, 'success');
        } else {
          onShowNotification(`Proyek "${project.name}" sudah di fase terakhir.`, 'warning');
        }
      }
    }
    addNotification({
      title: `${item.type} Disetujui`,
      message: `${item.type} "${item.name}" telah disetujui dari Approval Inbox.`,
      type: 'approval',
      entityId: item.entityId,
      entityType: item.entityType,
    });
  };

  const handleInlineReject = (item: ApprovalItem) => {
    setRejectTarget(item);
    setRejectReason('');
    setIsBulkReject(false);
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    const item = rejectTarget;
    rejectItem(item.id);
    if (item.entityType === 'prospect' && item.entityId) {
      const prospect = prospects.find(p => p.id === item.entityId);
      if (prospect) {
        updateProspect(item.entityId, { status: 'Revision' });
        onShowNotification(`Prospek "${prospect.name}" dikembalikan untuk revisi.`, 'error');
      }
    } else if (item.entityType === 'project' && item.entityId) {
      const project = projects.find(p => p.id === item.entityId);
      if (project) {
        updateProject(item.entityId, { status: 'Revision' });
        onShowNotification(`Proyek "${project.name}" dikembalikan untuk revisi.`, 'error');
      }
    }
    const reasonSuffix = rejectReason.trim() ? ` Alasan: ${rejectReason.trim()}` : '';
    addNotification({
      title: `${item.type} Revisi`,
      message: `${item.type} "${item.name}" ditolak dan memerlukan revisi.${reasonSuffix}`,
      type: 'revision',
      entityId: item.entityId,
      entityType: item.entityType,
    });
    setRejectTarget(null);
    setRejectReason('');
  };

  const isAllSelected = filteredApprovals.length > 0 && filteredApprovals.every((a) => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApprovals.map((a) => a.id)));
    }
  };

  const handleBulkApprove = () => {
    selectedIds.forEach((id) => {
      const item = approvals.find((a) => a.id === id);
      if (item) handleInlineApprove(item);
    });
    setSelectedIds(new Set());
  };

  const handleBulkReject = () => {
    const first = approvals.find((a) => selectedIds.has(a.id));
    if (first) {
      setRejectTarget(first);
      setRejectReason('');
      setIsBulkReject(true);
    }
  };

  const confirmBulkReject = () => {
    if (!rejectTarget) return;
    selectedIds.forEach((id) => {
      const item = approvals.find((a) => a.id === id);
      if (item) {
        rejectItem(item.id);
        const reasonSuffix = rejectReason.trim() ? ` Alasan: ${rejectReason.trim()}` : '';
        addNotification({
          title: `${item.type} Revisi`,
          message: `${item.type} "${item.name}" ditolak dan memerlukan revisi.${reasonSuffix}`,
          type: 'revision',
          entityId: item.entityId,
          entityType: item.entityType,
        });
      }
    });
    setRejectTarget(null);
    setRejectReason('');
    setSelectedIds(new Set());
  };

  const prospekApprovals = filteredApprovals.filter((a) => a.type === 'Prospek');
  const rksApprovals = filteredApprovals.filter((a) => a.type === 'RKS');
  const lphsApprovals = filteredApprovals.filter((a) => a.type === 'LPHS');

  const slaBadgeClass = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-danger/10 text-danger';
      case 'Near Deadline': return 'bg-warning/10 text-warning';
      default: return 'bg-success/10 text-success';
    }
  };

  const filterButtonClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-caption-xs font-semibold touch-min-h whitespace-nowrap transition-all ${
      active
        ? 'bg-primary text-on-primary'
        : 'bg-surface-container-lowest border border-border text-on-surface hover:bg-surface-variant'
    }`;

  const renderApprovalCard = (row: ApprovalItem) => (
    <div
      key={row.id}
      className={`bg-surface-container-lowest border border-border rounded-xl p-4 space-y-3 active:scale-[0.99] transition-transform ${selectedIds.has(row.id) ? 'ring-2 ring-primary/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelect(row.id)}
            className="rounded border-border accent-primary w-4 h-4 mt-1 shrink-0"
          />
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {row.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-label-sm text-label-sm text-on-surface font-semibold truncate">{row.name}</p>
            <p className="font-caption-xs text-caption-xs text-outline">Ref: {row.ref}</p>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${slaBadgeClass(computeSlaStatus(row.waitingSince, row.type))}`}>
          {computeSlaStatus(row.waitingSince, row.type)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary">{row.branch}</span>
        <span className="font-mono-data text-on-surface">{formatRelativeTime(row.waitingSince)}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={() => handleReview(row)} className="flex-1">
          Review
        </Button>
        <Button size="sm" onClick={() => handleInlineApprove(row)} className="flex-1 bg-success text-white border-0 hover:opacity-90">
          Setujui
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={() => handleInlineReject(row)} className="w-full text-danger hover:bg-danger/10">
        Tolak
      </Button>
    </div>
  );

  const renderTable = (rows: ApprovalItem[], nameLabel: string) => (
    <table className="w-full text-left border-collapse text-sm table-fixed">
      <thead>
        <tr className="bg-surface-container-low border-b border-border">
          <th className="px-4 py-3 w-10">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="rounded border-border accent-primary w-4 h-4"
            />
          </th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs w-[30%]">{nameLabel}</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs w-[15%]">Branch</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs w-[17%]">Waiting Since</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs w-[13%]">SLA Status</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface text-right uppercase tracking-wider text-xs w-[25%] sticky right-0 bg-surface-container-low shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)]">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map(row => (
          <tr key={row.id} className={`hover:bg-primary/5 transition-colors group ${selectedIds.has(row.id) ? 'bg-primary/5' : ''}`}>
            <td className="px-4 py-4">
              <input
                type="checkbox"
                checked={selectedIds.has(row.id)}
                onChange={() => toggleSelect(row.id)}
                className="rounded border-border accent-primary w-4 h-4"
              />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{row.name.charAt(0)}</div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface font-semibold">{row.name}</p>
                  <p className="font-caption-xs text-caption-xs text-outline">Ref: {row.ref}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-secondary">{row.branch}</td>
            <td className="px-6 py-4 font-mono-data text-mono-data text-on-surface">{formatRelativeTime(row.waitingSince)}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${slaBadgeClass(computeSlaStatus(row.waitingSince, row.type))}`}>{computeSlaStatus(row.waitingSince, row.type)}</span>
            </td>
            <td className="px-6 py-4 text-right sticky right-0 bg-surface-container-lowest shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex gap-1.5 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleReview(row)}>Review</Button>
                <Button size="sm" onClick={() => handleInlineApprove(row)} className="bg-success text-white border-0 hover:opacity-90">Setujui</Button>
                <Button variant="ghost" size="sm" onClick={() => handleInlineReject(row)} className="text-danger hover:bg-danger/10">Tolak</Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <span>Approval Inbox</span>
            <span className="bg-primary text-on-primary px-3 py-0.5 rounded-full font-label-sm text-xs font-semibold">
              {userApprovals.length} Pending
            </span>
          </div>
        }
        description="Operations"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Total Incoming</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{userApprovals.length}</span>
            <span className="text-success font-label-sm text-sm font-semibold">Active</span>
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-l-danger">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Overdue SLA</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-danger">{userApprovals.filter(a => computeSlaStatus(a.waitingSince, a.type) === 'Overdue').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Requires action</span>
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-l-warning">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Near Deadline</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-warning">{userApprovals.filter(a => computeSlaStatus(a.waitingSince, a.type) === 'Near Deadline').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Next 24 hours</span>
          </div>
        </Card>

        <Card padding="sm">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Rata-rata Waktu Tunggu</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{userApprovals.length > 0 ? (userApprovals.reduce((s, a) => s + (Date.now() - new Date(a.waitingSince).getTime()) / 3_600_000, 0) / userApprovals.length).toFixed(1) : '0.0'}h</span>
            <span className="text-success font-label-sm text-sm font-semibold">Rata-rata</span>
          </div>
        </Card>
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau ref..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-secondary font-label-sm text-label-sm whitespace-nowrap self-center">Tipe:</span>
            {(['Semua', 'Prospek', 'RKS', 'LPHS'] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setSearchQuery(''); }}
                className={filterButtonClass(filterType === t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-semibold text-on-surface">{selectedIds.size} item dipilih</span>
          <div className="flex-1" />
          <Button variant="primary" size="sm" onClick={handleBulkApprove}>
            Setujui Semua
          </Button>
          <Button variant="danger" size="sm" onClick={handleBulkReject}>
            Tolak Semua
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-outline hover:text-on-surface underline">
            Batalkan
          </button>
        </div>
      )}

      {/* Grouped Lists */}
      <div className="space-y-6 sm:space-y-8 pb-12">
        {/* Category: Prospek */}
        {prospekApprovals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">person_search</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base">Prospek Approvals <span className="text-outline font-normal ml-2">({prospekApprovals.length})</span></h3>
            </div>
            <div className="bg-surface-container-lowest border border-border rounded-lg overflow-hidden shadow-sm">
              {isMobile ? (
                <div className="divide-y divide-border p-3 space-y-3">
                  {prospekApprovals.map(renderApprovalCard)}
                </div>
              ) : (
                <div className="overflow-x-auto">{renderTable(prospekApprovals, 'Candidate Name')}</div>
              )}
            </div>
          </div>
        )}

        {/* Category: RKS */}
        {rksApprovals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-purple">description</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base">RKS (Rencana Kerja Syarat) <span className="text-outline font-normal ml-2">({rksApprovals.length})</span></h3>
            </div>
            <div className="bg-surface-container-lowest border border-border rounded-lg overflow-hidden shadow-sm">
              {isMobile ? (
                <div className="divide-y divide-border p-3 space-y-3">
                  {rksApprovals.map(renderApprovalCard)}
                </div>
              ) : (
                <div className="overflow-x-auto">{renderTable(rksApprovals, 'Project Name')}</div>
              )}
            </div>
          </div>
        )}

        {/* Category: LPHS */}
        {lphsApprovals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-orange">assignment_turned_in</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base">LPHS (Laporan Hasil Survey) <span className="text-outline font-normal ml-2">({lphsApprovals.length})</span></h3>
            </div>
            <div className="bg-surface-container-lowest border border-border rounded-lg overflow-hidden shadow-sm">
              {isMobile ? (
                <div className="divide-y divide-border p-3 space-y-3">
                  {lphsApprovals.map(renderApprovalCard)}
                </div>
              ) : (
                <div className="overflow-x-auto">{renderTable(lphsApprovals, 'Survey Site')}</div>
              )}
            </div>
          </div>
        )}

        {filteredApprovals.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 block">inbox</span>
            <p className="text-secondary font-label-sm">Tidak ada approval yang pending.</p>
          </div>
        )}

        {/* Approval History */}
        {approvalHistory.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline">history</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base">Riwayat Persetujuan <span className="text-outline font-normal ml-2">({approvalHistory.length})</span></h3>
            </div>
            <div className="bg-surface-container-lowest border border-border rounded-lg overflow-hidden shadow-sm">
              {isMobile ? (
                <div className="divide-y divide-border p-3 space-y-3">
                  {approvalHistory.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 py-2">
                      <span className={`material-symbols-outlined text-[20px] mt-0.5 ${item.action === 'approved' ? 'text-success' : 'text-danger'}`}>
                        {item.action === 'approved' ? 'check_circle' : 'cancel'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                        <p className="text-xs text-outline">Ref: {item.ref} · {item.type}</p>
                        <p className="text-xs text-secondary mt-0.5">
                          {item.action === 'approved' ? 'Disetujui' : 'Ditolak'} · {formatRelativeTime(item.resolvedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-border">
                      <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Nama</th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Tipe</th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {approvalHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface">{item.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                              <p className="text-xs text-outline">Ref: {item.ref}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary">{item.type}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.action === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            <span className="material-symbols-outlined text-[12px]">{item.action === 'approved' ? 'check' : 'close'}</span>
                            {item.action === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-secondary">{formatRelativeTime(item.resolvedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Tolak Persetujuan"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setRejectTarget(null)}>Batal</Button>
            <Button variant="danger" size="md" onClick={isBulkReject ? confirmBulkReject : confirmReject}>
              {isBulkReject ? `Tolak ${selectedIds.size} Item` : 'Tolak'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-secondary">
            Apakah Anda yakin ingin menolak persetujuan untuk <strong>{rejectTarget?.name}</strong>?
          </p>
          <div className="space-y-1.5">
            <label className="font-semibold text-xs text-on-surface-variant">Alasan Penolakan (opsional)</label>
            <MentionTextarea
              value={rejectReason}
              onChange={setRejectReason}
              users={mentionUsers}
              currentUserId={currentUserId}
              placeholder="Jelaskan alasan penolakan... (gunakan @ untuk mention)"
              rows={3}
              aria-label="Alasan penolakan"
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
