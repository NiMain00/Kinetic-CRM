import React from 'react';
import { Badge } from '@/components/ui';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const statusVariantMap: Record<string, BadgeVariant> = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  proposal: 'purple',
  negotiation: 'default',
  won: 'success',
  lost: 'danger',
  active: 'success',
  pending: 'warning',
  completed: 'default',
  approved: 'success',
  rejected: 'danger',
  draft: 'default',
  submitted: 'info',
  in_review: 'warning',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const variant = statusVariantMap[status.toLowerCase()] || 'default';
  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
