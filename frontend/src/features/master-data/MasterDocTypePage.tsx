import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';
import { useMasterDataStore, type MasterDocType } from '@/stores/masterDataStore';

const CATEGORIES = ['Tender', 'Prospecting', 'Both'];

export default function MasterDocTypePage() {
  const navigate = useNavigate();
  const docTypes = useMasterDataStore((s) => s.docTypes);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const deleteData = useMasterDataStore((s) => s.deleteData);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MasterDocType | null>(null);
  const [form, setForm] = useState<Partial<MasterDocType>>({});

  const filtered = docTypes.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ category: 'Both', is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (d: MasterDocType) => {
    setEditing(d);
    setForm({ ...d });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Nama dan Kode wajib diisi'); return; }
    if (editing) {
      updateData<MasterDocType>('docTypes', editing.id, form);
      toast.success('Tipe dokumen berhasil diperbarui');
    } else {
      const id = `DT-${String(docTypes.length + 1).padStart(2, '0')}`;
      addData<MasterDocType>('docTypes', { ...form, id } as MasterDocType);
      toast.success('Tipe dokumen berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    const current = docTypes.find(d => d.id === id);
    if (current) {
      updateData<MasterDocType>('docTypes', id, { is_active: !current.is_active });
      toast.success('Status tipe dokumen diubah');
    }
  };

  const handleDelete = (id: string) => {
    const target = docTypes.find(d => d.id === id);
    deleteData('docTypes', id);
    toast.success(`Tipe dokumen ${target?.name} dihapus`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Master Tipe Dokumen
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{docTypes.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola tipe dokumen yang digunakan dalam proses tender dan proyek.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Tipe Dokumen</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder="Cari nama atau kode dokumen..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari tipe dokumen" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Tipe Dokumen">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama</th>
                    <th className="px-6 py-3.5">Kode</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada tipe dokumen ditemukan.</td></tr>
                  ) : (
                    filtered.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{d.name}</td>
                        <td className="px-6 py-4 font-mono text-primary font-bold">{d.code}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[250px] truncate">{d.description}</td>
                        <td className="px-6 py-4"><Badge variant={d.category === 'Tender' ? 'info' : d.category === 'Prospecting' ? 'warning' : 'default'}>{d.category}</Badge></td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(d.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${d.is_active ? 'bg-success' : 'bg-slate-300'}`} aria-label={`Toggle status ${d.name}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${d.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editing ? 'Edit Tipe Dokumen' : 'Tambah Tipe Dokumen Baru'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editing ? `ID: ${editing.id}` : 'Buat tipe dokumen baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Nama Tipe Dokumen *</label>
                  <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama dokumen" required />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Kode *</label>
                  <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="KODE_DOKUMEN" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Deskripsi</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Deskripsi tipe dokumen" />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Kategori</label>
                <select value={form.category || 'Both'} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="dtStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="dtStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-border bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={handleSave} className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-colors cursor-pointer">{editing ? 'Simpan' : 'Tambah'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
