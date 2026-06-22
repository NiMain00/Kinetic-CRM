# 015 — ORGANIZATION HIERARCHY MODULE
## KINETIC CRM — Modul Hierarki Organisasi

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 015 |
| **Nama Dokumen** | Organization Hierarchy Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.3, D.3 |
| **Gap Resolution** | GAP-05 (Major), CFG-01 (High Priority) |
| **Status** | Final |

---

## 1. PURPOSE & BUSINESS CONTEXT

### 1.1 Latar Belakang

PRD v1.0 STMS hanya mengenal role `cabang` sebagai atribut string pada tabel `users` — bukan sebagai entitas data bermakna. Akibatnya:

- Tidak bisa menambah data cabang (alamat, telepon, PIC) tanpa coding
- Tidak bisa menonaktifkan cabang
- Laporan per cabang bergantung pada string-matching yang rapuh
- Tidak ada hierarki Perusahaan → Divisi → Departemen → Cabang yang termodelkan
- KPI dan target tidak bisa diagregasi per divisi atau per cabang secara akurat

Modul ini mendefinisikan **hierarki organisasi sebagai entitas data mandiri** yang dapat dikelola Admin melalui antarmuka konfigurasi, menyelesaikan **GAP-05 (Major)** dari BA Review.

### 1.2 Tujuan Modul

1. Memodelkan hierarki Perusahaan → Divisi → Departemen → Cabang (→ User) sebagai entitas relasional penuh
2. Memungkinkan Admin mengelola struktur organisasi tanpa perlu deployment ulang aplikasi (CFG-01)
3. Menjadi fondasi scope data (data isolation per cabang), laporan per unit, dan approval berbasis posisi
4. Mendukung skenario multi-perusahaan di masa depan (struktur siap, fitur dikontrol via feature flag)

---

## 2. ENTITY DEFINITIONS

### 2.1 Hierarki Level

```
L1: Company (Perusahaan)
  └── L2: Division (Divisi)
        └── L3: Department (Departemen)   ← bisa juga sub-departemen (self-ref)
        └── L4: Branch (Cabang)
              └── L5: User
```

> **Inferred Requirement IR-ORG-01:** Departemen dan Cabang sama-sama berada di bawah Divisi. Departemen bersifat fungsional lintas proyek (Engineering, Legal, Finance); Cabang bersifat operasional geografis (Cabang Jakarta, Cabang Surabaya). Keduanya memiliki relasi ke Divisi yang sama untuk agregasi KPI.

### 2.2 Entity: Company (Perusahaan)

**Tujuan:** Root hierarki organisasi. Memungkinkan sistem menampung multi-perusahaan (anak perusahaan, group) di masa depan. Fase 1: satu perusahaan saja.

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Nama resmi perusahaan |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Kode singkatan, uppercase |
| `logo_path` | VARCHAR(500) | NULL | Path relatif logo di storage |
| `address` | TEXT | NULL | Alamat lengkap kantor pusat |
| `city` | VARCHAR(100) | NULL | Kota kantor pusat |
| `phone` | VARCHAR(30) | NULL | Nomor telepon |
| `email` | VARCHAR(200) | NULL | Email perusahaan |
| `npwp` | VARCHAR(30) | NULL | NPWP perusahaan |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | Soft-enable |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | NOT NULL, ON UPDATE | |

### 2.3 Entity: Division (Divisi)

**Tujuan:** Pengelompokan strategis bisnis di bawah perusahaan. Contoh: Divisi Infrastruktur, Divisi Teknologi Informasi, Divisi Konsultansi. Menjadi level agregasi KPI per lini bisnis.

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `company_id` | BIGINT UNSIGNED | NOT NULL, FK → companies.id | Parent perusahaan |
| `name` | VARCHAR(200) | NOT NULL | Nama divisi |
| `code` | VARCHAR(20) | NOT NULL | Kode divisi, uppercase, unique per company |
| `head_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | Kepala divisi |
| `description` | TEXT | NULL | Deskripsi singkat divisi |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(company_id, code)`

### 2.4 Entity: Department (Departemen)

