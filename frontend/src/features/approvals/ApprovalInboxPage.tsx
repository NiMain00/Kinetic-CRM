import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ApprovalItem } from '../../types/domain';
import { useApprovalStore } from '@/stores/approvalStore';

interface ApprovalInboxViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

type FilterType = 'Semua' | 'Prospek' | 'RKS' | 'LPHS';

export default function ApprovalInboxView({
  onShowNotification,
}: ApprovalInboxViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { approvals } = useApprovalStore();
  const [filterType, setFilterType] = React.useState<FilterType>('Semua');

  const filteredApprovals = useMemo(() => {
    if (filterType === 'Semua') return approvals;
    return approvals.filter((a) => a.type === filterType);
  }, [approvals, filterType]);

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
        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${slaBadgeClass(row.slaStatus)}`}>
          {row.slaStatus}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary">{row.branch}</span>
        <span className="font-mono-data text-on-surface">{row.waitingSince}</span>
      </div>
      <button
        onClick={() => handleReview(row)}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-label-sm text-sm font-semibold touch-min-h"
      >
        Review
      </button>
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
            <td className="px-6 py-4 font-mono-data text-mono-data text-on-surface">{row.waitingSince}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${slaBadgeClass(row.slaStatus)}`}>{row.slaStatus}</span>
            </td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleReview(row)} className="bg-surface border border-border text-primary px-4 py-1.5 rounded font-label-sm text-sm hover:bg-primary hover:text-white transition-all shadow-sm font-semibold touch-min-h">Review</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className={`${isMobile ? 'p-2' : 'p-1'} space-y-4 sm:space-y-8 flex-1 overflow-y-auto relative`}>
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-outline font-caption-xs text-xs">
            <span>Operations</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-semibold">Approval Inbox</span>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="font-display-title text-display-title text-on-surface">Approval Inbox</h2>
            <span className="bg-primary text-on-primary px-3 py-0.5 rounded-full font-label-sm text-xs font-semibold">
              {approvals.length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Total Incoming</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{approvals.length}</span>
            <span className="text-success font-label-sm text-sm font-semibold">Active</span>
          </div>
        </div>

        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28 border-l-4 border-l-danger">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Overdue SLA</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-danger">{approvals.filter(a => a.slaStatus === 'Overdue').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Requires action</span>
          </div>
        </div>

        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28 border-l-4 border-l-warning">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Near Deadline</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-warning">{approvals.filter(a => a.slaStatus === 'Near Deadline').length}</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Next 24 hours</span>
          </div>
        </div>

        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Avg. Completion Time</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">4.2h</span>
            <span className="text-success font-label-sm text-sm font-semibold">-1.5h</span>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface-container-low border border-border p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
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
      </div>

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
    </div>
  );
}
