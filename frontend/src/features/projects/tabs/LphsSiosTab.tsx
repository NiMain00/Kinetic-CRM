import { useState, useEffect } from 'react';
import type { Project, LphsChecklistItem, TimelineEvent } from '@/types/domain';
import { useProjectStore } from '@/stores/projectStore';
import { Card, Button, Badge } from '@/components/ui';

interface TabProps {
  project?: Project;
  onShowNotification?: (message: string, type: 'success' | 'warning' | 'error') => void;
}

type CheckStatus = 'passed' | 'failed' | 'na';

const defaultChecklist: LphsChecklistItem[] = [
  { id: '1', name: 'Kelengkapan Administrasi', description: 'Dokumen administratif dan legalitas perusahaan', status: 'na', document: '' },
  { id: '2', name: 'Spesifikasi Teknis', description: 'Kesesuaian spesifikasi teknis dengan RKS', status: 'na', document: '' },
  { id: '3', name: 'Analisa Harga Satuan', description: 'Perhitungan harga satuan pekerjaan', status: 'na', document: '' },
  { id: '4', name: 'Metode Pelaksanaan', description: 'Metode kerja dan pendekatan teknis', status: 'na', document: '' },
  { id: '5', name: 'Jadwal Pelaksanaan', description: 'Kurva S dan milestone proyek', status: 'na', document: '' },
  { id: '6', name: 'Daftar Peralatan', description: 'Inventaris alat berat dan pendukung', status: 'na', document: '' },
  { id: '7', name: 'Tenaga Ahli', description: 'Sertifikasi dan pengalaman tenaga ahli', status: 'na', document: '' },
  { id: '8', name: 'Laporan Keuangan', description: 'Audit laporan keuangan 3 tahun terakhir', status: 'na', document: '' },
];

export default function LphsSiosTab({ project }: TabProps) {
  const updateProject = useProjectStore((s) => s.updateProject);
  const updateProjectLphs = useProjectStore((s) => s.updateProjectLphs);
  const addTimelineEvent = useProjectStore((s) => s.addTimelineEvent);

  const [items, setItems] = useState<LphsChecklistItem[]>(project?.lphsChecklist || defaultChecklist);

  useEffect(() => {
    setItems(project?.lphsChecklist || defaultChecklist);
  }, [project?.id]);

  const handleStatusChange = (id: string, newStatus: CheckStatus) => {
    const updated = items.map(item => item.id === id ? { ...item, status: newStatus } : item);
    setItems(updated);
    if (project?.id) {
      updateProjectLphs(project.id, updated);
    }
  };

  const handleUpload = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const updated = items.map(item => item.id === id ? { ...item, document: file.name } : item);
        setItems(updated);
        if (project?.id) {
          updateProjectLphs(project.id, updated);
        }
      }
    };
    input.click();
  };

  const handleSubmit = () => {
    if (!project?.id) return;
    // Persist final state
    updateProjectLphs(project.id, items);
    // Add timeline event
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      title: 'LPHS/SIOS Selesai',
      actor: project.author,
      role: 'Project Manager',
      time: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      type: 'approve',
      description: 'LPHS/SIOS checklist telah selesai direview.',
    };
    addTimelineEvent(project.id, event);
    // Advance status
    updateProject(project.id, { status: 'Input Harga', phase: 'Harga' });
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
          <p className="text-xs opacity-80">Proyek {project?.name} sedang dalam proses review checklist. {counts.passed} dari {items.length} item telah lolos verifikasi.</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={handleSubmit} rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>
            Selesaikan & Lanjutkan
          </Button>
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
