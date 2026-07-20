import { useState } from 'react';
import type { Project, TimelineEvent, DocGroup, DocumentEntry } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { formatDate } from '@/utils/formatters';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const eventIcons: Record<TimelineEvent['type'], string> = {
  approve: 'verified',
  submit: 'send',
  revision: 'currency_exchange',
  upload: 'cloud_upload',
  status_change: 'published_with_changes',
  comment: 'chat',
};

const eventColors: Record<TimelineEvent['type'], { bg: string; border: string; text: string; dot: string }> = {
  approve: { bg: 'bg-success-container dark:bg-emerald-950/30', border: 'border-emerald-500', text: 'text-success dark:text-emerald-400', dot: 'bg-success-container dark:bg-emerald-950/30' },
  submit: { bg: 'bg-info-container dark:bg-blue-950/30', border: 'border-blue-500', text: 'text-info dark:text-blue-400', dot: 'bg-info-container dark:bg-blue-950/30' },
  revision: { bg: 'bg-danger-container dark:bg-rose-950/30', border: 'border-rose-500', text: 'text-danger dark:text-rose-400', dot: 'bg-danger-container dark:bg-rose-950/30' },
  upload: { bg: 'bg-status-indigo/10 dark:bg-indigo-950/30', border: 'border-indigo-500', text: 'text-status-indigo dark:text-indigo-400', dot: 'bg-status-indigo/10 dark:bg-indigo-950/30' },
  status_change: { bg: 'bg-warning-container dark:bg-amber-950/30', border: 'border-amber-500', text: 'text-warning dark:text-amber-400', dot: 'bg-warning-container dark:bg-amber-950/30' },
  comment: { bg: 'bg-status-purple/10 dark:bg-purple-950/30', border: 'border-purple-500', text: 'text-status-purple dark:text-purple-400', dot: 'bg-status-purple/10 dark:bg-purple-950/30' },
};

const typeLabels: Record<TimelineEvent['type'], string> = {
  approve: 'Persetujuan',
  submit: 'Pengajuan',
  revision: 'Revisi',
  upload: 'Unggahan',
  status_change: 'Perubahan Status',
  comment: 'Komentar',
};

