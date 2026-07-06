import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card, CurrencyInput } from '@/components/ui';
import { useMasterDataStore, type MasterCompetitor } from '@/stores/masterDataStore';
import { formatCurrency } from '@/utils/formatters';

export default function MasterCompetitorPage() {
  const navigate = useNavigate();
  const competitors = useMasterDataStore((s) => s.competitors);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterCompetitor | null>(null);
  const [form, setForm] = useState<Partial<MasterCompetitor>>({});

  const filtered = competitors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({});
    setDrawerOpen(true);
  };

  const openEdit = (c: MasterCompetitor) => {
    setEditing(c);
    setForm({ ...c });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Nama kompetitor wajib diisi'); return; }
    if (editing) {
      updateData<MasterCompetitor>('competitors', editing.id, form);
      toast.success('Kompetitor berhasil diperbarui');
    } else {
      const id = `CP-${String(competitors.length + 1).padStart(3, '0')}`;
      addData<MasterCompetitor>('competitors', { code: form.name?.slice(0, 5).toUpperCase() || '', industry_id: null, bidang_usaha: '', website: '', description: form.notes || '', is_active: true, ...form, id } as MasterCompetitor);
      toast.success('Kompetitor berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    const target = competitors.find(c => c.id === id);
    deleteData('competitors', id);
    toast.success(`Kompetitor ${target?.name} berhasil dihapus`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Master Kompetitor
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{competitors.length}</span>
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Pantau pesaing bisnis dan strategi harga mereka.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Kompetitor</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input type="text" placeholder="Cari nama kompetitor..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari kompetitor" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Kompetitor">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama</th>
                    <th className="px-6 py-3.5">Estimasi Harga</th>
                    <th className="px-6 py-3.5">Keunggulan</th>
                    <th className="px-6 py-3.5">Catatan</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-outline italic">Tidak ada kompetitor ditemukan.</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface">{c.name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{formatCurrency(c.min_price)} - {formatCurrency(c.max_price)}</td>
                        <td className="px-6 py-4 text-secondary max-w-[200px] truncate">{c.advantages || '-'}</td>
                        <td className="px-6 py-4 text-outline max-w-[200px] truncate">{c.notes || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-950/30 text-outline hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
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
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">{editing ? 'Edit Kompetitor' : 'Tambah Kompetitor Baru'}</h3>
                <p className="text-[10px] text-outline mt-1">{editing ? `ID: ${editing.id}` : 'Masukkan data kompetitor baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Nama Kompetitor *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama perusahaan" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CurrencyInput label="Harga Minimum" value={form.min_price || 0} onChange={(val) => setForm({ ...form, min_price: val ?? 0 })} placeholder="Rp 0" />
                </div>
                <div className="space-y-2">
                  <CurrencyInput label="Harga Maksimum" value={form.max_price || 0} onChange={(val) => setForm({ ...form, max_price: val ?? 0 })} placeholder="Rp 0" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Keunggulan</label>
                <textarea value={form.advantages || ''} onChange={e => setForm({ ...form, advantages: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Keunggulan kompetitor" />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Catatan</label>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Catatan tambahan" />
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
