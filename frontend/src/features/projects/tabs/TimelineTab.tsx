import { useState } from 'react';
import type { Project, TimelineEvent } from '@/types/domain';
import { INITIAL_PROJECTS, INITIAL_TIMELINE_EVENTS } from '@/services/mock-data';
import toast from 'react-hot-toast';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const eventIcons: Record<TimelineEvent['type'], string> = {
  approve: 'verified',
  submit: 'send',
  revision: 'currency_exchange',
  upload: 'cloud_upload',
  status_change: 'published_with_changes',
  comment: 'chat',
};

const eventColors: Record<TimelineEvent['type'], { bg: string; border: string; text: string; dot: string }> = {
  approve: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  submit: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', dot: 'bg-blue-500' },
  revision: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-600', dot: 'bg-rose-500' },
  upload: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  status_change: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-600', dot: 'bg-amber-500' },
  comment: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', dot: 'bg-purple-500' },
};

const typeLabels: Record<TimelineEvent['type'], string> = {
  approve: 'Persetujuan',
  submit: 'Pengajuan',
  revision: 'Revisi',
  upload: 'Unggahan',
  status_change: 'Perubahan Status',
  comment: 'Komentar',
};

export default function TimelineTab({ project: propProject }: TabProps) {
  const project = propProject || INITIAL_PROJECTS[0];
  const events = INITIAL_TIMELINE_EVENTS;
  const [filter, setFilter] = useState<TimelineEvent['type'] | 'all'>('all');

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'status_change', label: 'Update Status' },
    { key: 'upload', label: 'Dokumen' },
  ];

  const handleDownload = (event: TimelineEvent) => {
    if (event.fileName) {
      toast.success(`Mengunduh ${event.fileName}...`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading-section text-base font-bold text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary">history</span>
              Timeline Audit Trail Proyek
            </h3>
            <p className="text-secondary text-xs mt-1">Daftar lengkap riwayat aktivitas, pengunggahan dokumen, dan persetujuan sepanjang siklus proyek.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {filters.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  filter === f.key ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 border border-border text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 before:z-0">
        <div className="relative z-10 flex items-center">
          <div className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
            Timeline Proyek {project.code}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="relative z-10 text-center py-12 text-outline">
            <span className="material-symbols-outlined text-4xl">history</span>
            <p className="text-sm mt-2">Tidak ada event untuk filter ini</p>
          </div>
        )}

        {filteredEvents.map((event) => {
          const colors = eventColors[event.type];
          return (
            <div key={event.id} className="relative z-10 grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-1 flex justify-center lg:justify-start">
                <div className={`w-8 h-8 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center ${colors.text} shadow-sm shrink-0`}>
                  <span className="material-symbols-outlined text-[18px]">{eventIcons[event.type]}</span>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-11 bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                      <Badge size="sm" variant={
                        event.type === 'approve' ? 'success' : event.type === 'status_change' ? 'warning' : event.type === 'upload' ? 'info' : event.type === 'revision' ? 'danger' : 'purple'
                      }>
                        {typeLabels[event.type]}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {event.actor} • {event.role}
                    </p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{event.time}</span>
                </div>

                {event.prevVal && event.newVal && event.type === 'revision' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mt-2 mb-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-border flex flex-col">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Nilai Sebelumnya</span>
                      <span className="text-sm font-semibold text-slate-500 line-through">{event.prevVal}</span>
                    </div>
                    <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-100 flex flex-col">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-rose-600">Nilai Menjadi</span>
                      <span className="text-sm font-bold text-rose-700">{event.newVal}</span>
                    </div>
                  </div>
                )}

                {event.prevVal && event.newVal && event.type === 'status_change' && (
                  <div className="flex items-center gap-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200 w-fit mb-3">
                    <span className="text-xs font-semibold text-amber-800">{event.prevVal}</span>
                    <span className="material-symbols-outlined text-amber-600 text-sm">arrow_forward</span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{event.newVal}</span>
                  </div>
                )}

                {event.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border-l-4 border-primary mb-3">
                    {event.description}
                  </p>
                )}

                {event.fileName && (
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors w-full sm:w-2/3 cursor-pointer" onClick={() => handleDownload(event)}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-red-500 text-3xl">picture_as_pdf</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{event.fileName}</p>
                        {event.fileSize && <p className="text-[10px] text-slate-400">{event.fileSize}</p>}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">download</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={() => toast.success('Seluruh histori telah ditampilkan.')}
          className="px-6 py-2 border border-border bg-white text-secondary hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors inline-flex items-center"
        >
          <span className="material-symbols-outlined mr-1.5 text-[18px]">expand_more</span>
          Muat Riwayat Lebih Lama
        </button>
      </div>
    </div>
  );
}
