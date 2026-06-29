import React, { useMemo } from 'react';
import CalendarView from '@/components/shared/CalendarView';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useProjectStore } from '@/stores/projectStore';

export default function CalendarPage() {
  const holidays = useMasterDataStore((s) => s.holidays);
  const projects = useProjectStore((s) => s.projects);

  const events = useMemo(() => {
    const evs: { date: string; title: string; type: 'deadline' | 'delivery' | 'milestone' | 'holiday'; subtitle?: string }[] = [];

    // Project deadlines
    projects.forEach((p) => {
      if (p.deadlineTender) {
        evs.push({
          date: p.deadlineTender,
          title: `Deadline Tender: ${p.name}`,
          type: 'deadline',
          subtitle: p.client,
        });
      }

      if (p.delivery?.endDate) {
        evs.push({
          date: p.delivery.endDate,
          title: `Selesai Delivery: ${p.name}`,
          type: 'delivery',
          subtitle: p.client,
        });
      }

      if (p.delivery?.startDate) {
        evs.push({
          date: p.delivery.startDate,
          title: `Mulai Delivery: ${p.name}`,
          type: 'delivery',
          subtitle: p.client,
        });
      }

      // Milestones
      p.delivery?.milestones?.forEach((m) => {
        if (m.date) {
          evs.push({
            date: m.date,
            title: m.name,
            type: 'milestone',
            subtitle: p.name,
          });
        }
      });
    });

    // Holidays
    holidays.forEach((h) => {
      evs.push({
        date: h.date,
        title: h.name,
        type: 'holiday',
        subtitle: h.type === 'national' ? 'Libur Nasional' : 'Libur Regional',
      });
    });

    return evs;
  }, [projects, holidays]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Reports</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Kalender</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Kalender Proyek
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Deadline tender, jadwal delivery, milestone, dan hari libur.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <CalendarView events={events} />
        </div>
      </div>
    </div>
  );
}
