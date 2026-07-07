import type { Project } from '@/types/domain';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from './procurementStore';
import { deepClone } from '@/utils/clone';

/**
 * Auto-create a Procurement entry from a winning project.
 * Called when PemenangTab sets outcome to 'menang'.
 */
export function createProcurementFromProject(project: Project): Procurement {
  const store = useProcurementStore.getState();

  // Prevent duplicate: check if procurement already exists for this project
  const existing = store.procurements.find(
    (p) => p.sourceProjectId === project.id,
  );
  if (existing) return existing;

  const procurement = store.addProcurement({
    // ── Identity (reference ke source) ──────────────────────────────────
    sourceProjectId: project.id,
    sourceProjectCode: project.code,
    sourceProjectName: project.name,

    // ── Snapshot (copy sekali saat transisi) ────────────────────────────
    client: project.client,
    location: project.location,
    createdBy: project.author,
    createdByUserId: project.createdByUserId,
    contractValue: project.winnerDetails?.contractValue || project.estimatedValue || 0,

    status: 'Draft',
    phase: 'Draft',

    // ── Derived dari project.delivery ───────────────────────────────────
    targetStartDate: project.delivery?.startDate,
    targetEndDate: project.delivery?.endDate,
    actualEndDate: project.delivery?.actualEndDate,
    deliveryNote: project.delivery?.note,
    isDelivered: project.delivery?.isCompleted,
    deliveredAt: project.delivery?.completedAt,
    deliveredBy: project.delivery?.completedBy,

    // ── Deep clone (immutable copy) ─────────────────────────────────────
    documents: project.documents ? deepClone(project.documents) : [],
    timeline: [], // tidak clone timeline proyek — biar terpisah, hanya event pengadaan saja
  });

  // Add timeline event for the creation
  store.addTimelineEvent(procurement.id, {
    id: `evt-${Date.now()}`,
    title: 'Pengadaan Dibuat',
    actor: project.author,
    role: 'System',
    time: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    type: 'approve',
    description: `Pengadaan dibuat otomatis dari proyek ${project.code} yang telah memenangkan tender.`,
  });

  return procurement;
}

/**
 * Migrate all existing projects that are past Pemenang stage.
 * Projects with winnerDetails.outcome === 'menang' and not already
 * converted get a procurement entry.
 */
export function migrateExistingProjects(projects: Project[]): number {
  const store = useProcurementStore.getState();
  const existingIds = new Set(
    store.procurements.map((p) => p.sourceProjectId),
  );
  let count = 0;

  for (const project of projects) {
    const isPastWinner =
      project.status === 'Target Delivery' ||
      project.status === 'Executing' ||
      project.status === 'Completed' ||
      project.status === 'Selesai' ||
      project.winnerDetails?.outcome === 'menang';

    if (isPastWinner && !existingIds.has(project.id)) {
      createProcurementFromProject(project);
      count++;
    }
  }

  return count;
}
