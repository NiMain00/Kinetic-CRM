import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Card } from '@/components/ui';

interface LossReason {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

const INITIAL_LOSS_REASONS: LossReason[] = [
  { id: 'LR-01', name: 'Harga Penawaran Terlalu Tinggi', code: 'HARGA_TERLALU_TINGGI', description: 'Harga yang ditawarkan melebihi batas wajar', is_active: true },
  { id: 'LR-02', name: 'Harga Tidak Kompetitif', code: 'HARGA_TIDAK_KOMPETITIF', description: 'Harga kalah bersaing dengan kompetitor', is_active: true },
  { id: 'LR-03', name: 'Tidak Memenuhi Spesifikasi Teknis', code: 'SPESIFIKASI_TEKNIS', description: 'Spesifikasi teknis tidak sesuai persyaratan', is_active: true },
  { id: 'LR-04', name: 'Pengalaman / Track Record Kurang', code: 'PENGALAMAN_KURANG', description: 'Kurang pengalaman di bidang terkait', is_active: true },
  { id: 'LR-05', name: 'Dokumen Tidak Lengkap', code: 'DOK_TIDAK_LENGKAP', description: 'Persyaratan dokumen tidak lengkap', is_active: true },
  { id: 'LR-06', name: 'Keterlambatan Pengiriman Dokumen', code: 'KETERLAMBATAN', description: 'Dokumen terlambat diserahkan', is_active: false },
];

export default function MasterLossReasonPage() {
  const navigate = useNavigate();
  const [lossReasons, setLossReasons] = useState<LossReason[]>(INITIAL_LOSS_REASONS);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LossReason | null>(null);
  const [form, setForm] = useState<Partial<LossReason>>({});

  const filtered = lossReasons.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (r: LossReason) => {
    setEditing(r);
    setForm({ ...r });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Nama dan Kode alasan wajib diisi'); return; }
    if (editing) {
      setLossReasons(lossReasons.map(r => r.id === editing.id ? { ...r, ...form } as LossReason : r));
      toast.success('Alasan kekalahan berhasil diperbarui');
    } else {
      const id = `LR-${String(lossReasons.length + 1).padStart(2, '0')}`;
      setLossReasons([{ ...form, id } as LossReason, ...lossReasons]);
      toast.success('Alasan kekalahan berhasil ditambahkan');
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    setLossReasons(lossReasons.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
    toast.success('Status alasan kekalahan diubah');
  };

  const handleDelete = (id: string) => {
    const target = lossReasons.find(r => r.id === id);
    setLossReasons(lossReasons.filter(r => r.id !== id));
    toast.success(`Alasan ${target?.name} dihapus`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Master Data</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Alasan Kekalahan</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Master Alasan Kekalahan
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{lossReasons.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Alasan mengapa proyek atau tender tidak dimenangkan.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Alasan</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder="Cari alasan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari alasan kekalahan" />
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Alasan Kekalahan">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama Alasan</th>
                    <th className="px-6 py-3.5">Kode</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada alasan ditemukan.</td></tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                        <td className="px-6 py-4 font-mono text-primary font-bold">{r.code}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[250px] truncate">{r.description || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(r.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${r.is_active ? 'bg-success' : 'bg-slate-300'}`} aria-label={`Toggle status ${r.name}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${r.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Sunting"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer" title="Hapus"><span className="material-symbols-outlined icon-compact text-[18px]">delete</span></button>
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
                <h3 className="font-display-title text-sm font-extrabold text-slate-800">{editing ? 'Edit Alasan Kekalahan' : 'Tambah Alasan Kekalahan Baru'}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{editing ? `ID: ${editing.id}` : 'Buat alasan kekalahan baru'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5 text-left text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Nama Alasan *</label>
                <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama alasan" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Kode *</label>
                <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="KODE_ALASAN" required />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Deskripsi</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none" placeholder="Deskripsi alasan" />
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lrStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lrStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
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
