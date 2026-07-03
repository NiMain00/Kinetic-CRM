# Arsitektur State Frontend — Event Bridge Pattern

**Tanggal:** 2026-07-03  
**Penulis:** Senior System Analyst / Frontend Architect  
**Modul:** Prospek → Proyek → Pengadaan  
**Status:** Draft Spesifikasi

---

## 1. Latar Belakang

CRM memiliki tiga modul inti yang saling terkait:

```
Prospek (Leads/Deals)  ──→  Proyek (Project Mgmt)  ──→  Pengadaan (Procurement)
     │                            │                             │
     │  ─── isConverted ───→      │  ─── sourceProjectId ───→  │
     │  projectId                 │  sourceProspectId           │
```

Saat ini, ketiga modul berkomunikasi secara **direct cross-store mutation** (`useXxxStore.getState().yyy`), menyebabkan:
- **Tight coupling** — satu perubahan di module A bisa memiliki side-effect tak terduga di module B
- **Data redundancy** — field yang sama (client, nilai, lokasi) tersimpan di 3 tempat tanpa mekanisme sinkronisasi
- **No transactional boundary** — multi-store mutation tidak memiliki rollback jika salah satu gagal
- **Hidden side effects** — `deleteProject` juga menghapus procurement, tapi contract tidak eksplisit

---

## 2. Analisis Masalah Detail

### 2.1 Cross-Store Direct Coupling

**Lokasi:**
- `projectStore.ts:72` — memanggil `useProcurementStore.getState().deleteProcurement`
- `prospectStore.ts:28` — memanggil `useApprovalStore.getState()`
- `projectStore.ts:54` — memanggil `useNotificationStore.getState().addNotification`
- `ProjectFormPage.tsx:138` — memanggil `useProspectStore.getState().updateProspect`

**Dampak:**
- Setiap action yang memicu side-effect meload seluruh store lain ke memory
- Dependency graph tidak terlihat tanpa membaca implementasi
- Unit testing menjadi kompleks — harus mock multiple stores

### 2.2 Data Duplication (Snapshot tanpa Sync)

Data di-copy antar modul tanpa mekanisme propagasi perubahan:

| Field | Prospect | Project | Procurement |
|-------|----------|---------|-------------|
| `client` | ✅ | ✅ (copy) | ✅ (copy) |
| `estimatedValue` / `contractValue` | ✅ | ✅ (copy) | ✅ (copy) |
| `location` / `branch` | ✅ | ✅ (copy) | ✅ (copy) |
| `author` | ✅ | ✅ (copy) | ✅ (copy) |

Jika data di Procurement diubah, Project dan Prospect tidak pernah tahu.

### 2.3 JSON Deep Clone — Fragile Pattern

`procurementService.ts:38` menggunakan `JSON.parse(JSON.stringify(...))` untuk copy documents & timeline.

**Risiko:**
- Kehilangan tipe data (Date → string, undefined → null)
- Circular reference → runtime crash
- Tidak scale untuk data besar (blocking main thread)

### 2.4 Persist Middleware — Semua atau Tidak Sama Sekali

Semua store menggunakan Zustand `persist()`:

```
kinetic-prospects   → localStorage key
kinetic-projects    → localStorage key  
kinetic-procurement → localStorage key
kinetic-approvals   → localStorage key
...
```

**Dampak performa:** Setiap partial update (misal: update satu project) melakukan:
1. Spread seluruh array projects
2. Serialize entire array ke JSON
3. Write ke localStorage

Pada skala >1000 records, ini menjadi bottleneck.

### 2.5 getState() — Lost Reactivity

`useXxxStore.getState()` di dalam action store lain tidak membuat component re-render. Pattern ini bekerja karena action dipanggil dari komponen yang sudah subscribe, tapi **state yang diubah di store B tidak reaktif terhadap komponen yang hanya subscribe ke store A**.

---

## 3. Arsitektur Target: Event Bridge

### 3.1 Prinsip Desain

1. **Entity Store → hanya CRUD murni** — Tidak ada side-effect di dalam store actions
2. **Event Bridge → satu tempat untuk semua side-effect** — Decoupled middleware
3. **Relation Store → satu sumber kebenaran untuk link antar entitas**
4. **Snapshot vs Reference → dibedakan secara eksplisit**

### 3.2 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPONENT LAYER                            │
│  ProspectDetail  ProjectForm  ProcurementDetail  ApprovalInbox ... │
└────────────────────────┬──────────────────────────┬────────────────┘
                         │                          │
                         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ZUSTAND STORE LAYER                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐          │
