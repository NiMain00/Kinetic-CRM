import { create } from 'zustand';
import type {
  Project,
  RksData,
  LphsData,
  LphsDepartmentApproval,
  CompetitorEntry,
  DocGroup,
  TimelineEvent,
} from '@/types/domain';
import { projectService } from '@/services/projects';
import { masterDataService } from '@/services/master-data';
import { useMasterDataStore } from './masterDataStore';
import { useApprovalStore } from './approvalStore';
import { useNotificationStore } from './notificationStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';
import { eventBus } from '@/services/eventBridge';

async function persistCompetitorsToBackend(projectId: string, competitors: CompetitorEntry[]) {
  try {
    const masterStore = useMasterDataStore.getState();
    const masterComps = masterStore.competitors || [];
    const creates: Array<{ competitorId: string; competitorPrice: number | null; advantageNote: string | null; notes: string | null }> = [];

    for (const comp of competitors) {
      const existing = masterComps.find(
        (mc) => mc.name.toLowerCase() === comp.name.toLowerCase(),
      );
      if (existing) {
        creates.push({
          competitorId: existing.id,
          competitorPrice: comp.estPrice || null,
          advantageNote: comp.advantages?.join('\n') || null,
          notes: comp.notes || null,
        });
      } else {
        try {
          const res = await masterDataService.create('competitors', {
            name: comp.name,
            code: comp.name.substring(0, 50),
            isActive: true,
          } as any);
          const newComp = (res.data?.data || res.data) as any;
          creates.push({
            competitorId: newComp.id,
            competitorPrice: comp.estPrice || null,
            advantageNote: comp.advantages?.join('\n') || null,
            notes: comp.notes || null,
          });
        } catch {
          console.warn('[competitor-persist] Gagal buat competitor:', comp.name);
        }
      }
    }

    if (creates.length > 0) {
      await projectService.update(projectId, {
        projectCompetitors: {
          deleteMany: {},
          create: creates,
        },
      } as any);
    }
  } catch (err) {
    console.error('[competitor-persist] Gagal:', err);
  }
}

interface ProjectState {
  entities: Record<string, Project>;
  ids: string[];
  projects: Project[];
  loading: boolean;
  _lastFetchAt: number | null;

  fetchProjects: (params?: any) => Promise<void>;
  fetchProject: (id: string) => Promise<Project | undefined>;
  addProject: (p: Project) => void;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
  updateProjectRks: (id: string, rks: RksData) => Promise<void>;
  updateProjectLphs: (id: string, lphs: LphsData) => void;
  updateLphsDepartmentApproval: (id: string, approval: LphsDepartmentApproval) => void;
  updateLphsStatus: (id: string, status: Partial<Pick<LphsData, 'pmStatus' | 'mgmtStatus' | 'overallStatus'>>) => void;
  updateProjectPricing: (id: string, pricing: Partial<Project['pricing']>) => void;
  updateProjectCompetitors: (id: string, competitors: CompetitorEntry[]) => Promise<void>;
  addProjectCompetitor: (id: string, competitor: CompetitorEntry) => Promise<void>;
  removeProjectCompetitor: (id: string, competitorId: string) => Promise<void>;
  updateProjectWinner: (id: string, winnerDetails: Partial<Project['winnerDetails']>) => void;
  updateProjectDelivery: (id: string, delivery: Partial<Project['delivery']>) => void;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateProjectDocuments: (id: string, documents: DocGroup[]) => void;
  updateProjectScope: (id: string, scopeDepartments: string[]) => void;
  updateProjectStage: (id: string, stageId: string) => void;
}

function deriveProjects(entities: Record<string, Project>, ids: string[]): Project[] {
  const arr: Project[] = new Array(ids.length);
  for (let i = 0; i < ids.length; i++) {
    arr[i] = entities[ids[i]];
  }
  return arr;
}

function normalizeProjects(projects: Project[]): {
  entities: Record<string, Project>;
  ids: string[];
} {
  const entities: Record<string, Project> = {};
  const ids: string[] = new Array(projects.length);
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    entities[p.id] = p;
    ids[i] = p.id;
  }
  return { entities, ids };
}

