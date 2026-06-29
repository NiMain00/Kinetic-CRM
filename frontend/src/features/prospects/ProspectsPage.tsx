import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectStatuses } from '@/hooks/useConfigData';
import { usePermission } from '@/hooks/usePermission';

interface ProspectsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

type FilterTab = 'All' | 'Non Potensial' | 'Potensial' | 'Waiting PM' | 'Revision' | 'Approved' | 'Perlu Verifikasi';

export default function ProspectsView({ onShowNotification, onNavigatePage }: ProspectsViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const prospects = useProspectStore((s) => s.prospects);
  const deleteProspect = useProspectStore((s) => s.deleteProspect);
  const updateProspect = useProspectStore((s) => s.updateProspect);
  const addProject = useProjectStore((s) => s.addProject);
  const projects = useProjectStore((s) => s.projects);
  const { can } = usePermission();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
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
    };

    addProject(newProject as any);
    updateProspect(prospek.id, {
      isConverted: true,
      projectId: newProject.id,
    });

    onShowNotification('Prospek berhasil dikonversi ke proyek!', 'success');
    navigate(`/project/${newProject.id}/overview`);
  };

  // Filter prospects
  const projectStatuses = useProjectStatuses();

  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    projectStatuses.forEach((s) => {
      const hex = s.color_hex;
      map[s.code] = `bg-[${hex}15] text-[${hex}]`;
    });
    map['Non Potensial'] = 'bg-slate-200 text-slate-600';
    map['Potensial'] = 'bg-emerald-100 text-emerald-700';
    map['Waiting PM'] = 'bg-warning/10 text-warning';
    map['Revision'] = 'bg-status-orange/10 text-status-orange';
    map['Approved'] = 'bg-success/10 text-success';
    return map;
  }, [projectStatuses]);

  const filteredProspects = prospects.filter(p => {
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

  const statusColor = (status: string, prospect?: typeof prospects[0]) => {
    if (prospect?.customerData?.needsVerification) {
      return 'bg-amber-100 text-amber-700';
    }
    return statusColorMap[status] || 'bg-info/10 text-info';
  };

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
    <div className={`${isMobile ? 'p-2' : 'p-1'} space-y-4 sm:space-y-8 flex-1 overflow-y-auto`}>
      <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display-title text-display-title text-on-surface">Prospek</h2>
            <nav className="flex text-xs text-outline mt-1 font-label-sm">
              <span className="hover:text-primary cursor-pointer" onClick={() => onNavigatePage('dashboard')}>
                Dashboard
              </span>
              <span className="mx-2">/</span>
              <span className="text-primary font-semibold">Daftar Prospek</span>
            </nav>
          </div>
          {can('prospek_create') && (
            <button
              onClick={() => navigate('/prospects/new')}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-sm text-sm flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all font-semibold touch-min-h"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Buat Prospek Baru
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-border overflow-x-auto w-full sm:w-auto">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h ${
                    activeFilter === tab
                      ? 'bg-white text-primary shadow-sm border border-border font-bold'
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
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary w-full sm:w-[260px] outline-none focus:ring-1"
                  placeholder="Cari prospek atau klien..."
                  type="text"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table / Card Stack */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {isMobile ? (
            <div className="divide-y divide-border">
              {filteredProspects.length === 0 ? (
                <div className="px-6 py-12 text-center text-secondary">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">info</span>
                  <p>Tidak ada prospek ditemukan</p>
                </div>
              ) : (
                filteredProspects.map((row, index) => (
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
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(row.status, row)}`}>
                        {row.customerData?.needsVerification ? 'Perlu Verifikasi' : row.status}
                      </span>
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
                        {row.status === 'Approved' && !row.isConverted && (
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
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-surface-container-low text-on-surface font-label-sm border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-16">No</th>
                    <th className="px-6 py-4 font-semibold">Nama Prospek</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Dibuat Oleh</th>
                    <th className="px-6 py-4 font-semibold">Tgl Dibuat</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
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
                    filteredProspects.map((row, index) => (
                      <tr key={row.id} className="border-b border-border hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 font-mono-data text-mono-data text-outline">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div
                            onClick={() => navigate(`/prospects/${row.id}`)}
                            className="font-label-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer font-medium"
                          >
                            {row.name}
                          </div>
                          {row.description && (
                            <p className="text-xs text-secondary truncate max-w-md">{row.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-secondary">{row.client}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(row.status, row)}`}>
                            {row.customerData?.needsVerification ? 'Perlu Verifikasi' : row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                              {row.author.charAt(0)}
                            </div>
                            <span className="text-on-surface text-xs">{row.author}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-secondary">{row.date}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-low text-xs gap-3">
            <span className="text-secondary font-caption-xs">
              Showing <span className="font-bold text-on-surface">1 - {filteredProspects.length}</span> of{' '}
              <span className="font-bold text-on-surface">{filteredProspects.length}</span> results
            </span>
            <div className="flex items-center gap-1">
              <button className="touch-min flex items-center justify-center p-1 rounded bg-white border border-border text-secondary cursor-not-allowed px-2" disabled>
                Prev
              </button>
              <button className="touch-min flex items-center justify-center p-1 px-2.5 rounded bg-primary text-white font-semibold">1</button>
              <button className="touch-min flex items-center justify-center p-1 rounded bg-white border border-border text-secondary cursor-not-allowed px-2" disabled>
                Next
              </button>
            </div>
          </div>
        </div>

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
      </>
    </div>
  );
}
