import React from 'react';
import type { Procurement } from '@/types/domain/procurement';

interface Props {
  procurement: Procurement;
}

export default function TimelineTab({ procurement }: Props) {
  const events = procurement.timeline || [];

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">
          timeline
        </span>
        <h3 className="font-heading-section text-base text-on-surface">
          Belum Ada Aktivitas
        </h3>
        <p className="text-sm text-secondary mt-1">
          Riwayat aktivitas pengadaan akan muncul di sini.
        </p>
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative pl-8 space-y-0">
        {sorted.map((event, i) => (
          <div
            key={event.id}
            className={`relative pb-6 ${i === sorted.length - 1 ? '' : 'timeline-line'}`}
          >
            <div
              className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 -translate-x-1/2 ${
                event.type === 'approve'
                  ? 'bg-success-container border-success text-success'
                  : event.type === 'revision'
                    ? 'bg-warning-container border-warning text-warning'
                    : event.type === 'submit'
                      ? 'bg-info-container border-info text-info'
                      : 'bg-surface-container border-border text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {event.type === 'approve'
                  ? 'check_circle'
                  : event.type === 'revision'
                    ? 'edit_note'
                    : event.type === 'submit'
                      ? 'send'
                      : event.type === 'upload'
                        ? 'upload_file'
                        : 'circle'}
              </span>
            </div>
            <div className="ml-4">
              <p className="font-label-sm text-xs font-semibold text-on-surface">
                {event.title}
              </p>
              <p className="text-[10px] text-secondary mt-0.5">
                {event.actor} · {event.role}
              </p>
              {event.description && (
                <p className="text-xs text-on-surface-variant mt-1">
                  {event.description}
                </p>
              )}
              <p className="text-[10px] text-outline mt-1">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
