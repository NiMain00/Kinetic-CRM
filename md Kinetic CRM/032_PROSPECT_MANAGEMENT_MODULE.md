# 032 — PROSPECT MANAGEMENT MODULE
## KINETIC CRM — Modul Manajemen Prospek (FR010–FR015)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 032 |
| **Nama Dokumen** | Prospect Management Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR010–FR015, BA Review Section B.4, FE Spec Section 4 |
| **Status** | Final |

---

## 1. PURPOSE & BUSINESS CONTEXT

Modul Prospek adalah **titik masuk pertama pipeline tender** KINETIC CRM. Staf Cabang mengidentifikasi peluang bisnis (proyek yang sedang dibuka untuk tender) dan mencatatnya sebagai prospek. PM kemudian melakukan review untuk memastikan informasi cukup lengkap dan layak dilanjutkan sebelum dikonversi menjadi proyek formal.

**Alur bisnis:**
```
Cabang identifikasi peluang
  → Isi form Prospek + jawab checklist pertanyaan
    → Submit ke PM untuk review
      → PM: Approve (konversi ke proyek) ATAU Kirim Revisi (cabang jawab)
        → Setelah approve: Cabang konversi ke Proyek
```

---

## 2. ENTITY: Prospect

### 2.1 Schema Tabel `prospects`

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `branch_id` | BIGINT UNSIGNED | NOT NULL, FK → branches.id | Cabang pembuat |
| `customer_id` | BIGINT UNSIGNED | NOT NULL, FK → customers.id | Customer terkait |
| `created_by_user_id` | BIGINT UNSIGNED | NOT NULL, FK → users.id | User yang membuat |
| `assigned_pm_id` | BIGINT UNSIGNED | NULL, FK → users.id | PM yang ditugaskan review |
| `name` | VARCHAR(200) | NOT NULL | Nama prospek / identifikasi peluang |
| `description` | TEXT | NULL | Deskripsi lengkap |
| `estimated_value` | BIGINT | NULL | Estimasi nilai (rupiah) |
| `estimated_close_date` | DATE | NULL | Estimasi tanggal penutupan |
| `status` | ENUM('prospecting','waiting_pm_approval','revision','approved','converted') | NOT NULL DEFAULT 'prospecting' | Status lifecycle |
| `is_converted` | TINYINT(1) | NOT NULL DEFAULT 0 | Sudah dikonversi ke proyek |
| `converted_project_id` | BIGINT UNSIGNED | NULL, FK → projects.id | Proyek hasil konversi |
| `converted_at` | TIMESTAMP | NULL | Waktu konversi |
| `submitted_at` | TIMESTAMP | NULL | Waktu submit ke PM |
| `approved_at` | TIMESTAMP | NULL | Waktu PM approve |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Tabel `prospect_pm_reviews`

Menyimpan riwayat setiap sesi review PM (pertanyaan revisi dan jawaban cabang).

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `prospect_id` | BIGINT UNSIGNED | FK → prospects.id |
| `review_round` | TINYINT UNSIGNED | Putaran review ke-N |
| `pm_user_id` | BIGINT UNSIGNED | FK → users.id |
| `pm_general_notes` | TEXT | Catatan umum PM |
| `status` | ENUM('questions_sent','answered','approved') | |
| `questions_sent_at` | TIMESTAMP | |
| `answered_at` | TIMESTAMP | |
| `reviewed_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

### 2.3 Tabel `prospect_review_questions`

Pertanyaan spesifik yang dikirim PM dalam satu sesi review.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `review_id` | BIGINT UNSIGNED | FK → prospect_pm_reviews.id |
| `question_text` | TEXT NOT NULL | Teks pertanyaan dari PM |
| `answer_text` | TEXT | Jawaban dari Cabang |
| `sort_order` | SMALLINT UNSIGNED | |
| `answered_at` | TIMESTAMP | |

---

## 3. STATE MACHINE

### 3.1 Status Lifecycle

```
                  ┌─────────────────────┐
          Create  │                     │
         ────────►│    PROSPECTING      │
                  │  (draft, editable)  │
                  └────────┬────────────┘
                           │ submit ke PM (Cabang)
                           ▼
                  ┌─────────────────────┐
                  │  WAITING_PM_APPROVAL│◄──── re-submit setelah
                  │  (menunggu review)  │      jawab revisi
                  └────────┬────────────┘
                    ┌──────┴───────┐
          approve   │              │  kirim revisi
         (PM)       ▼              ▼
              ┌──────────┐  ┌──────────┐
              │ APPROVED │  │ REVISION │
              └────┬─────┘  └────┬─────┘
                   │              │ jawab (Cabang)
                   │              │ → kembali ke WAITING_PM_APPROVAL
                   ▼
              ┌──────────┐
              │CONVERTED │  (terminal: sudah jadi proyek)
              └──────────┘
