import { eventBus } from '@/services/eventBridge';
import { useRelationStore } from '@/stores/relationStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { createProcurementFromProject } from '@/features/procurement/procurementService';

export function registerEventHandlers(): void {
  // ── PROSPECT CONVERTED ──────────────────────────────────────────────
  // When a prospect is converted to a project, link them and mark converted.
  eventBus.onEvent('PROSPECT_CONVERTED', (event) => {
    const { prospectId, projectId, projectName } = event;

    // Link in relation store
    useRelationStore.getState().linkProspectToProject(prospectId, projectId);

    // Update prospect status
    useProspectStore.getState().updateProspect(prospectId, {
      isConverted: true,
      projectId,
    });

    // Add timeline event to prospect
    useProspectStore.getState().addTimelineEvent(prospectId, {
      id: `evt-${prospectId}-converted-${Date.now()}`,
      title: 'Dikonversi ke Proyek',
      actor: 'System',
      role: 'System',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'approve',
      description: `Prospek dikonversi menjadi proyek "${projectName || projectId}".`,
    });
  });

  // ── PROJECT WON ─────────────────────────────────────────────────────
  // When a project wins tender, create procurement record automatically.
  eventBus.onEvent('PROJECT_WON', async (event) => {
    const { projectId } = event;
    console.log('[PROJECT_WON] Handler triggered for project:', projectId);

    // Try to resolve the project, with a fallback re-query for persist timing
    let project = useProjectStore.getState().getProjectById(projectId);
    if (!project) {
      // Might be a persist hydration delay — try all projects as fallback
      const allProjects = useProjectStore.getState().projects;
      project = allProjects.find((p) => p.id === projectId);
    }
    if (!project) {
      console.warn(`[PROJECT_WON] Project ${projectId} not found — cannot create procurement`);
      return;
    }

    // Prevent duplicate: check relation store AND verify procurements actually exist
    const linkedIds = useRelationStore.getState().getProcurementsByProject(projectId);
    const validLinked = linkedIds.filter((id) => useProcurementStore.getState().entities[id]);
    if (validLinked.length > 0) {
      console.warn('[PROJECT_WON] Valid linked procurements exist:', validLinked);
      return; // Already linked
    }
    // If relation store has stale links (e.g. temp PRC- IDs from failed creates), clean them
    if (linkedIds.length > validLinked.length) {
      const staleIds = linkedIds.filter((id) => !useProcurementStore.getState().entities[id]);
      console.warn('[PROJECT_WON] Cleaning stale relation links:', staleIds);
      for (const staleId of staleIds) {
        useRelationStore.getState().unlinkProjectToProcurement(projectId, staleId);
      }
    }

    try {
      const procurement = await createProcurementFromProject(project);

      // Link in relation store
      useRelationStore.getState().linkProjectToProcurement(projectId, procurement.id);

      // Notify
      useNotificationStore.getState().addNotification({
        title: 'Pengadaan Dibuat',
        message: `Pengadaan ${procurement.code} dibuat otomatis dari proyek ${project.code}`,
        type: 'status_change',
        entityId: procurement.id,
        entityType: 'procurement',
      });
    } catch (err) {
      console.error(`[PROJECT_WON] Failed to create procurement for project ${projectId}:`, err);
    }
  });

  // ── PROJECT DELETED ─────────────────────────────────────────────────
  // Cascade: delete all linked procurements, clean up relations, and reset prospect conversion.
  eventBus.onEvent('PROJECT_DELETED', (event) => {
    const { projectId, sourceProspectId } = event;
    const relationStore = useRelationStore.getState();

    // Reset prospect conversion if linked (from event payload or relation store)
    const linkedProspect = sourceProspectId || relationStore.getProspectByProject(projectId);
    if (linkedProspect) {
      useProspectStore.setState((s) => {
        const entity = s.entities[linkedProspect];
        if (!entity) return s;
        return {
          entities: {
            ...s.entities,
            [linkedProspect]: { ...entity, isConverted: false, projectId: undefined },
          },
        };
      });
      // Background API call — persist to backend
      useProspectStore.getState().updateProspect(linkedProspect, {
        isConverted: false,
        projectId: null,
      } as any).catch(() => {});
    }

    // Get all linked procurements
    const procIds = relationStore.getProcurementsByProject(projectId);
    const procurementStore = useProcurementStore.getState();

    // Delete each linked procurement
    procIds.forEach((procId) => {
      procurementStore.deleteProcurement(procId);
    });

    // Clean up all links for this project
    relationStore.removeAllProjectLinks(projectId);
  });

  // ── PROSPECT DELETED ────────────────────────────────────────────────
  // If prospect has a linked project, also clean up that relation.
  // (Does NOT cascade-delete the project — that's a user decision.)
  eventBus.onEvent('PROSPECT_DELETED', (event) => {
    const { prospectId } = event;
    const relationStore = useRelationStore.getState();

    // If a manual cascade was requested, handle the project deletion
    if (event.cascadeProjectId) {
      const projectStore = useProjectStore.getState();
      const project = projectStore.getProjectById(event.cascadeProjectId);
      if (project) {
        // Emit project deleted so its own handlers fire
        eventBus.emit({
          type: 'PROJECT_DELETED',
          projectId: event.cascadeProjectId,
          projectName: project.name,
          timestamp: event.timestamp,
        });
        projectStore.deleteProject(event.cascadeProjectId);
      }
    }

    // Clean up any lingering prospect relation
    relationStore.unlinkProspectToProject(prospectId);
  });

  // ── PROCUREMENT DELETED ─────────────────────────────────────────────
  // Clean up the relation link when a procurement is deleted.
  eventBus.onEvent('PROCUREMENT_DELETED', (event) => {
    if (event.projectId) {
      useRelationStore
        .getState()
        .unlinkProjectToProcurement(event.projectId, event.procurementId);
    }
  });
}
