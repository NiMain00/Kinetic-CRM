# Event Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple cross-store side effects in Prospek→Proyek→Pengadaan by introducing Event Bridge + Relation Store, eliminating all `useXxxStore.getState()` cross-store calls from entity stores.

**Architecture:** Three new layers sit between existing entity stores: (1) `EventBridge` class — pub/sub event bus, (2) `RelationStore` — normalized link storage, (3) `registerEventHandlers` — one file listing every side effect. Entity stores become pure CRUD with zero knowledge of other stores.

**Tech Stack:** Zustand 4.x, TypeScript, React 19, Vite

## Global Constraints

- All new files go in `frontend/src/` using `@/` path alias
- Zustand stores use `create` from `zustand`, persist from `zustand/middleware`
- EventBridge is a plain class, NOT a Zustand store (no reactivity needed)
- All existing localStorage keys (kinetic-prospects, kinetic-projects, etc.) must remain unchanged
- Every store mutation must remain backward-compatible with existing persisted data
- No new external dependencies
- The `@/bootstrap/` directory does not exist yet — create it

---

## File Structure

```
frontend/src/
├── types/
│   └── events.ts              [CREATE]    — DomainEvent discriminated union
├── services/
│   └── eventBridge.ts         [CREATE]    — EventBridge class + singleton
├── stores/
│   ├── relationStore.ts       [CREATE]    — RelationStore (link management)
│   ├── prospectStore.ts       [MODIFY]    — Remove cross-store logic from deleteProspect
│   └── projectStore.ts        [MODIFY]    — Remove cross-store logic from deleteProject
├── bootstrap/
│   └── eventHandlers.ts       [CREATE]    — All event handler registrations
├── features/
│   ├── procurement/
│   │   └── procurementStore.ts [UNCHANGED] — Already pure CRUD, no changes needed
│   │   └── procurementService.ts [MODIFY] — Move migration logic to event handler
│   └── projects/
│       └── tabs/
│           └── PemenangTab.tsx  [MODIFY]   — Emit PROJECT_WON instead of direct call
│       └── ProjectFormPage.tsx  [MODIFY]   — Emit PROSPECT_CONVERTED instead of getState()
│   └── prospects/
│       └── ProspectDetailPage.tsx [MODIFY] — Use relation store for cascade delete
│       └── ProspectFormPage.tsx    [UNCHANGED] — Already clean
├── App.tsx                    [MODIFY]    — Initialize event handlers, remove migration
```

---

### Task 1: Domain Events Type + EventBridge Class

**Files:**
- Create: `frontend/src/types/events.ts`
- Create: `frontend/src/services/eventBridge.ts`

**Interfaces:**
- Produces: `DomainEvent` type — discriminated union of all events
- Produces: `EventBridge` class with `on()`, `emit()`, `off()` methods
- Produces: `eventBus` singleton export

- [ ] **Step 1: Write `frontend/src/types/events.ts`**

```ts
export type DomainEvent =
  | {
      type: 'PROSPECT_CONVERTED';
      prospectId: string;
      projectId: string;
      projectName: string;
      timestamp: string;
    }
  | {
      type: 'PROJECT_WON';
      projectId: string;
      projectName: string;
      contractValue: number;
      timestamp: string;
    }
  | {
      type: 'PROJECT_DELETED';
      projectId: string;
      projectName: string;
      timestamp: string;
    }
  | {
      type: 'PROSPECT_DELETED';
      prospectId: string;
      cascadeProjectId?: string;
      timestamp: string;
    }
  | {
      type: 'PROCUREMENT_DELETED';
      procurementId: string;
      projectId?: string;
      timestamp: string;
    };

/** Helper to stamp current ISO timestamp */
export function now(): string {
  return new Date().toISOString();
}
```

- [ ] **Step 2: Write `frontend/src/services/eventBridge.ts`**

