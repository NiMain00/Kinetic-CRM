import { useState } from 'react';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
import { formatCurrency, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { Card, Button, Input } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

interface Milestone {
  id: string;
  name: string;
  completed: boolean;
  date?: string;
}

export default function DeliveryTab({ project: propProject }: TabProps) {
  const project = propProject || INITIAL_PROJECTS[0];
  const [startDate, setStartDate] = useState('2026-06-20');
  const [endDate, setEndDate] = useState('2026-06-28');
  const [deliveryNote, setDeliveryNote] = useState('Kirim bertahap menggunakan kontainer transit utama. Seluruh armada truk wajib melewati ruko pengecekan berat muatan di gerbang exit tol barat.');
  const [progress, setProgress] = useState(35);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', name: 'Persiapan dokumen pengiriman', completed: true, date: '2026-06-18' },
    { id: '2', name: 'Pengecekan dan packing material', completed: true, date: '2026-06-19' },
    { id: '3', name: 'Pengiriman gelombang 1', completed: false, date: '2026-06-22' },
    { id: '4', name: 'Pengiriman gelombang 2', completed: false },
    { id: '5', name: 'Quality check di lokasi', completed: false },
    { id: '6', name: 'Serah terima material', completed: false },
  ]);

  const handleMilestoneToggle = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    toast.success('Status milestone diperbarui');
  };

  const handleSave = () => {
    toast.success('Draf jadwal delivery berhasil disimpan');
  };

  const handleConfirm = () => {
    toast.success('Jadwal pengiriman (Target Delivery) berhasil dikonfirmasi');
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
                <span className="font-semibold text-slate-800">{project.client}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Nilai Proyek</span>
                <span className="font-semibold text-primary">{formatCurrency(project.estimatedValue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-border">
                <span className="text-secondary font-medium">Lokasi</span>
                <span className="font-semibold text-slate-800">{project.location}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary font-medium">Progress Overall</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{project.progress}%</span>
              </div>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center">
                <span className="material-symbols-outlined mr-1.5 text-slate-400 text-[18px]">map</span>
                Pratinjau Distribusi
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">Aktif</span>
            </div>
            <div className="relative h-44 bg-slate-200 overflow-hidden flex items-center justify-center">
              <img
                referrerPolicy="no-referrer"
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80"
                alt="Logistics Map"
                className="w-full h-full object-cover filter brightness-90 saturate-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-white flex flex-col">
                <span className="text-[10px] font-mono tracking-wider opacity-90 uppercase">Transit Center</span>
                <span className="text-xs font-bold drop-shadow">{project.location}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
