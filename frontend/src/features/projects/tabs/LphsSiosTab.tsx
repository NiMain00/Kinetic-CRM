import { useState } from 'react';
import type { Project } from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
import toast from 'react-hot-toast';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

type CheckStatus = 'passed' | 'failed' | 'na';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: CheckStatus;
  document?: string;
}

export default function LphsSiosTab({ project: propProject }: TabProps) {
  const project = propProject || INITIAL_PROJECTS[0];

  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', name: 'Kelengkapan Administrasi', description: 'Dokumen administratif dan legalitas perusahaan', status: 'passed', document: 'adms_checklist.pdf' },
    { id: '2', name: 'Spesifikasi Teknis', description: 'Kesesuaian spesifikasi teknis dengan RKS', status: 'passed', document: 'tech_spec_v2.pdf' },
    { id: '3', name: 'Analisa Harga Satuan', description: 'Perhitungan harga satuan pekerjaan', status: 'failed', document: '' },
    { id: '4', name: 'Metode Pelaksanaan', description: 'Metode kerja dan pendekatan teknis', status: 'na', document: '' },
    { id: '5', name: 'Jadwal Pelaksanaan', description: 'Kurva S dan milestone proyek', status: 'passed', document: 'schedule_bar.pdf' },
    { id: '6', name: 'Daftar Peralatan', description: 'Inventaris alat berat dan pendukung', status: 'na', document: '' },
    { id: '7', name: 'Tenaga Ahli', description: 'Sertifikasi dan pengalaman tenaga ahli', status: 'passed', document: 'cv_team.pdf' },
    { id: '8', name: 'Laporan Keuangan', description: 'Audit laporan keuangan 3 tahun terakhir', status: 'failed', document: '' },
  ]);

  const handleStatusChange = (id: string, newStatus: CheckStatus) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    toast.success(`Status item berhasil diperbarui`);
  };

  const handleUpload = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, document: file.name } : item));
        toast.success(`Dokumen ${file.name} berhasil diunggah`);
      }
    };
    input.click();
  };

  const statusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'passed': return <span className="material-symbols-outlined text-success">check_circle</span>;
      case 'failed': return <span className="material-symbols-outlined text-danger">cancel</span>;
      case 'na': return <span className="material-symbols-outlined text-outline">remove_circle</span>;
    }
  };

  const statusLabel = (status: CheckStatus) => {
    switch (status) {
      case 'passed': return 'Lolos';
      case 'failed': return 'Gagal';
      case 'na': return 'N/A';
    }
  };

  const counts = { passed: items.filter(i => i.status === 'passed').length, failed: items.filter(i => i.status === 'failed').length, na: items.filter(i => i.status === 'na').length };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Status Checklist</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/10">
              <span className="text-sm font-semibold text-success flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span> Lolos
              </span>
              <span className="font-bold text-lg text-success">{counts.passed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danger/5 rounded-lg border border-danger/10">
              <span className="text-sm font-semibold text-danger flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">cancel</span> Gagal
              </span>
              <span className="font-bold text-lg text-danger">{counts.failed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-border">
              <span className="text-sm font-semibold text-outline flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">remove_circle</span> N/A
              </span>
              <span className="font-bold text-lg text-outline">{counts.na}</span>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="font-heading-section text-heading-section mb-4">Upload Dokumen</h3>
          <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:bg-surface-container-low transition-all"
            onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.click(); }}>
            <span className="material-symbols-outlined text-primary text-3xl mb-2">upload_file</span>
            <p className="text-xs font-semibold">Klik untuk upload dokumen</p>
            <p className="text-[10px] text-outline mt-1">PDF, DOCX (Max 25MB)</p>
          </div>
        </Card>

        <div className="bg-primary-container text-on-primary-container rounded-xl p-5 relative overflow-hidden">
          <h4 className="font-semibold text-sm mb-1">Ringkasan LPHS/SIOS</h4>
          <p className="text-xs opacity-80">Proyek {project.name} sedang dalam proses review checklist. {counts.passed} dari {items.length} item telah lolos verifikasi.</p>
        </div>
      </div>

      <div className="lg:col-span-8">
        <Card padding="none">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-heading-section text-heading-section">Daftar Checklist LPHS/SIOS</h3>
              <p className="text-xs text-secondary mt-0.5">Kelola status kelayakan setiap item tender</p>
            </div>
            <Badge variant="warning">In-Progress Review</Badge>
          </div>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="p-5 hover:bg-surface-container-low transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {statusIcon(item.status)}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-on-surface">{item.name}</p>
                      <p className="text-xs text-secondary mt-0.5">{item.description}</p>
                      {item.document && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-primary">
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          <span>{item.document}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-1">
                      {(['passed', 'failed', 'na'] as CheckStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(item.id, s)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                            item.status === s
                              ? s === 'passed' ? 'bg-success text-white' : s === 'failed' ? 'bg-danger text-white' : 'bg-outline text-white'
                              : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                          }`}
                        >
                          {statusLabel(s)}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleUpload(item.id)}
                      className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-colors"
                      title="Upload dokumen"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
