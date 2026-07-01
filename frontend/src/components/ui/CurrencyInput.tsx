import React, { useState, useCallback, useEffect } from 'react';

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
}

function formatRupiah(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return '';
  return 'Rp ' + Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(str: string): number | undefined {
  const cleaned = str.replace(/[^0-9]/g, '');
  if (!cleaned) return undefined;
  return parseInt(cleaned, 10);
}

export default function CurrencyInput({
  value,
  onChange,
  label,
  error,
  helperText,
  placeholder = 'Rp 0',
  required,
  className = '',
  disabled,
  readOnly,
  id,
}: CurrencyInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [displayValue, setDisplayValue] = useState(() => formatRupiah(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplayValue(formatRupiah(value));
    }
  }, [value, focused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      const num = raw === '' ? undefined : parseInt(raw, 10);

      if (focused) {
        setDisplayValue(raw === '' ? '' : raw);
      } else {
        setDisplayValue(formatRupiah(num));
      }

      onChange?.(num);
    },
    [onChange, focused],
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    if (value !== undefined) {
      setDisplayValue(String(Math.round(value)));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setDisplayValue(formatRupiah(value));
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-label-sm text-sm text-on-surface font-semibold">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!error}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? 'border-danger focus:ring-danger/20' : 'border-border hover:border-outline'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="text-xs text-danger font-medium" role="alert">{error}</p>}
      {helperText && !error && <p id={`${inputId}-helper`} className="text-xs text-outline">{helperText}</p>}
    </div>
  );
}
