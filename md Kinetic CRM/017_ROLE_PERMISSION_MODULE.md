# 017 — ROLE & PERMISSION MODULE
## KINETIC CRM — Modul Role & Permission Dinamis

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 017 |
| **Nama Dokumen** | Role & Permission Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.2 (CFG-04), D.2 |
| **Gap Resolution** | GAP-02, CFG-04 |
| **Status** | Final |

---

## 1. PURPOSE & BUSINESS CONTEXT

PRD v1.0 mendefinisikan role sebagai **enum hardcode** (`cabang|pm|dept|mgmt|admin`) di source code. Ini berarti menambah role baru (mis: Direktur Regional, Auditor Internal) memerlukan deployment ulang aplikasi.

Modul ini mendefinisikan **role sebagai entitas DB yang dapat dikonfigurasi** dan **permission matrix yang bisa diubah** oleh Admin tanpa coding, menyelesaikan **CFG-04** dan sebagian **GAP-02**.

---

## 2. CORE CONCEPTS

### 2.1 Role vs Permission

- **Role** = kumpulan permission yang dibundel bersama dan di-assign ke user. Contoh: `pm`, `cabang`, `admin`.
- **Permission** = hak akses granular ke satu resource + satu aksi. Contoh: `projects.create`, `reports.export`.
- **Scope** = batasan data yang berlaku bersama permission. Contoh: `own_branch` (hanya data cabangnya), `all` (semua data).

### 2.2 Permission Naming Convention

Format: `{resource}.{action}`

| Resource | Aksi | Contoh Permission |
|---|---|---|
| `prospects` | create, read, update, delete, submit, approve, revise | `prospects.create` |
| `projects` | create, read, update, cancel | `projects.cancel` |
| `projects.rks` | submit, approve, revise | `projects.rks.approve` |
| `projects.lphs` | submit, approve, revise | `projects.lphs.approve` |
| `projects.harga` | update | `projects.harga.update` |
| `projects.pemenang` | update | `projects.pemenang.update` |
| `reports` | read, export | `reports.export` |
| `master.*` | read, create, update, deactivate | `master.customers.create` |
| `config.*` | read, update | `config.org.update` |
| `admin.users` | create, read, update, deactivate | `admin.users.create` |
| `admin.audit` | read, export | `admin.audit.export` |
| `notifications` | read, mark_read | `notifications.read` |
| `dashboard` | read | `dashboard.read` |

---

## 3. ENTITY DEFINITIONS

