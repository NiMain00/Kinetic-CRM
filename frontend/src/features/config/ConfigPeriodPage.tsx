import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal } from '@/components/ui';
import toast from 'react-hot-toast';
import { useMasterDataStore, type MasterPeriod } from '@/stores/masterDataStore';

export default function ConfigPeriodPage() {
  const periods = useMasterDataStore((s) => s.periods);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  useEffect(() => {
    fetchEntity('periods');
  }, [fetchEntity]);
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
    const newPeriod: MasterPeriod = {
      id: `PER-${String(periods.length + 1).padStart(2, '0')}`,
      name: formName,
      code: formName.replace(/\s+/g, '-').toUpperCase(),
      type: 'annual',
      year: parseInt(formYear) || new Date().getFullYear(),
      start_date: formStartDate,
      end_date: formEndDate,
      is_active: false,
      is_locked: false,
      notes: '',
    };
    addData('periods', newPeriod);
    toast.success(`Periode ${formName} berhasil ditambahkan.`);
    setModalOpen(false);
    setFormName('');
    setFormStartDate('');
    setFormEndDate('');
  };

  const handleToggleStatus = (id: string) => {
    const target = periods.find(p => p.id === id);
    if (!target) return;
    const newActive = !target.is_active;
    updateData('periods', id, { is_active: newActive });
    if (newActive) {
      periods.forEach(p => {
        if (p.id !== id && p.is_active) {
          updateData('periods', p.id, { is_active: false });
        }
      });
    }
    toast.success(`Periode ${target.name} sekarang ${target.is_active ? 'NON-AKTIF' : 'AKTIF'}`);
  };

  const activePeriod = periods.find(p => p.is_active);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Periode</h2>
          <p className="text-[11px] text-outline mt-0.5">Kelola periode fiskal untuk pelaporan dan target.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={() => setModalOpen(true)}>
          Tambah Periode
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Total Periode</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{periods.length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Periode Aktif</p>
              <p className="text-xl font-extrabold text-success mt-1">{periods.filter(p => p.is_active).length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Tahun</p>
              <p className="text-xl font-extrabold text-primary mt-1">{new Set(periods.map(p => new Date(p.start_date).getFullYear())).size} Tahun</p>
            </div>
          </div>

          {activePeriod && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              <p className="text-xs font-semibold text-on-surface">
                Periode aktif saat ini: <span className="text-success">{activePeriod.name}</span> ({activePeriod.start_date} - {activePeriod.end_date})
              </p>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-none table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
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
                    <tr key={p.id} className="hover:bg-surface-container-low/65 transition-colors">
                      <td className="px-6 py-4 font-bold text-on-surface">{p.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{p.start_date}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{p.end_date}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-semibold badge-compact">{new Date(p.start_date).getFullYear()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleStatus(p.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${p.is_active ? 'bg-success' : 'bg-surface-container-highest'}`}>
                          <span className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${p.is_active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { toast.success(`Edit periode ${p.name}`); }} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer btn-compact" title="Edit">
                          <span className="material-symbols-outlined text-[18px] icon-compact">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low border-t border-border flex justify-between items-center text-[10px] text-outline">
              <span>{periods.length} periode terdaftar</span>
              <span>Sandbox environment</span>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Periode Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-5 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-on-surface block">Nama Periode *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Q1 2026" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-on-surface block">Tanggal Mulai *</label>
              <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-on-surface block">Tanggal Akhir *</label>
              <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-on-surface block">Tahun</label>
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
