# 033 — PROJECT CORE MODULE
## KINETIC CRM — Entitas Proyek Inti & State Machine Gabungan

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 033 |
| **Nama Dokumen** | Project Core Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR020–FR025, BA Review Section B.4, C.1 (GAP-04) |
| **Gap Resolution** | GAP-04 (status cancelled), CFG-03 (status dinamis) |
| **Status** | Final |

---

## 1. PURPOSE

Dokumen ini mendefinisikan **entitas proyek inti** (tabel `projects`) beserta state machine gabungan yang mencakup seluruh lifecycle dari pembuatan hingga penyelesaian atau pembatalan. Modul-modul RKS, LPHS/SIOS, Harga, Pemenang, dan Delivery masing-masing didetailkan di dokumen terpisah (034–038); dokumen ini adalah **fondasi data** yang dirujuk oleh semua modul tersebut.

---

## 2. ENTITY: Project

### 2.1 Schema Tabel `projects`

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `branch_id` | BIGINT UNSIGNED | NOT NULL, FK → branches.id | Cabang pemilik proyek |
| `customer_id` | BIGINT UNSIGNED | NOT NULL, FK → customers.id | Customer terkait |
| `category_id` | BIGINT UNSIGNED | NOT NULL, FK → project_categories.id | Kategori proyek |
| `source_prospect_id` | BIGINT UNSIGNED | NULL, FK → prospects.id | Prospek sumber (jika konversi) |
| `assigned_pm_id` | BIGINT UNSIGNED | NULL, FK → users.id | PM yang bertanggung jawab |
| `created_by_user_id` | BIGINT UNSIGNED | NOT NULL, FK → users.id | |
| `project_code` | VARCHAR(30) | NOT NULL, UNIQUE | Nomor proyek otomatis: PRJ-{YYYY}-{SEQ} |
| `name` | VARCHAR(200) | NOT NULL | Nama proyek |
| `type` | ENUM('tender','prospecting') | NOT NULL | Tipe proyek (menentukan workflow) |
| `status_id` | BIGINT UNSIGNED | NOT NULL, FK → project_statuses.id | Status saat ini (relasional — bukan enum) |
| `estimated_value` | BIGINT | NULL | Estimasi nilai awal (Rp) |
| `estimated_close_date` | DATE | NULL | Estimasi tanggal selesai |
| `description` | TEXT | NULL | Keterangan proyek |
| `workflow_snapshot_id` | BIGINT UNSIGNED | NULL, FK → project_workflow_snapshots.id | Snapshot workflow saat proyek dibuat |
| `is_cancelled` | TINYINT(1) | NOT NULL DEFAULT 0 | Flag khusus pembatalan |
| `cancel_reason` | TEXT | NULL | Alasan pembatalan |
| `cancelled_by` | BIGINT UNSIGNED | NULL, FK → users.id | |
| `cancelled_at` | TIMESTAMP | NULL | |
| `last_status_change_at` | TIMESTAMP | NULL | Kapan status terakhir berubah (untuk at-risk calc) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Project Code Generation

Format: `PRJ-{YYYY}-{SEQ5}` — contoh: `PRJ-2025-00001`

```sql
-- Auto-generate project_code saat INSERT
-- Sequence di-reset setiap tahun
SELECT LPAD(COUNT(*) + 1, 5, '0') AS next_seq
FROM projects
WHERE YEAR(created_at) = YEAR(NOW());

-- Final code: CONCAT('PRJ-', YEAR(NOW()), '-', next_seq)
```

---

## 3. STATE MACHINE GABUNGAN

### 3.1 Status Lifecycle — Tender

```
                 ┌──────────┐
        Create   │          │
       ─────────►│ CREATED  │
                 └────┬─────┘
                      │ Cabang submit RKS
                      ▼
                 ┌────────────┐
                 │ SUBMIT_RKS │
                 └────┬───────┘
                      │ PM approve RKS
                      ▼
                 ┌──────────────────┐
                 │ REVIEW_DEPARTMENT│ ◄── Dept review LPHS (paralel)
                 └────┬─────────────┘
                      │ Semua dept approve + PM approve LPHS
                      ▼
                 ┌──────────┐
                 │ LPHS_SIOS│
                 └────┬─────┘
                      │ Management approve LPHS
                      ▼
                 ┌─────────────┐
                 │ SUBMIT_HARGA│ ◄── Cabang input harga penawaran
                 └────┬────────┘
                      │ Cabang submit harga
                      ▼
                 ┌───────────────────────┐
                 │ PENGUMUMAN_PEMENANG   │ ◄── Cabang input hasil tender
                 └────┬──────────────────┘
             ┌────────┴───────┐
             │ Menang         │ Kalah
             ▼                ▼
      ┌──────────────┐  ┌──────────┐
      │TARGET_DELIVERY│  │  SELESAI │
      └──────┬───────┘  └──────────┘
             │ Cabang input delivery selesai
             ▼
        ┌──────────┐
        │  SELESAI │
        └──────────┘

CANCELLED ← dari status APAPUN (kecuali terminal) oleh PM atau Admin
```

