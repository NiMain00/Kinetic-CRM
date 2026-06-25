import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Input, Card } from '@/components/ui';
import type { Project } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';

const CLIENTS = [
  'PT. Telkom Indonesia Tbk.',
  'PT. Telekom Nusantara',
  'Energi Bangsa Corp',
  'Secure City Group',
  'Bank Artha Graha',
  'Lestari Eco Farms',
  'PT. Angkasa Pura II',
  'Global Logistics Inc.',
  'Express Delivery Hub',
  'Defense Tech Solutions',
];

const PROJECT_TYPES = ['Tender', 'Prospecting'] as const;

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const addProject = useProjectStore((s) => s.addProject);
  const projectCount = useProjectStore((s) => s.projects.length);

  const [name, setName] = useState('');
  const [client, setClient] = useState(CLIENTS[0]);
  const [type, setType] = useState<string>('Tender');
  const [location, setLocation] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [deadlineTender, setDeadlineTender] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nama proyek wajib diisi.';
    if (!location.trim()) errs.location = 'Lokasi proyek wajib diisi.';
    if (!estimatedValue || Number(estimatedValue) <= 0) errs.estimatedValue = 'Nilai estimasi harus diisi dan > 0.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newProject: Project = {
      id: `PR-${Date.now()}`,
      code: `PRJ-${String(projectCount + 1).padStart(4, '0')}`,
      name: name.trim(),
      client,
      status: 'RKS',
      phase: 'Overview',
      location: location.trim(),
      author: 'Admin',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: 0,
      estimatedValue: Number(estimatedValue),
      type: type as 'Tender' | 'Prospecting',
      deadlineTender: deadlineTender || undefined,
    };

    addProject(newProject);
    toast.success(`Proyek "${newProject.name}" berhasil dibuat.`);
    navigate('/projects');
  };

  const fieldClass = (field: string) =>
    `w-full rounded-lg border ${errors[field] ? 'border-danger' : 'border-border'} p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm`;

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
              className={fieldClass('name')}
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
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                aria-label="Client"
              >
                {CLIENTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Tipe Proyek</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border p-2.5 focus:outline-none text-sm bg-white"
                aria-label="Tipe Proyek"
              >
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-sm text-on-surface-variant">Lokasi Proyek *</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={fieldClass('location')}
              placeholder="Contoh: Gatot Subroto, Jakarta"
              type="text"
              aria-label="Lokasi"
            />
            {errors.location && <p className="text-xs text-danger">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-sm text-on-surface-variant">Estimasi Nilai Proyek (Rp) *</label>
              <input
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className={fieldClass('estimatedValue')}
                placeholder="Contoh: 4250000000"
                type="number"
                aria-label="Estimasi Nilai"
              />
              {errors.estimatedValue && <p className="text-xs text-danger">{errors.estimatedValue}</p>}
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
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:brightness-110 transition-all text-sm"
                aria-label="Buat Proyek"
              >
                Buat Proyek
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
