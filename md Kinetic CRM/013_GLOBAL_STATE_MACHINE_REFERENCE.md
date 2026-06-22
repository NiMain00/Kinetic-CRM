# 013 — GLOBAL STATE MACHINE REFERENCE
## KINETIC CRM — Referensi State Machine Terpusat

**Versi Dokumen:** 1.0
**Tanggal:** Juni 2025
**Klasifikasi:** Confidential / Internal
**Sumber:** PRD §6, BA Review §B.4, GAP04, GAP26

---

## 1. TUJUAN DOKUMEN

Dokumen ini adalah **referensi tunggal** untuk seluruh state machine yang ada di KINETIC CRM. Tujuannya:

1. Mencegah inkonsistensi antara implementasi frontend, backend, dan database.
2. Menjadi sumber kebenaran tunggal saat developer, QA, atau BA membutuhkan detail transisi status.
3. Mendefinisikan `precondition`, `postcondition`, `actor`, dan `side effect` dari setiap transisi.

**Prinsip utama:** State machine di-enforce di **backend**. Frontend hanya menyembunyikan/menampilkan aksi yang sesuai status saat ini, tetapi backend **SELALU** memvalidasi transisi sebelum eksekusi.

---

## 2. STATE MACHINE: PROSPEK

### 2.1 Diagram State

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │ create()
                         ▼
                    ┌─────────┐
              ┌────►│  DRAFT  │◄──────────────┐
              │     └────┬────┘               │
              │          │ submit()            │
              │          ▼                    │
              │  ┌──────────────────┐         │
              │  │ WAITING_PM_      │         │
              │  │ APPROVAL         │         │
              │  └────────┬─────────┘         │
              │           │                   │
              │      ┌────┴────┐              │
              │      ▼         ▼              │
              │  ┌────────┐  ┌──────────┐     │
              │  │APPROVED│  │ REVISION │─────┘
              │  └────┬───┘  └──────────┘
              │       │         re-submit by cabang
              │       │
              │       ▼
              │  ┌──────────────────┐
              │  │ [Proyek Dibuat]  │ (terminal - prospek selesai perannya)
              │  └──────────────────┘
              │
              └── delete() (hanya dari DRAFT)
