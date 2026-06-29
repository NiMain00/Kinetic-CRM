import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { useUserStore } from '@/stores/userStore';
import type { User, UserRole } from '@/types/domain/users';
import { useMasterRoles, useOrgBranches, useOrgDepartments } from '@/hooks/useConfigData';
import { userSchema, type UserFormData } from '@/utils/validators';

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { addUser, updateUser, getUserById, users } = useUserStore();
  const existing = isEdit ? getUserById(id || '') : null;

  const masterRoles = useMasterRoles();
  const branches = useOrgBranches();
  const departments = useOrgDepartments();
  const roleOptions = useMemo(() => masterRoles.map(r => r.name), [masterRoles]);
  const branchOptions = useMemo(() => branches.map(b => b.name), [branches]);
  const deptOptions = useMemo(() => departments.map(d => d.name), [departments]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: existing?.username || '',
      fullName: existing?.fullName || '',
      email: existing?.email || '',
      role: existing?.role || 'Staff',
      branch: existing?.branch || '',
      department: existing?.department || '',
      phone: existing?.phone || '',
      status: existing?.status || 'active',
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEdit && existing) {
      updateUser(existing.id, data);
      toast.success(`Pengguna ${data.fullName} berhasil diperbarui.`);
    } else {
      const newUser: User = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        role: data.role as UserRole,
        branch: data.branch,
        department: data.department,
        phone: data.phone,
        status: data.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addUser(newUser);
      toast.success(`Pengguna ${data.fullName} berhasil ditambahkan.`);
    }
    navigate('/users');
  };

  const fieldClass = (field: keyof UserFormData) =>
    `w-full rounded-lg border ${errors[field] ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/users')} className="hover:text-primary transition-colors">Pengguna</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}</span>
        </nav>

        <div>
          <h1 className="text-xl font-extrabold text-on-surface">{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h1>
          <p className="text-sm text-secondary mt-1">{isEdit ? 'Perbarui informasi akun pengguna.' : 'Buat akun pengguna baru untuk akses sistem.'}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Nama Lengkap *</label>
            <input
              {...register('fullName')}
              className={fieldClass('fullName')}
              placeholder="Contoh: Ahmad Sulistyo"
              type="text"
              aria-label="Nama Lengkap"
            />
            {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Email *</label>
              <input
                {...register('email')}
                className={fieldClass('email')}
                placeholder="email@kinetic.co.id"
                type="email"
                aria-label="Email"
              />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Username *</label>
              <input
                {...register('username')}
                className={fieldClass('username')}
                placeholder="username"
                type="text"
                aria-label="Username"
              />
              {errors.username && <p className="text-xs text-danger">{errors.username.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Role *</label>
              <select
                {...register('role')}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                aria-label="Role"
              >
                {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Cabang *</label>
              <select
                {...register('branch')}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-white"
                aria-label="Cabang"
              >
                <option value="">Pilih Cabang</option>
                {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.branch && <p className="text-xs text-danger">{errors.branch.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Departemen *</label>
              <select
                {...register('department')}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-white"
                aria-label="Departemen"
              >
                <option value="">Pilih Departemen</option>
                {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-xs text-danger">{errors.department.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">No. Telepon *</label>
              <input
                {...register('phone')}
                className={fieldClass('phone')}
                placeholder="0812-xxxx-xxxx"
                type="text"
                aria-label="Telepon"
              />
              {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Status Akun</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  value="active"
                  {...register('status')}
                  className="text-primary focus:ring-primary"
                />
                Aktif
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  value="inactive"
                  {...register('status')}
                  className="text-primary focus:ring-primary"
                />
                Non-Aktif
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <Button type="button" variant="secondary" size="md" onClick={() => navigate('/users')}>
              Kembali
            </Button>
            <Button type="submit" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
