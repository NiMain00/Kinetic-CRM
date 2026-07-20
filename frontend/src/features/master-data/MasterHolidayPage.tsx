import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMasterDataStore, type MasterHoliday } from '@/stores/masterDataStore';

export default function MasterHolidayPage() {
  const navigate = useNavigate();
  const holidays = useMasterDataStore((s) => s.holidays);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  useEffect(() => { fetchEntity('holidays'); }, [fetchEntity]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterHoliday | null>(null);
  const [form, setForm] = useState<Partial<MasterHoliday>>({});

  const years = [...new Set(holidays.map(h => h.year))].sort();

  const filtered = useMemo(() => holidays.filter(h => {
    const q = debouncedSearch.toLowerCase();
    return (!q || h.name.toLowerCase().includes(q)) && (yearFilter === 'all' || h.year === yearFilter);
  }), [holidays, debouncedSearch, yearFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ type: 'national', year: new Date().getFullYear(), is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (h: MasterHoliday) => {
    setEditing(h);
    setForm({ ...h });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date) { toast.error('Nama dan Tanggal libur wajib diisi'); return; }
    const year = new Date(form.date).getFullYear();
    const data = { ...form, year } as MasterHoliday;
    if (editing) {
      updateData<MasterHoliday>('holidays', editing.id, data);
      toast.success('Hari libur berhasil diperbarui');
    } else {
      const id = `HOL-${String(holidays.length + 1).padStart(2, '0')}`;
      addData<MasterHoliday>('holidays', { ...data, id } as MasterHoliday);
      toast.success('Hari libur berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    const target = holidays.find(h => h.id === id);
    deleteData('holidays', id);
    toast.success(`Hari libur ${target?.name} dihapus`);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface-container-lowest border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Master Hari Libur
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{holidays.length}</span>
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Kalender hari libur nasional dan regional.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Hari Libur</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input type="text" placeholder="Cari hari libur..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari hari libur" />
              </div>
              <select value={String(yearFilter)} onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-surface-container-lowest border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none" aria-label="Filter tahun">
                <option value="all">Semua Tahun</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setYearFilter('all'); }}>Reset Filter</Button>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Hari Libur">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama Libur</th>
                    <th className="px-6 py-3.5">Tanggal</th>
                    <th className="px-6 py-3.5">Tipe</th>
                    <th className="px-6 py-3.5">Tahun</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-outline italic">Tidak ada hari libur ditemukan.</td></tr>
                  ) : (
                    filtered.map(h => (
                      <tr key={h.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface">{h.name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{formatDate(h.date)}</td>
                        <td className="px-6 py-4"><Badge variant={h.type === 'national' ? 'info' : 'warning'}>{h.type === 'national' ? 'Nasional' : 'Regional'}</Badge></td>
                        <td className="px-6 py-4 font-mono text-secondary">{h.year}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-950/30 text-outline hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">{editing ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'}</h3>
                <p className="text-[10px] text-outline mt-1">{editing ? `ID: ${editing.id}` : 'Masukkan data hari libur'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Nama Hari Libur *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama hari libur" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Tanggal *</label>
                <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Tipe</label>
                <select value={form.type || 'national'} onChange={e => setForm({ ...form, type: e.target.value as MasterHoliday['type'] })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                  <option value="national">Nasional</option>
                  <option value="regional">Regional</option>
                </select>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={handleSave} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editing ? 'Simpan' : 'Tambah'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
