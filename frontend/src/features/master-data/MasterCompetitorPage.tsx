import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';

interface Competitor {
  id: string;
  name: string;
  min_price: number;
  max_price: number;
  advantages: string;
  notes: string;
}

const INITIAL_COMPETITORS: Competitor[] = [
  { id: 'CP-001', name: 'PT Astra Modern Ltd', min_price: 500000000, max_price: 1500000000, advantages: 'Pengalaman luas di konstruksi, jaringan kuat', notes: 'Kompetitor utama di tender infrastruktur' },
  { id: 'CP-002', name: 'Global Enterprise Solutions', min_price: 300000000, max_price: 800000000, advantages: 'Tim IT berpengalaman, sertifikasi internasional', notes: 'Pesaing kuat di tender IT' },
  { id: 'CP-003', name: 'PT Nippon Power Corp', min_price: 750000000, max_price: 2000000000, advantages: 'Teknologi mutakhir, dukungan purna jual', notes: '' },
  { id: 'CP-004', name: 'PT Tekno Konstruksi Indonesia', min_price: 400000000, max_price: 1200000000, advantages: 'Harga kompetitif, proyek tepat waktu', notes: 'Kompetitor terkuat di sektor konstruksi sipil' },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function MasterCompetitorPage() {
  const navigate = useNavigate();
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [form, setForm] = useState<Partial<Competitor>>({});

  const filtered = competitors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({});
    setDrawerOpen(true);
  };

  const openEdit = (c: Competitor) => {
    setEditing(c);
    setForm({ ...c });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Nama kompetitor wajib diisi'); return; }
    if (editing) {
      setCompetitors(competitors.map(c => c.id === editing.id ? { ...c, ...form } as Competitor : c));
      toast.success('Kompetitor berhasil diperbarui');
    } else {
      const id = `CP-${String(competitors.length + 1).padStart(3, '0')}`;
      setCompetitors([{ ...form, id } as Competitor, ...competitors]);
      toast.success('Kompetitor berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    const target = competitors.find(c => c.id === id);
    setCompetitors(competitors.filter(c => c.id !== id));
    toast.success(`Kompetitor ${target?.name} berhasil dihapus`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Master Data</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Kompetitor</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Master Kompetitor
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{competitors.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Pantau pesaing bisnis dan strategi harga mereka.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Kompetitor</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder="Cari nama kompetitor..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari kompetitor" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" role="table" aria-label="Daftar Kompetitor">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama</th>
                    <th className="px-6 py-3.5">Estimasi Harga</th>
                    <th className="px-6 py-3.5">Keunggulan</th>
                    <th className="px-6 py-3.5">Catatan</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada kompetitor ditemukan.</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                        <td className="px-6 py-4 text-slate-600">{formatCurrency(c.min_price)} - {formatCurrency(c.max_price)}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{c.advantages || '-'}</td>
                        <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">{c.notes || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined text-[18px]">delete</span></button>
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
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editing ? 'Edit Kompetitor' : 'Tambah Kompetitor Baru'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editing ? `ID: ${editing.id}` : 'Masukkan data kompetitor baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Nama Kompetitor *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama perusahaan" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Harga Minimum (Rp)</label>
                  <input type="number" value={form.min_price || ''} onChange={e => setForm({ ...form, min_price: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Harga Maksimum (Rp)</label>
                  <input type="number" value={form.max_price || ''} onChange={e => setForm({ ...form, max_price: Number(e.target.value) })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Keunggulan</label>
                <textarea value={form.advantages || ''} onChange={e => setForm({ ...form, advantages: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Keunggulan kompetitor" />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Catatan</label>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Catatan tambahan" />
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
