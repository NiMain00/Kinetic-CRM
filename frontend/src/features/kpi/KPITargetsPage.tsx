import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Select, Input, Modal, Table } from '@/components/ui';
import type { Column } from '@/components/ui';
import type { KpiTarget } from '@/types/domain/users';
import { useMasterPeriods } from '@/hooks/useConfigData';
import { usePermission } from '@/hooks/usePermission';

interface TargetForm {
  name: string;
  category: KpiTarget['category'];
  period: string;
  targetValue: string;
  unit: string;
}

const CATEGORY_OPTIONS = [
  { value: 'win_rate', label: 'Win Rate' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'project_count', label: 'Project Count' },
  { value: 'avg_margin', label: 'Average Margin' },
  { value: 'sla_compliance', label: 'SLA Compliance' },
  { value: 'customer_satisfaction', label: 'Customer Satisfaction' },
];

// PERIOD_OPTIONS now built dynamically in the component via useMasterPeriods()

const UNIT_MAP: Record<string, string> = {
  win_rate: '%',
  revenue: 'IDR',
  project_count: 'projects',
  avg_margin: '%',
  sla_compliance: '%',
  customer_satisfaction: '/5',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  on_track: 'success',
  at_risk: 'warning',
  behind: 'danger',
  achieved: 'info',
};

const STATUS_LABEL: Record<string, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  behind: 'Behind',
  achieved: 'Achieved',
};

const INITIAL_TARGETS: (KpiTarget & { createdAt: string } & Record<string, unknown>)[] = [
  { id: 'KPI-001', name: 'Win Rate', category: 'win_rate', targetValue: 70, actualValue: 65.5, unit: '%', period: '2026 Q2', status: 'at_risk', createdAt: '2026-01-15' },
  { id: 'KPI-002', name: 'Total Revenue', category: 'revenue', targetValue: 500000000000, actualValue: 425000000000, unit: 'IDR', period: '2026 H1', status: 'on_track', createdAt: '2026-01-01' },
  { id: 'KPI-003', name: 'Project Completion', category: 'project_count', targetValue: 48, actualValue: 36, unit: 'projects', period: '2026 Q2', status: 'behind', createdAt: '2026-01-15' },
  { id: 'KPI-004', name: 'Average Margin', category: 'avg_margin', targetValue: 18, actualValue: 16.2, unit: '%', period: '2026 Q2', status: 'at_risk', createdAt: '2026-01-15' },
  { id: 'KPI-005', name: 'SLA Compliance', category: 'sla_compliance', targetValue: 98, actualValue: 94.3, unit: '%', period: '2026 Q2', status: 'at_risk', createdAt: '2026-01-15' },
  { id: 'KPI-006', name: 'Customer Satisfaction', category: 'customer_satisfaction', targetValue: 4.5, actualValue: 4.2, unit: '/5', period: '2026 H1', status: 'on_track', createdAt: '2026-01-01' },
];

const CATEGORY_ICONS: Record<string, string> = {
  win_rate: 'trending_up',
  revenue: 'payments',
  project_count: 'assignment',
  avg_margin: 'pie_chart',
  sla_compliance: 'verified',
  customer_satisfaction: 'star',
};

// EMPTY_FORM now built inside the component to get default period from store

