# 021 — MASTER CUSTOMER & CATEGORY
## KINETIC CRM — Master Customer, Kategori Proyek, dan Industri

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 021 |
| **Nama Dokumen** | Master Customer & Category |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.1 (MD-04), FE Spec Section 8.2 |
| **Gap Resolution** | MD-04 (Kategori Proyek), CFG-11 |
| **Status** | Final |

---

## 1. MASTER CUSTOMER

### 1.1 Purpose

Entitas Customer adalah referensi terpusat untuk semua prospek dan proyek dalam KINETIC CRM. Normalisasi customer memungkinkan: analisis win rate per customer, segmentasi per jenis customer, dan konsistensi nama customer di seluruh laporan.

### 1.2 Entity: Customer

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Nama resmi customer |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Kode singkat; uppercase; alphanumeric |
| `type` | ENUM('swasta','bumn','pemerintah','asing') | NOT NULL | Jenis customer |
| `industry_id` | BIGINT UNSIGNED | NULL, FK → industries.id | Industri customer |
| `pic_name` | VARCHAR(200) | NULL | Nama contact person |
| `pic_email` | VARCHAR(200) | NULL | Email contact person |
| `pic_phone` | VARCHAR(30) | NULL | Telepon contact person |
| `address` | TEXT | NULL | Alamat customer |
| `city` | VARCHAR(100) | NULL | Kota |
| `province` | VARCHAR(100) | NULL | Provinsi |
| `npwp` | VARCHAR(30) | NULL | NPWP customer |
| `notes` | TEXT | NULL | Catatan tambahan |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 1.3 Business Rules

| ID | Rule |
|---|---|
| BR-CUST-01 | Nama customer harus unik di seluruh sistem |
| BR-CUST-02 | Kode customer otomatis di-generate dari 3-6 karakter pertama nama (uppercase) + nomor urut jika duplikat; dapat dioverride manual |
| BR-CUST-03 | Customer nonaktif tidak bisa dipilih di form prospek/proyek baru |
| BR-CUST-04 | Customer yang sudah memiliki proyek/prospek aktif tidak bisa dinonaktifkan tanpa peringatan |
| BR-CUST-05 | Admin tidak bisa hapus customer; hanya nonaktifkan |
| BR-CUST-06 | Satu proyek/prospek selalu memiliki tepat satu customer (required FK) |

### 1.4 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/customers | Admin | List customer; query: search, isActive, type, industryId, page |
| GET | /api/master/customers/search | Auth | Search async untuk dropdown (query: q); hanya aktif |
| POST | /api/master/customers | Admin | Buat customer baru |
| GET | /api/master/customers/:id | Admin | Detail customer |
| PUT | /api/master/customers/:id | Admin | Update customer |
| PUT | /api/master/customers/:id/deactivate | Admin | Nonaktifkan |
| PUT | /api/master/customers/:id/activate | Admin | Aktifkan kembali |
| GET | /api/master/customers/:id/stats | Admin | Statistik: jumlah proyek, win rate, total nilai |

### 1.5 DDL

