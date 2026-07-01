import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Card } from '@/components/ui';
import { PageContainer, PageHeader, StatusBadge } from '@/components/shared';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import { exportCSV } from '@/utils/export';

interface ProspectsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

type FilterTab = 'All' | 'Non Potensial' | 'Potensial' | 'Waiting PM' | 'Revision' | 'Approved' | 'Perlu Verifikasi';

const PAGE_SIZE = 10;

export default function ProspectsView({ onShowNotification, onNavigatePage }: ProspectsViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const prospects = useProspectStore((s) => s.prospects);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const addProject = useProjectStore((s) => s.addProject);
  const projects = useProjectStore((s) => s.projects);
  const authUser = useAuthStore((s) => s.user);
  const { can } = usePermission();

  const isFullAccess = authUser?.roleName !== 'Cabang';
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProspect(deleteTarget);
    onShowNotification('Prospek berhasil dihapus.', 'success');
    setDeleteTarget(null);
  };

  const handleBuatProyek = (prospek: typeof prospects[0]) => {
    const newProject = {
      id: `PRJ-${Date.now()}`,
      code: `PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(4, '0')}`,
      name: prospek.name,
      client: prospek.client,
      status: 'Prospecting',
      phase: 'Overview',
      location: prospek.branch || '-',
      author: prospek.author,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: 0,
      estimatedValue: prospek.estimatedValue || 0,
      type: prospek.projectType || 'Prospecting',
      sourceProspectId: prospek.id,
      providerExisting: prospek.providerExisting,
      createdByUserId: prospek.createdByUserId,
    };

    addProject(newProject as any);
    updateProspect(prospek.id, {
      isConverted: true,
      projectId: newProject.id,
    });

    onShowNotification('Prospek berhasil dikonversi ke proyek!', 'success');
    navigate(`/project/${newProject.id}/overview`);
  };

  const filteredProspects = prospects.filter(p => {
    // User-based filtering: non-admin users only see their own prospects
    if (!isFullAccess && p.createdByUserId && p.createdByUserId !== authUser?.id) {
      return false;
    }

    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesTab: boolean;
    if (activeFilter === 'All') {
      matchesTab = true;
    } else if (activeFilter === 'Non Potensial') {
      matchesTab = p.status === 'Non Potensial' || p.prospectType === 'non_potensial';
    } else if (activeFilter === 'Potensial') {
      matchesTab = p.status === 'Potensial' || p.prospectType === 'potensial';
    } else if (activeFilter === 'Perlu Verifikasi') {
      matchesTab = p.customerData?.needsVerification === true;
    } else {
      matchesTab = p.status === activeFilter;
    }
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredProspects.length / PAGE_SIZE);
  const paginatedProspects = filteredProspects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const FILTER_TABS: FilterTab[] = ['All', 'Non Potensial', 'Potensial', 'Waiting PM', 'Revision', 'Approved', 'Perlu Verifikasi'];
  const FILTER_LABELS: Record<FilterTab, string> = {
    All: 'Semua',
    'Non Potensial': 'Non Potensial',
    Potensial: 'Potensial',
    'Waiting PM': 'Menunggu PM',
    Revision: 'Revisi',
    Approved: 'Disetujui',
    'Perlu Verifikasi': 'Perlu Verifikasi',
  };

  return (
    <PageContainer>
      <PageHeader
        title="Prospek"
        description="Daftar Prospek"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}
              onClick={() => exportCSV(
                prospects,
                [
                  { header: 'Nama Prospek', accessor: (p) => p.name },
                  { header: 'Client', accessor: (p) => p.client },
                  { header: 'Status', accessor: (p) => p.status },
                  { header: 'Nilai Estimasi', accessor: (p) => p.estimatedValue ? `Rp ${p.estimatedValue.toLocaleString('id-ID')}` : '-' },
                  { header: 'Author', accessor: (p) => p.author },
                  { header: 'Tanggal', accessor: (p) => p.date },
                ],
                'daftar_prospek',
              )}
            >
              Export CSV
            </Button>
            {can('prospek_create') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/prospects/new')}
                leftIcon={<span className="material-symbols-outlined text-[20px]">add</span>}
              >
                Buat Prospek Baru
              </Button>
            )}
          </div>
        }
      />

        {/* Filter Bar */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-border overflow-x-auto w-full sm:w-auto">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveFilter(tab); setCurrentPage(1); }}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h ${
                    activeFilter === tab
                      ? 'bg-surface-container-lowest text-primary shadow-sm border border-border font-bold'
                      : 'text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {FILTER_LABELS[tab]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary w-full sm:w-[260px] outline-none focus:ring-1"
                  placeholder="Cari prospek atau klien..."
                  type="text"
                />
              </div>
            </div>
          </div>
        </div>

        <Card padding="none">
          {isMobile ? (
            <div className="divide-y divide-border">
              {paginatedProspects.length === 0 ? (
                <div className="px-6 py-12 text-center text-secondary">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                  <p>Tidak ada prospek ditemukan</p>
                </div>
              ) : (
                paginatedProspects.map((row, index) => (
                  <div key={row.id} className="p-4 space-y-3 active:bg-surface-container-low transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div
                          onClick={() => navigate(`/prospects/${row.id}`)}
                          className="font-label-sm text-on-surface font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                        >
                          {row.name}
                        </div>
                        {row.description && (
                          <p className="text-xs text-secondary truncate">{row.description}</p>
                        )}
                      </div>
                      <StatusBadge
                        status={row.customerData?.needsVerification ? 'Perlu Verifikasi' : row.status}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-secondary">
                        <span className="material-symbols-outlined text-[14px]">business</span>
                        <span>{row.client}</span>
                      </div>
                      <span className="text-secondary">{row.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                          {row.author.charAt(0)}
                        </div>
                        <span className="text-on-surface text-xs">{row.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.status === 'Approved' && !row.isConverted && can('proyek_create') && (
                          <button
                            onClick={() => handleBuatProyek(row)}
                            className="touch-min flex items-center justify-center text-success hover:text-success hover:bg-success/10 rounded-lg transition-all"
                            title="Konversi ke Proyek"
                          >
                            <span className="material-symbols-outlined text-[20px]">add_business</span>
                          </button>
                        )}
                        {can('prospek_edit') && (
                          <button
                            onClick={() => navigate(`/prospects/${row.id}/edit`)}
                            className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                            title="Sunting Prospek"
                            aria-label="Sunting"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        )}
                        {can('prospek_delete') && (
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all"
                            title="Hapus Prospek"
                            aria-label="Hapus"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm table-fixed">
                <thead className="bg-surface-container-low text-on-surface font-label-sm border-b border-border sticky top-0 z-10 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.08)]">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-[50px]">No</th>
                    <th className="px-6 py-4 font-semibold w-[26%]">Nama Prospek</th>
                    <th className="px-6 py-4 font-semibold w-[15%]">Customer</th>
                    <th className="px-6 py-4 font-semibold w-[14%]">Status</th>
                    <th className="px-6 py-4 font-semibold w-[14%]">Dibuat Oleh</th>
                    <th className="px-6 py-4 font-semibold w-[12%]">Tgl Dibuat</th>
                    <th className="px-6 py-4 font-semibold text-right w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProspects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-secondary">
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                        <p>Tidak ada prospek ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedProspects.map((row, index) => {
                      const globalIndex = (currentPage - 1) * PAGE_SIZE + index + 1;
                      return (
                      <tr key={row.id} className="border-b border-border hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors group">
                        <td className="px-6 py-4 font-mono-data text-mono-data text-outline">{globalIndex}</td>
                        <td className="px-6 py-4 overflow-hidden">
                          <div
                            onClick={() => navigate(`/prospects/${row.id}`)}
                            className="font-label-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer font-medium truncate"
                          >
                            {row.name}
                          </div>
                          {row.description && (
                            <p className="text-xs text-secondary truncate">{row.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-secondary truncate overflow-hidden">{row.client}</td>
                        <td className="px-6 py-4 overflow-hidden">
                        <StatusBadge
                          status={row.customerData?.needsVerification ? 'Perlu Verifikasi' : row.status}
                        />
                        </td>
                        <td className="px-6 py-4 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {row.author.charAt(0)}
                            </div>
                            <span className="text-on-surface text-xs truncate">{row.author}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-secondary truncate overflow-hidden">{row.date}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {row.status === 'Approved' && !row.isConverted && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleBuatProyek(row); }}
                                className="touch-min flex items-center justify-center text-success hover:text-success hover:bg-success/10 rounded-lg transition-all"
                                title="Konversi ke Proyek"
                              >
                                <span className="material-symbols-outlined text-[20px]">add_business</span>
                              </button>
                            )}
                            {can('prospek_edit') && (
                              <button
                                onClick={() => navigate(`/prospects/${row.id}/edit`)}
                                className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                                title="Sunting Prospek"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                            )}
                            {can('prospek_delete') && (
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all"
                                title="Hapus Prospek"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                      })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-low text-xs gap-3">
            <span className="text-secondary font-caption-xs">
              Menampilkan <span className="font-bold text-on-surface">{filteredProspects.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredProspects.length)}</span> dari{' '}
              <span className="font-bold text-on-surface">{filteredProspects.length}</span> hasil
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
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Konfirmasi Hapus"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="danger" size="md" onClick={confirmDelete}>Hapus</Button>
            </>
          }
        >
          <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus prospek ini dari draf? Tindakan ini tidak dapat dibatalkan.</p>
        </Modal>
    </PageContainer>
  );
}
