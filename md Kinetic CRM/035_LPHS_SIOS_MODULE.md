# 035 — LPHS/SIOS MODULE
## KINETIC CRM — Modul LPHS & SIOS dengan Paralel Review dan Targeted Revision

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 035 |
| **Nama Dokumen** | LPHS/SIOS Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR040–FR045, BA Review Section B.4, C.1 (GAP-08, BP-02, BP-03) |
| **Gap Resolution** | **GAP-08 Major** (paralel review), BP-02, BP-03 (targeted revision) |
| **Status** | Final |

---

## 1. PURPOSE

Modul LPHS (Lembar Permintaan Harga Satuan) / SIOS adalah tahap paling kompleks dalam workflow tender karena melibatkan **multiple actors secara paralel**:
- Cabang: upload draft dokumen dan memilih departemen reviewer
- PM: review dan approval
- Departemen (multiple): review independen secara paralel
- Management: approval final setelah semua dept dan PM setuju

BA Review GAP-08 (Major) mengidentifikasi bahwa implementasi lama tidak mendukung parallelisasi ini. BP-02 mendefinisikan pola paralel yang benar; BP-03 mendefinisikan revisi tertarget per departemen.

---

## 2. ENTITIES

### 2.1 Entity: ProjectLphs (Data Utama)

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK | Satu proyek satu record LPHS |
| `lphs_document_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Dokumen LPHS diupload |
| `lphs_external_url` | VARCHAR(500) | NULL | URL Google Docs / OneDrive |
| `sios_document_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Dokumen SIOS |
| `selected_departments` | JSON | NULL | Array dept_id yang dipilih Cabang: [1,3,5] |
| `departments_locked` | TINYINT(1) | NOT NULL DEFAULT 0 | Dikunci setelah upload pertama |
| `pm_status` | ENUM('pending','reviewing','approved','revision') | NOT NULL DEFAULT 'pending' | Status approval PM |
| `pm_approved_at` | TIMESTAMP | NULL | |
| `mgmt_status` | ENUM('pending','approved','revision') | NOT NULL DEFAULT 'pending' | Status approval Management |
| `mgmt_approved_at` | TIMESTAMP | NULL | |
| `mgmt_reviewer_id` | BIGINT UNSIGNED | NULL, FK → users.id | |
| `overall_status` | ENUM('draft','dept_review','mgmt_review','approved','revision') | NOT NULL DEFAULT 'draft' | |
| `submitted_at` | TIMESTAMP | NULL | |
| `final_approved_at` | TIMESTAMP | NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Entity: LphsDepartmentApproval (Approval per Dept)

Satu record per departemen yang terpilih.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `lphs_id` | BIGINT UNSIGNED | NOT NULL, FK → project_lphs.id | |
| `department_id` | BIGINT UNSIGNED | NOT NULL, FK → departments.id | |
| `approver_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | Kepala dept yang approve |
| `status` | ENUM('pending','reviewing','approved','revision') | NOT NULL DEFAULT 'pending' | |
| `review_notes` | TEXT | NULL | Catatan review dept ini |
| `approved_at` | TIMESTAMP | NULL | |
| `revision_sent_at` | TIMESTAMP | NULL | |
| `revision_notes` | TEXT | NULL | Catatan revisi yang diminta |
| `revision_round` | TINYINT UNSIGNED | NOT NULL DEFAULT 0 | Berapa kali revisi |
| `is_targeted_revision` | TINYINT(1) | NOT NULL DEFAULT 0 | True jika merupakan targeted revision |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(lphs_id, department_id)`

---

## 3. PARALLEL REVIEW DESIGN (GAP-08 / BP-02)

### 3.1 Prinsip Parallelisasi

```
Cabang upload draft LPHS + pilih departemen
    ↓
Draft tersimpan; departemen_locked = true
    ↓
PM mulai review                    Dept A, B, C mulai review (PARALEL)
    │                                      │
    │ PM bisa approve atau revisi           │ Dept bisa beri catatan sementara
    │                                      │ (status = reviewing)
    ▼                                      ▼
PM status = approved           Semua dept status = approved
    ↓
Jika SEMUA TERPENUHI (PM + semua dept approved):
    → overall_status = mgmt_review
    → Management notifikasi untuk approval final
```

**Aturan penting:**
- Dept **bisa** mulai review sebelum PM selesai
- Dept **tidak bisa** submit approval final sebelum PM approve
- PM approval dan dept approval berjalan **paralel** di layer review; hanya di layer finalisasi (submit ke management) keduanya harus selesai
- Implementasi: `dept.status` bisa `reviewing` (sementara review) atau `pending` (belum mulai); setelah PM approve, status berubah agar dept bisa submit final approval

### 3.2 State per Actor

