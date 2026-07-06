# 📋 Riset Arsitektur Permission untuk Kinetic CRM Multi-Department — v2.1

> **Tanggal:** 2026-07-02
> **Versi:** 2.1 — Menambahkan Owner User ID, skip multi-department switcher untuk MVP, Supervisor Marketing layer
> **Metode:** Deep Research — 5 search angles, 15+ sources fetched, adversarial verification (3-vote)
> **Tech Stack:** Node.js + React + MySQL

---

## 📑 Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Sumber Riset](#2-sumber-riset)
3. [Analisis Problem Domain](#3-analisis-problem-domain)
4. [Rekomendasi Arsitektur](#4-rekomendasi-arsitektur)
5. [Workflow Ownership](#5-workflow-ownership)
6. [Otoritas PM & Project Membership](#6-otoritas-pm--project-membership)
7. [Edge Cases](#7-edge-cases)
8. [Owner User ID — Isolasi Data Per User dalam 1 Department](#8-owner-user-id--isolasi-data-per-user-dalam-1-department)
9. [Database Schema Lengkap](#9-database-schema-lengkap)
10. [Pola Authorization Middleware](#10-pola-authorization-middleware)
11. [Query Pattern untuk Isolasi Data](#11-query-pattern-untuk-isolasi-data)
12. [Case Studies: Semua Skenario](#12-case-studies-semua-skenario)
13. [Yang Tidak Direkomendasikan + Alasannya](#13-yang-tidak-direkomendasikan--alasannya)
14. [Rekomendasi Library](#14-rekomendasi-library)
15. [Checklist Final MVP](#15-checklist-final-mvp)
16. [Roadmap Implementasi](#16-roadmap-implementasi)
17. [Daftar Sumber](#17-daftar-sumber)

---

## 1. Ringkasan Eksekutif

**Pertanyaan:** CRM multi-department (IT, HC, Finance, Procurement, Marketing, PM, dll), bagaimana arsitektur permission-nya?

**Jawaban: RBAC with Domains (Department-Scoped Roles) + Additive Multi-Role + Base Permissions + Workflow-based Access**

| Problem | Solusi | Mekanisme |
|---------|--------|-----------|
| **Isolasi data antar department** | Domain-scoped RBAC | Role name tetap (`staff`), scope = `dept_it` / `dept_hc` — permission cuma berlaku di scope itu |
| **Role explosion** | 1 role "Staff" dipakai ulang | N department × 3 role = **3 role**, bukan N×3 |
| **Cross-department project** | Additive multi-role + Project scope | User punya role di department-nya + role tambahan di scope project |
| **Fitur lintas role** | Unscoped base permissions | Policy tanpa scope — berlaku untuk SEMUA user |
| **Workflow transisi** | Stage-based access + stage_id binding | Previous stage = read-only, current stage = read-write |
| **User multi-department** | SKIP untuk MVP — cukup `department_id` primer; akses lintas via `project_members` | Phase 2+ nanti |

**Verdict setelah verifikasi adversarial:**
- ✅ TIDAK perlu ABAC
- ✅ TIDAK perlu ReBAC/Zanzibar
- ✅ TIDAK perlu role per-department
- ✅ Cukup RBAC + Domain Scoping + Additive Roles + Stage-based Access

---

## 2. Sumber Riset

### 2.1. Primary Sources (Official Documentation)

| Sumber | URL | Kredibilitas |
|--------|-----|--------------|
| **NIST RBAC Standard** (ANSI/INCITS 359-2012) | https://csrc.nist.gov/projects/role-based-access-control | ⭐⭐⭐⭐⭐ Standar resmi pemerintah AS |
| **Casbin** (Apache Foundation) | https://casbin.org + https://casbin.apache.org/docs/rbac-with-domains | ⭐⭐⭐⭐⭐ 20k+ GitHub stars, production-grade |
| **Cerbos** | https://docs.cerbos.dev/cerbos/latest/policies/scoped_policies.html | ⭐⭐⭐⭐⭐ Policy engine production |
| **Auth0 RBAC** | https://auth0.com/docs/manage-users/access-control/rbac | ⭐⭐⭐⭐ Platform identity enterprise |
| **Ory Keto** (Zanzibar/ReBAC) | https://github.com/ory/keto | ⭐⭐⭐⭐ Tapi enterprise license untuk multi-tenancy |
| **Okta RBAC Whitepaper** | https://www.okta.com/resources/whitepaper/role-based-access-control-rbac/ | ⭐⭐⭐⭐ Best practices dari identity platform |
| **PostgreSQL RLS** | https://www.postgresql.org/docs/current/ddl-rowsecurity.html | ⭐⭐⭐⭐ Dokumentasi resmi |

### 2.2. Secondary / Analysis Sources

| Sumber | URL | Topik |
|--------|-----|-------|
| **Evolveum Docs** | https://docs.evolveum.com/iam/iga/rbac/role-explosion/ | Role explosion analysis |
| **hoop.dev** | https://hoop.dev/blog/preventing-large-scale-role-explosion-with-domain-based-resource-separation | Domain-based separation |
| **Permit.io** | https://www.permit.io/blog/rbac-vs-abac | RBAC vs ABAC comparison |
| **Permify** | https://permify.co/post/role-explosion/ | Hidden cost of RBAC |
| **Tools4ever** | https://www.tools4ever.co.uk/blog/2024/smart-rbac-prevent-role-explosion/ | Smart RBAC: prevent explosion |
| **Wikipedia RBAC** | https://en.wikipedia.org/wiki/Role-based_access_control | Definisi standar |
| **Kuhn, Coyne & Weil (2010)** | IEEE Computer 43(6): 79-81 | "Adding Attributes to RBAC" |

---

## 3. Analisis Problem Domain

### 3.1. Kenapa Role Per-Department Itu Bahaya (Role Explosion)

Riset dari Evolveum dan hoop.dev mengkonfirmasi:

> *"Organization with a thousand employees can easily end up with few of thousands of roles."* — Evolveum Docs

**Mekanisme explosion:**
```
Dept A × Role Staff × Fitur X = dept_a_staff_fitur_x
Dept A × Role Staff × Fitur Y = dept_a_staff_fitur_y
Dept B × Role Staff × Fitur X = dept_b_staff_fitur_x
...
```

Rumusnya: **Jumlah Role = Jumlah Department × Jumlah Role Level × Jumlah Fitur Unik**

Kalau Anda punya 7 department, 3 level role, dan 20 fitur yang beda tiap department:
- Tanpa scoping: **7 × 3 × 20 = 420 role** 💀
- Dengan scoping: **3 role** (staff, manager, admin)

### 3.2. Kenapa Hierarchical RBAC Saja Tidak Cukup

**Hasil verifikasi adversarial (3 vote, 2:1 refuted):**

Klaim "role hierarchies solve role explosion" telah di-refute oleh 2 dari 3 verifier independent. Argumen:

1. **NIST authors sendiri (Kuhn, Coyne & Weil 2010)** membuktikan RBAC dengan hierarchy tetap menghasilkan combinatorial role explosion ketika akses multi-dimensi (department × function × project).
2. **Hierarki bersifat linear** (child inherits from parent) — tidak bisa memodelkan matrix-style access patterns.
3. **Cross-department permission combinations** (Dept-A viewer + Project-B editor + Dept-C manager) tidak bisa dicapture oleh single hierarchy.

**Solusi sebenarnya: Domain-scoped roles + Additive multi-role**, bukan hierarchy saja.

### 3.3. Matriks Permasalahan vs Solusi

| Dimensi | Masalah | Root Cause | Solusi Terverifikasi |
|---------|---------|------------|---------------------|
| **Department** | Data IT bocor ke HC | Tidak ada isolasi scope | Domain-scoped RBAC |
| **Role count** | 7 dept × 3 role × 20 fitur = 420 role | Kombinasi dimensional | Role reusable + scope parameter |
| **Cross-project** | Project A libatkan IT+HC+Finance | Akses kaku per department | Additive multi-role assignment |
| **Global features** | Dashboard/notifikasi harus config ulang tiap dept | Role siloed | Global base permissions |
| **Tambah department** | Harus bikin role baru semua | Tidak ada parameterisasi | Tinggal assign existing role di scope baru |
| **Tambah fitur** | Harus update semua role | Permission hardcode per role | Cukup tambah di permission list + assign ke role yang perlu |
| **Workflow transisi** | Data bocor/missed di stage perpindahan | Tidak ada stage-based access | Stage_id binding + read/write per stage |
| **User multi-dept** | User di 2 department bingung | Tidak ada active context | active_department_id di session |
| **Reporting lintas dept** | Director perlu lihat semua | Override mekanisme tidak jelas | Role `director` + bypass department filter |

---

## 4. Rekomendasi Arsitektur

### 4.1. Core Model: 3 Layer Permission

```
┌─────────────────────────────────────────────────────┐
│                LAYER 3: BASE/GLOBAL                  │
│   Dashboard.view, Notification.read, Profile.manage  │
│   └── Berlaku untuk SEMUA user tanpa terkecuali      │
├─────────────────────────────────────────────────────┤
│                LAYER 2: DEPARTMENT                    │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│   │  Scope   │  │  Scope   │  │  Scope   │          │
│   │  dept_it │  │ dept_hc  │  │ dept_fin │  ...     │
│   ├──────────┤  ├──────────┤  ├──────────┤          │
│   │ staff    │  │ staff    │  │ staff    │          │
│   │ manager  │  │ manager  │  │ manager  │          │
│   │ admin    │  │ admin    │  │ admin    │          │
│   └──────────┘  └──────────┘  └──────────┘          │
│   Role names SAMA, permission BEDA per scope         │
├─────────────────────────────────────────────────────┤
│                LAYER 1: PROJECT (CROSS-DEPT)          │
│   ┌──────────────────────────────────────────────┐   │
│   │  Scope: project_alpha                         │   │
│   │  User dari IT + HC + Finance                 │   │
│   │  Role: project_viewer / project_contributor   │   │
│   │  Hanya akses data yang relevan ke project     │   │
│   └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 4.2. Struktur Data Permission

**Permission codes (naming convention):**
```
<domain>:<entity>:<action>
contoh: project:project:read, procurement:pengadaan:create
```

Untuk workflow stage:
```
<domain>:<entity>:<action>:<stage_code>
contoh: prospect:write:prospecting, prospect:approve:transition
```

**Prinsip additive** (dari Auth0 & Casbin):
- User dengan multiple roles mendapat **union** dari semua permission
- Tidak ada deny/subtractive — permission cuma bisa ditambah, tidak dikurangi
- Overlapping assignment **tidak masalah**

### 4.3. Parameterisasi Role vs Static Role

**❌ Yang SALAH:**
```
it_staff, it_manager, it_admin
hc_staff, hc_manager, hc_admin
finance_staff, finance_manager, finance_admin
```

**✅ Yang BENAR:**
```
Role: staff    → scope: it | hc | finance | procurement
Role: manager  → scope: it | hc | finance | procurement
Role: admin    → scope: it | hc | finance | procurement
```

Jumlah role **tetap 3**, jumlah department bisa scalable sampai puluhan tanpa tambah role.

---

## 5. Workflow Ownership

### 5.1. Alur Bisnis

```
Prospek (Marketing) 
    → Waiting PM (transisi) 
    → Project (PM) 
    → Pengadaan (Procurement) 
    → Delivery (PM)
```

**Prinsip akses per stage:**

| Stage | Owner | Read Access | Write Access |
|-------|-------|-------------|--------------|
| `prospecting` | Marketing | Marketing, PM (view) | Marketing |
| `waiting_pm` | PM (transisi) | Marketing (read-only), PM | PM (approve/reject) |
| `in_project` | PM | Marketing (read-only), PM, related depts | PM |
| `pengadaan` | Procurement | PM (read-only), Procurement | Procurement |
| `delivery` | PM | Procurement (read-only), PM | PM |

### 5.2. Tabel Workflow Stages

```sql
-- Definisi stage (statis)
CREATE TABLE workflow_stages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,  
  -- 'prospecting', 'waiting_pm', 'in_project', 'pengadaan', 'delivery'
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,       -- 'prospect', 'project', 'pengadaan'
  sequence INT NOT NULL,             -- urutan
  owner_department_code VARCHAR(20) NOT NULL -- department yang pegang stage ini
);

INSERT INTO workflow_stages (code, name, module, sequence, owner_department_code) VALUES
('prospecting',     'Prospecting',      'prospect',  1,    'marketing'),
('supervisor_review','Supervisor Review','prospect',  1.5,  'marketing'), -- OPSIONAL
('waiting_pm',      'Waiting PM',       'prospect',  2,    'pm'),
('in_project',      'In Project',       'project',   3,    'pm'),
('pengadaan',       'Pengadaan',        'pengadaan', 4,    'procurement'),
('delivery',        'Delivery',         'project',   5,    'pm');

> **Catatan:** Jika struktur organisasi Anda memiliki layer Supervisor Marketing sebelum masuk ke PM, aktifkan baris `supervisor_review`. Tabel `workflow_stages` dirancang agar fleksibel — nambah/reduce stage tidak perlu ubah kode, cukup seed data.

### 5.3. Implementasi Stage-based Access

```javascript
function getStageAccess(user, record) {
  const stage = record.currentStageCode;  -- dari current_stage_id → join ke workflow_stages
  const userDeptCode = user.department_code;
  
  const accessRules = {
    'prospecting':  { owner: 'marketing',    prev: null },
    'waiting_pm':   { owner: 'pm',           prev: 'marketing' },
    'in_project':   { owner: 'pm',           prev: 'marketing' },
    'pengadaan':    { owner: 'procurement',  prev: 'pm' },
    'delivery':     { owner: 'pm',           prev: 'procurement' },
  };
  
  const rule = accessRules[stage];
  if (!rule) return 'none';
  
  // Owner department → full access (write)
  if (userDeptCode === rule.owner) return 'write';
  
  // Previous department → read-only
  if (rule.prev && userDeptCode === rule.prev) return 'read';
  
  return 'none';
}
```

### 5.4. Permission + Stage Binding

Supaya lebih presisi, permission bisa dibind ke stage tertentu:

```sql
-- Di role_permissions, tambah stage binding (optional)
ALTER TABLE role_permissions 
  ADD COLUMN stage_id INT NULL,
  ADD COLUMN access_level ENUM('read', 'write') DEFAULT 'write';
```

Atau lebih praktis: **buat permission terpisah**:

```sql
INSERT INTO permissions (code, name, module) VALUES
-- Read — berlaku di semua stage
('prospect:read', 'Read Prospect', 'prospect'),
-- Write — terbatas per stage
('prospect:write:prospecting', 'Edit Prospect (Prospecting)', 'prospect'),
('prospect:approve:transition', 'Approve transisi ke next stage', 'prospect');
```

**Siapa dapat permission apa:**

| Role | permission | scope_type |
|------|-----------|------------|
| Marketing Staff | `prospect:read` | department |
| Marketing Staff | `prospect:write:prospecting` | department |
| Marketing Staff | `prospect:approve:transition` | department |
| PM Staff | `prospect:read` | department |

Dengan ini, Marketing dan PM sama-sama bisa read prospect, tapi cuma Marketing yang bisa write di stage prospecting. PM bisa write pas sudah di stage `waiting_pm` atau `in_project`.

---

## 6. Otoritas PM & Project Membership

### 6.1. Boundary PM dalam Manage Project

| Aktivitas | Boundary | Implementasi |
|-----------|----------|-------------|
| Nambah member | **Terbatas** ke department yang terdaftar di `project_departments` | Cek `project_departments` dulu |
| Tentukan role member | **Terbatas** ke role project (`project_viewer`, `project_contributor`, `project_manager`) | Role pool khusus project |
| Hapus member | Bisa, tapi **dicatat** siapa yang menghapus | `deleted_by`, `deleted_at` |
| Approval Dept Head | **Tidak perlu untuk MVP** | `approval_status` default `'approved'` |

### 6.2. Validasi Ketika Nambah Member

```javascript
async function addProjectMember(projectId, userId, departmentId, roleId, pmUserId) {
  const db = this.db;

  // 1. Validasi: PM punya akses manage project ini?
  const isPM = await db.query(`
    SELECT 1 FROM project_members 
    WHERE project_id = ? AND user_id = ? AND role_id = (SELECT id FROM roles WHERE name = 'project_manager')
  `, [projectId, pmUserId]);
  if (!isPM) throw new Error('Hanya PM project yang bisa manage members');

  // 2. Validasi: Department terdaftar di project ini?
  const deptInProject = await db.query(`
    SELECT 1 FROM project_departments WHERE project_id = ? AND department_id = ?
  `, [projectId, departmentId]);
  if (!deptInProject) throw new Error('Department tidak terlibat di project ini');

  // 3. Validasi: Role yang diberikan valid untuk project?
  const validProjectRoles = ['project_viewer', 'project_contributor', 'project_manager'];
  const role = await db.query(`SELECT name FROM roles WHERE id = ?`, [roleId]);
  if (!validProjectRoles.includes(role[0]?.name)) {
    throw new Error('Role tidak valid untuk konteks project');
  }

  // 4. Validasi: User beneran dari department itu?
  const user = await db.query(
    `SELECT 1 FROM users WHERE id = ? AND department_id = ?`,
    [userId, departmentId]
  );
  if (!user) throw new Error('User bukan anggota department tersebut');

  // 5. OK — insert (approval_status = 'approved' otomatis untuk MVP)
  await db.query(`
    INSERT INTO project_members (project_id, user_id, role_id, department_id, assigned_by)
    VALUES (?, ?, ?, ?, ?)
  `, [projectId, userId, roleId, departmentId, pmUserId]);
}
```

### 6.3. Struktur Role untuk Project

Role yang bisa diassign PM ke member project:

| Role | Level Akses | Siapa Dapat |
|------|-------------|-------------|
| `project_viewer` | Read-only — lihat data project | Stakeholder, konsultan |
| `project_contributor` | Read + create/edit data di scope project | Staff dari department terkait |
| `project_manager` | Full control termasuk manage member | PM (1-2 orang per project) |

### 6.4. Approval Dept Head (Fitur Nanti)

Untuk sekarang langsung `approved`. Kalau nanti perlu:

```sql
-- Tambah kolom approval (Phase 2+)
ALTER TABLE project_members 
  ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  ADD COLUMN approved_by INT NULL,
  ADD COLUMN approved_at TIMESTAMP NULL;

-- Trigger: email/notifikasi ke Dept Head ketika pending
```

**Kenapa default `'approved'`?** Backward compatible — semua kode lama tetap jalan tanpa perlu update. Kalau nanti approval diaktifkan, tinggal ubah jadi `'pending'`.

---

## 7. Edge Cases

### 7.1. User Pindah Department — Data Lama Ikut atau Tetap?

**Tetap di department lama. Data baru pakai department baru.**

```javascript
// Waktu bikin data: pakai department user SAAT ITU
async function createProspect(userId, data) {
  const user = await getUser(userId);
  
  // Department diambil dari snapshot user — bukan dari "primary department"
  return db.query(
    `INSERT INTO prospects (..., department_id, ...) VALUES (..., ?, ...)`,
    [user.department_id]
  );
}

// Kalau user pindah dari IT ke HC:
//   - Prospek lama: department_id = IT (tetap)
//   - Prospek baru: department_id = HC
//   - User bisa akses IT? Tergantung user_roles:
//     - Kalau user_roles di IT dicabut → tidak bisa akses data IT
//     - Kalau user_roles di IT tetap → masih bisa akses
```

**Rekomendasi saat pindah department:**
1. Tambah user_role baru di department tujuan
2. Hapus/expire user_role di department lama (kalau perlu)
3. Data historis tetap utuh

### 7.2. User Punya 2 Department — Mekanisme Switch? ⚠️ SKIP UNTUK MVP

Dengan arsitektur `user_roles`, secara teknis sudah didukung:

```sql
-- Alice: staff di IT DAN staff di Finance (merangkap)
INSERT INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES
(1, 1, 'department', 1),   -- Alice: staff di IT
(1, 1, 'department', 3);   -- Alice: staff di Finance
```

**⚠️ Namun fitur ini DISARANKAN SKIP untuk MVP.**

Alasan:
- Sebagian besar user hanya berada di 1 department
- UI switcher + session management + context-aware queries = kompleksitas tambahan
- User yang merangkap (manajer IT merangkap PM project lintas department) sudah di-cover oleh **project membership**, bukan switcher

**Untuk MVP:**
- `user_roles` tetap pakai struktur dengan scope_type — tidak diubah
- Tabel `users` **tidak perlu** kolom `active_department_id`
- Session cukup pakai `req.user.department_id` (department primer)
- User yang butuh akses lintas department via `project_members` + scope_type='project'

**Nanti (Phase 2+):**
- Tambah kolom `active_department_id` di users
- Implementasi switcher UI
- Migration: semua query ganti dari `req.user.department_id` ke `req.activeDepartmentId`

### 7.3. Dokumen Lintas Department di Project — Siapa Pemilik?

**Owning_department_id = department yang meng-upload/membuat dokumen itu.**

```sql
INSERT INTO project_data (project_id, owning_department_id, is_visible_to_all_depts, ...)
VALUES (1, 4, false, ...);  
-- Dokumen ini milik Procurement (dept_id=4), tidak visible otomatis ke dept lain
```

**Visibility granular:**

| Kebutuhan | Solusi |
|-----------|--------|
| Dokumen Procurement cuma untuk Procurement | `is_visible_to_all_depts = false` |
| Dokumen Procurement bisa dilihat IT dan PM | `is_visible_to_all_depts = true` |
| Dokumen Procurement cuma untuk PM, tidak untuk IT | Tabel `project_data_visibility` |

```sql
-- Untuk visibility yang lebih granular (optional)
CREATE TABLE project_data_visibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_data_id INT NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (project_data_id) REFERENCES project_data(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY (project_data_id, department_id)
);

-- Contoh: dokumen procurement cuma bisa diakses PM (department=pm)
INSERT INTO project_data_visibility (project_data_id, department_id) VALUES (1, 5);
```

Untuk MVP, cukup `is_visible_to_all_depts`. Tabel visibility tambahan kalau sudah ada kebutuhan yang lebih spesifik.

### 7.4. Reporting Lintas Department — Butuh Role Khusus?

**Ya, cukup 1 role `director` + bypass department filter.**

```sql
-- Role khusus director
INSERT INTO roles (name, description, is_system) VALUES
('director', ' bisa lihat semua department — bypass department filter', true);

-- Assign ke user (scope global = lihat semua)
INSERT INTO user_roles (user_id, role_id, scope_type) VALUES
(5, 7, 'global');
```

**Implementasi bypass di AuthorizationEngine:**

```javascript
async function hasPermission(userId, permissionCode, context) {
  // Step 1: Cek BASE/GLOBAL permissions
  const hasGlobal = await this.checkGlobalPermission(permissionCode);
  if (hasGlobal) return true;

  // Step 1.5: Cek director bypass
  const isDirector = await this.checkDirectorBypass(userId, permissionCode);
  if (isDirector) return true;

  // Step 2: Kumpulkan SEMUA role user di semua scope
  const userRoles = await this.getUserRoles(userId);
  
  // Step 3: Cek satu per satu
  for (const ur of userRoles) {
    const permitted = await this.checkRolePermission(...);
    if (permitted) return true;
  }
  return false;
}

async function checkDirectorBypass(userId, permissionCode) {
  const [result] = await this.db.query(`
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? 
      AND r.name = 'director' 
      AND ur.scope_type = 'global'
    LIMIT 1
  `, [userId]);
  return result.length > 0;
}
```

**Tidak perlu field `is_director` di tabel users** — cukup role assignment. Ini lebih fleksibel (bisa punya banyak director tanpa ubah struktur tabel users) dan konsisten dengan arsitektur RBAC yang sudah dirancang.

---

## 8. Owner User ID — Isolasi Data Per User dalam 1 Department

### 8.1. Problem

Arsitektur yang dirancang sejauh ini mengisolasi data **antar department** — Staff IT tidak bisa lihat data HC. Tapi di **dalam 1 department** (misal Marketing dengan 5 staff), semua staff bisa lihat prospek satu sama lain karena filter cuma `WHERE department_id = ?`.

Padahal kebutuhan bisnisnya: **Staff Marketing A hanya boleh kelola prospeknya sendiri, Staff Marketing B hanya boleh kelola prospeknya sendiri.**

### 8.2. Solusi: Tambah `owner_user_id`

Bukan di level permission (terlalu kompleks untuk MVP), tapi cukup **filter di service layer**:

```sql
-- Di setiap tabel bisnis yang butuh kepemilikan per user
ALTER TABLE prospects ADD COLUMN owner_user_id INT NULL;
ALTER TABLE projects ADD COLUMN owner_user_id INT NULL;

-- Tambah index untuk performance
CREATE INDEX idx_prospects_owner ON prospects(department_id, owner_user_id);
```

**Filter di service layer:**

```javascript
async function listProspects(userId, userRole, activeDepartmentId) {
  let query = `
    SELECT p.*, ws.name as stage_name
    FROM prospects p
    JOIN workflow_stages ws ON ws.id = p.current_stage_id
    WHERE p.department_id = ?
  `;
  const params = [activeDepartmentId];

  // Logic: staff lihat miliknya, manager/admin lihat semua
  if (userRole === 'staff') {
    query += ` AND (p.owner_user_id = ? OR p.created_by = ?)`;
    params.push(userId, userId);
  }

  query += ` ORDER BY p.created_at DESC`;
  return db.query(query, params);
}
```

### 8.3. Aturan Kepemilikan

| Role | Data yang Terlihat |
|------|-------------------|
| **Staff** | Data miliknya sendiri (`owner_user_id = userId`) |
| **Manager** | Semua data di department-nya |
| **Admin** | Semua data di department-nya |
| **Director** | Semua data (bypass) |

### 8.4. Catatan Penting

- **Jangan** jadikan ini sebagai permission (`prospect:read:own` vs `prospect:read:department`) — itu over-engineering untuk MVP
- Cukup logic sederhana di service layer: `if (role === 'staff') filter by owner_user_id`
- Nanti kalau sudah ada fitur assign prospek ke staff lain, tambah kolom `assigned_to`
- `created_by` sudah otomatis terisi — bisa jadi fallback kalau `owner_user_id` null

---


## 9. Database Schema Lengkap

### 9.1. Daftar Tabel MVP

```
No  Tabel                    Status        Keterangan
─── ──────────────────────── ───────────── ───────────────────────────
 1  departments              NEW           Daftar department
 2  roles                    NEW           staff, manager, admin, dll
 3  permissions              NEW           Definisi permission
 4  user_roles               NEW           Jantung arsitektur — (user, role, scope)
 5  role_permissions         NEW           Binding permission ke role
 6  project_members          NEW           Cross-department project access
 7  project_departments      NEW           Department mana yang terlibat di project
 8  workflow_stages          NEW           Definisi stage workflow
 9  project_data             NEW           Dokumen/data dalam project
10  users                    Existing      Tidak ada perubahan untuk MVP
11  projects                 Existing (+)  Tambah: current_stage_id, owner_user_id
12  prospects                Existing (+)  Tambah: department_id, current_stage_id, owner_user_id
13  pengadaan                Existing (+)  Tambah: department_id, project_id, current_stage_id, owner_user_id
14  project_data_visibility  Optional      Visibility granular per department
```

### 9.2. SQL Lengkap

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  department_id INT NOT NULL,           -- department PRIMER
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,  -- 'IT', 'HC', 'FINANCE', 'PROCUREMENT', 'PM', 'MARKETING'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- WORKFLOW STAGES
-- ============================================================
CREATE TABLE workflow_stages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,       -- 'prospect', 'project', 'pengadaan'
  sequence INT NOT NULL,
  owner_department_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  current_stage_id INT NULL,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id)
);

-- Project-Department association
CREATE TABLE project_departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY (project_id, department_id)
);

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,       -- 'staff', 'manager', 'admin', 'project_viewer', 'director'
  description VARCHAR(255),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,  -- 'project:read', 'prospect:write:prospecting'
  name VARCHAR(200),
  module VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE TABLE user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  scope_type ENUM('global', 'department', 'project') NOT NULL,
  scope_id INT NULL,
  assigned_by INT,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE KEY (user_id, role_id, scope_type, scope_id)
);

CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  scope_type ENUM('global', 'department', 'project') NULL,
  scope_id INT NULL,
  stage_id INT NULL,                    -- optional: binding ke stage tertentu
  access_level ENUM('read', 'write') DEFAULT 'write',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id),
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  UNIQUE KEY (role_id, permission_id, scope_type, scope_id, stage_id)
);

-- ============================================================
-- PROJECT MEMBERSHIP (Cross-Department)
-- ============================================================
CREATE TABLE project_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  department_id INT NOT NULL,
  assigned_by INT,
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  approved_by INT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY (project_id, user_id)
);

-- ============================================================
-- BUSINESS DATA
-- ============================================================
CREATE TABLE prospects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- ... kolom existing ...
  department_id INT NOT NULL,
  project_id INT NULL,
  current_stage_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE project_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  owning_department_id INT NOT NULL,
  is_visible_to_all_depts BOOLEAN DEFAULT false,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (owning_department_id) REFERENCES departments(id)
);

CREATE TABLE project_data_visibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_data_id INT NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (project_data_id) REFERENCES project_data(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY (project_data_id, department_id)
);

CREATE TABLE pengadaan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- ... kolom existing ...
  department_id INT NOT NULL,
  project_id INT NULL,
  current_stage_id INT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id)
);
```

### 9.3. Seed Data

```sql
-- ============================================================
-- SEED: Departments
-- ============================================================
INSERT INTO departments (code, name) VALUES
('IT', 'Information Technology'),
('HC', 'Human Capital'),
('FINANCE', 'Finance'),
('PROCUREMENT', 'Procurement'),
('MARKETING', 'Marketing'),
('PM', 'Project Management');

-- ============================================================
-- SEED: Workflow Stages
-- ============================================================
INSERT INTO workflow_stages (code, name, module, sequence, owner_department_code) VALUES
('prospecting',     'Prospecting',      'prospect',  1,    'marketing'),
('supervisor_review','Supervisor Review','prospect',  1.5,  'marketing'), -- OPSIONAL
('waiting_pm',      'Waiting PM',       'prospect',  2,    'pm'),
('in_project',      'In Project',       'project',   3,    'pm'),
('pengadaan',       'Pengadaan',        'pengadaan', 4,    'procurement'),
('delivery',        'Delivery',         'project',   5,    'pm');

-- ============================================================
-- SEED: Roles
-- ============================================================
INSERT INTO roles (name, description, is_system) VALUES
('staff',    'Staff department — akses operasional dasar', true),
('manager',  'Manager department — approve & monitor',    true),
('admin',    'Admin department — full control',           true),
('director', ' bisa lihat semua department',           true),
('project_viewer',       'View-only di scope project',       true),
('project_contributor',  'Create/edit data di scope project', true),
('project_manager',      'Manage project scope & members',   true);

-- ============================================================
-- SEED: Permissions
-- ============================================================
INSERT INTO permissions (code, name, module) VALUES
-- Global / Base
('dashboard:view',          'View Dashboard',           'dashboard'),
('notification:read',       'Read Notifications',       'notification'),
('profile:manage',          'Manage Profile',           'profile'),
-- Prospect
('prospect:read',           'Read Prospects',           'prospect'),
('prospect:write:prospecting', 'Edit (Prospecting)',    'prospect'),
('prospect:approve:transition','Approve stage transisi','prospect'),
-- Project
('project:read',            'Read Projects',            'project'),
('project:create',          'Create Projects',          'project'),
('project:write',           'Edit Projects',            'project'),
('project:manage:members',  'Manage Project Members',   'project'),
-- Pengadaan
('pengadaan:read',          'Read Pengadaan',           'pengadaan'),
('pengadaan:create',        'Create Pengadaan',         'pengadaan'),
('pengadaan:write',         'Edit Pengadaan',           'pengadaan'),
-- Report
('report:view:department',  'View Department Report',   'report'),
('report:view:crossdept',   'View Cross-Dept Report',   'report');

-- ============================================================
-- SEED: Role-Permission Mapping
-- ============================================================
-- Staff (default department scope)
INSERT INTO role_permissions (role_id, permission_id, scope_type) VALUES
(1, 1, 'global'),   -- dashboard:view
(1, 2, 'global'),   -- notification:read
(1, 3, 'global'),   -- profile:manage
(1, 4, 'department'), -- prospect:read
(1, 6, 'department'), -- project:read
(1, 11, 'department'); -- pengadaan:read

-- Staff Marketing (tambah permission menulis & approve prospect)
INSERT INTO role_permissions (role_id, permission_id, scope_type, scope_id) VALUES
(1, 5, 'department', 'dept-marketing'), -- prospect:write:prospecting
(1, 6, 'department', 'dept-marketing'); -- prospect:approve:transition

-- Staff Procurement (tambah permission create & write pengadaan)
INSERT INTO role_permissions (role_id, permission_id, scope_type, scope_id) VALUES
(1, 12, 'department', 'dept-procurement'), -- pengadaan:create
(1, 13, 'department', 'dept-procurement'); -- pengadaan:write

-- Manager (tambah approve)
INSERT INTO role_permissions (role_id, permission_id, scope_type) VALUES
(2, 7, 'department'),   -- project:create
(2, 8, 'department'),   -- project:write
(2, 9, 'department'),   -- project:manage:members
(2, 14, 'department');  -- report:view:department

-- Director (bypass — global scope, semua permission)
INSERT INTO role_permissions (role_id, permission_id, scope_type) VALUES
-- Bisa diassign semua permission dengan global scope
(4, 4, 'global'),
(4, 6, 'global'),
(4, 7, 'global'),
(4, 11, 'global'),
(4, 15, 'global');
```

---

## 10. Pola Authorization Middleware

### 10.1. Authorization Engine (Lengkap)

```javascript
class AuthorizationEngine {
  constructor(db) {
    this.db = db;
  }

  /**
   * Cek apakah user punya permission tertentu
   */
  async hasPermission(userId, permissionCode, context = {}) {
    // Step 1: Cek BASE/GLOBAL permissions
    const hasGlobal = await this.checkGlobalPermission(permissionCode);
    if (hasGlobal) return true;

    // Step 2: Cek director bypass
    const isDirector = await this.checkDirectorBypass(userId, permissionCode);
    if (isDirector) return true;

    // Step 3: Kumpulkan SEMUA role user di semua scope
    const userRoles = await this.getUserRoles(userId);
    
    // Step 4: Cek satu per satu — additive (cukup 1 yang match)
    for (const ur of userRoles) {
      const permitted = await this.checkRolePermission(
        ur.role_id, permissionCode, ur.scope_type, ur.scope_id, context
      );
      if (permitted) return true;
    }
    return false;
  }

  /**
   * Dapatkan akses level user ke suatu record berdasarkan stage workflow
   * Returns: 'none' | 'read' | 'write'
   */
  async getRecordAccess(userId, record) {
    if (!record.current_stage_id) return 'none';
    
    const [stage] = await this.db.query(
      `SELECT code, owner_department_code FROM workflow_stages WHERE id = ?`,
      [record.current_stage_id]
    );
    if (!stage) return 'none';

    const [user] = await this.db.query(
      `SELECT department_id FROM users WHERE id = ?`, [userId]
    );
    const [userDept] = await this.db.query(
      `SELECT code FROM departments WHERE id = ?`, [user.department_id]
    );

    const rules = {
      'prospecting':  { owner: 'marketing',    prev: null },
      'waiting_pm':   { owner: 'pm',           prev: 'marketing' },
      'in_project':   { owner: 'pm',           prev: 'marketing' },
      'pengadaan':    { owner: 'procurement',  prev: 'pm' },
      'delivery':     { owner: 'pm',           prev: 'procurement' },
    };

    const rule = rules[stage.code];
    if (!rule) return 'none';
    if (userDept.code === rule.owner) return 'write';
    if (rule.prev && userDept.code === rule.prev) return 'read';
    return 'none';
  }

  async checkGlobalPermission(permissionCode) {
    const [rows] = await this.db.query(`
      SELECT 1 FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE p.code = ? AND rp.scope_type = 'global'
      LIMIT 1
    `, [permissionCode]);
    return rows.length > 0;
  }

  async checkDirectorBypass(userId, permissionCode) {
    const [result] = await this.db.query(`
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ? 
        AND r.name = 'director'
        AND p.code = ?
        AND ur.scope_type = 'global'
      LIMIT 1
    `, [userId, permissionCode]);
    return result.length > 0;
  }

  async getUserRoles(userId) {
    const [rows] = await this.db.query(`
      SELECT ur.role_id, r.name as role_name, 
             ur.scope_type, ur.scope_id
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `, [userId]);
    return rows;
  }

  async checkRolePermission(roleId, permissionCode, scopeType, scopeId, context) {
    const [rows] = await this.db.query(`
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = ?
        AND p.code = ?
        AND (
          rp.scope_type = 'global'
          OR (rp.scope_type = 'department' AND rp.scope_id = ?)
          OR (rp.scope_type = 'project' AND rp.scope_id = ?)
          OR rp.scope_type IS NULL
        )
      LIMIT 1
    `, [roleId, permissionCode, 
        context.departmentId || scopeId, 
        context.projectId]);
    return rows.length > 0;
  }
}
```

### 10.2. Express Middleware

```javascript
/**
 * Middleware: requirePermission('prospect:read')
 */
function requirePermission(permissionCode, contextResolver) {
  return async (req, res, next) => {
    try {
      const context = contextResolver ? contextResolver(req) : {};
      const authz = req.app.get('authz');
      const hasPermission = await authz.hasPermission(req.user.id, permissionCode, context);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Anda tidak memiliki akses ke resource ini'
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: requireStageAccess('write')
 */
function requireStageAccess(minAccessLevel, recordResolver) {
  return async (req, res, next) => {
    try {
      const record = await recordResolver(req);
      const authz = req.app.get('authz');
      const accessLevel = await authz.getRecordAccess(req.user.id, record);
      
      const levels = { 'none': 0, 'read': 1, 'write': 2 };
      if (levels[accessLevel] < levels[minAccessLevel]) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: `Anda tidak memiliki akses ${minAccessLevel} di stage ini`
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// === USAGE EXAMPLES ===
// 1. Global feature
router.get('/api/dashboard', 
  requirePermission('dashboard:view'),
  dashboardController.index
);

// 2. Department-scoped
router.get('/api/prospects', 
  requirePermission('prospect:read'),
  prospectController.list
);

// 3. Project-scoped
router.get('/api/projects/:projectId/documents', 
  requirePermission('project:read', (req) => ({
    projectId: req.params.projectId
  })),
  projectController.getDocuments
);

// 4. Stage-based access
router.put('/api/prospects/:id', 
  requirePermission('prospect:read'),
  requireStageAccess('write', (req) => getProspect(req.params.id)),
  prospectController.update
);
```

### 10.3. Service Layer — Data Filtering

```javascript
class ProspectService {
  constructor(db, authz) {
    this.db = db;
    this.authz = authz;
  }

  async list(userId, filters = {}) {
    // Ambil department yang bisa diakses (dari activeDepartmentId)
    const activeDeptId = filters.activeDepartmentId;
    
    let query = `
      SELECT p.*, ws.name as stage_name, d.name as department_name
      FROM prospects p
      JOIN workflow_stages ws ON ws.id = p.current_stage_id
      JOIN departments d ON d.id = p.department_id
      WHERE p.department_id = ?    -- FILTER BY ACTIVE DEPARTMENT
    `;
    const params = [activeDeptId];
    
    // Cross-department project: tambah data dari project yang user ikuti
    if (filters.includeProjectAccess) {
      const [projectIds] = await this.db.query(
        `SELECT project_id FROM project_members WHERE user_id = ?`, [userId]
      );
      
      if (projectIds.length > 0) {
        query += ` OR (p.project_id IN (${projectIds.map(() => '?').join(',')}) 
                       AND p.department_id != ?)`;
        params.push(...projectIds.map(p => p.project_id), activeDeptId);
      }
    }
    
    query += ` ORDER BY p.created_at DESC`;
    return this.db.query(query, params);
  }
}
```

---

## 11. Query Pattern untuk Isolasi Data

### 11.1. Pattern Dasar: Filter by Department

```sql
-- Semua query bisnis WAJIB filter by department_id
SELECT * FROM prospects 
WHERE department_id = ?;  -- = department_id dari session (atau activeDepartmentId di masa depan)
```

### 11.2. Pattern Cross-Department Project

```sql
-- User bisa lihat data department lain KALAU terlibat di project yang sama
SELECT pd.*, ws.name as stage_name
FROM project_data pd
JOIN workflow_stages ws ON ws.id = p.current_stage_id
WHERE 
  -- Data department sendiri
  pd.owning_department_id = ?
  -- ATAU data visible dari project yang user ikuti
  OR (
    pd.is_visible_to_all_depts = true 
    AND pd.project_id IN (
      SELECT project_id FROM project_members WHERE user_id = ?
    )
  );
```

### 11.3. View untuk Kemudahan

```sql
-- View: semua department yang bisa diakses user
CREATE VIEW user_accessible_departments AS
SELECT DISTINCT ur.user_id, d.id as department_id, d.code as department_code
FROM user_roles ur
JOIN departments d ON d.id = ur.scope_id
WHERE ur.scope_type = 'department'
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

UNION

SELECT DISTINCT pm.user_id, pm.department_id, d.code
FROM project_members pm
JOIN departments d ON d.id = pm.department_id;
```

### 11.4. Report Lintas Department (untuk Director)

```sql
-- Director tidak perlu filter department — bisa lihat semua
SELECT 
  d.name as department_name,
  COUNT(*) as total_prospects,
  ws.name as stage
FROM prospects p
JOIN departments d ON d.id = p.department_id
JOIN workflow_stages ws ON ws.id = p.current_stage_id
GROUP BY d.id, p.current_stage_id
ORDER BY d.name, ws.sequence;
```

---

## 12. Case Studies: Semua Skenario

### Skenario 1: Staff IT hanya lihat data IT

```
Setup:
  - Alice: role=staff, scope_type=department, scope_id=IT
  - Bob: role=staff, scope_type=department, scope_id=HC

Alice login → activeDepartmentId = IT
  → List prospects → WHERE department_id = IT → ✅ OK
  → Ganti active ke HC → dropdown → ❌ HC tidak ada di accessibleDepartments Alice

Bob login → activeDepartmentId = HC
  → List prospects → WHERE department_id = HC → ✅ OK
  → Coba akses API prospect IT langsung → middleware cek user_roles → ❌ FORBIDDEN
```

### Skenario 2: Workflow Transisi — Marketing ke PM

```
Prospek "Project X" current_stage = prospecting (owner: Marketing)

Marketing access:  getStageAccess → 'write' ✅
  → Bisa create, edit, delete prospect
PM access:         getStageAccess → 'none', tapi PM punya `prospect:read` 
  → Bisa lihat prospect (read), tapi tidak bisa edit ❌

Marketing approve → stage berubah ke 'waiting_pm'
Marketing access:  getStageAccess → 'read' (prev = marketing)
  → Bisa lihat, TAPI tidak bisa edit ❌
PM access:         getStageAccess → 'write' ✅
  → Bisa approve/tolak prospect

PM approve → stage berubah ke 'in_project', tercipta Project
  → Prospect sudah jadi Project, ownership pindah ke PM
```

### Skenario 3: Project Alpha (IT + PM + Finance) — Cross-Department

```
Setup:
  - Charlie: role=staff, scope_type=department, scope_id=IT
           + role=project_contributor, scope_type=project, scope_id=Project_Alpha

Charlie di Project Alpha:
  → Bisa create project_data dengan owning_department_id = IT
  → Baca project_data milik Finance (is_visible_to_all_depts=true) ✅
  → Baca project_data milik Finance (is_visible_to_all_depts=false) ❌

Charlie di LUAR Project Alpha:
  → Coba akses data Finance → ❌ FORBIDDEN
```

### Skenario 4: Dashboard — fitur lintas role

```
Permission: dashboard:view dengan role_permissions.scope_type = 'global'

Middleware check dashboard:view:
  → checkGlobalPermission('dashboard:view') → ✅ found with scope_type=global
  → Return true

Nambah fitur global baru (notification:read):
  → INSERT 1 baris ke role_permissions dengan scope_type='global'
  → Langsung berlaku untuk SEMUA user ✅
```

### Skenario 5: User Merangkap 2 Department

```
Alice: staff di IT (scope_type=department, scope_id=IT)
     : staff di Finance (scope_type=department, scope_id=FINANCE)

Login → accessibleDepartments = [IT, Finance]
  → activeDepartmentId = IT (default)
  → Lihat prospects IT ✅
  → Switch activeDepartmentId ke Finance via dropdown
  → Lihat prospects Finance ✅
  → Data IT dan Finance tetap terpisah — tidak tercampur
```

### Skenario 6: Tambah Department Baru (Legal)

```
INSERT department: 'Legal'

-- Assign user existing ke Legal
INSERT user_roles (user_id, role_id, scope_type, scope_id) 
VALUES (10, 1, 'department', 7);  -- staff di Legal

✅ Selesai — role 'staff' sudah punya default permissions
✅ Role count: 3 (staff, manager, admin) — tidak bertambah
✅ Kalau butuh permission khusus Legal:
   INSERT role_permissions (role_id, permission_id, scope_type, scope_id) 
   VALUES (1, 20, 'department', 7);  -- staff boleh legal:sign hanya di scope Legal
```

### Skenario 7: Director Lihat Semua Department

```
Diana: role=director, scope_type=global

Diana akses report → checkDirectorBypass → ✅ 
  → Query tanpa filter department → lihat semua data
  → Bisa filter per department via parameter (opsional)

Diana akses prospect IT:
  → checkDirectorBypass('prospect:read') → director role punya permission 'prospect:read' global → ✅
  → Tapi Diana TIDAK bisa edit — edit butuh 'prospect:write:prospecting' → director tidak punya itu → ❌
```

### Skenario 8: User Pindah Department

```
Bob pindah dari HC ke IT:
  -- Hapus/expire role HC
  UPDATE user_roles SET expires_at = NOW() 
  WHERE user_id = 2 AND scope_type = 'department' AND scope_id = HC_id;
  
  -- Assign role baru di IT
  INSERT user_roles (user_id, role_id, scope_type, scope_id) 
  VALUES (2, 1, 'department', IT_id);

Akibat:
  - Prospek lama Bob tetap di HC (department_id = HC_id) ✅
  - Prospek baru Bob masuk ke IT (department_id = IT_id) ✅
  - Bob tidak bisa akses prospek HC lagi (kecuali via project) ✅
  - Data HC tetap utuh — tidak hilang ✅
```

---

## 13. Yang Tidak Direkomendasikan + Alasannya

| Approach | Kenapa Tidak | Sumber |
|----------|-------------|--------|
| **ABAC murni** | Kompleksitas tinggi, maintenance berat, "ongoing endeavor bukan one-time setup" | Permit.io, Cerbos docs |
| **ReBAC / Zanzibar (Ory Keto)** | Multi-tenancy cuma di Enterprise License, infrastructure tambahan (K8s, CockroachDB), learning curve OPL | Ory Keto docs |
| **PostgreSQL RLS** | Policy via DDL kaku, performance overhead dengan JOIN, race condition di READ COMMITTED | PostgreSQL docs |
| **Role per-department** | Combinatorial explosion: 7 dept × 3 role × 20 fitur = 420 role | Evolveum, hoop.dev, Permify |
| **Hierarchical RBAC saja** | Hierarchy linear gagal untuk multi-dimensional access (matrix pattern) | Kuhn, Coyne & Weil 2010 (NIST) |
| **Field-level security** | Over-engineering untuk tahap awal | User requirement |
| **Workflow engine (Camunda dll)** | Alur linear Prospek→Delivery, tidak perlu engine mahal | Analisis kebutuhan |
| **is_director boolean di users** | Kaku, tidak scalable (ganti role = ganti code) | Praktik engineering |

**Kapan perlu upgrade?**

| Kondisi | Upgrade ke |
|---------|-----------|
| Permission tergantung atribut dinamis (time, location, billing status) | ABAC di atas RBAC |
| Perlu audit "siapa punya akses ke resource Y?" secara real-time | ReBAC / Zanzibar |
| Field-level security (user A edit field name, tidak bisa edit amount) | Attribute-based + field-level |
| Approval Dept Head via workflow notifikasi | Cukup tambah kolom approval_status + event |
| Parallel/complex workflow (branching, parallel tasks) | Dedicated workflow engine |

---

## 14. Rekomendasi Library

| Library | Alasan | Link |
|---------|--------|------|
| **node-casbin** | ⭐ Production-grade (20k+ stars), RBAC with Domains built-in, MySQL adapter, NIST RBAC96 compliant. Tapi learning curve untuk model.conf syntax. | https://casbin.org |
| **accesscontrol** | Lebih simple, familiar untuk Node.js developer, support role hierarchy + attributes. Cocok implementasi custom. | https://github.com/onury/accesscontrol |
| **CASL** | Paling ringan, fokus ability-based. Cocok kalau mau implement dari scratch dengan schema sendiri. | https://casl.js.org |

**Rekomendasi: Build your own** di atas schema yang sudah dirancang.

Alasan:
1. Schema Anda cuma 5-6 tabel inti — lebih sederhana dari library manapun
2. Middleware pattern cuma ~50 baris — library malah tambah dependency
3. Kontrol penuh atas query filtering (`WHERE department_id = ?`)
4. Zero dependency tambahan
5. Kalau nanti perlu library untuk fitur lanjutan (ABAC, ReBAC), bisa ditambahkan tanpa migrasi data

---

## 15. Checklist Final MVP

### ✅ WAJIB untuk MVP

| Komponen | Status | Prioritas |
|----------|--------|-----------|
| Tabel `departments` | NEW | P0 — Tanpa ini isolasi data tidak berfungsi |
| Tabel `roles` | NEW | P0 — Inti RBAC |
| Tabel `permissions` | NEW | P0 — Definisi aksi yang bisa dilakukan |
| Tabel `user_roles` (dengan scope_type + scope_id) | NEW | P0 — Jantung arsitektur |
| Tabel `role_permissions` (dengan scope binding) | NEW | P0 — Binding role → permission |
| Tabel `project_members` | NEW | P0 — Cross-department access |
| Tabel `project_departments` | NEW | P0 — Department mana yang terlibat di project |
| Tabel `workflow_stages` | NEW | P0 — Tracking transisi Prospek→Project→Pengadaan→Delivery |
| Tambah `department_id` di tabel bisnis | ALTER | P0 — Isolasi data per department |
| Tambah `current_stage_id` di tabel bisnis | ALTER | P0 — Stage tracking |
| Tambah `owner_user_id` di tabel bisnis (prospek, dll) | ALTER | P0 — Isolasi data per user dalam 1 department |
| AuthorizationEngine class | NEW | P0 — Logic pengecekan permission |
| Middleware `requirePermission()` | NEW | P0 — Gate di semua route |
| Seeder roles + permissions + stages | NEW | P0 — Data awal sebelum app jalan |
| Filter `owner_user_id` di service layer | NEW | P1 — Staff lihat miliknya, manager lihat semua |
| `getStageAccess()` function | NEW | P1 — Workflow-based access |
| `checkDirectorBypass()` | NEW | P1 — Reporting lintas department |

### ❌ TIDAK untuk MVP (tapi dicatat)

| Komponen | Rencana |
|----------|---------|
| Admin panel manage role | Nanti — cukup seed data + direct DB dulu |
| Audit log dedicated | Nanti — cukup `created_by` + `updated_at` dulu |
| Approval Dept Head (`approval_status`) | Nanti — default `'approved'` dulu |
| `active_department_id` (multi-dept switcher) | Nanti — sebagian besar user cuma di 1 department |
| Tabel `project_data_visibility` | Nanti — cukup `is_visible_to_all_depts` dulu |
| Field-level security | Nanti — belum diperlukan |
| ReBAC / Zanzibar | Nanti — kalau sudah perlu skala enterprise |
| Workflow engine (Camunda) | Tidak perlu — alur linear |

### Ringkasan Total Tabel MVP

| Tabel | Action |
|-------|--------|
| `users` | Existing — tidak ada perubahan untuk MVP |
| `departments` | CREATE |
| `roles` | CREATE |
| `permissions` | CREATE |
| `user_roles` | CREATE |
| `role_permissions` | CREATE |
| `project_members` | CREATE |
| `project_departments` | CREATE |
| `workflow_stages` | CREATE |
| `projects` | ALTER (+ current_stage_id, owner_user_id) |
| `prospects` | ALTER (+ department_id, current_stage_id, owner_user_id) |
| `pengadaan` | ALTER (+ department_id, project_id, current_stage_id, owner_user_id) |
| `project_data` | CREATE |

**12 total — 9 NEW + 3 ALTER. Feasible untuk 1-2 sprint.**

---

## 16. Roadmap Implementasi

### Phase 1: Foundation (Minggu 1-2)

- [ ] Buat tabel: `departments`, `roles`, `permissions`, `user_roles`, `role_permissions`
- [ ] Buat tabel: `workflow_stages`
- [ ] Seed data: departments, stages, roles, permissions, role_permissions
- [ ] Implement `AuthorizationEngine` class (`hasPermission`, `getRecordAccess`, `checkDirectorBypass`, `owner_user_id` filter)
- [ ] Implement middleware: `requirePermission()`, `requireStageAccess()`
- [ ] Implement filter `owner_user_id` di service layer (staff lihat miliknya, manager lihat semua)
- [ ] Unit test: permission checks

### Phase 2: Department Isolation (Minggu 2-3)

- [ ] ALTER: `prospects`, `projects`, `pengadaan` + `department_id`, `current_stage_id`, `owner_user_id`
- [ ] Buat tabel: `project_data`, `project_departments`
- [ ] Implement `getRecordAccess()` — stage-based read/write
- [ ] Migrasi data existing ke struktur baru
- [ ] Unit test: staff IT tidak bisa akses data HC
- [ ] Unit test: transisi stage → akses berubah

### Phase 3: Cross-Department Projects (Minggu 3-4)

- [ ] Buat tabel: `project_members`
- [ ] Implement `addProjectMember()` — validasi department, role boundary
- [ ] Implement cross-department query pattern
- [ ] Cukup `is_visible_to_all_depts` — `project_data_visibility` SKIP untuk MVP
- [ ] Test: user IT bisa lihat data Finance di project yang sama
- [ ] Test: user TIDAK bisa lihat data Finance di luar project tersebut

### Phase 4: Polish & Feature Complete (Minggu 4-5)

- [ ] Seed: global permissions (dashboard, notification, profile)
- [ ] Implement `Director bypass` — reporting cross-department
- [ ] Implement audit trail: `created_by`, `updated_at` di semua tabel
- [ ] Documentation + integration tests
- [ ] **TIDAK** admin panel — skip ke sprint berikutnya
- [ ] **TIDAK** `activeDepartmentId` — skip ke fase berikutnya

---

## 17. Daftar Sumber

1. **Casbin RBAC with Domains** — https://casbin.apache.org/docs/rbac-with-domains
2. **Cerbos Scoped Policies** — https://docs.cerbos.dev/cerbos/latest/policies/scoped_policies.html
3. **Cerbos Derived Roles** — https://docs.cerbos.dev/cerbos/latest/policies/derived_roles.html
4. **Auth0 RBAC** — https://auth0.com/docs/manage-users/access-control/rbac
5. **NIST RBAC Standard** — https://csrc.nist.gov/projects/role-based-access-control
6. **Evolveum - Role Explosion** — https://docs.evolveum.com/iam/iga/rbac/role-explosion/
7. **hoop.dev - Domain-Based Resource Separation** — https://hoop.dev/blog/preventing-large-scale-role-explosion-with-domain-based-resource-separation
8. **hoop.dev - Stopping RBAC Role Explosion** — https://hoop.dev/blog/stopping-rbac-role-explosion-at-scale
9. **Permit.io - RBAC vs ABAC vs ReBAC** — https://www.permit.io/blog/rbac-vs-abac-vs-rebac
10. **Permify - Role Explosion Hidden Cost** — https://permify.co/post/role-explosion/
11. **Okta RBAC Whitepaper** — https://www.okta.com/resources/whitepaper/role-based-access-control-rbac/
12. **Kuhn, Coyne & Weil (2010)** — "Adding Attributes to Role-Based Access Control," IEEE Computer 43(6): 79-81
13. **Ory Keto** — https://github.com/ory/keto
14. **Tools4ever - Smart RBAC** — https://www.tools4ever.co.uk/blog/2024/smart-rbac-prevent-role-explosion/
15. **Wikipedia - RBAC** — https://en.wikipedia.org/wiki/Role-based_access_control

---

> **Catatan:** Dokumen v2.0 ini menambahkan pembahasan workflow ownership (stage-based access), otoritas PM (boundary & validasi), 4 edge cases (pindah department, multi-department, dokumen lintas, reporting), dan checklist final MVP. Semua berdasarkan hasil deep research dengan 5 search angles, 15+ sumber, dan adversarial 3-vote verification pada klaim-klaim kunci.
