# 020 — AUTHORIZATION ENFORCEMENT SPEC
## KINETIC CRM — Spesifikasi Teknis Enforcement Authorization End-to-End

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 020 |
| **Nama Dokumen** | Authorization Enforcement Specification |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0 |
| **Dokumen Terkait** | 008 (Security Architecture), 017 (Role Permission Module), 018 (User Management), 019 (Authentication Session Module), 052 (Audit Trail Module), 057 (Full API Endpoint Specification) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Backend Developer, Security Architect, Database Administrator, DevOps Engineer, QA Engineer, Tech Lead, Security Reviewer

---

## 1. PURPOSE

Dokumen ini mendefinisikan spesifikasi teknis lengkap untuk enforcement authorization di seluruh layer sistem KINETIC CRM — mulai dari API Gateway, Backend Middleware, Service Layer, hingga Database Layer. Dokumen ini menjawab pertanyaan: **"Bagaimana sistem memastikan bahwa setiap request yang masuk hanya dapat melakukan operasi yang secara eksplisit diizinkan oleh role, permission, dan kepemilikan data pengguna yang bersangkutan?"**

Dokumen ini **tidak** membahas:
- Implementasi UI frontend (route guard, menu visibility) — didokumentasikan di dokumen 058 (Frontend Architecture)
- Desain skema database permission — didokumentasikan di dokumen 017 (Role Permission Module)
- Mekanisme autentikasi dan manajemen sesi — didokumentasikan di dokumen 019 (Authentication Session Module)

---

## 2. SCOPE

### In Scope

- Model authorization: RBAC, Permission-Based Access, Resource Ownership, Data Scope Restriction
- Definisi seluruh role sistem beserta karakteristiknya
- Permission matrix lengkap (Role × Resource × Action)
- Backend middleware enforcement (route-level protection)
- API layer enforcement (endpoint-level authorization)
- Service layer enforcement (business rule enforcement sebelum operasi DB)
- Database layer enforcement (Row-Level Security, ownership validation, sensitive data access)
- Audit logging enforcement (setiap access decision dicatat)
- Security considerations dan attack vectors yang harus dimitigasi
- Acceptance criteria yang dapat diuji oleh QA

### Out of Scope

- Implementasi autentikasi (JWT generation, token refresh, session management) → dokumen 019
- Frontend route guard dan menu visibility → dokumen 058
- Detail skema tabel permission → dokumen 017
- Detail endpoint contract (request/response schema) → dokumen 057

---

## 3. AUTHORIZATION MODEL

KINETIC CRM mengimplementasikan model authorization berlapis (layered authorization) yang menggabungkan empat dimensi kontrol akses. Setiap request divalidasi terhadap seluruh dimensi yang relevan secara berurutan — pelanggaran di satu dimensi mana pun menghasilkan penolakan akses.

### 3.1 Role-Based Access Control (RBAC)

**Definisi:** Setiap user diberikan satu role yang menentukan hak akses dasarnya terhadap menu dan fitur sistem.

**Prinsip:**
- Satu user memiliki tepat satu role aktif pada satu waktu.
- Role ditetapkan oleh Administrator dan disimpan di tabel `roles` dan `user_roles`.
- Role menentukan akses level pertama: apakah user diizinkan mengakses resource category ini sama sekali?
- Role dalam KINETIC CRM bersifat **dinamis** — Admin dapat membuat role kustom via modul Configuration (CFG-04). Lima role default yang selalu ada dan tidak dapat dihapus adalah: `cabang`, `pm`, `dept`, `mgmt`, `admin`.

**Hierarki Role Default (urutan privilege, bukan inheritance):**

```
admin       → Akses penuh ke seluruh sistem, termasuk modul konfigurasi
mgmt        → Akses baca seluruh data + approval final + laporan eksekutif
pm          → Manajemen proyek cross-branch + approval RKS/LPHS
dept        → Review dan approval LPHS/SIOS per departemen
cabang      → Operasional proyek dan prospek milik cabang sendiri
```

**Catatan Arsitektur:** Role tidak diimplementasikan sebagai enum hardcode di source code. Role disimpan di database dan dimuat saat aplikasi start (dengan caching per session). Penambahan role baru oleh Admin tidak memerlukan deployment ulang.

### 3.2 Permission-Based Access Control

**Definisi:** Setiap role dikonfigurasi dengan set permission granular yang mendefinisikan aksi spesifik apa yang dapat dilakukan terhadap resource spesifik.

**Struktur Permission:** `{resource}.{action}`

Contoh permission granular:
- `prospect.create` — Membuat prospek baru
- `prospect.read` — Membaca data prospek
- `prospect.update` — Mengupdate prospek yang ada
- `prospect.delete` — Menghapus prospek
- `project.approve` — Memberikan approval pada proyek
- `config.manage` — Mengakses dan mengubah konfigurasi sistem
- `report.export` — Mengekspor laporan
- `user.manage` — Mengelola user (CRUD)
- `audit.read` — Membaca audit log

**Cara Kerja:** Middleware backend tidak hanya memeriksa role, melainkan memeriksa apakah role tersebut memiliki permission spesifik yang dibutuhkan oleh endpoint yang diakses. Hal ini memungkinkan role kustom yang dibuat Admin memiliki permission subset dari role default.

### 3.3 Resource Ownership (Kepemilikan Sumber Daya)

**Definisi:** Beberapa resource hanya dapat diakses atau dimodifikasi oleh user yang "memiliki" resource tersebut, atau user yang berada dalam unit organisasi yang sama.

**Aturan kepemilikan berlaku untuk:**
- **Prospek:** User dengan role `cabang` hanya dapat melihat dan mengedit prospek yang dibuat oleh user dalam cabang yang sama (`prospects.branch_id = user.branch_id`).
- **Proyek:** User `cabang` hanya dapat mengakses proyek yang diassign ke cabangnya (`projects.branch_id = user.branch_id`).
- **Dokumen Upload:** Hanya user yang mengupload atau approver yang relevan yang dapat mengakses dokumen.
- **Notifikasi:** Notifikasi hanya dapat dibaca oleh user yang menjadi recipient.

**Pengecualian kepemilikan (cross-branch visibility):**
- `pm` dan `admin` dapat melihat seluruh data lintas cabang.
- `mgmt` dapat melihat seluruh data untuk keperluan laporan dan monitoring.
- `dept` dapat melihat proyek yang memerlukan review dari departemennya.

### 3.4 Data Scope Restriction

**Definisi:** Pembatasan data berdasarkan konteks organisasi pengguna, diterapkan secara otomatis di query layer sehingga response API hanya berisi data yang relevan dengan scope pengguna.

**Scope Matrix:**

