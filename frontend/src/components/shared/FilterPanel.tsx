import React from 'react';
import { Input, Select, Button } from '@/components/ui';

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterValues {
  [key: string]: string;
}

interface FilterPanelProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply?: () => void;
}

export default function FilterPanel({ fields, values, onChange, onReset, onApply }: FilterPanelProps) {
  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="bg-surface-container-low rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-sm" aria-hidden="true">filter_alt</span>
          <span className="font-label-sm text-sm text-on-surface font-semibold">Filter</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary">{activeCount} aktif</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Atur Ulang
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) =>
          field.type === 'select' ? (
            <Select
              key={field.key}
              label={field.label}
              options={field.options || []}
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || 'Semua'}
            />
          ) : (
            <Input
              key={field.key}
              label={field.label}
              type={field.type === 'date' ? 'date' : 'text'}
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Cari ${field.label.toLowerCase()}...`}
            />
          )
        )}
      </div>
      {onApply && (
        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={onApply}>
            Terapkan
          </Button>
        </div>
      )}
    </div>
  );
}
