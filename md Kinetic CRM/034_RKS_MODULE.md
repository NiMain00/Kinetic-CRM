# 034 — RKS MODULE
## KINETIC CRM — Modul Rencana Kerja & Syarat (FR030–FR033)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 034 |
| **Nama Dokumen** | RKS Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR030–FR033, BA Review Section B.4 |
| **Status** | Final |

---

## 1. PURPOSE

Modul RKS (Rencana Kerja & Syarat) menangani pengisian dan review dokumen tender. Cabang mengisi data tender resmi (nomor tender, deadline, upload dokumen RKS, jawab checklist pertanyaan RKS), kemudian PM melakukan review dengan memberikan pertanyaan dan memutuskan approval atau revisi.

---

## 2. ENTITY: ProjectRks

### 2.1 Schema Tabel `project_rks`

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → projects.id | Satu proyek satu RKS |
| `tender_number` | VARCHAR(100) | NULL | Nomor tender resmi dari customer |
| `tender_name` | VARCHAR(300) | NULL | Nama tender resmi |
| `deadline_tender` | DATE | NULL | Deadline pemasukan penawaran |
| `tender_document_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Dokumen RKS/tender diupload |
| `tender_document_url` | VARCHAR(500) | NULL | URL eksternal (Google Docs, dll.) |
| `additional_notes` | TEXT | NULL | Catatan tambahan dari Cabang |
| `status` | ENUM('draft','submitted','revision','approved') | NOT NULL DEFAULT 'draft' | Status RKS |
| `pm_approval_status` | ENUM('pending','approved','revision') | NOT NULL DEFAULT 'pending' | |
| `submitted_at` | TIMESTAMP | NULL | Waktu submit ke PM |
| `approved_at` | TIMESTAMP | NULL | Waktu PM approve |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Tabel `project_rks_reviews`

Identik dengan `prospect_pm_reviews`; tracking putaran review PM per RKS.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `rks_id` | BIGINT UNSIGNED FK | FK → project_rks.id |
| `review_round` | TINYINT UNSIGNED | |
| `pm_user_id` | BIGINT UNSIGNED FK | |
| `pm_general_notes` | TEXT | |
| `status` | ENUM('questions_sent','answered','approved') | |
| `questions_sent_at` | TIMESTAMP | |
| `answered_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

### 2.3 Tabel `project_rks_review_questions`

Pertanyaan PM per sesi review RKS; identik strukturnya dengan `prospect_review_questions`.

---

## 3. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-RKS-01 | Satu proyek hanya memiliki satu record RKS (UNIQUE constraint pada project_id) |
| BR-RKS-02 | RKS hanya ada pada proyek type=tender |
| BR-RKS-03 | Deadline tender harus > tanggal hari ini saat submit (tidak berlaku untuk simpan draft) |
| BR-RKS-04 | Upload dokumen tender ATAU link URL wajib ada sebelum submit ke review |
| BR-RKS-05 | Semua pertanyaan RKS required (dari Master Pertanyaan context=rks) harus terisi sebelum submit |
| BR-RKS-06 | Jawaban pertanyaan RKS disimpan di tabel `project_rks_answers` (relasional; resolusi GAP-03) |
| BR-RKS-07 | PM bisa approve RKS hanya jika semua pertanyaan review sudah dijawab Cabang |
| BR-RKS-08 | PM wajib mengisi minimal 1 pertanyaan review sebelum kirim revisi |
| BR-RKS-09 | Setelah PM approve RKS, status proyek bergerak dari `submit_rks` ke `review_department` |
| BR-RKS-10 | Cabang tidak bisa edit RKS saat status = submitted (menunggu review PM) |
| BR-RKS-11 | Nomor tender harus unik dalam scope customer yang sama |

---

## 4. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/projects/:id/rks | Auth | Get data RKS proyek |
| PUT | /api/projects/:id/rks | Cabang, Admin | Save/update draft RKS |
| POST | /api/projects/:id/rks/submit | Cabang, Admin | Submit RKS ke PM |
| POST | /api/projects/:id/rks/approve | PM, Admin | PM approve RKS |
| POST | /api/projects/:id/rks/revise | PM, Admin | PM kirim revisi RKS |
| POST | /api/projects/:id/rks/answer | Cabang, Admin | Cabang jawab revisi RKS |
| GET | /api/projects/:id/rks/reviews | Auth | Riwayat review RKS |