**Tujuan:** Unit fungsional (Engineering, Legal, Finance, HR, dll.) yang menjadi reviewer LPHS/SIOS. Sudah ada sebagian di PRD v1.0 sebagai `master_departments`, diperkuat dengan relasi ke Divisi dan kolom tambahan.

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `division_id` | BIGINT UNSIGNED | NOT NULL, FK → divisions.id | Parent divisi |
| `parent_dept_id` | BIGINT UNSIGNED | NULL, FK → departments.id (self-ref) | Sub-departemen (opsional) |
| `name` | VARCHAR(200) | NOT NULL | Nama departemen |
| `code` | VARCHAR(20) | NOT NULL | Kode, uppercase, unique per division |
| `head_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | Kepala departemen (role=department) |
| `description` | TEXT | NULL | |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(division_id, code)`

**Inferred Requirement IR-ORG-02:** `parent_dept_id` didesain sekarang untuk mendukung sub-departemen di masa depan tanpa perlu migrasi schema. Untuk Fase 1, selalu NULL.

### 2.5 Entity: Branch (Cabang)

**Tujuan:** Kantor cabang operasional tempat staf Cabang bekerja dan dari mana proyek/prospek dibuat. Menggantikan string `branch` pada tabel `users`.

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `division_id` | BIGINT UNSIGNED | NOT NULL, FK → divisions.id | Parent divisi |
| `name` | VARCHAR(200) | NOT NULL | Nama cabang |
| `code` | VARCHAR(20) | NOT NULL | Kode cabang, uppercase, unique per company |
| `city` | VARCHAR(100) | NOT NULL | Kota cabang |
| `address` | TEXT | NULL | Alamat lengkap |
| `phone` | VARCHAR(30) | NULL | Telepon cabang |
| `email` | VARCHAR(200) | NULL | Email cabang |
| `pic_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | PIC / Kepala cabang |
| `is_active` | TINYINT(1) | NOT NULL, DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(division_id, code)`

---

## 3. RELASI ANTAR ENTITAS

```
companies (1)
  ├──< divisions (N)         company_id FK
  │     ├──< departments (N) division_id FK
  │     │     └──< departments (self-ref, sub-dept)
  │     └──< branches (N)    division_id FK
  │           └──< users (N) branch_id FK
  │
  └── users.company_id (opsional, untuk admin level perusahaan)

departments (1)
  └──< users (N)             department_id FK  (untuk role=department)

users (M)
  ├── branch_id FK → branches.id    (untuk role=cabang)
  ├── department_id FK → departments.id  (untuk role=department)
  └── company_id FK → companies.id (opsional; untuk admin)
```

### 3.1 Perubahan pada Tabel `users`

Tambahkan kolom berikut ke tabel `users` yang sudah ada:

| Kolom Baru | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `branch_id` | BIGINT UNSIGNED | NULL, FK → branches.id | Diisi jika role = cabang |
| `department_id` | BIGINT UNSIGNED | NULL, FK → departments.id | Diisi jika role = department |
| `company_id` | BIGINT UNSIGNED | NULL, FK → companies.id | Opsional; untuk admin/management |
| `position_id` | BIGINT UNSIGNED | NULL, FK → positions.id | Jabatan/posisi (lihat dokumen 016) |

**Business Rule:** Enforced di layer backend saat create/update user:
- Jika `role = cabang` → `branch_id` wajib ada, `department_id` NULL
- Jika `role = department` → `department_id` wajib ada, `branch_id` NULL
- Jika `role = pm | management | admin` → keduanya boleh NULL (akses lintas unit)

---

## 4. BUSINESS RULES

### 4.1 Rules Pembuatan Entitas

| ID | Rule | Enforcement |
|---|---|---|
| BR-ORG-01 | Minimal harus ada 1 perusahaan aktif dalam sistem | Backend constraint; UI menyembunyikan tombol nonaktifkan jika hanya 1 perusahaan |
| BR-ORG-02 | Kode entitas harus unik dalam scope parent-nya (mis: kode divisi unik per perusahaan) | DB UNIQUE constraint + backend validation |
| BR-ORG-03 | Entitas tidak bisa dihapus secara permanen (soft-delete via `is_active`) | Backend enforce; tidak ada endpoint DELETE |
| BR-ORG-04 | Entitas baru otomatis berstatus aktif | DEFAULT 1 di DB |
| BR-ORG-05 | Entitas anak tidak bisa aktif jika entitas induknya nonaktif | Backend validation saat create/activate |

