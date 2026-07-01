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
      <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-outline/50" aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-2">{title}</h3>
      {description && <p className="text-sm text-secondary max-w-sm mb-6">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