function updateEntity(
  entities: Record<string, Project>,
  ids: string[],
  id: string,
  updater: (e: Project) => Project,
): { entities: Record<string, Project>; projects: Project[] } {
  const existing = entities[id];
  if (!existing) {
    return { entities, projects: deriveProjects(entities, ids) };
  }
  const next = { ...entities, [id]: updater(existing) };
  return { entities: next, projects: deriveProjects(next, ids) };
}

function mapBackendLphsToFrontend(lphsSios: any): LphsData {
  const mapPmStatus = (s: string): 'pending' | 'reviewing' | 'approved' | 'revision' => {
    if (s === 'approved') return 'approved';
    if (s === 'revision_requested') return 'revision';
    if (s === 'pending_pm') return 'pending';
    return 'reviewing';
  };
  const mapMgmtStatus = (s: string): 'pending' | 'approved' | 'revision' => {
    if (s === 'approved') return 'approved';
    if (s === 'revision_requested') return 'revision';
    return 'pending';
  };
  return {
    lphsFileName: lphsSios.lphsFileName || undefined,
    lphsFileSize: lphsSios.lphsFileSize || undefined,
    lphsExternalUrl: lphsSios.lphsExternalUrl || undefined,
    siosFileName: lphsSios.siosFileName || undefined,
    siosFileSize: lphsSios.siosFileSize || undefined,
    selectedDepartments: lphsSios.selectedDepartments
      ? (typeof lphsSios.selectedDepartments === 'string'
          ? JSON.parse(lphsSios.selectedDepartments)
          : lphsSios.selectedDepartments)
      : [],
    departmentsLocked: lphsSios.departmentsLocked || false,
    pmStatus: mapPmStatus(lphsSios.pmApprovalStatus),
    mgmtStatus: mapMgmtStatus(lphsSios.mgmtApprovalStatus),
    overallStatus: (['draft', 'dept_review', 'mgmt_review', 'approved', 'revision'] as const).includes(lphsSios.overallStatus)
      ? lphsSios.overallStatus
      : 'draft',
    submittedAt: lphsSios.submittedAt ? new Date(lphsSios.submittedAt).toISOString() : undefined,
    pmApprovedAt: lphsSios.pmApprovedAt ? new Date(lphsSios.pmApprovedAt).toISOString() : undefined,
    mgmtApprovedAt: lphsSios.mgmtApprovedAt ? new Date(lphsSios.mgmtApprovedAt).toISOString() : undefined,
    finalApprovedAt: lphsSios.finalApprovedAt ? new Date(lphsSios.finalApprovedAt).toISOString() : undefined,
    departmentApprovals: Array.isArray(lphsSios.departmentReviews)
      ? lphsSios.departmentReviews.map((dr: any) => ({
          departmentId: dr.departmentId,
          departmentName: dr.department?.name || dr.departmentId,
          status: dr.approvalStatus === 'approved' ? 'approved' : dr.approvalStatus === 'revision_requested' ? 'revision' : 'reviewing',
          approverName: dr.reviewer?.fullName || undefined,
          approvedAt: dr.reviewedAt ? new Date(dr.reviewedAt).toISOString() : undefined,
          reviewNotes: dr.comment || undefined,
          revisionRound: dr.revisionRound || 0,
          isTargetedRevision: dr.isTargetedRevision || false,
        }))
      : [],
  };
}

function normalizeRksAnswers(rks: any): any {
  if (!rks) return rks;
  // Safety: answers dari DB mungkin string (legacy double-encode) — normalize ke object
  if (rks.answers && typeof rks.answers === 'string') {
    try { rks.answers = JSON.parse(rks.answers); } catch { rks.answers = {}; }
  }
  // uploadedFiles mungkin juga string JSON dari legacy data
  if (rks.uploadedFiles && typeof rks.uploadedFiles === 'string') {
    try { rks.uploadedFiles = JSON.parse(rks.uploadedFiles); } catch { rks.uploadedFiles = []; }
  }
  return rks;
}