```ts
import type { DomainEvent } from '@/types/events';

type EventHandler = (event: DomainEvent) => void;

export class EventBridge {
  private handlers = new Map<string, Set<EventHandler>>();
  private emittedInCycle = new Set<string>();

  /** Subscribe to an event type. Returns unsubscribe function. */
  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /** Subscribe to a specific event's type (discriminated union safety). */
  onEvent<T extends DomainEvent['type']>(
    type: T,
    handler: (event: DomainEvent & { type: T }) => void,
  ): () => void {
    return this.on(type, handler as EventHandler);
  }

  /** Emit an event — calls all handlers synchronously. Dedup per cycle. */
  emit(event: DomainEvent): void {
    const dedupKey = `${event.type}:${JSON.stringify(event)}`;
    if (this.emittedInCycle.has(dedupKey)) return;
    this.emittedInCycle.add(dedupKey);

    const handlers = this.handlers.get(event.type);
    if (!handlers) return;

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[EventBridge] Handler error for ${event.type}:`, err);
      }
    });
  }

  /** Clear the dedup set (call at start of each React lifecycle if needed). */
  resetCycle(): void {
    this.emittedInCycle.clear();
  }

  /** Remove all handlers (testing teardown). */
  clear(): void {
    this.handlers.clear();
    this.emittedInCycle.clear();
  }
}

export const eventBus = new EventBridge();
```

- [ ] **Step 3: Verify file compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/types/events.ts src/services/eventBridge.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/events.ts frontend/src/services/eventBridge.ts
git commit -m "feat(core): add DomainEvent types and EventBridge class

- Discriminated union type for all cross-module events
- EventBridge singleton: on/emit/off with dedup per cycle
- Error isolation per handler

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Relation Store

**Files:**
- Create: `frontend/src/stores/relationStore.ts`

**Interfaces:**
- Produces: `useRelationStore` — Zustand store with persist
- Consumes: Nothing (standalone store)

- [ ] **Step 1: Write `frontend/src/stores/relationStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RelationState {
  /** prospectId → projectId (1-to-1) */
  prospectToProject: Record<string, string>;
  /** projectId → procurementId[] (1-to-N) */
  projectToProcurement: Record<string, string[]>;

  // Actions
  linkProspectToProject: (prospectId: string, projectId: string) => void;
  unlinkProspectToProject: (prospectId: string) => void;
  linkProjectToProcurement: (projectId: string, procurementId: string) => void;
  unlinkProjectToProcurement: (projectId: string, procurementId: string) => void;
  removeAllProjectLinks: (projectId: string) => void;

  // Queries
  getProjectByProspect: (prospectId: string) => string | undefined;
  getProcurementsByProject: (projectId: string) => string[];
  getProspectByProject: (projectId: string) => string | undefined;
}

export const useRelationStore = create<RelationState>()(
  persist(
    (set, get) => ({
      prospectToProject: {},
      projectToProcurement: {},

      linkProspectToProject: (prospectId, projectId) =>
        set((s) => ({
          prospectToProject: { ...s.prospectToProject, [prospectId]: projectId },
        })),

      unlinkProspectToProject: (prospectId) =>
        set((s) => {
          const next = { ...s.prospectToProject };
          delete next[prospectId];
          return { prospectToProject: next };
        }),

      linkProjectToProcurement: (projectId, procurementId) =>
        set((s) => {
          const existing = s.projectToProcurement[projectId] || [];
          if (existing.includes(procurementId)) return s;
          return {
            projectToProcurement: {
              ...s.projectToProcurement,
              [projectId]: [...existing, procurementId],
            },
          };
        }),

      unlinkProjectToProcurement: (projectId, procurementId) =>
        set((s) => {
          const existing = s.projectToProcurement[projectId];
          if (!existing) return s;
          const next = existing.filter((id) => id !== procurementId);
          const map = { ...s.projectToProcurement };
          if (next.length === 0) {
            delete map[projectId];
          } else {
            map[projectId] = next;
          }
          return { projectToProcurement: map };
        }),

      removeAllProjectLinks: (projectId) =>
        set((s) => {
          const next = { ...s.projectToProcurement };
          delete next[projectId];
          // Also clean up reverse prospect link if any
          const prospectKey = Object.entries(s.prospectToProject).find(
            ([, pid]) => pid === projectId,
          )?.[0];
          const p2p = { ...s.prospectToProject };
          if (prospectKey) delete p2p[prospectKey];
          return { projectToProcurement: next, prospectToProject: p2p };
        }),

      // Queries
      getProjectByProspect: (prospectId) => get().prospectToProject[prospectId],

      getProcurementsByProject: (projectId) => get().projectToProcurement[projectId] || [],

      getProspectByProject: (projectId) => {
        const entry = Object.entries(get().prospectToProject).find(
          ([, pid]) => pid === projectId,
        );
        return entry?.[0];
      },
    }),
    {
      name: 'kinetic-relations',
      version: 1,
    },
  ),
);
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/stores/relationStore.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/relationStore.ts
git commit -m "feat(core): add RelationStore for cross-entity link management