### 4.1 PUT /api/projects/:id/rks (Save Draft)

```json
{
  "tender_number": "TENDER/2025/JT/001",
  "tender_name": "Pengadaan Material Konstruksi Jalan Tol Ruas X",
  "deadline_tender": "2025-08-15",
  "tender_document_id": 45,
  "additional_notes": "Dokumen lengkap bisa diakses di link berikut",
  "answers": [
    { "question_id": 10, "answer_text": "Ya, sudah ada BOQ lengkap" },
    { "question_id": 11, "answer_options": ["item_a", "item_c"] }
  ]
}
```

### 4.2 POST /api/projects/:id/rks/revise

```json
{
  "review_questions": [
    { "question_text": "Apakah sudah konfirmasi dengan customer soal persyaratan K3?" },
    { "question_text": "Berapa estimated volume material yang dibutuhkan?" }
  ],
  "general_notes": "Mohon pastikan semua requirement teknis sudah terpenuhi."
}
```

---

## 5. DDL

```sql
CREATE TABLE project_rks (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id           BIGINT UNSIGNED NOT NULL,
  tender_number        VARCHAR(100)    NULL,
  tender_name          VARCHAR(300)    NULL,
  deadline_tender      DATE            NULL,
  tender_document_id   BIGINT UNSIGNED NULL,
  tender_document_url  VARCHAR(500)    NULL,
  additional_notes     TEXT            NULL,
  status               ENUM('draft','submitted','revision','approved') NOT NULL DEFAULT 'draft',
  pm_approval_status   ENUM('pending','approved','revision')           NOT NULL DEFAULT 'pending',
  submitted_at         TIMESTAMP       NULL,
  approved_at          TIMESTAMP       NULL,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rks_project (project_id),
  KEY idx_rks_status (status),
  CONSTRAINT fk_rks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_rks_reviews (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rks_id            BIGINT UNSIGNED NOT NULL,
  review_round      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  pm_user_id        BIGINT UNSIGNED NOT NULL,
  pm_general_notes  TEXT            NULL,
  status            ENUM('questions_sent','answered','approved') NOT NULL DEFAULT 'questions_sent',
  questions_sent_at TIMESTAMP       NULL,
  answered_at       TIMESTAMP       NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rksr_rks FOREIGN KEY (rks_id)     REFERENCES project_rks(id) ON DELETE CASCADE,
  CONSTRAINT fk_rksr_pm  FOREIGN KEY (pm_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_rks_review_questions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id     BIGINT UNSIGNED NOT NULL,
  question_text TEXT            NOT NULL,
  answer_text   TEXT            NULL,
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  answered_at   TIMESTAMP       NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rksrq_review FOREIGN KEY (review_id) REFERENCES project_rks_reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-RKS-01 | Cabang simpan draft RKS tanpa deadline tender | Berhasil tersimpan (simpan draft tidak perlu deadline) |
| TC-RKS-02 | Cabang submit RKS tanpa upload dokumen dan tanpa URL link | Error: "Dokumen tender wajib diupload atau link URL wajib diisi" |
| TC-RKS-03 | Cabang submit RKS dengan deadline di masa lalu | Error: "Deadline tender tidak boleh di masa lalu" |
| TC-RKS-04 | PM kirim revisi tanpa pertanyaan review | Error: "Minimal 1 pertanyaan review wajib diisi" |
| TC-RKS-05 | Cabang jawab semua pertanyaan PM → re-submit | Status → submitted; PM menerima notifikasi |
| TC-RKS-06 | PM approve RKS | Status RKS = approved; status proyek = review_department |
| TC-RKS-07 | Dua proyek dengan customer sama, nomor tender sama | Error: "Nomor tender sudah digunakan untuk customer ini" |

**FR Coverage:** FR030 ✓ | FR031 ✓ | FR032 ✓ | FR033 ✓
