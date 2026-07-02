# Procurement Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate Procurement (Pengadaan) from Projects module into an independent feature module with its own routes, store, types, tabs, and phase workflow.

**Architecture:** New isolated feature folder `src/features/procurement/` with independent Zustand store, route group at `/procurement/*`, and full phase stepper workflow. Projects module is trimmed to stop at Pemenang. Auto-create procurement entry when project status reaches MENANG.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand (persist), React Router v7, Lucide-React (via material-symbols-outlined), Vite.

## Global Constraints

- All data lives in Zustand stores with `persist` middleware (no backend)
- Follow existing patterns: ProjectDetailPage tabs, PhaseStepper, sequential tab locking
- Use `@/` path aliases for imports
- Permissions follow existing pattern: `procurement_view`, `procurement_edit`, `procurement_delete`
- Timeline/Dokumen/Diskusi tabs are fully separate from Projects (own data)
- Four delivery tracking dates: Tanggal PO, Tanggal Unit Ready, Tanggal Unit Terkirim, Tanggal Unit Diterima

---

## File Structure

```
NEW FILES:
  src/types/domain/procurement.ts
  src/features/procurement/procurementStore.ts
  src/features/procurement/procurementService.ts       (auto-create + migration logic)
  src/features/procurement/ProcurementListPage.tsx
  src/features/procurement/ProcurementFormPage.tsx
  src/features/procurement/ProcurementDetailPage.tsx
  src/features/procurement/tabs/OverviewTab.tsx
  src/features/procurement/tabs/PurchaseRequestTab.tsx
  src/features/procurement/tabs/VendorSelectionTab.tsx
  src/features/procurement/tabs/PoTab.tsx
  src/features/procurement/tabs/DeliveryTab.tsx
  src/features/procurement/tabs/ProgressTab.tsx
  src/features/procurement/tabs/ClosingTab.tsx
  src/features/procurement/tabs/TimelineTab.tsx
  src/features/procurement/tabs/DokumenTab.tsx
  src/features/procurement/tabs/DiskusiTab.tsx

MODIFIED FILES:
  src/routes/router.tsx              — add /procurement routes
  src/routes/nav-items.ts            — add "Proses Pengadaan" nav
  src/stores/configStore.ts          — trim project phases at Pemenang, add procurement phases
  src/features/projects/ProjectDetailPage.tsx — remove Target Delivery tab, adjust phases
  src/features/projects/tabs/PemenangTab.tsx  — add auto-create trigger on MENANG

DELETED FILES:
  src/features/projects/tabs/DeliveryTab.tsx   — moved to procurement
```

---

### Task 1: Create Procurement Types

**Files:**
- Create: `src/types/domain/procurement.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/types/domain/procurement.ts

import type { TimelineEvent, DocGroup } from './index';

export type ProcurementStatus =
  | 'Draft'
  | 'Purchase Request'
  | 'Vendor Selection'
  | 'PO Process'
  | 'Delivery'
  | 'Progress'
  | 'Closed'
  | 'Cancelled';

export interface Procurement {
  id: string;
  code: string;
  sourceProjectId?: string;
  sourceProjectCode?: string;

  // Inherited from project
  client: string;
  contractValue: number;
  location: string;

  // Workflow
  status: ProcurementStatus;
  phase: string;
  progress: number;

  // Timestamps
  createdAt: string;
  createdBy: string;
  createdByUserId?: string;
  updatedAt?: string;

  // Purchase Request
  prNumber?: string;
  prDate?: string;
  prNotes?: string;

  // Vendor Selection
  selectedVendor?: string;
  vendorPic?: string;
  vendorContact?: string;

  // Purchase Order
  poNumber?: string;
  poDate?: string;
  poValue?: number;
  poNotes?: string;

  // Delivery / Tracking
  targetStartDate?: string;
  targetEndDate?: string;
  unitReadyDate?: string;
  unitShippedDate?: string;
  unitReceivedDate?: string;
  actualEndDate?: string;
  deliveryNote?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  deliveredBy?: string;

  // Progress & Closing
  progressNotes?: string;
  isClosed?: boolean;
  closedAt?: string;
  closedBy?: string;

  // Sub-entities (separate from project)
  timeline?: TimelineEvent[];
  documents?: DocGroup[];
}

export const PROCUREMENT_PHASES = [
  { id: 'PC-01', status: 'Draft',            phase: 'Overview',          order: 1, isActive: true },
  { id: 'PC-02', status: 'Purchase Request', phase: 'Purchase Request',  order: 2, isActive: true },
  { id: 'PC-03', status: 'Vendor Selection', phase: 'Vendor Selection',  order: 3, isActive: true },
  { id: 'PC-04', status: 'PO Process',       phase: 'PO',                order: 4, isActive: true },
  { id: 'PC-05', status: 'Delivery',         phase: 'Delivery',          order: 5, isActive: true },
  { id: 'PC-06', status: 'Progress',         phase: 'Progress',          order: 6, isActive: true },
  { id: 'PC-07', status: 'Closed',           phase: 'Closing',           order: 7, isActive: true },
  { id: 'PC-08', status: 'Cancelled',        phase: 'Selesai',           order: 8, isActive: true },
];

export function generateProcurementCode(index: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `PR-${year}${month}-${String(index + 1).padStart(4, '0')}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/domain/procurement.ts
git commit -m "feat(procurement): add types and phase constants"
```

---

### Task 2: Create Procurement Store

**Files:**
- Create: `src/features/procurement/procurementStore.ts`

- [ ] **Step 1: Write the store**

```typescript
// src/features/procurement/procurementStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Procurement, ProcurementStatus, TimelineEvent, DocGroup } from '@/types/domain/procurement';
import { generateProcurementCode } from '@/types/domain/procurement';

interface ProcurementState {
  procurements: Procurement[];
  addProcurement: (p: Omit<Procurement, 'id' | 'code' | 'createdAt' | 'progress' | 'status' | 'phase'> & { status?: ProcurementStatus; phase?: string }) => Procurement;
  updateProcurement: (id: string, data: Partial<Procurement>) => void;
  deleteProcurement: (id: string) => void;
  getProcurementById: (id: string) => Procurement | undefined;
  // Tab-specific
  addTimelineEvent: (id: string, event: TimelineEvent) => void;
  updateDocuments: (id: string, docs: DocGroup[]) => void;
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      procurements: [],

