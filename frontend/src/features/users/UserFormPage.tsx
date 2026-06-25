import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';
import type { User, UserRole } from '@/types/domain/users';

const ALL_ROLES: UserRole[] = ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Reviewer', 'Staff'];
const ALL_BRANCHES = ['Head Office', 'Jakarta Pusat', 'Jakarta Selatan', 'Surabaya', 'Bandung', 'Medan', 'Makassar', 'Balikpapan'];
const ALL_DEPARTMENTS = ['Operations', 'Project Management Office', 'IT', 'Quality Assurance', 'Field Operations', 'Finance', 'Legal', 'Marketing'];

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { addUser, updateUser, getUserById, users } = useUserStore();
  const existing = isEdit ? getUserById(id || '') : null;

  const [fullName, setFullName] = useState(existing?.fullName || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [username, setUsername] = useState(existing?.username || '');
  const [role, setRole] = useState<UserRole>(existing?.role || 'Staff');
  const [branch, setBranch] = useState(existing?.branch || '');
  const [department, setDepartment] = useState(existing?.department || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(existing?.status || 'active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Nama lengkap wajib diisi.';
    if (!email.trim()) errs.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email tidak valid.';
    if (!username.trim()) errs.username = 'Username wajib diisi.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && existing) {
      updateUser(existing.id, { fullName, email, username, role, branch, department, phone, status });
    } else {
      const newUser: User = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        username,
        fullName,
        email,
        role,
        branch,
        department,
        phone,
        status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addUser(newUser);
    }

    toast.success(isEdit ? `Pengguna ${fullName} berhasil diperbarui.` : `Pengguna ${fullName} berhasil ditambahkan.`);
    navigate('/users');
  };

  const fieldClass = (field: string) =>
    `w-full rounded-lg border ${errors[field] ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm`;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
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

        <form onSubmit={handleSave} className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Nama Lengkap *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass('fullName')} placeholder="Contoh: Ahmad Sulistyo" type="text" aria-label="Nama Lengkap" />
            {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass('email')} placeholder="email@kinetic.co.id" type="email" aria-label="Email" />
              {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Username *</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass('username')} placeholder="username" type="text" aria-label="Username" />
              {errors.username && <p className="text-xs text-danger">{errors.username}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white" aria-label="Role">
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Cabang</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-white" aria-label="Cabang">
                <option value="">Pilih Cabang</option>
                {ALL_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Departemen</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-white" aria-label="Departemen">
                <option value="">Pilih Departemen</option>
                {ALL_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">No. Telepon</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm" placeholder="0812-xxxx-xxxx" type="text" aria-label="Telepon" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Status Akun</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="status" checked={status === 'active'} onChange={() => setStatus('active')} className="text-primary focus:ring-primary" />
                Aktif
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="status" checked={status === 'inactive'} onChange={() => setStatus('inactive')} className="text-primary focus:ring-primary" />
                Non-Aktif
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button type="button" onClick={() => navigate('/users')} className="px-6 py-2.5 bg-white border border-border text-on-surface font-semibold rounded-lg hover:bg-surface-container-low transition-all text-sm">
              Kembali
            </button>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:brightness-110 transition-all text-sm" aria-label="Simpan pengguna">
                {isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
