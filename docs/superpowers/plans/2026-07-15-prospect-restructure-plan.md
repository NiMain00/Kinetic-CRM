# Restrukturasi UI/UX Prospek — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merestrukturasi halaman detail Prospek dengan tab baru (Kunjungan, Tindak Lanjut), menghapus Timeline tab, memindahkan Activity Feed ke Overview, dan mengganti Ticket → FollowUpTask.

**Architecture:** Backend refactor Ticket → FollowUpTask (rename model + controller + service), Prisma migration rename table + add deadline field, frontend restructure ProspectDetailPage tabs, frontend store rename.

**Tech Stack:** NestJS + Prisma + React + Zustand + TypeScript

## Global Constraints

- Naming: "FollowUpTask" not "Ticket" (PascalCase code, snake_case DB)
- Status values: pending | in_progress | completed
- Priority values: low | medium | high (remove "urgent")
- All existing Ticket data must be migrated via Prisma migration (rename table)
- Tab order in ProspectDetailPage: Overview → Kunjungan → Tindak Lanjut → Dokumen → Kontak → Approval → Proyek Terkait

---

### Task 1: Prisma Schema — Rename Ticket → FollowUpTask + Add Deadline

**Files:**
- Modify: `prisma/schema.prisma` (lines 960-982)

**Interfaces:**
- Produces: Prisma model `FollowUpTask` with fields: id, title, prospectId, fromUserId, toUserId, status (FollowUpStatus), priority (TaskPriority → NEW), progress, notes, deadline (DateTime?), completedAt, createdAt, updatedAt

- [ ] **Step 1: Update Prisma schema**

Replace the Ticket model and its enums:

```prisma
// Replace enum TicketStatus with:
enum FollowUpStatus {
  pending       @map("pending")
  in_progress   @map("in_progress")
  completed     @map("completed")
}

// Add new priority enum (or reuse existing TaskPriority — check if it exists)
// Check if TaskPriority already exists in schema. If not, add:
// (actually check the existing schema first)

// Replace model Ticket with:
model FollowUpTask {
  id          String         @id @default(uuid()) @map("id")
  title       String         @db.VarChar(255)
  prospectId  String         @map("prospect_id")
  fromUserId  String         @map("from_user_id")
  toUserId    String         @map("to_user_id")
  status      FollowUpStatus @default(pending)
  priority    TaskPriority   @default(medium)
  progress    Int            @default(0)
  notes       String?        @db.Text
  deadline    DateTime?      @map("deadline") @db.Date
  completedAt DateTime?      @map("completed_at")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  prospect Prospect @relation(fields: [prospectId], references: [id], onDelete: Cascade)
  fromUser User     @relation("FollowUpFromUser", fields: [fromUserId], references: [id])
  toUser   User     @relation("FollowUpToUser", fields: [toUserId], references: [id])

  @@index([prospectId])
  @@index([toUserId])
  @@index([status])
  @@map("follow_up_tasks")
}

// Update Prospect model to use FollowUpTask instead of Ticket:
// In model Prospect, replace: tickets Ticket[] → followUpTasks FollowUpTask[]
```

- [ ] **Step 2: Check existing TaskPriority enum in schema**

```bash
grep -n "enum TaskPriority" prisma/schema.prisma
```

If exists, reuse it. If not, add it.

- [ ] **Step 3: Update Prospect model relation**

In `model Prospect`, find line `tickets Ticket[]` and replace with `followUpTasks FollowUpTask[]`

- [ ] **Step 4: Generate Prisma migration**

```bash
npx prisma migrate dev --name rename_ticket_to_follow_up_task --create-only
```

Then edit the generated migration SQL to use `RENAME TABLE tickets TO follow_up_tasks` instead of DROP + CREATE.

- [ ] **Step 5: Apply migration**

```bash
npx prisma migrate dev --name rename_ticket_to_follow_up_task
```

- [ ] **Step 6: Generate Prisma client**

```bash
npx prisma generate
```

---

### Task 2: Backend — Rename tickets module to follow-up

