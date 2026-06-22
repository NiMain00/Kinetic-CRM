import React, { useState } from 'react';
import { Badge, Button, Tabs, Card } from '@/components/ui';
import type { Tab } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';

interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  description: string;
  assignee?: string;
}

const ENTITY_TABS: Tab[] = [
  { id: 'prospek', label: 'Prospek', icon: 'travel_explore' },
  { id: 'rks', label: 'RKS', icon: 'description' },
  { id: 'lphs', label: 'LPHS', icon: 'assessment' },
];

const WORKFLOW_DATA: Record<string, WorkflowStep[]> = {
  prospek: [
    { id: 'P1', name: 'Registrasi Prospek', order: 1, status: 'completed', description: 'Staff mencatat data prospek baru', assignee: 'Staff' },
    { id: 'P2', name: 'Review Marketing', order: 2, status: 'completed', description: 'Tim marketing memverifikasi prospek', assignee: 'Marketing' },
    { id: 'P3', name: 'Penilaian Kualifikasi', order: 3, status: 'current', description: 'Penilaian kelayakan prospek', assignee: 'Branch Manager' },
    { id: 'P4', name: 'Approval BM', order: 4, status: 'pending', description: 'Persetujuan Branch Manager', assignee: 'Branch Manager' },
    { id: 'P5', name: 'Konversi ke Proyek', order: 5, status: 'pending', description: 'Prospek siap dikonversi', assignee: 'PM' },
  ],
  rks: [
    { id: 'R1', name: 'Draft RKS', order: 1, status: 'completed', description: 'Pembuatan dokumen RKS', assignee: 'PM' },
    { id: 'R2', name: 'Review RKS', order: 2, status: 'current', description: 'Review oleh Dept Head', assignee: 'Dept Head' },
    { id: 'R3', name: 'Approval RKS', order: 3, status: 'pending', description: 'Persetujuan final RKS', assignee: 'Branch Manager' },
    { id: 'R4', name: 'Publikasi RKS', order: 4, status: 'pending', description: 'RKS siap dipublikasikan', assignee: 'Admin' },
  ],
  lphs: [
    { id: 'L1', name: 'Draft LPHS', order: 1, status: 'completed', description: 'Pembuatan LPHS oleh PM', assignee: 'PM' },
    { id: 'L2', name: 'Review Teknis', order: 2, status: 'completed', description: 'Review aspek teknis', assignee: 'Dept Head' },
    { id: 'L3', name: 'Review Harga', order: 3, status: 'current', description: 'Review dan validasi harga', assignee: 'Finance' },
    { id: 'L4', name: 'Approval LPHS', order: 4, status: 'pending', description: 'Persetujuan final LPHS', assignee: 'Direktur' },
    { id: 'L5', name: 'Finalisasi LPHS', order: 5, status: 'pending', description: 'LPHS siap digunakan', assignee: 'Admin' },
  ],
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  completed: { color: 'bg-success text-white', icon: 'check_circle', label: 'Selesai' },
  current: { color: 'bg-primary text-white', icon: 'radio_button_checked', label: 'Sedang Berjalan' },
  pending: { color: 'bg-slate-200 text-slate-500', icon: 'radio_button_unchecked', label: 'Menunggu' },
  rejected: { color: 'bg-danger text-white', icon: 'cancel', label: 'Ditolak' },
};

export default function ConfigWorkflowPage() {
  const [activeEntity, setActiveEntity] = useState('prospek');

  const steps = WORKFLOW_DATA[activeEntity] || [];
  const currentIndex = steps.findIndex(s => s.status === 'current');

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-white border-b border-border px-8 py-5 shrink-0 shadow-sm z-10">
        <nav className="flex items-center gap-2 mb-1.5 text-xs text-secondary">
          <span className="font-semibold uppercase tracking-wider">Configuration</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold uppercase tracking-wider">Workflow</span>
        </nav>
        <h2 className="font-display-title text-base font-extrabold text-slate-900">Konfigurasi Workflow</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Atur alur kerja untuk setiap entitas dalam sistem.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Tabs tabs={ENTITY_TABS} activeTab={activeEntity} onChange={setActiveEntity} variant="pills" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Langkah</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{steps.length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Selesai</p>
              <p className="text-xl font-extrabold text-success mt-1">{steps.filter(s => s.status === 'completed').length}</p>
            </div>
            <div className="bg-white border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Menunggu</p>
              <p className="text-xl font-extrabold text-warning mt-1">{steps.filter(s => s.status === 'pending').length}</p>
            </div>
          </div>

          <Card padding="lg">
            <div className="space-y-0">
              {/* Visual workflow diagram */}
              <div className="relative">
                {steps.map((step, idx) => {
                  const cfg = STATUS_CONFIG[step.status];
                  const isLast = idx === steps.length - 1;
                  return (
                    <div key={step.id} className="flex items-start gap-5 relative pb-8">
                      {!isLast && (
                        <div className={`absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2 ${step.status === 'completed' ? 'bg-success' : 'bg-slate-200'}`} />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                        <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                      </div>
                      <div className={`flex-1 pb-2 ${step.status === 'current' ? 'bg-primary/5 -m-2 p-2 rounded-lg border border-primary/20' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{step.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {step.assignee && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold">{step.assignee}</span>
                            )}
                            <Badge variant={step.status === 'completed' ? 'success' : step.status === 'current' ? 'info' : step.status === 'rejected' ? 'danger' : 'default'} size="sm">
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] text-slate-400 font-mono">Langkah {step.order} dari {steps.length}</span>
                          <button onClick={() => toast.success(`Detail langkah ${step.name}`)} className="text-[9px] text-primary hover:underline cursor-pointer">Detail</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