### 3.2 Status Lifecycle — Prospecting

```
CREATED → SUBMIT_HARGA → PENGUMUMAN_PEMENANG → TARGET_DELIVERY / SELESAI
                                              ↓
                                          CANCELLED (dari mana saja)
```

Prospecting tidak memiliki tahap RKS dan LPHS/SIOS; alurnya lebih singkat.

### 3.3 Allowed Transitions Table

| Dari Status | Ke Status | Actor | Kondisi |
|---|---|---|---|
| created | submit_rks | Cabang | Hanya type=tender; RKS form terisi |
| created | submit_harga | Cabang | Hanya type=prospecting |
| submit_rks | review_department | PM | PM approve RKS |
| submit_rks | revision | PM | PM kirim revisi RKS |
| revision | submit_rks | Cabang | Jawab semua pertanyaan revisi |
| review_department | lphs_sios | System | Semua dept + PM approve LPHS |
| review_department | revision | PM/Dept/Mgmt | Targeted revision |
| lphs_sios | submit_harga | Management | Management approve |
| lphs_sios | revision | Management | Management revisi |
| submit_harga | pengumuman_pemenang | Cabang | Harga penawaran diisi |
| pengumuman_pemenang | target_delivery | Cabang | Input hasil = menang |
| pengumuman_pemenang | selesai | Cabang | Input hasil = kalah (terminal) |
| target_delivery | selesai | Cabang | Konfirmasi delivery selesai |
| any (non-terminal) | cancelled | PM, Admin | Dengan alasan wajib |

### 3.4 At-Risk Detection

Proyek dianggap **at-risk** jika salah satu kondisi berikut terpenuhi:
1. `DATEDIFF(NOW(), last_status_change_at) > 5` (stuck > 5 hari di status yang sama)
2. `deadlineTender IS NOT NULL AND DATEDIFF(deadlineTender, NOW()) <= 3` (deadline ≤ 3 hari)

Query untuk dashboard widget At-Risk:
```sql
SELECT p.*, ps.label AS status_label
FROM projects p
JOIN project_statuses ps ON ps.id = p.status_id
WHERE p.is_cancelled = 0
  AND ps.is_terminal = 0
  AND (
    DATEDIFF(NOW(), p.last_status_change_at) > 5
    OR (
      EXISTS(SELECT 1 FROM project_rks r WHERE r.project_id = p.id AND r.deadline_tender IS NOT NULL
             AND DATEDIFF(r.deadline_tender, NOW()) <= 3)
    )
  );
```

---

## 4. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-PROJ-01 | Setiap proyek memiliki `project_code` yang unik dan auto-generated; tidak bisa diubah manual |
| BR-PROJ-02 | `type` (tender/prospecting) menentukan workflow; tidak bisa diubah setelah proyek dibuat |
| BR-PROJ-03 | `category_id` menentukan apakah tab RKS dan LPHS/SIOS ditampilkan (dari `requires_rks` dan `requires_lphs` di kategori) |
| BR-PROJ-04 | Cancel proyek (GAP-04): hanya PM dan Admin; alasan wajib; berlaku dari status apapun kecuali terminal; `is_cancelled = 1`; tidak bisa di-undo |
| BR-PROJ-05 | Proyek cancelled tetap ada di daftar dengan badge merah; tidak dihapus dari DB |
| BR-PROJ-06 | Proyek cancelled tidak masuk dalam kalkulasi KPI (tidak dihitung sebagai pipeline atau win/loss aktif) |
| BR-PROJ-07 | `last_status_change_at` diperbarui setiap kali `status_id` berubah (trigger atau application logic) |
| BR-PROJ-08 | Snapshot workflow disimpan saat proyek dibuat; perubahan konfigurasi workflow tidak mempengaruhi proyek yang sedang berjalan |
| BR-PROJ-09 | Cabang hanya bisa melihat proyek `branch_id = auth.user.branch_id` |
| BR-PROJ-10 | PM, Management, Admin bisa melihat semua proyek |
| BR-PROJ-11 | Dept bisa melihat semua proyek (read-only; aksi LPHS hanya untuk dept-nya) |

