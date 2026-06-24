import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { prospectService } from '../../services/prospects';

const defaultAnswers: Record<string, string> = {
  upsCapacity: 'UPS 2x3KVA',
  isFiberOpticReady: 'Ya, Terjadwal',
  groundingCableOption: 'Wajib menggunakan grounding tersendiri',
};

const questionnaireLabels: Record<string, string> = {
  upsCapacity: 'Spesifikasi UPS di lokasi Cabang',
  isFiberOpticReady: 'Jalur FO (Fiber Optic) aktif dari ISP',
  groundingCableOption: 'Kebutuhan Proteksi Kelistrikan Ruang Server',
};

interface ProspectDetail {
  id: string;
  name: string;
  customer: { id: string; name: string; code: string };
  branch: { id: string; name: string };
  category: { id: string; name: string };
  creator: { id: string; name: string };
  status: string;
  description: string | null;
  estimatedValue: number | null;
  estimatedDate: string | null;
  createdAt: string;
  updatedAt: string;
  answers?: Record<string, string>;
}

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    prospectService.get(id)
      .then((res) => setProspect(res.data.data || res.data))
      .catch(() => toast.error('Gagal memuat detail prospek.'))
      .finally(() => setLoading(false));
  }, [id]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Prospecting: 'bg-info/10 text-info',
      'Waiting PM': 'bg-warning/10 text-warning',
      Revision: 'bg-status-orange/10 text-status-orange',
      Approved: 'bg-success/10 text-success',
    };
    return map[status] || 'bg-secondary-container/50 text-on-secondary-container';
  };

  const handleApprove = async () => {
    if (!id || !prospect) return;
    try {
      await prospectService.update(id, { status: 'Approved' });
      setProspect({ ...prospect, status: 'Approved' });
      toast.success('Prospek berhasil disetujui.');
    } catch {
      toast.error('Gagal menyetujui prospek.');
    }
  };

  const handleRequestRevision = async () => {
    if (!id || !prospect) return;
    try {
      await prospectService.update(id, { status: 'Revision' });
      setProspect({ ...prospect, status: 'Revision' });
      toast.success('Permintaan revisi telah dikirim.');
    } catch {
      toast.error('Gagal meminta revisi.');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus prospek ini?')) return;
    try {
      await prospectService.delete(id);
      toast.success('Prospek berhasil dihapus.');
      navigate('/prospects');
    } catch {
      toast.error('Gagal menghapus prospek.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-secondary">Memuat data...</p>
      </div>
    );
  }

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

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-xs text-outline font-label-sm" aria-label="Breadcrumb">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => navigate('/prospects')} className="hover:text-primary transition-colors">Prospek</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold truncate max-w-[200px]">{prospect.name}</span>
        </nav>

        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-extrabold text-on-surface">{prospect.name}</h1>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(prospect.status)}`}>
                  {prospect.status}
                </span>
              </div>
              <p className="text-sm text-secondary">{prospect.customer?.name}</p>
              <div className="flex items-center gap-4 text-xs text-outline mt-2">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  {prospect.creator?.name}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {new Date(prospect.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {prospect.estimatedValue && (
                  <span className="flex items-center gap-1 font-mono font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    Rp {prospect.estimatedValue.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/prospects/${prospect.id}/edit`)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              <button onClick={handleApprove} className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Setujui
              </button>
              <button onClick={handleRequestRevision} className="px-4 py-2 bg-warning text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                Revisi
              </button>
              <button onClick={handleDelete} className="px-4 py-2 border border-danger text-danger rounded-lg text-sm font-semibold hover:bg-danger/5 transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                Deskripsi
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                {prospect.description || 'Tidak ada deskripsi.'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
                Jawaban Kuesioner Teknis
              </h3>
              <div className="space-y-4">
                {Object.entries(prospect.answers || defaultAnswers).map(([key, value]) => (
                  <div key={key} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                    <p className="text-xs text-outline font-semibold mb-1">{questionnaireLabels[key] || key}</p>
                    <p className="text-sm font-semibold text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
                Riwayat Status
              </h3>
              <p className="text-sm text-secondary">Riwayat status akan muncul setelah modul review selesai diintegrasikan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
