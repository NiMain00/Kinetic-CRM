import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none transition-all bg-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary ${leftIcon ? 'pl-9' : ''} ${rightIcon || error ? 'pr-9' : ''} ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-outline-variant hover:border-outline'} ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-sm">
            {rightIcon}
          </span>
        )}
        {error && !rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-danger text-sm material-symbols-outlined" aria-hidden="true">
            warning
          </span>
        )}
      </div>
      {error && <p id={`${inputId}-error`} className="text-xs text-danger font-medium" role="alert">{error}</p>}
      {helperText && !error && <p id={`${inputId}-helper`} className="text-xs text-outline">{helperText}</p>}
    </div>
  );
}