| Role | Scope Data | Mekanisme |
|------|------------|-----------|
| `cabang` | Hanya data branch sendiri (`branch_id` match) | WHERE clause otomatis |
| `pm` | Semua data, semua branch | Tidak ada filter tambahan |
| `dept` | Proyek yang memerlukan review dept ini | JOIN ke approval assignments |
| `mgmt` | Semua data, semua branch | Tidak ada filter tambahan |
| `admin` | Semua data + data konfigurasi | Tidak ada filter tambahan |

**Implementasi Teknis:** Data scope diterapkan melalui **Query Scope Middleware** yang menginject kondisi WHERE secara otomatis ke setiap query berdasarkan role user. Ini mencegah celah keamanan akibat lupa menambahkan filter secara manual di setiap service.

---

## 4. ROLES DEFINITION

Berdasarkan BA Review (B.3 — Review Struktur Organisasi) dan FE Spec (2.1 — Sidebar Menu per Role).

### 4.1 Role: `cabang` (Branch Operator)

**Deskripsi:** Staf operasional di kantor cabang yang bertanggung jawab atas pembuatan dan pengelolaan prospek dan proyek milik cabangnya.

**Karakteristik:**
- Terikat pada satu cabang spesifik (`user.branch_id` wajib diisi).
- Tidak dapat melihat data cabang lain.
- Dapat membuat prospek dan mengelola proyek cabangnya sepanjang lifecycle.
- Tidak memiliki akses ke modul konfigurasi, master data, laporan eksekutif, atau audit log.

**Menu yang Dapat Diakses:**
- Dashboard (konten: proyek aktif, win rate, proyek approaching deadline)
- Prospek (hanya milik cabangnya)
- Proyek (hanya milik cabangnya)

**Aksi yang Diizinkan:**
- Membuat, membaca, mengedit prospek milik cabang sendiri
- Membaca dan mengelola proyek milik cabang sendiri
- Upload dokumen pada tahap yang relevan (RKS, harga penawaran)
- Submit proyek ke tahap berikutnya
- Menerima dan membaca notifikasi

### 4.2 Role: `pm` (Project Manager)

**Deskripsi:** Project Manager yang bertanggung jawab atas review dan approval dokumen tender lintas cabang.

**Karakteristik:**
- Tidak terikat pada satu cabang (branch_id boleh null atau diisi sebagai default).
- Dapat melihat seluruh prospek dan proyek dari semua cabang.
- Bertanggung jawab atas review RKS dan koordinasi LPHS/SIOS.
- Dapat mengakses Approval Inbox untuk melakukan review dan approval.

**Menu yang Dapat Diakses:**
- Dashboard (konten: approval pending, proyek at-risk, approaching deadline)
- Prospek (semua cabang)
- Proyek (semua cabang)
- Approval Inbox (hanya pending yang assign ke PM)

**Aksi yang Diizinkan:**
- Semua aksi `cabang` pada semua proyek
- Review dan approve/reject RKS
- Review dan approve/reject LPHS (koordinasi dengan dept)
- Assign ulang approval ke backup approver (dengan konfirmasi admin)
- Melihat timeline event lengkap per proyek

### 4.3 Role: `dept` (Departemen Reviewer)

**Deskripsi:** Representasi departemen fungsional (Engineering, Legal, Finance, dll.) yang bertanggung jawab atas review teknis LPHS/SIOS dari perspektif departemennya.

**Karakteristik:**
- Terikat pada satu departemen spesifik (`user.dept_id` wajib diisi).
- Dapat melihat proyek yang memerlukan review dari departemennya.
- Tidak dapat mengakses data proyek yang tidak melibatkan departemennya.
- Scope data: proyek di mana departemennya terdaftar sebagai reviewer.

**Menu yang Dapat Diakses:**
- Dashboard (konten: approval pending milik dept ini)
- Proyek (hanya yang memerlukan review dept ini)
- Approval Inbox (hanya pending assignment ke dept ini)

**Aksi yang Diizinkan:**
- Review LPHS/SIOS untuk departemennya
- Approve atau reject dengan catatan revisi
- Upload feedback dokumen
- Membaca timeline event proyek yang relevan

### 4.4 Role: `mgmt` (Management)

**Deskripsi:** Pejabat manajemen yang bertanggung jawab atas oversight keseluruhan pipeline, monitoring KPI, dan approval final.

**Karakteristik:**
- Tidak terikat pada cabang atau departemen spesifik (akses global).
- Fokus pada monitoring dan approval, bukan operasional input.
- Akses ke laporan eksekutif dan dashboard manajemen.
- Dapat memberikan approval final setelah semua reviewer di bawah telah approve.

**Menu yang Dapat Diakses:**
- Dashboard (konten: pipeline value, win rate, progress vs target, trend grafik, proyek per status)
- Proyek (semua, read-heavy)
- Approval Inbox (approval final yang assign ke management)
- Laporan (Win/Loss, Pipeline, export)

**Aksi yang Diizinkan:**
- Membaca seluruh data proyek, prospek, dan laporan
- Memberikan approval final pada tahap yang dikonfigurasi
- Mengekspor laporan Excel/PDF
- Melihat KPI dan progress vs target per cabang dan divisi

### 4.5 Role: `admin` (Administrator Sistem)

**Deskripsi:** Administrator yang bertanggung jawab atas konfigurasi sistem, manajemen user, dan operasional teknis sistem.

**Karakteristik:**
- Akses penuh ke seluruh sistem tanpa exception.
- Satu-satunya role yang dapat mengakses modul konfigurasi (CFG-01 s/d CFG-14).
- Dapat membuat, mengedit, menonaktifkan user.
- Dapat melihat dan mengekspor audit log.
- Dapat melakukan re-assign approval.

**Menu yang Dapat Diakses:**
- Seluruh menu sistem tanpa pengecualian

**Aksi yang Diizinkan:**
- Semua aksi di semua modul
- CRUD user dan role assignment
- Konfigurasi seluruh parameter sistem
- Akses dan export audit log
- Re-assign approval ke backup approver

---

## 5. PERMISSION MATRIX

### 5.1 Resource & Action Catalog

Berikut adalah katalog lengkap resource dan action yang diproteksi oleh sistem authorization:

| Resource Code | Nama Resource | Actions Tersedia |
|---|---|---|
| `prospect` | Prospek | `create`, `read`, `update`, `delete`, `submit` |
| `project` | Proyek | `create`, `read`, `update`, `delete`, `submit`, `cancel` |
| `rks` | Dokumen RKS | `create`, `read`, `update`, `approve`, `reject`, `revise` |
| `lphs_sios` | Dokumen LPHS/SIOS | `create`, `read`, `update`, `approve`, `reject`, `revise` |
| `harga` | Harga Penawaran & Kompetitor | `create`, `read`, `update` |
| `pemenang` | Data Pemenang Tender | `create`, `read`, `update` |
| `delivery` | Target Delivery | `create`, `read`, `update` |
| `approval` | Approval Inbox | `read`, `approve`, `reject` |
| `document` | Dokumen Upload | `upload`, `read`, `download`, `delete` |
| `notification` | Notifikasi In-App | `read`, `mark_read` |
| `dashboard` | Dashboard | `read` |
| `report` | Laporan | `read`, `export` |
| `master_customer` | Master Customer | `create`, `read`, `update`, `delete` |
| `master_department` | Master Departemen | `create`, `read`, `update`, `delete` |
| `master_question` | Master Pertanyaan | `create`, `read`, `update`, `delete` |
| `master_competitor` | Master Kompetitor | `create`, `read`, `update`, `delete` |
| `master_period` | Master Periode | `create`, `read`, `update`, `delete` |
| `master_status` | Master Status Proyek | `create`, `read`, `update`, `delete` |
| `config_org` | Konfigurasi Organisasi | `read`, `update` |
| `config_workflow` | Konfigurasi Workflow | `read`, `update` |
| `config_role` | Konfigurasi Role & Permission | `create`, `read`, `update`, `delete` |
| `config_sla` | Konfigurasi SLA | `read`, `update` |
| `config_notification` | Konfigurasi Notifikasi | `read`, `update` |
| `config_question_type` | Konfigurasi Tipe Pertanyaan | `create`, `read`, `update`, `delete` |
| `user` | Manajemen User | `create`, `read`, `update`, `delete`, `reset_password`, `lock`, `unlock` |
| `audit_log` | Audit Log | `read`, `export` |

### 5.2 Role × Permission Matrix

Notasi: ✅ = Diizinkan | ❌ = Tidak Diizinkan | 🔒 = Diizinkan dengan batasan ownership/scope

#### Modul Prospek

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `prospect.create` | 🔒 (cabang sendiri) | ✅ | ❌ | ❌ | ✅ |
| `prospect.read` | 🔒 (cabang sendiri) | ✅ | ❌ | ✅ | ✅ |
| `prospect.update` | 🔒 (cabang sendiri, draft/revision) | ✅ | ❌ | ❌ | ✅ |
| `prospect.delete` | 🔒 (cabang sendiri, draft only) | ❌ | ❌ | ❌ | ✅ |
| `prospect.submit` | 🔒 (cabang sendiri) | ✅ | ❌ | ❌ | ✅ |

#### Modul Proyek

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `project.create` | ✅ (dari prospek approved) | ✅ | ❌ | ❌ | ✅ |
| `project.read` | 🔒 (cabang sendiri) | ✅ | 🔒 (yg melibatkan deptnya) | ✅ | ✅ |
| `project.update` | 🔒 (cabang sendiri, field tertentu) | ✅ | ❌ | ❌ | ✅ |
| `project.delete` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `project.cancel` | ❌ | ✅ | ❌ | ✅ | ✅ |

#### Modul RKS

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `rks.create` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `rks.read` | 🔒 (proyek cabang sendiri) | ✅ | ❌ | ✅ | ✅ |
| `rks.update` | 🔒 (draft/revision only) | ✅ | ❌ | ❌ | ✅ |
| `rks.approve` | ❌ | ✅ | ❌ | ❌ | ✅ |
| `rks.reject` | ❌ | ✅ | ❌ | ❌ | ✅ |
| `rks.revise` | ✅ (jika diminta PM) | ✅ | ❌ | ❌ | ✅ |

#### Modul LPHS/SIOS

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `lphs_sios.create` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `lphs_sios.read` | 🔒 (proyek cabang sendiri) | ✅ | 🔒 (dept terlibat) | ✅ | ✅ |
| `lphs_sios.update` | 🔒 (draft/targeted revision) | ✅ | ❌ | ❌ | ✅ |
| `lphs_sios.approve` | ❌ | ✅ (koordinasi final) | 🔒 (deptnya sendiri) | ✅ (approval final) | ✅ |
| `lphs_sios.reject` | ❌ | ✅ | 🔒 (deptnya sendiri) | ✅ | ✅ |
| `lphs_sios.revise` | ✅ (jika diarahkan ke cabang) | ✅ | ❌ | ❌ | ✅ |

#### Modul Harga, Pemenang, Delivery

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `harga.create` | 🔒 (proyek cabang sendiri) | ✅ | ❌ | ❌ | ✅ |
| `harga.read` | 🔒 (proyek cabang sendiri) | ✅ | ❌ | ✅ | ✅ |
| `harga.update` | 🔒 (proyek cabang sendiri) | ✅ | ❌ | ❌ | ✅ |
| `pemenang.create` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `pemenang.read` | 🔒 | ✅ | ❌ | ✅ | ✅ |
| `delivery.create` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `delivery.read` | 🔒 | ✅ | ❌ | ✅ | ✅ |

#### Modul Approval

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `approval.read` | ❌ | ✅ (assign ke PM) | ✅ (assign ke dept) | ✅ (assign ke mgmt) | ✅ |
| `approval.approve` | ❌ | 🔒 (assign ke PM) | 🔒 (assign ke dept) | 🔒 (assign ke mgmt) | ✅ |
| `approval.reject` | ❌ | 🔒 (assign ke PM) | 🔒 (assign ke dept) | 🔒 (assign ke mgmt) | ✅ |

#### Modul Dokumen

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `document.upload` | 🔒 (proyek sendiri) | ✅ | 🔒 (proyek dept terlibat) | ❌ | ✅ |
| `document.read` | 🔒 (proyek sendiri) | ✅ | 🔒 (proyek dept terlibat) | ✅ | ✅ |
| `document.download` | 🔒 (proyek sendiri) | ✅ | 🔒 (proyek dept terlibat) | ✅ | ✅ |
| `document.delete` | ❌ | ✅ (draft only) | ❌ | ❌ | ✅ |

#### Modul Laporan & Dashboard

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `dashboard.read` | ✅ (konten terbatas) | ✅ (konten PM) | ✅ (konten dept) | ✅ (konten mgmt) | ✅ |
| `report.read` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `report.export` | ❌ | ❌ | ❌ | ✅ | ✅ |

#### Modul Master Data

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `master_customer.read` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `master_customer.create` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `master_customer.update` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `master_customer.delete` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `master_department.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `master_question.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `master_competitor.read` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `master_competitor.create/update` | ❌ | ✅ | ❌ | ❌ | ✅ |

#### Modul Konfigurasi & Administrasi

| Permission | cabang | pm | dept | mgmt | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `config_org.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `config_workflow.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `config_role.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `config_sla.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `config_notification.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `config_question_type.*` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `user.create/update/delete` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `user.read` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `user.reset_password` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `user.lock/unlock` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `audit_log.read` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `audit_log.export` | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 6. BACKEND ENFORCEMENT

### 6.1 Middleware Stack

Setiap HTTP request yang masuk ke backend melewati middleware stack berikut secara berurutan. Jika salah satu middleware menolak, request dihentikan dan response error dikembalikan — middleware selanjutnya tidak dieksekusi.

```
Request Masuk
    │
    ▼