| Actor | Status Awal | Setelah Cabang Upload | Setelah PM Approve | Setelah Dept Submit |
|---|---|---|---|---|
| PM | pending | reviewing | approved | — |
| Dept A | pending | reviewing | (bisa submit final) | approved |
| Dept B | pending | reviewing | (bisa submit final) | approved |
| Management | — | — | — | pending (saat semua approve) |

### 3.3 Kondisi Lanjut ke Management Review

```
IF pm_status = 'approved'
  AND ALL (LphsDepartmentApproval WHERE lphs_id = X AND dept IN selected_departments) HAVE status = 'approved'
THEN:
  overall_status = 'mgmt_review'
  mgmt_status = 'pending'
  NOTIFY management
```

---

## 4. TARGETED REVISION (BP-03)

### 4.1 Konsep

Saat PM atau Management mengirim revisi, mereka memilih **departemen mana saja** yang perlu melakukan review ulang. Departemen yang tidak dipilih **tidak perlu re-approve**.

Contoh: PM merasa pekerjaan Dept Engineering sudah benar, tapi Dept Legal perlu review ulang kontrak. PM pilih targeted revision ke Dept Legal saja. Dept Engineering tidak perlu approve ulang.

### 4.2 Alur Targeted Revision

```
PM / Management klik "Kirim Revisi"
    ↓
Dialog: "Pilih departemen yang perlu review ulang"
    [ ] Dept A - Engineering  (sudah approve)
    [✓] Dept B - Legal        (perlu review ulang)
    [ ] Dept C - Finance      (sudah approve)
    Catatan revisi: [____________]
    [Kirim Revisi]
    ↓
HANYA dept yang dipilih:
  - status direset ke 'revision'
  - approved_at dikosongkan
  - revision_notes diisi
  - is_targeted_revision = 1
  - Dept yang TIDAK dipilih: status tetap 'approved' (tidak perlu approve ulang)
    ↓
Cabang upload revisi draft
    ↓
Dept yang targeted: review ulang → approve
    ↓
(kondisi cek ulang: semua dept approved + PM approved)
    ↓
→ kembali ke management review
```

### 4.3 Targeted Revision Tracking

Setiap targeted revision dibuat record baru di tabel `lphs_revision_log`:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `lphs_id` | BIGINT UNSIGNED | FK |
| `revision_round` | TINYINT UNSIGNED | |
| `initiated_by` | BIGINT UNSIGNED | User yang kirim revisi |
| `initiator_role` | ENUM('pm','management') | |
| `revision_notes` | TEXT | |
| `targeted_dept_ids` | JSON | Array dept_id yang ditarget: [2] |
| `created_at` | TIMESTAMP | |

---

## 5. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-LPHS-01 | Tab LPHS/SIOS hanya tampil untuk proyek tipe=tender DAN `category.requires_lphs = true` |
| BR-LPHS-02 | Pilihan departemen reviewer dikunci setelah upload draft LPHS pertama |
| BR-LPHS-03 | Minimal 1 departemen harus dipilih sebelum upload draft |
| BR-LPHS-04 | Dept bisa mulai review paralel dengan PM (GAP-08 / BP-02) |
| BR-LPHS-05 | Dept tidak bisa submit approval final sebelum PM approve |
| BR-LPHS-06 | Management bisa approve hanya setelah 100% dept yang dipilih sudah approved + PM approved |
| BR-LPHS-07 | Targeted revision hanya mereset approval dept yang dipilih; dept lain tidak berubah (BP-03) |
| BR-LPHS-08 | Setiap targeted revision dicatat di `lphs_revision_log` |
| BR-LPHS-09 | Upload revisi draft: dept yang targeted direset ke reviewing; dept yang tidak targeted tetap approved |
| BR-LPHS-10 | Dokumen LPHS bisa berupa upload file ATAU URL link eksternal (Google Docs) — tidak harus keduanya |
| BR-LPHS-11 | Setiap aksi (dept approve, PM approve, targeted revisi) tercatat di project timeline |

---

## 6. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/projects/:id/lphs | Auth | Get data LPHS + status semua dept |
| PUT | /api/projects/:id/lphs/draft | Cabang, Admin | Upload draft + pilih dept (jika belum locked) |
| POST | /api/projects/:id/lphs/approve/pm | PM, Admin | PM approve LPHS |
| POST | /api/projects/:id/lphs/revise/pm | PM, Admin | PM kirim targeted revision |
| POST | /api/projects/:id/lphs/approve/dept | Dept, Admin | Dept approve LPHS (query: deptId) |
| POST | /api/projects/:id/lphs/notes/dept | Dept | Dept beri catatan sementara (tidak final) |
| POST | /api/projects/:id/lphs/revise/dept | Dept | Dept kirim catatan revisi per dept |
| POST | /api/projects/:id/lphs/approve/mgmt | Management, Admin | Management final approve |
| POST | /api/projects/:id/lphs/revise/mgmt | Management, Admin | Management targeted revision |
| GET | /api/projects/:id/lphs/dept-status | Auth | Status approval per dept (untuk matrix UI) |
| GET | /api/projects/:id/lphs/revision-log | Auth | Log semua revision |

