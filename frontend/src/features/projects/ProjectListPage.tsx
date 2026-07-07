import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/stores/projectStore';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/utils/formatters';
import { StatusBadge, PageContainer, PageHeader, BulkActions } from '@/components/shared';
import { Button, Card, Table, Modal, type Column } from '@/components/ui';
import { exportCSV } from '@/utils/export';
import { useActiveOptions } from '@/hooks/useInputConfig';
import FilterPanel from '@/components/shared/FilterPanel';
import { useAuthz } from '@/hooks/useAuthz';
import { useOwnerFilter } from '@/hooks/useOwnerFilter';

const PAGE_SIZE = 20;

const terminalStatuses = ['Selesai', 'Kalah', 'Cancelled', 'Dibatalkan'];

function getTabFetchParams(tab: string): Record<string, string> {
  switch (tab) {
    case 'prospecting': return { type: 'prospecting' };
    case 'tender': return { type: 'tender' };
    case 'negotiation': return { type: 'tender', excludeResult: 'won,lost' };
    case 'won': return { result: 'won' };
    case 'lost': return { result: 'lost' };
    default: return {};
  }
}

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

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { can } = useAuthz();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [activeTab, setActiveTab] = useState<string>('all');
  const pipelineTabOptions = useActiveOptions('pipeline_tabs');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerProject, setDrawerProject] = useState<typeof projects[number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<typeof projects[number] | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    client: '',
    minValue: '',
    maxValue: '',
  });

  const projects = useProjectStore((s) => s.projects);
  const authUser = useAuthStore((s) => s.user);
  const { isStaffOnly, userId } = useOwnerFilter();
  const projectPhases = useConfigStore((s) => s.projectPhases);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchProjects(getTabFetchParams(activeTab)); }, [activeTab, fetchProjects]);

  // Derive progress from project status for display (mirrors ProjectDetailPage logic)
  const deriveProgress = useCallback((status: string) => {
    const active = projectPhases.filter((p) => p.isActive).sort((a, b) => a.order - b.order);
    const idx = active.findIndex((p) => p.status === status);
    if (idx >= 0 && active.length > 1) {
      return Math.round((idx / (active.length - 1)) * 100);
    }
    return 0;
  }, [projectPhases]);

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

    // Staff: hanya lihat proyek milik sendiri
    if (isStaffOnly && userId) {
      list = list.filter((p) => !p.ownerUserId || p.ownerUserId === userId);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
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
  }, [debouncedSearch, projects, filterValues, isStaffOnly, userId]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Override progress with value derived from project status for display
  const displayFiltered = useMemo(
    () => filtered.map((p) => ({ ...p, progress: deriveProgress(p.status) })),
    [filtered, deriveProgress],
  );
  const displayPaginated = useMemo(
    () => paginated.map((p) => ({ ...p, progress: deriveProgress(p.status) })),
    [paginated, deriveProgress],
  );

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleBatchDelete = useCallback(() => {
    selectedRows.forEach(id => deleteProject(id));
    toast.success(`${selectedRows.size} proyek berhasil dihapus.`);
    setSelectedRows(new Set());
    setSelectionMode(false);
  }, [selectedRows, deleteProject]);

  const handleBatchExport = useCallback(() => {
    const selected = displayFiltered.filter(p => selectedRows.has(p.id));
    exportCSV(
      selected,
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
    );
  }, [selectedRows, displayFiltered]);

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
      className: 'w-[80px]',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {can('project:write') && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}/edit`); }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-all"
              title="Edit Proyek"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
          {can('project:write') && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-outline hover:text-danger hover:bg-danger/10 transition-all"
              title="Hapus Proyek"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
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
                displayFiltered,
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
            {can('project:create') && (
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
        {pipelineTabOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleTabClick(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h ${
              activeTab === opt.value
                ? 'bg-surface text-primary shadow-sm border border-border/60 font-bold'
                : 'text-secondary hover:bg-surface-container-high'
            }`}
          >
            {opt.label}
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
          {can('project:write') && (
            <button
              onClick={() => { setSelectionMode(v => !v); setSelectedRows(new Set()); }}
              className={`p-2 rounded-xl border transition-all ${
                selectionMode
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border/60 text-secondary hover:bg-surface-container'
              }`}
              title={selectionMode ? 'Tutup mode pilih' : 'Mode pilih'}
              aria-label={selectionMode ? 'Tutup mode pilih' : 'Aktifkan mode pilih'}
            >
              <span className="material-symbols-outlined text-sm">checklist</span>
            </button>
          )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <button onClick={() => handleTabClick('tender')} className="text-left">
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
        <button onClick={() => handleTabClick('won')} className="text-left">
          <Card padding="sm" className="hover:shadow-card-hover transition-all hover:-translate-y-0.5 cursor-pointer">
            <p className="text-outline text-xs font-semibold uppercase tracking-wider">Won</p>
            <p className="text-2xl font-bold text-status-purple mt-1">{filtered.filter((p) => p.winnerDetails?.outcome === 'menang').length}</p>
          </Card>
        </button>
      </div>

      <Card padding="none">
        {selectionMode && selectedRows.size > 0 && (
          <div className="px-4 sm:px-6 pt-4">
            <BulkActions
              selectedCount={selectedRows.size}
              onClearSelection={() => { setSelectedRows(new Set()); setSelectionMode(false); }}
              onBatchDelete={handleBatchDelete}
              onBatchExport={handleBatchExport}
              deleteConfirmMessage={`Apakah Anda yakin ingin menghapus ${selectedRows.size} proyek yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
            />
          </div>
        )}
        <Table
          columns={projectColumns}
          data={displayPaginated}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => setDrawerProject(p)}
          selectedRows={selectionMode ? selectedRows : undefined}
          onSelectionChange={selectionMode ? setSelectedRows : undefined}
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
              onClick={() => { if (drawerProject) { const id = drawerProject.id; setDrawerProject(null); navigate(`/projects/${id}/overview`); } }}
            >
              Buka Detail
            </Button>
          </>
        }
      >
        {drawerProject && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
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
                  {(drawerProject.author || '').split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" size="md" onClick={() => {
              if (deleteTarget) {
                deleteProject(deleteTarget.id);
                toast.success(`Proyek "${deleteTarget.name}" berhasil dihapus.`);
                setDeleteTarget(null);
              }
            }}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          Apakah Anda yakin ingin menghapus proyek <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </PageContainer>
  );
}
