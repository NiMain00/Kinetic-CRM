import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProspectStore } from '@/stores/prospectStore';
import { INITIAL_TIMELINE_EVENTS } from '@/services/mock-data';
import type { Prospect } from '@/types/domain';

const defaultAnswers: Record<string, string> = {
  upsCapacity: 'UPS 2x3KVA',
  isFiberOpticReady: 'Ya, Terjadwal',
  groundingCableOption: 'Wajib menggunakan grounding tersendiri',
  jenisPengadaan: 'Ya',
  detailKebutuhanUnit: 'Membutuhkan 10 unit UPS 3KVA',
};

const questionnaireLabels: Record<string, string> = {
  upsCapacity: 'Spesifikasi UPS di lokasi Cabang',
  isFiberOpticReady: 'Jalur FO (Fiber Optic) aktif dari ISP',
  groundingCableOption: 'Kebutuhan Proteksi Kelistrikan Ruang Server',
  jenisPengadaan: 'Apakah jenis pengadaan customer beli putus?',
  detailKebutuhanUnit: 'Detail kebutuhan pengadaan unit',
};

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getProspect = useProspectStore((s) => s.getProspect);
  const updateProspectInStore = useProspectStore((s) => s.updateProspect);
  const deleteProspectFromStore = useProspectStore((s) => s.deleteProspect);
  const [prospect, setProspect] = useState<Prospect | undefined>(
    () => getProspect(id!),
  );
  const [events] = useState(INITIAL_TIMELINE_EVENTS);

  if (!prospect) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-6xl text-outline">search_off</span>
          <h2 className="text-xl font-bold text-on-surface">Prospek Tidak Ditemukan</h2>
          <p className="text-secondary text-sm">Prospek dengan ID {id} tidak tersedia.</p>
          <button onClick={() => navigate('/prospects')} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:brightness-110 transition-all">
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  const isNonPotensial = prospect.status === 'Non Potensial' || prospect.prospectType === 'non_potensial';
  const isPotensial = prospect.status === 'Potensial' || prospect.prospectType === 'potensial';
  const needsVerification = prospect.customerData?.needsVerification;

  const statusBadge = (status: string) => {
    if (needsVerification) {
      return 'bg-amber-100 text-amber-700';
    }
    const map: Record<string, string> = {
      'Non Potensial': 'bg-slate-200 text-slate-600',
      Potensial: 'bg-emerald-100 text-emerald-700',
      'Waiting PM': 'bg-warning/10 text-warning',
      Revision: 'bg-status-orange/10 text-status-orange',
      Approved: 'bg-success/10 text-success',
    };
    return map[status] || 'bg-secondary-container/50 text-on-secondary-container';
  };

  const statusLabel = () => {
    if (needsVerification) return 'Perlu Verifikasi';
    return prospect.status;
  };

  const actionIcon = (type: string) => {
    const map: Record<string, string> = {
      approve: 'check_circle',
      submit: 'send',
      revision: 'edit_note',
      upload: 'upload_file',
      status_change: 'swap_horiz',
      comment: 'chat',
    };
    return map[type] || 'circle';
  };

  const actionColor = (type: string) => {
    const map: Record<string, string> = {
      approve: 'text-success',
      submit: 'text-primary',
      revision: 'text-warning',
      upload: 'text-status-purple',
      status_change: 'text-info',
      comment: 'text-secondary',
    };
    return map[type] || 'text-secondary';
  };

  const handleApprove = () => {
    setProspect({ ...prospect, status: 'Approved' });
    toast.success('Prospek berhasil disetujui.');
  };

  const handleRequestRevision = () => {
    setProspect({ ...prospect, status: 'Revision' });
    toast.success('Permintaan revisi telah dikirim.');
  };

  const handleDelete = () => {
    if (prospect) {
      deleteProspectFromStore(prospect.id);
    }
    toast.success('Prospek berhasil dihapus.');
    navigate('/prospects');
  };

  const handleBuatProyek = () => {
    toast.success('Fitur konversi prospek ke proyek akan segera tersedia.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/prospects')} className="hover:text-primary transition-colors">Prospek</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold truncate max-w-[200px]">{prospect.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-extrabold text-on-surface">{prospect.name}</h1>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(prospect.status)}`}>
                  {statusLabel()}
                </span>
                {/* Badge "Perlu Verifikasi" untuk new customer (Fase 3 item 3) */}
                {needsVerification && (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300">
                    Perlu Verifikasi
                  </span>
                )}
              </div>
              <p className="text-sm text-secondary">{prospect.client}</p>
              <div className="flex items-center gap-4 text-xs text-outline mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {prospect.author}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {prospect.date}
                </span>
                {prospect.estimatedValue && (
                  <span className="flex items-center gap-1 font-mono font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    Rp {prospect.estimatedValue.toLocaleString('id-ID')}
                  </span>
                )}
                {prospect.branch && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">business</span>
                    {prospect.branch}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => navigate(`/prospects/${prospect.id}/edit`)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              {/* Kondisional tombol (Fase 3 item 2) */}
              {isPotensial && (
                <button onClick={handleBuatProyek} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">add_business</span>
                  Buat Proyek
                </button>
              )}
              <button onClick={handleApprove} className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5" aria-label="Setujui prospek">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Setujui
              </button>
              <button onClick={handleRequestRevision} className="px-4 py-2 bg-warning text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5" aria-label="Minta revisi">
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                Revisi
              </button>
              <button onClick={handleDelete} className="px-4 py-2 border border-danger text-danger rounded-lg text-sm font-semibold hover:bg-danger/5 transition-all flex items-center gap-1.5" aria-label="Hapus prospek">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Detail */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overview Section (Fase 3 item 1) */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">overview</span>
                Overview Prospek
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-secondary">Potensi Penambahan Unit</p>
                  <p className="font-semibold text-on-surface">{prospect.potensiUnit} unit</p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Tipe Prospek</p>
                  <p className="font-semibold text-on-surface">
                    {isNonPotensial ? 'Non Potensial' : isPotensial ? 'Potensial' : prospect.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Customer</p>
                  <p className="font-semibold text-on-surface">{prospect.client}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Cabang</p>
                  <p className="font-semibold text-on-surface">{prospect.branch || '-'}</p>
                </div>
              </div>
            </div>

            {/* Customer Info Card (Fase 3 item 4) */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">business</span>
                Informasi Customer
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-secondary">Nama Customer</p>
                  <p className="font-semibold text-on-surface">{prospect.client}</p>
                </div>
                {prospect.customerData && (
                  <>
                    <div>
                      <p className="text-xs text-secondary">Kode</p>
                      <p className="font-semibold text-on-surface">{prospect.customerData.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Tipe</p>
                      <p className="font-semibold text-on-surface capitalize">{prospect.customerData.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Kota</p>
                      <p className="font-semibold text-on-surface">{prospect.customerData.city}</p>
                    </div>
                    {prospect.customerData.npwp && (
                      <div>
                        <p className="text-xs text-secondary">NPWP</p>
                        <p className="font-semibold text-on-surface">{prospect.customerData.npwp}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="col-span-2 border-t border-border pt-3 mt-1">
                  <p className="text-xs text-secondary mb-1">PIC Customer</p>
                  <div className="bg-surface-container-low p-3 rounded-lg space-y-1">
                    <p className="font-medium text-on-surface">
                      {prospect.customerData?.picName || '-'}
                    </p>
                    <p className="text-xs text-secondary">{prospect.customerData?.picPosition || '-'}</p>
                    <p className="text-xs text-secondary">{prospect.customerData?.picPhone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                Deskripsi
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                {prospect.description || 'Tidak ada deskripsi.'}
              </p>
            </div>

            {/* Dynamic Questionnaire Answers */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
                Jawaban Pertanyaan Standar
              </h3>
              <div className="space-y-4">
                {(prospect.answers || defaultAnswers) && Object.entries(prospect.answers || defaultAnswers).map(([key, value]) => (
                  <div key={key} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                    <p className="text-xs text-outline font-semibold mb-1">{questionnaireLabels[key] || key}</p>
                    <p className="text-sm font-semibold text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Status Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
                Riwayat Status
              </h3>
              <div className="space-y-0">
                {events.map((event, idx) => (
                  <div key={event.id} className="relative pb-6 pl-8 last:pb-0">
                    {idx < events.length - 1 && (
                      <div className="absolute left-3.5 top-6 w-0.5 h-full bg-border" />
                    )}
                    <div className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center ${actionColor(event.type)} bg-white border-2 border-current`}>
                      <span className="material-symbols-outlined text-[14px]">{actionIcon(event.type)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{event.title}</p>
                      <p className="text-xs text-outline mt-0.5">{event.actor} · {event.role}</p>
                      {event.description && (
                        <p className="text-xs text-secondary mt-1 italic">{event.description}</p>
                      )}
                      {(event.prevVal || event.newVal) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          {event.prevVal && <span className="line-through text-outline">{event.prevVal}</span>}
                          {event.newVal && <span className="font-semibold text-on-surface">{event.newVal}</span>}
                        </div>
                      )}
                      {event.fileName && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                          <span className="material-symbols-outlined text-[14px]">attach_file</span>
                          {event.fileName} {event.fileSize && `(${event.fileSize})`}
                        </div>
                      )}
                      <p className="text-[10px] text-outline mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}