[1] Request Logging Middleware
    │  → Log semua incoming request (IP, method, path, timestamp)
    │
    ▼
[2] Rate Limiting Middleware
    │  → Cek rate limit per IP dan per user
    │  → Jika exceed: 429 Too Many Requests
    │
    ▼
[3] JWT Authentication Middleware
    │  → Ekstrak token dari header Authorization: Bearer {token}
    │  → Validasi signature, expiry, dan issuer token
    │  → Jika invalid/expired: 401 Unauthorized
    │  → Inject user context (userId, role, branchId, deptId, permissions[]) ke request object
    │
    ▼
[4] Session Validation Middleware
    │  → Verifikasi token ada di whitelist session aktif (tabel active_sessions)
    │  → Cek apakah user masih aktif (is_active = true)
    │  → Jika user dinonaktifkan atau session tidak valid: 401 Unauthorized
    │
    ▼
[5] Route Permission Middleware
    │  → Cek apakah role user memiliki permission yang diperlukan untuk endpoint ini
    │  → Permission required didefinisikan per route di route config
    │  → Jika tidak memiliki permission: 403 Forbidden
    │
    ▼
[6] Request Body Validation Middleware
    │  → Validasi schema request body (tipe data, format, required field)
    │  → Jika invalid: 422 Unprocessable Entity
    │
    ▼
[7] Controller Handler
    │  → Panggil service layer yang relevan
    │
    ▼
[8] Response Formatter Middleware
    │  → Format response sesuai standar (lihat dokumen 056)
    │  → Log response code dan duration
    │
    ▼
Response Keluar
```

### 6.2 JWT Authentication Middleware — Detail Implementasi

**Token Extraction:**
```
Header format: Authorization: Bearer <jwt_token>
Fallback: HttpOnly Cookie dengan nama 'kinetic_session' (jika header tidak ada)
```

**Token Payload yang Divalidasi:**
```json
{
  "sub": "user_id",
  "role": "cabang",
  "branchId": "branch_uuid",
  "deptId": "dept_uuid_or_null",
  "permissions": ["prospect.read", "prospect.create", "project.read"],
  "iat": 1719000000,
  "exp": 1719086400,
  "jti": "unique_token_id",
  "iss": "kinetic-crm-api"
}
```

**Validasi yang Dilakukan:**
1. Signature validasi dengan secret key (HS256 minimum, RS256 direkomendasikan untuk produksi)
2. `exp` field: token tidak expired
3. `iss` field: issuer = "kinetic-crm-api"
4. `jti` field: token ID ada di whitelist (tabel `active_sessions.token_jti`)

**Jika validasi gagal:** Response `401 Unauthorized` dengan body:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_INVALID",
    "message": "Token tidak valid atau telah kedaluwarsa. Silakan login ulang."
  }
}
```

### 6.3 Session Validation Middleware — Detail Implementasi

Setelah JWT valid secara cryptographic, middleware ini memverifikasi bahwa session masih aktif di server-side. Ini diperlukan untuk skenario: user yang token-nya belum expired tetapi sudah dinonaktifkan oleh admin, atau user yang logout dari device lain.

**Query yang Dilakukan:**
```sql
SELECT s.id, u.is_active, u.role_id
FROM active_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.token_jti = :jti
  AND s.expires_at > NOW()
  AND s.revoked_at IS NULL
  AND u.is_active = true
LIMIT 1;
```

**Jika session tidak ditemukan atau user tidak aktif:** Response `401 Unauthorized`:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_SESSION_INVALID",
    "message": "Sesi tidak valid. Silakan login ulang."
  }
}
```

### 6.4 Route Permission Middleware — Detail Implementasi

Setiap route mendefinisikan permission yang diperlukan dalam route configuration:

```javascript
// Contoh route configuration
router.get('/api/v1/prospects', 
  requirePermission('prospect.read'),
  prospectController.list
);

router.post('/api/v1/prospects',
  requirePermission('prospect.create'),
  prospectController.create
);

router.post('/api/v1/prospects/:id/approve',
  requirePermission('prospect.approve'),
  prospectController.approve
);

router.get('/api/v1/reports/win-loss',
  requirePermission('report.read'),
  reportController.winLoss
);
```

**Fungsi `requirePermission(permission)`:**
```
1. Ambil permissions[] dari user context (diinject oleh JWT middleware)
2. Cek apakah permission yang diperlukan ada dalam array permissions[]
3. Jika ada: lanjutkan ke handler
4. Jika tidak ada: return 403 Forbidden
```

**Response 403:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_INSUFFICIENT_PERMISSION",
    "message": "Anda tidak memiliki izin untuk melakukan aksi ini.",
    "required_permission": "prospect.create"
  }
}
```

**Catatan Penting:** Permission array dalam token di-generate saat login berdasarkan role user yang aktif saat itu. Jika Admin mengubah permission role di tengah session aktif, perubahan baru berlaku setelah user login ulang atau token di-refresh. Admin dapat force-logout user dari panel administrasi untuk enforcement perubahan segera.

### 6.5 Permission Loading Strategy

**Saat Login:**
```
1. User submit credentials
2. Authenticate username/password
3. Load role dari users.role_id → roles table
4. Load permissions[] dari role_permissions table WHERE role_id = user.role_id
5. Embed permissions[] ke JWT payload
6. Return token ke client
```

**Caching di Server Side:**
- Permission set per role di-cache di in-memory cache (Redis atau aplikasi-level cache)
- Cache TTL: 5 menit
- Cache invalidated when: admin mengubah permission role via modul konfigurasi
- Cache key: `perm:role:{role_id}`

---

## 7. API ENFORCEMENT

### 7.1 Endpoint Protection Layer

Setiap endpoint API KINETIC CRM dilindungi dengan kombinasi tiga mekanisme:

**Mekanisme 1: Route-Level Permission** (didefinisikan di route config, lihat 6.4)
Menentukan permission minimum yang diperlukan untuk mengakses endpoint.

**Mekanisme 2: Request-Level Scope Injection** (diterapkan di controller/service)
Untuk endpoint yang mengembalikan list data, scope filter diinject secara otomatis berdasarkan role:

```javascript
// Contoh: GET /api/v1/prospects
function buildScopeFilter(userContext) {
  if (userContext.role === 'cabang') {
    return { branch_id: userContext.branchId };
  }
  if (userContext.role === 'dept') {
    // dept tidak punya akses ke prospects sama sekali
    throw new ForbiddenError('AUTHORIZATION_NO_ACCESS');
  }
  // pm, mgmt, admin: no additional filter
  return {};
}
```