**Files:**
- Create: `backend/src/follow-up/follow-up.module.ts`
- Create: `backend/src/follow-up/follow-up.controller.ts`
- Create: `backend/src/follow-up/follow-up.service.ts`
- Delete: `backend/src/tickets/tickets.module.ts`
- Delete: `backend/src/tickets/tickets.controller.ts`
- Delete: `backend/src/tickets/tickets.service.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: Prisma model `FollowUpTask`
- Produces: Controller endpoints at `/follow-up` with same routes pattern as tickets

- [ ] **Step 1: Rename all backend ticket files to follow-up**

Copy the content and rename.

Create `backend/src/follow-up/follow-up.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProspect(prospectId: string) {
    return this.prisma.followUpTask.findMany({
      where: { prospectId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async get(id: string) {
    const task = await this.prisma.followUpTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Follow-up task not found');
    return task;
  }

  async create(data: {
    title: string;
    prospectId: string;
    fromUserId: string;
    toUserId: string;
    priority?: string;
    notes?: string;
    deadline?: string;
  }) {
    return this.prisma.followUpTask.create({
      data: {
        title: data.title,
        prospectId: data.prospectId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        priority: (data.priority as any) || 'medium',
        notes: data.notes,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: 'pending',
        progress: 0,
      },
    });
  }

  async update(id: string, data: {
    status?: string;
    priority?: string;
    progress?: number;
    notes?: string;
    title?: string;
    deadline?: string;
  }) {
    await this.get(id);
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.title) updateData.title = data.title;
    if (data.deadline) updateData.deadline = new Date(data.deadline);
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    }
    return this.prisma.followUpTask.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.followUpTask.delete({ where: { id } });
  }
}
```

Create `backend/src/follow-up/follow-up.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowUpService } from './follow-up.service';

