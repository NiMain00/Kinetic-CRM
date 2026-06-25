import { useState, useEffect } from 'react';
import type { Project, MilestoneEntry, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, Button, Input } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function DeliveryTab({ project, onShowNotification }: TabProps) {
  const updateProject = useProjectStore((s) => s.updateProject);
  const updateProjectDelivery = useProjectStore((s) => s.updateProjectDelivery);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);

  const [startDate, setStartDate] = useState(project?.delivery?.startDate || '');
  const [endDate, setEndDate] = useState(project?.delivery?.endDate || '');
  const [deliveryNote, setDeliveryNote] = useState(project?.delivery?.note || '');
  const [progress, setProgress] = useState(project?.delivery?.progress ?? 0);
  const [milestones, setMilestones] = useState<MilestoneEntry[]>(project?.delivery?.milestones || []);

  // Sync when switching projects
  useEffect(() => {
    setStartDate(project?.delivery?.startDate || '');
    setEndDate(project?.delivery?.endDate || '');
    setDeliveryNote(project?.delivery?.note || '');
    setProgress(project?.delivery?.progress ?? 0);
    setMilestones(project?.delivery?.milestones || []);
  }, [project?.id]);

  const handleMilestoneToggle = (id: string) => {
    const updated = milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    setMilestones(updated);
    // Auto-persist on toggle
    if (project?.id) {
      updateProjectDelivery(project.id, { milestones: updated });
    }
  };

  const handleSave = () => {
    if (!project?.id) return;
    updateProjectDelivery(project.id, { startDate, endDate, note: deliveryNote, progress, milestones });
    onShowNotification?.('Draf jadwal delivery berhasil disimpan', 'success');
  };

  const handleConfirm = () => {
    if (!project?.id) return;
    // Persist
    updateProjectDelivery(project.id, { startDate, endDate, note: deliveryNote, progress, milestones });
    // Add timeline event
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Target Delivery Dikonfirmasi',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: 'Jadwal pengiriman (Target Delivery) berhasil dikonfirmasi.',
    };
    addTimelineEvent(project.id, event);
    // Advance status
    updateProject(project.id, { status: 'Executing', phase: 'Executing' });
    onShowNotification?.('Jadwal pengiriman (Target Delivery) berhasil dikonfirmasi', 'success');
  };

  const completedCount = milestones.filter(m => m.completed).length;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-white border border-border rounded-xl shadow-sm p-8 space-y-8">
          <div>
            <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary">local_shipping</span>
              Input Jadwal Pengiriman (Delivery Schedule)
            </h3>
            <p className="text-xs text-secondary">Silakan tentukan perkiraan tanggal mulai pengiriman material serta target estimasi kedatangan di lokasi proyek.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Mulai Delivery</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">calendar_month</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800" />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Estimasi Tanggal Sampai</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">event_available</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800" />
                </div>
              </div>
            </div>

            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Progress Pengiriman (%)</label>
              <div className="flex items-center gap-4">
                <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className="flex-1 accent-primary" />
                <span className="font-bold text-sm text-primary w-10 text-right">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Progress Milestone</label>
              <div className="space-y-2">
                {milestones.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={() => handleMilestoneToggle(m.id)}
                      className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${m.completed ? 'text-on-surface line-through opacity-60' : 'text-on-surface'}`}>{m.name}</p>
                      {m.date && <p className="text-[10px] text-outline">{formatDate(m.date)}</p>}
                    </div>
                    {m.completed && <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>}
                  </label>
                ))}
              </div>
              <p className="text-xs text-secondary mt-2">{completedCount} dari {milestones.length} milestone selesai</p>
            </div>

            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Instruksi Logistik</label>
              <textarea
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none text-slate-800"
                placeholder="Masukkan rincian khusus logistik atau persyaratan khusus di lapangan..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6 border-border">
            <Button variant="secondary" onClick={handleSave} leftIcon={<span className="material-symbols-outlined text-[18px]">drafts</span>}>
              Simpan Draft
            </Button>
            <Button onClick={handleConfirm} rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>
              Konfirmasi & Selesaikan
            </Button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card padding="lg">
            <h4 className="font-heading-section text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Metrik Logistik</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Klien</span>
                <span className="font-semibold text-slate-800">{project?.client}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Nilai Proyek</span>
                <span className="font-semibold text-primary">{formatCurrency(project?.estimatedValue || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Lokasi</span>
                <span className="font-semibold text-slate-800">{project?.location}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-medium">Progress Overall</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{project?.progress || 0}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
