import { useState, useEffect } from 'react';
import type { Project, DocGroup, DocumentEntry } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { formatDate } from '@/utils/formatters';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

const defaultDocGroups: DocGroup[] = [
  { key: 'RKS', label: 'Rencana Kerja & Syarat-Syarat', icon: 'RKS', color: 'bg-primary/10 text-primary', documents: [] },
  { key: 'LPHS', label: 'Laporan Penilaian Harga Satuan', icon: 'LPHS', color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400', documents: [] },
  { key: 'SIOS', label: 'Surat Instruksi Operasional Site', icon: 'SIOS', color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400', documents: [] },
  { key: 'Harga', label: 'Dokumen Penawaran Harga Final', icon: 'HRG', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400', documents: [] },
  { key: 'MISC', label: 'Dokumen Lampiran & Foto Lapangan', icon: 'MISC', color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400', documents: [] },
];

export default function DokumenTab({ project, onShowNotification }: TabProps) {
  const updateProjectDocuments = useProjectStore((s) => s.updateProjectDocuments);

  const [docGroups, setDocGroups] = useState<DocGroup[]>(project?.documents || defaultDocGroups);
  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({
    RKS: true, LPHS: false, SIOS: false, Harga: false, MISC: false,
  });
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [uploadGroup, setUploadGroup] = useState('RKS');
  const [uploadFileName, setUploadFileName] = useState('');

  useEffect(() => {
    setDocGroups(project?.documents || defaultDocGroups);
  }, [project?.id]);

  const toggleGroup = (key: string) => {
    setOpenedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUploadOpen = (groupKey: string) => {
    setUploadGroup(groupKey);
    setUploadFileName('');
    setIsUploadDrawerOpen(true);
  };

  const handleUploadConfirm = () => {
    if (!project?.id || !uploadFileName) return;
    const newDoc: DocumentEntry = {
      id: `doc-${Date.now()}`,
      name: uploadFileName,
      size: '0 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploader: project.author,
      version: 'v1.0',
      icon: 'description',
      iconColor: 'text-primary',
    };
    const updated = docGroups.map(g =>
      g.key === uploadGroup ? { ...g, documents: [...g.documents, newDoc] } : g
    );
    setDocGroups(updated);
    updateProjectDocuments(project.id, updated);
    setIsUploadDrawerOpen(false);
    onShowNotification?.('Dokumen berhasil diunggah.', 'success');
  };

  const handleDownload = (doc: DocumentEntry) => {
    onShowNotification?.(`Mengunduh ${doc.name} (${doc.size})`, 'success');
  };

  const totalDocs = docGroups.reduce((sum, g) => sum + g.documents.length, 0);
  const totalSize = docGroups.reduce((sum, g) => {
    const sizes = g.documents.map(d => parseFloat(d.size));
    return sum + sizes.reduce((a, b) => a + b, 0);
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">folder_open</span>
            Dokumen Repository & File Manager
          </h3>
          <p className="text-secondary text-xs mt-1">Kelola seluruh draf berkas, arsip RKS, data LPHS, serta dokumen penawaran harga secara terpusat.</p>
        </div>
        <Button onClick={() => handleUploadOpen('RKS')} leftIcon={<span className="material-symbols-outlined text-[18px]">cloud_upload</span>}>
          Unggah Dokumen Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">folder</span>
          </div>
          <div>
            <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Total Dokumen</p>
            <p className="font-bold text-base text-on-surface">{totalDocs} Files</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-2xl">storage</span>
          </div>
          <div>
            <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Penyimpanan</p>
            <p className="font-bold text-base text-on-surface">{totalSize.toFixed(1)} MB</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <span className="material-symbols-outlined text-2xl">update</span>
          </div>
          <div>
            <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Kategori</p>
            <p className="font-bold text-base text-on-surface">{docGroups.length} Group</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <span className="material-symbols-outlined text-2xl">fact_check</span>
          </div>
          <div>
            <p className="text-outline text-[10px] uppercase font-mono tracking-wider font-semibold">Proyek</p>
            <p className="font-bold text-base text-on-surface">{project?.code}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {docGroups.map((group) => {
          const isOpened = openedGroups[group.key];
          return (
            <div key={group.key} className="bg-surface-container-lowest rounded-xl border border-border shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-low transition-all font-semibold outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg ${group.color} flex items-center justify-center font-bold text-xs`}>
                    {group.icon}
                  </span>
                  <div className="text-left">
                    <span className="text-sm font-bold text-on-surface block">{group.label}</span>
                    <span className="text-[10px] text-outline font-normal">
                      {group.documents.length > 0 ? `${group.documents.length} dokumen` : 'Kategori folder kosong'}
                    </span>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${isOpened ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isOpened && (
                <div className="border-t border-border bg-surface-container-lowest">
                  {group.documents.length > 0 ? (
                    <div className="divide-y divide-border">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-outline border-b border-border">
                        <div className="col-span-8 sm:col-span-6">Nama File</div>
                        <div className="hidden sm:block sm:col-span-2 text-center">Versi</div>
                        <div className="col-span-2 hidden sm:block">Pengunggah</div>
                        <div className="col-span-4 sm:col-span-2 text-right">Aksi</div>
                      </div>
                      {group.documents.map((doc) => (
                        <div key={doc.id} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center hover:bg-surface-container-low/60 transition-all">
                          <div className="col-span-8 sm:col-span-6 flex items-center gap-3 truncate">
                            <span className={`material-symbols-outlined ${doc.iconColor} text-3xl shrink-0`}>{doc.icon}</span>
                            <div className="truncate">
                              <p className="text-xs font-bold truncate text-on-surface">{doc.name}</p>
                              <p className="text-[10px] text-outline">{doc.size} • Diupload {formatDate(doc.uploadDate)}</p>
                            </div>
                          </div>
                          <div className="hidden sm:block col-span-2 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 font-bold rounded text-[10px]">{doc.version}</span>
                          </div>
                          <div className="hidden sm:block col-span-2 text-xs text-secondary truncate">{doc.uploader}</div>
                          <div className="col-span-4 sm:col-span-2 text-right flex justify-end gap-1 sm:gap-2">
                            <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-surface-container rounded-lg text-secondary transition-colors" title="Download">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-outline text-xs italic border-t border-border bg-surface-container-low/40">
                      <span className="material-symbols-outlined text-3xl mb-2 text-outline block">inventory_2</span>
                      Belum ada dokumen yang terunggah dalam kategori <span className="font-bold text-secondary">{group.label}</span>.
                      <button onClick={() => handleUploadOpen(group.key)} className="block mx-auto mt-3 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors">
                        Upload Dokumen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isUploadDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in transition-opacity">
          <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between transform transition-all duration-300">
            <div className="p-6 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                  Unggah Dokumen Tambahan
                </h4>
                <p className="text-[10px] text-outline mt-0.5">Siklus pengunggahan instan & pelacakan versi</p>
              </div>
              <button type="button" onClick={() => setIsUploadDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nama Dokumen</label>
                <input
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface"
                  placeholder="Masukkan nama berkas..."
                />
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Kategori Folder</label>
                <select
                  value={uploadGroup}
                  onChange={e => setUploadGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-on-surface bg-surface-container-lowest"
                >
                  {docGroups.map(g => (
                    <option key={g.key} value={g.key}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">File Ungguhan</label>
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-surface-container-low hover:bg-surface-container hover:border-primary/50 transition-all cursor-pointer group">
                  <span className="material-symbols-outlined text-4xl text-primary/40 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                  <p className="text-xs font-semibold text-secondary">Klik untuk pilih berkas komputer</p>
                  <p className="text-[10px] text-outline mt-1">PDF, DOCX, XLSX, atau ZIP (Maks 50MB)</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-surface-container-low flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsUploadDrawerOpen(false)}>Batal</Button>
              <Button onClick={handleUploadConfirm}>Simpan & Upload</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
