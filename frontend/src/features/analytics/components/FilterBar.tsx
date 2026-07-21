import { useState, useEffect } from 'react';
import { useOrgBranches, useOrgDepartments } from '@/hooks/useConfigData';

interface FilterValues {
  startDate: string;
  endDate: string;
  branchId: string;
  departmentId: string;
  ownerUserId: string;
  status: string;
}

interface FilterBarProps {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

export default function FilterBar({ values, onChange }: FilterBarProps) {
  const branches = useOrgBranches();
  const departments = useOrgDepartments();

  const statusOptions = [
    '',
    'Dibuat',
    'RKS',
    'Review RKS',
    'Approved',
    'Penawaran Dikirim',
    'Negosiasi',
    'Menunggu PO',
    'PO Diterima',
    'Pelaksanaan',
    'BAST',
    'Selesai',
    'Ditunda',
    'Dibatalkan',
  ];

  const update = (key: keyof FilterValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="bg-surface rounded-2xl border border-border/60 shadow-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px]">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={values.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border/60 text-xs text-on-surface bg-surface-container-low focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={values.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border/60 text-xs text-on-surface bg-surface-container-low focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-1">
            Cabang
          </label>
          <select
            value={values.branchId}
            onChange={(e) => update('branchId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border/60 text-xs text-on-surface bg-surface-container-low focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-1">
            Departemen
          </label>
          <select
            value={values.departmentId}
            onChange={(e) => update('departmentId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border/60 text-xs text-on-surface bg-surface-container-low focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-1">
            Status
          </label>
          <select
            value={values.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border/60 text-xs text-on-surface bg-surface-container-low focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Semua Status</option>
            {statusOptions.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() =>
            onChange({
              startDate: '',
              endDate: '',
              branchId: '',
              departmentId: '',
              ownerUserId: '',
              status: '',
            })
          }
          className="px-4 py-2 text-xs font-semibold text-secondary border border-border/60 rounded-lg hover:bg-surface-container-low transition-colors"
        >
          Reset Filter
        </button>
      </div>
    </div>
  );
}
