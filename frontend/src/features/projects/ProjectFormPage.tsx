import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button, Card, CurrencyInput } from '@/components/ui';
import type { Project } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerStore } from '@/stores/customerStore';
import { projectSchema, type ProjectFormData } from '@/utils/validators';

const PROJECT_TYPES = ['Tender', 'Prospecting'] as const;

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const addProject = useProjectStore((s) => s.addProject);
  const projectCount = useProjectStore((s) => s.projects.length);
  const user = useAuthStore((s) => s.user);
  const customers = useCustomerStore((s) => s.customers);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      client: '',
      type: 'Tender',
      location: '',
      estimatedValue: undefined,
      deadlineTender: undefined,
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    const newProject: Project = {
      id: `PR-${Date.now()}`,
      code: `PRJ-${String(projectCount + 1).padStart(4, '0')}`,
      name: data.name.trim(),
      client: data.client,
      status: 'RKS',
      phase: 'RKS',
      location: data.location.trim(),
      author: user?.fullName || user?.name || 'Admin',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: 0,
      estimatedValue: data.estimatedValue || 0,
      type: data.type as 'Tender' | 'Prospecting',
      deadlineTender: data.deadlineTender || undefined,
      createdByUserId: user?.id,
    };

    addProject(newProject);
    toast.success(`Proyek "${newProject.name}" berhasil dibuat.`);
    // Force reload agar list langsung fresh dari store (Zustand persist flush async)
    window.location.href = '/projects';
  };

  const fieldClass = (field: keyof ProjectFormData) =>
    `w-full rounded-lg border ${errors[field] ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-on-surface">Buat Proyek Baru</h1>
          <p className="text-sm text-secondary mt-1">Lengkapi informasi dasar proyek untuk memulai siklus tender.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Nama Proyek *</label>
            <input
              {...register('name')}
              className={fieldClass('name')}
              placeholder="Contoh: Pembangunan Infrastruktur Data Center - Tahap II"
              type="text"
              aria-label="Nama Proyek"
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Client *</label>
              <select
                {...register('client')}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-surface-container-lowest"
                aria-label="Client"
              >
                <option value="">Pilih client...</option>
                {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {errors.client && <p className="text-xs text-danger">{errors.client.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Tipe Proyek</label>
              <select
                {...register('type')}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-surface-container-lowest"
                aria-label="Tipe Proyek"
              >
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Lokasi Proyek *</label>
            <input
              {...register('location')}
              className={fieldClass('location')}
              placeholder="Contoh: Gatot Subroto, Jakarta"
              type="text"
              aria-label="Lokasi"
            />
            {errors.location && <p className="text-xs text-danger">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Controller
                name="estimatedValue"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label="Estimasi Nilai Proyek"
                    value={field.value}
                    onChange={(val) => field.onChange(val ?? 0)}
                    error={errors.estimatedValue?.message}
                    placeholder="Rp 0"
                    required
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Batas Akhir Tender</label>
              <input
                {...register('deadlineTender')}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                type="date"
                aria-label="Batas Akhir Tender"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="md" onClick={() => navigate('/projects')}>
              Kembali ke Daftar
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Buat Proyek'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
