import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useApprovals } from '@/hooks/queries/useApprovals';
import { useApprovalMutations } from '@/hooks/mutations/useApprovalMutations';
import PageSkeleton from '@/components/layout/PageSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import toast from 'react-hot-toast';

const slaBadgeClass = (status: string) => {
  switch (status) {
    case 'Overdue': return 'bg-danger/10 text-danger';
    case 'Near Deadline': return 'bg-warning/10 text-warning';
    default: return 'bg-success/10 text-success';
  }
};

export default function ApprovalInboxPage() {
  const isMobile = useIsMobile();
  const { data: res, isLoading, isError } = useApprovals();
  const { decide } = useApprovalMutations();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const approvals = (res as any)?.data?.data ?? [];

  const handleOpenReview = (item: any) => {
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
    decide.mutate(
      { id: selectedItem.id, decision: 'approved', comment: commentText },
      {
        onSuccess: () => {
          toast.success(`Persetujuan berhasil diberikan!`);
          handleCloseReview();
        },
        onError: () => toast.error('Gagal menyetujui.'),
      }
    );
  };

  const handleReject = () => {
    if (!selectedItem) return;
    decide.mutate(
      { id: selectedItem.id, decision: 'rejected', comment: commentText },
      {
        onSuccess: () => {
          toast.success(`Permintaan telah dikembalikan untuk revisi.`);
          handleCloseReview();
        },
        onError: () => toast.error('Gagal menolak.'),
      }
    );
  };

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <EmptyState
          icon="error"
          title="Gagal Memuat"
          description="Terjadi kesalahan saat memuat data approval."
          actionLabel="Muat Ulang"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const renderApprovalCard = (row: any) => (
    <div key={row.id} className="bg-white border border-border rounded-xl p-4 space-y-3 active:scale-[0.99] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {(row.name || row.id || 'A').charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-label-sm text-label-sm text-on-surface font-semibold truncate">{row.name || `Approval #${row.id?.slice(0, 8)}`}</p>
            <p className="font-caption-xs text-caption-xs text-outline">{row.stage || row.resourceType || '-'}</p>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${slaBadgeClass(row.slaStatus || 'Normal')}`}>
          {row.slaStatus || 'Normal'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary">Diminta: {row.requestor?.name || '-'}</span>
        <span className="text-secondary">Ditugaskan ke: {row.assignee?.name || '-'}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-outline">Menunggu: {row.waitingSince || '-'}</span>
        <span className="text-outline">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span>
      </div>
      <button onClick={() => handleOpenReview(row)} className="w-full py-2.5 bg-primary text-white rounded-lg font-label-sm text-sm font-semibold touch-min-h">Review</button>
    </div>
  );

  const renderTable = (rows: any[]) => (
    <table className="w-full text-left border-collapse text-sm">
      <thead>
        <tr className="bg-surface-container-low border-b border-border">
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Proyek / Prospek</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Tahap</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Diminta Oleh</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Assignee</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Menunggu</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface uppercase tracking-wider text-xs">Status</th>
          <th className="px-6 py-3 font-label-sm text-label-sm text-on-surface text-right uppercase tracking-wider text-xs">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row: any) => (
          <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{(row.name || row.id || 'A').charAt(0)}</div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface font-semibold">{row.name || `Approval #${row.id?.slice(0, 8)}`}</p>
                  <p className="font-caption-xs text-caption-xs text-outline">{row.resourceType || '-'}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-secondary">{row.stage || '-'}</td>
            <td className="px-6 py-4 text-secondary">{row.requestor?.name || '-'}</td>
            <td className="px-6 py-4 text-secondary">{row.assignee?.name || '-'}</td>
            <td className="px-6 py-4 text-secondary">{row.waitingSince || '-'}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${slaBadgeClass(row.slaStatus || 'Normal')}`}>{row.slaStatus || row.status || 'Normal'}</span>
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
    <div className={`${isMobile ? 'p-2' : 'p-1'} space-y-4 sm:space-y-8 flex-1 overflow-y-auto relative`}>
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

      <div className="space-y-6 sm:space-y-8 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            <h3 className="font-heading-section text-heading-section text-sm sm:text-base">Semua Approval <span className="text-outline font-normal ml-2">({approvals.length})</span></h3>
          </div>
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
            {approvals.length === 0 ? (
              <div className="p-6 text-center text-secondary text-sm">Tidak ada approval pending.</div>
            ) : isMobile ? (
              <div className="divide-y divide-border p-3 space-y-3">
                {approvals.map(renderApprovalCard)}
              </div>
            ) : (
              <div className="overflow-x-auto">{renderTable(approvals)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Review Drawer */}
      {drawerOpen && selectedItem && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={handleCloseReview}>
          <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-0 ${isMobile ? 'w-full inset-0' : 'w-full max-w-lg'} h-full bg-white shadow-2xl flex flex-col`}>
            <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center bg-surface-container-lowest">
              <div>
                <span className="text-caption-xs font-bold text-primary uppercase select-none tracking-widest text-xs">Active Desk Review</span>
                <h4 className="font-subheading-entity text-subheading-entity text-lg sm:text-xl">Review Approval Request</h4>
              </div>
              <button onClick={handleCloseReview} className="touch-min flex items-center justify-center rounded-full hover:bg-surface-container-high border">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <span className="bg-primary text-on-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                  {selectedItem.resourceType || 'Approval'} — {selectedItem.id?.slice(0, 8)}
                </span>
                <h5 className="text-lg sm:text-xl font-bold mt-2 text-on-surface">{selectedItem.name || 'Approval Request'}</h5>
                <p className="text-xs text-outline">Created at {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
              </div>

              <div className="pt-4 space-y-2">
                <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Approval Comments</label>
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  className="w-full border border-border rounded-lg text-sm focus:ring-primary focus:border-primary p-3 outline-none focus:ring-1 resize-none"
                  placeholder="Tulis alasan, instruksi atau catatan opsional..." rows={3} />
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-surface-container-low border-t border-border grid grid-cols-2 gap-3 sm:gap-4">
              <button onClick={handleReject} disabled={decide.isPending}
                className="py-2.5 sm:py-3 border border-danger text-danger font-bold rounded-lg hover:bg-danger hover:text-white transition-all font-semibold touch-min-h disabled:opacity-50">
                Reject
              </button>
              <button onClick={handleApprove} disabled={decide.isPending}
                className="py-2.5 sm:py-3 bg-success text-on-primary font-bold rounded-lg hover:opacity-90 transition-all font-semibold touch-min-h disabled:opacity-50">
                {decide.isPending ? 'Memproses...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
