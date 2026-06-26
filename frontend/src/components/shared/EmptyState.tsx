import React from 'react';
import { Button } from '@/components/ui';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'search_off', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="material-symbols-outlined text-6xl text-outline/30 mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-base font-bold text-on-surface mb-1">{title}</h3>
      {description && <p className="text-sm text-secondary max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
