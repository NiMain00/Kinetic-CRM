import React, { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { prospectService } from '../../services/prospects';
import { masterDataService } from '../../services/master-data';

interface Option { id: string; name: string; code?: string; }

interface ProspectAPI {
  id: string;
  name: string;
  customer: { id: string; name: string; code: string } | null;
  branch: { id: string; name: string; code: string } | null;
  category: { id: string; name: string } | null;
  creator: { id: string; name: string };
  status: string;
  description: string | null;
  estimatedValue: number | null;
  estimatedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProspectsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

export default function ProspectsView({ onShowNotification, onNavigatePage }: ProspectsViewProps) {
  const isMobile = useIsMobile();
  const [prospects, setProspects] = useState<ProspectAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProspect, setSelectedProspect] = useState<ProspectAPI | null>(null);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);

  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    Promise.all([
      masterDataService.customers(),
      masterDataService.projectCategories(),
      masterDataService.branches(),
    ]).then(([cRes, catRes, bRes]) => {
      setCustomers(cRes.data.data || []);
      setCategories(catRes.data.data || []);
      setBranches(bRes.data.data || []);
    }).catch(() => onShowNotification('Gagal memuat data referensi.', 'error'));
  }, [onShowNotification]);

  const fetchProspects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await prospectService.list({
        search: searchQuery || undefined,
        status: activeFilter !== 'All' ? activeFilter : undefined,
        perPage: 100,
      });
      setProspects(res.data.data || []);
    } catch {
      onShowNotification('Gagal memuat data prospek.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, onShowNotification]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const resetForm = () => {
    setFormName('');
    setFormCustomerId('');
    setFormCategoryId('');
    setFormBranchId('');
    setFormValue('');
    setFormDate('');
    setFormDesc('');
  };

  const handleCreateNew = () => {
    setSelectedProspect(null);
    resetForm();
    setFormMode('create');
  };

  const handleEdit = (p: ProspectAPI) => {
    setSelectedProspect(p);
    setFormName(p.name);
    setFormCustomerId(p.customer?.id || '');
    setFormCategoryId(p.category?.id || '');
    setFormBranchId(p.branch?.id || '');
    setFormValue(p.estimatedValue ? String(p.estimatedValue) : '');
    setFormDate(p.estimatedDate || '');
    setFormDesc(p.description || '');
    setFormMode('edit');
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) { onShowNotification('Nama Prospek harus diisi!', 'error'); return; }
    try {
      const data: Record<string, unknown> = {
        name: formName, description: formDesc,
        estimatedValue: Number(formValue) || null, estimatedDate: formDate || null,
      };
      if (formCustomerId) data.customerId = formCustomerId;
      if (formCategoryId) data.categoryId = formCategoryId;
      if (formBranchId) data.branchId = formBranchId;

      if (formMode === 'edit' && selectedProspect) {
        await prospectService.update(selectedProspect.id, data);
        onShowNotification('Prospek berhasil diperbarui.', 'success');
      } else {
        await prospectService.create(data);
        onShowNotification('Draf prospek berhasil disimpan.', 'success');
      }
      setFormMode('list');
      await fetchProspects();
    } catch {
      onShowNotification('Gagal menyimpan prospek.', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) { onShowNotification('Nama Prospek wajib diisi.', 'error'); return; }
    if (!formCustomerId || !formCategoryId || !formBranchId) {
      onShowNotification('Customer, Kategori, dan Cabang harus diisi.', 'error'); return;
    }
    try {
      const data = {
        name: formName, customerId: formCustomerId, categoryId: formCategoryId, branchId: formBranchId,
        description: formDesc, estimatedValue: Number(formValue) || null, estimatedDate: formDate || null,
        status: 'Waiting PM',
      };
      if (formMode === 'edit' && selectedProspect) {
        await prospectService.update(selectedProspect.id, data);
      } else {
        await prospectService.create(data);
      }
      onShowNotification('Prospek berhasil diajukan ke PM untuk review.', 'success');
      setFormMode('list');
      await fetchProspects();
    } catch {
      onShowNotification('Gagal mengirim prospek.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus prospek ini?')) return;
    try {
      await prospectService.delete(id);
      onShowNotification('Prospek berhasil dihapus.', 'success');
      await fetchProspects();
    } catch {
      onShowNotification('Gagal menghapus prospek.', 'error');
    }
  };

  const filteredProspects = prospects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeFilter === 'All' || p.status === activeFilter;
    return matchesSearch && matchesTab;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'Prospecting': return 'bg-info/10 text-info';
      case 'Waiting PM': return 'bg-warning/10 text-warning';
      case 'Revision': return 'bg-status-orange/10 text-status-orange';
      case 'Approved': return 'bg-success/10 text-success';
      default: return 'bg-secondary-container/50 text-on-secondary-container';
    }
  };

  return (
    <div className={`${isMobile ? 'p-2' : 'p-1'} space-y-4 sm:space-y-8 flex-1 overflow-y-auto`}>
      {formMode === 'list' ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display-title text-display-title text-on-surface">Prospek</h2>
              <nav className="flex text-xs text-outline mt-1 font-label-sm">
                <span className="hover:text-primary cursor-pointer" onClick={() => onNavigatePage('dashboard')}>Dashboard</span>
                <span className="mx-2">/</span>
                <span className="text-primary font-semibold">Daftar Prospek</span>
              </nav>
            </div>
            <button onClick={handleCreateNew} className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-sm text-sm flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all font-semibold touch-min-h">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Buat Prospek Baru
            </button>
          </div>

          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-border overflow-x-auto w-full sm:w-auto">
                {['All', 'Prospecting', 'Waiting PM', 'Revision', 'Approved'].map(tab => (
                  <button key={tab} onClick={() => setActiveFilter(tab)}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h ${
                      activeFilter === tab ? 'bg-white text-primary shadow-sm border border-border font-bold' : 'text-secondary hover:bg-surface-container-high'
                    }`}>{tab === 'All' ? 'Semua' : tab}</button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface-container-lowest focus:ring-primary w-full sm:w-[260px] outline-none focus:ring-1" placeholder="Cari prospek atau klien..." type="text" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="px-6 py-12 text-center text-secondary">Memuat data...</div>
            ) : isMobile ? (
              <div className="divide-y divide-border">
                {filteredProspects.length === 0 ? (
                  <div className="px-6 py-12 text-center text-secondary"><span className="material-symbols-outlined text-4xl text-outline mb-2">info</span><p>Tidak ada prospek ditemukan</p></div>
                ) : filteredProspects.map(row => (
                  <div key={row.id} className="p-4 space-y-3 active:bg-surface-container-low transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-label-sm text-on-surface font-medium text-sm">{row.name}</div>
                        {row.description && <p className="text-xs text-secondary truncate">{row.description}</p>}
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(row.status)}`}>{row.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-secondary">
                        <span className="material-symbols-outlined text-[14px]">business</span>
                        <span>{row.customer?.name || '-'}</span>
                      </div>
                      <span className="text-secondary">{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">{row.creator.name.charAt(0)}</div>
                        <span className="text-on-surface text-xs">{row.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(row)} className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all" title="Edit"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                        <button onClick={() => handleDelete(row.id)} className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all" title="Hapus"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                      </div>
                    </div>
                  </div>
                ))}
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
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-secondary"><span className="material-symbols-outlined text-4xl text-outline mb-2">info</span><p>Tidak ada prospek ditemukan</p></td></tr>
                    ) : filteredProspects.map((row, index) => (
                      <tr key={row.id} className="border-b border-border hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 font-mono-data text-mono-data text-outline">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-label-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer font-medium">{row.name}</div>
                          {row.description && <p className="text-xs text-secondary truncate max-w-md">{row.description}</p>}
                        </td>
                        <td className="px-6 py-4 text-secondary">{row.customer?.name || '-'}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(row.status)}`}>{row.status}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">{row.creator.name.charAt(0)}</div>
                            <span className="text-on-surface text-xs">{row.creator.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-secondary">{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(row)} className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all" title="Edit"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                            <button onClick={() => handleDelete(row.id)} className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all" title="Hapus"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-low text-xs gap-3">
              <span className="text-secondary font-caption-xs">Menampilkan <span className="font-bold text-on-surface">1 - {filteredProspects.length}</span> dari <span className="font-bold text-on-surface">{prospects.length}</span> hasil</span>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="font-display-title text-display-title text-on-surface">{formMode === 'create' ? 'Buat Prospek Baru' : 'Edit Prospek'}</h2>
            <p className="font-body-main text-secondary text-sm">Lengkapi informasi dasar prospek di bawah ini.</p>
          </div>

          <form onSubmit={handleSubmitReview} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-8 space-y-6 bg-white border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="font-heading-section text-heading-section text-primary border-b border-border pb-3 flex items-center gap-2 text-sm sm:text-base">
                <span className="material-symbols-outlined">assignment</span>
                Informasi Prospek Utama
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Nama Prospek *</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} required className="px-4 py-2.5 sm:py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full" placeholder="Contoh: Modernization of Data Center - Jakarta" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Customer *</label>
                  <select value={formCustomerId} onChange={e => setFormCustomerId(e.target.value)} className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">-- Pilih Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Kategori Proyek *</label>
                  <select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)} className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Cabang *</label>
                  <select value={formBranchId} onChange={e => setFormBranchId(e.target.value)} className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Estimasi Nilai Proyek (Rp)</label>
                    <input value={formValue} onChange={e => setFormValue(e.target.value)} className="px-4 py-2.5 sm:py-2 border border-border rounded-lg font-mono w-full outline-none focus:ring-2 focus:ring-primary" placeholder="Contoh: 1500000000" type="number" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Estimasi Tanggal Closing</label>
                    <input value={formDate} onChange={e => setFormDate(e.target.value)} className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary" type="date" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Deskripsi</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Keterangan singkat mengenai kebutuhan proyek..." />
                </div>
              </div>
            </div>

            <div className="col-span-12 flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-surface-container-low border border-border p-4 rounded-xl mt-4 gap-3">
              <button type="button" onClick={() => setFormMode('list')} className="px-6 py-2.5 bg-white border border-border text-on-surface font-label-sm rounded-lg hover:bg-surface-container-low transition-all touch-min-h">Kembali ke Daftar</button>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={handleSaveDraft} className="px-6 py-2.5 bg-white border border-border text-primary font-bold rounded-lg hover:bg-surface-container-low transition-all font-semibold touch-min-h">Simpan Draft</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 font-semibold touch-min-h">Kirim ke Review<span className="material-symbols-outlined text-[18px]">send</span></button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
