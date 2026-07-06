import React, { useMemo } from 'react';
import { Badge } from '@/components/ui';
import { useMasterDataStore } from '@/stores/masterDataStore';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gold';

const FALLBACK_VARIANT_MAP: Record<string, BadgeVariant> = {
  new: 'info',
  baru: 'info',
  contacted: 'warning',
  qualified: 'success',
  proposal: 'purple',
  negotiation: 'gold',
  won: 'success',
  menang: 'success',
  lost: 'danger',
  kalah: 'danger',
  active: 'success',
  berjalan: 'success',
  pending: 'warning',
  completed: 'default',
  selesai: 'default',
  approved: 'success',
  disetujui: 'success',
  rejected: 'danger',
  ditolak: 'danger',
  draft: 'default',
  submitted: 'info',
  in_review: 'warning',
  'non potensial': 'default',
  potensial: 'success',
  'waiting pm': 'info',
  revision: 'warning',
  'perlu verifikasi': 'purple',
  'menunggu': 'warning',
  'follow up': 'info',
  'tender': 'purple',
};

function hexToBadgeVariant(hex: string): BadgeVariant {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  if (Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && Math.abs(r - b) < 40) return 'default';
  if (r > 160 && g < 100 && b < 100) return 'danger';
  if (g > 140 && r < 140 && b < 140) return 'success';
  if (b > 100 && r > 60 && g < 100) return 'purple';
  if (r > 100 && b > 100 && g < 100) return 'purple';
  if (b > 130 && r < 150 && g < 150) return 'info';
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
    const match = projectStatuses.find((ps) => ps.code.toLowerCase() === key);
    if (match && match.color_hex) {
      return hexToBadgeVariant(match.color_hex);
    }
    return FALLBACK_VARIANT_MAP[key] || 'default';
  }, [status, projectStatuses]);

  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