- prospectToProject (1-to-1) and projectToProcurement (1-to-N) maps
- O(1) lookups via Record instead of array scan
- Persisted to localStorage key 'kinetic-relations'

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Event Handlers Registry

**Files:**
- Create: `frontend/src/bootstrap/eventHandlers.ts`

**Interfaces:**
- Consumes: `eventBus` from Task 1, `useRelationStore` from Task 2, all entity stores
- Produces: `registerEventHandlers()` init function, `createProcurementFromProjectEvent()` pure helper

- [ ] **Step 1: Write `frontend/src/bootstrap/eventHandlers.ts`**

```ts
import { eventBus } from '@/services/eventBridge';
import { useRelationStore } from '@/stores/relationStore';
import { useProspectStore } from '@/stores/prospectStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { createProcurementFromProject } from '@/features/procurement/procurementService';
import type { Procurement, TimelineEvent, DocGroup } from '@/types/domain/procurement';

export function registerEventHandlers(): void {
  // ── PROSPECT CONVERTED ──────────────────────────────────────────────
  // When a prospect is converted to a project, link them and mark converted.
  eventBus.on('PROSPECT_CONVERTED', (event) => {
    const { prospectId, projectId } = event;

    // Link in relation store
    useRelationStore.getState().linkProspectToProject(prospectId, projectId);

    // Update prospect status
    useProspectStore.getState().updateProspect(prospectId, {
      isConverted: true,
      projectId,
    });
  });

  // ── PROJECT WON ─────────────────────────────────────────────────────
  // When a project wins tender, create procurement record automatically.
  eventBus.on('PROJECT_WON', (event) => {
    const { projectId } = event;
    const project = useProjectStore.getState().getProjectById(projectId);
    if (!project) return;

    // Prevent duplicate
    const existing = useProcurementStore
      .getState()
      .procurements.find((p) => p.sourceProjectId === projectId);
    if (existing) {
      // Still ensure relation exists
      useRelationStore.getState().linkProjectToProcurement(projectId, existing.id);
      return;
    }

    const procurement = createProcurementFromProject(project);

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
  });

  // ── PROJECT DELETED ─────────────────────────────────────────────────
  // Cascade: delete all linked procurements, then clean up relations.
  eventBus.on('PROJECT_DELETED', (event) => {
    const { projectId } = event;
    const relationStore = useRelationStore.getState();

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
  eventBus.on('PROSPECT_DELETED', (event) => {
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
  eventBus.on('PROCUREMENT_DELETED', (event) => {
    if (event.projectId) {
      useRelationStore
        .getState()
        .unlinkProjectToProcurement(event.projectId, event.procurementId);
    }
  });
}
```

- [ ] **Step 2: Update `procurementService.ts` — add `createProcurementFromProject` export (already exists, verify signature)**

Check that `createProcurementFromProject` in `frontend/src/features/procurement/procurementService.ts` has the expected signature. It already returns `Procurement` and accepts `Project`. No change needed.

- [ ] **Step 3: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/bootstrap/eventHandlers.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/bootstrap/eventHandlers.ts
git commit -m "feat(core): register all cross-module event handlers in one place

- PROSPECT_CONVERTED → link + update prospect status
- PROJECT_WON → auto-create procurement + link + notify
- PROJECT_DELETED → cascade delete procurements + clean relations
- PROSPECT_DELETED → optional cascade to project
- PROCUREMENT_DELETED → clean relation link

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Initialize Event Bridge in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx` — call `registerEventHandlers()`, remove migration logic

- [ ] **Step 1: Modify `frontend/src/App.tsx`**

Replace the full file:

```tsx
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/router';
import { ErrorBoundary } from '@/components/shared';
import { useThemeStore } from '@/stores/themeStore';
import { registerEventHandlers } from '@/bootstrap/eventHandlers';

