import React, { useRef } from 'react';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
  placeholder?: string;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
}

export default function DatePicker({ label, value, onChange, error, min, max, className, placeholder, onClick }: DatePickerProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-label-sm text-sm text-on-surface font-semibold" onClick={() => ref.current?.showPicker?.()}>{label}</label>
      )}
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        onClick={(e) => {
          ref.current?.showPicker?.();
          onClick?.(e);
        }}
        className={className || `w-full px-4 py-2.5 border rounded-xl text-sm bg-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? 'border-danger focus:ring-danger/20' : 'border-border hover:border-outline'}`}
      />
      {error && <p className="text-xs text-danger font-medium" role="alert">{error}</p>}
    </div>
  );
}
