import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMasterDataStore, type MasterCategory } from '@/stores/masterDataStore';

const COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#0284C7', '#DC2626', '#16A34A', '#6B7280', '#EC4899', '#F59E0B'];

export default function MasterCategoryPage() {
  const navigate = useNavigate();
  const categories = useMasterDataStore((s) => s.categories);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  useEffect(() => { fetchEntity('categories'); }, [fetchEntity]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterCategory | null>(null);
  const [form, setForm] = useState<Partial<MasterCategory>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => categories.filter(c => {
    const q = debouncedSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  }), [categories, debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ requires_lphs: false, requires_rks: false, default_workflow_type: 'tender', color_hex: '#6B7280', sort_order: categories.length + 1, is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (c: MasterCategory) => {
    setEditing(c);
    setForm({ ...c });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Nama dan Kode wajib diisi'); return; }
    if (editing) {
      updateData<MasterCategory>('categories', editing.id, form);
      toast.success('Kategori berhasil diperbarui');
    } else {
      const id = `CAT-${String(categories.length + 1).padStart(2, '0')}`;
      addData<MasterCategory>('categories', { ...form, id } as MasterCategory);
      toast.success('Kategori berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteData('categories', deleteConfirm);
    toast.success('Kategori berhasil dihapus');
    setDeleteConfirm(null);
  };

  const toggleStatus = (id: string) => {
    const current = categories.find(c => c.id === id);
    if (current) {
      updateData<MasterCategory>('categories', id, { is_active: !current.is_active });
      toast.success('Status kategori diubah');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface-container-lowest border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface flex items-center gap-2">
            Master Kategori Proyek
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{categories.length}</span>
          </h2>
          <p className="text-[11px] text-outline mt-0.5">Klasifikasi proyek berdasarkan jenis pekerjaan.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Kategori</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input type="text" placeholder="Cari nama atau kode kategori..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari kategori" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto scrollbar-none table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Kategori Proyek">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama</th>
                    <th className="px-6 py-3.5">Kode</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5 text-center">LPHS</th>
                    <th className="px-6 py-3.5 text-center">RKS</th>
                    <th className="px-6 py-3.5">Workflow</th>
                    <th className="px-6 py-3.5 text-center">Warna</th>
                    <th className="px-6 py-3.5 text-center">Urutan</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-outline italic">Tidak ada kategori ditemukan.</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="hover:bg-surface-container-low/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface">{c.name}</td>
                        <td className="px-6 py-4 font-mono text-primary font-bold">{c.code}</td>
                        <td className="px-6 py-4 text-secondary max-w-[200px] truncate">{c.description}</td>
                        <td className="px-6 py-4 text-center"><Badge variant={c.requires_lphs ? 'success' : 'default'}>{c.requires_lphs ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4 text-center"><Badge variant={c.requires_rks ? 'success' : 'default'}>{c.requires_rks ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-bold uppercase badge-compact">{c.default_workflow_type}</span></td>
                        <td className="px-6 py-4 text-center"><span className="inline-block w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c.color_hex }} title={c.color_hex} /></td>
                        <td className="px-6 py-4 text-center text-secondary">{c.sort_order}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(c.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${c.is_active ? 'bg-success' : 'bg-surface-container-highest'}`} aria-label={`Toggle status ${c.name}`}>
                            <span className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${c.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:bg-red-950/30 text-outline hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
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
                <h3 className="font-display-title text-sm font-extrabold text-on-surface">{editing ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <p className="text-[10px] text-outline mt-1">{editing ? `ID: ${editing.id}` : 'Buat kategori proyek baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Nama Kategori *</label>
                  <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama kategori" required />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Kode *</label>
                  <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="KODE_UNIK" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Deskripsi</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Deskripsi kategori" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Tipe Workflow</label>
                  <select value={form.default_workflow_type || 'tender'} onChange={e => setForm({ ...form, default_workflow_type: e.target.value as 'tender' | 'prospecting' })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-surface-container-lowest">
                    <option value="tender">Tender</option>
                    <option value="prospecting">Prospecting</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Urutan</label>
                  <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Membutuhkan LPHS</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lphs" checked={form.requires_lphs === true} onChange={() => setForm({ ...form, requires_lphs: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lphs" checked={form.requires_lphs === false} onChange={() => setForm({ ...form, requires_lphs: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Membutuhkan RKS</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rks" checked={form.requires_rks === true} onChange={() => setForm({ ...form, requires_rks: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rks" checked={form.requires_rks === false} onChange={() => setForm({ ...form, requires_rks: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Warna Label</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color_hex: color })} className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${form.color_hex === color ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="catStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="catStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="font-bold text-sm text-on-surface mb-2">Hapus Kategori?</h3>
            <p className="text-xs text-secondary mb-4">
              Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
