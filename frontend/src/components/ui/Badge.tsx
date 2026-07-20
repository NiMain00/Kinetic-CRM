import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-secondary-container text-secondary',
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  danger: 'bg-danger-container text-danger',
  info: 'bg-info-container text-info',
  primary: 'bg-primary-container text-primary',
  purple: 'bg-purple-100 text-status-purple',
  gold: 'bg-gold-container text-on-gold',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-xs',
};

const Badge = React.memo(function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-bold tracking-wide rounded-full whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
});

export default Badge;
