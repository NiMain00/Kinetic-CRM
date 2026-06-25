# Plan: Fully Operational Proyek Page

## Problem Analysis

| Issue | Affected Tabs | Root Cause |
|-------|---------------|------------|
| **Dummy data used instead of project data** | HargaTab, KompetitorTab, RksTab, LphsSiosTab, DeliveryTab, PemenangTab | Tabs import `COMPETITORS`, `INITIAL_PROJECTS[0]` and use hardcoded values |
| **Data not persisted to store** | ALL tabs | All tabs use local `useState` only — navigating away loses changes |
| **No cross-tab data flow** | HargaTab ↔ KompetitorTab | Competitor data is duplicated in both tabs with separate state |
| **Project interface too thin** | ALL tabs | `Project` type lacks fields for RKS, LPHS, competitors, milestones, etc. |
| **Tab actions are toast-only** | ALL tabs | "Simpan Draft" / "Konfirmasi" buttons only fire `toast.success()`, no store update |

---

## Step 1: Extend the `Project` Interface

**File:** `src/types/domain/index.ts`

Add sub-interfaces and extend `Project`:

```typescript
export interface RksData {
  nomorTender: string;
  namaTender: string;
  deadlineTender: string;
  aanwijzing: string;
  workLocation: string;
  mainScope: string;
  additionalNotes: string;
  uploadedFiles: Array<{ name: string; size: string; time: string }>;
}

export interface LphsChecklistItem {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'na';
  document?: string;
}

export interface CompetitorEntry {
  id: string;
  name: string;
  estPrice: number;
  advantages: string[];
  notes: string;
}

export interface MilestoneEntry {
  id: string;
  name: string;
  completed: boolean;
  date?: string;
}

export interface Project {
  // ... existing fields ...
  rks?: RksData;
  lphsChecklist?: LphsChecklistItem[];
  competitors?: CompetitorEntry[];
  delivery?: {
    startDate?: string;
    endDate?: string;
    note?: string;
    progress?: number;
    milestones?: MilestoneEntry[];
  };
  timeline?: TimelineEvent[];
  documents?: Array<{ group: string; files: Array<{ name: string; size: string; time: string }> }>;
}
```

---

## Step 2: Extend the Zustand Store

**File:** `src/stores/projectStore.ts`

Add actions for tab-level data persistence:

```typescript
interface ProjectState {
  projects: Project[];
  // existing...
  updateProjectRks: (id: string, rks: Partial<RksData>) => void;
  updateProjectLphs: (id: string, checklist: LphsChecklistItem[]) => void;
  updateProjectPricing: (id: string, pricing: Partial<Project['pricing']>) => void;
  updateProjectCompetitors: (id: string, competitors: CompetitorEntry[]) => void;
  updateProjectWinner: (id: string, winnerDetails: Partial<Project['winnerDetails']>) => void;
  updateProjectDelivery: (id: string, delivery: Partial<Project['delivery']>) => void;
  updateProjectTimeline: (id: string, events: TimelineEvent[]) => void;
  updateProjectDocuments: (id: string, documents: Project['documents']) => void;
  addProjectCompetitor: (id: string, competitor: CompetitorEntry) => void;
  addProjectMilestone: (id: string, milestone: MilestoneEntry) => void;
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
}
```

---

## Step 3: Update Each Tab Component (7 tabs)

### 3a. RksTab (`tabs/RksTab.tsx`)
- Remove `INITIAL_PROJECTS[0]` fallback
- Initialize `useState` from `project.rks` fields (or defaults)
- `handleSave` → calls `updateProjectRks(project.id, { nomorTender, namaTender, ... })`
- `handleSubmit` → updates RKS + adds timeline event + advances project status to "RKS Submitted"

### 3b. LphsSiosTab (`tabs/LphsSiosTab.tsx`)
- Remove hardcoded 8-item checklist
- Initialize from `project.lphsChecklist` or empty default checklist
- `handleStatusChange` → updates local state + persists via `updateProjectLphs`
- `handleUpload` → persists document name to store

