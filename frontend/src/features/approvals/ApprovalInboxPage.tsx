import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { PageContainer, PageHeader } from '@/components/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ApprovalItem, SlaConfig } from '../../types/domain';
import { useApprovalStore } from '@/stores/approvalStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSlaConfigs, useNextPhaseMap } from '@/hooks/useConfigData';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatRelativeTime } from '@/utils/formatters';

interface ApprovalInboxViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

type FilterType = 'Semua' | 'Prospek' | 'RKS' | 'LPHS';

/**
 * Parse relative time strings like "3 days 4h ago", "18h 22m ago", "1d 6h ago"
 * into milliseconds elapsed since that time.
 */
function parseRelativeTime(str: string): number {
  let totalMs = 0;
  const dayMatch = str.match(/(\d+)\s*(?:days?|d)\b/);
  if (dayMatch) totalMs += parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000;
  const hourMatch = str.match(/(\d+)\s*(?:hours?|h)\b/);
  if (hourMatch) totalMs += parseInt(hourMatch[1], 10) * 60 * 60 * 1000;
  const minMatch = str.match(/(\d+)\s*(?:minutes?|m)\b/);
  if (minMatch) totalMs += parseInt(minMatch[1], 10) * 60 * 1000;
  return totalMs;
}

export default function ApprovalInboxView({
  onShowNotification,
}: ApprovalInboxViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { approvals, approveItem } = useApprovalStore();
  const { prospects, updateProspect } = useProspectStore();
  const { projects, updateProject } = useProjectStore();
  const slaConfigs = useSlaConfigs();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const NEXT_PHASE_MAP = useNextPhaseMap();
  const [filterType, setFilterType] = React.useState<FilterType>('Semua');

  const computeSlaStatus = (waitingSince: string, type: string): 'Overdue' | 'Near Deadline' | 'Normal' => {
    const entityMap: Record<string, SlaConfig['entityType']> = { Prospek: 'prospek', RKS: 'rks', LPHS: 'lphs' };
    const config = slaConfigs.find(s => s.entityType === entityMap[type] && s.active);
    if (!config) return 'Normal';
    const elapsedHours = parseRelativeTime(waitingSince) / 3_600_000;
    const critH = config.unit === 'days' ? config.criticalThreshold * 24 : config.criticalThreshold;
    const warnH = config.unit === 'days' ? config.warningThreshold * 24 : config.warningThreshold;
    if (elapsedHours >= critH) return 'Overdue';
    if (elapsedHours >= warnH) return 'Near Deadline';
    return 'Normal';
  };

  const filteredApprovals = useMemo(() => {
    // Hanya tampilkan approval yang entity-nya masih ada
    const validApprovals = approvals.filter((a) => {
      if (a.entityType === 'prospect' && a.entityId) {
        return prospects.some((p) => p.id === a.entityId);
      }
      if (a.entityType === 'project' && a.entityId) {
        return projects.some((p) => p.id === a.entityId);
      }
      return true;
    });
    if (filterType === 'Semua') return validApprovals;
    return validApprovals.filter((a) => a.type === filterType);
  }, [approvals, filterType, prospects, projects]);

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
    approveItem(item.id);
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
    addNotification({
      title: `${item.type} Revisi`,
      message: `${item.type} "${item.name}" ditolak dan memerlukan revisi.`,
      type: 'revision',
      entityId: item.entityId,
      entityType: item.entityType,
    });
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
        : 'bg-white border border-border text-on-surface hover:bg-surface-variant'
    }`;

  const renderApprovalCard = (row: ApprovalItem) => (
    <div
      key={row.id}
      className="bg-white border border-border rounded-xl p-4 space-y-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
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
        <Button variant="secondary" size="sm" onClick={() => handleInlineApprove(row)} className="flex-1 bg-success text-white border-0 hover:opacity-90">
          Setujui
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={() => handleInlineReject(row)} className="w-full text-danger hover:bg-danger/10">
        Tolak
      </Button>
    </div>
  );

  const renderTable = (rows: ApprovalItem[], nameLabel: string) => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-surface-container-low border-b border-border">
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">{nameLabel}</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Branch</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Waiting Since</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">SLA Status</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface text-right uppercase tracking-wider text-xs">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map(row => (
          <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
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
            <td className="px-6 py-4 text-right">
              <div className="flex gap-1.5 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleReview(row)}>Review</Button>
                <Button variant="secondary" size="sm" onClick={() => handleInlineApprove(row)} className="bg-success text-white border-0 hover:opacity-90">Setujui</Button>
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
              {approvals.length} Pending
            </span>
          </div>
        }
        description="Operations"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Total Incoming</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{approvals.length}</span>
            <span className="text-success font-label-sm text-sm font-semibold">Active</span>
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-l-danger">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Overdue SLA</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-danger">{approvals.filter(a => computeSlaStatus(a.waitingSince, a.type) === 'Overdue').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Requires action</span>
          </div>
        </Card>

        <Card padding="sm" className="border-l-4 border-l-warning">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Near Deadline</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-warning">{approvals.filter(a => computeSlaStatus(a.waitingSince, a.type) === 'Near Deadline').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Next 24 hours</span>
          </div>
        </Card>

        <Card padding="sm">
          <p className="text-outline font-caption-xs text-xs uppercase tracking-wider">Avg. Completion Time</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{approvals.length > 0 ? (approvals.reduce((s, a) => s + parseRelativeTime(a.waitingSince) / 3_600_000, 0) / approvals.length).toFixed(1) : '0.0'}h</span>
            <span className="text-success font-label-sm text-sm font-semibold">Rata-rata</span>
          </div>
        </Card>
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-secondary font-label-sm text-label-sm">Tipe Approval:</span>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
            {(['Semua', 'Prospek', 'RKS', 'LPHS'] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={filterButtonClass(filterType === t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Grouped Lists */}
      <div className="space-y-6 sm:space-y-8 pb-12">
        {/* Category: Prospek */}
        {prospekApprovals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">person_search</span>
              <h3 className="font-heading-section text-heading-section text-sm sm:text-base">Prospek Approvals <span className="text-outline font-normal ml-2">({prospekApprovals.length})</span></h3>
            </div>
            <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
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
            <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
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
            <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
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
      </div>
    </PageContainer>
  );
}