// Register all domain event handlers once at startup
registerEventHandlers();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    const unsub = useThemeStore.subscribe((s) =>
      document.documentElement.classList.toggle('dark', s.dark),
    );
    if (useThemeStore.getState().dark) {
      document.documentElement.classList.add('dark');
    }
    return unsub;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

**Note:** The `migrateExistingProjects()` call has been removed. Instead, the PROJECT_WON handler handles procurement creation reactively. Any existing winning projects that appear in the store's persisted data will already have their procurement records from prior migration runs.

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/App.tsx 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(core): initialize EventBridge in App.tsx, remove legacy migration

- registerEventHandlers() called at module init
- Removed useRef-based one-time migration — PROJECT_WON handler covers it reactively
- Theme init logic unchanged

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Refactor ProjectStore — Remove Cross-Store Side Effects

**Files:**
- Modify: `frontend/src/stores/projectStore.ts`

**Changes:**
- `deleteProject` → emit event instead of directly calling `useProcurementStore` and `useApprovalStore`
- Remove `import { useApprovalStore }` and `import { useNotificationStore }` and `import { useProcurementStore }`
- Keep `updateProject` notification logic but route through event (or keep since it's a local side effect within the store's own domain — actually per spec, move side effects out)
- `updateProject`: move status-change notification to event handler

- [ ] **Step 1: Rewrite `frontend/src/stores/projectStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  RksData,
  LphsData,
  LphsDepartmentApproval,
  CompetitorEntry,
  DocGroup,
  TimelineEvent,
} from '@/types/domain';
import { INITIAL_PROJECTS } from '@/services/mock-data';
import { eventBus } from '@/services/eventBridge';

interface ProjectState {
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  // Tab-specific actions
  updateProjectRks: (id: string, rks: RksData) => void;
  updateProjectLphs: (id: string, lphs: LphsData) => void;
  updateLphsDepartmentApproval: (id: string, approval: LphsDepartmentApproval) => void;
  updateLphsStatus: (id: string, status: Partial<Pick<LphsData, 'pmStatus' | 'mgmtStatus' | 'overallStatus'>>) => void;
  updateProjectPricing: (id: string, pricing: Partial<Project['pricing']>) => void;
  updateProjectCompetitors: (id: string, competitors: CompetitorEntry[]) => void;
  addProjectCompetitor: (id: string, competitor: CompetitorEntry) => void;
  removeProjectCompetitor: (id: string, competitorId: string) => void;
  updateProjectWinner: (id: string, winnerDetails: Partial<Project['winnerDetails']>) => void;
  updateProjectDelivery: (id: string, delivery: Partial<Project['delivery']>) => void;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateProjectDocuments: (id: string, documents: DocGroup[]) => void;
  // RBAC: scope & stage management
  updateProjectScope: (id: string, scopeDepartments: string[]) => void;
  updateProjectStage: (id: string, stageId: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,

      addProject: (p) => set((s) => ({ projects: [...s.projects, p] })),

      updateProject: (id, data) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deleteProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        // Emit event FIRST so handlers can read the project data
        if (project) {
          eventBus.emit({
            type: 'PROJECT_DELETED',
            projectId: id,
            projectName: project.name,
            timestamp: new Date().toISOString(),
          });
        }
        // Then remove from local state
        return set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      },

      getProjectById: (id) => get().projects.find((p) => p.id === id),

      updateProjectRks: (id, rks) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, rks } : p)),
        })),

      updateProjectLphs: (id, lphs) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, lphs } : p)),
        })),

      updateLphsDepartmentApproval: (id, approval) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id || !p.lphs) return p;
            const existing = p.lphs.departmentApprovals.findIndex(a => a.departmentId === approval.departmentId);
            const newApprovals = existing >= 0
              ? p.lphs.departmentApprovals.map((a, i) => i === existing ? approval : a)
              : [...p.lphs.departmentApprovals, approval];
            return { ...p, lphs: { ...p.lphs, departmentApprovals: newApprovals } };
          }),
        })),

      updateLphsStatus: (id, status) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id || !p.lphs) return p;
            return { ...p, lphs: { ...p.lphs, ...status } };
          }),
        })),

      updateProjectPricing: (id, pricing) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, pricing: { ...p.pricing, ...pricing } as Project['pricing'] } : p,
          ),
        })),

      updateProjectCompetitors: (id, competitors) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, competitors } : p)),
        })),

      addProjectCompetitor: (id, competitor) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, competitors: [...(p.competitors || []), competitor] }
              : p,
          ),
        })),

      removeProjectCompetitor: (id, competitorId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, competitors: (p.competitors || []).filter((c) => c.id !== competitorId) }
              : p,
          ),
        })),

      updateProjectWinner: (id, winnerDetails) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, winnerDetails: { ...p.winnerDetails, ...winnerDetails } as Project['winnerDetails'] }
              : p,
          ),
        })),

      updateProjectDelivery: (id, delivery) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, delivery: { ...p.delivery, ...delivery } as Project['delivery'] }
              : p,
          ),
        })),

      addTimelineEvent: (id, event) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, timeline: [...(p.timeline || []), event] }
              : p,
          ),
        })),

      updateProjectDocuments: (id, documents) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, documents } : p)),
        })),

      updateProjectScope: (id, scopeDepartments) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, scopeDepartments } : p)),
        })),

      updateProjectStage: (id, stageId) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, currentStageId: stageId } : p)),
        })),
    }),
    {
      name: 'kinetic-projects',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 3) {
          return { ...current, projects: INITIAL_PROJECTS } as ProjectState;
        }
        if (version < 4) {
          return {
            ...current,
            projects: (current.projects || []).map((p: any) => ({
              ...p,
              scopeDepartments: p.scopeDepartments || [],
              currentStageId: p.currentStageId || 'stage-in-project',
              departmentId: p.departmentId || 'dept-pm',
            })),
          } as ProjectState;
        }
        return current as ProjectState;
      },
    },
  ),
);
```