### 6.1 POST /api/projects/:id/lphs/revise/pm (Targeted Revision)

```json
{
  "revision_notes": "Klausul penalti di LPHS bagian 3.2 perlu dikonsultasikan kembali dengan Legal.",
  "targeted_dept_ids": [2],
  "reset_pm_approval": false
}
```

Response 200: status dept_id=2 direset ke `revision`; dept lain tetap approved.

---

## 7. DDL

```sql
CREATE TABLE project_lphs (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id          BIGINT UNSIGNED NOT NULL,
  lphs_document_id    BIGINT UNSIGNED NULL,
  lphs_external_url   VARCHAR(500)    NULL,
  sios_document_id    BIGINT UNSIGNED NULL,
  selected_departments JSON           NULL,
  departments_locked  TINYINT(1)      NOT NULL DEFAULT 0,
  pm_status           ENUM('pending','reviewing','approved','revision') NOT NULL DEFAULT 'pending',
  pm_approved_at      TIMESTAMP       NULL,
  mgmt_status         ENUM('pending','approved','revision')             NOT NULL DEFAULT 'pending',
  mgmt_approved_at    TIMESTAMP       NULL,
  mgmt_reviewer_id    BIGINT UNSIGNED NULL,
  overall_status      ENUM('draft','dept_review','mgmt_review','approved','revision') NOT NULL DEFAULT 'draft',
  submitted_at        TIMESTAMP       NULL,
  final_approved_at   TIMESTAMP       NULL,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lphs_project (project_id),
  CONSTRAINT fk_lphs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_lphs_mgmt    FOREIGN KEY (mgmt_reviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lphs_department_approvals (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lphs_id             BIGINT UNSIGNED NOT NULL,
  department_id       BIGINT UNSIGNED NOT NULL,
  approver_user_id    BIGINT UNSIGNED NULL,
  status              ENUM('pending','reviewing','approved','revision') NOT NULL DEFAULT 'pending',
  review_notes        TEXT            NULL,
  approved_at         TIMESTAMP       NULL,
  revision_sent_at    TIMESTAMP       NULL,
  revision_notes      TEXT            NULL,
  revision_round      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_targeted_revision TINYINT(1)     NOT NULL DEFAULT 0,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lda_lphs_dept (lphs_id, department_id),
  KEY idx_lda_status (status),
  CONSTRAINT fk_lda_lphs FOREIGN KEY (lphs_id)       REFERENCES project_lphs(id) ON DELETE CASCADE,
  CONSTRAINT fk_lda_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_lda_user FOREIGN KEY (approver_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lphs_revision_log (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lphs_id          BIGINT UNSIGNED NOT NULL,
  revision_round   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  initiated_by     BIGINT UNSIGNED NOT NULL,
  initiator_role   ENUM('pm','management') NOT NULL,
  revision_notes   TEXT            NULL,
  targeted_dept_ids JSON           NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lrl_lphs (lphs_id),
  CONSTRAINT fk_lrl_lphs     FOREIGN KEY (lphs_id)     REFERENCES project_lphs(id) ON DELETE CASCADE,
  CONSTRAINT fk_lrl_initiator FOREIGN KEY (initiated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-LPHS-01 | Cabang upload LPHS tanpa pilih departemen | Error: "Minimal 1 departemen harus dipilih" |
| TC-LPHS-02 | Cabang upload kedua kalinya → coba ubah dept pilihan | Error: "Pilihan departemen sudah dikunci setelah upload" |
| TC-LPHS-03 | Dept B review dan beri catatan sementara sebelum PM approve | Berhasil; catatan tersimpan; status dept B = reviewing |
| TC-LPHS-04 | Dept B coba submit approval final sebelum PM approve | Error: "Tidak dapat approve sebelum PM menyelesaikan review-nya" |
| TC-LPHS-05 | PM approve → Dept B submit final approve | Berhasil; progress matrix: 1/2 dept approved |
| TC-LPHS-06 | PM targeted revision ke Dept Legal (tidak ke Dept Engineering) | Dept Legal status = revision; Dept Engineering tetap approved |
| TC-LPHS-07 | Semua dept + PM approved → Management notifikasi | Management menerima notifikasi; overall_status = mgmt_review |
| TC-LPHS-08 | Management approve final | overall_status = approved; status proyek → submit_harga |

**Gap Resolution:** GAP-08 ✓ | BP-02 ✓ | BP-03 ✓
