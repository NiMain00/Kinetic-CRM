import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from '@/components/ui';
import { PageContainer, PageHeader } from '@/components/shared';
import type { ApprovalItem, SlaConfig } from '../../types/domain';
import { useApprovalStore } from '@/stores/approvalStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSlaConfigs, useNextPhaseMap } from '@/hooks/useConfigData';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import MentionTextarea from '@/components/shared/MentionTextarea';
import { formatRelativeTime, formatCurrencyShort } from '@/utils/formatters';

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

const TYPE_ICONS: Record<string, string> = {
  Prospek: 'person_search',
  RKS: 'description',
  LPHS: 'assignment_turned_in',
};

export default function ApprovalInboxView({
  onShowNotification,
}: ApprovalInboxViewProps) {
  const navigate = useNavigate();
  const { approvals, approvalHistory, approveItem, rejectItem } = useApprovalStore();
  const { prospects, updateProspect, fetchProspects } = useProspectStore();
  const { projects, updateProject, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
    fetchProspects();
  }, [fetchProjects, fetchProspects]);
  const slaConfigs = useSlaConfigs();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const NEXT_PHASE_MAP = useNextPhaseMap();
  const user = useAuthStore((s) => s.user);
  const [filterType, setFilterType] = React.useState<FilterType>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = React.useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isBulkReject, setIsBulkReject] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const allUsers = useUserStore((s) => s.users);
  const mentionUsers = useMemo(
    () => allUsers.map((u) => ({ id: u.id, name: u.fullName, role: u.role })),
    [allUsers],
  );
  const currentUserId = user?.id || '';

  // Derive pending approvals from live entity states. The `Approval` table is
  // never populated by submit flows, so relying on it leaves the inbox empty.
  // We build the pending list from prospects/projects that are actually waiting
  // for review, then merge with any locally-created approval items.
  const derivedApprovals = useMemo<ApprovalItem[]>(() => {
    const items: ApprovalItem[] = [];
    prospects.forEach((p) => {
      if (p.status === 'Waiting Supervisor') {
        items.push({
          id: `derived-prospect-${p.id}`,
          ref: `PR-${p.id.slice(0, 6).toUpperCase()}`,
          name: p.name,
          branch: p.branch ?? '',
          waitingSince: p.date ?? new Date().toISOString(),
          slaStatus: 'Normal',
          type: 'Prospek',
          resourceType: 'prospect',
          resourceId: p.id,
          client: p.client,
          entityId: p.id,
          entityType: 'prospect',
        });
      }
    });
    projects.forEach((pr) => {
      if (pr.status === 'Review RKS') {
        items.push({
          id: `derived-rks-${pr.id}`,
          ref: pr.code || `RKS-${pr.id.slice(0, 6).toUpperCase()}`,
          name: pr.name,
          branch: pr.branch ?? '',
          waitingSince: pr.date ?? new Date().toISOString(),
          slaStatus: 'Normal',
          type: 'RKS',
          resourceType: 'rks',
          resourceId: pr.id,
          client: pr.client,
          entityId: pr.id,
          entityType: 'project',
        });
      } else if (
        pr.status === 'LPHS/SIOS' &&
        pr.lphs &&
        (pr.lphs.overallStatus === 'dept_review' || pr.lphs.overallStatus === 'mgmt_review')
      ) {
        items.push({
          id: `derived-lphs-${pr.id}`,
          ref: pr.code || `LPHS-${pr.id.slice(0, 6).toUpperCase()}`,
          name: pr.name,
          branch: pr.branch ?? '',
          waitingSince: pr.lphs.submittedAt ?? pr.date ?? new Date().toISOString(),
          slaStatus: 'Normal',
          type: 'LPHS',
          resourceType: 'lphs_sios',
          resourceId: pr.id,
          client: pr.client,
          entityId: pr.id,
          entityType: 'project',
        });
      }
    });
    return items;
  }, [prospects, projects]);

  const combinedApprovals = useMemo<ApprovalItem[]>(() => {
    const map = new Map<string, ApprovalItem>();
    derivedApprovals.forEach((a) => map.set(a.entityId ?? a.id, a));
    approvals.forEach((a) => {
      const key = a.entityId ?? a.id;
      if (!map.has(key)) map.set(key, a);
    });
    return Array.from(map.values());
  }, [derivedApprovals, approvals]);

  // Show derived (role/department) approvals to everyone; keep per-user
  // filtering only for explicitly assigned store items.
  const userApprovals = user?.id
    ? combinedApprovals.filter((a) => !a.assigneeUserId || a.assigneeUserId === user.id)
    : combinedApprovals;
  const userHistory = user?.id ? approvalHistory.filter((a) => a.assigneeUserId === user.id) : [];

  const computeSlaStatus = (waitingSince: string, type: string): 'Overdue' | 'Near Deadline' | 'Normal' => {
    const sla = parseSlaConfig(type, slaConfigs);
    if (!sla) return 'Normal';
    const elapsedHours = (Date.now() - new Date(waitingSince).getTime()) / 3_600_000;
    if (elapsedHours >= sla.critH) return 'Overdue';
    if (elapsedHours >= sla.warnH) return 'Near Deadline';
    return 'Normal';
  };

  const getEntityMeta = (item: ApprovalItem) => {
    if (item.entityType === 'prospect' && item.entityId) {
      const p = prospects.find(pr => pr.id === item.entityId);
      return { client: p?.client, value: p?.estimatedValue, author: p?.author };
    }
    if (item.entityType === 'project' && item.entityId) {
      const p = projects.find(pr => pr.id === item.entityId);
      return { client: p?.client, value: p?.estimatedValue, author: p?.author };
    }
    return {};
  };

  const VALID_TYPES = new Set(['Prospek', 'RKS', 'LPHS']);

  const validApprovals = useMemo(
    () =>
      userApprovals.filter((a) => {
        if (!VALID_TYPES.has(a.type)) return false;
        if (a.entityType === 'prospect' && a.entityId) {
          return prospects.some((p) => p.id === a.entityId);
        }
        if (a.entityType === 'project' && a.entityId) {
          return projects.some((p) => p.id === a.entityId);
        }
        return true;
      }),
    [userApprovals, prospects, projects],
  );

  const filteredApprovals = useMemo(() => {
    const validApprovalsLocal = validApprovals;
    const typeFiltered = filterType === 'Semua' ? validApprovalsLocal : validApprovalsLocal.filter((a) => a.type === filterType);
    if (!debouncedSearch.trim()) return typeFiltered;
    const q = debouncedSearch.toLowerCase();
    return typeFiltered.filter(
      (a) => a.name.toLowerCase().includes(q) || a.ref.toLowerCase().includes(q) || a.client?.toLowerCase().includes(q),
    );
  }, [validApprovals, filterType, debouncedSearch]);

  const handleReview = (item: ApprovalItem) => {
    if (item.entityType === 'prospect' && item.entityId) {
      navigate(`/prospects/${item.entityId}`);
    } else if (item.entityType === 'project' && item.entityId) {
      const tabMap: Record<string, string> = {
        'RKS': 'review-rks',
        'LPHS': 'lphs',
      };
      const tab = tabMap[item.type] || 'overview';
      navigate(`/projects/${item.entityId}/${tab}`);
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
        updateProject(item.entityId, { status: 'Revisi' });
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
      case 'Overdue': return 'bg-danger text-white';
      case 'Near Deadline': return 'bg-warning text-white';
      default: return 'bg-success/10 text-success';
    }
  };

  const slaBorderClass = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-danger-container/10 ring-1 ring-danger/20';
      case 'Near Deadline': return 'bg-warning-container/10 ring-1 ring-warning/20';
      default: return 'bg-success-container/5 ring-1 ring-success/10';
    }
  };

  const filterButtonClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-caption-xs font-semibold touch-min-h whitespace-nowrap transition-all ${
      active
        ? 'bg-primary text-on-primary'
        : 'bg-surface border border-border/60 text-on-surface hover:bg-surface-container'
    }`;

  const renderApprovalCard = (row: ApprovalItem) => {
    const slaStatus = computeSlaStatus(row.waitingSince, row.type);
    const meta = getEntityMeta(row);
    return (
      <div
        key={row.id}
        className={`bg-surface border border-border/60 rounded-2xl p-4 space-y-3 active:scale-[0.99] transition-all ${slaBorderClass(slaStatus)} ${selectedIds.has(row.id) ? 'ring-2 ring-primary/30' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={selectedIds.has(row.id)}
              onChange={() => toggleSelect(row.id)}
              aria-label={`Pilih ${row.name}`}
              className="rounded border-border accent-primary w-4 h-4 mt-0.5 shrink-0"
            />
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shrink-0 ${
              row.type === 'Prospek' ? 'bg-primary' : row.type === 'RKS' ? 'bg-status-purple' : 'bg-status-orange'
            }`}>
              <span className="material-symbols-outlined text-[18px]">{TYPE_ICONS[row.type]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-label-sm text-label-sm text-on-surface font-semibold truncate">{row.name}</p>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${slaBadgeClass(slaStatus)}`}>
                  {slaStatus === 'Overdue' ? 'OVERDUE' : slaStatus === 'Near Deadline' ? 'KRITIS' : 'NORMAL'}
                </span>
              </div>
              <p className="text-xs text-outline">Ref: {row.ref}</p>
              {meta.client && <p className="text-xs text-secondary mt-0.5 truncate">{meta.client}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-secondary min-w-0">
            <span className="material-symbols-outlined text-[14px] shrink-0">schedule</span>
            <span>{formatRelativeTime(row.waitingSince)}</span>
          </div>
          {meta.value ? (
            <span className="font-medium text-on-surface text-xs" title={meta.value !== undefined ? `Rp ${meta.value.toLocaleString('id-ID')}` : ''}>
              {formatCurrencyShort(meta.value)}
            </span>
          ) : (
            <span className="text-xs text-outline">{row.branch}</span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReview(row)}
            className="flex-1"
          >
            Review
          </Button>
          <Button
            size="sm"
            onClick={() => handleInlineApprove(row)}
            className="flex-1 bg-success text-white border-0 hover:opacity-90"
          >
            Setujui
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInlineReject(row)}
            className="flex-1 border-danger text-danger hover:bg-danger hover:text-white hover:border-danger"
          >
            Tolak
          </Button>
        </div>
      </div>
    );
  };

  const groupSections: Array<{
    label: string;
    icon: string;
    iconColor: string;
    items: ApprovalItem[];
  }> = [
    { label: 'Prospek Approvals', icon: 'person_search', iconColor: 'text-primary', items: prospekApprovals },
    { label: 'RKS (Rencana Kerja Syarat)', icon: 'description', iconColor: 'text-status-purple', items: rksApprovals },
    { label: 'LPHS (Laporan Hasil Survey)', icon: 'assignment_turned_in', iconColor: 'text-status-orange', items: lphsApprovals },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <span>Approval Inbox</span>
            <span className="bg-primary text-on-primary px-3 py-0.5 rounded-full font-label-sm text-xs font-semibold">
              {validApprovals.length} Pending
            </span>
          </div>
        }
        description="Operations"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Total Incoming</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{validApprovals.length}</span>
            <span className="text-success font-label-sm text-sm font-semibold">Active</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-danger-container/10 ring-1 ring-danger/20">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Overdue SLA</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-danger">{validApprovals.filter(a => computeSlaStatus(a.waitingSince, a.type) === 'Overdue').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Requires action</span>
          </div>
        </Card>

        <Card padding="sm" className="bg-warning-container/10 ring-1 ring-warning/20">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Near Deadline</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-warning">{validApprovals.filter(a => computeSlaStatus(a.waitingSince, a.type) === 'Near Deadline').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Next 24 hours</span>
          </div>
        </Card>

        <Card padding="sm">
          <p className="text-on-surface-variant font-caption-xs text-xs uppercase tracking-wider">Rata-rata Waktu Tunggu</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{validApprovals.length > 0 ? (validApprovals.reduce((s, a) => s + (Date.now() - new Date(a.waitingSince).getTime()) / 3_600_000, 0) / validApprovals.length).toFixed(1) : userHistory.length > 0 ? (userHistory.reduce((s, a) => s + (new Date(a.resolvedAt).getTime() - new Date(a.waitingSince).getTime()) / 3_600_000, 0) / userHistory.length).toFixed(1) : '0.0'}h</span>
            <span className="text-on-surface-variant font-label-sm text-sm font-semibold">Rata-rata</span>
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
              placeholder="Cari nama, ref, klien..."
              className="w-full pl-9 pr-3 py-2 border border-border/60 rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
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
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-semibold text-on-surface">{selectedIds.size} item dipilih</span>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={handleBulkApprove}>
              Setujui Semua
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkReject}>
              Tolak Semua
            </Button>
            <button onClick={() => setSelectedIds(new Set())} className="text-sm text-outline hover:text-on-surface underline shrink-0">
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Card-based Approval Lists */}
      <div className="space-y-6 sm:space-y-8 pb-12">
        {groupSections.map(section => section.items.length > 0 && (
          <div key={section.label} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined ${section.iconColor}`}>{section.icon}</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base">{section.label} <span className="text-outline font-normal ml-2">({section.items.length})</span></h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {section.items.map(renderApprovalCard)}
            </div>
          </div>
        ))}

        {filteredApprovals.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline mb-4 block">inbox</span>
            <p className="text-secondary font-label-sm">Tidak ada approval yang pending.</p>
          </div>
        )}

        {/* Approval History */}
        {approvalHistory.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-3 w-full text-left"
            >
              <span className="material-symbols-outlined text-outline">history</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base flex-1">Riwayat Persetujuan <span className="text-outline font-normal ml-2">({approvalHistory.length})</span></h3>
              <span className="material-symbols-outlined text-outline transition-transform" style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>
            {showHistory && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {approvalHistory.map((item) => (
                  <div key={item.id} className="bg-surface border border-border/60 rounded-xl p-4 flex items-start gap-3">
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
            )}
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