---

## 5. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/projects | Auth | List proyek (scope per role); query: type, statusId, branchId, customerId, search, page, perPage, dateFrom, dateTo |
| POST | /api/projects | Cabang, Admin | Buat proyek baru |
| GET | /api/projects/:id | Auth | Detail proyek lengkap |
| PUT | /api/projects/:id | Cabang, Admin | Update info dasar proyek |
| POST | /api/projects/:id/cancel | PM, Admin | Cancel proyek |
| GET | /api/projects/:id/timeline | Auth | Timeline event proyek |
| GET | /api/projects/:id/status-history | Auth | Riwayat perubahan status |
| POST | /api/projects/:id/reassign-pm | Admin | Re-assign PM (GAP-07) |

### 5.1 POST /api/projects (Create)

```json
{
  "name": "Pembangunan Gedung Kantor Pusat",
  "type": "tender",
  "customer_id": 5,
  "category_id": 1,
  "source_prospect_id": 87,
  "estimated_value": 50000000000,
  "estimated_close_date": "2025-12-31",
  "description": "Proyek konstruksi gedung 10 lantai"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "project_code": "PRJ-2025-00123",
    "name": "Pembangunan Gedung Kantor Pusat",
    "type": "tender",
    "status": { "id": 1, "code": "created", "label": "Dibuat", "color_hex": "#6B7280" },
    "customer": { "id": 5, "name": "PT. XYZ" },
    "branch": { "id": 3, "name": "Cabang Jakarta" }
  }
}
```

### 5.2 POST /api/projects/:id/cancel

```json
{
  "reason": "Client membatalkan tender karena perubahan anggaran internal."
}
```

Response 200 + audit log entry + notifikasi ke Cabang.

---

## 6. PROJECT TIMELINE

### 6.1 Tabel `project_timeline_events`

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `project_id` | BIGINT UNSIGNED | FK → projects.id |
| `event_type` | VARCHAR(50) | Kode tipe event (status_change, document_uploaded, approval_sent, dll.) |
| `event_description` | TEXT | Deskripsi event yang human-readable |
| `actor_user_id` | BIGINT UNSIGNED | FK → users.id (NULL jika sistem otomatis) |
| `metadata` | JSON | Data tambahan: {from_status, to_status, document_id, dll.} |
| `created_at` | TIMESTAMP | Waktu event |

Tabel ini adalah **append-only**: tidak ada UPDATE atau DELETE.

### 6.2 Event Types

| event_type | Deskripsi |
|---|---|
| `project_created` | Proyek dibuat |
| `status_changed` | Status berubah (metadata: from_status, to_status) |
| `rks_submitted` | RKS disubmit ke review |
| `rks_approved` | RKS disetujui PM |
| `rks_revision_sent` | PM kirim revisi RKS |
| `lphs_submitted` | Draft LPHS diupload |
| `lphs_dept_approved` | Departemen tertentu approve LPHS |
| `lphs_pm_approved` | PM approve LPHS |
| `lphs_mgmt_approved` | Management approve LPHS |
| `lphs_revision_sent` | Revisi LPHS dikirim (targeted) |
| `harga_submitted` | Harga penawaran diinput |
| `pemenang_inputted` | Hasil tender diinput (menang/kalah) |
| `delivery_confirmed` | Delivery dikonfirmasi selesai |
| `document_uploaded` | Dokumen diupload (metadata: doc_type, doc_name) |
| `project_cancelled` | Proyek dibatalkan |
| `pm_reassigned` | PM di-re-assign |
| `sla_overdue` | SLA approval terlampaui (sistem otomatis) |
| `notification_sent` | Notifikasi dikirim (sistem otomatis) |

---

## 7. DATABASE SCHEMA (DDL)

