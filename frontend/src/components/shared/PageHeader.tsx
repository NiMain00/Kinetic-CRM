import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-responsive-display font-display-title text-on-surface truncate">{title}</h1>
        {description && <p className="text-secondary font-body-main text-xs sm:text-sm mt-1 sm:mt-1.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
