import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/utils/formatters';
import { StatusBadge, PageContainer, PageHeader } from '@/components/shared';
import { Button, Card, Table, Modal, type Column } from '@/components/ui';
import { exportCSV } from '@/utils/export';
import FilterPanel from '@/components/shared/FilterPanel';
import { usePermission } from '@/hooks/usePermission';

type PipelineTab = 'all' | 'aktif' | 'menang' | 'kalah' | 'selesai';

const PAGE_SIZE = 20;

const terminalStatuses = ['Selesai', 'Kalah', 'Completed', 'Cancelled', 'Dibatalkan'];

function getDeadlineInfo(dateStr?: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const now = Date.now();
  const diffDays = Math.ceil((date.getTime() - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Terlambat ${Math.abs(diffDays)} hari`, variant: 'danger' };
  if (diffDays <= 3) return { label: `${diffDays} hari lagi`, variant: 'warning' };
  if (diffDays <= 14) return { label: `${diffDays} hari lagi`, variant: 'warning' };
  return { label: `${diffDays} hari lagi`, variant: 'success' };
}

const PIPELINE_TABS: { id: PipelineTab; label: string }[] = [
  { id: 'all', label: 'Semua Proyek' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'menang', label: 'Menang' },
  { id: 'kalah', label: 'Kalah' },
  { id: 'selesai', label: 'Selesai' },
];

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<PipelineTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerProject, setDrawerProject] = useState<typeof projects[number] | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    client: '',
    minValue: '',
    maxValue: '',
  });

  const projects = useProjectStore((s) => s.projects);
  const authUser = useAuthStore((s) => s.user);
  const isFullAccess = authUser?.roleName !== 'Cabang';

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

    if (!isFullAccess) {
      list = list.filter((p) => !p.createdByUserId || p.createdByUserId === authUser?.id);
    }

    if (activeTab === 'aktif') {
      list = list.filter((p) => {
        const isTerminal = terminalStatuses.includes(p.status) || terminalStatuses.includes(p.phase);
        return !isTerminal && p.winnerDetails?.outcome !== 'menang' && p.winnerDetails?.outcome !== 'kalah';
      });
    } else if (activeTab === 'menang') {
      list = list.filter((p) => p.winnerDetails?.outcome === 'menang');
    } else if (activeTab === 'kalah') {
      list = list.filter((p) => p.winnerDetails?.outcome === 'kalah');
    } else if (activeTab === 'selesai') {
      list = list.filter((p) => terminalStatuses.includes(p.status) || terminalStatuses.includes(p.phase));
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

  const handleTabClick = (tab: PipelineTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const projectColumns: Column<typeof projects[number]>[] = [
    {
      key: 'name',
      header: 'Proyek',
      sortable: true,
      render: (p) => (
        <div className="min-w-0 py-0.5">
          <div className="font-medium text-on-surface text-sm leading-tight truncate">{p.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-outline font-mono">{p.code}</span>
            <span className="text-[11px] text-outline">•</span>
            <span className="text-[11px] text-secondary truncate">{p.client}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[11px] text-outline">person</span>
            <span className="text-[11px] text-secondary truncate">{p.author}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'w-[13%]',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'estimatedValue',
      header: 'Nilai',
      sortable: true,
      align: 'right',
      className: 'w-[10%]',
      render: (p) => (
        <span className="font-medium text-on-surface text-xs" title={formatCurrency(p.estimatedValue)}>
          {formatCurrencyShort(p.estimatedValue)}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      className: 'w-[15%]',
      render: (p) => {
        const color = p.progress >= 71 ? 'bg-success' : p.progress >= 31 ? 'bg-gold' : 'bg-danger';
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${p.progress}%` }} />
            </div>
            <span className="text-xs text-outline font-medium w-8 text-right tabular-nums">{p.progress}%</span>
          </div>
        );
      },
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: false,
      className: 'w-[12%]',
      render: (p) => {
        const info = getDeadlineInfo(p.deadlineTender);
        if (!info) return null;
        const dotColor = info.variant === 'danger' ? 'bg-danger' : info.variant === 'warning' ? 'bg-gold' : 'bg-success';
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
            info.variant === 'danger' ? 'text-danger' : info.variant === 'warning' ? 'text-warning' : 'text-success'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {info.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'w-[40px]',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {can('proyek_edit') && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${p.id}/edit`); }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-all"
              title="Edit Proyek"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
        </div>
      ),
    },
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
                  { header: 'PIC', accessor: (p) => p.author },
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

      <nav className="flex flex-wrap gap-1 p-1 bg-surface-container rounded-xl border border-border/60">
        {PIPELINE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h ${
              activeTab === tab.id
                ? 'bg-surface text-primary shadow-sm border border-border/60 font-bold'
                : 'text-secondary hover:bg-surface-container-high'
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
        <button onClick={() => handleTabClick('all')} className="text-left">
          <Card padding="sm" className="hover:shadow-card-hover transition-all hover:-translate-y-0.5 cursor-pointer">
            <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Proyek</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{filtered.length}</p>
          </Card>
        </button>
        <Card padding="sm">
          <p className="text-outline text-xs font-semibold uppercase tracking-wider">Total Nilai</p>
          <p className="text-lg font-bold text-primary mt-1 truncate">{formatCurrencyShort(filtered.reduce((s, p) => s + p.estimatedValue, 0))}</p>
        </Card>
        <button onClick={() => handleTabClick('aktif')} className="text-left">
          <Card padding="sm" className="hover:shadow-card-hover transition-all hover:-translate-y-0.5 cursor-pointer">
            <p className="text-outline text-xs font-semibold uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-success mt-1">
              {filtered.filter((p) => {
                return !terminalStatuses.includes(p.status) && !terminalStatuses.includes(p.phase)
                  && p.winnerDetails?.outcome !== 'menang' && p.winnerDetails?.outcome !== 'kalah';
              }).length}
            </p>
          </Card>
        </button>
        <button onClick={() => handleTabClick('menang')} className="text-left">
          <Card padding="sm" className="hover:shadow-card-hover transition-all hover:-translate-y-0.5 cursor-pointer">
            <p className="text-outline text-xs font-semibold uppercase tracking-wider">Won</p>
            <p className="text-2xl font-bold text-status-purple mt-1">{filtered.filter((p) => p.winnerDetails?.outcome === 'menang').length}</p>
          </Card>
        </button>
      </div>

      <Card padding="none">
        <Table
          columns={projectColumns}
          data={paginated}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => setDrawerProject(p)}
          emptyState={
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-4 block">folder_off</span>
              <p className="text-secondary text-sm">Tidak ada proyek ditemukan</p>
            </div>
          }
        />
      </Card>

      <Modal
        isOpen={drawerProject !== null}
        onClose={() => setDrawerProject(null)}
        title={drawerProject?.name || ''}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDrawerProject(null)}>Tutup</Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => { if (drawerProject) { const id = drawerProject.id; setDrawerProject(null); navigate(`/project/${id}/overview`); } }}
            >
              Buka Detail
            </Button>
          </>
        }
      >
        {drawerProject && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Kode Proyek</p>
              <p className="text-sm font-medium text-on-surface font-mono">{drawerProject.code}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Status</p>
              <StatusBadge status={drawerProject.status} />
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Klien</p>
              <p className="text-sm font-medium text-on-surface">{drawerProject.client}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Nilai Proyek</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(drawerProject.estimatedValue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">PIC</p>
              <p className="text-sm font-medium text-on-surface flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {drawerProject.author.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </span>
                {drawerProject.author}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Cabang</p>
              <p className="text-sm font-medium text-on-surface">{drawerProject.branch || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${drawerProject.progress >= 71 ? 'bg-success' : drawerProject.progress >= 31 ? 'bg-gold' : 'bg-danger'}`}
                    style={{ width: `${drawerProject.progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-on-surface">{drawerProject.progress}%</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Deadline</p>
              <p className="text-sm font-medium text-on-surface">
                {drawerProject.deadlineTender ? formatDate(drawerProject.deadlineTender) : '-'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Tanggal Dibuat</p>
              <p className="text-sm font-medium text-on-surface">{drawerProject.date}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Tipe</p>
              <p className="text-sm font-medium text-on-surface">{drawerProject.type}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider font-semibold mb-1">Hasil</p>
              <p className={`text-sm font-bold ${drawerProject.winnerDetails?.outcome === 'menang' ? 'text-success' : drawerProject.winnerDetails?.outcome === 'kalah' ? 'text-danger' : 'text-secondary'}`}>
                {drawerProject.winnerDetails?.outcome === 'menang' ? 'Menang' : drawerProject.winnerDetails?.outcome === 'kalah' ? 'Kalah' : '-'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
