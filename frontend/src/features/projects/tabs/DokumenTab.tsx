import { useState } from 'react';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

interface Document {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  uploader: string;
  version: string;
  icon: string;
  iconColor: string;
}

interface DocGroup {
  key: string;
  label: string;
  icon: string;
  color: string;
  documents: Document[];
}

export default function DokumenTab({ project: propProject }: TabProps) {
  const project = propProject || INITIAL_PROJECTS[0];

  const [docGroups, setDocGroups] = useState<DocGroup[]>([
    {
      key: 'RKS',
      label: 'Rencana Kerja & Syarat-Syarat',
      icon: 'RKS',
      color: 'bg-primary/10 text-primary',
      documents: [
        { id: 'd1', name: 'RKS_Tahap_1_Pondasi_Final.pdf', size: '4.2 MB', uploadDate: '2025-10-12', uploader: 'Ahmad Subarjo', version: 'v2.4', icon: 'picture_as_pdf', iconColor: 'text-red-500' },
        { id: 'd2', name: 'RKS_BOQ_v2.xlsx', size: '1.8 MB', uploadDate: '2025-10-10', uploader: 'Deni Saputra', version: 'v2.0', icon: 'table_chart', iconColor: 'text-emerald-500' },
      ]
    },
    {
      key: 'LPHS',
      label: 'Laporan Penilaian Harga Satuan',
      icon: 'LPHS',
      color: 'bg-teal-50 text-teal-600',
      documents: []
    },
    {
      key: 'SIOS',
      label: 'Surat Instruksi Operasional Site',
      icon: 'SIOS',
      color: 'bg-purple-50 text-purple-600',
      documents: []
    },
    {
      key: 'Harga',
      label: 'Dokumen Penawaran Harga Final',
      icon: 'HRG',
      color: 'bg-amber-50 text-amber-600',
      documents: []
    },
    {
      key: 'MISC',
      label: 'Dokumen Lampiran & Foto Lapangan',
      icon: 'MISC',
      color: 'bg-sky-50 text-sky-600',
      documents: [
        { id: 'd3', name: 'Site_Photos_Sept_2023.zip', size: '128 MB', uploadDate: '2025-09-28', uploader: 'Siti Aminah', version: 'v1.0', icon: 'folder_zip', iconColor: 'text-sky-500' },
      ]
    },
  ]);

  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({
    RKS: true, LPHS: false, SIOS: false, Harga: false, MISC: true,
  });
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);

  const toggleGroup = (key: string) => {
    setOpenedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpload = (groupKey: string) => {
    toast.success(`Upload dokumen untuk kategori ${groupKey} dibuka`);
    setIsUploadDrawerOpen(true);
  };

  const handleDownload = (doc: Document) => {
    toast.success(`Mengunduh ${doc.name} (${doc.size})`);
  };

  const totalDocs = docGroups.reduce((sum, g) => sum + g.documents.length, 0);
  const totalSize = docGroups.reduce((sum, g) => {
    const sizes = g.documents.map(d => parseFloat(d.size));
    return sum + sizes.reduce((a, b) => a + b, 0);
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">folder_open</span>
            Dokumen Repository & File Manager
          </h3>
          <p className="text-secondary text-xs mt-1">Kelola seluruh draf berkas, arsip RKS, data LPHS, serta dokumen penawaran harga secara terpusat.</p>
        </div>
        <Button onClick={() => setIsUploadDrawerOpen(true)} leftIcon={<span className="material-symbols-outlined text-[18px]">cloud_upload</span>}>
          Unggah Dokumen Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">folder</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Total Dokumen</p>
            <p className="font-bold text-base text-slate-700">{totalDocs} Files</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <span className="material-symbols-outlined text-2xl">storage</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Penyimpanan</p>
            <p className="font-bold text-base text-slate-700">{totalSize.toFixed(1)} MB</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-2xl">update</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Kategori</p>
            <p className="font-bold text-base text-slate-700">{docGroups.length} Group</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <span className="material-symbols-outlined text-2xl">fact_check</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Proyek</p>
            <p className="font-bold text-base text-slate-700">{project.code}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {docGroups.map((group) => {
          const isOpened = openedGroups[group.key];
          return (
            <div key={group.key} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-all font-semibold outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg ${group.color} flex items-center justify-center font-bold text-xs`}>
                    {group.icon}
                  </span>
                  <div className="text-left">
                    <span className="text-sm font-bold text-slate-700 block">{group.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {group.documents.length > 0 ? `${group.documents.length} dokumen` : 'Kategori folder kosong'}
                    </span>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isOpened ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isOpened && (
                <div className="border-t border-border bg-white">
                  {group.documents.length > 0 ? (
                    <div className="divide-y divide-border">
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-border">
                        <div className="col-span-8 sm:col-span-6">Nama File</div>
                        <div className="hidden sm:block col-span-2 text-center">Versi</div>
                        <div className="col-span-2 hidden sm:block">Pengunggah</div>
                        <div className="col-span-4 sm:col-span-2 text-right">Aksi</div>
                      </div>
                      {group.documents.map((doc) => (
                        <div key={doc.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/60 transition-all">
                          <div className="col-span-8 sm:col-span-6 flex items-center gap-3 truncate">
                            <span className={`material-symbols-outlined ${doc.iconColor} text-3xl shrink-0`}>{doc.icon}</span>
                            <div className="truncate">
                              <p className="text-xs font-bold truncate text-slate-700">{doc.name}</p>
                              <p className="text-[10px] text-slate-400">{doc.size} • Diupload {formatDate(doc.uploadDate)}</p>
                            </div>
                          </div>
                          <div className="hidden sm:block col-span-2 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded text-[10px]">{doc.version}</span>
                          </div>
                          <div className="hidden sm:block col-span-2 text-xs text-slate-500 truncate">{doc.uploader}</div>
                          <div className="col-span-4 sm:col-span-2 text-right flex justify-end gap-1 sm:gap-2">
                            <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Download">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-slate-400 text-xs italic border-t border-border bg-slate-50/40">
                      <span className="material-symbols-outlined text-3xl mb-2 text-slate-300 block">inventory_2</span>
                      Belum ada dokumen yang terunggah dalam kategori <span className="font-bold text-slate-500">{group.label}</span>.
                      <button onClick={() => handleUpload(group.key)} className="block mx-auto mt-3 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between transform transition-all duration-300">
            <div className="p-6 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                  Unggah Dokumen Tambahan
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Siklus pengunggahan instan & pelacakan versi</p>
              </div>
              <button type="button" onClick={() => setIsUploadDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nama Dokumen</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800" placeholder="Masukkan nama berkas..." />
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Kategori Folder</label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs text-slate-800 bg-white">
                  <option value="RKS">Rencana Kerja & Syarat-Syarat (RKS)</option>
                  <option value="LPHS">Laporan Penilaian Harga Satuan (LPHS)</option>
                  <option value="SIOS">Surat Instruksi Operasional Site (SIOS)</option>
                  <option value="Harga">Dokumen Penawaran Harga Final</option>
                  <option value="MISC">Dokumen Lampiran & Foto Lapangan (MISC)</option>
                </select>
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">File Ungguhan</label>
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 hover:border-primary/50 transition-all cursor-pointer group">
                  <span className="material-symbols-outlined text-4xl text-primary/40 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                  <p className="text-xs font-semibold text-secondary">Klik untuk pilih berkas komputer</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX, atau ZIP (Maks 50MB)</p>
                </div>
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Tambahan (Opsional)</label>
                <textarea rows={4} className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none text-slate-800" placeholder="Tambahkan catatan singkat perubahan revisi berkas ini..." />
              </div>
            </div>

            <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsUploadDrawerOpen(false)}>Batal</Button>
              <Button onClick={() => { toast.success('Dokumen berhasil diunggah dan disimpan ke repositori.'); setIsUploadDrawerOpen(false); }}>
                Simpan & Upload
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