### 4.2 Rules Nonaktifasi (Cascade)

| ID | Rule | Perilaku UI |
|---|---|---|
| BR-ORG-06 | Menonaktifkan **Perusahaan** menonaktifkan semua Divisi, Departemen, Cabang, dan User di bawahnya | Warning: "Nonaktifkan perusahaan ini akan menonaktifkan X divisi, Y cabang, dan Z pengguna" |
| BR-ORG-07 | Menonaktifkan **Divisi** menonaktifkan semua Departemen, Cabang, dan User di bawah divisi tersebut | Warning serupa dengan count |
| BR-ORG-08 | Menonaktifkan **Departemen** menonaktifkan User yang assigned ke departemen tersebut | Warning + konfirmasi |
| BR-ORG-09 | Menonaktifkan **Cabang** menonaktifkan User yang assigned ke cabang tersebut | Warning + konfirmasi |
| BR-ORG-10 | Nonaktifasi bersifat **cascade langsung**, bukan lazy — semua entitas anak langsung dinonaktifkan | Backend runs cascade update dalam satu transaction |

### 4.3 Rules Relasi ke Proyek & Prospek

| ID | Rule |
|---|---|
| BR-ORG-11 | Setiap Prospek memiliki `branch_id` yang mengacu ke Branch aktif; tidak boleh NULL |
| BR-ORG-12 | Setiap Proyek memiliki `branch_id` yang mengacu ke Branch aktif; tidak boleh NULL |
| BR-ORG-13 | Proyek dan Prospek yang sudah ada tidak terpengaruh jika cabangnya dinonaktifkan (data historis tetap) |
| BR-ORG-14 | Cabang nonaktif tidak bisa membuat Proyek atau Prospek baru |
| BR-ORG-15 | Laporan dapat mengagregasi data sampai level Perusahaan: Branch → Division → Company |

### 4.4 Rules Kepala / PIC

| ID | Rule |
|---|---|
| BR-ORG-16 | `head_user_id` pada Division dan `pic_user_id` pada Branch harus mengacu ke user yang aktif |
| BR-ORG-17 | `head_user_id` pada Department harus mengacu ke user dengan `role = department` |
| BR-ORG-18 | Approval workflow berbasis posisi menggunakan `head_user_id` / `pic_user_id` bukan hardcode username (lihat dokumen 016) |
| BR-ORG-19 | Jika head/PIC dinonaktifkan, posisi kepala menjadi kosong (NULL); approval fallback ke backup approver dari CFG-02 |

---

## 5. CRUD OPERATIONS

### 5.1 Company CRUD

#### Create Company
```
POST /api/config/companies
Authorization: Admin only
Body: {
  name: string (required, unique)
  code: string (required, unique, uppercase)
  logo: File (optional, multipart)
  address: string (optional)
  city: string (optional)
  phone: string (optional)
  email: string (optional)
  npwp: string (optional)
}
Response 201: { id, name, code, ... }
Response 422: { errors: { field: [message] } }
```

#### Read Company Tree
```
GET /api/config/org/tree
Authorization: Admin only
Response 200: {
  companies: [{
    id, name, code, is_active,
    divisions: [{
      id, name, code, is_active,
      departments: [{ id, name, code, is_active, head_user: {id, name} }],
      branches: [{ id, name, code, city, is_active, pic_user: {id, name} }]
    }]
  }]
}
```

#### Update Company
```
PUT /api/config/companies/:id
Authorization: Admin only
Body: { name?, code?, logo?, address?, city?, phone?, email?, npwp?, is_active? }
Response 200: updated company object
```

### 5.2 Division CRUD

```
GET    /api/config/divisions?companyId=            → list divisi per perusahaan
POST   /api/config/divisions                        → buat divisi baru
PUT    /api/config/divisions/:id                    → update divisi
PUT    /api/config/divisions/:id/deactivate         → nonaktifkan (cascade)
PUT    /api/config/divisions/:id/activate           → aktifkan kembali
```