export default function TimelineTab({ project, onShowNotification }: TabProps) {
  const events = project?.timeline || [];
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);
  const updateProjectDocuments = useProjectStore((s) => s.updateProjectDocuments);
  const projectId = project?.id;

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'update-status' | 'dokumen'>('all');
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusTitle, setNewStatusTitle] = useState('');
  const [newStatusDesc, setNewStatusDesc] = useState('');

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const filteredEvents = activeSubTab === 'all'
    ? events
    : events.filter(e => e.type === (activeSubTab === 'update-status' ? 'status_change' : 'upload'));

  const handleAddStatusUpdate = () => {
    if (!projectId || !newStatusTitle) return;
    addTimelineEvent(projectId, {
      id: `evt-${Date.now()}`,
      title: newStatusTitle,
      actor: project?.author || 'System',
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'status_change',
      description: newStatusDesc || undefined,
    });
    setNewStatusTitle('');
    setNewStatusDesc('');
    setShowAddStatus(false);
    onShowNotification?.('Update status berhasil ditambahkan.', 'success');
  };

  const handleUploadDoc = () => {
    if (!projectId || !uploadFileName) return;
    const newDoc: DocumentEntry = {
      id: `doc-${Date.now()}`,
      name: uploadFileName,
      size: '0 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploader: project?.author || 'System',
      version: 'v1.0',
      icon: 'description',
      iconColor: 'text-primary',
    };
    const docGroups: DocGroup[] = project?.documents?.length
      ? project.documents
      : [
          { key: 'RKS', label: 'Rencana Kerja & Syarat-Syarat', icon: 'RKS', color: 'bg-primary/10 text-primary', documents: [] },
          { key: 'LPHS', label: 'Laporan Penilaian Harga Satuan', icon: 'LPHS', color: 'bg-status-teal/10 dark:bg-teal-950/30 text-status-teal dark:text-teal-400', documents: [] },
          { key: 'SIOS', label: 'Surat Instruksi Operasional Site', icon: 'SIOS', color: 'bg-status-purple/10 dark:bg-purple-950/30 text-status-purple dark:text-purple-400', documents: [] },
          { key: 'Harga', label: 'Dokumen Penawaran Harga Final', icon: 'HRG', color: 'bg-warning-container dark:bg-amber-950/30 text-warning dark:text-amber-400', documents: [] },
          { key: 'MISC', label: 'Dokumen Lampiran & Foto Lapangan', icon: 'MISC', color: 'bg-info-container dark:bg-sky-950/30 text-info dark:text-sky-400', documents: [] },
        ];
    const updated = docGroups.map(g =>
      g.key === 'MISC' ? { ...g, documents: [...g.documents, newDoc] } : g
    );
    updateProjectDocuments(projectId, updated);
    addTimelineEvent(projectId, {
      id: `evt-${Date.now()}`,
      title: `Dokumen Diunggah: ${uploadFileName}`,
      actor: project?.author || 'System',
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'upload',
      fileName: uploadFileName,
      fileSize: '0 MB',
    });
    setUploadFileName('');
    setShowUpload(false);
    onShowNotification?.('Dokumen berhasil diunggah.', 'success');
  };

  const subTabs = [
    { key: 'all' as const, label: 'Semua', icon: 'list' },
    { key: 'update-status' as const, label: 'Update Status', icon: 'published_with_changes' },
    { key: 'dokumen' as const, label: 'Dokumen', icon: 'description' },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading-section text-base font-bold text-on-surface flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary">history</span>
              Timeline Audit Trail Proyek
            </h3>
            <p className="text-secondary text-xs mt-1">Daftar lengkap riwayat aktivitas, pengunggahan dokumen, dan persetujuan sepanjang siklus proyek.</p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex gap-1 mt-4 bg-surface-container p-1 rounded-lg">
          {subTabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveSubTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                activeSubTab === t.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Sub-tab: Update Status - Action Bar */}
      {activeSubTab === 'update-status' && (
        <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-on-surface">Riwayat Perubahan Status</h4>
            <p className="text-[10px] text-outline">Catat perubahan status proyek secara manual.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddStatus(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Update Status
          </button>
        </div>
      )}

      {/* Sub-tab: Dokumen - Action Bar */}
      {activeSubTab === 'dokumen' && (
        <div className="bg-surface-container-lowest border border-border rounded-xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-on-surface">Riwayat Unggahan Dokumen</h4>
            <p className="text-[10px] text-outline">Daftar dokumen yang pernah diunggah ke proyek ini.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
            Unggah Dokumen
          </button>
        </div>
      )}

      {/* Add Status Modal */}
      {showAddStatus && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">published_with_changes</span>
                Tambah Update Status
              </h4>
              <button type="button" onClick={() => setShowAddStatus(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Judul Status *</label>
                <input
                  value={newStatusTitle}
                  onChange={e => setNewStatusTitle(e.target.value)}
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface"
                  placeholder="Contoh: Proyek memasuki tahap Review RKS"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Deskripsi</label>
                <textarea
                  value={newStatusDesc}
                  onChange={e => setNewStatusDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface resize-none"
                  placeholder="Penjelasan tambahan (opsional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 flex-wrap mt-6 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowAddStatus(false)}>Batal</Button>
              <Button onClick={handleAddStatusUpdate} disabled={!newStatusTitle}>Simpan</Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dokumen Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">cloud_upload</span>
                Unggah Dokumen
              </h4>
              <button type="button" onClick={() => setShowUpload(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Nama Dokumen *</label>
                <input
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface"
                  placeholder="Contoh: Dokumen Pendukung Tahap II"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1 block">File Ungguhan</label>
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-surface-container-low cursor-pointer">
                  <span className="material-symbols-outlined text-4xl text-primary/40 mb-2">cloud_upload</span>
                  <p className="text-xs font-semibold text-secondary">Klik untuk pilih berkas komputer</p>
                  <p className="text-[10px] text-outline mt-1">PDF, DOCX, XLSX (Maks 50MB)</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 flex-wrap mt-6 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowUpload(false)}>Batal</Button>
              <Button onClick={handleUploadDoc} disabled={!uploadFileName}>Upload</Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Events */}
      <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-[2px] before:bg-border before:z-0">
        <div className="relative z-10 flex items-center">
          <div className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
            Timeline Proyek {project?.code}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="relative z-10 text-center py-12 text-outline">
            <span className="material-symbols-outlined text-4xl">history</span>
            <p className="text-sm mt-2">Tidak ada {activeSubTab === 'update-status' ? 'update status' : activeSubTab === 'dokumen' ? 'unggahan dokumen' : 'event'} untuk ditampilkan</p>
          </div>
        )}

        {filteredEvents.map((event) => {
          const colors = eventColors[event.type];
          return (
            <div key={event.id} className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-1 flex justify-center lg:justify-start">
                <div className={`w-8 h-8 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center ${colors.text} shadow-sm shrink-0`}>
                  <span className="material-symbols-outlined text-[18px]">{eventIcons[event.type]}</span>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-11 bg-surface-container-lowest border border-border rounded-xl shadow-sm p-5 hover:shadow transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-on-surface text-sm">{event.title}</h4>
                      <Badge size="sm" variant={
                        event.type === 'approve' ? 'success' : event.type === 'status_change' ? 'warning' : event.type === 'upload' ? 'info' : event.type === 'revision' ? 'danger' : 'purple'
                      }>
                        {typeLabels[event.type]}
                      </Badge>
                    </div>
                    <p className="text-outline text-xs flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {event.actor} • {event.role}
                    </p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-outline font-medium">{event.time}</span>
                </div>

                {event.prevVal && event.newVal && event.type === 'revision' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mt-2 mb-3">
                    <div className="bg-surface-container-low p-3 rounded-lg border border-border flex flex-col">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-outline">Nilai Sebelumnya</span>
                      <span className="text-sm font-semibold text-secondary line-through">{event.prevVal}</span>
                    </div>
                    <div className="bg-danger-container dark:bg-rose-950/30 p-3 rounded-lg border border-danger/20 dark:border-rose-100 flex flex-col">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-danger dark:text-rose-400">Nilai Menjadi</span>
                      <span className="text-sm font-bold text-danger">{event.newVal}</span>
                    </div>
                  </div>
                )}

                {event.prevVal && event.newVal && event.type === 'status_change' && (
                  <div className="flex items-center gap-3 bg-warning-container dark:bg-amber-950/30 p-3 rounded-lg border border-warning/20 dark:border-amber-800 w-fit mb-3">
                    <span className="text-xs font-semibold text-warning">{event.prevVal}</span>
                    <span className="material-symbols-outlined text-warning dark:text-amber-400 text-sm">arrow_forward</span>
                    <span className="text-xs font-semibold text-success bg-success-container dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-success/20 dark:border-emerald-200">{event.newVal}</span>
                  </div>
                )}

                {event.description && (
                  <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-lg border-l-4 border-primary mb-3">
                    {event.description}
                  </p>
                )}

                {event.fileName && (
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors w-full sm:w-2/3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-danger text-3xl">picture_as_pdf</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{event.fileName}</p>
                        {event.fileSize && <p className="text-[10px] text-outline">{event.fileSize}</p>}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[20px]">download</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
