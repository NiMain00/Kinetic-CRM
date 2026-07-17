import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal } from '@/components/ui';
import toast from 'react-hot-toast';
import { useMasterDataStore, type MasterQuestionType } from '@/stores/masterDataStore';

export default function ConfigQuestionTypesPage() {
  const types = useMasterDataStore((s) => s.questionTypes);
  const addData = useMasterDataStore((s) => s.addData);
  const updateData = useMasterDataStore((s) => s.updateData);
  const fetchEntity = useMasterDataStore((s) => s.fetchEntity);

  useEffect(() => {
    fetchEntity('questionTypes');
  }, [fetchEntity]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<MasterQuestionType | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState(true);
  const [formHasOptions, setFormHasOptions] = useState(false);

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormName('');
    setFormDescription('');
    setFormStatus(true);
    setFormHasOptions(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (qt: MasterQuestionType) => {
    setEditingType(qt);
    setFormName(qt.name);
    setFormDescription(qt.description);
    setFormStatus(qt.is_active);
    setFormHasOptions((qt as unknown as Record<string, unknown>)?.hasOptions as boolean ?? qt.has_options ?? false);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Nama tipe pertanyaan wajib diisi.');
      return;
    }
    if (editingType) {
      updateData('questionTypes', editingType.id, { name: formName, description: formDescription, is_active: formStatus, has_options: formHasOptions });
      toast.success(`Tipe pertanyaan ${formName} berhasil diperbarui.`);
    } else {
      const newType: MasterQuestionType = {
        id: `QT-${String(types.length + 1).padStart(2, '0')}`,
        name: formName,
        code: formName.toLowerCase().replace(/\s+/g, '_'),
        description: formDescription,
        has_options: formHasOptions,
        validation_config: '{}',
        is_system: false,
        is_active: formStatus,
      };
      addData('questionTypes', newType);
      toast.success(`Tipe pertanyaan ${formName} berhasil ditambahkan.`);
    }
    setModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    const target = types.find(t => t.id === id);
    if (target) {
      updateData('questionTypes', id, { is_active: !target.is_active });
      toast.success(`Tipe pertanyaan ${target.name} sekarang ${target.is_active ? 'NON-AKTIF' : 'AKTIF'}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">Tipe Pertanyaan</h2>
          <p className="text-[11px] text-outline mt-0.5">Kelola tipe pertanyaan untuk kuesioner prospek.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-sm">add</span>} onClick={handleOpenCreate}>
          Tambah Tipe
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Total Tipe</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{types.length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Aktif</p>
              <p className="text-xl font-extrabold text-success mt-1">{types.filter(t => t.is_active).length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Non-Aktif</p>
              <p className="text-xl font-extrabold text-warning mt-1">{types.filter(t => !t.is_active).length}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-none table-mobile-compact">
            <table className="w-full text-xs text-left table-auto">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border text-slate-450 uppercase font-mono tracking-wider">
                    <th className="px-6 py-3.5">Nama Tipe</th>
                    <th className="px-6 py-3.5">Deskripsi</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {types.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-low/65 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-lg icon-compact">help_outline</span>
                          <span className="font-bold text-on-surface">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary">{t.description}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleStatus(t.id)} className={`inline-flex items-center justify-center p-0.5 rounded-full w-9 h-5 transition-colors outline-none cursor-pointer btn-compact ${t.is_active ? 'bg-success' : 'bg-surface-container-highest'}`}>
                          <span className={`w-4 h-4 bg-surface-container-lowest rounded-full shadow-xs transform transition-transform duration-200 ${t.is_active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenEdit(t)} className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors cursor-pointer btn-compact" title="Edit">
                          <span className="material-symbols-outlined text-[18px] icon-compact">edit</span>
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
            <label className="font-semibold text-on-surface block">Nama Tipe *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Pilihan Ganda" required />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-on-surface block">Deskripsi</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs" rows={3} placeholder="Deskripsi tipe pertanyaan" />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-on-surface block">Memiliki Pilihan Jawaban</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qtHasOptions" checked={formHasOptions === true} onChange={() => setFormHasOptions(true)} className="text-primary" />
                <span className="text-xs font-medium">Ya</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qtHasOptions" checked={formHasOptions === false} onChange={() => setFormHasOptions(false)} className="text-primary" />
                <span className="text-xs font-medium">Tidak</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-on-surface block">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qtStatus" checked={formStatus === true} onChange={() => setFormStatus(true)} className="text-primary" />
                <span className="text-xs font-medium">Aktif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="qtStatus" checked={formStatus === false} onChange={() => setFormStatus(false)} className="text-primary" />
                <span className="text-xs font-medium">Non-Aktif</span>
              </label>
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-3 flex-wrap mt-6 pt-4 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editingType ? 'Simpan' : 'Buat'}</Button>
        </div>
      </Modal>
    </div>
  );
}