export default function KPITargetsPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const periods = useMasterPeriods();
  const periodOptions = useMemo(() => periods.map(p => ({ value: p.name, label: p.name })), [periods]);
  const defaultPeriod = periods.find(p => p.is_active)?.name || periods[0]?.name || '';
  const emptyForm: TargetForm = { name: '', category: 'win_rate', period: defaultPeriod, targetValue: '', unit: '%' };
  const [targets, setTargets] = useState<(KpiTarget & { createdAt: string } & Record<string, unknown>)[]>(INITIAL_TARGETS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TargetForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TargetForm, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TargetForm, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Nama KPI wajib diisi.';
    if (!form.targetValue.trim()) {
      newErrors.targetValue = 'Nilai target wajib diisi.';
    } else {
      const num = Number(form.targetValue.replace(/[^0-9.]/g, ''));
      if (isNaN(num) || num <= 0) newErrors.targetValue = 'Nilai target harus berupa angka positif.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryChange = (category: KpiTarget['category']) => {
    setForm(prev => ({ ...prev, category, unit: UNIT_MAP[category] || '%' }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const numValue = Number(form.targetValue.replace(/[^0-9.]/g, ''));
    const newTarget: KpiTarget & { createdAt: string } & Record<string, unknown> = {
      id: `KPI-${String(targets.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      category: form.category,
      targetValue: numValue,
      actualValue: 0,
      unit: form.unit,
      period: form.period,
      status: 'behind',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTargets([newTarget, ...targets]);
    setModalOpen(false);
    setForm(emptyForm);
    setErrors({});
    toast.success(`Target KPI "${newTarget.name}" berhasil ditambahkan.`);
  };

  const handleDelete = (id: string) => {
    const target = targets.find(t => t.id === id);
    setTargets(targets.filter(t => t.id !== id));
    toast.success(`Target KPI "${target?.name}" berhasil dihapus.`);
  };

  const formatTargetValue = (t: KpiTarget) => {
    if (t.category === 'revenue') return `Rp ${(t.targetValue / 1000000000).toFixed(1)}B`;
    if (t.unit === '%') return `${t.targetValue}%`;
    if (t.unit === '/5') return t.targetValue.toFixed(1);
    return t.targetValue.toLocaleString();
  };

  const columns: Column<KpiTarget & { createdAt: string } & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'KPI Name',
      render: row => (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline" aria-hidden="true">{CATEGORY_ICONS[row.category] || 'monitoring'}</span>
          <span className="font-bold text-on-surface text-xs">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: row => <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-semibold text-on-surface-variant">{row.category.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      render: row => <span className="text-outline font-mono text-[10px]">{row.period}</span>,
    },
    {
      key: 'targetValue',
      header: 'Target Value',
      align: 'right',
      render: row => <span className="font-mono font-bold text-on-surface text-xs">{formatTargetValue(row)}</span>,
    },
    {
      key: 'unit',
      header: 'Unit',
      align: 'center',
      render: row => <span className="text-[10px] text-secondary uppercase">{row.unit}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: row => <Badge variant={STATUS_VARIANT[row.status]} size="sm">{STATUS_LABEL[row.status]}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: row => <span className="text-[10px] text-outline font-mono">{row.createdAt}</span>,
    },
    {
      key: 'id',
      header: '',
      align: 'right',
      render: row => (
        can('kpi:manage') ? (
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-outline hover:text-danger transition-colors cursor-pointer"
            title="Hapus target"
            aria-label={`Hapus target ${row.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        ) : null
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-on-surface">
      <div className="bg-surface border-b border-border/60 px-4 sm:px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-card z-10">
        <div>
          <h2 className="font-display-title text-base font-extrabold text-on-surface">KPI Target Setting</h2>
          <p className="text-[11px] text-outline mt-0.5">Atur dan kelola target KPI untuk setiap periode.</p>
        </div>
        {can('kpi:manage') && (
          <Button
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}
            onClick={() => { setForm(emptyForm); setErrors({}); setModalOpen(true); }}
            aria-label="Tambah target baru"
          >
            Tambah Target Baru
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 text-left">
          <Card padding="none" header={
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-on-surface text-xs">Daftar Target KPI</h4>
              <span className="text-[10px] text-outline">{targets.length} target</span>
            </div>
          }>
            <Table<KpiTarget & { createdAt: string } & Record<string, unknown>>
              columns={columns}
              data={targets}
              keyExtractor={row => row.id}
              emptyState={
                <div className="space-y-2">
                  <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">add_circle</span>
                  <p className="text-sm">Belum ada target KPI. Klik "Tambah Target Baru" untuk memulai.</p>
                </div>
              }
            />
          </Card>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}); }}
        title="Tambah Target KPI Baru"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setModalOpen(false); setErrors({}); }}>Batal</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>Simpan Target</Button>
          </>
        }
      >
        <div className="space-y-5 text-left">
          <Input
            label="Nama KPI"
            placeholder="Contoh: Win Rate"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            required
            aria-label="Nama KPI"
          />
          <div>
            <Select
              label="Kategori"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={e => handleCategoryChange(e.target.value as KpiTarget['category'])}
              aria-label="Kategori KPI"
            />
          </div>
          <div>
            <Select
              label="Periode"
              options={periodOptions}
              value={form.period}
              onChange={e => setForm(prev => ({ ...prev, period: e.target.value }))}
              aria-label="Periode target"
            />
          </div>
          <Input
            label="Nilai Target"
            type="number"
            min="0"
            step="any"
            placeholder="Contoh: 70"
            value={form.targetValue}
            onChange={e => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
            error={errors.targetValue}
            required
            aria-label="Nilai target"
          />
          <Input
            label="Unit"
            placeholder="Contoh: %"
            value={form.unit}
            onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
            aria-label="Unit pengukuran"
            helperText="Satuan pengukuran untuk target KPI ini."
          />
        </div>
      </Modal>
    </div>
  );
}