```

### 2.2 Tabel Transisi Prospek

| Dari Status | Event | Ke Status | Actor | Precondition | Side Effect |
|-------------|-------|-----------|-------|--------------|-------------|
| — | `create()` | `draft` | cabang, admin | User aktif; cabang terdaftar | `created_by`, `created_at` terisi |
| `draft` | `submit()` | `waiting_pm_approval` | cabang (pemilik), admin | Nama prospek terisi; customer terpilih | Notifikasi ke PM |
| `draft` | `delete()` | *(dihapus)* | cabang (pemilik), admin | Tidak ada proyek turunan | Soft delete |
| `waiting_pm_approval` | `approve()` | `approved` | pm, admin | PM yang ditugaskan ke cabang ini | Notifikasi ke Cabang; log approval |
| `waiting_pm_approval` | `send_revision()` | `revision` | pm, admin | Min 1 pertanyaan review diisi | Notifikasi ke Cabang |
| `revision` | `resubmit()` | `waiting_pm_approval` | cabang (pemilik), admin | Semua pertanyaan review terjawab | Notifikasi ke PM; log re-submit |
| `approved` | `convert_to_project()` | *(prospek menjadi referensi proyek)* | cabang (pemilik), admin | Status = approved | Proyek baru dibuat; prospek_id di-link |

### 2.3 Aturan Tambahan Prospek

- Prospek yang sudah dikonversi ke proyek **tidak dapat diedit atau dihapus**.
- Satu prospek dapat dikonversi ke **maksimal satu proyek** (one-to-one).
- PM yang dimaksud adalah PM yang ditugaskan ke Cabang, bukan PM manapun.
- `revision` count dicatat untuk analytics; > 3 revisi ditandai di dashboard PM.

---

## 3. STATE MACHINE: PROYEK (TENDER)

### 3.1 Diagram State — Proyek Tender

```
                          ┌─────────┐
                          │ CREATED │
                          └────┬────┘
                               │ submit_rks()
                               ▼
                        ┌────────────┐
                   ┌───►│ SUBMIT_RKS │◄──┐
                   │    └─────┬──────┘   │
                   │          │          │ re_submit_rks() [dari REVISION]
                   │     ┌────┴────┐     │
                   │     ▼         ▼     │
                   │  approve   revise   │
                   │     │         │     │
                   │     │     ┌───▼─┐   │
                   │     │     │REVI-│───┘
                   │     │     │SION │
                   │     │     └─────┘
                   │     ▼
                   │ ┌────────────────────┐
                   │ │ REVIEW_DEPARTMENT  │◄──────────────────┐
                   │ └────────────────────┘                   │
                   │          │ (semua dept + PM approve LPHS) │
                   │          ▼                               │
                   │ ┌────────────────────┐                  │
                   │ │    LPHS_SIOS       │──── (revisi) ─────┘
                   │ └────────────────────┘
                   │          │ (management approve)
                   │          ▼
                   │ ┌────────────────────┐
                   │ │   SUBMIT_HARGA     │
                   │ └────────────────────┘
                   │          │ submit_hasil()
                   │          ▼
                   │ ┌─────────────────────────────┐
                   │ │  PENGUMUMAN_PEMENANG         │
                   │ └─────────────────────────────┘
                   │          │
                   │     ┌────┴────┐
                   │     ▼         ▼
                   │  menang     kalah
                   │     │         │
                   │     ▼         ▼
                   │ ┌─────────────────────┐
                   │ │  TARGET_DELIVERY    │
                   │ └─────────────────────┘
                   │          │ confirm_selesai()
                   │          ▼
                   │     ┌─────────┐
                   │     │ SELESAI │ (terminal)
                   │     └─────────┘
                   │
                   └──────────────────────────────────────────────────────┐
                   (DARI SEMUA STATUS KECUALI SELESAI)                    ▼
                                                                   ┌───────────┐
                                                                   │ CANCELLED │ (terminal)
                                                                   └───────────┘
