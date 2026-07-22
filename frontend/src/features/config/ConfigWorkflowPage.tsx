import React, { useState, useMemo, useEffect } from 'react';
import { Badge, Button, Tabs, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import { useConfigStore } from '@/stores/configStore';
import { useActiveOptions } from '@/hooks/useInputConfig';
import type { WorkflowStep as ConfigWorkflowStep } from '@/types/domain/config';

interface WorkflowStepDisplay extends ConfigWorkflowStep {
  status: 'completed' | 'current' | 'pending' | 'rejected';
  assignee: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  completed: { color: 'bg-success text-white', icon: 'check_circle', label: 'Selesai' },
  current: { color: 'bg-primary text-white', icon: 'radio_button_checked', label: 'Sedang Berjalan' },
  pending: { color: 'bg-surface-container-high text-secondary', icon: 'radio_button_unchecked', label: 'Menunggu' },
  rejected: { color: 'bg-danger text-white', icon: 'cancel', label: 'Ditolak' },
};

export default function ConfigWorkflowPage() {
  const [activeEntity, setActiveEntity] = useState('prospek');
  const workflows = useConfigStore((s) => s.workflows);
  const fetchWorkflows = useConfigStore((s) => s.fetchWorkflows);
  const workflowEntityOptions = useActiveOptions('workflow_entity_tabs');

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);
  const workflowEntityTabs = useMemo(() =>
    workflowEntityOptions.map(o => ({
      id: o.value,
      label: o.label,
      icon: (o.metadata?.icon || 'alt_route') as any,
    })),
  [workflowEntityOptions]);

  const steps: WorkflowStepDisplay[] = useMemo(() => {
    const definition = workflows.find((w) => w.entityType === activeEntity);
    if (!definition) return [];
    return definition.steps.map((s, idx, arr) => ({
      ...s,
      assignee: s.assigneeRole,
      status: idx === 3 ? 'current' : idx < 3 ? 'completed' : 'pending',
    } as WorkflowStepDisplay));
  }, [workflows, activeEntity]);

  const currentIndex = steps.findIndex(s => s.status === 'current');

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="bg-surface-container-lowest border-b border-border px-4 sm:px-8 py-5 shrink-0 shadow-sm z-10">
        <h2 className="font-display-title text-base font-extrabold text-on-surface">Konfigurasi Workflow</h2>
        <p className="text-[11px] text-outline mt-0.5">Atur alur kerja untuk setiap entitas dalam sistem.</p>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Tabs tabs={workflowEntityTabs} activeTab={activeEntity} onChange={setActiveEntity} variant="pills" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Total Langkah</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{steps.length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Selesai</p>
              <p className="text-xl font-extrabold text-success mt-1">{steps.filter(s => s.status === 'completed').length}</p>
            </div>
            <div className="bg-surface-container-lowest border border-border p-4 rounded-xl shadow-sm">
              <p className="text-[10px] text-outline uppercase font-mono tracking-wider">Menunggu</p>
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
                    <div key={step.id} className="flex items-start gap-3 sm:gap-5 relative pb-8">
                      {!isLast && (
                        <div className={`absolute left-[15px] top-8 w-0.5 h-full -translate-x-1/2 ${step.status === 'completed' ? 'bg-success' : 'bg-surface-container-high'}`} />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                        <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                      </div>
                      <div className={`flex-1 pb-2 ${step.status === 'current' ? 'bg-primary/5 -m-2 p-2 rounded-lg border border-primary/20' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-on-surface">{step.name}</h4>
                            <p className="text-[11px] text-outline mt-0.5">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {step.assignee && (
                              <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[9px] font-semibold">{step.assignee}</span>
                            )}
                            <Badge variant={step.status === 'completed' ? 'success' : step.status === 'current' ? 'info' : step.status === 'rejected' ? 'danger' : 'default'} size="sm">
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] text-outline font-mono">Langkah {step.order} dari {steps.length}</span>
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