│  │ ProspectStore │  │ ProjectStore │  │ ProcurementStore │          │
│  │ (entity only) │  │ (entity only)│  │ (entity only)    │          │
│  └──────┬───────┘  └──────┬───────┘  └───────┬──────────┘          │
│         │                 │                   │                     │
│  ┌──────┴─────────────────┴───────────────────┴──────────┐         │
│  │                 RelationStore                          │         │
│  │  prospectToProject  projectToProcurement               │         │
│  └──────────────────────────┬────────────────────────────┘         │
│                             │                                      │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EVENT BRIDGE LAYER                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  EventBus — singleton, bukan Zustand store                  │   │
│  │                                                              │   │
│  │  DomainEvents:                                               │   │
│  │  • PROSPECT_CREATED         → trigger SLA timer              │   │
│  │  • PROSPECT_CONVERTED       → link ke project, update status │   │
│  │  • PROJECT_WON              → create procurement             │   │
│  │  • PROJECT_DELETED          → cascade ke procurement         │   │
│  │  • PROCUREMENT_CREATED      → send notification              │   │
│  │  • PROCUREMENT_STATUS_CHG   → update related project delivery│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Entity Store — Pure CRUD

Setiap entity store hanya memiliki:
- **State:** `entities: Record<string, T>` (normalized) dan `ids: string[]`
- **Actions:** `add`, `update`, `delete`, `getById` — **tidak ada side-effect ke store lain**

```ts
// Contoh: ProspectStore — pure entity store
interface ProspectEntityStore {
  entities: Record<string, Prospect>;
  ids: string[];
  
  // Pure CRUD — no cross-store side effects
  addProspect(p: Prospect): void;
  updateProspect(id: string, data: Partial<Prospect>): void;
  deleteProspect(id: string): void;
  
  // Selectors (computed)
  getProspectById: (id: string) => Prospect | undefined;
  getProspectsByStatus: (status: string) => Prospect[];
}
```

**Persist policy:** Hanya entity stores yang perlu persist. Event Bridge dan Relation Store bersifat ephemeral (bisa di-rebuild dari entity data).

### 3.4 Relation Store — Satu Sumber Kebenaran untuk Link

Memisahkan relasi dari data entity:

```ts
interface RelationStore {
  // Prospek → Proyek (1-to-1)
  prospectToProject: Record<string, string>;
  // Proyek → Pengadaan (1-to-N)
  projectToProcurement: Record<string, string[]>;
  
  // Actions
  linkProspectToProject(prospectId: string, projectId: string): void;
  unlinkProspectToProject(prospectId: string): void;
  linkProjectToProcurement(projectId: string, procurementId: string): void;
  unlinkProjectToProcurement(projectId: string, procurementId: string): void;
  
  // Queries
  getProjectByProspect(prospectId: string): string | undefined;
  getProcurementsByProject(projectId: string): string[];
  getProspectByProject(projectId: string): string | undefined;
}
```

**Keuntungan:**
- Tidak perlu scan seluruh array untuk mencari relasi — O(1) lookup via Record
- Relasi bisa diubah tanpa menyentuh entity data
- Cache query results lebih mudah (karena relasi terpisah)

### 3.5 Event Bridge — Terpusat, Observable, Testable

```ts
// types/events.ts
export type DomainEvent =
  | { type: 'PROSPECT_CREATED'; prospectId: string; timestamp: string }
  | { type: 'PROSPECT_STATUS_CHANGED'; prospectId: string; from: string; to: string; timestamp: string }
  | { type: 'PROSPECT_CONVERTED'; prospectId: string; projectId: string; timestamp: string }
  | { type: 'PROJECT_WON'; projectId: string; procurementId: string; timestamp: string }
  | { type: 'PROJECT_DELETED'; projectId: string; timestamp: string }
  | { type: 'PROCUREMENT_CREATED'; procurementId: string; projectId: string; timestamp: string }
  | { type: 'PROCUREMENT_STATUS_CHANGED'; procurementId: string; from: string; to: string; timestamp: string };

// services/eventBridge.ts
type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBridge {
  private handlers = new Map<string, Set<EventHandler>>();
  private published = new Set<string>(); // dedup

  on(eventType: string, handler: EventHandler): () => void {
    // returns unsubscribe function
  }

  emit(event: DomainEvent): void {
    // 1. Log event ke audit trail
    // 2. Panggil semua handlers
    // 3. Handle error per handler (isolated)
  }

  // Untuk transactional boundary
  transaction(events: DomainEvent[]): void {
    // Execute all, rollback jika gagal
  }
}

export const eventBus = new EventBridge();
```

