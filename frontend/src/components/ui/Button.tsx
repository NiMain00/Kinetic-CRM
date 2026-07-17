import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  responsive?: boolean;
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-light shadow-sm hover:shadow-md active:shadow-sm',
  secondary: 'bg-surface text-on-surface border border-border hover:bg-surface-container',
  ghost: 'text-secondary hover:bg-surface-container hover:text-primary',
  danger: 'bg-danger text-white hover:opacity-90 shadow-sm',
  outline: 'bg-surface text-primary border border-primary/30 hover:bg-primary/5',
  success: 'bg-success text-white hover:opacity-90 shadow-sm',
  warning: 'bg-gold text-white hover:opacity-90 shadow-sm',
};

const sizes = {
  xs: 'px-2.5 py-1 text-[11px]',
  sm: 'px-3.5 py-1.5 text-xs',
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
  fullWidth = false,
  responsive = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-label-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${responsive ? 'btn-full-mobile' : ''} ${className}`}
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