### 3c. HargaTab (`tabs/HargaTab.tsx`)
- Remove `COMPETITORS` import, read from `project.competitors`
- Initialize `hargaPenawaran`/`marginPercentage` from `project.pricing`
- `handleSavePricing` → calls `updateProjectPricing(project.id, { value, margin, note })`
- Competitor list reads from store, not local state
- Financial summary (gross margin, COGS) computed from real `project.pricing`

### 3d. KompetitorTab (`tabs/KompetitorTab.tsx`)
- Remove `COMPETITORS` import, read from `project.competitors`
- `handleAddCompetitor` → calls `addProjectCompetitor(project.id, newItem)`
- Competitor data shared with HargaTab via same store field

### 3e. PemenangTab (`tabs/PemenangTab.tsx`)
- Initialize `outcome`, `finalContractValue`, `durationDays`, `startDate` from `project.winnerDetails`
- `handleApply` → calls `updateProjectWinner(project.id, { outcome, contractValue, startDate, duration, loseReason, loseNote })`
- If "Menang" → advance status to "Executing" + set `progress` appropriately
- If "Kalah" → advance status to "Kalah" + add timeline event

### 3f. DeliveryTab (`tabs/DeliveryTab.tsx`)
- Remove hardcoded milestones and dates
- Initialize from `project.delivery` (startDate, endDate, note, progress, milestones)
- `handleSave` → calls `updateProjectDelivery(project.id, { startDate, endDate, note, progress, milestones })`
- `handleMilestoneToggle` → persists milestone state changes

### 3g. TimelineTab (`tabs/TimelineTab.tsx`)
- Read events from `project.timeline` instead of `INITIAL_TIMELINE_EVENTS`
- Each tab's save/submit action should add a new timeline event via `addTimelineEvent`

### 3h. DokumenTab (`tabs/DokumenTab.tsx`)
- Read documents from `project.documents`
- Upload/delete operations persist to store

---

## Step 4: Wire Tab Actions to Status Flow

The project `status`/`phase` should advance as tabs are completed:

```
Created → RKS → Review RKS (Tender only) → LPHS/SIOS → Input Harga → Kompetitor → Pemenang → Target Delivery → Executing
```

Each tab's "Submit" action should:
1. Persist tab data to store
2. Add a timeline event
3. Advance `project.status` / `project.phase`

---

## Step 5: Update Mock Data

**File:** `src/services/mock-data.ts`

- Seed `INITIAL_PROJECTS` with tab-specific data (RKS fields, checklist items, competitors, milestones)
- Remove the standalone `COMPETITORS` export (competitors move into project data)

---

## Implementation Order

| Phase | Files | Description |
|-------|-------|-------------|
| **1. Types** | `types/domain/index.ts` | Add sub-interfaces, extend Project |
| **2. Store** | `stores/projectStore.ts` | Add tab-level update actions |
| **3. Mock Data** | `services/mock-data.ts` | Seed projects with tab data |
| **4. RksTab** | `tabs/RksTab.tsx` | Read/write from store |
| **5. LphsSiosTab** | `tabs/LphsSiosTab.tsx` | Read/write from store |
| **6. HargaTab** | `tabs/HargaTab.tsx` | Read pricing + competitors from store |
| **7. KompetitorTab** | `tabs/KompetitorTab.tsx` | Read/write competitors from store |
| **8. PemenangTab** | `tabs/PemenangTab.tsx` | Read/write winner details from store |
| **9. DeliveryTab** | `tabs/DeliveryTab.tsx` | Read/write delivery from store |
| **10. TimelineTab** | `tabs/TimelineTab.tsx` | Read timeline from project |
| **11. DokumenTab** | `tabs/DokumenTab.tsx` | Read/write documents from project |
| **12. Status Flow** | All tabs + `ProjectDetailPage.tsx` | Wire status transitions |

---

## Verification

After each phase:
1. Run `npm run lint` (or equivalent)
2. Run `npm run typecheck` (or `npx tsc --noEmit`)
3. Manual test: Navigate between tabs, verify data persists across tab switches
4. Manual test: Refresh page, verify data persists from localStorage