```

### 3.2 Tabel Transisi Proyek Tender

| Dari Status | Event | Ke Status | Actor | Precondition | Side Effect |
|-------------|-------|-----------|-------|--------------|-------------|
| — | `create()` | `created` | cabang, admin | Nama proyek, customer, kategori terisi; tipe = tender | Proyek baru dibuat; timeline event dicatat |
| `created` | `submit_rks()` | `submit_rks` | cabang (pemilik), admin | Semua field RKS wajib terisi; minimal 1 dokumen RKS diupload; deadline tender > hari ini | Notifikasi ke PM |
| `submit_rks` | `approve_rks()` | `review_department` | pm, admin | Semua pertanyaan review PM terjawab (atau tidak ada) | Notifikasi ke Cabang + semua Dept terpilih; log approval PM untuk RKS |
| `submit_rks` | `revise_rks()` | `revision` | pm, admin | Min 1 pertanyaan review diisi | Notifikasi ke Cabang; log revisi |
| `revision` | `resubmit_rks()` | `submit_rks` | cabang (pemilik), admin | Semua pertanyaan revisi dijawab | Notifikasi ke PM |
| `review_department` | *(internal: dept approve LPHS draft)* | *(tetap `review_department`, approval per-dept tersimpan)* | dept yang terpilih, pm | PM sudah approve draft LPHS (bisa paralel review, tapi final approval dept menunggu PM) | Log approval per dept; progress ring diupdate |
| `review_department` | *(internal: pm approve LPHS draft)* | *(tetap `review_department`)* | pm | PM adalah PM proyek ini | Log approval PM LPHS draft |
| `review_department` | `all_approved_lphs()` | `lphs_sios` | *sistem (otomatis)* | Semua dept + PM sudah approve LPHS draft | Notifikasi ke Management |
| `lphs_sios` | `approve_lphs_management()` | `submit_harga` | management, admin | Semua dept + PM approval sudah complete | Notifikasi ke Cabang; log approval Management |
| `lphs_sios` | `revise_lphs_management()` | `review_department` | management, admin | Min 1 catatan revisi; pilihan dept terdampak | Reset approval hanya dept yang terdampak; notifikasi ke dept terdampak + PM |
| `submit_harga` | `submit_hasil()` | `pengumuman_pemenang` | cabang (pemilik), admin | Harga penawaran diisi; min 1 kompetitor diinput (opsional jika tidak ada kompetitor) | Notifikasi ke PM |
| `pengumuman_pemenang` | `set_winner_menang()` | `target_delivery` | cabang (pemilik), admin | Nilai kontrak diisi; dokumen SPK diupload | Notifikasi ke PM; data pemenang tersimpan |
| `pengumuman_pemenang` | `set_winner_kalah()` | `target_delivery` | cabang (pemilik), admin | Alasan kekalahan dipilih | Data pemenang tersimpan; proyek masuk ke target_delivery untuk dokumentasi |
| `target_delivery` | `confirm_selesai()` | `selesai` | cabang (pemilik), pm, admin | Tanggal delivery diisi; konfirmasi eksplisit | Status final; notifikasi ke PM |
| *semua (kecuali `selesai` dan `cancelled`)* | `cancel()` | `cancelled` | pm, admin | Alasan pembatalan diisi (required); konfirmasi 2-step | Proyek keluar dari pipeline aktif; notifikasi ke Cabang; log cancellation |

### 3.3 Aturan Khusus Proyek Tender

1. **Status REVISION berlaku untuk RKS saja.** Status proyek kembali ke `revision` hanya saat PM merevisi RKS. Revisi LPHS tidak mengubah status proyek utama — hanya approval per-dept yang di-reset.
2. **Proyek `cancelled` tidak dapat di-reopen.** Jika perlu lanjutkan, harus buat proyek baru.
3. **Proyek `selesai` bersifat immutable.** Tidak ada data yang bisa diedit setelah status `selesai`.
4. **`target_delivery` setelah kalah.** Ini tidak berarti delivery produk — ini adalah tahap dokumentasi hasil tender (alasan kekalahan, nilai kompetitor menang, dll.) sebelum proyek ditutup.

---

## 4. STATE MACHINE: PROYEK (PROSPECTING / NON-TENDER)

### 4.1 Diagram State

```
            ┌─────────┐
            │ CREATED │
            └────┬────┘
                 │
        ┌────────┴──────────┐
        │                   │
   nilai < threshold    nilai ≥ threshold
        │                   │
        ▼                   ▼
        │         ┌─────────────────┐
        │         │ PM_REVIEW       │
        │         │ (opsional)      │◄──────┐
        │         └────────┬────────┘       │
        │                  │ approve_pm()   │ revisi
        │                  │                │
        └──────────────────┘            ┌───┴──────┐
                 │                      │ REVISION │
                 ▼                      └──────────┘
         ┌──────────────┐
         │ SUBMIT_HARGA │
         └──────┬───────┘
                │ submit_hasil()
                ▼
       ┌──────────────────────┐
       │ PENGUMUMAN_PEMENANG  │
       └──────────┬───────────┘
                  │
            ┌─────┴─────┐
            ▼           ▼
          menang      kalah
            │           │
            ▼           ▼
       ┌──────────────────┐
       │  TARGET_DELIVERY │
       └──────────┬───────┘
                  │ confirm_selesai()
                  ▼
            ┌─────────┐
            │ SELESAI │ (terminal)
            └─────────┘
            