      addProcurement: (data) => {
        const state = get();
        const index = state.procurements.length;
        const newProc: Procurement = {
          id: `PRC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: generateProcurementCode(index),
          status: data.status || 'Draft',
          phase: data.phase || 'Draft',
          progress: 0,
          createdAt: new Date().toISOString(),
          timeline: [],
          documents: [],
          ...data,
        };
        set((s) => ({ procurements: [...s.procurements, newProc] }));
        return newProc;
      },

      updateProcurement: (id, data) =>
        set((s) => ({
          procurements: s.procurements.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteProcurement: (id) =>
        set((s) => ({
          procurements: s.procurements.filter((p) => p.id !== id),
        })),

      getProcurementById: (id) => get().procurements.find((p) => p.id === id),

      addTimelineEvent: (id, event) =>
        set((s) => ({
          procurements: s.procurements.map((p) =>
            p.id === id
              ? { ...p, timeline: [...(p.timeline || []), event] }
              : p
          ),
        })),

      updateDocuments: (id, docs) =>
        set((s) => ({
          procurements: s.procurements.map((p) =>
            p.id === id ? { ...p, documents: docs } : p
          ),
        })),
    }),
    { name: 'kinetic-procurement', version: 1 }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add src/features/procurement/procurementStore.ts
git commit -m "feat(procurement): add Zustand store with persist"
```

---

### Task 3: Create Procurement Service (auto-create + migration)

**Files:**
- Create: `src/features/procurement/procurementService.ts`

- [ ] **Step 1: Write the service**

```typescript
// src/features/procurement/procurementService.ts

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
    // Copy documents & timeline
    documents: project.documents ? JSON.parse(JSON.stringify(project.documents)) : [],
    timeline: project.timeline ? JSON.parse(JSON.stringify(project.timeline)) : [],
  });

  // Add timeline event for the creation
  store.addTimelineEvent(procurement.id, {
    id: `evt-${Date.now()}`,
    title: 'Pengadaan Dibuat',
    actor: project.author,
    role: 'System',
    time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    type: 'approve',
    description: `Pengadaan dibuat otomatis dari proyek ${project.code} yang telah memenangkan tender.`,
  });

  return procurement;
}

/**
 * Migrate all existing projects that are past Pemenang stage.
 * Projects with status 'Target Delivery', 'Executing', or 'Selesai'
 * and winnerDetails.outcome === 'menang' get a procurement entry.
 */
export function migrateExistingProjects(projects: Project[]): number {
  const store = useProcurementStore.getState();
  const existingIds = new Set(store.procurements.map((p) => p.sourceProjectId));
  let count = 0;

  for (const project of projects) {
    const isPastWinner =
      project.status === 'Target Delivery' ||
      project.status === 'Executing' ||
      project.status === 'Completed' ||
      project.status === 'Selesai';
    const isMenang = project.winnerDetails?.outcome === 'menang';

    if ((isPastWinner || isMenang) && !existingIds.has(project.id)) {
      createProcurementFromProject(project);
      count++;
    }
  }

  return count;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/procurement/procurementService.ts
git commit -m "feat(procurement): add auto-create and migration service"
```

---

### Task 4: Update Nav Items

**Files:**
- Modify: `src/routes/nav-items.ts`

- [ ] **Step 1: Add "Proses Pengadaan" nav item**

Insert after the Proyek nav item:

```typescript
  { label: 'Proyek', path: '/projects', icon: 'work', roles: ['Super Admin', 'Admin', 'PM', 'Branch Manager', 'Dept Head', 'Management', 'Reviewer', 'Staff'], permissions: ['proyek_view'] },
  { label: 'Proses Pengadaan', path: '/procurement', icon: 'inventory_2', permissions: ['procurement_view'] },
  { label: 'Persetujuan', path: '/approvals', icon: 'how_to_reg', ... },
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/nav-items.ts
git commit -m "feat(nav): add Proses Pengadaan menu item"
```

---

### Task 5: Update Router

**Files:**
- Modify: `src/routes/router.tsx`

- [ ] **Step 1: Add procurement route imports and routes**

Add after the Project route imports (around line 55):

```typescript
// Procurement
const ProcurementListPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementListPage')), ['procurement_view']);
const ProcurementFormPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementFormPage')), ['procurement_edit']);
const ProcurementDetailPage = LazyLoadPermission(lazy(() => import('@/features/procurement/ProcurementDetailPage')), ['procurement_view']);
```

Add routes after the `/projects` block (around line 139):

```typescript
        {/* Procurement */}
        <Route path="procurement" element={<ProcurementListPage />} />
        <Route path="procurement/new" element={<ProcurementFormPage />} />
        <Route path="procurement/:procurementId" element={<ProcurementDetailPage />} />
        <Route path="procurement/:procurementId/:tab" element={<ProcurementDetailPage />} />
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/router.tsx
git commit -m "feat(router): add /procurement routes"
```

---

### Task 6: Create Procurement List Page

**Files:**
- Create: `src/features/procurement/ProcurementListPage.tsx`

- [ ] **Step 1: Write the list page**

```typescript
// src/features/procurement/ProcurementListPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProcurementStore } from './procurementStore';
import { usePermission } from '@/hooks/usePermission';
import { formatCurrency } from '@/utils/formatters';
import type { ProcurementStatus } from '@/types/domain/procurement';

const STATUS_COLORS: Record<ProcurementStatus, string> = {
  'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
  'Purchase Request': 'bg-blue-50 text-blue-700 border-blue-200',
  'Vendor Selection': 'bg-purple-50 text-purple-700 border-purple-200',
  'PO Process': 'bg-amber-50 text-amber-700 border-amber-200',
  'Delivery': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Closed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-red-50 text-red-700 border-red-200',
};

export default function ProcurementListPage() {
  const navigate = useNavigate();
  const procurements = useProcurementStore((s) => s.procurements);
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcurementStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return procurements.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.code.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.prNumber?.toLowerCase().includes(q) ||
          p.poNumber?.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [procurements, statusFilter, search]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display-title text-xl font-bold text-on-surface">Proses Pengadaan</h1>
            <p className="text-sm text-secondary mt-0.5">Kelola seluruh aktivitas pengadaan barang/jasa</p>
          </div>
          {can('procurement_edit') && (
            <button
              onClick={() => navigate('/procurement/new')}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Pengadaan Baru
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengadaan..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProcurementStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="all">Semua Status</option>
            {Object.keys(STATUS_COLORS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-secondary">{filtered.length} pengadaan</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">inventory_2</span>
            <h3 className="font-heading-section text-base text-on-surface">Belum Ada Pengadaan</h3>
            <p className="text-sm text-secondary mt-1 max-w-sm">
              {search || statusFilter !== 'all'
                ? 'Tidak ada pengadaan yang sesuai filter.'
                : 'Pengadaan akan muncul di sini setelah proyek dinyatakan MENANG, atau Anda dapat membuat manual.'}
            </p>
            {can('procurement_edit') && !search && statusFilter === 'all' && (
              <button
                onClick={() => navigate('/procurement/new')}
                className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold"
              >
                Buat Pengadaan Baru
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-container border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-secondary">Kode</th>
                  <th className="text-left px-4 py-3 font-semibold text-secondary">Klien</th>
                  <th className="text-left px-4 py-3 font-semibold text-secondary">Asal Proyek</th>
                  <th className="text-right px-4 py-3 font-semibold text-secondary">Nilai Kontrak</th>
                  <th className="text-center px-4 py-3 font-semibold text-secondary">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-secondary">Progress</th>
                  <th className="text-right px-4 py-3 font-semibold text-secondary">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/procurement/${p.id}`)}
                    className="border-b border-border/50 hover:bg-surface-container/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-on-surface">{p.code}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{p.client}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {p.sourceProjectCode ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          {p.sourceProjectCode}
                        </span>
                      ) : (
                        <span className="text-outline italic">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-data text-on-surface">{formatCurrency(p.contractValue)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_COLORS[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono-data text-secondary">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-outline text-[10px]">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/procurement/ProcurementListPage.tsx
git commit -m "feat(procurement): add list page with status filters"
```

---

### Task 7: Create Procurement Form Page (manual create)

**Files:**
- Create: `src/features/procurement/ProcurementFormPage.tsx`

- [ ] **Step 1: Write the form page**

```typescript
// src/features/procurement/ProcurementFormPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProcurementStore } from './procurementStore';
import { useProjectStore } from '@/stores/projectStore';
import { formatCurrency } from '@/utils/formatters';

export default function ProcurementFormPage() {
  const navigate = useNavigate();
  const addProcurement = useProcurementStore((s) => s.addProcurement);
  const projects = useProjectStore((s) => s.projects);

  const winningProjects = projects.filter(
    (p) => p.winnerDetails?.outcome === 'menang' && 
    !useProcurementStore.getState().procurements.some((pr) => pr.sourceProjectId === p.id)
  );

  const [client, setClient] = useState('');
  const [contractValue, setContractValue] = useState(0);
  const [location, setLocation] = useState('');
  const [sourceProjectId, setSourceProjectId] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [prNotes, setPrNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      toast.error('Nama klien wajib diisi');
      return;
    }

    const selectedProject = sourceProjectId
      ? projects.find((p) => p.id === sourceProjectId)
      : undefined;

    const procurement = addProcurement({
      sourceProjectId: sourceProjectId || undefined,
      sourceProjectCode: selectedProject?.code,
      client,
      contractValue,
      location,
      prNumber: prNumber || undefined,
      prNotes: prNotes || undefined,
      createdBy: 'Admin',
      status: prNumber ? 'Purchase Request' : 'Draft',
      phase: prNumber ? 'Purchase Request' : 'Draft',
    });

    toast.success(`Pengadaan ${procurement.code} berhasil dibuat`);
    navigate(`/procurement/${procurement.id}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="bg-surface border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/procurement')}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
          </button>
          <h1 className="font-display-title text-xl font-bold text-on-surface">Pengadaan Baru</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Link to Project */}
          <section className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-4">
            <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">link</span>
              Referensi Proyek (Opsional)
            </h3>
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Hubungkan dengan Proyek yang Menang</label>
              <select
                value={sourceProjectId}
                onChange={(e) => {
                  const p = projects.find((proj) => proj.id === e.target.value);
                  setSourceProjectId(e.target.value);
                  if (p) {
                    setClient(p.client);
                    setContractValue(p.winnerDetails?.contractValue || p.estimatedValue || 0);
                    setLocation(p.location);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              >
                <option value="">Tidak ada (input manual)</option>
                {winningProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.client} ({formatCurrency(p.winnerDetails?.contractValue || p.estimatedValue || 0)})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-outline mt-1">Pilih proyek yang sudah MENANG untuk mengisi data otomatis</p>
            </div>
          </section>

          {/* Client Info */}
          <section className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-4">
            <h3 className="font-heading-section text-sm font-bold text-on-surface">Informasi Pengadaan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nama Klien *</label>
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  placeholder="Nama perusahaan klien"
                  required
                />
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nilai Kontrak</label>
                <input
                  type="number"
                  value={contractValue || ''}
                  onChange={(e) => setContractValue(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Lokasi</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  placeholder="Lokasi proyek"
                />
              </div>
            </div>
          </section>

          {/* PR Info */}
          <section className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-4">
            <h3 className="font-heading-section text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">description</span>
              Purchase Request (Opsional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nomor PR</label>
                <input
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                  placeholder="PR-2026-001"
                />
              </div>
            </div>
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan PR</label>
              <textarea
                value={prNotes}
                onChange={(e) => setPrNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none"
                placeholder="Deskripsi kebutuhan pengadaan..."
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/procurement')}
              className="px-4 py-2 border border-border text-secondary rounded-lg text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Pengadaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/procurement/ProcurementFormPage.tsx
git commit -m "feat(procurement): add manual create form page"
```

---

### Task 8: Create Procurement Detail Page (stepper + tab navigation)

**Files:**
- Create: `src/features/procurement/ProcurementDetailPage.tsx`

This is the most complex page. It follows the exact same pattern as `ProjectDetailPage.tsx` — sticky header, PhaseStepper, tab nav bar, tab panels.

- [ ] **Step 1: Write the detail page**

```typescript
// src/features/procurement/ProcurementDetailPage.tsx
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import PhaseStepper from '@/components/shared/PhaseStepper';
import { useProcurementStore } from './procurementStore';
import { usePermission } from '@/hooks/usePermission';
import { PROCUREMENT_PHASES } from '@/types/domain/procurement';
import type { ProcurementStatus } from '@/types/domain/procurement';

// Tab imports
import OverviewTab from './tabs/OverviewTab';
import PurchaseRequestTab from './tabs/PurchaseRequestTab';
import VendorSelectionTab from './tabs/VendorSelectionTab';
import PoTab from './tabs/PoTab';
import DeliveryTab from './tabs/DeliveryTab';
import ProgressTab from './tabs/ProgressTab';
import ClosingTab from './tabs/ClosingTab';
import TimelineTab from './tabs/TimelineTab';
import DokumenTab from './tabs/DokumenTab';
import DiskusiTab from './tabs/DiskusiTab';

interface ProcurementDetailViewProps {
  procurement?: any;
  onShowNotification?: (msg: string, type: 'success' | 'warning' | 'error') => void;
  onNavigatePage?: (page: string) => void;
}

export default function ProcurementDetailView({ procurement: propProcurement }: ProcurementDetailViewProps) {
  const { procurementId, tab: urlTab } = useParams<{ procurementId: string; tab: string }>();
  const navigate = useNavigate();
  const store = useProcurementStore();
  const storeProcurement = procurementId ? store.procurements.find(p => p.id === procurementId) : undefined;
  const { can } = usePermission();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const procurement = propProcurement || storeProcurement;

  const activePhases = useMemo(
    () => PROCUREMENT_PHASES.filter((p) => p.isActive).sort((a, b) => a.order - b.order),
    []
  );

  const currentStepIndex = useMemo(
    () => activePhases.findIndex((p) => p.status === procurement?.status),
    [procurement?.status, activePhases]
  );

  const tabs = useMemo(() => {
    const items = [
      { label: 'Overview', path: 'overview' },
      { label: 'Purchase Request', path: 'purchase-request' },
      { label: 'Vendor Selection', path: 'vendor-selection' },
      { label: 'PO', path: 'po' },
      { label: 'Delivery', path: 'delivery' },
      { label: 'Progress', path: 'progress' },
      { label: 'Closing', path: 'closing' },
      { label: 'Timeline', path: 'timeline' },
      { label: 'Dokumen', path: 'dokumen' },
      { label: 'Diskusi', path: 'diskusi' },
    ];
    return items;
  }, []);

  const activeTab = tabs.find((t) => t.path === (urlTab || 'overview'))?.label || 'Overview';
  const activeTabIndex = tabs.findIndex((t) => t.path === (urlTab || 'overview'));
  const isOverview = activeTab === 'Overview';

  const isTerminal = procurement?.status === 'Closed' || procurement?.status === 'Cancelled';

  const isTabLocked = (tabIndex: number) => {
    const tab = tabs[tabIndex];
    if (!tab) return true;
    if (isTerminal) return false;
    if (tab.label === 'Timeline' || tab.label === 'Dokumen' || tab.label === 'Diskusi') return false;
    // Business tabs are locked sequentially
    return tabIndex > currentStepIndex;
  };

  if (!procurement) {
    return (
      <div className="py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
        <h3 className="font-heading-section text-base text-on-surface">Pengadaan not found</h3>
        <p className="text-sm text-outline">Pengadaan tidak ditemukan atau telah dihapus.</p>
        <button onClick={() => navigate('/procurement')} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">
          Kembali ke Pengadaan
        </button>
      </div>
    );
  }

  const handleTabChange = (path: string) => {
    navigate(`/procurement/${procurementId}/${path}`);
  };

  const handleDelete = () => setShowDeleteModal(true);
  const confirmDelete = () => {
    if (!procurementId) return;
    store.deleteProcurement(procurementId);
    toast.success('Pengadaan berhasil dihapus');
    setShowDeleteModal(false);
    navigate('/procurement');
  };

  const progress = useMemo(() => {
    if (isTerminal) return 100;
    const total = activePhases.filter(p => p.status !== 'Cancelled').length;
    const idx = currentStepIndex;
    if (idx < 0) return 0;
    return Math.round((idx / (total - 1)) * 100);
  }, [currentStepIndex, activePhases, isTerminal]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Sticky Header */}
      <section className="bg-surface border-b border-border/60 px-4 sm:px-8 py-2.5 sm:py-3.5 shadow-card z-30">
        <nav className="flex items-center gap-1 text-xs text-secondary mb-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/procurement')}
            className="hover:text-primary transition-colors font-medium flex items-center gap-1 text-secondary touch-min-h"
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-outline">inventory_2</span>
            <span className="hidden sm:inline">Pengadaan</span>
          </button>
          <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-outline">chevron_right</span>
          <span className="text-on-surface-variant font-semibold truncate max-w-[80px] sm:max-w-none text-xs sm:text-sm">
            {procurement.code}
          </span>
          {!isOverview && (
            <>
              <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-outline">chevron_right</span>
              <span className="text-primary font-bold bg-primary/5 px-1.5 sm:px-2 py-0.5 rounded border border-primary/20 text-xs truncate max-w-[80px] sm:max-w-none">
                {activeTab}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => isOverview ? navigate('/procurement') : navigate(`/procurement/${procurementId}`)}
              className="p-1 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center border border-border/60 bg-surface shrink-0 touch-min"
            >
              <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                <h2 className="font-display-title text-base sm:text-xl font-bold tracking-tight truncate">{procurement.code}</h2>
                <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] sm:text-xs border whitespace-nowrap ${
                  procurement.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  procurement.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {procurement.status}
                </span>
              </div>
              <p className="text-secondary text-xs sm:text-sm line-clamp-1 truncate">{procurement.client}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {can('procurement_delete') && (
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 border border-danger text-danger font-semibold text-xs rounded-xl hover:bg-danger/5 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Hapus
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isOverview && (
          <PhaseStepper
            steps={tabs.slice(0, 7)} // Only business tabs in stepper
            currentStepIndex={currentStepIndex}
            accessibleUpToIndex={currentStepIndex}
            onStepClick={(path) => handleTabChange(path)}
            isStepUnlocked={(index) => index <= currentStepIndex || isTerminal}
          />
        )}

        {/* Tab Nav */}
        <nav className="bg-surface border-b border-border/60 px-3 sm:px-8 overflow-x-auto select-none scrollbar-none">
          <div className="flex items-center gap-4 sm:gap-8 min-w-max">
            {tabs.map((tab, index) => {
              const locked = isTabLocked(index);
              return (
                <button
                  key={tab.label}
                  onClick={() => { if (!locked) handleTabChange(tab.path); }}
                  className={`py-3 sm:py-4 font-label-sm text-xs sm:text-sm transition-all relative flex items-center gap-1 whitespace-nowrap ${
                    activeTab === tab.label
                      ? 'text-primary font-bold border-b-2 border-primary'
                      : locked
                        ? 'text-outline cursor-not-allowed opacity-50'
                        : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {locked && <span className="material-symbols-outlined text-[14px] sm:text-[16px]">lock</span>}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Panels */}
        <div className="p-3 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {activeTab === 'Overview' && <OverviewTab procurement={procurement} />}
            {activeTab !== 'Overview' && isTabLocked(activeTabIndex) && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-outline">lock</span>
                <h3 className="font-heading-section text-base text-on-surface mt-4">Tahap Terkunci</h3>
                <p className="text-sm text-outline mt-2 max-w-md">
                  Selesaikan tahap sebelumnya terlebih dahulu untuk membuka tahap ini.
                </p>
              </div>
            )}
            {(!isTabLocked(activeTabIndex) || isOverview) && (
              <>
                {activeTab === 'Purchase Request' && <PurchaseRequestTab procurement={procurement} />}
                {activeTab === 'Vendor Selection' && <VendorSelectionTab procurement={procurement} />}
                {activeTab === 'PO' && <PoTab procurement={procurement} />}
                {activeTab === 'Delivery' && <DeliveryTab procurement={procurement} />}
                {activeTab === 'Progress' && <ProgressTab procurement={procurement} />}
                {activeTab === 'Closing' && <ClosingTab procurement={procurement} />}
                {activeTab === 'Timeline' && <TimelineTab procurement={procurement} />}
                {activeTab === 'Dokumen' && <DokumenTab procurement={procurement} />}
                {activeTab === 'Diskusi' && <DiskusiTab procurement={procurement} />}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-secondary">Apakah Anda yakin ingin menghapus pengadaan ini?</p>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/procurement/ProcurementDetailPage.tsx
git commit -m "feat(procurement): add detail page with phase stepper and tab navigation"
```

---

### Task 9: Create Procurement Tabs (Overview, PR, Vendor, PO, Delivery, Progress, Closing)

**Files:**
- Create: `src/features/procurement/tabs/OverviewTab.tsx`
- Create: `src/features/procurement/tabs/PurchaseRequestTab.tsx`
- Create: `src/features/procurement/tabs/VendorSelectionTab.tsx`
- Create: `src/features/procurement/tabs/PoTab.tsx`
- Create: `src/features/procurement/tabs/DeliveryTab.tsx`
- Create: `src/features/procurement/tabs/ProgressTab.tsx`
- Create: `src/features/procurement/tabs/ClosingTab.tsx`

**OverviewTab.tsx:**

```typescript
// src/features/procurement/tabs/OverviewTab.tsx
import React from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { formatCurrency } from '@/utils/formatters';

interface Props { procurement: Procurement }

export default function OverviewTab({ procurement }: Props) {
  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Nilai Kontrak</p>
          <p className="font-display-title text-lg font-bold text-on-surface">{formatCurrency(procurement.contractValue)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Status</p>
          <p className="font-heading-section text-base font-bold text-on-surface">{procurement.status}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
          <p className="text-xs text-secondary font-medium mb-1">Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${procurement.progress}%` }} />
            </div>
            <span className="font-mono-data text-sm font-bold text-on-surface">{procurement.progress}%</span>
          </div>
        </div>
      </div>

      {/* Detail Information */}
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-heading-section text-sm font-bold text-on-surface">Informasi Pengadaan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-secondary font-medium">Kode Pengadaan</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.code}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Klien</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.client}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Lokasi</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.location || '-'}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Proyek Asal</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.sourceProjectCode || 'Manual'}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Dibuat Oleh</p>
            <p className="text-on-surface font-semibold mt-0.5">{procurement.createdBy}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Tanggal Dibuat</p>
            <p className="text-on-surface font-semibold mt-0.5">{new Date(procurement.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* PR / PO Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procurement.prNumber && (
          <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-secondary font-medium mb-1">Purchase Request</p>
            <p className="font-subheading-entity font-bold text-on-surface">{procurement.prNumber}</p>
            {procurement.prNotes && <p className="text-xs text-secondary mt-1">{procurement.prNotes}</p>}
          </div>
        )}
        {procurement.poNumber && (
          <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs text-secondary font-medium mb-1">Purchase Order</p>
            <p className="font-subheading-entity font-bold text-on-surface">{procurement.poNumber}</p>
            {procurement.poDate && <p className="text-xs text-secondary mt-1">Tgl PO: {procurement.poDate}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
```

**PurchaseRequestTab.tsx:**

```typescript
// src/features/procurement/tabs/PurchaseRequestTab.tsx
import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props { procurement: Procurement }

export default function PurchaseRequestTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [prNumber, setPrNumber] = useState(procurement.prNumber || '');
  const [prDate, setPrDate] = useState(procurement.prDate || '');
  const [prNotes, setPrNotes] = useState(procurement.prNotes || '');

  useEffect(() => {
    setPrNumber(procurement.prNumber || '');
    setPrDate(procurement.prDate || '');
    setPrNotes(procurement.prNotes || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { prNumber, prDate, prNotes });
    if (procurement.status === 'Draft') {
      updateProcurement(procurement.id, { status: 'Purchase Request', phase: 'Purchase Request' });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'PR Dibuat',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'submit',
        description: `Purchase Request ${prNumber} berhasil dibuat.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">description</span>
            Purchase Request
          </h3>
          <p className="text-xs text-secondary">Lengkapi data Purchase Request untuk memulai proses pengadaan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nomor PR</label>
            <input value={prNumber} onChange={e => setPrNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              placeholder="PR-2026-001" />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal PR</label>
            <input type="date" value={prDate} onChange={e => setPrDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs" />
          </div>
          <div className="md:col-span-2">
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan PR</label>
            <textarea value={prNotes} onChange={e => setPrNotes(e.target.value)}
              rows={4} className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none"
              placeholder="Deskripsi kebutuhan pengadaan..." />
          </div>
        </div>

        <div className="flex justify-end border-t pt-6 border-border">
          <Button onClick={handleSave} rightIcon={<span className="material-symbols-outlined text-[18px]">save</span>}>
            {procurement.status === 'Draft' ? 'Simpan & Lanjutkan' : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**VendorSelectionTab.tsx:**

```typescript
// src/features/procurement/tabs/VendorSelectionTab.tsx
import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props { procurement: Procurement }

export default function VendorSelectionTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [selectedVendor, setSelectedVendor] = useState(procurement.selectedVendor || '');
  const [vendorPic, setVendorPic] = useState(procurement.vendorPic || '');
  const [vendorContact, setVendorContact] = useState(procurement.vendorContact || '');

  useEffect(() => {
    setSelectedVendor(procurement.selectedVendor || '');
    setVendorPic(procurement.vendorPic || '');
    setVendorContact(procurement.vendorContact || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { selectedVendor, vendorPic, vendorContact });
    if (procurement.status === 'Purchase Request') {
      updateProcurement(procurement.id, { status: 'Vendor Selection', phase: 'Vendor Selection' });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'Vendor Dipilih',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'submit',
        description: `Vendor ${selectedVendor} terpilih untuk pengadaan ${procurement.code}.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">business</span>
            Vendor Selection
          </h3>
          <p className="text-xs text-secondary">Tentukan vendor yang akan menangani pengadaan ini.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nama Vendor</label>
            <input value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              placeholder="PT. Supplier Utama" />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">PIC Vendor</label>
            <input value={vendorPic} onChange={e => setVendorPic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              placeholder="Nama kontak person" />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Kontak Vendor</label>
            <input value={vendorContact} onChange={e => setVendorContact(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              placeholder="Telepon / Email" />
          </div>
        </div>
        <div className="flex justify-end border-t pt-6 border-border">
          <Button onClick={handleSave} rightIcon={<span className="material-symbols-outlined text-[18px]">save</span>}>
            Simpan & Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**PoTab.tsx:**

```typescript
// src/features/procurement/tabs/PoTab.tsx
import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button, CurrencyInput } from '@/components/ui';

interface Props { procurement: Procurement }

export default function PoTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [poNumber, setPoNumber] = useState(procurement.poNumber || '');
  const [poDate, setPoDate] = useState(procurement.poDate || '');
  const [poValue, setPoValue] = useState<number | undefined>(procurement.poValue);
  const [poNotes, setPoNotes] = useState(procurement.poNotes || '');

  useEffect(() => {
    setPoNumber(procurement.poNumber || '');
    setPoDate(procurement.poDate || '');
    setPoValue(procurement.poValue);
    setPoNotes(procurement.poNotes || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { poNumber, poDate, poValue, poNotes });
    if (procurement.status === 'Vendor Selection') {
      updateProcurement(procurement.id, { status: 'PO Process', phase: 'PO' });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'PO Diterbitkan',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'submit',
        description: `Purchase Order ${poNumber} diterbitkan.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">receipt_long</span>
            Purchase Order
          </h3>
          <p className="text-xs text-secondary">Lengkapi data Purchase Order untuk proses pemesanan.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nomor PO</label>
            <input value={poNumber} onChange={e => setPoNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              placeholder="PO-2026-001" />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal PO</label>
            <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs" />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Nilai PO</label>
            <CurrencyInput value={poValue} onChange={setPoValue} placeholder="Rp 0" />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan PO</label>
            <input value={poNotes} onChange={e => setPoNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              placeholder="Catatan..." />
          </div>
        </div>
        <div className="flex justify-end border-t pt-6 border-border">
          <Button onClick={handleSave} rightIcon={<span className="material-symbols-outlined text-[18px]">save</span>}>
            Simpan & Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**DeliveryTab.tsx:**

```typescript
// src/features/procurement/tabs/DeliveryTab.tsx
import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props { procurement: Procurement }

export default function DeliveryTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const [targetStartDate, setTargetStartDate] = useState(procurement.targetStartDate || '');
  const [targetEndDate, setTargetEndDate] = useState(procurement.targetEndDate || '');
  const [poDate, setPoDate] = useState(procurement.poDate || '');
  const [unitReadyDate, setUnitReadyDate] = useState(procurement.unitReadyDate || '');
  const [unitShippedDate, setUnitShippedDate] = useState(procurement.unitShippedDate || '');
  const [unitReceivedDate, setUnitReceivedDate] = useState(procurement.unitReceivedDate || '');
  const [actualEndDate, setActualEndDate] = useState(procurement.actualEndDate || '');
  const [deliveryNote, setDeliveryNote] = useState(procurement.deliveryNote || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTargetStartDate(procurement.targetStartDate || '');
    setTargetEndDate(procurement.targetEndDate || '');
    setPoDate(procurement.poDate || '');
    setUnitReadyDate(procurement.unitReadyDate || '');
    setUnitShippedDate(procurement.unitShippedDate || '');
    setUnitReceivedDate(procurement.unitReceivedDate || '');
    setActualEndDate(procurement.actualEndDate || '');
    setDeliveryNote(procurement.deliveryNote || '');
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      targetStartDate, targetEndDate, poDate, unitReadyDate,
      unitShippedDate, unitReceivedDate, deliveryNote,
    });
  };

  const handleConfirmDelivery = () => {
    if (!procurement.id) return;
    const errs: Record<string, string> = {};
    if (!targetStartDate) errs.targetStartDate = 'Wajib diisi';
    if (!targetEndDate) errs.targetEndDate = 'Wajib diisi';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateProcurement(procurement.id, {
      targetStartDate, targetEndDate, poDate, unitReadyDate,
      unitShippedDate, unitReceivedDate, actualEndDate,
      deliveryNote, isDelivered: true, deliveredAt: new Date().toISOString(),
    });

    if (procurement.status === 'PO Process' || procurement.status === 'Delivery') {
      updateProcurement(procurement.id, { status: 'Progress', phase: 'Progress' });
      addTimelineEvent(procurement.id, {
        id: `evt-${Date.now()}`,
        title: 'Delivery Dikonfirmasi',
        actor: procurement.createdBy,
        role: 'Procurement',
        time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'approve',
        description: 'Pengiriman telah dikonfirmasi. Procurement memasuki tahap Progress.',
      });
    }
  };

  const isClosed = procurement.status === 'Closed' || procurement.status === 'Cancelled';
  const isDelivered = procurement.isDelivered;

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">local_shipping</span>
            Target Delivery & Tracking
          </h3>
          <p className="text-xs text-secondary">Lacak pengiriman unit dari PO hingga diterima di lokasi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal PO <span className="text-danger">*</span>
            </label>
            <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              disabled={isClosed} />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Tanggal Mulai Delivery <span className="text-danger">*</span>
            </label>
            <input type="date" value={targetStartDate}
              onChange={e => { setTargetStartDate(e.target.value); setErrors(p => ({...p, targetStartDate: ''})); }}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-xs ${errors.targetStartDate ? 'border-danger' : 'border-border'}`}
              disabled={isClosed} />
            {errors.targetStartDate && <p className="text-xs text-danger mt-1">{errors.targetStartDate}</p>}
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">
              Estimasi Tanggal Sampai <span className="text-danger">*</span>
            </label>
            <input type="date" value={targetEndDate}
              onChange={e => { setTargetEndDate(e.target.value); setErrors(p => ({...p, targetEndDate: ''})); }}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none text-xs ${errors.targetEndDate ? 'border-danger' : 'border-border'}`}
              disabled={isClosed} />
            {errors.targetEndDate && <p className="text-xs text-danger mt-1">{errors.targetEndDate}</p>}
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Unit Ready</label>
            <input type="date" value={unitReadyDate} onChange={e => setUnitReadyDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              disabled={isClosed} />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Unit Terkirim</label>
            <input type="date" value={unitShippedDate} onChange={e => setUnitShippedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              disabled={isClosed} />
          </div>
          <div>
            <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Unit Diterima</label>
            <input type="date" value={unitReceivedDate} onChange={e => setUnitReceivedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
              disabled={isClosed} />
          </div>
          {isDelivered && (
            <div>
              <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Tanggal Selesai Aktual</label>
              <input type="date" value={actualEndDate} onChange={e => setActualEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs" disabled />
            </div>
          )}
        </div>

        <div>
          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Logistik</label>
          <textarea value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)}
            rows={4} className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none"
            placeholder="Rincian pengiriman, instruksi logistik..." disabled={isClosed} />
        </div>

        <div className="flex justify-end gap-3 border-t pt-6 border-border">
          {!isClosed && (
            <Button variant="secondary" onClick={handleSave}
              leftIcon={<span className="material-symbols-outlined text-[18px]">drafts</span>}>
              Simpan Draft
            </Button>
          )}
          {!isDelivered && !isClosed && (
            <Button onClick={handleConfirmDelivery}
              rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>
              Konfirmasi & Lanjutkan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**ProgressTab.tsx:**

```typescript
// src/features/procurement/tabs/ProgressTab.tsx
import React, { useState, useEffect } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props { procurement: Procurement }

export default function ProgressTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const [progressNotes, setProgressNotes] = useState(procurement.progressNotes || '');
  const [progressVal, setProgressVal] = useState(procurement.progress || 0);

  useEffect(() => {
    setProgressNotes(procurement.progressNotes || '');
    setProgressVal(procurement.progress || 0);
  }, [procurement.id]);

  const handleSave = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, { progressNotes, progress: progressVal });
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">trending_up</span>
            Progress Pengadaan
          </h3>
          <p className="text-xs text-secondary">Pantau perkembangan proses pengadaan.</p>
        </div>

        <div>
          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Progress (%)</label>
          <div className="flex items-center gap-4">
            <input type="range" min={0} max={100} value={progressVal}
              onChange={e => setProgressVal(Number(e.target.value))}
              className="flex-1 accent-primary" />
            <span className="font-mono-data text-sm font-bold text-on-surface min-w-[3rem] text-right">{progressVal}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressVal}%` }} />
          </div>
        </div>

        <div>
          <label className="font-label-sm text-xs font-semibold text-secondary mb-1.5 block">Catatan Progress</label>
          <textarea value={progressNotes} onChange={e => setProgressNotes(e.target.value)}
            rows={5} className="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs resize-none"
            placeholder="Catatan perkembangan pengadaan..." />
        </div>

        <div className="flex justify-end border-t pt-6 border-border">
          <Button onClick={handleSave} rightIcon={<span className="material-symbols-outlined text-[18px]">save</span>}>
            Simpan Progress
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**ClosingTab.tsx:**

```typescript
// src/features/procurement/tabs/ClosingTab.tsx
import React from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { useProcurementStore } from '../procurementStore';
import { Button } from '@/components/ui';

interface Props { procurement: Procurement }

export default function ClosingTab({ procurement }: Props) {
  const updateProcurement = useProcurementStore((s) => s.updateProcurement);
  const addTimelineEvent = useProcurementStore((s) => s.addTimelineEvent);

  const handleClose = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      status: 'Closed',
      phase: 'Closing',
      progress: 100,
      isClosed: true,
      closedAt: new Date().toISOString(),
      closedBy: procurement.createdBy,
    });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Pengadaan Selesai',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'approve',
      description: `Pengadaan ${procurement.code} telah selesai dan ditutup.`,
    });
  };

  const handleCancel = () => {
    if (!procurement.id) return;
    updateProcurement(procurement.id, {
      status: 'Cancelled',
      phase: 'Selesai',
      isClosed: true,
      closedAt: new Date().toISOString(),
      closedBy: procurement.createdBy,
    });
    addTimelineEvent(procurement.id, {
      id: `evt-${Date.now()}`,
      title: 'Pengadaan Dibatalkan',
      actor: procurement.createdBy,
      role: 'Procurement',
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'revision',
      description: `Pengadaan ${procurement.code} dibatalkan.`,
    });
  };

  const isClosed = procurement.status === 'Closed';
  const isCancelled = procurement.status === 'Cancelled';

  if (isClosed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-success mb-4">check_circle</span>
        <h3 className="font-heading-section text-lg font-bold text-on-surface">Pengadaan Selesai</h3>
        <p className="text-sm text-secondary mt-2">Pengadaan {procurement.code} telah ditutup pada {procurement.closedAt ? new Date(procurement.closedAt).toLocaleDateString('id-ID') : '-'}.</p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-danger mb-4">cancel</span>
        <h3 className="font-heading-section text-lg font-bold text-on-surface">Pengadaan Dibatalkan</h3>
        <p className="text-sm text-secondary mt-2">Pengadaan {procurement.code} telah dibatalkan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6 space-y-8">
        <div>
          <h3 className="font-heading-section text-base font-bold text-on-surface mb-2 flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">flag</span>
            Penutupan Pengadaan
          </h3>
          <p className="text-xs text-secondary">Pastikan semua data telah lengkap sebelum menutup pengadaan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container rounded-xl p-5 border border-border">
            <h4 className="font-label-sm text-xs font-semibold text-on-surface mb-3">Ringkasan</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-secondary">Kode</span><span className="font-semibold">{procurement.code}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Klien</span><span className="font-semibold">{procurement.client}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Status</span><span className="font-semibold">{procurement.status}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Progress</span><span className="font-semibold">{procurement.progress}%</span></div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-5 border border-amber-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-warning">warning_amber</span>
              <div>
                <h4 className="font-label-sm text-xs font-semibold text-amber-800 dark:text-amber-300">Konfirmasi</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Pastikan semua unit telah diterima dan data delivery telah lengkap sebelum menutup pengadaan.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-6 border-border">
          <Button variant="danger" onClick={handleCancel}
            leftIcon={<span className="material-symbols-outlined text-[18px]">cancel</span>}>
            Batalkan Pengadaan
          </Button>
          <Button onClick={handleClose}
            rightIcon={<span className="material-symbols-outlined text-[18px]">check_circle</span>}>
            Tutup Pengadaan
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit all tabs**

```bash
git add src/features/procurement/tabs/
git commit -m "feat(procurement): add all business tabs (Overview, PR, Vendor, PO, Delivery, Progress, Closing)"
```

---

### Task 10: Create Shared Tabs (Timeline, Dokumen, Diskusi)

**Files:**
- Create: `src/features/procurement/tabs/TimelineTab.tsx`
- Create: `src/features/procurement/tabs/DokumenTab.tsx`
- Create: `src/features/procurement/tabs/DiskusiTab.tsx`

These follow the exact same patterns as their project counterparts but use `useProcurementStore` instead of `useProjectStore`.

**TimelineTab.tsx:**

```typescript
// src/features/procurement/tabs/TimelineTab.tsx
import React from 'react';
import type { Procurement } from '@/types/domain/procurement';

interface Props { procurement: Procurement }

export default function TimelineTab({ procurement }: Props) {
  const events = procurement.timeline || [];

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">timeline</span>
        <h3 className="font-heading-section text-base text-on-surface">Belum Ada Aktivitas</h3>
        <p className="text-sm text-secondary mt-1">Riwayat aktivitas pengadaan akan muncul di sini.</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative pl-8 space-y-0">
        {sorted.map((event, i) => (
          <div key={event.id} className={`relative pb-6 ${i === sorted.length - 1 ? '' : 'timeline-line'}`}>
            <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 -translate-x-1/2 ${
              event.type === 'approve' ? 'bg-success-container border-success text-success' :
              event.type === 'revision' ? 'bg-warning-container border-warning text-warning' :
              event.type === 'submit' ? 'bg-info-container border-info text-info' :
              'bg-surface-container border-border text-secondary'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {event.type === 'approve' ? 'check_circle' :
                 event.type === 'revision' ? 'edit_note' :
                 event.type === 'submit' ? 'send' :
                 event.type === 'upload' ? 'upload_file' : 'circle'}
              </span>
            </div>
            <div className="ml-4">
              <p className="font-label-sm text-xs font-semibold text-on-surface">{event.title}</p>
              <p className="text-[10px] text-secondary mt-0.5">{event.actor} · {event.role}</p>
              {event.description && <p className="text-xs text-on-surface-variant mt-1">{event.description}</p>}
              <p className="text-[10px] text-outline mt-1">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**DokumenTab.tsx:**

```typescript
// src/features/procurement/tabs/DokumenTab.tsx
import React, { useState } from 'react';
import type { Procurement, DocGroup, DocumentEntry } from '@/types/domain';
import { useProcurementStore } from '../procurementStore';

interface Props { procurement: Procurement }

export default function DokumenTab({ procurement }: Props) {
  const updateDocuments = useProcurementStore((s) => s.updateDocuments);
  const [docGroups] = useState<DocGroup[]>(procurement.documents || []);

  const handleUpload = () => {
    // Placeholder — follows same pattern as project DokumenTab
    const newDoc: DocumentEntry = {
      id: `doc-${Date.now()}`,
      name: `Dokumen ${(docGroups[0]?.documents?.length || 0) + 1}`,
      size: '0 KB',
      uploadDate: new Date().toLocaleDateString('id-ID'),
      uploader: procurement.createdBy,
      version: '1.0',
      icon: 'description',
      iconColor: 'text-info',
    };
    const updated = [...docGroups];
    if (updated.length === 0) {
      updated.push({ key: 'umum', label: 'Dokumen Procurement', icon: 'folder', color: 'text-primary', documents: [newDoc] });
    } else {
      updated[0] = { ...updated[0], documents: [...(updated[0].documents || []), newDoc] };
    }
    updateDocuments(procurement.id, updated);
  };

  const allDocs = docGroups.flatMap(g => g.documents || []);

  if (allDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">description</span>
        <h3 className="font-heading-section text-base text-on-surface">Belum Ada Dokumen</h3>
        <p className="text-sm text-secondary mt-1">Upload dokumen procurement di sini.</p>
        <button onClick={handleUpload}
          className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">upload</span> Upload Dokumen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleUpload}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">upload</span> Upload
        </button>
      </div>
      {docGroups.map(group => (
        <div key={group.key} className="bg-surface-container-lowest rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-label-sm text-xs font-semibold text-on-surface mb-4">{group.label}</h3>
          <div className="space-y-2">
            {group.documents?.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${doc.iconColor}`}>{doc.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">{doc.name}</p>
                    <p className="text-[10px] text-secondary">{doc.size} · {doc.uploadDate}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] cursor-pointer">download</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**DiskusiTab.tsx:**

```typescript
// src/features/procurement/tabs/DiskusiTab.tsx
import React, { useState } from 'react';
import type { Procurement } from '@/types/domain/procurement';
import { MentionTextarea } from '@/components/shared';

interface Props { procurement: Procurement }

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  time: string;
}

export default function DiskusiTab({ procurement }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender: procurement.createdBy,
      message: input.trim(),
      time: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[400px] bg-surface-container-lowest rounded-xl border border-border shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">forum</span>
            <p className="text-sm text-secondary">Belum ada diskusi. Mulai diskusi dengan tim procurement.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {m.sender.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface">{m.sender}</span>
                  <span className="text-[10px] text-outline">{m.time}</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{m.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Tulis pesan..."
          className="flex-1 px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-xs"
        />
        <button onClick={handleSend}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/procurement/tabs/TimelineTab.tsx src/features/procurement/tabs/DokumenTab.tsx src/features/procurement/tabs/DiskusiTab.tsx
git commit -m "feat(procurement): add shared tabs (Timeline, Dokumen, Diskusi)"
```

---

### Task 11: Refactor Project Detail Page

**Files:**
- Modify: `src/features/projects/ProjectDetailPage.tsx` — remove Target Delivery tab
- Delete: `src/features/projects/tabs/DeliveryTab.tsx`

- [ ] **Step 1: Remove Target Delivery from tabs list**

In `ProjectDetailPage.tsx`, find the tabs array (around line 86-121) and:

1. Remove `{ label: 'Target Delivery', path: 'target-delivery' }` from the tabs list
2. Remove the `DeliveryTab` import at the top
3. Remove the `{activeTab === 'Target Delivery' && <DeliveryTab ... />}` panel block near line 448
4. Remove the special lock logic for "Target Delivery" in `isTabLocked` (the `if (tab.label === 'Target Delivery') return !isMenang;` block)
5. Adjust the `accessibleUpToIndex`/`currentStepIndex` logic — now it stops at Pemenang

The resulting tabs for a Tender project should be:
```
Overview, RKS, Review RKS, LPHS/SIOS, Harga, Kompetitor, Pemenang, Timeline, Dokumen, Diskusi
```
For Prospect:
```
Overview, RKS, Harga, Kompetitor, Pemenang, Timeline, Dokumen, Diskusi
```
For Non-Potensial (unchanged):
```
Overview, Timeline, Dokumen, Diskusi
```

- [ ] **Step 2: Delete old DeliveryTab.tsx**

```bash
rm src/features/projects/tabs/DeliveryTab.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/features/projects/ProjectDetailPage.tsx
git rm src/features/projects/tabs/DeliveryTab.tsx
git commit -m "refactor(projects): remove Target Delivery tab from project detail"
```

---

### Task 12: Update Project Phases in ConfigStore

**Files:**
- Modify: `src/stores/configStore.ts`

- [ ] **Step 1: Trim project phases at Pemenang**

In `src/stores/configStore.ts`, find `INITIAL_PHASES` (around line 73-87). Remove phases after Pemenang:

```typescript
const INITIAL_PHASES: ProjectPhase[] = [
  { id: 'PH-01', status: 'Prospecting', phase: 'Overview', order: 1, isActive: true },
  { id: 'PH-02', status: 'RKS', phase: 'RKS', order: 2, isActive: true },
  { id: 'PH-03', status: 'Review RKS', phase: 'Review RKS', order: 3, isActive: true },
  { id: 'PH-04', status: 'LPHS/SIOS', phase: 'LPHS/SIOS', order: 4, isActive: true },
  { id: 'PH-05', status: 'Input Harga', phase: 'Harga', order: 5, isActive: true },
  { id: 'PH-06', status: 'Kompetitor', phase: 'Kompetitor', order: 6, isActive: true },
  { id: 'PH-07', status: 'Pemenang', phase: 'Pemenang', order: 7, isActive: true },
  { id: 'PH-08', status: 'Kalah', phase: 'Selesai', order: 8, isActive: true },
  { id: 'PH-09', status: 'Revisi', phase: 'Revisi', order: 9, isActive: true },
  { id: 'PH-10', status: 'Selesai', phase: 'Selesai', order: 10, isActive: true },
];
```

This removes `Target Delivery`, `Executing`, and `Completed` statuses from the project workflow.

- [ ] **Step 2: Commit**

```bash
git add src/stores/configStore.ts
git commit -m "refactor(config): trim project phases to stop at Pemenang"
```

---

### Task 13: Auto-Create Trigger in PemenangTab

**Files:**
- Modify: `src/features/projects/tabs/PemenangTab.tsx`

- [ ] **Step 1: Add createProcurementFromProject call on MENANG**

In `handleApply`, after `updateProject(project.id, { status: 'Target Delivery', phase: 'Target Delivery' })` (around line 78-79), replace that with:

```typescript
// Auto-create procurement entry
const procurement = createProcurementFromProject(project);

// Mark project as completed from PM side
updateProject(project.id, { status: 'Selesai', phase: 'Selesai', progress: 100 });

toast.success(`Pengadaan ${procurement.code} berhasil dibuat untuk proses selanjutnya.`);
```

And add the import at the top:

```typescript
import { createProcurementFromProject } from '@/features/procurement/procurementService';
```

- [ ] **Step 2: Commit**

```bash
git add src/features/projects/tabs/PemenangTab.tsx
git commit -m "feat(procurement): add auto-create trigger when project wins tender"
```

---

### Task 14: Migration Logic + Init

**Files:**
- Modify: `src/features/procurement/procurementStore.ts` — add migration call on init
- Or: `src/App.tsx` — trigger migration on mount

- [ ] **Step 1: Add migration trigger on App mount**

In `src/App.tsx`, add after the existing useEffect:

```typescript
import { useProjectStore } from '@/stores/projectStore';
import { migrateExistingProjects } from '@/features/procurement/procurementService';

// Inside App component, add after the theme effect:
useEffect(() => {
  const projects = useProjectStore.getState().projects;
  const count = migrateExistingProjects(projects);
  if (count > 0) {
    console.log(`Migration: ${count} existing projects converted to procurement entries`);
  }
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(procurement): add migration of existing projects on app init"
```

---

### Task 15: Verify Navigation & Permissions

- [ ] **Step 1: Verify all routes are accessible**

Run `npm run dev` and verify:
- Sidebar shows "Proses Pengadaan" menu item
- Clicking it navigates to `/procurement`
- Creating a new procurement (manual) works
- Visiting a procurement detail shows the stepper and tabs
- Tab locking works — business tabs locked until previous step completed
- Timeline, Dokumen, Diskusi are always unlocked

- [ ] **Step 2: Verify auto-create from project**

- Open a project detail
- Navigate to Pemenang tab
- Set outcome to MENANG, fill contract details, confirm
- Verify: project status changes to "Selesai"
- Verify: new procurement entry appears in procurement list
- Verify: procurement has inherited client, contract value, code

- [ ] **Step 3: Verify migration on page load**

- Open the app in a new tab
- Verify existing winning projects (in mock data) already have procurement entries

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: No TypeScript errors, bundle succeeds.
