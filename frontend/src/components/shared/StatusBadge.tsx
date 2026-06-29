import React, { useMemo } from 'react';
import { Badge } from '@/components/ui';
import { useMasterDataStore } from '@/stores/masterDataStore';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const FALLBACK_VARIANT_MAP: Record<string, BadgeVariant> = {
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
  // Prospect statuses
  'non potensial': 'default',
  potensial: 'success',
  'waiting pm': 'info',
  revision: 'warning',
  'perlu verifikasi': 'info',
};

function hexToBadgeVariant(hex: string): BadgeVariant {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  // Gray-ish
  if (Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && Math.abs(r - b) < 40) return 'default';
  // Red / dark red
  if (r > 160 && g < 100 && b < 100) return 'danger';
  // Green / teal
  if (g > 140 && r < 140 && b < 140) return 'success';
  // Purple / indigo
  if (b > 100 && r > 60 && g < 100) return 'purple';
  if (r > 100 && b > 100 && g < 100) return 'purple';
  // Blue
  if (b > 130 && r < 150 && g < 150) return 'info';
  // Orange / amber
  if (r > 180 && g > 80 && b < 80) return 'warning';

  return 'default';
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const projectStatuses = useMasterDataStore((s) => s.projectStatuses);

  const variant = useMemo<BadgeVariant>(() => {
    const key = status.toLowerCase();

    // Try dynamic lookup from store config first
    const match = projectStatuses.find((ps) => ps.code.toLowerCase() === key);
    if (match) {
      return hexToBadgeVariant(match.color_hex);
    }

    // Fall back to hardcoded map
    return FALLBACK_VARIANT_MAP[key] || 'default';
  }, [status, projectStatuses]);

  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