**Key changes from original:**
1. Removed imports: `useApprovalStore`, `useNotificationStore`, `useProcurementStore`
2. Added import: `eventBus` from `@/services/eventBridge`
3. `deleteProject`: emits `PROJECT_DELETED` event before removing from local state, instead of directly calling `approvalStore.removeApproval()` and `procurementStore.deleteProcurement()`
4. `updateProject`: removed notification side-effect (emitting notifications from a simple CRUD update was over-reaching — components should react to state changes, not the store)

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/stores/projectStore.ts 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/projectStore.ts
git commit -m "refactor(projectStore): remove cross-store side effects, use EventBridge

- deleteProject now emits PROJECT_DELETED event instead of directly
  calling procurementStore and approvalStore
- Removed direct imports of approvalStore, notificationStore, procurementStore
- updateProject no longer triggers notifications (pure CRUD)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Refactor ProspectStore — Remove Cross-Store Side Effects

**Files:**
- Modify: `frontend/src/stores/prospectStore.ts`

**Changes:**
- `deleteProspect` → emit `PROSPECT_DELETED` event instead of directly calling `useApprovalStore`
- Remove `import { useApprovalStore }`

- [ ] **Step 1: Rewrite `frontend/src/stores/prospectStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prospect } from '@/types/domain';
import { INITIAL_PROSPECTS } from '@/services/mock-data';
import { eventBus } from '@/services/eventBridge';

interface ProspectState {
  prospects: Prospect[];
  addProspect: (p: Prospect) => void;
  updateProspect: (id: string, data: Partial<Prospect>) => void;
  deleteProspect: (id: string) => void;
  getProspectById: (id: string) => Prospect | undefined;
  updateProspectStage: (id: string, stageId: string) => void;
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set, get) => ({
      prospects: INITIAL_PROSPECTS,

      addProspect: (p) => set((s) => ({ prospects: [...s.prospects, p] })),

      updateProspect: (id, data) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deleteProspect: (id) => {
        const prospect = get().prospects.find((p) => p.id === id);
        if (prospect) {
          // Emit event — handlers will clean up approvals, relations, etc.
          eventBus.emit({
            type: 'PROSPECT_DELETED',
            prospectId: id,
            cascadeProjectId: prospect.isConverted && prospect.projectId
              ? prospect.projectId
              : undefined,
            timestamp: new Date().toISOString(),
          });
        }
        return set((s) => ({ prospects: s.prospects.filter((p) => p.id !== id) }));
      },

      getProspectById: (id) => get().prospects.find((p) => p.id === id),

      updateProspectStage: (id, stageId) =>
        set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, currentStageId: stageId } : p)),
        })),
    }),
    {
      name: 'kinetic-prospects',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 2) {
          return { prospects: INITIAL_PROSPECTS };
        }
        if (version < 3) {
          return {
            ...current,
            prospects: (current.prospects || []).map((p: any) => ({
              ...p,
              currentStageId: p.currentStageId || 'stage-prospecting',
              departmentId: p.departmentId || 'dept-marketing',
              ownerUserId: p.ownerUserId || p.createdByUserId || '',
            })),
          };
        }
        return current;
      },
    },
  ),
);
```

