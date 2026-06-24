import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { masterDataService } from '@/services/master-data';
import { useProjectMutations } from '@/hooks/mutations/useProjectMutations';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { create } = useProjectMutations();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [projectType, setProjectType] = useState('Tender');
  const [deadlineTender, setDeadlineTender] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      masterDataService.customers(),
      masterDataService.branches(),
      masterDataService.projectCategories(),
      masterDataService.projectStatuses(),
    ]).then(([cRes, bRes, catRes, sRes]) => {
      setCustomers((cRes as any)?.data?.data ?? []);
      setBranches((bRes as any)?.data?.data ?? []);
      setCategories((catRes as any)?.data?.data ?? []);
      setStatuses((sRes as any)?.data?.data ?? []);
      if (bRes?.data?.data?.[0]) setBranchId(bRes.data.data[0].id);
      if (sRes?.data?.data?.[0]) setStatusId(sRes.data.data[0].id);
      if (cRes?.data?.data?.[0]) setCustomerId(cRes.data.data[0].id);
      if (catRes?.data?.data?.[0]) setCategoryId(catRes.data.data[0].id);
    }).catch(() => toast.error('Gagal memuat data master')).finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nama proyek wajib diisi.';
    if (!customerId) errs.customerId = 'Pilih client.';
    if (!branchId) errs.branchId = 'Pilih cabang.';
    if (!categoryId) errs.categoryId = 'Pilih kategori.';
    if (!statusId) errs.statusId = 'Pilih status.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await create.mutateAsync({
        name: name.trim(),
        projectType,
        customerId,
        branchId,
        categoryId,
        statusId,
        deadlineTender: deadlineTender || null,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
        marginPercentage: undefined,
      });
      toast.success('Proyek berhasil dibuat.');
      navigate('/projects');
    } catch {
      toast.error('Gagal membuat proyek.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
          <p className="text-secondary">Memuat data master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/projects')} className="hover:text-primary transition-colors">Proyek</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">Buat Proyek Baru</span>
        </nav>

        <div>
          <h1 className="text-xl font-extrabold text-on-surface">Buat Proyek Baru</h1>
          <p className="text-sm text-secondary mt-1">Lengkapi informasi dasar proyek untuk memulai siklus tender.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Nama Proyek *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-lg border ${errors.name ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm`}
              placeholder="Contoh: Pembangunan Infrastruktur Data Center - Tahap II"
              type="text"
              aria-label="Nama Proyek"
            />
            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Client *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={`w-full rounded-lg border ${errors.customerId ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white`}
                aria-label="Client"
              >
                <option value="">-- Pilih Client --</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.customerId && <p className="text-xs text-danger">{errors.customerId}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Tipe Proyek</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-white"
                aria-label="Tipe Proyek"
              >
                <option value="Tender">Tender</option>
                <option value="Prospecting">Prospecting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Cabang *</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={`w-full rounded-lg border ${errors.branchId ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none text-sm bg-white`}
                aria-label="Cabang"
              >
                <option value="">-- Pilih Cabang --</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.branchId && <p className="text-xs text-danger">{errors.branchId}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Kategori *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full rounded-lg border ${errors.categoryId ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none text-sm bg-white`}
                aria-label="Kategori"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-danger">{errors.categoryId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Status *</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className={`w-full rounded-lg border ${errors.statusId ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none text-sm bg-white`}
                aria-label="Status"
              >
                <option value="">-- Pilih Status --</option>
                {statuses.map((s: any) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {errors.statusId && <p className="text-xs text-danger">{errors.statusId}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Batas Akhir Tender</label>
              <input
                value={deadlineTender}
                onChange={(e) => setDeadlineTender(e.target.value)}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                type="date"
                aria-label="Batas Akhir Tender"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Nilai Estimasi (Rp)</label>
            <input
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Contoh: 5000000000"
              type="number"
              aria-label="Nilai Estimasi"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-6 py-2.5 bg-white border border-border text-on-surface font-semibold rounded-lg hover:bg-surface-container-low transition-all text-sm"
            >
              Kembali ke Daftar
            </button>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:brightness-110 transition-all text-sm disabled:opacity-50"
                aria-label="Buat Proyek"
              >
                {submitting ? 'Menyimpan...' : 'Buat Proyek'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
