import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '@/components/shared/CalendarView';
import { useMasterDataStore } from '@/stores/masterDataStore';
import { useProjectStore } from '@/stores/projectStore';

function normalizeDate(d: string): string {
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // Try parsing "Mon DD, YYYY" or similar
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return d;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const holidays = useMasterDataStore((s) => s.holidays);
  const projects = useProjectStore((s) => s.projects);

  const events = useMemo(() => {
    const evs: { date: string; title: string; type: 'deadline' | 'delivery' | 'milestone' | 'holiday'; subtitle?: string }[] = [];

    // Project deadlines
    projects.forEach((p) => {
      if (p.deadlineTender) {
        evs.push({
          date: normalizeDate(p.deadlineTender),
          title: `Deadline Tender: ${p.name}`,
          type: 'deadline',
          subtitle: p.client,
        });
      }

      // Project creation date
      if (p.date) {
        evs.push({
          date: normalizeDate(p.date),
          title: `Proyek Dibuat: ${p.name}`,
          type: 'milestone',
          subtitle: p.client,
        });
      }

      // Winner start date
      if (p.winnerDetails?.startDate) {
        evs.push({
          date: normalizeDate(p.winnerDetails.startDate),
          title: `Mulai Proyek: ${p.name}`,
          type: 'milestone',
          subtitle: p.client,
        });
      }

      // LPHS submission & approval dates
      if (p.lphs?.submittedAt) {
        evs.push({
          date: normalizeDate(p.lphs.submittedAt),
          title: `LPHS Disubmit: ${p.name}`,
          type: 'milestone',
          subtitle: p.client,
        });
      }
      if (p.lphs?.pmApprovedAt) {
        evs.push({
          date: normalizeDate(p.lphs.pmApprovedAt),
          title: `LPHS PM Approved: ${p.name}`,
          type: 'deadline',
          subtitle: p.client,
        });
      }
      if (p.lphs?.mgmtApprovedAt) {
        evs.push({
          date: normalizeDate(p.lphs.mgmtApprovedAt),
          title: `LPHS Management Approved: ${p.name}`,
          type: 'deadline',
          subtitle: p.client,
        });
      }
      if (p.lphs?.finalApprovedAt) {
        evs.push({
          date: normalizeDate(p.lphs.finalApprovedAt),
          title: `LPHS Final Approval: ${p.name}`,
          type: 'deadline',
          subtitle: p.client,
        });
      }

      // RKS deadline (if different from project deadline)
      if (p.rks?.deadlineTender && p.rks.deadlineTender !== p.deadlineTender) {
        evs.push({
          date: normalizeDate(p.rks.deadlineTender),
          title: `Deadline Tender (RKS): ${p.name}`,
          type: 'deadline',
          subtitle: p.client,
        });
      }

      if (p.delivery?.endDate) {
        evs.push({
          date: normalizeDate(p.delivery.endDate),
          title: `Selesai Delivery: ${p.name}`,
          type: 'delivery',
          subtitle: p.client,
        });
      }

      if (p.delivery?.startDate) {
        evs.push({
          date: normalizeDate(p.delivery.startDate),
          title: `Mulai Delivery: ${p.name}`,
          type: 'delivery',
          subtitle: p.client,
        });
      }

      // Timeline events
      p.timeline?.forEach((t) => {
        if (t.time) {
          evs.push({
            date: normalizeDate(t.time),
            title: t.title,
            type: 'milestone',
            subtitle: `${p.name} — ${t.actor}`,
          });
        }
      });
    });

    // Holidays
    holidays.forEach((h) => {
      evs.push({
        date: normalizeDate(h.date),
        title: h.name,
        type: 'holiday',
        subtitle: h.type === 'national' ? 'Libur Nasional' : 'Libur Regional',
      });
    });

    return evs;
  }, [projects, holidays]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface border-b border-border/60 px-6 py-2.5 shrink-0 shadow-card z-10">
        <h2 className="font-display-title text-sm font-extrabold text-on-surface">
          Kalender Proyek
        </h2>
        <p className="text-[11px] text-outline mt-0.5">
          Deadline tender, jadwal delivery, milestone, approval LPHS, timeline, dan hari libur.
        </p>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <CalendarView events={events} onAddEvent={() => navigate('/projects/new')} />
        </div>
      </div>
    </div>
  );
}
