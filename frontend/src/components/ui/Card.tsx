import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export default function Card({ children, className = '', padding = 'md', header, footer, hover = false }: CardProps) {
  const hasBg = /\bbg-\S+/.test(className);
  return (
    <div className={`${hasBg ? '' : 'bg-surface'} rounded-xl border border-border/60 shadow-card ${hover ? 'hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5' : ''} ${className}`}>
      {header && <div className="border-b border-border/60 px-4 sm:px-5 py-3 sm:py-4">{header}</div>}
      <div className={header && padding !== 'none' ? paddings[padding] : paddings[padding]}>
        {children}
      </div>
      {footer && <div className="border-t border-border/60 px-4 sm:px-5 py-3 sm:py-4">{footer}</div>}
    </div>
  );
}
