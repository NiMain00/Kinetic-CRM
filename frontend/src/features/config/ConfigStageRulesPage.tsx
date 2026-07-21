import React, { useState, useEffect } from 'react';
import { Button, Modal } from '@/components/ui';
import { PageContainer, PageHeader } from '@/components/shared';
import { useRbacStore } from '@/stores/rbacStore';
import toast from 'react-hot-toast';

interface StageForm {
  code: string;
  name: string;
  module: string;
  sequence: number;
  ownerDepartmentCode: string;
  prevDepartmentCode: string;
}

const initialForm: StageForm = {
  code: '',
  name: '',
  module: 'prospect',
  sequence: 1,
  ownerDepartmentCode: '',
  prevDepartmentCode: '',
};

export default function ConfigStageRulesPage() {
  const workflowStages = useRbacStore((s) => s.workflowStages);
  const fetchStages = useRbacStore((s) => s.fetchStages);
  const addStage = useRbacStore((s) => s.addStage);
  const updateStage = useRbacStore((s) => s.updateStage);
  const deleteStage = useRbacStore((s) => s.deleteStage);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StageForm>(initialForm);
  const [activeModule, setActiveModule] = useState('prospect');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchStages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStages = workflowStages
    .filter((s) => s.module === activeModule)
    .sort((a, b) => a.sequence - b.sequence);

  const MODULES = [
    { value: 'prospect', label: 'Prospek' },
    { value: 'project', label: 'Proyek' },
  ];

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({ ...initialForm, module: activeModule, sequence: filteredStages.length + 1 });
    setShowModal(true);
  };

  const handleOpenEdit = (stage: typeof workflowStages[0]) => {
    setEditId(stage.id);
    setForm({
      code: stage.code,
      name: stage.name,
      module: stage.module,
      sequence: stage.sequence,
      ownerDepartmentCode: stage.ownerDepartmentCode,
      prevDepartmentCode: stage.prevDepartmentCode || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toast.error('Kode dan Nama stage wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        module: form.module,
        sequence: form.sequence,
        ownerDepartmentCode: form.ownerDepartmentCode,
        prevDepartmentCode: form.prevDepartmentCode || null,
      };
      if (editId) {
        await updateStage(editId, payload);
        toast.success('Stage berhasil diperbarui.');
      } else {
        await addStage(payload as any);
        toast.success('Stage berhasil ditambahkan.');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan stage.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStage(deleteTarget);
      toast.success('Stage berhasil dihapus.');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus stage.');
    }
    setDeleteTarget(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Stage Rules"
        description="Kelola tahapan/alur kerja untuk Prospek dan Proyek"
        actions={
          <div className="flex gap-2">
            <Button variant="primary" size="md" onClick={handleOpenAdd} leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>
              Tambah Stage
            </Button>
          </div>
        }
      />

      {/* Module tabs */}
      <div className="flex gap-2 mb-4">
        {MODULES.map((m) => (
          <button
            key={m.value}
            onClick={() => setActiveModule(m.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeModule === m.value
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface text-on-surface border border-border hover:bg-surface-container'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Stage list */}
      <div className="bg-surface border border-border/60 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-left text-outline text-[11px] uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Urutan</th>
                <th className="px-5 py-3 font-semibold">Kode</th>
                <th className="px-5 py-3 font-semibold">Nama Stage</th>
                <th className="px-5 py-3 font-semibold">Owner Dept</th>
                <th className="px-5 py-3 font-semibold">Prev Dept</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredStages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-secondary">
                    <span className="material-symbols-outlined text-3xl text-outline/50 mb-2">alt_route</span>
                    <p>Belum ada stage untuk modul ini.</p>
                  </td>
                </tr>
              ) : (
                filteredStages.map((stage) => (
                  <tr key={stage.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-3 font-mono-data text-outline">{stage.sequence}</td>
                    <td className="px-5 py-3">
                      <code className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-mono-data">{stage.code}</code>
                    </td>
                    <td className="px-5 py-3 font-semibold text-on-surface">{stage.name}</td>
                    <td className="px-5 py-3 text-secondary">{stage.ownerDepartmentCode || '-'}</td>
                    <td className="px-5 py-3 text-secondary">{stage.prevDepartmentCode || '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(stage)}
                          className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(stage.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-danger hover:bg-error-container/20 transition-all"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Edit Stage' : 'Tambah Stage Baru'}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleSave} isLoading={saving} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="stage-code" className="font-semibold text-sm">Kode Stage *</label>
            <input
              id="stage-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="contoh: lead, prospek, tender"
            />
            <p className="text-[10px] text-secondary">Kode unik, gunakan snake_case.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="stage-name" className="font-semibold text-sm">Nama Stage *</label>
            <input
              id="stage-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contoh: Lead, Prospek, Tender"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="stage-module" className="font-semibold text-sm">Modul</label>
            <select
              id="stage-module"
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="prospect">Prospek</option>
              <option value="project">Proyek</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="stage-sequence" className="font-semibold text-sm">Urutan</label>
              <input
                id="stage-sequence"
                type="number"
                value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="stage-owner-dept" className="font-semibold text-sm">Owner Department Code</label>
              <input
                id="stage-owner-dept"
                value={form.ownerDepartmentCode}
                onChange={(e) => setForm({ ...form, ownerDepartmentCode: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="DEPT-MKT"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="stage-prev-dept" className="font-semibold text-sm">Previous Department Code (opsional)</label>
            <input
              id="stage-prev-dept"
              value={form.prevDepartmentCode}
              onChange={(e) => setForm({ ...form, prevDepartmentCode: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="DEPT-MKT"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus stage ini?</p>
      </Modal>
    </PageContainer>
  );
}
