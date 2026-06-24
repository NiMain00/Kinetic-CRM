import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/queries/useProjects';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge } from '@/components/shared';
import { Button, Input, Card } from '@/components/ui';
import PageSkeleton from '@/components/layout/PageSkeleton';

const statusTabs = [
  { id: 'all', label: 'Semua Proyek' },
  { id: 'RKS', label: 'RKS' },
  { id: 'LPHS/SIOS', label: 'LPHS/SIOS' },
  { id: 'Input Harga', label: 'Input Harga' },
  { id: 'Executing', label: 'Eksekusi' },
  { id: 'Target Delivery', label: 'Target Delivery' },
];

const progressColor = (pct: number) => {
  if (pct >= 80) return 'bg-success';
  if (pct >= 50) return 'bg-warning';
  return 'bg-primary';
};

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: res, isLoading, isError } = useProjects();

  const projects = (res as any)?.data?.data ?? [];

  const filtered = useMemo(() => {
    let list = projects;
    if (activeTab !== 'all') {
      list = list.filter((p: any) => {
        const statusCode = p.status?.code || p.status?.label || '';
        return statusCode === activeTab;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.customer?.name || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeTab, search, projects]);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <span className="material-symbols-outlined text-5xl text-danger">error</span>
        <p className="text-secondary text-sm">Gagal memuat data proyek</p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>Muat Ulang</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Proyek</h2>
          <p className="text-secondary font-body-main mt-1">Kelola dan pantau semua proyek aktif</p>
        </div>
        <Button
          variant="primary" size="md"
          leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
          onClick={() => navigate('/projects/new')}
        >
          Proyek Baru
        </Button>
      </div>

      <nav className="flex border-b border-border overflow-x-auto">
        {statusTabs.map((tab) => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-label-sm text-sm transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="max-w-sm">
        <Input
          placeholder="Cari berdasarkan nama, klien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<span className="material-symbols-outlined">search</span>}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Proyek</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{projects.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Nilai</p>
          <p className="text-lg font-bold text-primary mt-1 truncate">{formatCurrency(projects.reduce((s: number, p: any) => s + (Number(p.pricing?.ourPrice) || 0), 0))}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-success mt-1">{projects.filter((p: any) => p.status?.code === 'active' || p.status?.code === 'lphs_sios').length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Won</p>
          <p className="text-2xl font-bold text-status-purple mt-1">{projects.filter((p: any) => p.winnerDetails?.result === 'menang').length}</p>
        </Card>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto table-mobile-compact">
          <table className="w-full text-left text-sm table-auto">
            <thead>
              <tr className="bg-surface-container-low border-b border-border">
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Nama Proyek</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Klien</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Nilai</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Tender</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Tgl Dibuat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-outline text-sm">Tidak ada proyek ditemukan</td>
                </tr>
              ) : (
                filtered.map((project: any) => (
                  <tr key={project.id}
                    onClick={() => navigate(`/project/${project.id}/overview`)}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-on-surface max-w-[250px] truncate">{project.name}</td>
                    <td className="px-6 py-4 text-secondary">{project.customer?.name || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={project.status?.label || project.status?.code || '-'} /></td>
                    <td className="px-6 py-4 text-on-surface font-medium">{formatCurrency(Number(project.pricing?.ourPrice) || 0)}</td>
                    <td className="px-6 py-4 text-outline text-xs">{project.tenderName || project.projectType || '-'}</td>
                    <td className="px-6 py-4 text-outline text-xs">{project.createdAt ? new Date(project.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
