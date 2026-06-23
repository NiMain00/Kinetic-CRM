import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { Prospect } from '../../types/domain';
import { INITIAL_PROSPECTS } from '../../services/mock-data';

interface ProspectsViewProps {
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage: (page: string) => void;
}

export default function ProspectsView({ onShowNotification, onNavigatePage }: ProspectsViewProps) {
  const isMobile = useIsMobile();
  const [prospects, setProspects] = useState<Prospect[]>(INITIAL_PROSPECTS);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Prospecting' | 'Waiting PM' | 'Revision' | 'Approved'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({
    upsCapacity: 'UPS 2x3KVA',
    isFiberOpticReady: 'Ya, Terjadwal',
    groundingCableOption: 'Wajib menggunakan grounding tersendiri',
  });

  const handleCreateNew = () => {
    setFormName('');
    setFormClient('PT. Telkom Indonesia Tbk.');
    setFormValue('1500000000');
    setFormDate('2026-07-20');
    setFormDesc('');
    setFormMode('create');
  };

  const handleEdit = (p: Prospect) => {
    setSelectedProspect(p);
    setFormName(p.name);
    setFormClient(p.client);
    setFormValue(p.estimatedValue ? String(p.estimatedValue) : '');
    setFormDate(p.date || '');
    setFormDesc(p.description || '');
    setFormMode('edit');
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      onShowNotification('Nama Prospek harus diisi!', 'error');
      return;
    }
    const newProspect: Prospect = {
      id: formMode === 'edit' && selectedProspect ? selectedProspect.id : String(prospects.length + 1),
      name: formName,
      client: formClient,
      status: 'Prospecting',
      author: 'Ahmad Faisal',
      date: formDate || 'Jun 19, 2026',
      estimatedValue: Number(formValue) || 0,
      description: formDesc,
    };

    if (formMode === 'edit' && selectedProspect) {
      setProspects(prospects.map(p => p.id === selectedProspect.id ? newProspect : p));
    } else {
      setProspects([newProspect, ...prospects]);
    }

    onShowNotification('Draf prospek berhasil disimpan.', 'success');
    setFormMode('list');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      onShowNotification('Nama Prospek wajib diisi.', 'error');
      return;
    }
    const newProspect: Prospect = {
      id: formMode === 'edit' && selectedProspect ? selectedProspect.id : String(prospects.length + 1),
      name: formName,
      client: formClient,
      status: 'Waiting PM',
      author: 'Ahmad Faisal',
      date: formDate || 'Jun 19, 2026',
      estimatedValue: Number(formValue) || 0,
      description: formDesc,
    };

    if (formMode === 'edit' && selectedProspect) {
      setProspects(prospects.map(p => p.id === selectedProspect.id ? newProspect : p));
    } else {
      setProspects([newProspect, ...prospects]);
    }

    onShowNotification('Prospek berhasil diajukan ke PM untuk review.', 'success');
    setFormMode('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus prospek ini dari draf?')) {
      setProspects(prospects.filter(p => p.id !== id));
      onShowNotification('Prospek berhasil dihapus.', 'success');
    }
  };

  // Filter prospects
  const filteredProspects = prospects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeFilter === 'All' || p.status === activeFilter;
    return matchesSearch && matchesTab;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'Prospecting': return 'bg-info/10 text-info';
      case 'Waiting PM': return 'bg-warning/10 text-warning';
      case 'Revision': return 'bg-status-orange/10 text-status-orange';
      default: return 'bg-success/10 text-success';
    }
  };

  return (
    <div className={`${isMobile ? 'p-2' : 'p-1'} space-y-4 sm:space-y-8 flex-1 overflow-y-auto`}>
      {formMode === 'list' ? (
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
            <button
              onClick={handleCreateNew}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-sm text-sm flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all font-semibold touch-min-h"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Buat Prospek Baru
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-border overflow-x-auto w-full sm:w-auto">
                {['All', 'Prospecting', 'Waiting PM', 'Revision', 'Approved'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab as any)}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-label-sm whitespace-nowrap transition-colors touch-min-h ${
                      activeFilter === tab
                        ? 'bg-white text-primary shadow-sm border border-border font-bold'
                        : 'text-secondary hover:bg-surface-container-high'
                    }`}
                  >
                    {tab === 'All' ? 'Semua' : tab === 'Waiting PM' ? 'Waiting PM' : tab}
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
                          <div className="font-label-sm text-on-surface font-medium text-sm">{row.name}</div>
                          {row.description && (
                            <p className="text-xs text-secondary truncate">{row.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(row.status)}`}>
                          {row.status}
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
                          <button
                            onClick={() => handleEdit(row)}
                            className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                            title="Edit Prospek"
                            aria-label="Edit"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all"
                            title="Hapus Prospek"
                            aria-label="Delete"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
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
                            <div className="font-label-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer font-medium">
                              {row.name}
                            </div>
                            {row.description && (
                              <p className="text-xs text-secondary truncate max-w-md">{row.description}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-secondary">{row.client}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(row.status)}`}>
                              {row.status}
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
                              <button
                                onClick={() => handleEdit(row)}
                                className="touch-min flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
                                title="Edit Prospek"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="touch-min flex items-center justify-center text-outline hover:text-danger hover:bg-error-container/20 rounded-lg transition-all"
                                title="Hapus Prospek"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
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
        </>
      ) : (
        /* Create/Edit Form View */
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="font-display-title text-display-title text-on-surface">
              {formMode === 'create' ? 'Buat Prospek Baru' : 'Edit Prospek'}
            </h2>
            <p className="font-body-main text-secondary text-sm">
              Lengkapi informasi dasar prospek dan kuesioner kelayakan teknis di bawah ini.
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left side: Basic info */}
            <div className="lg:col-span-6 space-y-6 bg-white border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="font-heading-section text-heading-section text-primary border-b border-border pb-3 flex items-center gap-2 text-sm sm:text-base">
                <span className="material-symbols-outlined">assignment</span>
                Informasi Prospek Utama
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Nama Prospek *</label>
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    className="px-4 py-2.5 sm:py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full"
                    placeholder="Contoh: Modernization of Data Center - Jakarta"
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Customer / Client *</label>
                  <select
                    value={formClient}
                    onChange={e => setFormClient(e.target.value)}
                    className="px-4 py-2.5 sm:py-2 border border-border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>PT. Telkom Indonesia Tbk.</option>
                    <option>PT. Telekom Nusantara</option>
                    <option>Energi Bangsa Corp</option>
                    <option>Secure City Group</option>
                    <option>Bank Artha Graha</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Estimasi Nilai Proyek (Rp)</label>
                  <input
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    className="px-4 py-2.5 sm:py-2 border border-border rounded-lg font-mono w-full outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Contoh: 1500000000"
                    type="number"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Estimasi Tanggal Closing</label>
                  <input
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary"
                    type="date"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">Deskripsi</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    rows={4}
                    className="px-4 py-2.5 sm:py-2 border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Keterangan singkat mengenai kebutuhan proyek..."
                  />
                </div>
              </div>
            </div>

            {/* Right side: Questions checklist */}
            <div className="lg:col-span-6 space-y-6 bg-white border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="font-heading-section text-heading-section text-status-teal border-b border-border pb-3 flex items-center gap-2 text-sm sm:text-base">
                <span className="material-symbols-outlined">quiz</span>
                Evaluasi &amp; Ketentuan Teknis
              </h3>

              <div className="space-y-6">
                <div className="p-3 sm:p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-2">
                  <p className="font-label-sm text-on-surface font-semibold text-sm">
                    1. Apakah sudah ada kepastian spesifikasi UPS di lokasi Cabang?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm touch-min-h">
                      <input
                        type="radio"
                        name="upsCapacity"
                        value="UPS 2x3KVA"
                        checked={answers.upsCapacity === 'UPS 2x3KVA'}
                        onChange={e => setAnswers({...answers, upsCapacity: e.target.value})}
                        className="text-primary focus:ring-primary h-4 w-4 border-outline"
                      />
                      UPS 2x3KVA Standar
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm touch-min-h">
                      <input
                        type="radio"
                        name="upsCapacity"
                        value="UPS Lainnya / Belum Ada"
                        checked={answers.upsCapacity === 'UPS Lainnya / Belum Ada'}
                        onChange={e => setAnswers({...answers, upsCapacity: e.target.value})}
                        className="text-primary focus:ring-primary h-4 w-4 border-outline"
                      />
                      UPS Lainnya / Belum Ada
                    </label>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-2">
                  <p className="font-label-sm text-on-surface font-semibold text-sm">
                    2. Apakah sudah ada jalur FO (Fiber Optic) aktif dari ISP di gedung tersebut?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm touch-min-h">
                      <input
                        type="radio"
                        name="isFiberOpticReady"
                        value="Ya, Terjadwal"
                        checked={answers.isFiberOpticReady === 'Ya, Terjadwal'}
                        onChange={e => setAnswers({...answers, isFiberOpticReady: e.target.value})}
                        className="text-primary focus:ring-primary h-4 w-4 border-outline"
                      />
                      Ya, Terjadwal / Siap
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm touch-min-h">
                      <input
                        type="radio"
                        name="isFiberOpticReady"
                        value="Tidak / Belum Ada"
                        checked={answers.isFiberOpticReady === 'Tidak / Belum Ada'}
                        onChange={e => setAnswers({...answers, isFiberOpticReady: e.target.value})}
                        className="text-primary focus:ring-primary h-4 w-4 border-outline"
                      />
                      Tidak / Belum Ada
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-sm text-sm text-on-surface-variant font-semibold">
                    3. Kebutuhan Proteksi Kelistrikan Ruang Server
                  </label>
                  <input
                    value={answers.groundingCableOption}
                    onChange={e => setAnswers({...answers, groundingCableOption: e.target.value})}
                    placeholder="Contoh: Wajib menggunakan grounding tersendiri"
                    className="w-full px-4 py-2.5 sm:py-2 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    type="text"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="col-span-12 flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-surface-container-low border border-border p-4 rounded-xl mt-4 gap-3">
              <button
                type="button"
                onClick={() => setFormMode('list')}
                className="px-6 py-2.5 bg-white border border-border text-on-surface font-label-sm rounded-lg hover:bg-surface-container-low transition-all touch-min-h"
              >
                Kembali ke Daftar
              </button>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 bg-white border border-border text-primary font-bold rounded-lg hover:bg-surface-container-low transition-all font-semibold touch-min-h"
                >
                  Simpan Draft
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 font-semibold touch-min-h"
                >
                  Kirim ke Review
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
