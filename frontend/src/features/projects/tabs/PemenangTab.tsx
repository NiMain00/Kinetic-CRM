import { useState } from 'react';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
import { formatCurrency, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function PemenangTab({ project: propProject }: TabProps) {
  const project = propProject || INITIAL_PROJECTS[0];
  const [outcome, setOutcome] = useState<'menang' | 'kalah' | null>(null);
  const [finalContractValue, setFinalContractValue] = useState('1250000000');
  const [durationDays, setDurationDays] = useState('180');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [failureReason, setFailureReason] = useState('');
  const [loseNote, setLoseNote] = useState('');

  const handleApply = () => {
    if (!outcome) { toast.error('Pilih hasil tender terlebih dahulu'); return; }
    toast.success(
      `Hasil tender berhasil terkonfirmasi dan diselesaikan sebagai proyek ${outcome === 'menang' ? 'MENANG' : 'KALAH'}!`,
      { icon: outcome === 'menang' ? '' : '' }
    );
  };

  const handleSaveDraft = () => {
    toast.success('Draf hasil tender berhasil disimpan');
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-6 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">gavel</span>
            Penentuan Hasil Tender
          </h3>
          <div className="space-y-6">
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-3 block">Hasil Tender</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOutcome('menang')}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all group relative overflow-hidden ${
                    outcome === 'menang' ? 'border-success bg-success/5 text-success' : 'border-border hover:border-success/50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${outcome === 'menang' ? 'text-success' : 'text-outline-variant group-hover:text-success'}`}>
                      emoji_events
                    </span>
                    <span className={`font-bold text-xs ${outcome === 'menang' ? 'text-success' : 'text-secondary'}`}>PROYEK MENANG</span>
                  </div>
                  {outcome === 'menang' && (
                    <div className="absolute top-2 right-2 text-success">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('kalah')}
                  className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all group relative overflow-hidden ${
                    outcome === 'kalah' ? 'border-danger bg-danger/5 text-danger' : 'border-border hover:border-danger/50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${outcome === 'kalah' ? 'text-danger' : 'text-outline-variant group-hover:text-danger'}`}>
                      sentiment_very_dissatisfied
                    </span>
                    <span className={`font-bold text-xs ${outcome === 'kalah' ? 'text-danger' : 'text-secondary'}`}>PROYEK KALAH</span>
                  </div>
                  {outcome === 'kalah' && (
                    <div className="absolute top-2 right-2 text-danger">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-info">
              <p className="text-xs text-on-surface-variant italic">
                "Pastikan status pemenang telah sesuai dengan surat pengumuman resmi dari pihak pemberi kerja sebelum melakukan konfirmasi data."
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7">
          {outcome === 'menang' ? (
            <div className="bg-white rounded-xl border border-border shadow-sm p-6 h-full">
              <h3 className="font-heading-section text-base font-bold text-success mb-6 flex items-center">
                <span className="material-symbols-outlined mr-2">verified</span>
                Detail Kontrak Pemenang
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nilai Kontrak Akhir (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">Rp</span>
                      <input
                        value={finalContractValue}
                        onChange={e => setFinalContractValue(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                        type="text"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Mulai Proyek</label>
                    <input
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                      type="date"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Durasi (Hari Kalender)</label>
                    <input
                      value={durationDays}
                      onChange={e => setDurationDays(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                      placeholder="Contoh: 180"
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Dokumen SPK / Kontrak</label>
                  <div
                    onClick={() => toast.success('Sistem unggah dokumen kontrak disimulasikan.')}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                    <p className="text-sm font-semibold text-secondary">Seret file ke sini atau <span className="text-primary underline">klik untuk unggah</span></p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, ZIP (Maks. 25MB)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : outcome === 'kalah' ? (
            <div className="bg-white rounded-xl border border-border shadow-sm p-6 h-full">
              <h3 className="font-heading-section text-base font-bold text-danger mb-6 flex items-center">
                <span className="material-symbols-outlined mr-2">report</span>
                Analisa Kekalahan Tender
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Alasan Kekalahan</label>
                  <select
                    value={failureReason}
                    onChange={e => setFailureReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-danger focus:outline-none text-xs bg-white text-slate-800"
                  >
                    <option value="">Pilih Alasan Utama...</option>
                    <option value="harga">Harga Penawaran Terlalu Tinggi</option>
                    <option value="teknis">Skor Teknis Dibawah Ambang Batas</option>
                    <option value="admin">Ketidaklengkapan Administrasi</option>
                    <option value="pesaing">Kompetitor Memiliki Pengalaman Spesifik</option>
                    <option value="internal">Pembatalan Tender oleh Owner</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Kekalahan</label>
                  <textarea
                    value={loseNote}
                    onChange={e => setLoseNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-danger focus:outline-none text-xs resize-none text-slate-800"
                    placeholder="Berikan detail tambahan mengenai penyebab kekalahan atau poin-poin yang perlu diperbaiki untuk tender mendatang..."
                    rows={6}
                  />
                </div>
                <div className="flex items-center p-3 bg-danger/5 rounded-lg border border-danger/10">
                  <span className="material-symbols-outlined text-danger mr-3">info</span>
                  <p className="text-xs text-danger">Data ini akan digunakan untuk laporan efektivitas tender di akhir kuartal.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">pending_actions</span>
              <h4 className="font-heading-section text-base font-bold text-slate-500">Hasil Tender Belum Dipilih</h4>
              <p className="text-on-surface-variant max-w-sm mt-2 text-xs text-slate-400">Pilih hasil tender di sisi kiri untuk melengkapi data penutupan proyek.</p>
            </div>
          )}
        </section>
      </div>

      {outcome && (
        <div className="flex justify-end gap-3 border-t pt-6 border-border">
          <Button variant="secondary" onClick={handleSaveDraft} leftIcon={<span className="material-symbols-outlined text-[18px]">drafts</span>}>
            Simpan Draft
          </Button>
          <Button onClick={handleApply} rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>
            Konfirmasi & Selesaikan
          </Button>
        </div>
      )}
    </div>
  );
}