**Contoh setup handler (satu tempat):**

```ts
// bootstrap/eventHandlers.ts
import { eventBus } from '@/services/eventBridge';
import { useProcurementStore } from '@/features/procurement/procurementStore';
import { useNotificationStore } from '@/stores/notificationStore';

export function registerEventHandlers() {
  // --- PROSPECT CONVERTED ---
  eventBus.on('PROSPECT_CONVERTED', (event) => {
    // Update prospect status
    const prospectStore = useProspectStore.getState();
    prospectStore.updateProspect(event.prospectId, {
      isConverted: true,
      projectId: event.projectId,
    });
  });

  // --- PROJECT WON → create procurement ---
  eventBus.on('PROJECT_WON', async (event) => {
    const project = useProjectStore.getState().getProjectById(event.projectId);
    if (!project) return;
    
    // Check duplicate
    const existing = useProcurementStore.getState().procurements
      .find(p => p.sourceProjectId === event.projectId);
    if (existing) return;
    
    // Deep clone hanya untuk initial data (bukan untuk sync)
    const procurement = createProcurementFromProject(project);
    
    // Link relation
    useRelationStore.getState().linkProjectToProcurement(event.projectId, procurement.id);
    
    // Notify
    useNotificationStore.getState().addNotification({
      title: 'Pengadaan Dibuat',
      message: `Pengadaan ${procurement.code} dibuat dari proyek ${project.code}`,
      type: 'system',
    });
  });

  // --- PROJECT DELETED → cascade cleanup ---
  eventBus.on('PROJECT_DELETED', (event) => {
    const relationStore = useRelationStore.getState();
    const procIds = relationStore.getProcurementsByProject(event.projectId);
    
    // Hapus procurement terkait
    procIds.forEach(id => {
      useProcurementStore.getState().deleteProcurement(id);
    });
    
    // Bersihkan relasi
    relationStore.unlinkProjectToProcurement(event.projectId);
  });
}
```

### 3.6 Snapshot vs Reference — Explicit Strategy

Kita bedakan tiga tipe data antar modul:

| Tipe Data | Strategy | Contoh |
|-----------|----------|--------|
| **Identity** | Reference (sourceProjectId) | projectId, code, name |
| **Snapshot (immutable)** | Copy sekali saat transisi | contractValue, client, location |
| **Sync (mutable)** | Event-driven update | delivery dates, progress |

Implementasi:

```ts
// Utility untuk snapshot
function createSnapshot<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): Partial<T> {
  const snapshot: Partial<T> = {};
  for (const field of fields) {
    snapshot[field] = obj[field];
  }
  return snapshot;
}

// Saat konversi Prospek → Proyek:
const snapshot = createSnapshot(prospect, ['client', 'estimatedValue', 'branch']);
addProject({
  ...snapshot,
  sourceProspectId: prospect.id,
  // data lainnya...
});
```

---

## 4. Komponen Store Baru / Revisi

### 4.1 Relation Store (Baru)

**File:** `src/stores/relationStore.ts`  
**Persist:** ✅ Ya (relasi kecil, perlu survive refresh)  

```ts
interface RelationState {
  prospectToProject: Record<string, string>;  // 1-to-1
  projectToProcurement: Record<string, string[]>;  // 1-to-N
  // Optional: untuk navigasi balik
  procurementToProject: Record<string, string>;  // derived index
}
```

### 4.2 Event Bridge (Baru)

**File:** `src/services/eventBridge.ts`  
**Persist:** ❌ Tidak (ephemeral — handlers diregister tiap load)  

Bukan Zustand store — menggunakan class singleton.

### 4.3 Entity Stores (Refactor)

Store yang perlu di-refactor:

| Store | Perubahan |
|-------|-----------|
| `prospectStore.ts` | Hapus `deleteProspect` yang panggil approvalStore. Pindah ke event handler. |
| `projectStore.ts` | Hapus `deleteProject` yang panggil procurementStore & notificationStore. Pindah ke event handler. |
| `procurementStore.ts` | Pure CRUD — sudah cukup bersih, hanya perlu tambah `entities/ids` normalization opsional. |
| `approvalStore.ts` | Tidak perlu perubahan. |

