import type { ProjectPhase } from '@/types/domain/config';

export const DEFAULT_PROJECT_PHASES: ProjectPhase[] = [
  { id: 'phase-draft', status: 'Draft', phase: 'Draft', order: 0, isActive: true },
  { id: 'phase-rks', status: 'RKS', phase: 'RKS', order: 1, isActive: true },
  { id: 'phase-review-rks', status: 'Review RKS', phase: 'Review RKS', order: 2, isActive: true },
  { id: 'phase-lphs', status: 'LPHS/SIOS', phase: 'LPHS/SIOS', order: 3, isActive: true },
  { id: 'phase-harga', status: 'Input Harga', phase: 'Harga', order: 4, isActive: true },
  { id: 'phase-pemenang', status: 'Pemenang', phase: 'Pemenang', order: 5, isActive: true },
  { id: 'phase-selesai', status: 'Selesai', phase: 'Selesai', order: 6, isActive: true },
  { id: 'phase-kalah', status: 'Kalah', phase: 'Selesai', order: 7, isActive: true },
];