@UseGuards(AuthGuard('jwt'))
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly service: FollowUpService) {}

  @Get('by-prospect/:prospectId')
  listByProspect(@Param('prospectId') prospectId: string) {
    return this.service.listByProspect(prospectId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

Create `backend/src/follow-up/follow-up.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowUpController } from './follow-up.controller';
import { FollowUpService } from './follow-up.service';

@Module({
  imports: [PrismaModule],
  controllers: [FollowUpController],
  providers: [FollowUpService],
})
export class FollowUpModule {}
```

- [ ] **Step 2: Update app.module.ts**

Replace `TicketsModule` import with `FollowUpModule`:
```typescript
import { FollowUpModule } from './follow-up/follow-up.module';
// ...
    FollowUpModule,
// remove: TicketsModule,
```

- [ ] **Step 3: Delete old ticket files**

```bash
rm -rf backend/src/tickets/
```

- [ ] **Step 4: Verify build**

```bash
cd backend && npx tsc --noEmit
```

---

### Task 3: Frontend Types — Update domain types

**Files:**
- Modify: `frontend/src/types/domain/index.ts`

**Interfaces:**
- Produces: `FollowUpTask` type replacing `Ticket`

- [ ] **Step 1: Replace Ticket interface with FollowUpTask**

```typescript
// Remove these lines:
// export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
// export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
// export interface Ticket { ... }

// Add these:
export type FollowUpStatus = 'pending' | 'in_progress' | 'completed';
export type FollowUpPriority = 'low' | 'medium' | 'high';

export interface FollowUpTask {
  id: string;
  title: string;
  prospectId: string;
  fromUserId: string;
  toUserId: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  progress: number;
  notes?: string;
  deadline?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update Prospect import if needed** (remove Ticket import reference)

Also check if `Ticket` is imported anywhere else in the store files.

---

### Task 4: Frontend Store — Create followUpStore, deprecate ticketStore

**Files:**
- Create: `frontend/src/stores/followUpStore.ts`
- Delete: `frontend/src/stores/ticketStore.ts`

**Interfaces:**
- Consumes: `FollowUpTask` type, API endpoints `/follow-up`
- Produces: Zustand store `useFollowUpStore` with same API as ticketStore

- [ ] **Step 1: Create followUpStore.ts**

```typescript
import { create } from 'zustand';
import apiClient, { unwrap } from '@/services/api-client';
import type { FollowUpTask } from '@/types/domain';

interface FollowUpState {
  tasks: Record<string, FollowUpTask[]>;
  loading: boolean;
  fetchTasks: (prospectId: string) => Promise<void>;
  createTask: (data: {
    title: string;
    prospectId: string;
    fromUserId: string;
    toUserId: string;
    priority?: string;
    notes?: string;
    deadline?: string;
  }) => Promise<void>;
  updateTask: (id: string, data: {
    status?: string;
    priority?: string;
    progress?: number;
    notes?: string;
    title?: string;
    deadline?: string;
  }) => Promise<void>;
  deleteTask: (id: string, prospectId: string) => Promise<void>;
}

export const useFollowUpStore = create<FollowUpState>()((set, get) => ({
  tasks: {},
  loading: false,

  fetchTasks: async (prospectId) => {
    set({ loading: true });
    try {
      const res = await apiClient.get(`/follow-up/by-prospect/${prospectId}`);
      const data = unwrap<FollowUpTask[]>(res) || res.data;
      set((s) => ({ tasks: { ...s.tasks, [prospectId]: data }, loading: false }));
    } catch {
      set({ loading: false });
    }
  },

  createTask: async (data) => {
    await apiClient.post('/follow-up', data);
    get().fetchTasks(data.prospectId);
  },

  updateTask: async (id, data) => {
    await apiClient.put(`/follow-up/${id}`, data);
    const current = get().tasks;
    for (const prospectId of Object.keys(current)) {
      if (current[prospectId].some((t) => t.id === id)) {
        get().fetchTasks(prospectId);
        break;
      }
    }
  },

  deleteTask: async (id, prospectId) => {
    await apiClient.delete(`/follow-up/${id}`);
    get().fetchTasks(prospectId);
  },
}));
```

- [ ] **Step 2: Delete ticketStore.ts**

```bash
rm frontend/src/stores/ticketStore.ts
```

---

### Task 5: ProspectDetailPage — Major Restructure (Core Task)

**Files:**
- Modify: `frontend/src/features/prospects/ProspectDetailPage.tsx`

This is the largest change — complete rewrite of the tab structure and content.

- [ ] **Step 1: Replace imports**

Old:
```typescript
import type { TimelineEvent, Visit, Ticket } from '@/types/domain';
import { useTicketStore } from '@/stores/ticketStore';
```

New:
```typescript
import type { TimelineEvent, Visit, FollowUpTask } from '@/types/domain';
import { useFollowUpStore } from '@/stores/followUpStore';
```

- [ ] **Step 2: Update tab definitions**

Replace the 6 tabs with 7 tabs:
```typescript
const detailTabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'visits', label: 'Kunjungan', icon: 'event_note' },
  { id: 'follow-up', label: 'Tindak Lanjut', icon: 'assignment' },
  { id: 'documents', label: 'Dokumen', icon: 'description' },
  { id: 'contacts', label: 'Kontak', icon: 'contacts' },
  { id: 'approval', label: 'Approval', icon: 'approval' },
  { id: 'related-project', label: 'Proyek Terkait', icon: 'business' },
];
```

- [ ] **Step 3: Remove Ticket state, add FollowUpTask state**

Replace:
```typescript
// Ticket state
const [showTicketModal, setShowTicketModal] = useState(false);
const [ticketForm, setTicketForm] = useState({ title: '', toUserId: '', priority: 'medium' as const, notes: '' });
const tickets = useTicketStore((s) => id ? s.tickets[id] || [] : []);
const fetchTickets = useTicketStore((s) => s.fetchTickets);
const createTicket = useTicketStore((s) => s.createTicket);
const updateTicket = useTicketStore((s) => s.updateTicket);
```

With:
```typescript
// Follow-up Task state
const [showTaskModal, setShowTaskModal] = useState(false);
const [taskForm, setTaskForm] = useState({
  title: '',
  toUserId: '',
  priority: 'medium' as const,
  notes: '',
  deadline: '',
});
const tasks = useFollowUpStore((s) => id ? s.tasks[id] || [] : []);
const fetchTasks = useFollowUpStore((s) => s.fetchTasks);
const createTask = useFollowUpStore((s) => s.createTask);
const updateTask = useFollowUpStore((s) => s.updateTask);
```

- [ ] **Step 4: Update useEffect**

Replace `fetchTickets(id)` → `fetchTasks(id)`.

- [ ] **Step 5: Update handlePromoteToProspek visit check**

The visit status check already works — no changes needed to the logic (`visits.some(v => v.status === 'completed')`).

- [ ] **Step 6: Remove Visit and Ticket cards from Overview tab**

In the Overview tab content (lines 861-993), remove the entire "Row 4" grid that contains the Visit and Ticket cards. Activity feed stays but now takes the full right column alongside questions.

- [ ] **Step 7: Remove Timeline tab — move activity into Overview**

Remove the Timeline tab from the tab navigation. The activity feed now lives full-size in the Overview tab (right column, alongside questions).

Update Overview tab layout:
```tsx
{activeTab === 'overview' && (
  <div className="space-y-6">
    {/* Row 1: Data Customer + Detail Prospek */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Card: Data Customer — unchanged */}
      {/* Card: Detail Prospek — unchanged */}
    </div>

    {/* Row 2: Deskripsi (full width) */}
    {prospect.description && (
      <div>...</div>
    )}

    {/* Row 3: Questions + Full Activity Feed */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Questions */}
      {prospect.answers && Object.keys(prospect.answers).length > 0 ? (
        <div>...</div>
      ) : ...}

      {/* Right: Activity Feed (FULL — komentar + timeline + notifikasi) */}
      <div className="bg-surface border border-border/60 border-l-4 border-l-status-orange rounded-xl p-5 shadow-card">
        <h4 className="font-bold text-xs text-status-orange uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <span className="material-symbols-outlined text-[16px]">forum</span>
          Aktivitas
        </h4>
        {renderActivityFeed()}
        {/* Add Timeline events below activity feed */}
        {events.length > 0 && (
          <>
            <div className="border-t border-border my-4" />
            <h5 className="text-xs font-semibold text-outline mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">timeline</span>
              Timeline Audit Trail
            </h5>
            {renderTimeline()}
          </>
        )}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 8: Add Visit tab content**

```tsx
{activeTab === 'visits' && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-sm text-info flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[20px]">event_note</span>
        Daftar Kunjungan
      </h3>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
        onClick={() => setShowVisitModal(true)}
      >
        Tambah Kunjungan
      </Button>
    </div>

    {/* Filter tabs */}
    <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-border/60 w-fit">
      {['all', 'pending', 'completed', 'cancelled'].map((filter) => (
        <button
          key={filter}
          onClick={() => setVisitFilter(filter)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            visitFilter === filter
              ? 'bg-surface text-primary shadow-sm border border-border/60'
              : 'text-secondary hover:bg-surface-container-high'
          }`}
        >
          {filter === 'all' ? 'Semua' :
           filter === 'pending' ? 'Pending' :
           filter === 'completed' ? 'Selesai' : 'Dibatalkan'}
          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-high">
            {filteredVisits.length}
          </span>
        </button>
      ))}
    </div>

    {/* Visit list */}
    {filteredVisits.length === 0 ? (
      <div className="text-center py-12 text-outline">
        <span className="material-symbols-outlined text-4xl text-outline/50 mb-2">event_busy</span>
        <p className="text-sm font-medium">Belum ada kunjungan</p>
      </div>
    ) : (
      <div className="grid gap-3">
        {filteredVisits.map((v) => (
          <VisitCard
            key={v.id}
            visit={v}
            onComplete={...}
            onCancel={...}
          />
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 9: Add Follow-up (Tindak Lanjut) tab content**

Similar structure to visits tab but for tasks. Shows task cards with priority badges, progress bars, deadlines, and action buttons.

- [ ] **Step 10: Create VisitCard and TaskCard sub-components**

Extract these into the same file or as components in the prospects folder:
- `VisitCard` — card display for a single visit
- `TaskCard` — card display for a single follow-up task

- [ ] **Step 11: Update the Visit modal**

Move the existing Visit modal — no changes needed to its content, just keep it at the bottom of the file as-is.

- [ ] **Step 12: Create Follow-up Task modal**

Replace the existing Ticket modal with a Task modal:
- Title field (required)
- PIC Tujuan dropdown (required) — reuse users state
- Prioritas dropdown: Rendah | Sedang | Tinggi
- Deadline date picker (NEW)
- Catatan textarea

- [ ] **Step 13: Add visitFilter state and derived filteredVisits**

```typescript
const [visitFilter, setVisitFilter] = useState<string>('all');

const filteredVisits = useMemo(() => {
  if (visitFilter === 'all') return visits;
  return visits.filter(v => v.status === visitFilter);
}, [visits, visitFilter]);
```

Similarly add `taskFilter` state and `filteredTasks`.

---

### Task 6: Remove Timeline tab and consolidate routing

- [ ] **Step 1: Remove Timeline tab from detailTabs**

Already done in Task 5 Step 2 — verify the tab definition no longer includes 'timeline'.

- [ ] **Step 2: Clean up any router references**

No router changes needed — the tabs are internal state, not routes.

---

### Task 7: Clean up unused imports and references

- [ ] **Step 1: Check all files that import from ticketStore**

```bash
grep -r "ticketStore" frontend/src/ --include="*.ts" --include="*.tsx"
```

Update or remove any remaining references.

- [ ] **Step 2: Check all files that reference Ticket type**

```bash
grep -r "import.*Ticket.*from" frontend/src/ --include="*.ts" --include="*.tsx"
```

Update to FollowUpTask where needed.

- [ ] **Step 3: Check backend tests for tickets module**

If tests exist, rename them from `tickets` to `follow-up`.

---

### Task 8: Final verification

- [ ] **Step 1: Build check backend**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 2: Build check frontend**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Verify migration applied**

```bash
npx prisma migrate status
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: restructure prospect UI/UX - add Kunjungan and Tindak Lanjut tabs, replace Ticket with FollowUpTask"
```
