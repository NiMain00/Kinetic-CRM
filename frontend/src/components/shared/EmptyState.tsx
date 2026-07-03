import React from 'react';
import { Button } from '@/components/ui';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'empty' | 'search' | 'filter';
}

export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction, variant = 'empty' }: EmptyStateProps) {
  const resolvedIcon = icon || (variant === 'search' ? 'search_off' : variant === 'filter' ? 'filter_alt_off' : 'inbox');
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl text-outline" aria-hidden="true">{resolvedIcon}</span>
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-1.5">{title}</h3>
      {description && <p className="text-sm text-secondary max-w-sm mb-6">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