*Dari semua status → CANCELLED (pm/admin)
```

### 4.2 Perbedaan dengan Alur Tender

| Aspek | Tender | Prospecting |
|-------|--------|-------------|
| RKS | Wajib | Tidak ada |
| LPHS/SIOS | Wajib | Tidak ada |
| Review Departemen | Wajib | Tidak ada |
| Approval Management | Wajib | Tidak ada |
| PM Review | Wajib untuk RKS | Opsional (berdasarkan threshold nilai) |
| Dokumen SPK | Upload saat menang | Upload saat menang |

**Threshold PM Review untuk Prospecting:**
- Dikonfigurasi via CFG-02 (Konfigurasi Approval Workflow)
- Default: Rp 500.000.000 (dapat diubah admin)
- Jika nilai estimasi ≥ threshold → alur PM Review muncul
- Jika < threshold → langsung ke `submit_harga`

---

## 5. STATE MACHINE: APPROVAL (PER-ITEM)

### 5.1 Diagram State Approval Item

```
             ┌─────────────────┐
             │    PENDING      │◄──────────────────────────────────┐
             └────────┬────────┘                                   │
                      │                                            │
           ┌──────────┼──────────────┐                            │
           ▼          ▼              ▼                            │
       ┌────────┐ ┌──────────┐ ┌──────────────┐                  │
       │APPROVED│ │ REVISION │ │  ESCALATED   │                  │
       └────────┘ └────┬─────┘ └──────┬───────┘                  │
                       │              │                            │
                       │         reassigned to atasan             │
                       │              │                            │
                       │              └───────────────────────────┘
                       │
                       │ (submitter memperbaiki dan re-submit)
                       └─────────────────────────────────────────►┘
                         (kembali ke PENDING dengan versi baru)
```

### 5.2 Tabel Transisi Approval Item

| Dari Status | Event | Ke Status | Actor | Precondition | Side Effect |
|-------------|-------|-----------|-------|--------------|-------------|
| — | `create_approval()` | `pending` | *sistem* | Tahap proyek memenuhi trigger approval | SLA timer dimulai; notifikasi ke approver |
| `pending` | `approve()` | `approved` | approver yang ditugaskan, admin | User adalah approver yang ditugaskan atau admin | Log keputusan (timestamp, catatan, IP); cek apakah semua approval sudah selesai |
| `pending` | `send_revision()` | `revision` | approver yang ditugaskan, admin | Min 1 catatan revisi | Notifikasi ke submitter; log revisi |
| `pending` | `escalate()` | `escalated` | *sistem (SLA engine)* | SLA deadline terlewat | Notifikasi ke atasan approver; log eskalasi |
| `escalated` | `approve()` | `approved` | atasan approver (penerima eskalasi), admin | — | Log keputusan |
| `escalated` | `reassign()` | `pending` (di approver baru) | admin | Alasan re-assign diisi; target approver baru ditentukan | Notifikasi ke approver baru; log re-assign |
| `revision` | *(submitter perbaiki dan re-submit)* | `pending` | *sistem (dipicu oleh event re-submit di proyek)* | Re-submit event terjadi | Approval item di-reset ke pending dengan versi baru; SLA timer restart |

### 5.3 SLA Timer per Approval

| Tahap | Default SLA | Konfigurasi |
|-------|-------------|-------------|
| Review RKS oleh PM | 2 hari kerja | CFG-05 |
| Review LPHS oleh Dept | 3 hari kerja | CFG-05 |
| Review LPHS oleh PM | 2 hari kerja | CFG-05 |
| Approval LPHS oleh Management | 2 hari kerja | CFG-05 |

- **SLA dihitung dalam hari kerja**, mengecualikan hari libur nasional dari Master Holiday Calendar.
- **Reminder T-2 hari kerja** sebelum SLA deadline (dikonfigurasi via CFG-06).
- **Auto-escalate** jika SLA terlewat: approval di-escalate ke atasan approver yang dikonfigurasi.

---

## 6. STATE MACHINE: DOKUMEN

### 6.1 Diagram State Dokumen

```
           ┌───────┐
           │ DRAFT │ (versi awal, belum disubmit)
           └───┬───┘
               │ submit()
               ▼
         ┌──────────┐
         │ SUBMITTED│
         └────┬─────┘
              │
        ┌─────┴─────┐
        ▼           ▼
   ┌────────┐ ┌─────────────┐
   │APPROVED│ │ SUPERSEDED  │ (digantikan versi baru)
   └────────┘ └─────────────┘
