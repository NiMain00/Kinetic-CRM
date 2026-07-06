import React, { useState, useMemo } from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { useApprovalChainStore } from '@/stores/approvalChainStore';
import type { Procurement } from '@/types/domain/procurement';

interface Props {
  procurement: Procurement;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function ApprovalTab({ procurement, onShowNotification }: Props) {
  const chains = useApprovalChainStore((s) => s.chains);
  const requests = useApprovalChainStore((s) => s.requests);
  const createRequest = useApprovalChainStore((s) => s.createRequest);
  const approveLevel = useApprovalChainStore((s) => s.approveLevel);
  const rejectRequest = useApprovalChainStore((s) => s.rejectRequest);

  const activeChain = chains.find(
    (c) => c.module === 'procurement' && c.isActive,
  );

  const procurementRequests = useMemo(
    () => requests.filter((r) => r.entityId === procurement.id),
    [requests, procurement.id],
  );

  const activeRequest = procurementRequests[0] || null;

  const [showChainInfo, setShowChainInfo] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleStartApproval = () => {
    if (!activeChain) {
      onShowNotification('Tidak ada chain approval aktif.', 'error');
      return;
    }

    const request = {
      id: `apr-${Date.now()}`,
      chainId: activeChain.id,
      entityId: procurement.id,
      entityType: 'procurement' as const,
      entityName: procurement.code,
      entityCode: procurement.code,
      amount: procurement.contractValue || 0,
      currentLevel: 0,
      status: 'in_progress' as const,
      levels: activeChain.levels.map((l) => ({
        levelId: l.id,
        levelName: l.name,
        status: 'pending' as const,
      })),
      createdBy: 'User',
      createdAt: new Date().toISOString(),
    };

    createRequest(request);
    onShowNotification('Approval request dibuat.', 'success');
  };

  const handleApprove = () => {
    if (!activeRequest) return;
    const currentLevelIdx = activeRequest.levels.findIndex(
      (l) => l.status === 'pending',
    );
    if (currentLevelIdx < 0) return;

    approveLevel(activeRequest.id, currentLevelIdx, 'Current User', approveNote);
    setApproveNote('');

    const isLastLevel = currentLevelIdx === activeRequest.levels.length - 1;
    onShowNotification(
      isLastLevel
        ? 'Semua level approval telah disetujui!'
        : `Level "${activeRequest.levels[currentLevelIdx].levelName}" disetujui.`,
      'success',
    );
  };

  const handleReject = () => {
    if (!activeRequest) return;
    rejectRequest(activeRequest.id, 'Current User', rejectNote);
    setRejectNote('');
    setShowRejectModal(false);
    onShowNotification('Approval request ditolak.', 'error');
  };

  const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
    pending: { label: 'Pending', variant: 'default' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    skipped: { label: 'Skipped', variant: 'info' },
    in_progress: { label: 'In Progress', variant: 'warning' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-on-surface">Multi-Level Approval</h3>
          <p className="text-sm text-secondary">
            {activeChain ? `Chain: ${activeChain.name}` : 'Tidak ada chain approval aktif'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChainInfo(true)}
            leftIcon={<span className="material-symbols-outlined text-[16px]">info</span>}
          >
            Chain Info
          </Button>
          {!activeRequest && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartApproval}
              leftIcon={<span className="material-symbols-outlined text-[16px]">how_to_reg</span>}
            >
              Ajukan Approval
            </Button>
          )}
        </div>
      </div>

      {!activeRequest ? (
        <div className="text-center py-12 text-secondary bg-surface rounded-xl border border-border/60">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">approval</span>
          <p className="font-semibold text-on-surface">Belum ada approval request</p>
          <p className="text-sm">Klik "Ajukan Approval" untuk memulai proses approval bertingkat.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Status:</span>
                <Badge variant={STATUS_BADGE[activeRequest.status]?.variant || 'default'}>
                  {STATUS_BADGE[activeRequest.status]?.label || activeRequest.status}
                </Badge>
              </div>
              <span className="text-xs text-secondary">
                {new Date(activeRequest.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Entity: {activeRequest.entityCode} · Amount: Rp {activeRequest.amount.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Approval Levels */}
          <div className="p-4 space-y-3">
            {activeRequest.levels.map((level, idx) => {
              const isCurrent = level.status === 'pending' &&
                idx === activeRequest.levels.findIndex((l) => l.status === 'pending');
              const badge = STATUS_BADGE[level.status];

              return (
                <div
                  key={level.levelId}
                  className={`relative flex items-start gap-4 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-primary/40 bg-primary/5'
                      : level.status === 'approved'
                        ? 'border-emerald-200 bg-emerald-50'
                        : level.status === 'rejected'
                          ? 'border-red-200 bg-red-50'
                          : 'border-border/40'
                  }`}
                >
                  {/* Step connector */}
                  {idx < activeRequest.levels.length - 1 && (
                    <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-border/40" />
                  )}

                  {/* Status indicator */}
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    level.status === 'approved'
                      ? 'bg-emerald-500 text-white'
                      : level.status === 'rejected'
                        ? 'bg-red-500 text-white'
                        : isCurrent
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-high text-outline'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {level.status === 'approved' ? 'check' : level.status === 'rejected' ? 'close' : isCurrent ? 'more_horiz' : idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-sm">{level.levelName}</span>
                        <span className="text-xs text-secondary ml-2">
                          {level.approver ? `by ${level.approver}` : `(${activeChain?.levels.find(l => l.id === level.levelId)?.role || 'Unknown'})`}
                        </span>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    {level.note && (
                      <p className="text-xs text-secondary mt-1">{level.note}</p>
                    )}

                    {level.resolvedAt && (
                      <p className="text-[10px] text-secondary mt-0.5">
                        {new Date(level.resolvedAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          {(activeRequest.status === 'in_progress' || activeRequest.status === 'pending') && (
            <div className="p-4 border-t border-border/40 space-y-3">
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none resize-none"
                rows={2}
                placeholder="Catatan approval (opsional)..."
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  leftIcon={<span className="material-symbols-outlined text-[14px]">check_circle</span>}
                >
                  Setujui Level Ini
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                  leftIcon={<span className="material-symbols-outlined text-[14px]">cancel</span>}
                >
                  Tolak
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chain Info Modal */}
      <Modal
        isOpen={showChainInfo}
        onClose={() => setShowChainInfo(false)}
        title="Approval Chain Info"
        footer={<Button variant="secondary" size="sm" onClick={() => setShowChainInfo(false)}>Tutup</Button>}
      >
        {activeChain && (
          <div className="space-y-3">
            <p className="font-semibold">{activeChain.name}</p>
            <div className="space-y-2">
              {activeChain.levels.map((level, idx) => (
                <div key={level.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-low text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium">{level.name}</span>
                    <span className="text-xs text-secondary ml-2">({level.role})</span>
                  </div>
                  <span className="text-xs text-secondary">
                    {level.minAmount ? `≥ Rp ${(level.minAmount / 1000000).toFixed(0)}jt` : ''}
                    {level.maxAmount ? ` ≤ Rp ${(level.maxAmount / 1000000).toFixed(0)}jt` : ''}
                    {!level.minAmount && !level.maxAmount ? 'All amounts' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirmation */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Tolak Approval"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>Batal</Button>
            <Button variant="danger" size="sm" onClick={handleReject}>Tolak</Button>
          </div>
        }
      >
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface outline-none resize-none"
          rows={3}
          placeholder="Alasan penolakan..."
          autoFocus
        />
      </Modal>
    </div>
  );
}
