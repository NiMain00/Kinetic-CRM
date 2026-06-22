# 024 — MASTER PERTANYAAN & TIPE PERTANYAAN
## KINETIC CRM — Migrasi localStorage ke DB (GAP-03 Critical)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 024 |
| **Nama Dokumen** | Master Pertanyaan & Tipe Pertanyaan |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section C.1 (GAP-03 Critical), B.2 (CFG-12) |
| **Gap Resolution** | **GAP-03 Critical**, CFG-12, FR-102 |
| **Status** | Final — PRIORITAS TINGGI sebelum go-live |

---

## 1. PURPOSE & CRITICAL CONTEXT

> **⚠️ CRITICAL BUG (GAP-03):** PRD v1.0 menyimpan Question Type Definitions di `localStorage` browser. Ini menyebabkan: data hilang saat user clear browser cache, data tidak konsisten antar user yang berbeda browser, dan merupakan **production blocker** yang harus diselesaikan sebelum go-live.

Modul ini mendefinisikan dua entitas yang saling terkait:
1. **Master Tipe Pertanyaan** — definisi tipe jawaban yang tersedia (text, radio, dll.)
2. **Master Pertanyaan** — daftar pertanyaan yang digunakan di form Prospek dan RKS

Keduanya **wajib disimpan di database**, bukan localStorage.

---

## 2. ENTITY: QuestionType (Tipe Pertanyaan)

### 2.1 Purpose

Mendefinisikan tipe input jawaban yang tersedia untuk pertanyaan. Setiap tipe memiliki konfigurasi validasi dan rendering yang berbeda.

### 2.2 Schema

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Nama tipe (mis: "Teks Singkat", "Radio Button") |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode sistem: text, textarea, radio, checkbox, select |
| `description` | TEXT | NULL | |
| `has_options` | TINYINT(1) | NOT NULL DEFAULT 0 | 1 = memerlukan daftar opsi jawaban |
| `validation_config` | JSON | NULL | Config validasi default (mis: `{"maxLength": 500}`) |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 1 | Tipe bawaan tidak bisa dihapus |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 2.3 Default Question Types (Data Seed — System Types)

| Code | Name | has_options | Rendering |
|---|---|:---:|---|
| `text` | Teks Singkat | 0 | `<input type="text">` |
| `textarea` | Teks Panjang / Paragraf | 0 | `<textarea>` |
| `radio` | Pilihan Tunggal (Radio) | 1 | `<input type="radio">` per opsi |
| `checkbox` | Pilihan Banyak (Checkbox) | 1 | `<input type="checkbox">` per opsi |
| `select` | Dropdown Pilihan | 1 | `<select>` dengan opsi |
| `number` | Angka / Numerik | 0 | `<input type="number">` |
| `date` | Tanggal | 0 | Date picker |

---

## 3. ENTITY: Question (Pertanyaan)

### 3.1 Schema

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `question_text` | TEXT | NOT NULL | Teks pertanyaan |
| `question_type_id` | BIGINT UNSIGNED | NOT NULL, FK → question_types.id | Tipe jawaban |
| `context` | ENUM('prospect','rks','both') | NOT NULL | Di form mana pertanyaan ini muncul |
| `category` | VARCHAR(100) | NULL | Kategori pengelompokan pertanyaan (mis: "Teknis", "Komersial") |
| `is_required` | TINYINT(1) | NOT NULL DEFAULT 0 | 1 = wajib diisi sebelum submit |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | Urutan tampil |
| `placeholder_text` | VARCHAR(500) | NULL | Placeholder input |
| `help_text` | TEXT | NULL | Teks bantuan di bawah field |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 3.2 Entity: QuestionOption (Opsi Jawaban)

Digunakan untuk tipe radio, checkbox, select.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `question_id` | BIGINT UNSIGNED | NOT NULL, FK → questions.id | Parent pertanyaan |
| `option_text` | VARCHAR(500) | NOT NULL | Teks opsi |
| `option_value` | VARCHAR(200) | NOT NULL | Nilai yang disimpan saat dipilih |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | Urutan opsi |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |

---

## 4. ENTITY: ProspectAnswer / ProjectAnswer (Jawaban)

Menyimpan jawaban pertanyaan per prospek/proyek dalam format relasional (bukan JSON blob).

### 4.1 ProspectAnswer

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `prospect_id` | BIGINT UNSIGNED | NOT NULL, FK → prospects.id | |
| `question_id` | BIGINT UNSIGNED | NOT NULL, FK → questions.id | |
| `answer_text` | TEXT | NULL | Untuk tipe text, textarea, number, date |
| `answer_options` | JSON | NULL | Array option_value yang dipilih (untuk radio/checkbox/select) |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(prospect_id, question_id)`

### 4.2 ProjectRksAnswer (Jawaban RKS)

Struktur identik dengan ProspectAnswer tetapi FK ke `projects.id` dan context RKS.

---

## 5. BUSINESS RULES

| ID | Rule |
|---|---|
| **BR-Q-01 KRITIS** | Semua data tipe pertanyaan dan pertanyaan WAJIB tersimpan di DB, bukan localStorage |
| BR-Q-02 | Pertanyaan yang sudah memiliki jawaban di prospek/proyek aktif tidak bisa dihapus permanen; hanya nonaktifkan |
| BR-Q-03 | Pertanyaan nonaktif tidak muncul di form baru; tetap tampil pada prospek/proyek lama untuk konsistensi historis |
| BR-Q-04 | Urutan pertanyaan menentukan urutan tampil di form; bisa diubah via drag-and-drop |
| BR-Q-05 | Untuk tipe radio/checkbox/select: minimal 2 opsi aktif harus ada |
| BR-Q-06 | Jika pertanyaan required dihapus opsinya sehingga < 2 opsi, sistem memperingatkan Admin |
| BR-Q-07 | Jawaban disimpan per (prospect/project, question) — satu record per pasangan |

---

## 6. LOCALSTORAGE MIGRATION PLAN

### 6.1 Kondisi Saat Ini (Bug Production)

```javascript
// Kondisi lama yang harus DIHAPUS
const questionTypes = JSON.parse(localStorage.getItem('questionTypes') || '[]');
```

### 6.2 Langkah Migrasi

**Step 1:** Buat tabel `question_types`, `questions`, `question_options` (DDL di Section 8)

**Step 2:** Seed data tipe pertanyaan default ke DB

**Step 3:** Buat script one-time migration untuk membaca localStorage dari browser Admin dan mengimport ke DB (jika ada data pertanyaan existing)

**Step 4:** Remove semua kode yang membaca/menulis `localStorage` untuk question types

**Step 5:** Update semua form (form prospek, form RKS) untuk fetch pertanyaan dari API

```typescript
// BEFORE (bug - localStorage)
const questions = JSON.parse(localStorage.getItem('prospectQuestions') || '[]');