**POST Body:**
```json
{
  "company_id": 1,
  "name": "Divisi Infrastruktur",
  "code": "INFRA",
  "head_user_id": 12,
  "description": "Bertanggung jawab atas proyek infrastruktur"
}
```

### 5.3 Department CRUD

```
GET    /api/config/departments?divisionId=          → list dept per divisi
GET    /api/master/departments                       → list semua dept aktif (untuk dropdown)
POST   /api/config/departments
PUT    /api/config/departments/:id
PUT    /api/config/departments/:id/deactivate
PUT    /api/config/departments/:id/activate
```

**POST Body:**
```json
{
  "division_id": 2,
  "parent_dept_id": null,
  "name": "Engineering",
  "code": "ENG",
  "head_user_id": 15
}
```

### 5.4 Branch CRUD

```
GET    /api/config/branches?divisionId=             → list cabang per divisi
GET    /api/config/branches                         → list semua cabang aktif (untuk dropdown user assignment)
POST   /api/config/branches
PUT    /api/config/branches/:id
PUT    /api/config/branches/:id/deactivate
PUT    /api/config/branches/:id/activate
```

**POST Body:**
```json
{
  "division_id": 2,
  "name": "Cabang Jakarta Selatan",
  "code": "JKT-SEL",
  "city": "Jakarta",
  "address": "Jl. Sudirman No. 123",
  "phone": "021-5551234",
  "email": "jktsel@company.com",
  "pic_user_id": 20
}
```

---

## 6. VALIDATION RULES

### 6.1 Field-Level Validation

| Entity | Field | Rule | Pesan Error |
|---|---|---|---|
| Company | name | Required, max 200 char, unique | "Nama perusahaan sudah digunakan" |
| Company | code | Required, max 20, uppercase, alphanumeric, unique | "Kode perusahaan sudah digunakan" |
| Division | name | Required, max 200 | "Nama divisi wajib diisi" |
| Division | code | Required, max 20, uppercase, unique per company | "Kode divisi sudah digunakan dalam perusahaan ini" |
| Division | company_id | Required, must be active company | "Perusahaan tidak ditemukan atau tidak aktif" |
| Department | name | Required, max 200 | |
| Department | code | Required, max 20, uppercase, unique per division | |
| Department | division_id | Required, must be active division | |
| Department | head_user_id | If set: must be active user with role=department | "Kepala departemen harus memiliki role Department" |
| Branch | name | Required, max 200 | |
| Branch | code | Required, max 20, uppercase, unique per division | |
| Branch | division_id | Required, must be active division | |
| Branch | city | Required | "Kota cabang wajib diisi" |
| Branch | pic_user_id | If set: must be active user | |

### 6.2 Business Validation saat Deactivate

Sebelum menonaktifkan entitas, backend mengumpulkan dan mengembalikan summary dampak:

```json
{
  "entity": "division",
  "entity_id": 2,
  "entity_name": "Divisi Infrastruktur",
  "cascade_impact": {
    "departments": 3,
    "branches": 5,
    "active_users": 18,
    "active_projects": 12
  },
  "warning": "Menonaktifkan divisi ini akan mempengaruhi 3 departemen, 5 cabang, 18 pengguna, dan 12 proyek aktif.",
  "requires_confirmation": true
}
```

Client harus mengirim `{ confirmed: true }` untuk melanjutkan.

---

## 7. STATE DIAGRAM

### 7.1 Lifecycle State Entitas Organisasi

```
         ┌─────────┐
  Create →│  AKTIF  │←── Activate (admin)
         └────┬────┘
              │ Deactivate (admin)
              ↓
         ┌──────────┐
         │ NONAKTIF │
         └──────────┘
              │ (tidak bisa dihapus)
              │ Dapat diaktifkan kembali
```

### 7.2 Constraint State Transitions

| Dari | Ke | Kondisi |
|---|---|---|
| AKTIF | NONAKTIF | Hanya Admin; cascade ke entitas anak; proyek aktif tetap berjalan |
| NONAKTIF | AKTIF | Hanya Admin; entitas induk harus aktif; user anak tidak otomatis aktif kembali |

