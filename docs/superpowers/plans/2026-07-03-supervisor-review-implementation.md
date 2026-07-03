# Supervisor Marketing Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti reviewer prospek dari Project Manager (PM) menjadi Supervisor Marketing dengan role baru `supervisor`.

**Architecture:** Perubahan hanya di frontend (Zustand stores + React components). Role baru `supervisor` ditambahkan di RBAC store dengan permission approve prospek. Label dan teks di ProspectDetailPage diubah. Stage routing prospek diarahkan ke `stage-supervisor-review` yang sudah ada.

**Tech Stack:** React + TypeScript, Zustand (persist), Tailwind CSS

## Global Constraints

- Tidak mengubah tipe data Prospect (`status` tetap menggunakan `'Waiting PM'` internal)
- Tidak mengubah approval flow untuk RKS/LPHS — hanya prospek
- Tidak mengubah struktur API/backend
- Migration RBAC store version dinaikkan ke 8
- Mengikuti pattern yang sudah ada di setiap file

---

### Task 1: RBAC Store — Tambah Role Supervisor

**Files:**
- Modify: `stores/rbacStore.ts`

**Interfaces:**
- Consumes: RBAC store seed data pattern
- Produces: Role `supervisor`, permission assignments, seed user role, migration v8

- [ ] **Step 1: Tambah role supervisor ke SEED_ROLES**

Cari `SEED_ROLES` array di `stores/rbacStore.ts`, tambah entry baru setelah `role-director`:

```ts
{ id: 'role-supervisor', name: 'supervisor', description: 'Supervisor department — approve & monitor terbatas', is_system: true },
```

- [ ] **Step 2: Tambah role-permission untuk supervisor**

Cari `SEED_ROLE_PERMISSIONS` array, tambah setelah role-director entries (sebelum project roles):

```ts
// ── Supervisor (department) — khusus Marketing ──
{ id: 'rp-supervisor-1', roleId: 'role-supervisor', permissionId: 'perm-dash-view', scopeType: 'global', accessLevel: 'write' },
{ id: 'rp-supervisor-2', roleId: 'role-supervisor', permissionId: 'perm-notif-read', scopeType: 'global', accessLevel: 'read' },
{ id: 'rp-supervisor-3', roleId: 'role-supervisor', permissionId: 'perm-profile-manage', scopeType: 'global', accessLevel: 'write' },
{ id: 'rp-supervisor-4', roleId: 'role-supervisor', permissionId: 'perm-prospect-read', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'read' },
{ id: 'rp-supervisor-5', roleId: 'role-supervisor', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
{ id: 'rp-supervisor-6', roleId: 'role-supervisor', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'write' },
{ id: 'rp-supervisor-7', roleId: 'role-supervisor', permissionId: 'perm-project-read', scopeType: 'department', scopeId: 'dept-marketing', accessLevel: 'read' },
```

- [ ] **Step 3: Assign supervisor role ke user 5 (Siti Rahmawati)**

Cari `SEED_USER_ROLES` array. Ubah entry untuk user 5 (Siti) dari staff menjadi supervisor:

```ts
// Siti (user 5) → supervisor di Marketing
{ id: 'ur-5', userId: '5', roleId: 'role-supervisor', scopeType: 'department', scopeId: 'dept-marketing' },
```

- [ ] **Step 4: Tambah migration v8 di RBAC store persist config**

Cari bagian `migrate` di persist config. Tambah condition setelah `version < 7` block:

```ts
if (version < 8) {
  // v8: add supervisor role
  const roles = [...(current.roles || [])];
  const rolePermissions = [...(current.rolePermissions || [])];
  const userRoles = [...(current.userRoles || [])];

  // Add supervisor role if not exists
  if (!roles.find((r: any) => r.id === 'role-supervisor')) {
    roles.push({ id: 'role-supervisor', name: 'supervisor', description: 'Supervisor department — approve & monitor terbatas', is_system: true });
  }

  // Add supervisor permissions if not exists
  const SUPERVISOR_PERMS = [
    { id: 'rp-supervisor-1', permissionId: 'perm-dash-view', scopeType: 'global', scopeId: undefined },
    { id: 'rp-supervisor-2', permissionId: 'perm-notif-read', scopeType: 'global', scopeId: undefined },
    { id: 'rp-supervisor-3', permissionId: 'perm-profile-manage', scopeType: 'global', scopeId: undefined },
    { id: 'rp-supervisor-4', permissionId: 'perm-prospect-read', scopeType: 'department', scopeId: 'dept-marketing' },
    { id: 'rp-supervisor-5', permissionId: 'perm-prospect-write-prospecting', scopeType: 'department', scopeId: 'dept-marketing' },
    { id: 'rp-supervisor-6', permissionId: 'perm-prospect-approve-transition', scopeType: 'department', scopeId: 'dept-marketing' },
    { id: 'rp-supervisor-7', permissionId: 'perm-project-read', scopeType: 'department', scopeId: 'dept-marketing' },
  ];
  for (const p of SUPERVISOR_PERMS) {
    if (!rolePermissions.find((rp: any) => rp.id === p.id)) {
      rolePermissions.push({
        id: p.id,
        roleId: 'role-supervisor',
        permissionId: p.permissionId,
        scopeType: p.scopeType,
        scopeId: p.scopeId,
        accessLevel: p.permissionId === 'perm-notif-read' ? 'read' : 'write',
      });
    }
  }

  // Update Siti (user 5) to supervisor if still staff
  const sitiIdx = userRoles.findIndex((ur: any) => ur.userId === '5' && ur.roleId === 'role-staff');
  if (sitiIdx >= 0) {
    userRoles[sitiIdx] = { ...userRoles[sitiIdx], roleId: 'role-supervisor' };
  }

  return { ...current, roles, rolePermissions, userRoles };
}
```

Jangan lupa update versi dari `version: 7` menjadi `version: 8`.

- [ ] **Step 5: Commit**

```bash
git add stores/rbacStore.ts
git commit -m "feat(rbac): add supervisor role with prospect approve permission"
```

---

### Task 2: Update Approval Level di Master Data Store

**Files:**
- Modify: `stores/masterDataStore.ts`

- [ ] **Step 1: Ganti nama approval level**

Cari string `'Review PM / Kepala Cabang'` di `stores/masterDataStore.ts` dan ganti:

```ts
{ id: 'AL-01', name: 'Review Supervisor / Kepala Cabang', code: 'L1', level_number: 1, escalates_to_level_id: 'AL-02', description: 'Level pertama approval oleh Supervisor Marketing', is_active: true },
```

- [ ] **Step 2: Commit**

```bash
git add stores/masterDataStore.ts
git commit -m "fix(master-data): rename approval level from Review PM to Review Supervisor"
```

---

### Task 3: Update Prospect Detail Page — Label & Routing

**Files:**
- Modify: `features/prospects/ProspectDetailPage.tsx`

- [ ] **Step 1: Ubah stepper workflow label**

Cari `workflowSteps` array, ganti label:

```ts
const workflowSteps: StepperStep[] = [
  { label: 'Dibuat' },
  { label: 'Review Supervisor' },  // ← changed from 'Review PM'
  { label: 'Approval' },
  { label: 'Proyek' },
];
```

- [ ] **Step 2: Ubah timeline teks**

Cari `'Diajukan untuk Review PM'` dan ganti:

```ts
title: 'Diajukan ke Supervisor',
```

Cari `'Diajukan ke Project Manager.'` dan ganti:

```ts
description: `Prospek "${prospect.name}" diajukan ke Supervisor Marketing.`,
```

- [ ] **Step 3: Ubah timeline event untuk revisi dan approval**

Di bagian `prospect.status === 'Revision'`:

```ts
// Before
title: 'Revisi Diminta',
actor: 'Project Manager',
role: 'PM',
description: `PM meminta revisi untuk prospek "${prospect.name}".`,

// After
title: 'Revisi Diminta',
actor: 'Supervisor Marketing',
role: 'Supervisor',
description: `Supervisor Marketing meminta revisi untuk prospek "${prospect.name}".`,
```

Di bagian `prospect.status === 'Approved'`:

```ts
// Before
actor: 'Project Manager',
role: 'PM',
description: `Prospek "${prospect.name}" telah disetujui.`,

// After — tidak berubah karena "disetujui" tidak perlu nyebut role spesifik
// (biarkan default atau ubah jadi netral)
```

- [ ] **Step 4: Ubah tombol "Kirim Ulang ke PM"**

Cari `'Kirim Ulang ke PM'` dan ganti:

```tsx
Button variant="primary" size="sm" ... >
  {resubmitting ? 'Mengirim...' : 'Kirim Ulang ke Supervisor'}
</Button>
```