```

### 3.2 Allowed Transitions

| Dari | Ke | Actor | Kondisi |
|---|---|---|---|
| `prospecting` | `waiting_pm_approval` | Cabang | Validasi: nama, customer required; pertanyaan required terisi |
| `waiting_pm_approval` | `approved` | PM | Tidak ada kondisi teknis; keputusan PM |
| `waiting_pm_approval` | `revision` | PM | Wajib isi minimal 1 pertanyaan review |
| `revision` | `waiting_pm_approval` | Cabang | Semua pertanyaan PM sudah dijawab |
| `approved` | `converted` | Cabang | POST /api/projects → set is_converted=1, converted_project_id |
| `prospecting` | (hapus) | Cabang, Admin | Soft-delete (is_deleted flag) — hanya jika status masih prospecting |

---

## 4. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-PROS-01 | Cabang hanya bisa melihat prospek milik cabangnya sendiri (scope dari `branch_id` di JWT) |
| BR-PROS-02 | PM dan Admin bisa melihat semua prospek |
| BR-PROS-03 | Submit ke PM memerlukan: nama, customer, semua pertanyaan required terjawab |
| BR-PROS-04 | Simpan Draft membolehkan pertanyaan required kosong (simpan parsial) |
| BR-PROS-05 | Setelah submit ke PM, Cabang tidak bisa edit prospek sampai PM kirim revisi |
| BR-PROS-06 | Setelah PM approve, Cabang tidak bisa edit prospek; hanya bisa konversi ke proyek |
| BR-PROS-07 | Prospek yang sudah `converted` tidak bisa diedit, dihapus, atau di-submit ulang |
| BR-PROS-08 | PM hanya bisa approve atau kirim revisi; tidak bisa mengedit data prospek langsung |
| BR-PROS-09 | Jawaban pertanyaan master disimpan di tabel `prospect_answers` (relasional, bukan JSON blob — resolusi GAP-03) |
| BR-PROS-10 | Riwayat semua putaran review tersimpan dan visible di Tab Timeline |
| BR-PROS-11 | `assigned_pm_id` diisi otomatis berdasarkan konfigurasi workflow (posisi PM); Admin dapat re-assign |
| BR-PROS-12 | Notifikasi dikirim ke PM saat submit; ke Cabang saat revisi dikirim atau approve |
| BR-PROS-13 | Hapus prospek (soft-delete) hanya diizinkan jika status = `prospecting` |

---

## 5. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/prospects | Auth | List prospek (scope per role); query: status, search, page, perPage, dateFrom, dateTo |
| POST | /api/prospects | Cabang, Admin | Buat prospek baru |
| GET | /api/prospects/:id | Auth | Detail prospek + review history |
| PUT | /api/prospects/:id | Cabang, Admin | Update draft prospek |
| DELETE | /api/prospects/:id | Cabang, Admin | Soft-delete (hanya jika prospecting) |
| POST | /api/prospects/:id/submit | Cabang, Admin | Submit ke PM |
| POST | /api/prospects/:id/approve | PM, Admin | PM approve prospek |
| POST | /api/prospects/:id/revise | PM, Admin | PM kirim pertanyaan revisi |
| POST | /api/prospects/:id/answer | Cabang, Admin | Cabang submit jawaban revisi |
| POST | /api/prospects/:id/convert | Cabang, Admin | Konversi ke proyek |
| GET | /api/prospects/:id/timeline | Auth | Timeline event prospek |
| POST | /api/prospects/:id/reassign-pm | Admin | Re-assign PM (GAP-07) |

### 5.1 Request/Response Samples

**POST /api/prospects (Create)**
```json
{
  "customer_id": 5,
  "name": "Proyek Jalan Tol Ruas X",
  "description": "Tender pembangunan jalan tol ruas X–Y",
  "estimated_value": 50000000000,
  "estimated_close_date": "2025-09-30",
  "answers": [
    { "question_id": 1, "answer_text": "Ya" },
    { "question_id": 2, "answer_options": ["opsi_a", "opsi_c"] }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 87,
    "name": "Proyek Jalan Tol Ruas X",
    "status": "prospecting",
    "customer": { "id": 5, "name": "PT. Jasa Marga" },
    "branch": { "id": 3, "name": "Cabang Jakarta" },
    "created_at": "2025-06-01T08:30:00Z"
  }
}
```

**POST /api/prospects/:id/revise**
```json
{
  "review_questions": [
    { "question_text": "Apakah sudah ada dokumen RKS resmi dari customer?" },
    { "question_text": "Berapa estimasi peserta tender lainnya?" }
  ],
  "general_notes": "Mohon lengkapi informasi kompetitor yang mungkin ikut tender ini."
}
```

---

## 6. DATABASE SCHEMA (DDL)

```sql
CREATE TABLE prospects (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id             BIGINT UNSIGNED NOT NULL,
  customer_id           BIGINT UNSIGNED NOT NULL,
  created_by_user_id    BIGINT UNSIGNED NOT NULL,
  assigned_pm_id        BIGINT UNSIGNED NULL,
  name                  VARCHAR(200)    NOT NULL,
  description           TEXT            NULL,
  estimated_value       BIGINT          NULL,
  estimated_close_date  DATE            NULL,
  status                ENUM('prospecting','waiting_pm_approval','revision','approved','converted')
                                        NOT NULL DEFAULT 'prospecting',
  is_converted          TINYINT(1)      NOT NULL DEFAULT 0,
  converted_project_id  BIGINT UNSIGNED NULL,
  converted_at          TIMESTAMP       NULL,
  submitted_at          TIMESTAMP       NULL,
  approved_at           TIMESTAMP       NULL,
  is_deleted            TINYINT(1)      NOT NULL DEFAULT 0,
  deleted_at            TIMESTAMP       NULL,
  deleted_by            BIGINT UNSIGNED NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prospects_branch_id  (branch_id),
  KEY idx_prospects_customer   (customer_id),
  KEY idx_prospects_status     (status),
  KEY idx_prospects_is_deleted (is_deleted),
  KEY idx_prospects_pm         (assigned_pm_id),
  CONSTRAINT fk_pros_branch    FOREIGN KEY (branch_id)            REFERENCES branches(id),
  CONSTRAINT fk_pros_customer  FOREIGN KEY (customer_id)          REFERENCES customers(id),
  CONSTRAINT fk_pros_creator   FOREIGN KEY (created_by_user_id)   REFERENCES users(id),
  CONSTRAINT fk_pros_pm        FOREIGN KEY (assigned_pm_id)       REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_pros_project   FOREIGN KEY (converted_project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prospect_pm_reviews (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  prospect_id     BIGINT UNSIGNED NOT NULL,
  review_round    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  pm_user_id      BIGINT UNSIGNED NOT NULL,
  pm_general_notes TEXT           NULL,
  status          ENUM('questions_sent','answered','approved') NOT NULL DEFAULT 'questions_sent',
  questions_sent_at TIMESTAMP     NULL,
  answered_at     TIMESTAMP       NULL,
  reviewed_at     TIMESTAMP       NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ppr_prospect (prospect_id),
  CONSTRAINT fk_ppr_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ppr_pm       FOREIGN KEY (pm_user_id)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prospect_review_questions (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id    BIGINT UNSIGNED NOT NULL,
  question_text TEXT           NOT NULL,
  answer_text  TEXT            NULL,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  answered_at  TIMESTAMP       NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prq_review (review_id),
  CONSTRAINT fk_prq_review FOREIGN KEY (review_id) REFERENCES prospect_pm_reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-PROS-01 | Cabang buat prospek tanpa customer | Error 422: "Customer wajib dipilih" |
| TC-PROS-02 | Cabang submit prospek dengan pertanyaan required kosong | Error 422: list field yang belum diisi |
| TC-PROS-03 | Cabang simpan draft dengan pertanyaan required kosong | Berhasil; status = prospecting |
| TC-PROS-04 | PM approve prospek → Cabang konversi ke proyek | Proyek baru terbuat; prospek status = converted; link ke proyek tersimpan |
| TC-PROS-05 | Cabang Surabaya mencoba akses prospek Cabang Jakarta (via URL langsung) | HTTP 403 Forbidden |
| TC-PROS-06 | PM kirim revisi tanpa isi pertanyaan | Error: "Minimal 1 pertanyaan review wajib diisi" |
| TC-PROS-07 | Cabang jawab revisi dengan semua pertanyaan PM terjawab | Status → waiting_pm_approval; PM dinotifikasi |
| TC-PROS-08 | Cabang coba hapus prospek yang sudah di-submit ke PM | Error: "Prospek hanya bisa dihapus saat berstatus Prospecting" |
| TC-PROS-09 | Admin re-assign PM ke user lain | assigned_pm_id berubah; PM lama tidak lagi dapat notifikasi untuk prospek ini |
| TC-PROS-10 | 2 putaran revisi berturut-turut | Semua riwayat review tersimpan; Timeline menampilkan 2 putaran |

**FR Coverage:** FR010 ✓ | FR011 ✓ | FR012 ✓ | FR013 ✓ | FR014 ✓ | FR015 ✓
