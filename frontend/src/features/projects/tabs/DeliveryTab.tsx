import { useState, useEffect } from 'react';
import type { Project, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, Button } from '@/components/ui';

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
  const [actualEndDate, setActualEndDate] = useState(project?.delivery?.actualEndDate || '');
  const [deliveryNote, setDeliveryNote] = useState(project?.delivery?.note || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setStartDate(project?.delivery?.startDate || '');
    setEndDate(project?.delivery?.endDate || '');
    setActualEndDate(project?.delivery?.actualEndDate || '');
    setDeliveryNote(project?.delivery?.note || '');
    setErrors({});
  }, [project?.id]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = 'Tanggal mulai wajib diisi';
    if (!endDate) errs.endDate = 'Estimasi tanggal sampai wajib diisi';
    if (startDate && endDate && endDate <= startDate) {
      errs.endDate = 'Tanggal selesai harus setelah tanggal mulai';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!project?.id) return;
    updateProjectDelivery(project.id, { startDate, endDate, note: deliveryNote });
    onShowNotification?.('Draf jadwal delivery berhasil disimpan', 'success');
  };

  const handleConfirm = () => {
    if (!project?.id) return;
    if (!validate()) return;
    updateProjectDelivery(project.id, { startDate, endDate, note: deliveryNote });

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Target Delivery Dikonfirmasi',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: 'Jadwal pengiriman (Target Delivery) berhasil dikonfirmasi. Proyek berpindah ke tahap Eksekusi.',
    };
    addTimelineEvent(project.id, event);
    updateProject(project.id, { status: 'Executing', phase: 'Executing' });
    onShowNotification?.('Jadwal pengiriman (Target Delivery) berhasil dikonfirmasi. Proyek memasuki tahap Eksekusi.', 'success');
  };

  const handleMarkComplete = () => {
    if (!project?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    const finalActualEndDate = actualEndDate || today;

    updateProjectDelivery(project.id, {
      startDate, endDate, note: deliveryNote,
      actualEndDate: finalActualEndDate,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'Proyek Selesai',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: 'Proyek telah selesai dan ditutup.',
    };
    addTimelineEvent(project.id, event);
    updateProject(project.id, { status: 'Selesai', phase: 'Selesai', progress: 100 });
    onShowNotification?.('Proyek berhasil ditandai selesai!', 'success');
  };

  const isCompleted = project?.status === 'Selesai';
  const isExecuting = project?.status === 'Executing';

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {isCompleted && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl">
          <span className="material-symbols-outlined text-success text-[24px]">check_circle</span>
          <div>
            <p className="text-sm font-bold text-emerald-800">Proyek Telah Selesai</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Semua tahapan proyek telah diselesaikan.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-border rounded-xl shadow-sm p-8 space-y-8">
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">calendar_month</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: '' })); }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface ${errors.startDate ? 'border-danger' : 'border-border'}`}
                    disabled={isCompleted}
                  />
                </div>
                {errors.startDate && <p className="text-xs text-danger mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Estimasi Tanggal Sampai</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">event_available</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: '' })); }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface ${errors.endDate ? 'border-danger' : 'border-border'}`}
                    disabled={isCompleted}
                  />
                </div>
                {errors.endDate && <p className="text-xs text-danger mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {isCompleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Selesai Aktual</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">check_calendar</span>
                    <input
                      type="date"
                      value={actualEndDate}
                      onChange={e => setActualEndDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface"
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Instruksi Logistik</label>
              <textarea
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none text-on-surface"
                placeholder="Masukkan rincian khusus logistik atau persyaratan khusus di lapangan..."
                disabled={isCompleted}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6 border-border">
            {!isCompleted && (
              <Button variant="secondary" onClick={handleSave} leftIcon={<span className="material-symbols-outlined text-[18px]">drafts</span>}>
                Simpan Draft
              </Button>
            )}
            {!isCompleted && !isExecuting && (
              <Button onClick={handleConfirm} rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>
                Konfirmasi & Mulai Eksekusi
              </Button>
            )}
            {isExecuting && (
              <button
                onClick={handleMarkComplete}
                className="px-5 py-2.5 bg-success text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Selesaikan Proyek
              </button>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card padding="lg">
            <h4 className="font-heading-section text-xs font-bold text-on-surface uppercase tracking-wider mb-4">Informasi Proyek</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Klien</span>
                <span className="font-semibold text-on-surface">{project?.client}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Nilai Proyek</span>
                <span className="font-semibold text-primary">{formatCurrency(project?.estimatedValue || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Lokasi</span>
                <span className="font-semibold text-on-surface">{project?.location}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-medium">Progress Overall</span>
                <span className="font-semibold text-on-surface bg-surface-container px-2 py-0.5 rounded text-[10px]">{project?.progress || 0}%</span>
              </div>
              {isCompleted && project?.delivery?.actualEndDate && (
                <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-border">
                  <span className="text-secondary font-medium">Selesai Aktual</span>
                  <span className="font-semibold text-success">{formatDate(project.delivery.actualEndDate)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
