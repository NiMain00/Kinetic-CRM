import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge, PageContainer, PageHeader } from '@/components/shared';
import { Button, Card } from '@/components/ui';
import { exportCSV } from '@/utils/export';
import FilterPanel from '@/components/shared/FilterPanel';
import { useProjectStatuses } from '@/hooks/useConfigData';
import { usePermission } from '@/hooks/usePermission';

const progressColor = (pct: number) => {
  if (pct >= 80) return 'bg-success';
  if (pct >= 50) return 'bg-warning';
  return 'bg-primary';
};

const PAGE_SIZE = 15;

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    client: '',
    minValue: '',
    maxValue: '',
  });

  const projects = useProjectStore((s) => s.projects);
  const projectStatuses = useProjectStatuses();

  const statusTabs = useMemo(() => {
    const tabs = [{ id: 'all', label: 'Semua Proyek' }];
    projectStatuses.forEach((s) => {
      if (s.is_active) tabs.push({ id: s.code, label: s.label });
    });
    return tabs;
  }, [projectStatuses]);

  // Map dari label status (digunakan di project.status) ke kode status (digunakan sebagai tab id)
  const statusLabelToCode = useMemo(() => {
    const map: Record<string, string> = {};
    projectStatuses.forEach((s) => {
      map[s.label] = s.code;
      map[s.label.toLowerCase()] = s.code;
    });
    // Mapping manual untuk nilai status legacy yang tidak cocok dengan label
    map['executing'] = 'target_delivery';
    map['rks'] = 'submit_rks';
    map['revisi'] = 'revision';
    map['pemenang'] = 'pengumuman_pemenang';
    map['selesai'] = 'selesai';
    map['dibatalkan'] = 'cancelled';
    map['LPHS/SIOS'] = 'lphs_sios';
    map['Input Harga'] = 'submit_harga';
    map['Review Departemen'] = 'review_department';
    return map;
  }, [projectStatuses]);

  const uniqueClients = useMemo(() => {
    return [...new Set(projects.map((p) => p.client))].sort();
  }, [projects]);

  const filterFields = [
    { key: 'client', label: 'Client', type: 'select' as const, options: uniqueClients.map((c) => ({ value: c, label: c })), placeholder: 'Semua Client' },
    { key: 'minValue', label: 'Nilai Min (Rp)', type: 'text' as const, placeholder: 'Min' },
    { key: 'maxValue', label: 'Nilai Max (Rp)', type: 'text' as const, placeholder: 'Max' },
  ];

  const filtered = useMemo(() => {
    let list = projects;
    if (activeTab !== 'all') {
      list = list.filter((p) => {
        // Coba cocokkan langsung, lalu melalui mapping label->kode
        const mappedStatus = statusLabelToCode[p.status] || statusLabelToCode[p.status.toLowerCase()];
        const mappedPhase = statusLabelToCode[p.phase] || statusLabelToCode[p.phase.toLowerCase()];
        return (
          p.status === activeTab ||
          p.phase === activeTab ||
          mappedStatus === activeTab ||
          mappedPhase === activeTab
        );
      });
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
    if (filterValues.client) {
      list = list.filter((p) => p.client === filterValues.client);
    }
    if (filterValues.minValue) {
      const min = Number(filterValues.minValue);
      if (!isNaN(min)) list = list.filter((p) => p.estimatedValue >= min);
    }
    if (filterValues.maxValue) {
      const max = Number(filterValues.maxValue);
      if (!isNaN(max)) list = list.filter((p) => p.estimatedValue <= max);
    }
    return list;
  }, [activeTab, search, projects, filterValues]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Proyek"
        description="Kelola dan pantau semua proyek aktif"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}
              onClick={() => exportCSV(
                filtered,
                [
                  { header: 'Kode', accessor: (p) => p.code },
                  { header: 'Nama Proyek', accessor: (p) => p.name },
                  { header: 'Klien', accessor: (p) => p.client },
                  { header: 'Status', accessor: (p) => p.status },
                  { header: 'Nilai', accessor: (p) => formatCurrency(p.estimatedValue) },
                  { header: 'Progress', accessor: (p) => `${p.progress}%` },
                  { header: 'Tanggal', accessor: (p) => p.date },
                ],
                'daftar_proyek',
              )}
            >
              Export CSV
            </Button>
            {can('proyek_create') && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
              onClick={() => navigate('/projects/new')}
            >
              Proyek Baru
            </Button>
            )}
          </div>
        }
      />

      <nav className="flex border-b border-border overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
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

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              placeholder="Cari nama, klien, kode..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary outline-none focus:ring-1"
              aria-label="Cari proyek"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-primary/10 text-primary border-primary' : 'border-border text-secondary hover:bg-surface-container-low'}`}
            title="Filter"
          >
            <span className="material-symbols-outlined text-sm">filter_alt</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <FilterPanel
          fields={filterFields}
          values={filterValues}
          onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          onReset={() => setFilterValues({ client: '', minValue: '', maxValue: '' })}
          onApply={() => {}}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Proyek</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{filtered.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Nilai</p>
          <p className="text-lg font-bold text-primary mt-1 truncate">{formatCurrency(filtered.reduce((s, p) => s + p.estimatedValue, 0))}</p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-success mt-1">
            {filtered.filter((p) => {
              const terminalStatuses = ['Selesai', 'Kalah', 'Completed', 'Cancelled', 'Dibatalkan'];
              return !terminalStatuses.includes(p.status) && !terminalStatuses.includes(p.phase);
            }).length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Won</p>
          <p className="text-2xl font-bold text-status-purple mt-1">{filtered.filter((p) => p.winnerDetails?.outcome === 'menang').length}</p>
        </Card>
      </div>

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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-outline text-sm">Tidak ada proyek ditemukan</td>
                </tr>
              ) : (
                paginated.map((project) => (
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

      {/* Pagination footer */}
      <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-low text-xs gap-3 rounded-b-xl">
        <span className="text-secondary font-caption-xs">
          Menampilkan <span className="font-bold text-on-surface">{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> dari{' '}
          <span className="font-bold text-on-surface">{filtered.length}</span> hasil
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="touch-min flex items-center justify-center px-2 py-1 rounded bg-surface-container-lowest border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Prev
          </button>
          {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`touch-min flex items-center justify-center px-2.5 py-1 rounded font-semibold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-surface-container-lowest border border-border text-secondary hover:bg-surface-container-low'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="touch-min flex items-center justify-center px-2 py-1 rounded bg-surface-container-lowest border border-border text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
