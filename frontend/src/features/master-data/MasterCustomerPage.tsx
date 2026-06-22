import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Select, Badge, Modal, Card } from '@/components/ui';

interface Customer {
  id: string;
  name: string;
  code: string;
  type: 'swasta' | 'bumn' | 'pemerintah' | 'asing';
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  city: string;
  is_active: boolean;
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C-001', name: 'PT Astra International Tbk', code: 'ASTRA', type: 'swasta', pic_name: 'Budi Santoso', pic_email: 'budi@astra.co.id', pic_phone: '021-12345678', city: 'Jakarta Utara', is_active: true },
  { id: 'C-002', name: 'Bank Rakyat Indonesia', code: 'BRI', type: 'bumn', pic_name: 'Siti Aminah', pic_email: 'siti@bri.co.id', pic_phone: '021-87654321', city: 'Jakarta Pusat', is_active: true },
  { id: 'C-003', name: 'Dinas Kesehatan Prov DKI', code: 'DINKES', type: 'pemerintah', pic_name: 'Herry Setiawan', pic_email: 'herry@dinkes.go.id', pic_phone: '021-56789012', city: 'Jakarta Pusat', is_active: false },
  { id: 'C-004', name: 'Siemens Indonesia', code: 'SIEMENS', type: 'asing', pic_name: 'John Doe', pic_email: 'john@siemens.co.id', pic_phone: '021-23456789', city: 'Jakarta Selatan', is_active: true },
];

const typeLabels: Record<string, string> = { swasta: 'Swasta', bumn: 'BUMN', pemerintah: 'Pemerintah', asing: 'Asing' };
const typeVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = { swasta: 'default', bumn: 'info', pemerintah: 'warning', asing: 'purple' };

export default function MasterCustomerPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({});

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.pic_name.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ type: 'swasta', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ ...c });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.pic_name) {
      toast.error('Nama, Kode, dan PIC wajib diisi');
      return;
    }
    if (editing) {
      setCustomers(customers.map(c => c.id === editing.id ? { ...c, ...form } as Customer : c));
      toast.success('Customer berhasil diperbarui');
    } else {
      const id = `C-${String(customers.length + 1).padStart(3, '0')}`;
      setCustomers([{ ...form, id } as Customer, ...customers]);
      toast.success('Customer berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    toast.success('Status customer diubah');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-slate-800">
      <div className="bg-white border-b border-border px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 font-caption-xs text-caption-xs text-secondary">
            <span className="text-secondary font-semibold uppercase tracking-wider">Master Data</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Customer</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900 flex items-center gap-2">
            Master Customer
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{customers.length}</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola data customer terpusat untuk prospek dan proyek.</p>
        </div>
        <Button onClick={openCreate} size="sm" leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>Tambah Customer</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input type="text" placeholder="Cari nama, kode, atau PIC..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" aria-label="Cari customer" />
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none" aria-label="Filter tipe">
                <option value="all">Semua Tipe</option>
                <option value="swasta">Swasta</option>
                <option value="bumn">BUMN</option>
                <option value="pemerintah">Pemerintah</option>
                <option value="asing">Asing</option>
              </select>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); }}>Reset Filter</Button>
            </div>
          </Card>

          <Card padding="none">
            <div className="overflow-x-auto table-mobile-compact">
              <table className="w-full text-xs text-left table-auto" role="table" aria-label="Daftar Customer">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama</th>
                    <th className="px-6 py-3.5">Kode</th>
                    <th className="px-6 py-3.5">Tipe</th>
                    <th className="px-6 py-3.5">PIC</th>
                    <th className="px-6 py-3.5">Kota</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Tidak ada customer ditemukan.</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{c.code}</td>
                        <td className="px-6 py-4"><Badge variant={typeVariants[c.type]}>{typeLabels[c.type]}</Badge></td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700">{c.pic_name}</div>
                          <div className="text-[10px] text-slate-400">{c.pic_email}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{c.city}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleStatus(c.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${c.is_active ? 'bg-success' : 'bg-slate-300'}`} aria-label={`Toggle status ${c.name}`}>
                            <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${c.is_active ? 'translate-x-2' : '-translate-x-2'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit"><span className="material-symbols-outlined icon-compact text-[18px]">edit</span></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Tambah Customer Baru'} size="lg">
        <form onSubmit={handleSave} className="space-y-5 text-left text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Nama Customer *</label>
              <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama perusahaan" required />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Kode Customer *</label>
              <input type="text" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Kode unik" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Tipe Customer *</label>
            <select value={form.type || 'swasta'} onChange={e => setForm({ ...form, type: e.target.value as Customer['type'] })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-xs bg-white">
              <option value="swasta">Swasta</option>
              <option value="bumn">BUMN</option>
              <option value="pemerintah">Pemerintah</option>
              <option value="asing">Asing</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Nama PIC *</label>
              <input type="text" value={form.pic_name || ''} onChange={e => setForm({ ...form, pic_name: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Nama kontak person" required />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Email PIC</label>
              <input type="email" value={form.pic_email || ''} onChange={e => setForm({ ...form, pic_email: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="email@perusahaan.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Telepon PIC</label>
              <input type="text" value={form.pic_phone || ''} onChange={e => setForm({ ...form, pic_phone: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="021-xxxxxxx" />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Kota</label>
              <input type="text" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" placeholder="Kota" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="custStatus" checked={form.is_active !== false} onChange={() => setForm({ ...form, is_active: true })} className="text-primary" /><span className="text-xs font-medium">Aktif</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="custStatus" checked={form.is_active === false} onChange={() => setForm({ ...form, is_active: false })} className="text-primary" /><span className="text-xs font-medium">Non-Aktif</span></label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" size="sm">{editing ? 'Simpan Perubahan' : 'Tambah Customer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