function mapApiProject(p: any): Project {
  const { priceSubmission: ps, projectCompetitors, tenderResult, deliveryTarget, lphsSios, ...rest } = p;
  if (rest.rks) rest.rks = normalizeRksAnswers(rest.rks);
  return {
    ...rest,
    pricing: ps ? {
      value: Number(ps.ourPrice),
      margin: Number(ps.marginPercentage),
      note: ps.note || '',
      bottomPrice: ps.bottomPrice ? Number(ps.bottomPrice) : undefined,
    } : p.pricing || undefined,
    competitors: Array.isArray(projectCompetitors)
      ? projectCompetitors.map((pc: any) => ({
          id: pc.id,
          name: pc.competitor?.name || pc.competitorId,
          estPrice: Number(pc.competitorPrice) || 0,
          advantages: pc.advantageNote ? pc.advantageNote.split('\n').filter(Boolean) : [],
          notes: pc.notes || '',
        }))
      : p.competitors || [],
    winnerDetails: tenderResult ? {
      outcome: tenderResult.result === 'won' ? 'menang' : tenderResult.result === 'lost' ? 'kalah' : null,
      contractValue: tenderResult.contractValue ? Number(tenderResult.contractValue) : undefined,
      startDate: tenderResult.startDate
        ? (() => {
            const d = new Date(tenderResult.startDate);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          })()
        : undefined,
      duration: tenderResult.durationDays != null ? Number(tenderResult.durationDays) : undefined,
      loseReason: p.winnerDetails?.loseReason || undefined,
      loseNote: tenderResult.lossReasonNote || p.winnerDetails?.loseNote || undefined,
      spkDocument: tenderResult.spkDocument ? (typeof tenderResult.spkDocument === 'string' ? JSON.parse(tenderResult.spkDocument) : tenderResult.spkDocument) : p.winnerDetails?.spkDocument || undefined,
    } : p.winnerDetails || undefined,
    lphs: lphsSios ? mapBackendLphsToFrontend(lphsSios) : p.lphs || undefined,
    delivery: deliveryTarget ? {
      startDate: deliveryTarget.startDate || undefined,
      endDate: deliveryTarget.endDate || undefined,
      actualEndDate: deliveryTarget.actualEndDate || undefined,
      note: deliveryTarget.note || undefined,
      isCompleted: deliveryTarget.isCompleted || undefined,
      completedAt: deliveryTarget.completedAt || undefined,
      completedBy: deliveryTarget.completedBy || undefined,
    } : p.delivery || undefined,
    timeline: (p.timeline || p.timelineEvents || []).map((evt: any) => ({
      ...evt,
      actor: evt.actorUser?.fullName || evt.actor,
    })),
    estimatedValue: p.estimatedValue != null ? Number(p.estimatedValue) : 0,
    author: p.author || p.ownerUser?.fullName || p.createdBy?.fullName || p.createdByUserId || '',
    date: p.date || p.createdAt || '',
  };
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
      entities: {},
      ids: [],
      projects: [],
      loading: false,
      _lastFetchAt: null,

      fetchProjects: async (params) => {
        const now = Date.now();
        const last = get()._lastFetchAt;
        // Skip jika sudah di-fetch dalam 30 detik terakhir (cegah duplicate call)
        if (last && last > now - 30000) return;
        set({ loading: true });
        try {
          const res = await projectService.list(params);
          const data = res.data.data || res.data;
          const list = Array.isArray(data) ? data : [];
          const mapped = list.map(mapApiProject);
          const { entities, ids } = normalizeProjects(mapped);
          set({ entities, ids, projects: deriveProjects(entities, ids), loading: false, _lastFetchAt: Date.now() });
        } catch {
          set({ loading: false });
        }
      },

      fetchProject: async (id) => {
        try {
          const res = await projectService.get(id);
          const project = res.data.data ? mapApiProject(res.data.data) : mapApiProject(res.data);
          if (project?.id) {
            set((s) => {
              const existing = s.entities[id];
              const merged = {
                ...project,
                // Data lokal selalu diutamakan — baru fallback ke API
                competitors: existing?.competitors?.length ? existing.competitors : (project.competitors || []),
                winnerDetails: existing?.winnerDetails || project.winnerDetails || undefined,
                delivery: existing?.delivery || project.delivery || undefined,
                pricing: existing?.pricing || project.pricing || undefined,
                lphs: existing?.lphs || project.lphs || undefined,
                rks: existing?.rks || project.rks || undefined,
              };
              const entities = { ...s.entities, [project.id]: merged };
              const ids = s.ids.includes(project.id) ? s.ids : [...s.ids, project.id];
              return { entities, ids, projects: deriveProjects(entities, ids) };
            });
          }
          return project;
        } catch {
          set((s) => {
            if (!s.entities[id]) return s;
            const entities = { ...s.entities };
            delete entities[id];
            const ids = s.ids.filter((i) => i !== id);
            return { entities, ids, projects: deriveProjects(entities, ids) };
          });
          return undefined;
        }
      },

      addProject: (p) =>
        set((s) => {
          const entities = { ...s.entities, [p.id]: p };
          const ids = [...s.ids, p.id];
          return { entities, ids, projects: deriveProjects(entities, ids) };
        }),

      createProject: async (data) => {
        const { id, pricing, competitors, winnerDetails, delivery, rks, lphs, timeline, ...clean } = data as any;
        if (clean.scopeDepartments && Array.isArray(clean.scopeDepartments)) {
          clean.scopeDepartments = JSON.stringify(clean.scopeDepartments);
        }
        if (clean.deadlineTender === undefined || clean.deadlineTender === '') {
          delete clean.deadlineTender;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean.deadlineTender)) {
          clean.deadlineTender = clean.deadlineTender + 'T00:00:00.000Z';
        }
        if (clean.estimatedValue !== undefined) {
          clean.estimatedValue = Number(clean.estimatedValue);
        }
        if (timeline?.length) {
          clean.timelineEvents = {
            create: timeline.map((evt: any) => {
              const { id, projectId, prospectId, createdAt, ...rest } = evt;
              return {
                ...rest,
                actor: clean.createdByUserId || clean.ownerUserId || evt.actor,
                time: evt.time ? new Date(evt.time).toISOString() : undefined,
              };
            }),
          };
        }
        const res = await projectService.create(clean);
        const project = mapApiProject(res.data.data || res.data);
        set((s) => {
          const entities = { ...s.entities, [project.id]: project };
          const ids = [...s.ids, project.id];
          return { entities, ids, projects: deriveProjects(entities, ids) };
        });
        return project;
      },

      updateProject: async (id, data) => {
        const { pricing, competitors, winnerDetails, delivery, rks, lphs, timeline, ...clean } = data as any;
        if (clean.scopeDepartments && Array.isArray(clean.scopeDepartments)) {
          clean.scopeDepartments = JSON.stringify(clean.scopeDepartments);
        }
        if (clean.deadlineTender === undefined || clean.deadlineTender === '') {
          delete clean.deadlineTender;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean.deadlineTender)) {
          clean.deadlineTender = clean.deadlineTender + 'T00:00:00.000Z';
        }
        if (timeline?.length) {
          const proj = get().entities[id];
          const actorId = proj?.createdByUserId || proj?.ownerUserId;
          clean.timelineEvents = {
            create: timeline.map((evt: any) => {
              const { id, projectId, prospectId, createdAt, ...rest } = evt;
              return {
                ...rest,
                actor: actorId || evt.actor,
                time: evt.time ? new Date(evt.time).toISOString() : undefined,
              };
            }),
          };
        }
        try {
          await projectService.update(id, clean);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            console.warn(`[projectStore] Project ${id} not found on backend, removing from local store`);
            set((s) => {
              const entities = { ...s.entities };
              delete entities[id];
              const ids = s.ids.filter((i) => i !== id);
              return { entities, ids, projects: deriveProjects(entities, ids) };
            });
            return;
          }
          throw err;
        }
        const current = get().entities[id];
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            ...data,
            updatedAt: new Date().toISOString(),
          }));
          return { ...r, ids: s.ids };
        });
        if (data.status && current && current.status !== data.status) {
          const addNotification = useNotificationStore.getState().addNotification;
          addNotification({
            title: 'Status Proyek Berubah',
            message: `Proyek "${current.name}" berubah status dari "${current.status}" menjadi "${data.status}".`,
            type: 'status_change',
            entityId: id,
            entityType: 'project',
          });
          // Cek apakah sudah ada timeline event untuk perubahan status ini (dicegah duplikasi)
          const hasStatusEvent = (data.timeline || []).some(
            (e: any) => e.type === 'status_change' && e.title?.includes('Status Proyek Berubah')
          );
          if (!hasStatusEvent) {
            get().addTimelineEvent(id, {
              id: `evt-${id}-status-${Date.now()}`,
              title: 'Status Proyek Berubah',
              actor: 'System',
              role: 'System',
              time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              type: 'status_change',
              prevVal: current.status,
              newVal: data.status,
              description: `Status berubah dari "${current.status}" menjadi "${data.status}".`,
            });
          }
        }
      },

      deleteProject: async (id) => {
        const project = get().entities[id];
        try {
          await projectService.delete(id);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            console.warn(`[projectStore] Project ${id} not found on backend, removing from local store anyway`);
          } else {
            console.error('[projectStore] deleteProject API gagal:', err?.response?.data || err);
            throw err;
          }
        }
        // Hapus dari store lokal setelah sukses API
        const approvalStore = useApprovalStore.getState();
        approvalStore.approvals
          .filter((a) => a.entityType === 'project' && a.entityId === id)
          .forEach((a) => approvalStore.removeApproval(a.id));
        if (project) {
          eventBus.emit({
            type: 'PROJECT_DELETED',
            projectId: id,
            projectName: project.name,
            sourceProspectId: project.sourceProspectId,
            timestamp: new Date().toISOString(),
          });
        }
        set((s) => {
          const entities = { ...s.entities };
          delete entities[id];
          const ids = s.ids.filter((i) => i !== id);
          return { entities, ids, projects: deriveProjects(entities, ids) };
        });
      },

      getProjectById: (id) => get().entities[id],

      updateProjectRks: async (id, rks) => {
        try {
          const { uploadedFiles, ...clean } = rks as any;
          if (clean.deadlineTender === '' || clean.deadlineTender === undefined) {
            delete clean.deadlineTender;
          } else if (typeof clean.deadlineTender === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clean.deadlineTender)) {
            clean.deadlineTender = clean.deadlineTender + 'T00:00:00.000Z';
          }
          // Prisma Json field — kirim sebagai object, bukan string (agar tidak double-encode)
          // (tidak perlu JSON.stringify karena Prisma handle serialisasi object ke JSON)
          await projectService.update(id, { rks: { upsert: { create: clean, update: clean } } } as any);
        } catch (err: any) {
          if (err?.response?.status === 404) {
            console.warn(`[projectStore] Project ${id} not found on backend for RKS update, removing from local store`);
            set((s) => {
              const entities = { ...s.entities };
              delete entities[id];
              const ids = s.ids.filter((i) => i !== id);
              return { entities, ids, projects: deriveProjects(entities, ids) };
            });
            return;
          }
          console.error('[projectStore] updateProjectRks API failed:', err);
        }
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, rks }));
          return { ...r, ids: s.ids };
        });
      },
      updateProjectLphs: (id, lphs) => {
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, lphs }));
          return { ...r, ids: s.ids };
        });
        const proj = get().entities[id];
        if (!proj) return;
        const deptStr = Array.isArray(lphs.selectedDepartments) ? JSON.stringify(lphs.selectedDepartments) : lphs.selectedDepartments;
        const mapStatus = (s: string) => {
          if (s === 'approved') return 'approved';
          if (s === 'revision') return 'revision_requested';
          if (s === 'pending') return 'pending_pm';
          return s === 'reviewing' ? 'reviewing' : s;
        };
        projectService.update(id, {
          lphsSios: {
            upsert: {
              create: {
                lphsFileName: lphs.lphsFileName || null,
                lphsFileSize: lphs.lphsFileSize || null,
                lphsExternalUrl: lphs.lphsExternalUrl || null,
                siosFileName: lphs.siosFileName || null,
                siosFileSize: lphs.siosFileSize || null,
                selectedDepartments: deptStr || null,
                departmentsLocked: lphs.departmentsLocked || false,
                pmApprovalStatus: mapStatus(lphs.pmStatus) as any,
                mgmtApprovalStatus: mapStatus(lphs.mgmtStatus) as any,
                overallStatus: lphs.overallStatus || 'draft',
                submittedAt: lphs.submittedAt ? new Date(lphs.submittedAt) : null,
                pmApprovedAt: lphs.pmApprovedAt ? new Date(lphs.pmApprovedAt) : null,
                mgmtApprovedAt: lphs.mgmtApprovedAt ? new Date(lphs.mgmtApprovedAt) : null,
                finalApprovedAt: lphs.finalApprovedAt ? new Date(lphs.finalApprovedAt) : null,
              },
              update: {
                lphsFileName: lphs.lphsFileName || null,
                lphsFileSize: lphs.lphsFileSize || null,
                lphsExternalUrl: lphs.lphsExternalUrl || null,
                siosFileName: lphs.siosFileName || null,
                siosFileSize: lphs.siosFileSize || null,
                selectedDepartments: deptStr || null,
                departmentsLocked: lphs.departmentsLocked || false,
                pmApprovalStatus: mapStatus(lphs.pmStatus) as any,
                mgmtApprovalStatus: mapStatus(lphs.mgmtStatus) as any,
                overallStatus: lphs.overallStatus || 'draft',
                submittedAt: lphs.submittedAt ? new Date(lphs.submittedAt) : null,
                pmApprovedAt: lphs.pmApprovedAt ? new Date(lphs.pmApprovedAt) : null,
                mgmtApprovedAt: lphs.mgmtApprovedAt ? new Date(lphs.mgmtApprovedAt) : null,
                finalApprovedAt: lphs.finalApprovedAt ? new Date(lphs.finalApprovedAt) : null,
              },
            },
          },
        } as any).catch((err) => console.error('[lphs-persist] Gagal:', err));
      },
      updateLphsDepartmentApproval: (id, approval) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => {
            if (!e.lphs) return e;
            const existing = e.lphs.departmentApprovals.findIndex(
              (a) => a.departmentId === approval.departmentId,
            );
            const newApprovals =
              existing >= 0
                ? e.lphs.departmentApprovals.map((a, i) => (i === existing ? approval : a))
                : [...e.lphs.departmentApprovals, approval];
            return { ...e, lphs: { ...e.lphs, departmentApprovals: newApprovals } };
          });
          return { ...r, ids: s.ids };
        }),
      updateLphsStatus: (id, status) =>
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => {
            if (!e.lphs) return e;
            return { ...e, lphs: { ...e.lphs, ...status } };
          });
          return { ...r, ids: s.ids };
        }),
      updateProjectPricing: (id, pricing) => {
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            pricing: { ...e.pricing, ...pricing } as Project['pricing'],
          }));
          return { ...r, ids: s.ids };
        });
        // Debounce persist ke backend
        if ((window as any).__pricingDebounce) clearTimeout((window as any).__pricingDebounce);
        (window as any).__pricingDebounce = setTimeout(() => {
          const proj = get().entities[id];
          if (!proj) return;
          projectService.update(id, {
            priceSubmission: {
              upsert: {
                create: {
                  ourPrice: proj.pricing?.value || 0,
                  marginPercentage: proj.pricing?.margin || 0,
                  note: proj.pricing?.note || null,
                  bottomPrice: proj.pricing?.bottomPrice || null,
                  submittedBy: proj.createdByUserId || 'system',
                },
                update: {
                  ourPrice: proj.pricing?.value || 0,
                  marginPercentage: proj.pricing?.margin || 0,
                  note: proj.pricing?.note || null,
                  bottomPrice: proj.pricing?.bottomPrice || null,
                },
              },
            },
          } as any).catch((err: any) => console.error('[pricing-persist] Gagal:', err));
        }, 800);
      },
      updateProjectCompetitors: async (id, competitors) => {
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, competitors }));
          return { ...r, ids: s.ids };
        });
        await persistCompetitorsToBackend(id, competitors);
      },
      addProjectCompetitor: async (id, competitor) => {
        let newList: CompetitorEntry[] = [];
        set((s) => {
          const existing = s.entities[id]?.competitors || [];
          newList = [...existing, competitor];
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            competitors: newList,
          }));
          return { ...r, ids: s.ids };
        });
        await persistCompetitorsToBackend(id, newList);
      },
      removeProjectCompetitor: async (id, competitorId) => {
        let newList: CompetitorEntry[] = [];
        set((s) => {
          const existing = s.entities[id]?.competitors || [];
          newList = existing.filter((c) => c.id !== competitorId);
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            competitors: newList,
          }));
          return { ...r, ids: s.ids };
        });
        await persistCompetitorsToBackend(id, newList);
      },
      updateProjectWinner: (id, winnerDetails) => {
        const wd: Partial<Project['winnerDetails']> = winnerDetails ?? {};
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            winnerDetails: { ...e.winnerDetails, ...wd } as Project['winnerDetails'],
          }));
          return { ...r, ids: s.ids };
        });
        const proj = get().entities[id];
        if (!proj || !wd.outcome) return;
        const decidedBy = proj.createdByUserId || proj.ownerUserId || 'system';
        const startDate = wd.startDate ? new Date(wd.startDate) : null;
        const durationDays = wd.duration != null && !Number.isNaN(Number(wd.duration)) ? Number(wd.duration) : null;
        projectService.update(id, {
          tenderResult: {
            upsert: {
              create: {
                result: wd.outcome === 'menang' ? 'won' : 'lost' as const,
                contractValue: wd.contractValue ?? null,
                startDate,
                durationDays,
                lossReasonNote: wd.loseNote || wd.loseReason || null,
                spkDocument: wd.spkDocument ? JSON.stringify(wd.spkDocument) : null,
                decidedBy,
              },
              update: {
                result: wd.outcome === 'menang' ? 'won' : 'lost' as const,
                contractValue: wd.contractValue ?? null,
                startDate,
                durationDays,
                lossReasonNote: wd.loseNote || wd.loseReason || null,
                spkDocument: wd.spkDocument ? JSON.stringify(wd.spkDocument) : null,
              },
            },
          },
        } as any).catch((err) => console.error('[winner-persist] Gagal:', err));
      },
      updateProjectDelivery: async (id, delivery) => {
        try {
          await projectService.update(id, {
            deliveryTarget: { upsert: { create: delivery as any, update: delivery as any } },
          } as any);
        } catch (err) {
          console.error('[projectStore] updateProjectDelivery API failed:', err);
        }
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            delivery: { ...e.delivery, ...delivery } as Project['delivery'],
          }));
          return { ...r, ids: s.ids };
        });
      },
      addTimelineEvent: (id, event) => {
        const idSet = new Set(get().entities[id]?.timeline?.map((e) => e.id));
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({
            ...e,
            timeline: [...(e.timeline || []), event],
          }));
          return { ...r, ids: s.ids };
        });
        // Hanya persist ke backend jika event id belum ada (cegah duplikat dari status_change auto)
        if (event.id && idSet.has(event.id)) return;
        // Gunakan user ID (bukan display name) untuk FK actor → User.id
        const proj = get().entities[id];
        const actorId = proj?.createdByUserId || proj?.ownerUserId || event.actor;
        projectService.update(id, {
          timelineEvents: {
            create: {
              title: event.title,
              actor: actorId,
              role: event.role || null,
              time: event.time ? new Date(event.time).toISOString() : new Date().toISOString(),
              type: event.type,
              description: event.description || null,
              prevVal: event.prevVal || null,
              newVal: event.newVal || null,
              fileName: event.fileName || null,
              fileSize: event.fileSize || null,
            },
          },
        } as any).catch((err) => console.error('[timeline-persist] Gagal menyimpan event:', err));
      },
      updateProjectDocuments: async (id, documents) => {
        try {
          await projectService.update(id, { documents: JSON.stringify(documents) } as any);
        } catch (err) {
          console.error('[projectStore] updateProjectDocuments API failed:', err);
        }
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, documents }));
          return { ...r, ids: s.ids };
        });
      },
      updateProjectScope: async (id, scopeDepartments) => {
        try {
          const deptCreate = scopeDepartments.map((deptId: string) => ({ departmentId: deptId }));
          await projectService.update(id, {
            scopeDepartments: JSON.stringify(scopeDepartments),
            departments: { deleteMany: {}, create: deptCreate },
          } as any);
        } catch (err) {
          console.error('[projectStore] updateProjectScope API failed:', err);
        }
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, scopeDepartments }));
          return { ...r, ids: s.ids };
        });
      },
      updateProjectStage: async (id, stageId) => {
        try {
          await projectService.update(id, { currentStageId: stageId } as any);
        } catch (err) {
          console.error('[projectStore] updateProjectStage API failed:', err);
        }
        set((s) => {
          const r = updateEntity(s.entities, s.ids, id, (e) => ({ ...e, currentStageId: stageId }));
          return { ...r, ids: s.ids };
        });
      },
    }));