```

### 6.2 Versioning Rules

1. Upload pertama → `version_number = 1`, status `draft` atau langsung `submitted` tergantung konteks.
2. Upload ulang ke dokumen yang sudah ada → versi lama menjadi `superseded`, versi baru dibuat dengan `version_number = N+1`.
3. Dokumen yang `approved` **tidak dapat digantikan** kecuali melalui proses revisi yang mengubah status approval proyek.
4. Download selalu mendapatkan versi terbaru yang tidak `superseded`, kecuali user secara eksplisit memilih versi lama.

---

## 7. STATE MACHINE: USER / AKUN

### 7.1 Diagram State User

```
           ┌────────┐
           │ ACTIVE │◄───────────────────────┐
           └───┬────┘                        │
               │                             │
        ┌──────┴──────┐                      │
        ▼             ▼                      │
   ┌────────┐    ┌────────┐                  │
   │INACTIVE│    │ LOCKED │                  │
   └────────┘    └───┬────┘                  │
        │            │ unlock() by admin      │
        │            └───────────────────────┘
        │
        │ reactivate() by admin
        └─────────────────────────────────────┘
```

### 7.2 Tabel Transisi User

| Dari Status | Event | Ke Status | Actor | Trigger |
|-------------|-------|-----------|-------|---------|
| — | `create_user()` | `active` | admin | Admin membuat user baru |
| `active` | `deactivate()` | `inactive` | admin | Admin menonaktifkan user (soft delete) |
| `inactive` | `reactivate()` | `active` | admin | Admin mengaktifkan kembali |
| `active` | `lock()` | `locked` | *sistem* | 5x gagal login berturut-turut |
| `locked` | `unlock()` | `active` | admin | Admin membuka kunci akun |

### 7.3 Aturan Login Lockout

- 5 kali gagal login → akun dikunci (`locked`)
- Durasi lock: hingga admin unlock secara manual (tidak ada auto-unlock)
- Counter gagal login di-reset setelah login berhasil
- Log semua percobaan login (berhasil dan gagal) di audit log

---

## 8. STATE MACHINE: PROSPEK — STATUS APPROVAL ITEM

Terpisah dari status prospek utama, setiap keputusan PM atas prospek disimpan sebagai record approval tersendiri.

| Status Approval Prospek | Deskripsi |
|-------------------------|-----------|
| `pending` | Menunggu keputusan PM |
| `approved` | PM menyetujui prospek |
| `revision_sent` | PM mengirim revisi |
| `revision_answered` | Cabang menjawab revisi |

---

## 9. PRECONDITION MATRIX TERPUSAT

Matriks ini merangkum precondition yang harus dipenuhi sebelum setiap transisi besar. Backend memvalidasi **semua** precondition ini sebelum eksekusi.

| Transisi | Precondition yang Divalidasi Backend |
|----------|-------------------------------------|
| `submit_rks()` | (1) Status proyek = `created`, (2) Nama tender terisi, (3) Deadline tender > hari ini, (4) Min 1 dokumen RKS diupload, (5) Semua field wajib RKS terisi |
| `approve_rks()` | (1) Status proyek = `submit_rks`, (2) Requestor adalah PM untuk cabang ini atau admin, (3) Proyek belum cancelled |
| `all_approved_lphs()` (sistem) | (1) Status proyek = `review_department`, (2) Semua dept yang dipilih cabang sudah approve, (3) PM sudah approve draft LPHS |
| `approve_lphs_management()` | (1) Status proyek = `lphs_sios`, (2) Requestor adalah management atau admin, (3) Semua dept + PM approval = `approved` |
| `set_winner_menang()` | (1) Status proyek = `pengumuman_pemenang`, (2) Nilai kontrak diisi dan > 0, (3) SPK document diupload |
| `set_winner_kalah()` | (1) Status proyek = `pengumuman_pemenang`, (2) Alasan kekalahan (loss_reason_id) dipilih |
| `confirm_selesai()` | (1) Status proyek = `target_delivery`, (2) Tanggal mulai dan selesai delivery terisi |
| `cancel()` | (1) Status proyek bukan `selesai` dan bukan `cancelled`, (2) Alasan pembatalan diisi, (3) Requestor adalah PM atau admin |

---

## 10. SIDE EFFECTS MATRIX

Side effect adalah aksi yang terjadi secara otomatis sebagai konsekuensi dari transisi status.

| Transisi | Side Effect Otomatis |
|----------|---------------------|
| Create prospek | Audit log: `prospect.created` |
| Submit prospek | Notifikasi in-app ke PM; Audit log: `prospect.submitted` |
| Approve RKS | Notifikasi ke Cabang + semua Dept terpilih; Audit log: `rks.approved`; SLA timer LPHS dimulai |
| Revise RKS | Notifikasi ke Cabang; Audit log: `rks.revised`; Reset SLA timer |
| All depts approve LPHS | Notifikasi ke Management; Status proyek otomatis bergerak ke `lphs_sios` |
| Management approve LPHS | Notifikasi ke Cabang; Audit log: `lphs.approved_management` |
| Targeted revision LPHS | Notifikasi ke dept yang terdampak; Reset approval hanya dept terdampak; Audit log: `lphs.revised_targeted` |
| Set winner (menang/kalah) | Audit log: `project.winner_set`; Update win/loss aggregate untuk laporan |
| Confirm selesai | Audit log: `project.completed`; Update KPI realisasi untuk cabang |
| Cancel | Audit log: `project.cancelled`; Proyek dihapus dari pipeline aktif; Notifikasi ke Cabang |
| SLA terlewat | Auto-escalate; Audit log: `approval.escalated`; Notifikasi ke atasan |

---

## 11. IMPLEMENTASI STATE MACHINE DI BACKEND

### 11.1 Pola Implementasi

```typescript
// services/ProjectStateMachine.ts