### 3.1 Entity: Role

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Nama role (tampil ke user) |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode sistem (lowercase_underscore) |
| `description` | TEXT | NULL | |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 0 | 1 = role bawaan tidak bisa dihapus |
| `data_scope` | ENUM('own_branch','own_dept','all') | NOT NULL DEFAULT 'all' | Scope data default untuk role ini |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 3.2 Entity: Permission

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE | Kode permission (format resource.action) |
| `name` | VARCHAR(200) | NOT NULL | Nama deskriptif |
| `module` | VARCHAR(50) | NOT NULL | Modul/grup untuk UI matrix (prospects, projects, dll.) |
| `description` | TEXT | NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 3.3 Entity: RolePermission (pivot)

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `role_id` | BIGINT UNSIGNED | NOT NULL, FK → roles.id | |
| `permission_id` | BIGINT UNSIGNED | NOT NULL, FK → permissions.id | |
| `scope_override` | ENUM('own_branch','own_dept','all') | NULL | Override scope untuk permission ini; jika NULL pakai data_scope dari role |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(role_id, permission_id)`

---

## 4. DEFAULT ROLES & PERMISSION MATRIX

### 4.1 Default Roles (System Roles)

| Code | Name | data_scope | is_system |
|---|---|---|---|
| `admin` | Administrator | all | 1 |
| `management` | Management | all | 1 |
| `pm` | Project Manager | all | 1 |
| `department` | Reviewer Departemen | own_dept | 1 |
| `cabang` | Staf Cabang | own_branch | 1 |

### 4.2 Permission Matrix per Role

**Legend:** ✓ = diizinkan | — = tidak diizinkan | (scope) = diizinkan dengan scope tertentu

| Permission | Cabang | PM | Dept | Mgmt | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| **DASHBOARD** | | | | | |
| dashboard.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| **PROSPEK** | | | | | |
| prospects.create | ✓ | — | — | — | ✓ |
| prospects.read | (own) | ✓ | — | — | ✓ |
| prospects.update | (own+draft) | — | — | — | ✓ |
| prospects.delete | (own+draft) | — | — | — | ✓ |
| prospects.submit | (own) | — | — | — | ✓ |
| prospects.approve | — | ✓ | — | — | ✓ |
| prospects.revise | — | ✓ | — | — | ✓ |
| prospects.answer_revision | (own) | — | — | — | ✓ |
| prospects.convert_to_project | (own+approved) | — | — | — | ✓ |
| **PROYEK** | | | | | |
| projects.create | ✓ | — | — | — | ✓ |
| projects.read | (own) | ✓ | ✓ | ✓ | ✓ |
| projects.cancel | — | ✓ | — | — | ✓ |
| projects.rks.submit | (own) | — | — | — | ✓ |
| projects.rks.approve | — | ✓ | — | — | ✓ |
| projects.rks.revise | — | ✓ | — | — | ✓ |
| projects.lphs.submit | (own) | — | — | — | ✓ |
| projects.lphs.approve_pm | — | ✓ | — | — | ✓ |
| projects.lphs.approve_dept | — | — | ✓ | — | ✓ |
| projects.lphs.approve_mgmt | — | — | — | ✓ | ✓ |
| projects.lphs.revise | — | ✓ | ✓ | ✓ | ✓ |
| projects.harga.update | (own) | — | — | — | ✓ |
| projects.pemenang.update | (own) | — | — | — | ✓ |
| projects.delivery.update | (own) | — | — | — | ✓ |
| projects.documents.upload | ✓ | ✓ | ✓ | ✓ | ✓ |
| projects.documents.download | ✓ | ✓ | ✓ | ✓ | ✓ |
| **APPROVAL INBOX** | | | | | |
| approvals.read | — | ✓ | ✓ | ✓ | ✓ |
| approvals.action | — | ✓ | ✓ | ✓ | ✓ |
| approvals.reassign | — | — | — | — | ✓ |
| **LAPORAN** | | | | | |
| reports.read | — | — | — | ✓ | ✓ |
| reports.export | — | — | — | ✓ | ✓ |
| **MASTER DATA** | | | | | |
| master.customers.read | — | — | — | — | ✓ |
| master.customers.create | — | — | — | — | ✓ |
| master.customers.update | — | — | — | — | ✓ |
| master.departments.read | — | ✓ | — | — | ✓ |
| master.questions.read | ✓ | — | — | — | ✓ |
| master.competitors.read | — | — | — | — | ✓ |
| master.competitors.create | — | — | — | — | ✓ |
| **KONFIGURASI (Admin Only)** | | | | | |
| config.org.read | — | — | — | — | ✓ |
| config.org.update | — | — | — | — | ✓ |
| config.workflow.read | — | — | — | — | ✓ |
| config.workflow.update | — | — | — | — | ✓ |
| config.sla.update | — | — | — | — | ✓ |
| config.roles.read | — | — | — | — | ✓ |
| config.roles.update | — | — | — | — | ✓ |
| **ADMIN** | | | | | |
| admin.users.create | — | — | — | — | ✓ |
| admin.users.read | — | — | — | — | ✓ |
| admin.users.update | — | — | — | — | ✓ |
| admin.users.deactivate | — | — | — | — | ✓ |
| admin.users.reset_password | — | — | — | — | ✓ |
| admin.audit.read | — | — | — | — | ✓ |
| admin.audit.export | — | — | — | — | ✓ |
| **NOTIFIKASI** | | | | | |
| notifications.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| notifications.mark_read | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 5. PERMISSION CHECKING LOGIC

### 5.1 Alur Pengecekan Permission

```
Request masuk
  → Extract user_id dari JWT token
  → Load user.role_id dari cache (Redis) atau DB
  → Query role_permissions WHERE role_id = user.role_id
  → Cek apakah permission_code ada dalam list
  → Jika ada: cek scope_override atau role.data_scope
  → Apply scope ke query (tambah WHERE clause)
  → Lanjutkan request
```

### 5.2 Scope Resolution

```
Jika role_permission.scope_override IS NOT NULL
  → Gunakan scope_override
Else
  → Gunakan roles.data_scope

Scope 'own_branch':
  → Tambah WHERE branch_id = auth.user.branch_id ke semua query resource

Scope 'own_dept':
  → Tambah WHERE department_id = auth.user.department_id

Scope 'all':
  → Tidak ada filter tambahan