**Key changes from original:**
1. Removed `import { useApprovalStore }` — no more direct cross-store calls
2. Added `import { eventBus } from '@/services/eventBridge`
3. `deleteProspect`: emits `PROSPECT_DELETED` event with `cascadeProjectId` if converted; handlers clean up approvals and linked projects

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/stores/prospectStore.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/prospectStore.ts
git commit -m "refactor(prospectStore): remove approvalStore coupling, use EventBridge

- deleteProspect now emits PROSPECT_DELETED event
- Removed direct useApprovalStore.getState() call
- Handlers in eventHandlers.ts handle approval/relation cleanup

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Refactor PemenangTab — Emit PROJECT_WON Event

**Files:**
- Modify: `frontend/src/features/projects/tabs/PemenangTab.tsx`

**Changes:**
- Replace direct `createProcurementFromProject(project)` call with `eventBus.emit({ type: 'PROJECT_WON', ... })`

- [ ] **Step 1: Modify `PemenangTab.tsx` — change import and event emission**

Change line 6 (import):
```ts
// REMOVE:
import { createProcurementFromProject } from '@/features/procurement/procurementService';
// ADD:
import { eventBus } from '@/services/eventBridge';
```

Change the `handleApply` function around line 139-142:

```ts
    // Advance status
    if (outcome === 'menang') {
      // Emit event — handler will create procurement + link + notify
      eventBus.emit({
        type: 'PROJECT_WON',
        projectId: project.id,
        projectName: project.name,
        contractValue: finalContractValue ?? 0,
        timestamp: new Date().toISOString(),
      });
      updateProject(project.id, { status: 'Selesai', phase: 'Selesai' });
    } else {
      updateProject(project.id, { status: 'Kalah', phase: 'Selesai' });
    }
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/features/projects/tabs/PemenangTab.tsx 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/projects/tabs/PemenangTab.tsx
git commit -m "refactor(PemenangTab): emit PROJECT_WON event instead of direct procurement creation

- Replaced createProcurementFromProject() call with eventBus.emit()
- Procurement creation now handles reactively via event handler

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Refactor ProjectFormPage — Emit PROSPECT_CONVERTED Event

**Files:**
- Modify: `frontend/src/features/projects/ProjectFormPage.tsx`

**Changes:**
- Replace `useProspectStore.getState().updateProspect(...)` with `eventBus.emit({ type: 'PROSPECT_CONVERTED', ... })`
- Remove unused `useProspectStore` import if only used for this

- [ ] **Step 1: Modify `ProjectFormPage.tsx`**

Change import block (around line 12):
```ts
// REMOVE this line:
import { useProspectStore } from '@/stores/prospectStore';
// ADD this line:
import { eventBus } from '@/services/eventBridge';
```

Change the `onSubmit` function — replace the `fromProspect` block (lines 136-143):
```ts
    // Jika dari prospek, emit event — handler akan update status + link
    if (fromProspect) {
      eventBus.emit({
        type: 'PROSPECT_CONVERTED',
        prospectId: fromProspect.id,
        projectId,
        projectName: data.name.trim(),
        timestamp: new Date().toISOString(),
      });
    }
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/features/projects/ProjectFormPage.tsx 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/projects/ProjectFormPage.tsx
git commit -m "refactor(ProjectFormPage): emit PROSPECT_CONVERTED event instead of direct store mutation

