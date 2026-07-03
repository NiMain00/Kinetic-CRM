import { useState, useEffect } from 'react';
import type { Project, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, Button, Input, Select, CurrencyInput } from '@/components/ui';
import { createProcurementFromProject } from '@/features/procurement/procurementService';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.zip'];

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function PemenangTab({ project, onShowNotification }: TabProps) {
  const updateProject = useProjectStore((s) => s.updateProject);
  const updateProjectWinner = useProjectStore((s) => s.updateProjectWinner);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);

  const [outcome, setOutcome] = useState<'menang' | 'kalah' | null>(project?.winnerDetails?.outcome || null);
  const [finalContractValue, setFinalContractValue] = useState<number | undefined>(project?.winnerDetails?.contractValue || project?.pricing?.value);
  const [durationDays, setDurationDays] = useState(String(project?.winnerDetails?.duration || ''));
  const [startDate, setStartDate] = useState(project?.winnerDetails?.startDate || '');
  const [failureReason, setFailureReason] = useState(project?.winnerDetails?.loseReason || '');
  const [loseNote, setLoseNote] = useState(project?.winnerDetails?.loseNote || '');
  const [spkDocument, setSpkDocument] = useState<{ name: string; size: string; time: string } | null>(project?.winnerDetails?.spkDocument || null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync when switching projects
  useEffect(() => {
    setOutcome(project?.winnerDetails?.outcome || null);
    setFinalContractValue(project?.winnerDetails?.contractValue || project?.pricing?.value);
    setDurationDays(String(project?.winnerDetails?.duration || ''));
    setStartDate(project?.winnerDetails?.startDate || '');
    setFailureReason(project?.winnerDetails?.loseReason || '');
    setLoseNote(project?.winnerDetails?.loseNote || '');
    setSpkDocument(project?.winnerDetails?.spkDocument || null);
  }, [project?.id]);

  const validateSpkFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Format file tidak didukung. Gunakan: PDF, DOCX, atau ZIP`;
    }
    if (file.size > 25 * 1024 * 1024) {
      return 'Ukuran file maksimal 25MB';
    }
    return null;
  };

  const handleUploadSpk = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.zip';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const error = validateSpkFile(file);
        if (error) {
          onShowNotification?.(error, 'error');
          return;
        }
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setSpkDocument({ name: file.name, size: `${sizeMB} MB`, time: 'Baru saja' });
      }
    };
    input.click();
  };

  const handleSpkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const error = validateSpkFile(file);
      if (error) {
        onShowNotification?.(error, 'error');
        return;
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setSpkDocument({ name: file.name, size: `${sizeMB} MB`, time: 'Baru saja' });
    }
  };

  const handleDeleteSpk = () => {
    setSpkDocument(null);
  };

  const handleSaveDraft = () => {
    if (!project?.id) return;
    updateProjectWinner(project.id, {
      outcome,
      contractValue: outcome === 'menang' ? (finalContractValue ?? 0) : undefined,
      startDate: outcome === 'menang' ? startDate : undefined,
      duration: outcome === 'menang' ? Number(durationDays) : undefined,
      loseReason: outcome === 'kalah' ? failureReason : undefined,
      loseNote: outcome === 'kalah' ? loseNote : undefined,
      spkDocument: outcome === 'menang' ? spkDocument : null,
    });
    onShowNotification?.('Draf hasil tender berhasil disimpan', 'success');
  };

  const handleApply = () => {
    if (!project?.id) return;
    if (!outcome) {
      onShowNotification?.('Pilih hasil tender terlebih dahulu', 'error');
      return;
    }
    if (outcome === 'menang' && !spkDocument) {
      onShowNotification?.('Unggah dokumen SPK/Kontrak terlebih dahulu', 'error');
      return;
    }
    // Persist winner details
    updateProjectWinner(project.id, {
      outcome,
      contractValue: outcome === 'menang' ? (finalContractValue ?? 0) : undefined,
      startDate: outcome === 'menang' ? startDate : undefined,
      duration: outcome === 'menang' ? Number(durationDays) : undefined,
      loseReason: outcome === 'kalah' ? failureReason : undefined,
      loseNote: outcome === 'kalah' ? loseNote : undefined,
      spkDocument: outcome === 'menang' ? spkDocument : null,
    });

    // Add timeline event
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: outcome === 'menang' ? 'Proyek Menang Tender' : 'Proyek Kalah Tender',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: outcome === 'menang' ? 'approve' : 'revision',
      description: outcome === 'menang'
        ? `Nilai kontrak final Rp ${(finalContractValue ?? 0).toLocaleString('id-ID')}`
        : `Alasan: ${failureReason}`,
    };
    addTimelineEvent(project.id, event);

    // Advance status
    if (outcome === 'menang') {
      // Auto-create procurement record for the winning project
      createProcurementFromProject(project);
      updateProject(project.id, { status: 'Selesai', phase: 'Selesai' });
    } else {
      updateProject(project.id, { status: 'Kalah', phase: 'Selesai' });
    }

    onShowNotification?.(
      `Hasil tender berhasil terkonfirmasi sebagai ${outcome === 'menang' ? 'MENANG' : 'KALAH'}!`,
      'success'
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-6 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">gavel</span>
            Penentuan Hasil Tender
          </h3>
          <div className="space-y-6">
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-3 block">Hasil Tender</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-info">
              <p className="text-xs text-on-surface-variant italic">
                "Pastikan status pemenang telah sesuai dengan surat pengumuman resmi dari pihak pemberi kerja sebelum melakukan konfirmasi data."
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7">
          {outcome === 'menang' ? (
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 h-full">
              <h3 className="font-heading-section text-base font-bold text-success mb-6 flex items-center">
                <span className="material-symbols-outlined mr-2">verified</span>
                Detail Kontrak Pemenang
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="col-span-2">
                    <CurrencyInput
                      label="Nilai Kontrak Akhir"
                      value={finalContractValue}
                      onChange={setFinalContractValue}
                      placeholder="Rp 0"
                    />
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
                  {spkDocument ? (
                    <div className="border border-border rounded-xl p-4 bg-surface-container-low">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">description</span>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{spkDocument.name}</p>
                            <p className="text-xs text-outline">{spkDocument.size} &middot; {spkDocument.time}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDeleteSpk}
                          className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleUploadSpk}
                      onDrop={handleSpkDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${
                        isDragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-4xl transition-colors mb-2 ${isDragOver ? 'text-primary' : 'text-outline group-hover:text-primary'}`}>cloud_upload</span>
                      <p className="text-sm font-semibold text-secondary">Seret file ke sini atau <span className="text-primary underline">klik untuk unggah</span></p>
                      <p className="text-xs text-outline mt-1">PDF, DOCX, ZIP (Maks. 25MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : outcome === 'kalah' ? (
            <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 h-full">
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
                    className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-danger focus:outline-none text-xs bg-surface-container-lowest text-on-surface"
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
                    className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-danger focus:outline-none text-xs resize-none text-on-surface"
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
            <div className="bg-surface-container-low rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">pending_actions</span>
              <h4 className="font-heading-section text-base font-bold text-secondary">Hasil Tender Belum Dipilih</h4>
              <p className="text-on-surface-variant max-w-sm mt-2 text-xs text-outline">Pilih hasil tender di sisi kiri untuk melengkapi data penutupan proyek.</p>
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