interface TransitionResult {
  success: boolean;
  newStatus?: ProjectStatus;
  errors?: string[];
  sideEffects?: SideEffect[];
}

class ProjectStateMachine {
  private allowedTransitions: Record<ProjectStatus, ProjectStatus[]> = {
    created: ['submit_rks', 'cancelled'],
    submit_rks: ['review_department', 'revision', 'cancelled'],
    revision: ['submit_rks', 'cancelled'],
    review_department: ['lphs_sios', 'cancelled'],
    lphs_sios: ['submit_harga', 'review_department', 'cancelled'],
    submit_harga: ['pengumuman_pemenang', 'cancelled'],
    pengumuman_pemenang: ['target_delivery', 'cancelled'],
    target_delivery: ['selesai', 'cancelled'],
    selesai: [],         // terminal
    cancelled: [],       // terminal
  };

  canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
    return this.allowedTransitions[from]?.includes(to) ?? false;
  }

  async transition(
    projectId: number,
    event: ProjectEvent,
    actor: User,
    payload: TransitionPayload
  ): Promise<TransitionResult> {
    const project = await this.getProject(projectId);

    // 1. Validasi transisi diizinkan
    const targetStatus = this.getTargetStatus(event);
    if (!this.canTransition(project.status, targetStatus)) {
      return { success: false, errors: [`Transisi dari ${project.status} ke ${targetStatus} tidak diizinkan`] };
    }

    // 2. Validasi preconditions
    const preconditionErrors = await this.validatePreconditions(project, event, actor, payload);
    if (preconditionErrors.length > 0) {
      return { success: false, errors: preconditionErrors };
    }

    // 3. Eksekusi transisi dalam transaksi DB
    await db.transaction(async (trx) => {
      await this.updateProjectStatus(projectId, targetStatus, trx);
      await this.writeSideEffects(project, event, actor, payload, trx);
      await this.writeAuditLog(project, event, actor, targetStatus, trx);
    });

    // 4. Jalankan side effects asinkron (notifikasi, dll.)
    await this.dispatchAsyncSideEffects(project, event, actor);

    return { success: true, newStatus: targetStatus };
  }
}
```

### 11.2 Validasi di Layer Frontend

Frontend melakukan validasi UI (menyembunyikan/disabled tombol) berdasarkan status saat ini:

```typescript
// hooks/useProjectActions.ts
export function useProjectActions(project: Project, currentUser: User) {
  const canSubmitRKS = project.status === 'created'
    && currentUser.role === 'cabang'
    && project.branch_id === currentUser.branch_id;

  const canApproveRKS = project.status === 'submit_rks'
    && ['pm', 'admin'].includes(currentUser.role);

  const canCancel = !['selesai', 'cancelled'].includes(project.status)
    && ['pm', 'admin'].includes(currentUser.role);

  // dst.

  return { canSubmitRKS, canApproveRKS, canCancel, /* ... */ };
}
```

**Penting:** Validasi ini hanya untuk UX. Backend **selalu** memvalidasi ulang.

---

## 12. DATABASE — STATUS COLUMNS

Semua kolom status menggunakan tipe `ENUM` atau `VARCHAR(50)` dengan constraint `CHECK`. Nilai yang valid adalah persis string yang didefinisikan di dokumen ini.

```sql
-- Proyek
ALTER TABLE projects
  MODIFY COLUMN status ENUM(
    'created',
    'submit_rks',
    'revision',
    'review_department',
    'lphs_sios',
    'submit_harga',
    'pengumuman_pemenang',
    'target_delivery',
    'selesai',
    'cancelled'
  ) NOT NULL DEFAULT 'created';

