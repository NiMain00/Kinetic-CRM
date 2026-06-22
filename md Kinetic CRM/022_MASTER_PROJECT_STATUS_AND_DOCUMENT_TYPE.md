# 022 — MASTER STATUS PROYEK & TIPE DOKUMEN
## KINETIC CRM — Master Status Proyek Dinamis dan Master Tipe Dokumen

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 022 |
| **Nama Dokumen** | Master Status Proyek & Tipe Dokumen |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.1 (MD-05, MD-11), B.2 (CFG-03) |
| **Gap Resolution** | MD-05, MD-11, CFG-03 |
| **Status** | Final |

---

## 1. MASTER STATUS PROYEK

### 1.1 Purpose

PRD v1.0 mendefinisikan status proyek sebagai **enum hardcode** di source code. Setiap penambahan status baru memerlukan deployment ulang. Modul ini memigrasikan status proyek ke DB sebagai entitas yang dapat dikonfigurasi Admin (CFG-03), menyelesaikan **MD-05**.

### 1.2 Entity: ProjectStatus

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode sistem (snake_case); immutable untuk status system |
| `label` | VARCHAR(100) | NOT NULL | Label tampilan untuk user |
| `description` | TEXT | NULL | Deskripsi lengkap status ini |
| `color_hex` | VARCHAR(7) | NOT NULL | Warna badge (#RRGGBB) |
| `text_color_hex` | VARCHAR(7) | NOT NULL DEFAULT '#FFFFFF' | Warna teks badge |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | Urutan dalam alur |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 0 | 1 = status bawaan; kode tidak bisa diubah |
| `is_terminal` | TINYINT(1) | NOT NULL DEFAULT 0 | 1 = status akhir (selesai, cancelled); tidak ada transisi keluar |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `applicable_to` | SET('tender','prospecting','both') | NOT NULL DEFAULT 'both' | Tipe proyek yang menggunakan status ini |
| `created_by` | BIGINT UNSIGNED | NULL | |
| `updated_by` | BIGINT UNSIGNED | NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 1.3 Entity: StatusTransition (Allowed Transitions)

Mendefinisikan transisi mana yang diizinkan dari status A ke status B.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `from_status_id` | BIGINT UNSIGNED | NOT NULL, FK → project_statuses.id | Status asal |
| `to_status_id` | BIGINT UNSIGNED | NOT NULL, FK → project_statuses.id | Status tujuan |
| `allowed_roles` | JSON | NOT NULL | Array role yang bisa melakukan transisi ini |
| `requires_note` | TINYINT(1) | NOT NULL DEFAULT 0 | Apakah wajib isi catatan saat transisi |
| `created_at` | TIMESTAMP | NOT NULL | |

### 1.4 Default Status Data (System Statuses)

| Code | Label | Color | is_system | is_terminal | applicable_to | sort_order |
|---|---|---|:---:|:---:|---|---|
| `created` | Dibuat | #6B7280 | 1 | 0 | both | 1 |
| `submit_rks` | RKS Disubmit | #2563A8 | 1 | 0 | tender | 2 |
| `review_department` | Review Departemen | #7C3AED | 1 | 0 | tender | 3 |
| `lphs_sios` | LPHS/SIOS | #4338CA | 1 | 0 | tender | 4 |
| `revision` | Revisi | #D97706 | 1 | 0 | both | 5 |
| `submit_harga` | Input Harga | #0D9488 | 1 | 0 | both | 6 |
| `pengumuman_pemenang` | Pengumuman Pemenang | #EA580C | 1 | 0 | both | 7 |
| `target_delivery` | Target Delivery | #0284C7 | 1 | 0 | both | 8 |
| `selesai` | Selesai | #16A34A | 1 | 1 | both | 9 |
| `cancelled` | Dibatalkan | #9F1239 | 1 | 1 | both | 10 |

### 1.5 Business Rules

| ID | Rule |
|---|---|
| BR-STATUS-01 | Status system (`is_system = 1`) tidak bisa diubah kode-nya; hanya label, warna, dan deskripsi |
| BR-STATUS-02 | Status `selesai` dan `cancelled` adalah terminal (`is_terminal = 1`); tidak ada transisi keluar |
| BR-STATUS-03 | Status yang sedang digunakan oleh proyek aktif tidak bisa dinonaktifkan |
| BR-STATUS-04 | Transisi status hanya diizinkan sesuai tabel `status_transitions`; backend enforce |
| BR-STATUS-05 | Status `cancelled` hanya bisa dicapai dari status apapun (kecuali terminal) oleh PM atau Admin dengan alasan wajib |
| BR-STATUS-06 | Frontend mengambil daftar status dari API (bukan hardcode) untuk menampilkan badge dan filter |

### 1.6 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/project-statuses | Auth | List status aktif (untuk badge, filter, dropdown) |
| GET | /api/config/statuses | Admin | List semua status dengan CRUD |
| POST | /api/config/statuses | Admin | Buat status baru |
| PUT | /api/config/statuses/:id | Admin | Update status (label, warna; bukan kode jika system) |
| PUT | /api/config/statuses/:id/deactivate | Admin | Nonaktifkan |
| GET | /api/config/status-transitions | Admin | List allowed transitions |
| POST | /api/config/status-transitions | Admin | Tambah transisi baru |
| DELETE | /api/config/status-transitions/:id | Admin | Hapus transisi |

### 1.7 DDL

```sql
CREATE TABLE project_statuses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code            VARCHAR(50)     NOT NULL,
  label           VARCHAR(100)    NOT NULL,
  description     TEXT            NULL,
  color_hex       VARCHAR(7)      NOT NULL,
  text_color_hex  VARCHAR(7)      NOT NULL DEFAULT '#FFFFFF',
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_system       TINYINT(1)      NOT NULL DEFAULT 0,
  is_terminal     TINYINT(1)      NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  applicable_to   SET('tender','prospecting') NOT NULL DEFAULT 'tender,prospecting',
  created_by      BIGINT UNSIGNED NULL,
  updated_by      BIGINT UNSIGNED NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_statuses_code (code),
  KEY idx_project_statuses_sort   (sort_order),
  KEY idx_project_statuses_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE status_transitions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_status_id BIGINT UNSIGNED NOT NULL,
  to_status_id   BIGINT UNSIGNED NOT NULL,
  allowed_roles  JSON            NOT NULL,
  requires_note  TINYINT(1)      NOT NULL DEFAULT 0,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_st_from_to (from_status_id, to_status_id),
  CONSTRAINT fk_st_from FOREIGN KEY (from_status_id) REFERENCES project_statuses(id) ON DELETE CASCADE,
  CONSTRAINT fk_st_to   FOREIGN KEY (to_status_id)   REFERENCES project_statuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. MASTER TIPE DOKUMEN

### 2.1 Purpose

Mengklasifikasikan dokumen yang diupload ke dalam kategori terstandar (RKS, LPHS, SIOS, SPK, Kontrak, Invoice, dll.) untuk navigasi, filtering, dan validasi dokumen wajib per tahap.

### 2.2 Entity: DocumentType

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Nama tipe dokumen |
| `code` | VARCHAR(30) | NOT NULL, UNIQUE | Kode singkat |
| `description` | TEXT | NULL | |
| `allowed_extensions` | JSON | NOT NULL | Array ekstensi yang diizinkan: ["pdf","docx"] |
| `max_size_mb` | SMALLINT UNSIGNED | NOT NULL DEFAULT 25 | Batas ukuran file dalam MB |
| `is_required_at_stage` | JSON | NULL | Array status proyek di mana dokumen ini wajib ada |
| `applicable_to` | SET('tender','prospecting') | NOT NULL | |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 0 | Tipe bawaan tidak bisa dihapus |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.3 Default Document Types (Data Seed)

| Code | Name | Max MB | allowed_extensions | applicable_to |
|---|---|---|---|---|
| `RKS` | Dokumen Tender / RKS | 25 | pdf, docx | tender |
| `LPHS` | Draft LPHS | 50 | pdf, docx, xlsx | tender |
| `SIOS` | Draft SIOS | 25 | pdf, docx | tender |
| `SPK` | Surat Perintah Kerja / Kontrak | 25 | pdf | both |
| `SURAT_KALAH` | Surat Kekalahan | 10 | pdf | both |
| `HARGA` | Dokumen Harga Penawaran | 10 | pdf, xlsx | both |
| `INVOICE` | Invoice / Tagihan | 10 | pdf | both |
| `LAINNYA` | Dokumen Lainnya | 25 | pdf, docx, xlsx, jpg, png | both |

### 2.4 Business Rules

| ID | Rule |
|---|---|
| BR-DOCTYPE-01 | Upload file divalidasi terhadap `allowed_extensions` dan `max_size_mb` tipe dokumen tersebut |
| BR-DOCTYPE-02 | Jika `is_required_at_stage` terisi, sistem mencegah transisi ke status berikutnya jika dokumen dengan tipe ini belum ada |
| BR-DOCTYPE-03 | Tipe dokumen system tidak bisa dihapus; hanya bisa dinonaktifkan |
| BR-DOCTYPE-04 | Setiap dokumen yang diupload WAJIB memiliki `document_type_id` |
| BR-DOCTYPE-05 | Frontend mengambil allowed_extensions dari API untuk validasi client-side file upload |

### 2.5 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/document-types | Auth | List tipe dokumen aktif |
| GET | /api/config/document-types | Admin | List semua dengan CRUD |
| POST | /api/config/document-types | Admin | Buat tipe dokumen baru |
| PUT | /api/config/document-types/:id | Admin | Update |
| PUT | /api/config/document-types/:id/deactivate | Admin | Nonaktifkan |

### 2.6 DDL

```sql
CREATE TABLE document_types (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                 VARCHAR(200)    NOT NULL,
  code                 VARCHAR(30)     NOT NULL,
  description          TEXT            NULL,
  allowed_extensions   JSON            NOT NULL,
  max_size_mb          SMALLINT UNSIGNED NOT NULL DEFAULT 25,
  is_required_at_stage JSON            NULL,
  applicable_to        SET('tender','prospecting') NOT NULL DEFAULT 'tender,prospecting',
  sort_order           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_system            TINYINT(1)      NOT NULL DEFAULT 0,
  is_active            TINYINT(1)      NOT NULL DEFAULT 1,
  created_by           BIGINT UNSIGNED NULL,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_document_types_name (name),
  UNIQUE KEY uq_document_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-STATUS-01 | Admin ubah label status "submit_rks" jadi "RKS Telah Dikirim" | Label berubah di semua tampilan; kode tetap `submit_rks` |
| TC-STATUS-02 | Admin coba ubah code status system `selesai` | Error: "Kode status sistem tidak dapat diubah" |
| TC-STATUS-03 | Proyek mencoba transisi ke status yang tidak ada di allowed_transitions | HTTP 422: "Transisi status tidak diizinkan" |
| TC-DOCTYPE-01 | Upload file .exe ke dokumen tipe RKS | Error: "Tipe file .exe tidak diizinkan untuk RKS" |
| TC-DOCTYPE-02 | Upload file PDF 30MB ke tipe RKS (max 25MB) | Error: "Ukuran file melebihi batas 25 MB" |
| TC-DOCTYPE-03 | Frontend menampilkan badge status warna sesuai konfigurasi | Warna badge sesuai `color_hex` dari DB, bukan hardcode |

**Gap Resolution:** MD-05 ✓ | MD-11 ✓ | CFG-03 ✓