---

## 8. API ENDPOINT SPECIFICATION

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/org/tree | Admin | Full hierarki tree (Company → Division → Dept + Branch) |
| GET | /api/config/companies | Admin | List perusahaan |
| POST | /api/config/companies | Admin | Buat perusahaan |
| GET | /api/config/companies/:id | Admin | Detail perusahaan |
| PUT | /api/config/companies/:id | Admin | Update perusahaan |
| PUT | /api/config/companies/:id/deactivate | Admin | Nonaktifkan + cascade |
| PUT | /api/config/companies/:id/activate | Admin | Aktifkan kembali |
| GET | /api/config/divisions | Admin | List divisi (query: companyId) |
| POST | /api/config/divisions | Admin | Buat divisi |
| PUT | /api/config/divisions/:id | Admin | Update divisi |
| PUT | /api/config/divisions/:id/deactivate | Admin | Nonaktifkan + cascade |
| PUT | /api/config/divisions/:id/activate | Admin | Aktifkan |
| GET | /api/config/departments | Admin | List dept (query: divisionId) |
| GET | /api/master/departments | Auth | List dept aktif untuk dropdown |
| POST | /api/config/departments | Admin | Buat departemen |
| PUT | /api/config/departments/:id | Admin | Update departemen |
| PUT | /api/config/departments/:id/deactivate | Admin | Nonaktifkan |
| PUT | /api/config/departments/:id/activate | Admin | Aktifkan |
| GET | /api/config/branches | Admin | List cabang (query: divisionId) |
| GET | /api/master/branches | Auth | List cabang aktif untuk dropdown |
| POST | /api/config/branches | Admin | Buat cabang |
| PUT | /api/config/branches/:id | Admin | Update cabang |
| PUT | /api/config/branches/:id/deactivate | Admin | Nonaktifkan |
| PUT | /api/config/branches/:id/activate | Admin | Aktifkan |
| GET | /api/config/org/deactivate-impact/:type/:id | Admin | Preview dampak sebelum nonaktifkan |

### 8.1 Response Format Standar

**Success (201 Create):**
```json
{
  "success": true,
  "data": { "id": 5, "name": "Cabang Surabaya", "code": "SBY", ... },
  "message": "Cabang berhasil dibuat"
}
```

**Error (422 Validation):**
```json
{
  "success": false,
  "errors": {
    "code": ["Kode cabang sudah digunakan dalam divisi ini"],
    "city": ["Kota cabang wajib diisi"]
  }
}
```

**Error (409 Conflict — deactivate without confirmation):**
```json
{
  "success": false,
  "requires_confirmation": true,
  "cascade_impact": { ... },
  "warning": "..."
}
```

---

## 9. DATABASE SCHEMA (DDL)

