import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge, PageContainer, PageHeader } from '@/components/shared';
import { Button, Card, Table, type Column } from '@/components/ui';
import { exportCSV } from '@/utils/export';
import FilterPanel from '@/components/shared/FilterPanel';
import { useProjectStatuses } from '@/hooks/useConfigData';
import { usePermission } from '@/hooks/usePermission';

const progressColor = (pct: number) => {
  if (pct >= 80) return 'bg-success';
  if (pct >= 50) return 'bg-gold';
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
  const authUser = useAuthStore((s) => s.user);
  const isFullAccess = authUser?.roleName !== 'Cabang';

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

    // User-based filtering: non-admin users only see their own projects
    if (!isFullAccess) {
      list = list.filter((p) => !p.createdByUserId || p.createdByUserId === authUser?.id);
    }

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
  }, [activeTab, search, projects, filterValues, isFullAccess, authUser?.id]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const projectColumns: Column<typeof projects[number]>[] = [
    { key: 'code', header: 'Kode', sortable: true, className: 'font-mono text-xs text-outline w-[12%]', render: (p) => <span className="font-mono text-xs text-outline">{p.code}</span> },
    { key: 'name', header: 'Nama Proyek', sortable: true, render: (p) => <span className="font-medium text-on-surface max-w-[250px] truncate block">{p.name}</span> },
    { key: 'client', header: 'Klien', sortable: true, render: (p) => <span className="text-secondary">{p.client}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (p) => <StatusBadge status={p.status} /> },
    { key: 'estimatedValue', header: 'Nilai', sortable: true, align: 'right', render: (p) => <span className="font-medium text-on-surface">{formatCurrency(p.estimatedValue)}</span> },
    { key: 'progress', header: 'Progress', sortable: true, render: (p) => (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${progressColor(p.progress)}`} style={{ width: `${p.progress}%` }} />
        </div>
        <span className="text-xs text-outline font-medium">{p.progress}%</span>
      </div>
    )},
    { key: 'date', header: 'Tanggal', sortable: true, render: (p) => <span className="text-outline text-xs">{p.date}</span> },
  ];

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

      <nav className="flex border-b border-border/60 overflow-x-auto">
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
              className="w-full pl-9 pr-3 py-2 border border-border/60 rounded-xl text-sm bg-surface focus:ring-primary outline-none focus:ring-1"
              aria-label="Cari proyek"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-primary/10 text-primary border-primary' : 'border-border/60 text-secondary hover:bg-surface-container'}`}
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
        <Table
          columns={projectColumns}
          data={paginated}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => navigate(`/project/${p.id}/overview`)}
          emptyState={
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-4 block">folder_off</span>
              <p className="text-secondary text-sm">Tidak ada proyek ditemukan</p>
            </div>
          }
        />
      </Card>
    </PageContainer>
  );
}
