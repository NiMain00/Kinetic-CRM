import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMasterDataStore, type MasterLossReason } from '@/stores/masterDataStore';

export default function MasterLossReasonPage() {
  const navigate = useNavigate();
  const lossReasons = useMasterDataStore((s) => s.lossReasons);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterLossReason | null>(null);
  const [form, setForm] = useState<Partial<MasterLossReason>>({});

  const filtered = useMemo(() => lossReasons.filter(r => {
    const q = debouncedSearch.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
  }), [lossReasons, debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (r: MasterLossReason) => {
    setEditing(r);
    setForm({ ...r });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Nama dan Kode alasan wajib diisi'); return; }
    if (editing) {
      updateData<MasterLossReason>('lossReasons', editing.id, form);
      toast.success('Alasan kekalahan berhasil diperbarui');
    } else {
      const id = `LR-${String(lossReasons.length + 1).padStart(2, '0')}`;
      const maxSort = Math.max(...lossReasons.map(r => r.sort_order), 0);
      addData<MasterLossReason>('lossReasons', { category: 'lainnya', sort_order: maxSort + 1, ...form, id } as MasterLossReason);
      toast.success('Alasan kekalahan berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    const current = lossReasons.find(r => r.id === id);
    if (current) {
      updateData<MasterLossReason>('lossReasons', id, { is_active: !current.is_active });
      toast.success('Status alasan kekalahan diubah');
    }
  };

  const handleDelete = (id: string) => {
    const target = lossReasons.find(r => r.id === id);
    deleteData('lossReasons', id);
    toast.success(`Alasan ${target?.name} dihapus`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Master Alasan Kekalahan
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{lossReasons.length}</span>
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Alasan mengapa proyek atau tender tidak dimenangkan.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Alasan</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input type="text" placeholder="Cari alasan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari alasan kekalahan" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Alasan Kekalahan">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama Alasan</th>
                    <th className="px-6 py-3.5">Kode</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-outline italic">Tidak ada alasan ditemukan.</td></tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface">{r.name}</td>
                        <td className="px-6 py-4 font-mono text-primary font-bold">{r.code}</td>
                        <td className="px-6 py-4 text-secondary max-w-[250px] truncate">{r.description || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(r.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${r.is_active ? 'bg-success' : 'bg-surface-container-highest'}`} aria-label={`Toggle status ${r.name}`}>
                            <span className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${r.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-950/30 text-outline hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
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
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">{editing ? 'Edit Alasan Kekalahan' : 'Tambah Alasan Kekalahan Baru'}</h3>
                <p className="text-[10px] text-outline mt-1">{editing ? `ID: ${editing.id}` : 'Buat alasan kekalahan baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Nama Alasan *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama alasan" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Kode *</label>
                <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="KODE_ALASAN" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Deskripsi</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Deskripsi alasan" />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lrStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lrStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
                </div>
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
