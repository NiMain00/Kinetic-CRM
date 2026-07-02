import type { Project } from '@/types/domain';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from './procurementStore';

/**
 * Auto-create a Procurement entry from a winning project.
 * Called when PemenangTab sets outcome to 'menang'.
 */
export function createProcurementFromProject(project: Project): Procurement {
  const store = useProcurementStore.getState();
  const procurement = store.addProcurement({
    sourceProjectId: project.id,
    sourceProjectCode: project.code,
    client: project.client,
    contractValue: project.winnerDetails?.contractValue || project.estimatedValue || 0,
    location: project.location,
    createdBy: project.author,
    createdByUserId: project.createdByUserId,
    status: 'Draft',
    phase: 'Draft',
    // Inherit delivery data if project already has it
    targetStartDate: project.delivery?.startDate,
    targetEndDate: project.delivery?.endDate,
    actualEndDate: project.delivery?.actualEndDate,
    deliveryNote: project.delivery?.note,
    isDelivered: project.delivery?.isCompleted,
    deliveredAt: project.delivery?.completedAt,
    deliveredBy: project.delivery?.completedBy,
    // Copy documents & timeline (deep clone)
    documents: project.documents ? JSON.parse(JSON.stringify(project.documents)) : [],
    timeline: project.timeline ? JSON.parse(JSON.stringify(project.timeline)) : [],
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
