import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.memo(function Select({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={!!error}
        className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? 'border-danger focus:ring-danger/20' : 'border-outline-variant hover:border-outline'} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger font-medium" role="alert">{error}</p>}
    </div>
  );
});

export default Select;