```sql
CREATE TABLE projects (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id             BIGINT UNSIGNED NOT NULL,
  customer_id           BIGINT UNSIGNED NOT NULL,
  category_id           BIGINT UNSIGNED NOT NULL,
  source_prospect_id    BIGINT UNSIGNED NULL,
  assigned_pm_id        BIGINT UNSIGNED NULL,
  created_by_user_id    BIGINT UNSIGNED NOT NULL,
  project_code          VARCHAR(30)     NOT NULL,
  name                  VARCHAR(200)    NOT NULL,
  type                  ENUM('tender','prospecting') NOT NULL,
  status_id             BIGINT UNSIGNED NOT NULL,
  estimated_value       BIGINT          NULL,
  estimated_close_date  DATE            NULL,
  description           TEXT            NULL,
  workflow_snapshot_id  BIGINT UNSIGNED NULL,
  is_cancelled          TINYINT(1)      NOT NULL DEFAULT 0,
  cancel_reason         TEXT            NULL,
  cancelled_by          BIGINT UNSIGNED NULL,
  cancelled_at          TIMESTAMP       NULL,
  last_status_change_at TIMESTAMP       NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_code (project_code),
  KEY idx_projects_branch      (branch_id),
  KEY idx_projects_customer    (customer_id),
  KEY idx_projects_category    (category_id),
  KEY idx_projects_status      (status_id),
  KEY idx_projects_type        (type),
  KEY idx_projects_is_cancelled(is_cancelled),
  KEY idx_projects_pm          (assigned_pm_id),
  KEY idx_projects_last_change (last_status_change_at),
  CONSTRAINT fk_proj_branch   FOREIGN KEY (branch_id)           REFERENCES branches(id),
  CONSTRAINT fk_proj_customer FOREIGN KEY (customer_id)         REFERENCES customers(id),
  CONSTRAINT fk_proj_category FOREIGN KEY (category_id)         REFERENCES project_categories(id),
  CONSTRAINT fk_proj_prospect FOREIGN KEY (source_prospect_id)  REFERENCES prospects(id)       ON DELETE SET NULL,
  CONSTRAINT fk_proj_pm       FOREIGN KEY (assigned_pm_id)      REFERENCES users(id)           ON DELETE SET NULL,
  CONSTRAINT fk_proj_creator  FOREIGN KEY (created_by_user_id)  REFERENCES users(id),
  CONSTRAINT fk_proj_status   FOREIGN KEY (status_id)           REFERENCES project_statuses(id),
  CONSTRAINT fk_proj_snapshot FOREIGN KEY (workflow_snapshot_id)REFERENCES project_workflow_snapshots(id) ON DELETE SET NULL,
  CONSTRAINT fk_proj_canceller FOREIGN KEY (cancelled_by)       REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_timeline_events (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id        BIGINT UNSIGNED NOT NULL,
  event_type        VARCHAR(50)     NOT NULL,
  event_description TEXT            NOT NULL,
  actor_user_id     BIGINT UNSIGNED NULL,
  metadata          JSON            NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pte_project    (project_id),
  KEY idx_pte_event_type (event_type),
  KEY idx_pte_created    (created_at),
  CONSTRAINT fk_pte_project FOREIGN KEY (project_id)    REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pte_actor   FOREIGN KEY (actor_user_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-PROJ-01 | Cabang buat proyek type=tender tanpa customer | Error 422 |
| TC-PROJ-02 | Buat 2 proyek dalam tahun yang sama | project_code berbeda: PRJ-2025-00001, PRJ-2025-00002 |
| TC-PROJ-03 | PM cancel proyek yang sedang di tahap LPHS | is_cancelled = 1; status → cancelled; Cabang dinotifikasi |
| TC-PROJ-04 | Cabang coba cancel proyek (tidak punya izin) | HTTP 403 |
| TC-PROJ-05 | Proyek stuck 6 hari di status submit_rks | At-risk flag = true; muncul di widget dashboard |
| TC-PROJ-06 | Proyek type=prospecting tidak menampilkan tab RKS | Tab RKS tidak muncul di detail proyek |
| TC-PROJ-07 | Proyek dari kategori "Jasa Umum" (requires_lphs=false) | Tab LPHS tidak muncul |
| TC-PROJ-08 | Timeline proyek menampilkan semua event | Semua event append-only; tidak ada yang hilang |

**Gap Resolution:** GAP-04 ✓ (status cancelled) | CFG-03 ✓ (status relasional, bukan enum)
