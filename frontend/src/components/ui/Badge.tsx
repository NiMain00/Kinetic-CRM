import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-secondary-container/50 text-on-secondary-container',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  purple: 'bg-status-purple/10 text-status-purple',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