**Mekanisme 3: Resource-Level Ownership Check** (diterapkan di service layer)
Untuk operasi pada resource spesifik (UPDATE, DELETE, approve individual resource), service layer memvalidasi kepemilikan sebelum eksekusi:

```javascript
// Contoh: PUT /api/v1/prospects/:id
async function updateProspect(id, data, userContext) {
  const prospect = await db.prospects.findById(id);
  
  if (!prospect) throw new NotFoundError('PROSPECT_NOT_FOUND');
  
  // Ownership check untuk role cabang
  if (userContext.role === 'cabang') {
    if (prospect.branch_id !== userContext.branchId) {
      throw new ForbiddenError('AUTHORIZATION_NOT_OWNER');
    }
    // Tambahan: hanya boleh edit jika status draft atau revision
    if (!['draft', 'revision'].includes(prospect.status)) {
      throw new ForbiddenError('AUTHORIZATION_STATUS_LOCKED');
    }
  }
  
  // Proceed with update
  return await db.prospects.update(id, data);
}
```

### 7.2 Authorization Flow Per Request Type

#### GET List Request (Fetch Collection)

```
Client → API → [Auth Middleware] → [Permission: resource.read] → Controller
   → buildScopeFilter(userContext) → Service.list(filter + scopeFilter)
   → DB Query dengan WHERE scope
   → Response (hanya data dalam scope)
```

#### GET Single Resource Request

```
Client → API → [Auth Middleware] → [Permission: resource.read] → Controller
   → Service.findById(id)
   → DB Query: SELECT WHERE id = :id
   → ownershipCheck(resource, userContext)   ← Jika TIDAK owner: 403
   → Response (resource data)
```

#### POST Create Request

```
Client → API → [Auth Middleware] → [Permission: resource.create] → [Validate Body]
   → Controller → Service.create(data, userContext)
   → Auto-inject: branch_id = userContext.branchId (untuk resource yang scoped)
   → DB Insert
   → Response (created resource)
```

#### PUT/PATCH Update Request

```
Client → API → [Auth Middleware] → [Permission: resource.update] → [Validate Body]
   → Controller → Service.findById(id)
   → ownershipCheck(resource, userContext)   ← Jika TIDAK owner: 403
   → stateTransitionCheck(resource.status, action)   ← Jika state locked: 403
   → DB Update
   → Response (updated resource)
```

#### POST State Transition Request (approve, reject, submit, cancel)

```
Client → API → [Auth Middleware] → [Permission: resource.{action}] → Controller
   → Service.findById(id)
   → ownershipCheck atau approverCheck(resource, userContext)
   → preconditionCheck(resource, action)   ← Business rule validation
   → stateMachineTransition(resource, action, userContext)
   → DB Update status + Insert ke timeline_events
   → Trigger notifications
   → Response
```

### 7.3 Access Denied Handling

**Standarisasi Error Response untuk Authorization Failure:**

| HTTP Code | Error Code | Kondisi |
|---|---|---|
| 401 | `AUTH_TOKEN_MISSING` | Header Authorization tidak ada |
| 401 | `AUTH_TOKEN_INVALID` | Token tidak valid atau expired |
| 401 | `AUTH_SESSION_INVALID` | Session tidak aktif di server-side |
| 403 | `AUTHORIZATION_INSUFFICIENT_PERMISSION` | Role tidak memiliki permission yang diperlukan |
| 403 | `AUTHORIZATION_NOT_OWNER` | User bukan pemilik resource yang diakses |
| 403 | `AUTHORIZATION_NO_ACCESS` | Role tidak memiliki akses ke resource type ini sama sekali |
| 403 | `AUTHORIZATION_STATUS_LOCKED` | Operasi tidak diizinkan pada status resource saat ini |
| 403 | `AUTHORIZATION_APPROVAL_NOT_ASSIGNED` | User mencoba approve tetapi approval tidak diassign ke user ini |
| 403 | `AUTHORIZATION_PRECONDITION_FAILED` | Business rule precondition tidak terpenuhi |

**Format Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_INSUFFICIENT_PERMISSION",
    "message": "Anda tidak memiliki izin untuk melakukan aksi ini.",
    "details": {
      "required_permission": "report.export",
      "user_role": "cabang"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-06-01T10:30:00Z"
  }
}
```

**Penting — Security Through Obscurity Prevention:**
Untuk resource yang tidak ditemukan, sistem TIDAK membedakan antara "resource tidak ada" dan "resource ada tapi user tidak punya akses". Kedua kondisi ini mengembalikan:
- Jika user tidak punya permission: **403** (sebelum query DB)
- Jika user punya permission tapi resource tidak ditemukan: **404**
- Jika user punya permission tapi bukan owner: **403** (bukan 404)

Ini mencegah user mendeteksi keberadaan resource yang bukan miliknya melalui perbedaan response code.

---

## 8. SERVICE LAYER ENFORCEMENT

Service layer adalah lapisan enforcement kedua setelah middleware. Service layer bertanggung jawab atas business rule enforcement yang lebih kompleks dari sekedar permission check.

### 8.1 Prinsip Service Layer Authorization

1. **Tidak pernah percaya input middleware sepenuhnya.** Service layer melakukan validasi ulang kepemilikan resource dari database, bukan dari data yang dikirim client.
2. **Setiap service method menerima `userContext` sebagai parameter eksplisit.** Tidak ada akses ke "global user" via global variable.
3. **State machine enforcement adalah tanggung jawab service layer.** Transisi status hanya diizinkan sesuai state machine yang didefinisikan di dokumen 013.
4. **Business rule precondition diperiksa sebelum modifikasi data.**

### 8.2 Contoh Pattern: Approval Service

```javascript
class ApprovalService {
  async approve(approvalId, decision, comment, userContext) {
    // 1. Load approval dari DB (tidak percaya approvalId yang dikirim saja)
    const approval = await db.approvals.findById(approvalId);
    if (!approval) throw new NotFoundError('APPROVAL_NOT_FOUND');

    // 2. Verifikasi bahwa approval ini memang diassign ke user ini
    if (approval.assigned_to_user_id !== userContext.userId &&
        approval.assigned_to_role !== userContext.role) {
      throw new ForbiddenError('AUTHORIZATION_APPROVAL_NOT_ASSIGNED');
    }

    // 3. Verifikasi approval belum diproses
    if (approval.status !== 'pending') {
      throw new ConflictError('APPROVAL_ALREADY_PROCESSED');
    }

    // 4. Load resource yang di-approve untuk precondition check
    const resource = await this.loadResource(approval.resource_type, approval.resource_id);
    
    // 5. Business rule: untuk approve LPHS, semua dept sebelumnya harus sudah approve
    if (approval.stage === 'management_final_approval') {
      const pendingDeptApprovals = await db.approvals.countPending({
        resource_id: approval.resource_id,
        stage: 'dept_review'
      });
      if (pendingDeptApprovals > 0) {
        throw new PreconditionFailedError('LPHS_DEPT_APPROVALS_PENDING');
      }
    }

    // 6. Execute approval
    await db.approvals.update(approvalId, {
      status: decision,
      comment: comment,
      decided_by: userContext.userId,
      decided_at: new Date()
    });

    // 7. Trigger state machine transition
    await this.stateMachine.transition(resource, decision === 'approved' ? 'approval_granted' : 'approval_rejected');

    // 8. Trigger notifications (async)
    await notificationService.triggerApprovalDecision(approval, decision);

    // 9. Log ke audit trail
    await auditService.log({
      actor_id: userContext.userId,
      action: `approval.${decision}`,
      resource_type: approval.resource_type,
      resource_id: approval.resource_id,
      metadata: { comment, stage: approval.stage }
    });
  }
}
```

### 8.3 Data Scope Injection Pattern

Seluruh service method yang mengembalikan list data wajib menggunakan `ScopeBuilder`:

```javascript
class ScopeBuilder {
  static buildProjectScope(userContext) {
    const scope = {};
    
    switch (userContext.role) {
      case 'cabang':
        scope.branch_id = userContext.branchId;
        break;
      case 'dept':
        // dept hanya lihat proyek yang melibatkan deptnya
        scope._deptReviewFilter = userContext.deptId;
        break;
      case 'pm':
      case 'mgmt':
      case 'admin':
        // no scope restriction
        break;
      default:
        throw new ForbiddenError('AUTHORIZATION_NO_ACCESS');
    }
    
    return scope;
  }