// AFTER (fix - API)
const { data: questions } = useQuery({
  queryKey: ['questions', 'prospect'],
  queryFn: () => api.get('/api/master/questions?context=prospect')
});
```

---

## 7. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/questions | Auth | List pertanyaan aktif (query: context=prospect/rks) |
| GET | /api/config/questions | Admin | List semua pertanyaan dengan CRUD |
| POST | /api/config/questions | Admin | Buat pertanyaan baru |
| PUT | /api/config/questions/:id | Admin | Update pertanyaan |
| PUT | /api/config/questions/:id/deactivate | Admin | Nonaktifkan |
| PATCH | /api/config/questions/reorder | Admin | Reorder pertanyaan (body: [{id, sort_order}]) |
| GET | /api/config/questions/:id/options | Admin | List opsi jawaban pertanyaan |
| POST | /api/config/questions/:id/options | Admin | Tambah opsi |
| PUT | /api/config/questions/:id/options/:optId | Admin | Update opsi |
| DELETE | /api/config/questions/:id/options/:optId | Admin | Hapus opsi (jika tidak digunakan) |
| GET | /api/config/question-types | Admin | List tipe pertanyaan |
| POST | /api/config/question-types | Admin | Buat tipe baru (non-system) |

---

## 8. DATABASE SCHEMA (DDL)

```sql
CREATE TABLE question_types (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(100)    NOT NULL,
  code             VARCHAR(50)     NOT NULL,
  description      TEXT            NULL,
  has_options      TINYINT(1)      NOT NULL DEFAULT 0,
  validation_config JSON           NULL,
  is_system        TINYINT(1)      NOT NULL DEFAULT 1,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qt_code (code),
  UNIQUE KEY uq_qt_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_text    TEXT            NOT NULL,
  question_type_id BIGINT UNSIGNED NOT NULL,
  context          ENUM('prospect','rks','both') NOT NULL,
  category         VARCHAR(100)    NULL,
  is_required      TINYINT(1)      NOT NULL DEFAULT 0,
  sort_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  placeholder_text VARCHAR(500)    NULL,
  help_text        TEXT            NULL,
  is_active        TINYINT(1)      NOT NULL DEFAULT 1,
  created_by       BIGINT UNSIGNED NULL,
  updated_by       BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_questions_context   (context),
  KEY idx_questions_sort      (sort_order),
  KEY idx_questions_active    (is_active),
  CONSTRAINT fk_questions_type FOREIGN KEY (question_type_id) REFERENCES question_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_options (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id  BIGINT UNSIGNED NOT NULL,
  option_text  VARCHAR(500)    NOT NULL,
  option_value VARCHAR(200)    NOT NULL,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active    TINYINT(1)      NOT NULL DEFAULT 1,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qo_question_id (question_id),
  KEY idx_qo_sort        (sort_order),
  CONSTRAINT fk_qo_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prospect_answers (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  prospect_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  answer_text TEXT            NULL,
  answer_options JSON         NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pa_prospect_question (prospect_id, question_id),
  KEY idx_pa_prospect_id  (prospect_id),
  CONSTRAINT fk_pa_prospect  FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_question  FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_rks_answers (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  answer_text TEXT            NULL,
  answer_options JSON         NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rks_project_question (project_id, question_id),
  CONSTRAINT fk_rks_project  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_rks_question FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 9. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| **TC-Q-01 CRITICAL** | Clear localStorage di browser; buka form prospek | Pertanyaan tetap muncul (dari DB, bukan localStorage) |
| TC-Q-02 | User berbeda membuka form prospek di browser berbeda | Pertanyaan yang sama muncul (konsisten karena dari DB) |
| TC-Q-03 | Admin nonaktifkan pertanyaan yang sudah ada jawabannya di 3 prospek | Warning; setelah konfirmasi: nonaktif; pertanyaan masih tampil di 3 prospek lama (read-only) |
| TC-Q-04 | Admin tambah pertanyaan baru tipe radio tanpa opsi | Error: "Pertanyaan radio harus memiliki minimal 2 opsi" |
| TC-Q-05 | Admin drag-drop reorder pertanyaan | Urutan baru tersimpan; form prospek menampilkan urutan baru |
| TC-Q-06 | Form prospek submit dengan pertanyaan required kosong | Error inline di field pertanyaan tersebut |

**Gap Resolution:** GAP-03 Critical ✓ | CFG-12 ✓ | FR-102 ✓
