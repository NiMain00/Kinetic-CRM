# Supervisor Marketing Review untuk Prospek

**Date:** 2026-07-03
**Status:** Draft
**Author:** Claude

## Ringkasan

Mengganti reviewer prospek dari **Project Manager (PM)** menjadi **Supervisor Marketing**.
Menambahkan role baru `supervisor` yang dapat melakukan approval dan revisi terhadap prospek
di department Marketing.

## Latar Belakang

Saat ini workflow review prospek adalah:
```
Staff Marketing → Kirim Review → Project Manager (PM) → Approve/Revisi
```

Yang diinginkan:
```
Staff Marketing → Kirim Review → Supervisor Marketing → Approve/Revisi
```

PM tidak perlu terlibat dalam review prospek. Supervisor Marketing adalah role baru
yang bertanggung jawab untuk approval prospek di level cabang/department Marketing.

## Desain

### 1. Role Baru: Supervisor

**File:** `stores/rbacStore.ts`

Menambahkan role `supervisor` dengan permission:

| Permission | Scope | Level |
|---|---|---|
| `dashboard:view` | global | write |
| `notification:read` | global | read |
| `profile:manage` | global | write |
| `prospect:read` | department (MARKETING) | read |
| `prospect:write:prospecting` | department (MARKETING) | write |
| `prospect:approve:transition` | department (MARKETING) | write |
| `project:read` | department (MARKETING) | read |

Seed user assignment:
- User 5 (Siti Rahmawati) → role `supervisor` di department Marketing
- User 10 (Bagus) tetap `manager` di Marketing

### 2. Workflow Steps

**File:** `features/prospects/ProspectDetailPage.tsx`

Stepper berubah dari:
```
Dibuat → Review PM → Approval → Proyek
```
menjadi:
```
Dibuat → Review Supervisor → Approval → Proyek
```

### 3. Perubahan Label & Teks

| Lokasi | Before | After |
|---|---|---|
| Stepper label | `Review PM` | `Review Supervisor` |
| Timeline title | `Diajukan untuk Review PM` | `Diajukan ke Supervisor` |
| Timeline actor | `Project Manager` | `Supervisor Marketing` |
| Timeline role | `PM` | `Supervisor` |
| Timeline desc | `...diajukan ke Project Manager.` | `...diajukan ke Supervisor Marketing.` |
| Revisi desc | `PM meminta revisi...` | `Supervisor Marketing meminta revisi...` |
| Approve desc | `Prospek telah disetujui.` | (sama, tidak berubah) |
| Button label | `Kirim Ulang ke PM` | `Kirim Ulang ke Supervisor` |
| Approval tab | `Menunggu Persetujuan PM` | `Menunggu Persetujuan Supervisor` |
| Notification | `...direview oleh PM.` | `...direview oleh Supervisor.` |

### 4. Stage Routing

**File:** `features/prospects/ProspectFormPage.tsx`, `features/prospects/ProspectDetailPage.tsx`

Saat prospek disubmit untuk review:
- Gunakan stage `stage-supervisor-review` (sudah ada di RBAC seed data)
  - Kode: `supervisor_review`
  - Owner: `MARKETING`
  - Prev: `MARKETING`
- `currentStageId` diubah ke `stage-supervisor-review`

### 5. Approval Permission Check

Tombol Setujui/Revisi di detail prospek sekarang memeriksa dua kondisi:
```ts
prospect.status === 'Waiting PM' && 
access === 'write' && 
can('prospect:approve:transition')
```

Ini memastikan hanya user dengan permission approve (supervisor, manager, admin, super_admin)
yang bisa melakukan aksi review.

### 6. Approval Inbox

**File:** `features/approvals/ApprovalInboxPage.tsx`

Tidak ada perubahan struktural. Approval prospek akan muncul untuk user yang punya
`prospect:approve:transition` permission di department Marketing — termasuk supervisor,
manager, admin, dan super_admin.

### 7. RBAC Store Migration

**File:** `stores/rbacStore.ts`

Versi RBAC store dinaikkan ke 8. Migration menambahkan:
- Role `supervisor` dan permissionnya
- User role assignment untuk Siti Rahmawati (user 5)

## File yang Berubah

| File | Perubahan |
|---|---|
| `types/domain/index.ts` | (opsional) tidak ada perubahan tipe |
| `stores/rbacStore.ts` | Tambah role supervisor + permission + seed + migration |
| `stores/masterDataStore.ts` | Ubah approval level name dari `Review PM / Kepala Cabang` |
| `features/prospects/ProspectDetailPage.tsx` | Ubah stepper label, timeline text, approval text, button text, routing stage |
| `features/prospects/ProspectFormPage.tsx` | Ubah notifikasi submit review |
| `features/prospects/ProspectsPage.tsx` | (opsional) tidak ada perubahan |
| `features/approvals/ApprovalReviewDrawer.tsx` | (opsional) tidak ada perubahan |
| `services/mock-data.ts` | Update initial prospects yang relevan |

## Tabel Perbandingan: Sebelum vs Sesudah

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Reviewer prospek | Project Manager (PM) | Supervisor Marketing |
| Label workflow | Review PM | Review Supervisor |
| Role yang approve | PM, Manager, Admin, Super Admin | Supervisor, Manager, Admin, Super Admin |
| Stage untuk review | `stage-prospecting` (tidak berubah) | `stage-supervisor-review` |
| Permission check | `access === 'write'` | `access === 'write'` + `can('prospect:approve:transition')` |

## Scope Pekerjaan

1. **RBAC Store** — tambah role supervisor, permission, seed user, migration v8
2. **Master Data Store** — update approval level name
3. **Prospect Detail Page** — update semua label, teks, routing stage, permission check
4. **Prospect Form Page** — update notifikasi
5. **Mock Data** — update initial prospects

## Catatan

- Tidak ada perubahan pada approval RKS/LPHS — flow tersebut tetap menggunakan PM
- Tidak ada perubahan pada struktur database atau API — perubahan hanya di frontend (Zustand stores + komponen)
- Role `supervisor` berbeda dengan `manager` — supervisor hanya bisa approve prospek di Marketing, sedangkan manager memiliki scope lebih luas
