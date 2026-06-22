import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';

interface ProjectCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  requires_lphs: boolean;
  requires_rks: boolean;
  default_workflow_type: 'tender' | 'prospecting';
  color_hex: string;
  sort_order: number;
  is_active: boolean;
}

const INITIAL_CATEGORIES: ProjectCategory[] = [
  { id: 'CAT-01', name: 'Konstruksi & Sipil', code: 'KONSTRUKSI', description: 'Pekerjaan konstruksi bangunan dan sipil', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#2563EB', sort_order: 1, is_active: true },
  { id: 'CAT-02', name: 'IT & Sistem Informasi', code: 'IT_SISTEM', description: 'Pengembangan perangkat lunak dan sistem informasi', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#7C3AED', sort_order: 2, is_active: true },
  { id: 'CAT-03', name: 'Jasa Konsultansi', code: 'KONSULTANSI', description: 'Jasa konsultansi manajemen dan teknis', requires_lphs: false, requires_rks: true, default_workflow_type: 'tender', color_hex: '#0D9488', sort_order: 3, is_active: true },
  { id: 'CAT-04', name: 'Pengadaan Barang', code: 'PENGADAAN', description: 'Pengadaan barang dan perlengkapan', requires_lphs: true, requires_rks: true, default_workflow_type: 'tender', color_hex: '#D97706', sort_order: 4, is_active: true },
  { id: 'CAT-05', name: 'Jasa Umum', code: 'JASA_UMUM', description: 'Penyediaan jasa umum dan outsourcing', requires_lphs: false, requires_rks: true, default_workflow_type: 'prospecting', color_hex: '#0284C7', sort_order: 5, is_active: true },
  { id: 'CAT-06', name: 'Lainnya', code: 'LAINNYA', description: 'Kategori proyek lainnya', requires_lphs: false, requires_rks: false, default_workflow_type: 'prospecting', color_hex: '#6B7280', sort_order: 6, is_active: true },
];

const COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#0284C7', '#DC2626', '#16A34A', '#6B7280', '#EC4899', '#F59E0B'];

export default function MasterCategoryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ProjectCategory[]>(INITIAL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectCategory | null>(null);
  const [form, setForm] = useState<Partial<ProjectCategory>>({});

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ requires_lphs: false, requires_rks: false, default_workflow_type: 'tender', color_hex: '#6B7280', sort_order: categories.length + 1, is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (c: ProjectCategory) => {
    setEditing(c);
    setForm({ ...c });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Nama dan Kode wajib diisi'); return; }
    if (editing) {
      setCategories(categories.map(c => c.id === editing.id ? { ...c, ...form } as ProjectCategory : c));
      toast.success('Kategori berhasil diperbarui');
    } else {
      const id = `CAT-${String(categories.length + 1).padStart(2, '0')}`;
      setCategories([{ ...form, id } as ProjectCategory, ...categories]);
      toast.success('Kategori berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    toast.success('Status kategori diubah');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Master Data</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Kategori Proyek</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Master Kategori Proyek
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{categories.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Klasifikasi proyek berdasarkan jenis pekerjaan.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Kategori</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder="Cari nama atau kode kategori..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari kategori" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Kategori Proyek">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
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
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada kategori ditemukan.</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                        <td className="px-6 py-4 font-mono text-primary font-bold">{c.code}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{c.description}</td>
                        <td className="px-6 py-4 text-center"><Badge variant={c.requires_lphs ? 'success' : 'default'}>{c.requires_lphs ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4 text-center"><Badge variant={c.requires_rks ? 'success' : 'default'}>{c.requires_rks ? 'Ya' : 'Tidak'}</Badge></td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase badge-compact">{c.default_workflow_type}</span></td>
                        <td className="px-6 py-4 text-center"><span className="inline-block w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: c.color_hex }} title={c.color_hex} /></td>
                        <td className="px-6 py-4 text-center text-slate-500">{c.sort_order}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(c.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${c.is_active ? 'bg-success' : 'bg-slate-300'}`} aria-label={`Toggle status ${c.name}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${c.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
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
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editing ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editing ? `ID: ${editing.id}` : 'Buat kategori proyek baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Nama Kategori *</label>
                  <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama kategori" required />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Kode *</label>
                  <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="KODE_UNIK" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Deskripsi</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Deskripsi kategori" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Tipe Workflow</label>
                  <select value={form.default_workflow_type || 'tender'} onChange={e => setForm({ ...form, default_workflow_type: e.target.value as 'tender' | 'prospecting' })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
                    <option value="tender">Tender</option>
                    <option value="prospecting">Prospecting</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Urutan</label>
                  <input type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Membutuhkan LPHS</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lphs" checked={form.requires_lphs === true} onChange={() => setForm({ ...form, requires_lphs: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lphs" checked={form.requires_lphs === false} onChange={() => setForm({ ...form, requires_lphs: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Membutuhkan RKS</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rks" checked={form.requires_rks === true} onChange={() => setForm({ ...form, requires_rks: true })} className="text-primary" /><span className="text-xs">Ya</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="rks" checked={form.requires_rks === false} onChange={() => setForm({ ...form, requires_rks: false })} className="text-primary" /><span className="text-xs">Tidak</span></label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Warna Label</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color_hex: color })} className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${form.color_hex === color ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="catStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="catStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
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
