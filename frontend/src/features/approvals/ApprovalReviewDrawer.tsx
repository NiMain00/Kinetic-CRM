import React, { useState } from 'react';
import type { ApprovalItem, TimelineEvent } from '@/types/domain';
import { INITIAL_TIMELINE_EVENTS } from '@/services/mock-data';

interface ApprovalReviewDrawerProps {
  item: ApprovalItem;
  onClose: () => void;
  onApprove: (item: ApprovalItem, comment: string) => void;
  onReject: (item: ApprovalItem, comment: string) => void;
}

const slaStatusColor: Record<string, string> = {
  Overdue: 'text-danger',
  'Near Deadline': 'text-warning',
  Normal: 'text-success',
};

const slaStatusBg: Record<string, string> = {
  Overdue: 'bg-danger/10',
  'Near Deadline': 'bg-warning/10',
  Normal: 'bg-success/10',
};

const actionIcon: Record<string, string> = {
  approve: 'check_circle',
  submit: 'send',
  revision: 'edit_note',
  upload: 'upload_file',
  status_change: 'swap_horiz',
  comment: 'chat',
};

const actionColor: Record<string, string> = {
  approve: 'text-success',
  submit: 'text-primary',
  revision: 'text-warning',
  upload: 'text-status-purple',
  status_change: 'text-info',
  comment: 'text-secondary',
};

export default function ApprovalReviewDrawer({ item, onClose, onApprove, onReject }: ApprovalReviewDrawerProps) {
  const [comment, setComment] = useState('');
  const [timelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-end" onClick={onClose} aria-label="Approval review drawer">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col" style={{ animation: 'slideIn 0.3s ease-out' }}>
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface-container-lowest shrink-0">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Approval Review</span>
            <h4 className="text-lg font-extrabold text-on-surface mt-0.5">Review Approval Request</h4>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center border border-border" aria-label="Tutup drawer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Item Details */}
          <div className="bg-primary/5 p-5 rounded-lg border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-primary text-on-primary text-[10px] uppercase font-bold px-2.5 py-0.5 rounded">
                {item.type} — {item.ref}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${slaStatusBg[item.slaStatus]} ${slaStatusColor[item.slaStatus]}`}>
                {item.slaStatus}
              </span>
            </div>
            <h5 className="text-base font-extrabold text-on-surface">{item.name}</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[10px] text-outline uppercase font-bold block">Cabang</span>
                <p className="font-semibold text-on-surface">{item.branch}</p>
              </div>
              {item.client && (
                <div>
                  <span className="text-[10px] text-outline uppercase font-bold block">Client</span>
                  <p className="font-semibold text-on-surface">{item.client}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] text-outline uppercase font-bold block">Waiting Since</span>
                <p className="font-semibold text-on-surface">{item.waitingSince}</p>
              </div>
              <div>
                <span className="text-[10px] text-outline uppercase font-bold block">Tipe</span>
                <p className="font-semibold text-on-surface">{item.type}</p>
              </div>
            </div>
          </div>

          {/* Approval Comment */}
          <div className="space-y-2">
            <label className="font-semibold text-sm text-on-surface-variant block">
              Catatan / Komentar
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-border rounded-lg text-sm p-3 outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Tulis alasan, instruksi, atau catatan opsional..."
              rows={3}
              aria-label="Catatan approval"
            />
          </div>

          {/* Approval History Timeline */}
          <div className="pt-2">
            <h5 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              Riwayat Persetujuan
            </h5>
            <div className="space-y-0">
              {timelineEvents.map((event, idx) => (
                <div key={event.id} className="relative pb-6 pl-8 last:pb-0">
                  {idx < timelineEvents.length - 1 && (
                    <div className="absolute left-3.5 top-6 w-0.5 h-full bg-border" />
                  )}
                  <div className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center ${actionColor[event.type]} bg-white border-2 border-current`}>
                    <span className="material-symbols-outlined text-[14px]">{actionIcon[event.type]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{event.title}</p>
                    <p className="text-xs text-outline mt-0.5">{event.actor} · {event.role}</p>
                    {event.description && <p className="text-xs text-secondary mt-1 italic">{event.description}</p>}
                    {(event.prevVal || event.newVal) && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {event.prevVal && <span className="line-through text-outline">{event.prevVal}</span>}
                        {event.newVal && <span className="font-semibold text-on-surface">{event.newVal}</span>}
                      </div>
                    )}
                    {event.fileName && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <span className="material-symbols-outlined text-[14px]">attach_file</span>
                        {event.fileName} {event.fileSize && `(${event.fileSize})`}
                      </div>
                    )}
                    <p className="text-[10px] text-outline mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-surface-container-low border-t border-border grid grid-cols-2 gap-4 shrink-0">
          <button
            onClick={() => onReject(item, comment)}
            className="py-2.5 border border-danger text-danger font-bold rounded-lg hover:bg-danger hover:text-white transition-all text-sm"
            aria-label="Tolak revisi"
          >
            <span className="material-symbols-outlined text-[18px] align-middle mr-1">close</span>
            Reject / Revise
          </button>
          <button
            onClick={() => onApprove(item, comment)}
            className="py-2.5 bg-success text-white font-bold rounded-lg hover:opacity-90 transition-all text-sm"
            aria-label="Setujui"
          >
            <span className="material-symbols-outlined text-[18px] align-middle mr-1">check</span>
            Approve
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
