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
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ children, className = '', padding = 'md', header, footer, hover = false }: CardProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl border border-border shadow-sm ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}>
      {header && <div className="border-b border-border px-5 py-4">{header}</div>}
      <div className={header && padding !== 'none' ? paddings[padding] : paddings[padding]}>
        {children}
      </div>
      {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
    </div>
  );
}