- [ ] **Step 5: Ubah notifikasi submit review**

Cari `'...direview oleh PM.'` dan ganti:

```ts
message: `Prospek "${prospect.name}" telah disubmit untuk direview oleh Supervisor.`,
```

- [ ] **Step 6: Ubah teks di Approval tab**

Cari `'Menunggu Persetujuan PM'` dan ganti:

```tsx
<p className="text-sm font-semibold text-on-surface">Menunggu Persetujuan Supervisor</p>
<pp className="text-xs text-secondary">Prospek sedang dalam antrian review Supervisor Marketing.</p>
```

Cari `'PM meminta revisi sebelum menyetujui prospek.'` dan ganti:

```tsx
<pp className="text-xs text-secondary">Supervisor Marketing meminta revisi sebelum menyetujui prospek.</p>
```

- [ ] **Step 7: Tambah permission check `can('prospect:approve:transition')` pada tombol approve/revisi**

Cari bagian render tombol Setujui dan Revisi. Tambah `can('prospect:approve:transition')` di kondisi:

```tsx
{prospect.status === 'Waiting PM' && access === 'write' && can('prospect:approve:transition') && (
  <>
    <Button ... onClick={handleApprove}>
      Setujui
    </Button>
    <Button ... onClick={handleRequestRevision}>
      Revisi
    </Button>
  </>
)}
```

- [ ] **Step 8: Update stage routing saat submit ke review**

Di fungsi `handleResubmit`, tambah `currentStageId`:

```tsx
const handleResubmit = () => {
  if (resubmitting) return;
  setResubmitting(true);
  updateProspect(prospect.id, { 
    status: 'Waiting PM',
    currentStageId: 'stage-supervisor-review',  // ← tambah ini
  });
  // ...
};
```

- [ ] **Step 9: Commit**

```bash
git add features/prospects/ProspectDetailPage.tsx
git commit -m "feat(prospect): update labels, routing, and permission check for supervisor review"
```

---

### Task 4: Update Prospect Form Page — Notifikasi

**Files:**
- Modify: `features/prospects/ProspectFormPage.tsx`

- [ ] **Step 1: Ubah teks notifikasi submit review**

Cari `'Prospek berhasil diajukan ke PM untuk review.'` dan ganti:

```ts
toast.success(status === 'Waiting PM' ? 'Prospek berhasil diajukan ke Supervisor untuk review.' : 'Draf prospek berhasil disimpan.');
```

- [ ] **Step 2: Commit**

```bash
git add features/prospects/ProspectFormPage.tsx
git commit -m "fix(prospect): update notification text from PM to Supervisor"
```

---

### Task 5: Update Mock Data

**Files:**
- Modify: `services/mock-data.ts`

- [ ] **Step 1: Update initial prospects yang relevan**

Cari `INITIAL_PROSPECTS`. Untuk prospek yang berstatus `'Waiting PM'`, pastikan `currentStageId` sesuai. Tidak perlu mengubah status karena kita tetap pakai `'Waiting PM'` internal.

Tapi update description di prospek mock data yang relevan (misalnya yang author-nya dari Marketing):

Prospek `{ id: '3', ... }` — author Bambang Permadi ada di PM department, biarkan.
Prospek `{ id: '7', ... }` — author Rina Marlina ada di Procurement, biarkan.

Tidak ada perubahan besar di mock data — hanya pastikan konsisten.

Opsional: Tambah prospek baru milik user Siti (supervisor) sebagai contoh.

- [ ] **Step 2: Commit**

```bash
git add services/mock-data.ts
git commit -m "chore(mock): align mock data with supervisor role"
```

---

## Ringkasan File yang Dimodifikasi

| File | Task | Perubahan |
|---|---|---|
| `stores/rbacStore.ts` | 1 | Tambah role supervisor, permission, seed user, migration v8 |
| `stores/masterDataStore.ts` | 2 | Rename approval level name |
| `features/prospects/ProspectDetailPage.tsx` | 3 | Update label, timeline, tombol, routing stage, permission check |
| `features/prospects/ProspectFormPage.tsx` | 4 | Update toast notification |
| `services/mock-data.ts` | 5 | (Opsional) align data |

## Urutan Eksekusi

Task 1 → Task 2 → Task 3 → Task 4 → Task 5

Setiap task independen dan bisa di-commit sendiri-sendiri.
