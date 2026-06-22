import { useState } from 'react';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function RksTab({ project: propProject }: TabProps) {
  const project = propProject || INITIAL_PROJECTS[0];
  const [nomorTender, setNomorTender] = useState('TND/2025/HQ/0042');
  const [namaTender, setNamaTender] = useState(project.name);
  const [deadlineTender, setDeadlineTender] = useState(project.deadlineTender || '2026-06-25');
  const [aanwijzing, setAanwijzing] = useState('Tidak / Belum Ada');
  const [workLocation, setWorkLocation] = useState(project.location);
  const [mainScope, setMainScope] = useState('Pembangunan infrastruktur data center terintegrasi meliputi instalasi kelistrikan, rack server, unit pendingin, dan fire suppression system.');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; time: string }>>([
    { name: 'RKS_Technical_Draft_v1.pdf', size: '4.2 MB', time: '2 mins ago' }
  ]);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.doc';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setUploadedFiles(prev => [...prev, { name: file.name, size: `${sizeMB} MB`, time: 'Just now' }]);
        toast.success(`File ${file.name} berhasil diunggah`);
      }
    };
    input.click();
  };

  const handleDeleteFile = (idx: number) => {
    const file = uploadedFiles[idx];
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    toast.success(`File ${file.name} berhasil dihapus`);
  };

  const handleSave = () => {
    toast.success('Draf RKS berhasil disimpan');
  };

  const handleSubmit = () => {
    toast.success('RKS sukses dikirim ke tim Review');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display-title text-xl font-bold text-on-surface">Form Pengisian RKS</h3>
          <p className="font-body-main text-sm text-secondary mt-1">
            Project: {project.name} ({project.code})
          </p>
        </div>
        <div className="flex items-center gap-2 self-start px-3 py-1.5 bg-warning/10 text-warning text-xs font-semibold rounded-lg border border-warning/20">
          <span className="material-symbols-outlined text-[18px]">lock_clock</span>
          <span className="uppercase tracking-wider">Awaiting Submission</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['RKS', 'BOQ', 'Evaluasi', 'Kontrak', 'Mobilisasi'].map((step, i) => (
          <div key={step} className="flex flex-col gap-2">
            <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-1.5 ${i === 0 ? 'text-primary font-bold' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: i === 0 ? "'FILL' 1" : undefined }}>
                {i === 0 ? 'check_circle' : 'circle'}
              </span>
              <span className="text-xs">{i + 1}. {step}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">assignment</span>
            </span>
            <div>
              <h3 className="font-heading-section text-base font-bold text-slate-800">Informasi Tender Utama</h3>
              <p className="text-secondary text-xs">Identitas nomor tender dan nama paket di portal e-proc.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-xs font-semibold text-slate-600">Nomor Tender</label>
              <input
                value={nomorTender}
                onChange={(e) => setNomorTender(e.target.value)}
                className="px-4 py-2.5 bg-background border border-border rounded-lg font-mono text-sm"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-label-sm text-xs font-semibold text-slate-600">Nama Tender</label>
              <input
                value={namaTender}
                onChange={(e) => setNamaTender(e.target.value)}
                className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-xs font-semibold text-slate-600">Deadline Tender</label>
              <input
                value={deadlineTender}
                onChange={(e) => setDeadlineTender(e.target.value)}
                className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                type="date"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-status-indigo/10 text-status-indigo flex items-center justify-center">
              <span className="material-symbols-outlined">upload_file</span>
            </span>
            <div>
              <h3 className="font-heading-section text-base font-bold text-slate-800">Dokumen RKS & Lampiran</h3>
              <p className="text-secondary text-xs">Unggah lembar acuan RKS resmi dari pihak klien.</p>
            </div>
          </div>

          <div
            onClick={handleUpload}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-3 transition-colors">cloud_upload</span>
            <p className="font-label-sm text-sm text-slate-700 mb-1">
              Drag and drop file here, atau <span className="text-primary font-semibold hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-400">PDF atau DOCX format (Max size: 25MB)</p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-border rounded-lg hover:border-slate-300 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-danger shrink-0 text-[32px]">description</span>
                    <div className="truncate">
                      <p className="font-label-sm text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{file.size} • Uploaded {file.time}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                    className="p-1.5 hover:bg-red-50 hover:text-danger rounded-lg transition-colors text-slate-400"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-lg bg-status-teal/10 text-status-teal flex items-center justify-center">
              <span className="material-symbols-outlined">quiz</span>
            </span>
            <div>
              <h3 className="font-heading-section text-base font-bold text-slate-800">Ketentuan Pelaksanaan Pekerjaan</h3>
              <p className="text-secondary text-xs">Sifat administrasi lapangan dan cakupan teknis proyek.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-xs text-slate-700 mb-3">Apakah sudah ada jadwal penjelasan tender (Aanwijzing)?</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                {['Ya, Terjadwal', 'Tidak / Belum Ada'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="aanwijzing_opt"
                      checked={aanwijzing === opt}
                      onChange={() => setAanwijzing(opt)}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-xs font-semibold text-slate-600">Lokasi Pelaksanaan Pekerjaan Resmi</label>
                <input
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="px-4 py-2.5 bg-background border border-border rounded-lg text-sm"
                  placeholder="Contoh: Site Office Area A, Jakarta Selatan"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-xs font-semibold text-slate-600">Lingkup Pekerjaan Utama (Scope of Work)</label>
                <textarea
                  value={mainScope}
                  onChange={(e) => setMainScope(e.target.value)}
                  className="px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm"
                  placeholder="Deskripsikan ruang lingkup utama dari pekerjaan konstruksi ini..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-status-purple/10 text-status-purple flex items-center justify-center">
                <span className="material-symbols-outlined">notes</span>
              </span>
              <div>
                <h3 className="font-heading-section text-base font-bold text-slate-800">Catatan Tambahan Internal</h3>
                <p className="text-secondary text-xs">Instruksi internal dan konteks non-publik.</p>
              </div>
            </div>
          </div>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="px-4 py-3 bg-background border border-border rounded-lg resize-none text-sm w-full"
            placeholder="Masukkan instruksi khusus atau catatan untuk tim review..."
            rows={4}
          />
        </section>

        <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs text-center sm:text-left">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Autosaved draft v2.4.0 CRM Engine specifications.</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={handleSave} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-white border border-border text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-100 transition-all">
              Simpan Draft
            </button>
            <button onClick={handleSubmit} type="button" className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-container shadow transition-all flex items-center justify-center gap-2">
              Kirim ke Review
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