```

### 5.3 Special Cases

- **Admin**: selalu melewati permission check (bypass); memiliki semua akses
- **projects.lphs.approve_dept**: scope implisit own_dept — user hanya bisa approve LPHS untuk departemennya sendiri
- **projects.documents.upload**: diizinkan semua role yang punya akses ke proyek tersebut; scope mengikuti akses proyek

---

## 6. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/roles | Admin | List semua role |
| POST | /api/config/roles | Admin | Buat role baru (non-system) |
| GET | /api/config/roles/:id | Admin | Detail role + permissions |
| PUT | /api/config/roles/:id | Admin | Update role (non-system) |
| PUT | /api/config/roles/:id/deactivate | Admin | Nonaktifkan role |
| GET | /api/config/permissions | Admin | List semua permission yang tersedia |
| GET | /api/config/roles/:id/permissions | Admin | Permissions yang di-assign ke role ini |
| PUT | /api/config/roles/:id/permissions | Admin | Bulk update permissions untuk role (replace all) |
| GET | /api/config/permission-matrix | Admin | Seluruh matrix role × permission dalam satu response (untuk UI matrix) |
| PUT | /api/config/permission-matrix | Admin | Bulk save seluruh matrix |

### 6.1 Response: Permission Matrix

```json
GET /api/config/permission-matrix
{
  "roles": [
    { "id": 1, "code": "cabang", "name": "Staf Cabang" },
    { "id": 2, "code": "pm", "name": "Project Manager" }
  ],
  "permissions": [
    { "id": 1, "code": "prospects.create", "module": "prospects", "name": "Buat Prospek" },
    { "id": 2, "code": "prospects.read", "module": "prospects", "name": "Lihat Prospek" }
  ],
  "matrix": {
    "1": [1, 2, 4, 5],
    "2": [2, 6, 7, 8, 9]
  }
}
```

---

## 7. DATABASE SCHEMA (DDL)

```sql
-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE roles (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL,
  code        VARCHAR(50)     NOT NULL,
  description TEXT            NULL,
  is_system   TINYINT(1)      NOT NULL DEFAULT 0,
  data_scope  ENUM('own_branch','own_dept','all') NOT NULL DEFAULT 'all',
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: permissions
-- ============================================================
CREATE TABLE permissions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(100)    NOT NULL,
  name        VARCHAR(200)    NOT NULL,
  module      VARCHAR(50)     NOT NULL,
  description TEXT            NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code),
  KEY idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: role_permissions
-- ============================================================
CREATE TABLE role_permissions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id        BIGINT UNSIGNED NOT NULL,
  permission_id  BIGINT UNSIGNED NOT NULL,
  scope_override ENUM('own_branch','own_dept','all') NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_permission (role_id, permission_id),
  CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Alter users table: add role_id FK
-- ============================================================
ALTER TABLE users
  ADD COLUMN role_id BIGINT UNSIGNED NOT NULL AFTER role,
  ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Backfill role_id dari field role string yang sudah ada
UPDATE users u
JOIN roles r ON r.code = u.role
SET u.role_id = r.id;
```

---

## 8. CACHING STRATEGY

Permission matrix di-cache per user untuk menghindari query DB pada setiap request:

```
Cache key: "user_permissions:{user_id}"
Cache value: JSON array of permission codes yang dimiliki user
TTL: 15 menit
Invalidate: saat role user diubah atau permission matrix role diubah
```

---

## 9. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-ROLE-01 | Role system (`is_system = 1`) tidak bisa dihapus atau diubah kodenya |
| BR-ROLE-02 | Role `admin` selalu memiliki semua permission dan tidak bisa dicabut melalui matrix UI |
| BR-ROLE-03 | Perubahan permission matrix berlaku setelah cache TTL habis atau user login ulang |
| BR-ROLE-04 | User yang rolenya diubah harus melakukan re-login agar permission baru berlaku |
| BR-ROLE-05 | Setiap perubahan permission matrix dicatat di audit log |
| BR-ROLE-06 | Role baru yang dibuat Admin dimulai tanpa permission; Admin harus assign secara manual |

---

## 10. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-ROLE-01 | Admin buat role baru "Auditor" | Role tersimpan; belum ada permission |
| TC-ROLE-02 | Admin assign permission reports.read ke role Auditor | Permission tersimpan; role Auditor bisa akses /reports |
| TC-ROLE-03 | User dengan role Cabang coba akses /reports | HTTP 403 Forbidden |
| TC-ROLE-04 | Admin coba hapus role system "admin" | Error: "Role sistem tidak dapat dihapus" |
| TC-ROLE-05 | Cabang mencoba approve RKS (tidak punya permission) | HTTP 403; pesan "Akses ditolak" |
| TC-ROLE-06 | Permission matrix diubah; user role terkait belum re-login | Masih menggunakan permission lama (cache); setelah re-login/TTL habis: permission baru berlaku |

---

## 11. RELATED DOCUMENTS

| Dokumen | Relasi |
|---|---|
| 019 — Authentication Session | JWT token menyimpan role_id |
| 020 — Authorization Enforcement Spec | Implementasi teknis pengecekan permission |
| 027 — Config Organization & Workflow | CFG-04 UI untuk permission matrix |

**Gap Resolution:** GAP-02 ✓ (role hardcode) | CFG-04 ✓