```sql
-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE companies (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(200)    NOT NULL,
  code          VARCHAR(20)     NOT NULL,
  logo_path     VARCHAR(500)    NULL,
  address       TEXT            NULL,
  city          VARCHAR(100)    NULL,
  phone         VARCHAR(30)     NULL,
  email         VARCHAR(200)    NULL,
  npwp          VARCHAR(30)     NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_by    BIGINT UNSIGNED NULL,
  updated_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_code (code),
  UNIQUE KEY uq_companies_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: divisions
-- ============================================================
CREATE TABLE divisions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id    BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(200)    NOT NULL,
  code          VARCHAR(20)     NOT NULL,
  head_user_id  BIGINT UNSIGNED NULL,
  description   TEXT            NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_by    BIGINT UNSIGNED NULL,
  updated_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_divisions_company_code (company_id, code),
  CONSTRAINT fk_divisions_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_divisions_head    FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: departments
-- ============================================================
CREATE TABLE departments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  division_id     BIGINT UNSIGNED NOT NULL,
  parent_dept_id  BIGINT UNSIGNED NULL,
  name            VARCHAR(200)    NOT NULL,
  code            VARCHAR(20)     NOT NULL,
  head_user_id    BIGINT UNSIGNED NULL,
  description     TEXT            NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_by      BIGINT UNSIGNED NULL,
  updated_by      BIGINT UNSIGNED NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_division_code (division_id, code),
  CONSTRAINT fk_departments_division    FOREIGN KEY (division_id)    REFERENCES divisions(id),
  CONSTRAINT fk_departments_parent      FOREIGN KEY (parent_dept_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_departments_head        FOREIGN KEY (head_user_id)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: branches
-- ============================================================
CREATE TABLE branches (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  division_id   BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(200)    NOT NULL,
  code          VARCHAR(20)     NOT NULL,
  city          VARCHAR(100)    NOT NULL,
  address       TEXT            NULL,
  phone         VARCHAR(30)     NULL,
  email         VARCHAR(200)    NULL,
  pic_user_id   BIGINT UNSIGNED NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_by    BIGINT UNSIGNED NULL,
  updated_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branches_division_code (division_id, code),
  CONSTRAINT fk_branches_division FOREIGN KEY (division_id) REFERENCES divisions(id),
  CONSTRAINT fk_branches_pic      FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ALTER TABLE users — tambah kolom org
-- ============================================================
ALTER TABLE users
  ADD COLUMN branch_id     BIGINT UNSIGNED NULL AFTER role,
  ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER branch_id,
  ADD COLUMN company_id    BIGINT UNSIGNED NULL AFTER department_id,
  ADD COLUMN position_id   BIGINT UNSIGNED NULL AFTER company_id,
  ADD CONSTRAINT fk_users_branch     FOREIGN KEY (branch_id)     REFERENCES branches(id)    ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_company    FOREIGN KEY (company_id)    REFERENCES companies(id)   ON DELETE SET NULL;
```

---

## 10. INDEXES

```sql
-- companies
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- divisions
CREATE INDEX idx_divisions_company_id  ON divisions(company_id);
CREATE INDEX idx_divisions_is_active   ON divisions(is_active);

-- departments
CREATE INDEX idx_departments_division_id    ON departments(division_id);
CREATE INDEX idx_departments_parent_dept_id ON departments(parent_dept_id);
CREATE INDEX idx_departments_is_active      ON departments(is_active);
CREATE INDEX idx_departments_head_user_id   ON departments(head_user_id);

-- branches
CREATE INDEX idx_branches_division_id  ON branches(division_id);
CREATE INDEX idx_branches_is_active    ON branches(is_active);
CREATE INDEX idx_branches_city         ON branches(city);

-- users (tambahan)
CREATE INDEX idx_users_branch_id     ON users(branch_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_company_id    ON users(company_id);
```

---

## 11. SCOPE DATA (DATA ISOLATION)

Modul ini adalah fondasi **data scope enforcement** yang berlaku di seluruh sistem.

### 11.1 Scope Rules per Role

| Role | Scope Proyek | Scope Prospek | Scope Laporan |
|---|---|---|---|
| `cabang` | Hanya proyek milik `branch_id` sendiri | Hanya prospek milik `branch_id` sendiri | Hanya data cabang sendiri |
| `pm` | Semua proyek semua cabang | Semua prospek semua cabang | Semua data |
| `department` | Semua proyek (read; aksi LPHS hanya dept sendiri) | — | — |
| `management` | Semua proyek | — | Semua data |
| `admin` | Semua entitas | Semua entitas | Semua data |

### 11.2 Implementasi Scope di Backend

Setiap API query yang mengembalikan data proyek/prospek harus menambahkan WHERE clause otomatis berdasarkan role user dari JWT token:

```php
// Pseudocode backend
if ($user->role === 'cabang') {
    $query->where('branch_id', $user->branch_id);
}
if ($user->role === 'department') {
    // Untuk LPHS: filter proyek yang melibatkan dept ini
    $query->whereHas('lphs_departments', fn($q) => $q->where('department_id', $user->department_id));
}
// PM, Management, Admin: tidak ada filter tambahan
```

---

## 12. AUDIT TRAIL

Semua operasi CRUD pada entitas hierarki dicatat di tabel `audit_logs`:

| Event | Actor | Payload |
|---|---|---|
| company.created | Admin | `{ after: company_data }` |
| company.updated | Admin | `{ before: old_data, after: new_data }` |
| company.deactivated | Admin | `{ before: {is_active:1}, after: {is_active:0}, cascade_count: N }` |
| division.created | Admin | `{ after: division_data }` |
| branch.created | Admin | `{ after: branch_data }` |
| branch.deactivated | Admin | `{ before: ..., cascade_users: [...user_ids] }` |
| ... | ... | ... |

---

## 13. MIGRATION GUIDE (dari PRD v1.0)

Langkah-langkah migrasi dari kondisi PRD v1.0 (tidak ada entitas organisasi) ke struktur baru:

### Step 1: Buat Tabel Baru
Jalankan DDL di Section 9 untuk membuat tabel `companies`, `divisions`, `departments`, `branches`.

### Step 2: Migrasi Departemen yang Sudah Ada
Jika `master_departments` sudah ada di PRD v1.0, migrate datanya:
```sql
-- Buat company default terlebih dahulu
INSERT INTO companies (name, code) VALUES ('PT. [Nama Perusahaan]', 'MAIN');

-- Buat division default
INSERT INTO divisions (company_id, name, code) VALUES (1, 'Divisi Utama', 'MAIN');

-- Migrasi departemen dari tabel lama
INSERT INTO departments (division_id, name, code)
SELECT 1, name, UPPER(SUBSTRING(name, 1, 6))
FROM master_departments WHERE is_active = 1;
```

### Step 3: Buat Branch dari Data User yang Ada
```sql
-- Ekstrak unique branch names dari users
-- Insert ke tabel branches
-- Update users.branch_id dengan FK yang sesuai
```

### Step 4: Alter Tabel Users
Jalankan ALTER TABLE di Section 9 untuk menambah FK columns.

### Step 5: Backfill Data User
Update `branch_id` dan `department_id` pada setiap user berdasarkan nilai string `branch`/`department` yang ada.

---

## 14. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-ORG-01 | Admin buat perusahaan baru dengan kode unik | Berhasil; muncul di tree |
| TC-ORG-02 | Admin buat divisi dengan kode yang sudah ada di perusahaan yang sama | Error 422: "Kode divisi sudah digunakan" |
| TC-ORG-03 | Admin buat cabang dengan divisi yang nonaktif sebagai parent | Error: "Divisi induk tidak aktif" |
| TC-ORG-04 | Admin nonaktifkan divisi yang memiliki 3 cabang dan 15 user | Warning tampil dengan count; setelah konfirmasi, semua nonaktif |
| TC-ORG-05 | Cabang di bawah divisi nonaktif mencoba buat proyek | Error 403 / proyek tidak bisa dibuat |
| TC-ORG-06 | User dengan role=cabang hanya melihat proyek milik cabangnya | Proyek cabang lain tidak muncul |
| TC-ORG-07 | Admin aktifkan kembali cabang yang dinonaktifkan | Cabang aktif; user yang dinonaktifkan karena cascade tidak otomatis aktif kembali |
| TC-ORG-08 | Kepala departemen dinonaktifkan → head_user_id menjadi NULL | Approval routing fallback ke backup approver dari config |
| TC-ORG-09 | Buat sub-departemen dengan parent_dept_id yang valid | Berhasil; muncul di tree sebagai anak departemen |
| TC-ORG-10 | GET /api/config/org/tree mengembalikan struktur lengkap | Full tree dalam satu response; nested JSON |

---

## 15. RELATED DOCUMENTS

| Dokumen | Relasi |
|---|---|
| 016 — Position Management | Mendefinisikan posisi/jabatan yang terhubung ke hierarki organisasi |
| 017 — Role & Permission Module | Scope data enforcement berdasarkan branch_id/department_id |
| 018 — User Management Module | CRUD user dengan assignment branch/dept |
| 027 — Config Organization & Workflow | UI konfigurasi hierarki (CFG-01) |
| 039 — Approval Engine Core | Approval berbasis posisi, bukan username |
| 053 — Full ERD | Diagram relasi lengkap semua entitas |

**Gap Resolution:** GAP-05 ✓ | CFG-01 ✓ | MD-01 ✓ | MD-02 ✓ | MD-03 ✓