  static buildProspectScope(userContext) {
    if (userContext.role === 'cabang') {
      return { branch_id: userContext.branchId };
    }
    if (['pm', 'admin'].includes(userContext.role)) {
      return {}; // no filter
    }
    throw new ForbiddenError('AUTHORIZATION_NO_ACCESS');
  }
}

// Usage in service
class ProjectService {
  async list(filters, userContext) {
    const scopeFilter = ScopeBuilder.buildProjectScope(userContext);
    return db.projects.findAll({ ...filters, ...scopeFilter });
  }
}
```

---

## 9. DATABASE ENFORCEMENT

### 9.1 Prinsip Database Layer Authorization

Database layer adalah pertahanan terakhir (defense in depth). Meskipun service layer sudah melakukan enforcement, database layer menambahkan lapisan tambahan yang tidak dapat di-bypass meskipun ada bug di application layer.

### 9.2 Row-Level Security (RLS)

**Implementasi:** Jika menggunakan PostgreSQL, Row-Level Security diterapkan pada tabel-tabel yang memiliki data scope:

```sql
-- Enable RLS pada tabel projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy untuk cabang: hanya bisa lihat projects milik branch sendiri
CREATE POLICY projects_branch_isolation ON projects
  FOR ALL
  TO app_role_cabang
  USING (branch_id = current_setting('app.current_branch_id')::uuid);

-- Policy untuk PM dan mgmt: akses semua
CREATE POLICY projects_full_access ON projects
  FOR ALL
  TO app_role_pm, app_role_mgmt, app_role_admin
  USING (true);
```

**Catatan Implementasi:** Application layer wajib memanggil `SET LOCAL app.current_branch_id = '{branch_id}'` di awal setiap transaction setelah autentikasi, sehingga RLS policy dapat membaca konteks user.

**Inferred Requirement IR-020-01:** Jika backend tidak menggunakan PostgreSQL (misalnya MySQL yang tidak mendukung RLS native), enforcement harus dilakukan sepenuhnya di service layer melalui ScopeBuilder pattern (lihat 8.3) dengan mandatory code review untuk setiap query yang menghilangkan scope filter. Alasannya: RLS adalah defense-in-depth, bukan pengganti service layer enforcement.

### 9.3 Ownership Validation di Query Level

Setiap UPDATE dan DELETE query wajib menyertakan ownership condition di WHERE clause, bukan hanya `WHERE id = :id`:

```sql
-- BENAR: Ownership enforced di query
UPDATE prospects 
SET title = :title, updated_at = NOW()
WHERE id = :id 
  AND branch_id = :branchId  -- ownership check
  AND status IN ('draft', 'revision');  -- state check

-- SALAH: Ownership tidak dicek di DB (rentan terhadap IDOR)
UPDATE prospects SET title = :title WHERE id = :id;
```

Query harus mengembalikan jumlah row yang terdampak. Jika `affected_rows = 0`, artinya:
- Resource tidak ditemukan, ATAU
- Resource ada tapi bukan milik user ini, ATAU
- Status resource tidak memungkinkan operasi ini

Service layer mengembalikan 404 Not Found untuk ketiga kondisi ini (tidak membocorkan informasi).

### 9.4 Sensitive Data Access Control

Data berikut dikategorikan sebagai sensitive dan memerlukan penanganan khusus:

| Data | Batasan Akses | Implementasi |
|---|---|---|
| `users.password_hash` | Tidak pernah dikembalikan ke client | Di-exclude dari SELECT * secara default; hanya digunakan internal untuk validasi |
| `users.password_reset_token` | Hanya diakses oleh reset password flow | Query dedicated, tidak via standard user SELECT |
| `config.integration_api_keys` | Hanya admin, tidak dikembalikan dalam plain text | Dienkripsi di database, hanya di-decrypt saat digunakan server-side |
| `documents` (file path) | Path fisik file tidak pernah dikembalikan | Client menerima URL presigned/signed, bukan path filesystem |
| `audit_logs` | Read-only, hanya admin | Tidak ada UPDATE/DELETE endpoint |
| `active_sessions.token_jti` | Internal only | Tidak pernah dikembalikan via API |

### 9.5 Database User Privilege Separation

Inferred Requirement IR-020-02: Database harus dikonfigurasi dengan user terpisah per layer akses:

```
app_read_write_user   → SELECT, INSERT, UPDATE pada tabel bisnis (digunakan oleh application)
app_read_only_user    → SELECT only (digunakan oleh reporting queries)
app_migration_user    → CREATE, ALTER, DROP (hanya digunakan saat deployment migration)
app_audit_user        → SELECT pada audit_logs (read-only, untuk report audit)
```

Alasan: Jika ada SQL injection yang berhasil melewati application layer, permission database user yang terbatas meminimalkan dampak.

### 9.6 Soft Delete & Data Retention

Seluruh entitas bisnis yang di-"hapus" menggunakan soft delete:

```sql
-- Soft delete: tidak benar-benar menghapus data
UPDATE prospects SET deleted_at = NOW(), deleted_by = :userId WHERE id = :id;