```sql
CREATE TABLE customers (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)    NOT NULL,
  code        VARCHAR(20)     NOT NULL,
  type        ENUM('swasta','bumn','pemerintah','asing') NOT NULL,
  industry_id BIGINT UNSIGNED NULL,
  pic_name    VARCHAR(200)    NULL,
  pic_email   VARCHAR(200)    NULL,
  pic_phone   VARCHAR(30)     NULL,
  address     TEXT            NULL,
  city        VARCHAR(100)    NULL,
  province    VARCHAR(100)    NULL,
  npwp        VARCHAR(30)     NULL,
  notes       TEXT            NULL,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL,
  updated_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_name (name),
  UNIQUE KEY uq_customers_code (code),
  KEY idx_customers_type      (type),
  KEY idx_customers_is_active (is_active),
  KEY idx_customers_industry  (industry_id),
  CONSTRAINT fk_customers_industry FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. MASTER KATEGORI PROYEK

### 2.1 Purpose

Klasifikasi proyek berdasarkan jenis pekerjaan (Konstruksi, IT, Konsultansi, Pengadaan, dll.) untuk segmentasi analitik, laporan win rate per kategori, dan konfigurasi aturan bisnis per kategori (mis: apakah LPHS wajib untuk kategori ini).

BA Review MD-04 mengidentifikasi ini sebagai **High Priority** karena memungkinkan analisis win rate per kategori dan prioritisasi resource per kategori strategis.

### 2.2 Entity: ProjectCategory

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Nama kategori |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Kode singkat |
| `description` | TEXT | NULL | |
| `requires_lphs` | TINYINT(1) | NOT NULL DEFAULT 1 | Apakah LPHS wajib untuk kategori ini |
| `requires_rks` | TINYINT(1) | NOT NULL DEFAULT 1 | Apakah RKS wajib |
| `default_workflow_type` | ENUM('tender','prospecting') | NOT NULL DEFAULT 'tender' | Workflow default saat buat proyek kategori ini |
| `color_hex` | VARCHAR(7) | NULL | Warna badge (#RRGGBB) |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | Urutan tampil di dropdown |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.3 Default Categories (Data Seed)

| Code | Name | requires_lphs | requires_rks | default_workflow |
|---|---|:---:|:---:|---|
| KONSTRUKSI | Konstruksi & Sipil | 1 | 1 | tender |
| IT_SISTEM | IT & Sistem Informasi | 1 | 1 | tender |
| KONSULTANSI | Jasa Konsultansi | 0 | 1 | tender |
| PENGADAAN | Pengadaan Barang | 1 | 1 | tender |
| JASA_UMUM | Jasa Umum | 0 | 1 | prospecting |
| LAINNYA | Lainnya | 0 | 0 | prospecting |

### 2.4 Business Rules

| ID | Rule |
|---|---|
| BR-CAT-01 | Setiap proyek harus memiliki satu kategori (required) |
| BR-CAT-02 | Jika `requires_lphs = false`, tab LPHS/SIOS disembunyikan di detail proyek |
| BR-CAT-03 | Jika `requires_rks = false`, tab RKS disembunyikan |
| BR-CAT-04 | Perubahan `requires_lphs` pada kategori tidak berlaku retroaktif untuk proyek yang sedang berjalan |
| BR-CAT-05 | Kategori yang sudah digunakan proyek tidak bisa dihapus permanen |

### 2.5 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/categories | Auth | List kategori aktif (untuk dropdown) |
| GET | /api/config/categories | Admin | List semua kategori dengan CRUD |
| POST | /api/config/categories | Admin | Buat kategori baru |
| PUT | /api/config/categories/:id | Admin | Update kategori |
| PUT | /api/config/categories/:id/deactivate | Admin | Nonaktifkan |

### 2.6 DDL

```sql
CREATE TABLE project_categories (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(200)    NOT NULL,
  code                  VARCHAR(20)     NOT NULL,
  description           TEXT            NULL,
  requires_lphs         TINYINT(1)      NOT NULL DEFAULT 1,
  requires_rks          TINYINT(1)      NOT NULL DEFAULT 1,
  default_workflow_type ENUM('tender','prospecting') NOT NULL DEFAULT 'tender',
  color_hex             VARCHAR(7)      NULL,
  sort_order            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active             TINYINT(1)      NOT NULL DEFAULT 1,
  created_by            BIGINT UNSIGNED NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_code (code),
  KEY idx_categories_sort (sort_order),
  KEY idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. MASTER INDUSTRI

### 3.1 Purpose

Segmentasi customer berdasarkan sektor industri untuk analitik lanjutan (Fase 2/3). Mendukung filtering laporan win rate per industri.

### 3.2 Entity: Industry

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Nama industri |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Kode |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 3.3 Default Industries (Data Seed)

Energi & Pertambangan, Konstruksi & Infrastruktur, Teknologi Informasi, Perbankan & Keuangan, Manufaktur, Pemerintahan, Kesehatan, Pendidikan, Retail & Distribusi, Telekomunikasi, Lainnya.

### 3.4 DDL

```sql
CREATE TABLE industries (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200)    NOT NULL,
  code       VARCHAR(20)     NOT NULL,
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_industries_name (name),
  UNIQUE KEY uq_industries_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-CUST-01 | Admin buat customer dengan nama yang sudah ada | Error 422: "Nama customer sudah digunakan" |
| TC-CUST-02 | Admin nonaktifkan customer yang punya proyek aktif | Warning tampil dengan count proyek aktif |
| TC-CUST-03 | Customer nonaktif tidak muncul di dropdown form proyek | Verified: hanya customer aktif tampil |
| TC-CAT-01 | Admin nonaktifkan kategori KONSTRUKSI | Warning: "X proyek menggunakan kategori ini" |
| TC-CAT-02 | Proyek dengan kategori `requires_lphs = false` | Tab LPHS/SIOS disembunyikan di detail proyek |
| TC-CAT-03 | Buat proyek dengan kategori baru yang baru dibuat Admin | Kategori tersedia di dropdown saat buat proyek |

**Gap Resolution:** MD-04 ✓ | CFG-11 ✓
