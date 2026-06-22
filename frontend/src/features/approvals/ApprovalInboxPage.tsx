import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ApprovalItem } from '../../types/domain';
import { INITIAL_APPROVALS } from '../../services/mock-data';

interface ApprovalInboxViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  pendingCount: number;
  setPendingCount: React.Dispatch<React.SetStateAction<number>>;
}

export default function ApprovalInboxView({
  onShowNotification,
  pendingCount,
  setPendingCount,
}: ApprovalInboxViewProps) {
  const isMobile = useIsMobile();
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleOpenReview = (item: ApprovalItem) => {
    setSelectedItem(item);
    setCommentText('');
    setDrawerOpen(true);
  };

  const handleCloseReview = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    setApprovals(approvals.filter(a => a.id !== selectedItem.id));
    setPendingCount(prev => Math.max(0, prev - 1));
    onShowNotification(`Persetujuan untuk ${selectedItem.name} berhasil diberikan!`, 'success');
    handleCloseReview();
  };

  const handleReject = () => {
    if (!selectedItem) return;
    setApprovals(approvals.filter(a => a.id !== selectedItem.id));
    setPendingCount(prev => Math.max(0, prev - 1));
    onShowNotification(`Permintaan ${selectedItem.name} telah dikembalikan untuk revisi.`, 'warning');
    handleCloseReview();
  };

  const prospekApprovals = approvals.filter(a => a.type === 'Prospek');
  const rksApprovals = approvals.filter(a => a.type === 'RKS');
  const lphsApprovals = approvals.filter(a => a.type === 'LPHS');

  const slaBadgeClass = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-danger/10 text-danger';
      case 'Near Deadline': return 'bg-warning/10 text-warning';
      default: return 'bg-success/10 text-success';
    }
  };

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
        onClick={() => handleOpenReview(row)}
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
              <button onClick={() => handleOpenReview(row)} className="bg-surface border border-border text-primary px-4 py-1.5 rounded font-label-sm text-sm hover:bg-primary hover:text-white transition-all shadow-sm font-semibold touch-min-h">Review</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-4 sm:space-y-8 flex-1 overflow-y-auto relative`}>
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

        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white border border-border px-4 py-2 rounded-lg font-label-sm text-xs md:text-sm hover:bg-surface-container-low transition-all font-semibold touch-min-h">
            <span className="material-symbols-outlined text-[18px]">history</span> View Audit Logs
          </button>
          <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-sm text-xs md:text-sm hover:bg-primary-container transition-all font-semibold touch-min-h">
            <span className="material-symbols-outlined text-[18px]">bolt</span> Batch Approval
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Total Incoming</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface">{approvals.length + 136}</span>
            <span className="text-success font-label-sm text-sm font-semibold">+12%</span>
          </div>
        </div>

        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28 border-l-4 border-l-danger">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Overdue SLA</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-danger">5</span>
            <span className="text-outline font-caption-xs text-xs text-secondary">Requires action</span>
          </div>
        </div>

        <div className="bg-white border border-border p-3 sm:p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 sm:h-28 border-l-4 border-l-warning">
          <span className="text-outline font-caption-xs text-xs uppercase tracking-wider">Near Deadline</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-warning">8</span>
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
            <button className="px-3 py-1 bg-primary text-on-primary rounded-full text-caption-xs font-semibold touch-min-h whitespace-nowrap">Semua</button>
            <button className="px-3 py-1 bg-white border border-border text-on-surface rounded-full text-caption-xs font-semibold hover:bg-surface-variant touch-min-h whitespace-nowrap">Prospek</button>
            <button className="px-3 py-1 bg-white border border-border text-on-surface rounded-full text-caption-xs font-semibold hover:bg-surface-variant touch-min-h whitespace-nowrap">RKS</button>
            <button className="px-3 py-1 bg-white border border-border text-on-surface rounded-full text-caption-xs font-semibold hover:bg-surface-variant touch-min-h whitespace-nowrap">LPHS</button>
          </div>
        </div>
        <div className="h-[1px] w-full md:h-6 md:w-[1px] bg-border"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <span className="text-secondary font-label-sm text-label-sm">SLA Status:</span>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
            <label className="flex items-center gap-2 bg-white border border-border px-3 py-1 rounded-lg cursor-pointer touch-min-h whitespace-nowrap">
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary border-outline-variant" />
              <span className="text-caption-xs font-semibold">Normal</span>
            </label>
            <label className="flex items-center gap-2 bg-white border border-border px-3 py-1 rounded-lg cursor-pointer touch-min-h whitespace-nowrap">
              <input type="checkbox" className="rounded text-warning focus:ring-warning border-outline-variant" />
              <span className="text-caption-xs font-semibold text-warning">Near Deadline</span>
            </label>
            <label className="flex items-center gap-2 bg-white border border-border px-3 py-1 rounded-lg cursor-pointer touch-min-h whitespace-nowrap">
              <input type="checkbox" className="rounded text-danger focus:ring-danger border-outline-variant" />
              <span className="text-caption-xs font-semibold text-danger">Overdue</span>
            </label>
          </div>
        </div>
      </div>

      {/* Grouped Lists */}
      <div className="space-y-6 sm:space-y-8 pb-12">
        {/* Category: Prospek */}
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

        {/* Category: RKS */}
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

        {/* Category: LPHS */}
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
      </div>

      {/* SlideDrawer Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseReview}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 top-0 ${isMobile ? 'w-full inset-0' : 'w-full max-w-lg'} h-full bg-white shadow-2xl transition-transform duration-300 flex flex-col`}
          style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-surface-container-lowest">
            <div>
              <span className="text-caption-xs font-bold text-primary uppercase select-none tracking-widest text-xs">
                Active Desk Review
              </span>
              <h4 className="font-subheading-entity text-subheading-entity text-lg sm:text-xl">Review Approval Request</h4>
            </div>
            <button className="touch-min flex items-center justify-center rounded-full hover:bg-surface-container-high border" onClick={handleCloseReview}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Scrollable details */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
            {selectedItem && (
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <span className="bg-primary text-on-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                    {selectedItem.type} Submission Code: {selectedItem.ref}
                  </span>
                  <h5 className="text-lg sm:text-xl font-bold mt-2 text-on-surface">{selectedItem.name}</h5>
                  <p className="text-xs text-outline">Registered & submitted at {selectedItem.waitingSince} - {selectedItem.branch}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-outline uppercase font-bold">Branch Office</span>
                    <p className="text-sm font-semibold">{selectedItem.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-outline uppercase font-bold">Priority Status</span>
                    <p className={`text-sm font-semibold ${selectedItem.slaStatus === 'Overdue' ? 'text-danger' : 'text-warning'}`}>
                      {selectedItem.slaStatus}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="text-[11px] text-outline uppercase font-bold block mb-2">Submitted Documents</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-border rounded hover:bg-surface-container-low cursor-pointer touch-min-h">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-danger shrink-0">picture_as_pdf</span>
                        <span className="text-sm font-medium truncate">LPH_Technical_Draft_v1.pdf</span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-lg shrink-0">visibility</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded hover:bg-surface-container-low cursor-pointer touch-min-h">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-success shrink-0">task</span>
                        <span className="text-sm font-medium truncate">BOM_Internal_Prices_Sheet.xlsx</span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-lg shrink-0">visibility</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Approval Comments</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full border border-border rounded-lg text-sm focus:ring-primary focus:border-primary p-3 outline-none focus:ring-1 resize-none"
                    placeholder="Tulis alasan, instruksi atau catatan opsional untuk draf revisi..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer actions */}
          <div className="p-4 sm:p-6 bg-surface-container-low border-t border-border grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={handleReject}
              className="py-2.5 sm:py-3 border border-danger text-danger font-bold rounded-lg hover:bg-danger hover:text-white transition-all font-semibold touch-min-h"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="py-2.5 sm:py-3 bg-success text-on-primary font-bold rounded-lg hover:opacity-90 transition-all font-semibold touch-min-h"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
