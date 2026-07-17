# Restrukturasi UI/UX Modul Prospek

**Tanggal:** 2026-07-15
**Status:** Approved
**Audience:** Sales, Project Manager, Admin

---

## 1. Latar Belakang

Modul Prospek telah mengalami penambahan fitur-fitur baru (Visit, Ticket) yang ditempatkan tanpa mempertimbangkan alur kerja (workflow) pengguna. Halaman detail prospek memiliki **6 section dalam 1 tab Overview** yang menyebabkan cognitive overload. Fitur Ticket (Serah Terima) tidak sesuai dengan konteks pre-sales dan membingungkan secara terminologi.

## 2. Temuan Audit

| # | Masalah | Severity |
|---|---------|----------|
| 1 | Overview tab terlalu padat — 6 section dalam 1 scroll | **High** |
| 2 | Visit (Kunjungan) adalah syarat workflow namun terletak paling bawah | **High** |
| 3 | Ticket (Serah Terima) tidak relevan di konteks pre-sales | **High** |
| 4 | Activity Feed duplikat di Overview + Timeline tab | **Medium** |
| 5 | Ticket tidak memiliki integrasi workflow dengan status prospek | **Medium** |

## 3. Keputusan Desain

### 3.1 Struktur Tab Baru (7 tabs → dari 6 sebelumnya)

| # | Tab | Tujuan | Sumber |
|---|-----|--------|--------|
| 1 | **Overview** | Ringkasan + Data Customer + Detail Prospek + Pertanyaan + **Activity Feed penuh** | Existing (disempurnakan) |
| 2 | **Kunjungan** | Manajemen visit lapangan — CRUD, filter status | **NEW** (dipindah dari Overview) |
| 3 | **Tindak Lanjut** | Follow-up task internal — menggantikan Ticket | **NEW** (menggantikan Ticket) |
| 4 | **Dokumen** | Manajemen dokumen | Existing (unchanged) |
| 5 | **Kontak** | Informasi kontak customer | Existing (unchanged) |
| 6 | **Approval** | Status approval workflow | Existing (unchanged) |
| 7 | **Proyek Terkait** | Project terkait dari prospek ini | Existing (unchanged) |

**Yang dihapus:**
- Tab **Timeline** (activity feed dipindah ke Overview, timeline events juga di Overview)
- Ticket dari Overview

### 3.2 Overview Tab — Layout Final

```
├── Row 1: ┌─────────────────┐ ┌─────────────────┐
│          │ Data Customer    │ │ Detail Prospek   │
│          └─────────────────┘ └─────────────────┘
├── Row 2: ┌─────────────────────────────────────┐
│          │ Deskripsi & Kebutuhan (full width)   │
│          └─────────────────────────────────────┘
├── Row 3: ┌─────────────────┐ ┌─────────────────┐
│          │ Pertanyaan       │ │ Aktivitas        │
│          │ Standar          │ │ (Full Activity   │
│          │                  │ │  Feed + Timeline)│
│          └─────────────────┘ └─────────────────┘
```

### 3.3 Tab Kunjungan — Layout

- Header dengan tombol **Tambah Kunjungan**
- **Filter Tab**: Semua | Pending | Selesai | Dibatalkan
- **Daftar Card Kunjungan**: Nomor kunjungan, tanggal, PIC, status badge, catatan, aksi (Selesaikan/Batalkan)
- Modal form tambah kunjungan (sama dengan existing)

### 3.4 Tab Tindak Lanjut — Layout

- Header dengan tombol **Buat Tugas Baru**
- **Filter**: Semua | Belum | Sedang | Selesai
- **Daftar Card Tugas**: Judul, prioritas badge, dari/untuk user, deadline, progress bar, status
- Modal form: Judul, Prioritas, Assignee, Deadline (BARU), Catatan
- **Perubahan dari Ticket:**
  - ✅ Rename "Serah Terima (Ticket)" → **"Tindak Lanjut"**
  - ✅ Tambah field **Deadline Date**
  - ✅ Hapus terminologi "ticket"
  - ✅ Filter berdasarkan status + priority

### 3.5 Hero Section — Unchanged

Header, stepper, action buttons tetap sama — sudah baik dan intuitif.

## 4. Data Model — Tindak Lanjut (Task)

Menggantikan Ticket. Perubahan minimal:

```typescript
// Before: Ticket
interface Ticket {
  id: string;
  title: string;
  prospectId: string;
  fromUserId: string;
  toUserId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  notes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// After: FollowUpTask
interface FollowUpTask {
  id: string;
  title: string;
  prospectId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  notes?: string;
  deadline?: string;       // NEW field
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

Backend Ticket → FollowUpTask: ubah nama endpoint, model, dan tabel.

## 5. Prinsip UI/UX yang Diterapkan

| Prinsip | Penerapan |
|---------|-----------|
| **Hierarchy** | Informasi paling penting (Customer, Detail, Status) di paling atas |
| **Visibility** | Visit dan Follow-up punya tab sendiri — tidak tersembunyi |
| **Consistency** | Pattern card per item konsisten di seluruh tab |
| **Cognitive Load** | Setiap tab memiliki 1 fungsi utama yang jelas |
| **Discoverability** | Fitur mudah ditemukan karena terkelompok secara logis |

## 6. Files yang Akan Diubah

### Frontend
1. `frontend/src/features/prospects/ProspectDetailPage.tsx` — **Major rewrite** (restruktur tab, hapus Ticket, pindah Visit)
2. `frontend/src/stores/ticketStore.ts` — **Refactor** → rename ke `followUpStore.ts`
3. `frontend/src/types/domain/index.ts` — Update Ticket → FollowUpTask type
4. `frontend/src/features/prospects/ProspectPipelinePage.tsx` — Minor (rename Ticket ref jika ada)
5. `frontend/src/config/nav-items.ts` — Possible update untuk link Follow-up (opsional)

### Backend
6. `backend/src/tickets/` — **Refactor** → rename ke `follow-up/`
7. `backend/src/app.module.ts` — Update import

### Database (Prisma)
8. `prisma/schema.prisma` — Rename model Ticket → FollowUpTask, tambah field `deadline`

## 7. Scope

**In scope:**
- Restrukturasi tab ProspectDetailPage
- Pembuatan tab Kunjungan (Visit) yang dedicated
- Pembuatan tab Tindak Lanjut (Follow-up Task) menggantikan Ticket
- Rename model Ticket → FollowUpTask
- Activity Feed full di Overview (Timeline tab dihapus)
- Backend API refactor untuk FollowUpTask

**Out of scope:**
- Fitur task management global (hanya dalam konteks prospek)
- Perubahan pada halaman list Prospek / pipeline
- Perubahan pada modul Project
- Fitur notifikasi untuk follow-up task