-- Query standar selalu exclude soft-deleted records
SELECT * FROM prospects WHERE deleted_at IS NULL AND branch_id = :branchId;
```

Hard delete (DELETE FROM) hanya dilakukan oleh proses maintenance terjadwal pada data yang sudah melewati retention period yang dikonfigurasi.

---

## 10. AUDIT LOGGING ENFORCEMENT

### 10.1 Prinsip Audit Logging

Setiap access decision (grant atau deny) dan setiap operasi yang mengubah data dicatat di audit log. Audit log bersifat **append-only** — tidak ada UPDATE atau DELETE yang diizinkan pada tabel `audit_logs`.

### 10.2 Events yang Wajib Dicatat

| Kategori | Event | Data yang Dicatat |
|---|---|---|
| **Authentication** | Login berhasil | userId, IP, userAgent, timestamp |
| **Authentication** | Login gagal | username yang dicoba, IP, userAgent, timestamp |
| **Authentication** | Logout | userId, timestamp |
| **Authentication** | Token refresh | userId, old_jti, new_jti, timestamp |
| **Authorization** | Access denied | userId, resource, action, reason_code, IP, timestamp |
| **Data Creation** | Prospect created | userId, prospect_id, branch_id, timestamp |
| **Data Creation** | Project created | userId, project_id, branch_id, timestamp |
| **State Change** | Prospect status berubah | userId, prospect_id, from_status, to_status, timestamp |
| **State Change** | Project status berubah | userId, project_id, from_status, to_status, timestamp |
| **Approval** | Approval diberikan | userId, approval_id, resource_type, resource_id, decision, comment, timestamp |
| **Data Modification** | Record diupdate | userId, table_name, record_id, before (JSON), after (JSON), timestamp |
| **Document** | Dokumen diupload | userId, document_id, resource_type, resource_id, file_name, timestamp |
| **Document** | Dokumen didownload | userId, document_id, resource_id, timestamp |
| **Config Change** | Konfigurasi diubah | userId, config_key, old_value, new_value, timestamp |
| **User Management** | User dibuat/diubah/dinonaktifkan | adminId, target_userId, action, changes (JSON), timestamp |
| **Session** | User di-force-logout | adminId, target_userId, reason, timestamp |

### 10.3 Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role    VARCHAR(50) NOT NULL,
  action        VARCHAR(100) NOT NULL,  -- format: resource.action
  resource_type VARCHAR(100),
  resource_id   UUID,
  branch_id     UUID REFERENCES branches(id) ON DELETE SET NULL,
  ip_address    INET NOT NULL,
  user_agent    TEXT,
  payload_before JSONB,  -- state sebelum perubahan
  payload_after  JSONB,  -- state setelah perubahan
  metadata      JSONB,   -- context tambahan (filter params, reason, dll.)
  result        VARCHAR(20) NOT NULL CHECK (result IN ('success', 'denied', 'error')),
  error_code    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query performa
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 10.4 Audit Log Write Pattern

Audit log ditulis secara **synchronous** dalam transaction yang sama dengan operasi bisnis, untuk memastikan konsistensi. Jika audit log gagal ditulis, operasi bisnis juga di-rollback.

**Pengecualian:** Logging "access denied" pada middleware level ditulis secara asynchronous (non-blocking) karena volume tinggi dan tidak memerlukan transactional consistency dengan operasi bisnis.

```javascript
// Pattern: Audit dalam transaction
async function createProspect(data, userContext) {
  return db.transaction(async (trx) => {
    // 1. Insert prospect
    const prospect = await trx.prospects.insert(data);
    
    // 2. Insert audit log dalam transaction yang sama
    await trx.audit_logs.insert({
      actor_id: userContext.userId,
      actor_role: userContext.role,
      action: 'prospect.create',
      resource_type: 'prospect',
      resource_id: prospect.id,
      branch_id: userContext.branchId,
      ip_address: userContext.ipAddress,
      payload_after: prospect,
      result: 'success'
    });
    
    return prospect;
  });
}
```

### 10.5 Audit Log Tampering Prevention

1. **No UPDATE/DELETE:** Tabel `audit_logs` tidak memiliki UPDATE atau DELETE endpoint di API manapun, termasuk untuk admin.
2. **Database constraint:** Database user `app_read_write_user` hanya memiliki INSERT dan SELECT pada tabel `audit_logs`, tidak UPDATE atau DELETE.
3. **Immutability check:** Periodic job (harian) menghitung hash dari batch audit log dan menyimpannya terpisah untuk deteksi tampering.
4. **Retensi terjadwal:** Penghapusan audit log lama (setelah melewati retention period) hanya dapat dilakukan oleh proses database maintenance dengan `app_migration_user`, bukan via API.

---

## 11. SECURITY CONSIDERATIONS

### 11.1 Insecure Direct Object Reference (IDOR) Prevention

**Ancaman:** User mengirim ID resource yang bukan miliknya untuk mengakses atau memodifikasi data orang lain.

**Mitigasi yang Diimplementasikan:**
- Setiap query UPDATE/DELETE menyertakan ownership filter di WHERE clause (lihat 9.3)
- Menggunakan UUID sebagai ID resource (bukan integer sequential yang mudah ditebak)
- Service layer selalu memvalidasi kepemilikan dari database sebelum operasi
- `affected_rows = 0` diperlakukan sebagai not found atau forbidden, bukan error terpisah

### 11.2 Privilege Escalation Prevention

**Ancaman:** User memanipulasi request untuk mengklaim role atau permission yang lebih tinggi.

**Mitigasi:**
- Role dan permissions diambil dari database saat login, bukan dari input user
- JWT payload divalidasi signature cryptographic; modifikasi payload menyebabkan signature invalid
- Setiap endpoint melakukan permission check dari server-side state, tidak dari claim dalam request body
- Admin tidak dapat mengubah role dirinya sendiri (pencegahan lockout dan privilege escalation bersamaan)

### 11.3 Horizontal Privilege Escalation Prevention

**Ancaman:** User dari branch A mengakses data branch B menggunakan ID resource yang valid.

**Mitigasi:**
- Scope filter wajib di semua query collection (mandatory, bukan optional)
- Ownership check mandatory di semua single resource access
- Monitoring anomali: alert jika user mengakses banyak resource berbeda dalam waktu singkat

### 11.4 JWT Token Security

- Secret key minimum 256 bit, di-rotate setiap 90 hari
- Token expiry: 8 jam (access token), 7 hari (refresh token) — nilai ini dikonfigurasi via CFG
- Blacklist token yang di-logout sebelum expiry (via `active_sessions` table)
- Token tidak disimpan di localStorage frontend (risiko XSS) — menggunakan HttpOnly cookie sebagai primary storage

### 11.5 Mass Assignment Prevention

**Ancaman:** Client mengirim field tambahan dalam request body yang tidak seharusnya bisa dimodifikasi (misalnya `branch_id`, `status`, `role`).

**Mitigasi:**
- Menggunakan DTO (Data Transfer Object) atau schema validation yang hanya mengizinkan field yang diketahui (whitelist)
- Field seperti `branch_id`, `created_by`, `status`, `role` tidak pernah diambil dari request body user — selalu diinject dari `userContext` atau state machine

### 11.6 Sensitive Operation Confirmation

Operasi yang berdampak besar (delete, cancel project, force logout user, reset password) memerlukan:
- Konfirmasi eksplisit dari user (client mengirim field `confirm: true` dalam request body)
- Re-autentikasi untuk operasi admin yang sangat sensitif (misal: mengubah permission role default)
- Rate limiting khusus untuk endpoint delete dan bulk operations

---

## 12. INFERRED REQUIREMENTS

### IR-020-01: MySQL Fallback untuk Row-Level Security
**Deskripsi:** Jika database yang digunakan tidak mendukung RLS native (MySQL < 8.0), enforcement scope data wajib dilakukan sepenuhnya di service layer via ScopeBuilder pattern. Seluruh query yang mengembalikan data bisnis harus melalui scope filter mandatory — tidak ada bypass.
**Alasan:** BA Review tidak menyebutkan database engine spesifik, dan FE Spec menyebut Docker sebagai deployment strategy. Defense in depth harus dijamin di application layer jika DB layer tidak mendukungnya.

### IR-020-02: Database User Privilege Separation
**Deskripsi:** Database harus dikonfigurasi dengan minimal tiga user berbeda: `app_user` (read/write bisnis), `app_readonly_user` (reporting), `app_migration_user` (DDL saat deployment). Tidak ada user yang memiliki privilege SUPERUSER atau DROP pada environment production.
**Alasan:** BA Review menyebutkan keamanan sebagai concern (GAP pada security architecture); principle of least privilege harus diterapkan di semua layer.

### IR-020-03: Permission Cache Invalidation
**Deskripsi:** Saat Admin mengubah permission untuk sebuah role, cache permission untuk role tersebut wajib di-invalidate segera. Semua session aktif yang menggunakan role tersebut akan mendapatkan permission baru pada next request (token refresh atau pada JWT expiry berikutnya).
**Alasan:** Tanpa cache invalidation, perubahan permission tidak efektif sampai token expire, yang dapat berlangsung hingga 8 jam. Ini menciptakan window of vulnerability.

### IR-020-04: Forced Re-Authentication untuk Perubahan Role
**Deskripsi:** Jika Admin mengubah role user yang sedang aktif, semua session aktif user tersebut harus di-revoke segera. User dipaksa login ulang dengan role baru.
**Alasan:** JWT mengandung role dalam payload yang terenkripsi. Perubahan role tidak akan berlaku sampai token diperbarui. Revoke session adalah cara yang tepat untuk enforce perubahan role segera.

### IR-020-05: Audit Log untuk Access Denied
**Deskripsi:** Semua access denied event (HTTP 403) wajib dicatat di audit log, termasuk detail resource yang dicoba diakses, user yang mencoba, dan timestamp.
**Alasan:** Pola access denied berulang dari satu user dapat mengindikasikan percobaan reconnaissance atau exploitasi IDOR. Tanpa logging ini, insiden keamanan tidak dapat dideteksi.

---

## 13. ACCEPTANCE CRITERIA

### AC-020-01: Isolation Cabang
- **Scenario:** User dengan role `cabang` (branch_id = B1) mencoba mengakses GET /api/v1/prospects?branchId=B2
- **Expected:** Response berisi hanya data dari B1, tidak ada data B2, HTTP 200
- **Verify:** Log tidak menunjukkan query ke data B2

### AC-020-02: Permission Enforcement
- **Scenario:** User dengan role `cabang` mengirim POST /api/v1/reports/win-loss/export
- **Expected:** HTTP 403, body `{"error": {"code": "AUTHORIZATION_INSUFFICIENT_PERMISSION"}}`
- **Verify:** Audit log mencatat access denied event

### AC-020-03: IDOR Prevention
- **Scenario:** User cabang B1 mengirim PUT /api/v1/projects/{project_id_dari_B2} dengan body yang valid
- **Expected:** HTTP 403, body `{"error": {"code": "AUTHORIZATION_NOT_OWNER"}}`
- **Verify:** Data project B2 tidak berubah; audit log mencatat akses ditolak

### AC-020-04: Status Lock Enforcement
- **Scenario:** User cabang mengirim PUT /api/v1/prospects/{prospect_id} di mana prospect sudah berstatus `approved`
- **Expected:** HTTP 403, body `{"error": {"code": "AUTHORIZATION_STATUS_LOCKED"}}`
- **Verify:** Data prospect tidak berubah

### AC-020-05: Approval Assignment Enforcement
- **Scenario:** User PM_A (bukan PM yang diassign) mencoba POST /api/v1/approvals/{approval_id}/decide
- **Expected:** HTTP 403, body `{"error": {"code": "AUTHORIZATION_APPROVAL_NOT_ASSIGNED"}}`
- **Verify:** Approval status tidak berubah

### AC-020-06: Dept Scope Enforcement
- **Scenario:** User dengan role `dept` (dept_id = D1) mengakses GET /api/v1/projects/{project_id} di mana project tersebut tidak memerlukan review dari D1
- **Expected:** HTTP 403 atau HTTP 404 (resource outside scope)
- **Verify:** Project data tidak dikembalikan

### AC-020-07: Management Approval Precondition
- **Scenario:** User mgmt mencoba approve LPHS di mana masih ada dept yang pending approval
- **Expected:** HTTP 422, body `{"error": {"code": "LPHS_DEPT_APPROVALS_PENDING"}}`
- **Verify:** LPHS status tidak berubah; jumlah pending dept approval tidak berkurang

### AC-020-08: Expired Token Rejection
- **Scenario:** Client mengirim request dengan JWT yang sudah expired
- **Expected:** HTTP 401, body `{"error": {"code": "AUTH_TOKEN_INVALID"}}`
- **Verify:** Tidak ada query yang dieksekusi ke DB bisnis

### AC-020-09: Revoked Session Rejection
- **Scenario:** Admin melakukan force logout terhadap user; user mencoba menggunakan token lama yang masih dalam window validity
- **Expected:** HTTP 401, body `{"error": {"code": "AUTH_SESSION_INVALID"}}`
- **Verify:** Session record di `active_sessions` tidak ada atau `revoked_at` terisi

### AC-020-10: Audit Log Completeness
- **Scenario:** Jalankan 10 operasi campuran (create prospect, update project, approve LPHS, access denied, dll.)
- **Expected:** Setiap operasi menghasilkan tepat satu atau lebih record di `audit_logs`
- **Verify:** Count audit_logs sebelum dan sesudah operasi selisih sesuai jumlah operasi; tidak ada operasi yang terlewat