-- Prospek
ALTER TABLE prospects
  MODIFY COLUMN status ENUM(
    'draft',
    'waiting_pm_approval',
    'revision',
    'approved'
  ) NOT NULL DEFAULT 'draft';

-- Approval Items
ALTER TABLE project_approvals
  MODIFY COLUMN status ENUM(
    'pending',
    'approved',
    'revision',
    'escalated',
    'reassigned',
    'delegated'
  ) NOT NULL DEFAULT 'pending';

-- Dokumen
ALTER TABLE documents
  MODIFY COLUMN status ENUM(
    'draft',
    'submitted',
    'approved',
    'superseded'
  ) NOT NULL DEFAULT 'draft';

-- Users
ALTER TABLE users
  MODIFY COLUMN status ENUM(
    'active',
    'inactive',
    'locked'
  ) NOT NULL DEFAULT 'active';
```

---

## 13. CATATAN UNTUK IMPLEMENTASI

### 13.1 Optimistic Locking

Setiap tabel yang memiliki state machine wajib memiliki kolom `updated_at TIMESTAMP`. Setiap transisi harus disertai dengan pengecekan:

```sql
UPDATE projects
SET status = ?, updated_at = NOW()
WHERE id = ? AND updated_at = ? -- nilai updated_at dari request
```

Jika 0 rows affected → conflict terdeteksi → kembalikan error 409 Conflict ke client.

### 13.2 Idempotency

Transisi yang sama yang dikirim dua kali (akibat network retry) harus ditangani dengan aman:
- Jika project sudah di status target → kembalikan 200 OK (tidak error)
- Jika status berbeda → validasi normal

### 13.3 Audit Trail per Transisi

Setiap transisi status WAJIB menghasilkan record di tabel `audit_logs` dengan:
- `entity_type`: 'project' / 'prospect' / 'approval'
- `entity_id`: ID entitas
- `action`: nama event (contoh: `rks.approved`)
- `actor_id`: ID user
- `before_state`: status sebelum
- `after_state`: status sesudah
- `payload`: JSON payload aksi (tanpa data sensitif)
- `created_at`: timestamp
