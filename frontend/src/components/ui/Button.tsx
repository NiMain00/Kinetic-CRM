import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container shadow-sm',
  secondary: 'bg-surface-container-low text-on-surface border border-border hover:bg-surface-container-high',
  ghost: 'text-secondary hover:bg-surface-container-high hover:text-primary',
  danger: 'bg-danger text-on-error hover:opacity-90 border border-danger',
  outline: 'bg-white text-primary border border-border hover:bg-primary/5',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-label-sm font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4" />
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
