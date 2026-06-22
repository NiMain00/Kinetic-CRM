import React, { useState } from 'react';
import { Button, Badge, Modal } from '@/components/ui';
import toast from 'react-hot-toast';

interface FiscalPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  year: number;
}

const INITIAL_PERIODS: FiscalPeriod[] = [
  { id: 'PRD-001', name: 'Januari - Maret 2026', startDate: '2026-01-01', endDate: '2026-03-31', status: 'inactive', year: 2026 },
  { id: 'PRD-002', name: 'April - Juni 2026', startDate: '2026-04-01', endDate: '2026-06-30', status: 'active', year: 2026 },
  { id: 'PRD-003', name: 'Juli - September 2026', startDate: '2026-07-01', endDate: '2026-09-30', status: 'inactive', year: 2026 },
  { id: 'PRD-004', name: 'Oktober - Desember 2026', startDate: '2026-10-01', endDate: '2026-12-31', status: 'inactive', year: 2026 },
  { id: 'PRD-005', name: 'Q1 2027', startDate: '2027-01-01', endDate: '2027-03-31', status: 'inactive', year: 2027 },
];

export default function ConfigPeriodPage() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>(INITIAL_PERIODS);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formStartDate || !formEndDate) {
      toast.error('Nama, tanggal mulai, dan tanggal akhir wajib diisi.');
      return;
    }
    const newPeriod: FiscalPeriod = {
      id: `PRD-${String(periods.length + 1).padStart(3, '0')}`,
      name: formName,
      startDate: formStartDate,
      endDate: formEndDate,
      status: 'inactive',
      year: Number(formYear) || new Date().getFullYear(),
    };
    setPeriods([...periods, newPeriod]);
    toast.success(`Periode ${formName} berhasil ditambahkan.`);
    setModalOpen(false);
    setFormName('');
    setFormStartDate('');
    setFormEndDate('');
  };

  const handleToggleStatus = (id: string) => {
    setPeriods(periods.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'active' ? 'inactive' : 'active';
        return { ...p, status: newStatus as 'active' | 'inactive' };
      }
      if (p.id !== id && p.status === 'active') {
        return { ...p, status: 'inactive' as const };
      }
      return p;
    }));
    const target = periods.find(p => p.id === id);
    toast.success(`Periode ${target?.name} sekarang ${target?.status === 'active' ? 'NON-AKTIF' : 'AKTIF'}`);
  };

  const activePeriod = periods.find(p => p.status === 'active');

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
            <span className="font-semibold uppercase tracking-wider">Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Periode Fiskal</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">Konfigurasi Periode</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola periode fiskal untuk pelaporan dan target.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={() => setModalOpen(true)}>
          Tambah Periode
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Periode</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{periods.length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Periode Aktif</p>
              <p className="text-xl font-extrabold text-success mt-1">{periods.filter(p => p.status === 'active').length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Tahun</p>
              <p className="text-xl font-extrabold text-primary mt-1">{new Set(periods.map(p => p.year)).size} Tahun</p>
            </div>
          </div>

          {activePeriod && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              <p className="text-xs font-semibold text-slate-700">
                Periode aktif saat ini: <span className="text-success">{activePeriod.name}</span> ({activePeriod.startDate} - {activePeriod.endDate})
              </p>
            </div>
          )}

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama Periode</th>
                    <th className="px-6 py-3.5">Tanggal Mulai</th>
                    <th className="px-6 py-3.5">Tanggal Akhir</th>
                    <th className="px-6 py-3.5">Tahun</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {periods.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/65 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-slate-600">{p.startDate}</td>
                      <td className="px-6 py-4 text-slate-600">{p.endDate}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold badge-compact">{p.year}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleStatus(p.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${p.status === 'active' ? 'bg-success' : 'bg-slate-300'}`}>
                          <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${p.status === 'active' ? 'translate-x-2' : '-translate-x-2'}`}></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { toast.success(`Edit periode ${p.name}`); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer btn-compact" title="Edit">
                          <span className="material-symbols-outlined text-[18px] icon-compact">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-border flex justify-between items-center text-[10px] text-slate-400">
              <span>{periods.length} periode terdaftar</span>
              <span>Sandbox environment</span>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Periode Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-5 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Nama Periode *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Q1 2026" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Tanggal Mulai *</label>
              <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Tanggal Akhir *</label>
              <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Tahun</label>
            <input type="number" value={formYear} onChange={e => setFormYear(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" min={2020} max={2050} />
          </div>
        </form>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleCreate}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}
