import React, { useState, useRef, useEffect } from 'react';
import { Input, Select, Button } from '@/components/ui';

interface SelectOption {
  value: string;
  label: string;
}

interface FilterFieldBase {
  key: string;
  label: string;
  placeholder?: string;
}

interface TextField extends FilterFieldBase {
  type: 'text';
}

interface SelectField extends FilterFieldBase {
  type: 'select';
  options: SelectOption[];
}

interface DateField extends FilterFieldBase {
  type: 'date';
}

interface DateRangeField extends FilterFieldBase {
  type: 'date_range';
}

interface NumberRangeField extends FilterFieldBase {
  type: 'number_range';
}

interface MultiSelectField extends FilterFieldBase {
  type: 'multi_select';
  options: SelectOption[];
}

type FilterField = TextField | SelectField | DateField | DateRangeField | NumberRangeField | MultiSelectField;

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
    <div className="bg-white rounded-2xl border border-border/60 p-5 space-y-4 shadow-card">
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
        {fields.map((field) => {
          switch (field.type) {
            case 'select':
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  options={field.options}
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder || 'Semua'}
                />
              );
            case 'date':
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="date"
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              );
            case 'date_range': {
              const fromKey = `${field.key}_from`;
              const toKey = `${field.key}_to`;
              return (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface block">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={values[fromKey] || ''}
                      onChange={(e) => onChange(fromKey, e.target.value)}
                      className="w-full rounded-xl border border-border p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      aria-label={`${field.label} dari`}
                    />
                    <span className="text-outline text-xs">s/d</span>
                    <input
                      type="date"
                      value={values[toKey] || ''}
                      onChange={(e) => onChange(toKey, e.target.value)}
                      className="w-full rounded-xl border border-border p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      aria-label={`${field.label} sampai`}
                    />
                  </div>
                </div>
              );
            }
            case 'number_range': {
              const minKey = `${field.key}_min`;
              const maxKey = `${field.key}_max`;
              return (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface block">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={values[minKey] || ''}
                      onChange={(e) => onChange(minKey, e.target.value)}
                      placeholder="Min"
                      className="w-full rounded-xl border border-border p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      aria-label={`${field.label} minimal`}
                    />
                    <span className="text-outline text-xs">—</span>
                    <input
                      type="number"
                      value={values[maxKey] || ''}
                      onChange={(e) => onChange(maxKey, e.target.value)}
                      placeholder="Max"
                      className="w-full rounded-xl border border-border p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      aria-label={`${field.label} maksimal`}
                    />
                  </div>
                </div>
              );
            }
            case 'multi_select': {
              return (
                <MultiSelect
                  key={field.key}
                  label={field.label}
                  options={field.options}
                  value={values[field.key] || ''}
                  onChange={(val) => onChange(field.key, val)}
                  placeholder={field.placeholder}
                />
              );
            }
            default:
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type="text"
                  value={values[field.key] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Cari ${field.label.toLowerCase()}...`}
                />
              );
          }
        })}
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

function MultiSelect({ label, options, value, onChange, placeholder }: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = value ? value.split(',') : [];

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next.join(','));
  };

  return (
    <div className="relative space-y-1" ref={ref}>
      <label className="text-xs font-semibold text-on-surface block">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl border border-border p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
      >
        <span className={selected.length === 0 ? 'text-outline' : 'text-on-surface'}>
          {selected.length === 0 ? (placeholder || 'Semua') : `${selected.length} dipilih`}
        </span>
        <span className="material-symbols-outlined text-[16px] text-outline">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-elevated p-2 z-20 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container rounded-lg cursor-pointer text-xs transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