### 4.4 Component Changes

| Component | Perubahan |
|-----------|-----------|
| `ProjectFormPage.tsx` | Ganti `useProspectStore.getState().updateProspect(...)` dengan `eventBus.emit({ type: 'PROSPECT_CONVERTED', ... })` |
| `ProspectDetailPage.tsx` | Ganti `deleteProject(projectId)` + `deleteProspect(id)` dengan event |
| `PemenangTab.tsx` | Ganti direct `createProcurementFromProject()` dengan emit `PROJECT_WON` event |
| `App.tsx` | Inisialisasi event handlers via `registerEventHandlers()` |

---

## 5. Migration Plan

### Phase 1: Foundation (Estimasi: 2-3 hari)

1. Buat `src/services/eventBridge.ts` — class EventBridge
2. Buat `src/types/events.ts` — semua definisi DomainEvent
3. Buat `src/stores/relationStore.ts` — Zustand store untuk relasi
4. Buat `src/bootstrap/eventHandlers.ts` — registrasi semua handler
5. Inisialisasi di `App.tsx`

### Phase 2: Refactor Entity Stores (Estimasi: 2 hari)

1. `prospectStore.ts` — hapus side-effect, pindahkan ke event handler
2. `projectStore.ts` — hapus side-effect, pindahkan ke event handler
3. Verifikasi tidak ada cross-store `getState()` panggilan di store actions

### Phase 3: Update Components (Estimasi: 2-3 hari)

1. `ProjectFormPage.tsx` — ganti `getState()` dengan emit event
2. `ProspectDetailPage.tsx` — ganti cascade delete dengan emit event
3. Tempat-tempat lain yang memanggil store dengan side-effect
4. Hapus `procurementService.ts` migration logic dari `App.tsx` (pindah ke event handler)

### Phase 4: Normalization & Persist Optimization (Estimasi: 2 hari)

1. Ubah entity stores ke normalized `Record<string, T>` pattern
2. Evaluasi persist strategy — selective persist (hanya entity, bukan derived data)
3. Implement structured clone (atau `structuredClone()` jika target browser support)

---

## 6. Testing Strategy

### Unit Test — Entity Stores

```ts
describe('ProspectStore - pure CRUD', () => {
  it('addProspect should not trigger any side effect', () => {
    const store = useProspectStore.getState();
    const spy = vi.spyOn(eventBus, 'emit');
    
    store.addProspect(mockProspect);
    
    expect(spy).not.toHaveBeenCalled(); // Pure CRUD = no event
  });
});
```

### Unit Test — Event Handlers

```ts
describe('Event Handlers - PROJECT_WON', () => {
  it('should create procurement and link relation', () => {
    eventBus.emit({ type: 'PROJECT_WON', projectId: 'PR-123', timestamp: now });
    
    const procurement = useProcurementStore.getState().procurements
      .find(p => p.sourceProjectId === 'PR-123');
    expect(procurement).toBeDefined();
    
    const linked = useRelationStore.getState().getProcurementsByProject('PR-123');
    expect(linked).toContain(procurement!.id);
  });
});
```

---

## 7. Risiko dan Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Event handler async gagal | Setiap handler di-isolate dengan try/catch. Error tidak mempengaruhi handler lain. |
| Infinite event loop (A→B→A) | EventBridge memiliki `published Set` untuk dedup dalam satu siklus. |
| Race condition saat rapid clicks | Optimistic update + event queue. Event diproses serial per source. |
| Migration dari old pattern besar | Bisa gradual — new code pake event, old code tetap jalan. Keduanya coexist. |

---

## 8. Kriteria Keberhasilan

1. ✅ Tidak ada `useXxxStore.getState()` yang memanggil store berbeda di dalam store actions
2. ✅ Semua side-effect untuk transisi modul terlihat di `bootstrap/eventHandlers.ts`
3. ✅ `deleteProject` cascade ke procurement via event, bukan via direct function call
4. ✅ Relation queries O(1) bukan O(n) scan array
5. ✅ Semua event tercatat (bisa untuk audit trail)
6. ✅ Unit test bisa mock eventBus tanpa perlu mock multiple stores

---

## 9. Referensi

- [Domain Events pattern — Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Zustand Best Practices — Event-driven side effects](https://docs.pmnd.rs/zustand/guides/event-driven-side-effects)
- [Normalized State Shape — Redux docs (applies to any store)](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
