import React, { useState } from 'react';
import { Button, Badge, Input, Card } from '@/components/ui';
import toast from 'react-hot-toast';

interface UploadSetting {
  maxFileSize: number;
  allowedExtensions: string[];
  storagePath: string;
  maxFilesPerUpload: number;
  enableCompression: boolean;
  allowedMimeTypes: string[];
}

const ALL_EXTENSIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc,docx', label: 'Word (doc, docx)' },
  { value: 'xls,xlsx', label: 'Excel (xls, xlsx)' },
  { value: 'jpg,jpeg,png,gif', label: 'Gambar (jpg, jpeg, png, gif)' },
  { value: 'zip,rar,7z', label: 'Arsip (zip, rar, 7z)' },
  { value: 'txt,csv', label: 'Teks (txt, csv)' },
];

export default function ConfigUploadPage() {
  const [settings, setSettings] = useState<UploadSetting>({
    maxFileSize: 10,
    allowedExtensions: ['pdf', 'doc,docx', 'xls,xlsx', 'jpg,jpeg,png,gif'],
    storagePath: '/uploads/documents/',
    maxFilesPerUpload: 5,
    enableCompression: true,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
  });

  const [formMaxSize, setFormMaxSize] = useState(String(settings.maxFileSize));
  const [formMaxFiles, setFormMaxFiles] = useState(String(settings.maxFilesPerUpload));
  const [formStoragePath, setFormStoragePath] = useState(settings.storagePath);
  const [formCompression, setFormCompression] = useState(settings.enableCompression);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(settings.allowedExtensions);

  const handleSave = () => {
    setSettings({
      ...settings,
      maxFileSize: Number(formMaxSize),
      maxFilesPerUpload: Number(formMaxFiles),
      storagePath: formStoragePath,
      enableCompression: formCompression,
      allowedExtensions: selectedExtensions,
    });
    toast.success('Pengaturan upload berhasil disimpan.');
  };

  const handleToggleExtension = (ext: string) => {
    setSelectedExtensions(prev =>
      prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext],
    );
  };

  const handleReset = () => {
    setFormMaxSize(String(10));
    setFormMaxFiles(String(5));
    setFormStoragePath('/uploads/documents/');
    setFormCompression(true);
    setSelectedExtensions(['pdf', 'doc,docx', 'xls,xlsx', 'jpg,jpeg,png,gif']);
    toast.success('Pengaturan direset ke default.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
            <span className="font-semibold uppercase tracking-wider">Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold uppercase tracking-wider">Upload</span>
          </nav>
          <h2 className="font-display-title text-base font-extrabold text-slate-900">Konfigurasi Upload File</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Atur batas dan pengaturan upload file di sistem.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Max File Size</p>
              <p className="text-xl font-extrabold text-primary mt-1">{settings.maxFileSize} MB</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Extensions</p>
              <p className="text-xl font-extrabold text-success mt-1">{settings.allowedExtensions.length} jenis</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Max Files/Upload</p>
              <p className="text-xl font-extrabold text-warning mt-1">{settings.maxFilesPerUpload} file</p>
            </div>
          </div>

          <Card header={<h3 className="font-bold text-sm text-slate-800">Pengaturan Upload</h3>} padding="lg">
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Maksimum Ukuran File (MB) *</label>
                  <input type="number" value={formMaxSize} onChange={e => setFormMaxSize(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" min={1} max={100} />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">Maksimum File per Upload *</label>
                  <input type="number" value={formMaxFiles} onChange={e => setFormMaxFiles(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" min={1} max={50} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Path Penyimpanan</label>
                <input type="text" value={formStoragePath} onChange={e => setFormStoragePath(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" placeholder="/uploads/documents/" />
              </div>

              <div className="space-y-3">
                <label className="font-semibold text-slate-700 block">Ekstensi File yang Diizinkan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_EXTENSIONS.map(ext => (
                    <label key={ext.value} onClick={() => handleToggleExtension(ext.value)} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedExtensions.includes(ext.value) ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-slate-600 hover:bg-slate-50'}`}>
                      <span className="material-symbols-outlined text-[18px]">{selectedExtensions.includes(ext.value) ? 'check_box' : 'check_box_outline_blank'}</span>
                      <span className="font-medium text-xs">{ext.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Kompresi File</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="compression" checked={formCompression} onChange={() => setFormCompression(true)} className="text-primary" />
                    <span className="text-xs font-medium">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="compression" checked={!formCompression} onChange={() => setFormCompression(false)} className="text-primary" />
                    <span className="text-xs font-medium">Non-Aktif</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 italic">Kompresi file akan mengurangi ukuran file yang diunggah secara otomatis.</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={handleReset}>Reset ke Default</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>Simpan Pengaturan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
