import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusBadge } from '@/components/shared';
import { Button, Input, Card } from '@/components/ui';

const progressColor = (pct: number) => {
  if (pct >= 80) return 'bg-success';
  if (pct >= 50) return 'bg-warning';
  return 'bg-primary';
};

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const projects = useProjectStore((s) => s.projects);

  const statusTabs = useMemo(() => {
    const PHASE_TABS = [
      { id: 'all', label: 'Semua Proyek' },
      { id: 'Prospecting', label: 'Prospecting' },
      { id: 'RKS', label: 'RKS' },
      { id: 'Review RKS', label: 'Review RKS' },
      { id: 'LPHS/SIOS', label: 'LPHS/SIOS' },
      { id: 'Harga', label: 'Harga' },
      { id: 'Kompetitor', label: 'Kompetitor' },
      { id: 'Pemenang', label: 'Pemenang' },
      { id: 'Target Delivery', label: 'Target Delivery' },
      { id: 'Executing', label: 'Executing' },
      { id: 'Completed', label: 'Completed' },
    ];
    return PHASE_TABS;
  }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (activeTab !== 'all') {
      list = list.filter((p) => p.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeTab, search, projects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-title text-display-title text-on-surface">Proyek</h2>
          <p className="text-secondary font-body-main mt-1">Kelola dan pantau semua proyek aktif</p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
          onClick={() => navigate('/projects/new')}
        >
          Proyek Baru
        </Button>
      </div>

      {/* Status tabs */}
      <nav className="flex border-b border-border overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-label-sm text-sm transition-all relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Cari berdasarkan nama, klien, kode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<span className="material-symbols-outlined">search</span>}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Proyek</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{projects.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Nilai</p>
          <p className="text-lg font-bold text-primary mt-1 truncate">{formatCurrency(projects.reduce((s, p) => s + p.estimatedValue, 0))}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-success mt-1">{projects.filter((p) => p.status === 'Executing' || p.status === 'LPHS/SIOS').length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Won</p>
          <p className="text-2xl font-bold text-status-purple mt-1">{projects.filter((p) => p.winnerDetails?.outcome === 'menang').length}</p>
        </Card>
      </div>

      {/* Project table */}
      <Card padding="none">
        <div className="overflow-x-auto table-mobile-compact">
          <table className="w-full text-left text-sm table-auto">
            <thead>
              <tr className="bg-surface-container-low border-b border-border">
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Kode</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Nama Proyek</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Klien</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Nilai</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 font-label-sm text-xs text-secondary uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-outline text-sm">Tidak ada proyek ditemukan</td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}/overview`)}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-outline">{project.code}</td>
                    <td className="px-6 py-4 font-medium text-on-surface max-w-[250px] truncate">{project.name}</td>
                    <td className="px-6 py-4 text-secondary">{project.client}</td>
                    <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                    <td className="px-6 py-4 text-on-surface font-medium">{formatCurrency(project.estimatedValue)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${progressColor(project.progress)}`} style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs text-outline font-medium">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-outline text-xs">{project.date}</td>
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