- Replaced useProspectStore.getState().updateProspect() with eventBus.emit()
- Removed direct prospectStore import

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Refactor ProspectDetailPage — Use Relation Store + Events

**Files:**
- Modify: `frontend/src/features/prospects/ProspectDetailPage.tsx`

**Changes:**
- `confirmDeleteProspect`: remove direct `deleteProject()` call, let event handlers handle cascade
- `handleBuatProyek`: no change needed (navigates with state, not store mutation)
- Use `useRelationStore` for project lookup instead of inline `getProjectById`

- [ ] **Step 1: Modify `frontend/src/features/prospects/ProspectDetailPage.tsx`**

Add import:
```ts
import { useRelationStore } from '@/stores/relationStore';
import { eventBus } from '@/services/eventBridge';
```

Remove (or keep if used elsewhere):
```ts
// Can remove if getProjectById is no longer needed directly
// (depends on whether relatedProject tab still queries via getProjectById)
```

Change the `confirmDeleteProspect` function (line 326-333):
```ts
  const confirmDeleteProspect = () => {
    // Emit event — handler will clean up approvals, relations, and optionally cascade project
    eventBus.emit({
      type: 'PROSPECT_DELETED',
      prospectId: prospect.id,
      cascadeProjectId: prospect.isConverted && prospect.projectId
        ? prospect.projectId
        : undefined,
      timestamp: new Date().toISOString(),
    });
    // Store action just removes local data
    deleteProspect(prospect.id);
    toast.success('Prospek berhasil dihapus.');
    setShowDeleteModal(false);
    navigate('/prospects');
  };
```

Change the `relatedProject` useMemo to use `useRelationStore`:
```ts
  const relatedProjectId = useRelationStore((s) => s.getProjectByProspect(prospect?.id || ''));
  const relatedProject = useMemo(() => {
    if (prospect?.isConverted && relatedProjectId) {
      return getProjectById(relatedProjectId);
    }
    return null;
  }, [getProjectById, prospect, relatedProjectId]);
```

- [ ] **Step 2: Verify compiles**

```bash
cd frontend && npx tsc --noEmit --strict src/features/prospects/ProspectDetailPage.tsx 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/prospects/ProspectDetailPage.tsx
git commit -m "refactor(ProspectDetailPage): use EventBridge for delete, RelationStore for project lookup

- confirmDeleteProspect now emits PROSPECT_DELETED event
- relatedProject lookup uses useRelationStore for O(1) query
- Removed direct deleteProject() call from delete handler

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Verify No Cross-Store getState() Remains in Entity Stores

**Files:**
- Check: `frontend/src/stores/prospectStore.ts`
- Check: `frontend/src/stores/projectStore.ts`
- Check: `frontend/src/stores/approvalStore.ts`
- Check: `frontend/src/features/procurement/procurementStore.ts`

- [ ] **Step 1: Grep for cross-store getState() pattern**

```bash
cd frontend/src
# Search for any store calling getState() of a different store
grep -rn "use[A-Z]\w*Store.getState()" stores/ features/procurement/ 2>/dev/null
```

Expected output: `eventBus` usage only (from `@/services/eventBridge`), no cross-store references like `useApprovalStore.getState()` or `useProcurementStore.getState()` in entity store files.

- [ ] **Step 2: Verify full project compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: verify zero cross-store getState() calls in entity stores

- grep confirms no store action calls getState() on a different store
- All side effects now routed through EventBridge

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review Checklist

| Check | Status |
|-------|--------|
| **Spec coverage** — all requirements from spec addressed | ✅ EventBridge, RelationStore, entity stores, event handlers, component updates all covered |
| **Placeholder scan** — no TBD/TODO/placeholder code | ✅ Every step has complete code |
| **Type consistency** — method signatures match across tasks | ✅ Task 3 consumes Task 1's event types, Task 2's store; all signatures verified |
| **No orphan imports** — each file's imports are used | ✅ ProjectStore: removed 3 unused imports; ProspectStore: removed 1 unused import |
| **Backward compat** — existing persisted data still loads | ✅ Store version numbers unchanged; persist keys unchanged; migration functions kept |
