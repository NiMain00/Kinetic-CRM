import React, { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import { useConfigStore } from '@/stores/configStore';

const ALL_EXTENSIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc,docx', label: 'Word (doc, docx)' },
  { value: 'xls,xlsx', label: 'Excel (xls, xlsx)' },
  { value: 'jpg,jpeg,png,gif', label: 'Gambar (jpg, jpeg, png, gif)' },
  { value: 'zip,rar,7z', label: 'Arsip (zip, rar, 7z)' },
  { value: 'txt,csv', label: 'Teks (txt, csv)' },
];

export default function ConfigUploadPage() {
  const uploadConfig = useConfigStore((s) => s.uploadConfig);
  const updateUploadConfig = useConfigStore((s) => s.updateUploadConfig);
  const fetchUploadConfig = useConfigStore((s) => s.fetchUploadConfig);

  const [formMaxSize, setFormMaxSize] = useState(String(uploadConfig.maxFileSizeMb));
  const [formMaxFiles, setFormMaxFiles] = useState(String(uploadConfig.maxFilesPerUpload));
  const [formStoragePath, setFormStoragePath] = useState(uploadConfig.storagePath);
  const [formCompression, setFormCompression] = useState(uploadConfig.enableCompression);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(uploadConfig.allowedExtensions);

  useEffect(() => {
    fetchUploadConfig();
  }, [fetchUploadConfig]);

  useEffect(() => {
    if (uploadConfig.id) {
      setFormMaxSize(String(uploadConfig.maxFileSizeMb));
      setFormMaxFiles(String(uploadConfig.maxFilesPerUpload));
      setFormStoragePath(uploadConfig.storagePath);
      setFormCompression(uploadConfig.enableCompression);
      setSelectedExtensions(uploadConfig.allowedExtensions);
    }
  }, [uploadConfig]);

  const handleSave = async () => {
    try {
      await updateUploadConfig({
        maxFileSizeMb: Number(formMaxSize),
        maxFilesPerUpload: Number(formMaxFiles),
        storagePath: formStoragePath,
        enableCompression: formCompression,
        allowedExtensions: selectedExtensions,
      });
      toast.success('Pengaturan upload berhasil disimpan.');
    } catch {
      toast.error('Gagal menyimpan pengaturan. Silakan coba lagi.');
    }
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
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Upload File</h2>
          <p className="text-[11px] text-outline mt-0.5">Atur batas dan pengaturan upload file di sistem.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Max File Size</p>
              <p className="text-xl font-extrabold text-primary mt-1">{uploadConfig.maxFileSizeMb} MB</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Extensions</p>
              <p className="text-xl font-extrabold text-success mt-1">{uploadConfig.allowedExtensions.length} jenis</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Max Files/Upload</p>
              <p className="text-xl font-extrabold text-warning mt-1">{uploadConfig.maxFilesPerUpload} file</p>
            </div>
          </div>

          <Card header={<h3 className="font-bold text-sm text-on-surface">Pengaturan Upload</h3>} padding="lg">
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Maksimum Ukuran File (MB) *</label>
                  <input type="number" value={formMaxSize} onChange={e => setFormMaxSize(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" min={1} max={100} />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-on-surface block">Maksimum File per Upload *</label>
                  <input type="number" value={formMaxFiles} onChange={e => setFormMaxFiles(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" min={1} max={50} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Path Penyimpanan</label>
                <input type="text" value={formStoragePath} onChange={e => setFormStoragePath(e.target.value)} className="w-full rounded-lg border border-border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" placeholder="/uploads/documents/" />
              </div>

              <div className="space-y-3">
                <label className="font-semibold text-on-surface block">Ekstensi File yang Diizinkan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_EXTENSIONS.map(ext => (
                    <label key={ext.value} onClick={() => handleToggleExtension(ext.value)} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedExtensions.includes(ext.value) ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}`}>
                      <span className="material-symbols-outlined text-[18px]">{selectedExtensions.includes(ext.value) ? 'check_box' : 'check_box_outline_blank'}</span>
                      <span className="font-medium text-xs">{ext.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-on-surface block">Kompresi File</label>
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
                <p className="text-[10px] text-outline italic">Kompresi file akan mengurangi ukuran file yang diunggah secara otomatis.</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleReset}>Reset ke Default</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>Simpan Pengaturan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
