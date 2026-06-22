import React, { useState } from 'react';
import { Button, Badge, Modal } from '@/components/ui';
import toast from 'react-hot-toast';

interface QuestionType {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

const INITIAL_TYPES: QuestionType[] = [
  { id: 'QT-001', name: 'Pilihan Ganda', description: 'Satu jawaban benar dari beberapa opsi', status: 'active' },
  { id: 'QT-002', name: 'Checklist', description: 'Beberapa jawaban dapat dipilih', status: 'active' },
  { id: 'QT-003', name: 'Esai Singkat', description: 'Jawaban teks pendek maksimal 500 karakter', status: 'active' },
  { id: 'QT-004', name: 'Skala Likert', description: 'Penilaian skala 1-5 atau 1-10', status: 'active' },
  { id: 'QT-005', name: 'Tanggal', description: 'Input tanggal', status: 'inactive' },
  { id: 'QT-006', name: 'Upload File', description: 'Lampiran file pendukung', status: 'active' },
  { id: 'QT-007', name: 'Dropdown', description: 'Pilihan dari menu dropdown', status: 'active' },
];

export default function ConfigQuestionTypesPage() {
  const [types, setTypes] = useState<QuestionType[]>(INITIAL_TYPES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<QuestionType | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('active');
    setModalOpen(true);
  };

  const handleOpenEdit = (qt: QuestionType) => {
    setEditingType(qt);
    setFormName(qt.name);
    setFormDescription(qt.description);
    setFormStatus(qt.status);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Nama tipe pertanyaan wajib diisi.');
      return;
    }
    if (editingType) {
      setTypes(types.map(t => t.id === editingType.id ? { ...t, name: formName, description: formDescription, status: formStatus } : t));
      toast.success(`Tipe pertanyaan ${formName} berhasil diperbarui.`);
    } else {
      const newType: QuestionType = {
        id: `QT-${String(types.length + 1).padStart(3, '0')}`,
        name: formName,
        description: formDescription,
        status: formStatus,
      };
      setTypes([newType, ...types]);
      toast.success(`Tipe pertanyaan ${formName} berhasil ditambahkan.`);
    }
    setModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setTypes(types.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t));
    const target = types.find(t => t.id === id);
    toast.success(`Tipe pertanyaan ${target?.name} sekarang ${target?.status === 'active' ? 'NON-AKTIF' : 'AKTIF'}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
            <span className="font-semibold uppercase tracking-wider">Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Tipe Pertanyaan</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">Tipe Pertanyaan</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola tipe pertanyaan untuk kuesioner prospek.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={handleOpenCreate}>
          Tambah Tipe
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Tipe</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{types.length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Aktif</p>
              <p className="text-xl font-extrabold text-success mt-1">{types.filter(t => t.status === 'active').length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Non-Aktif</p>
              <p className="text-xl font-extrabold text-warning mt-1">{types.filter(t => t.status === 'inactive').length}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama Tipe</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {types.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/65 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-lg">help_outline</span>
                          <span className="font-bold text-slate-800">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{t.description}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleStatus(t.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer ${t.status === 'active' ? 'bg-success' : 'bg-slate-300'}`}>
                          <span className={`w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform duration-200 ${t.status === 'active' ? 'translate-x-2' : '-translate-x-2'}`}></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingType ? 'Edit Tipe Pertanyaan' : 'Tambah Tipe Pertanyaan'} size="md">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Nama Tipe *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Pilihan Ganda" required />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Deskripsi</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" rows={3} placeholder="Deskripsi tipe pertanyaan" />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qtStatus" checked={formStatus === 'active'} onChange={() => setFormStatus('active')} className="text-primary" />
                <span className="text-xs font-medium">Aktif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qtStatus" checked={formStatus === 'inactive'} onChange={() => setFormStatus('inactive')} className="text-primary" />
                <span className="text-xs font-medium">Non-Aktif</span>
              </label>
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editingType ? 'Simpan' : 'Buat'}</Button>
        </div>
      </Modal>
    </div>
  );
}
