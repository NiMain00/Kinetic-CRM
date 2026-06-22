# 057 — FULL API ENDPOINT SPECIFICATION
## KINETIC CRM — Kontrak Resmi Seluruh Endpoint API

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 057 |
| **Nama Dokumen** | Full API Endpoint Specification |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0 |
| **Dokumen Terkait** | 020 (Authorization Enforcement Spec), 056 (API Conventions and Standards), 013 (Global State Machine Reference), 010/011 (AI Integration), 014 (UI Screen Catalog) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Frontend Team, Backend Team, QA Team, Integration Team, Technical Writer

---

## 1. PURPOSE

Dokumen ini adalah **kontrak resmi dan tunggal** untuk seluruh endpoint REST API KINETIC CRM. Dokumen ini menjawab pertanyaan "apa yang dapat dikirim ke server dan apa yang akan dikembalikan", terlepas dari bagaimana implementasi internal backend dilakukan. Setiap endpoint mendefinisikan method, otorisasi yang dibutuhkan, parameter, schema body, schema response sukses dan gagal, validasi, dan business rule yang relevan.

Dokumen ini **tidak** menjelaskan implementasi kode backend (lihat dokumen arsitektur backend internal tim engineering) dan **tidak** mengulang detail enforcement otorisasi end-to-end (lihat **020_AUTHORIZATION_ENFORCEMENT_SPEC.md**) — dokumen ini hanya menyatakan permission apa yang dibutuhkan per endpoint, bukan bagaimana permission tersebut di-enforce di setiap layer.

---

## 2. SCOPE

### In Scope
- Konvensi REST, error, pagination, filtering, sorting, versioning
- Format response standar (success, error, validation error)
- Kontrak lengkap endpoint untuk seluruh domain: Authentication, Users, Roles, Permissions, Dashboard, Prospects, Projects, RKS, LPHS/SIOS, Harga & Kompetitor, Pemenang & Delivery, Approvals, Master Data, Configuration, Notifications, Reports, Attachments/Documents, Audit Logs, dan AI Endpoints
- Endpoint implisit yang dibutuhkan agar BA Review terpenuhi penuh (state transition, revisi tertarget, backup approver, dll.)

### Out of Scope
- Detail middleware/service/DB enforcement → 020
- Detail UI per screen → 014
- Detail arsitektur AI Service Layer internal → 010

---

## 3. API STANDARDS

### 3.1 REST Convention

- Base URL: `https://{host}/api/v1`
- Resource dinamai plural, lowercase, kebab-case untuk multi-kata: `/prospects`, `/projects`, `/lphs-sios`, `/question-types`
- Method HTTP sesuai semantik standar:

| Method | Penggunaan |
|---|---|
| `GET` | Membaca resource (collection atau single) — tidak ada side effect |
| `POST` | Membuat resource baru, atau memicu aksi/state-transition (`/approve`, `/submit`, `/cancel`) |
| `PUT` | Mengganti seluruh resource (replace) |
| `PATCH` | Mengubah sebagian field resource (partial update) |
| `DELETE` | Soft-delete resource (lihat 020 §9.6) |

- Nested resource maksimum 2 level: `/projects/{id}/documents`, bukan `/companies/{id}/branches/{id}/projects/{id}/documents`.
- Aksi yang bukan CRUD murni direpresentasikan sebagai sub-resource verb: `POST /prospects/{id}/submit`, `POST /rks/{id}/approve`, `POST /projects/{id}/cancel`.

### 3.2 Error Convention

Lihat Bagian 4.2 untuk format lengkap. Kode error mengikuti pola `{DOMAIN}_{REASON}` dalam UPPER_SNAKE_CASE, contoh: `PROSPECT_NOT_FOUND`, `RKS_INVALID_STATE_TRANSITION`, `AUTH_TOKEN_INVALID` (kode otorisasi mengikuti katalog di 020 §7.3).

### 3.3 Pagination Convention

Seluruh endpoint collection menggunakan **offset-based pagination** sebagai standar Fase 1:

**Query Parameters:**
| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | integer | 1 | Halaman ke-N, mulai dari 1 |
| `perPage` | integer | 20 | Jumlah item per halaman. Maksimum 100 |

**Response Meta:**
```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "totalItems": 145,
      "totalPages": 8
    }
  }
}
```

**Inferred Requirement IR-057-01:** FE Spec menetapkan selector pagination 10/20/50 (lihat 5.1 Daftar Prospek). Maka `perPage` harus menerima nilai dari set `{10, 20, 50, 100}`; nilai lain ditolak dengan `422 VALIDATION_ERROR` pada field `perPage`. Alasan: konsistensi UI dengan kontrak backend agar tidak terjadi nilai sembarang yang membebani server.

### 3.4 Filtering Convention

Filter dikirim sebagai query parameter langsung (bukan nested object), contoh:
```
GET /api/v1/prospects?status=waiting_pm_approval&search=gedung&dateFrom=2025-01-01&dateTo=2025-06-01
```

Aturan:
- Filter `search` melakukan pencarian case-insensitive partial match pada field yang relevan (nama, kode) — didefinisikan per endpoint.
- Filter rentang tanggal menggunakan pasangan `{field}From` dan `{field}To`, format ISO 8601 (`YYYY-MM-DD`).
- Filter status menerima single value atau comma-separated values: `status=approved,revision`.
- Filter yang tidak dikenali oleh endpoint diabaikan secara silent (tidak menyebabkan error) kecuali didokumentasikan berbeda.

### 3.5 Sorting Convention

```
GET /api/v1/projects?sortBy=createdAt&sortDir=desc
```

- `sortBy`: nama field dalam camelCase sesuai response schema. Default per endpoint didefinisikan di masing-masing kontrak.
- `sortDir`: `asc` atau `desc`. Default `desc` untuk field tanggal, `asc` untuk field nama/kode.
- Multi-sort tidak didukung di Fase 1 — hanya satu field sort aktif per request (Inferred Requirement IR-057-02: BA Review dan FE Spec tidak menyebut kebutuhan multi-column sort; satu level sort cukup untuk seluruh tabel yang terdaftar di 014_UI_SCREEN_CATALOG).

### 3.6 Versioning Convention

- Versi API dinyatakan di path: `/api/v1/...`
- Breaking change pada kontrak endpoint memerlukan versi baru (`/api/v2/...`); versi lama tetap didukung minimum 6 bulan setelah versi baru rilis (deprecation window).
- Non-breaking change (menambah field baru opsional, menambah endpoint baru) tidak memerlukan version bump.
- Header `X-API-Deprecated: true` dan `X-API-Sunset-Date: {date}` dikirim pada response endpoint yang sudah deprecated.

---

## 4. STANDARD RESPONSE STRUCTURE

### 4.1 Success Response Format

**Single Resource:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "name": "Pembangunan Gedung Kantor Cabang Surabaya"
  },
  "meta": {
    "requestId": "req_8f3a9b2c",
    "timestamp": "2025-06-10T08:15:00Z"
  }
}
```

**Collection Resource:**
```json
{
  "success": true,
  "data": [
    { "id": "a1b2c3d4-0000-0000-0000-000000000001", "name": "Prospek A" },
    { "id": "a1b2c3d4-0000-0000-0000-000000000002", "name": "Prospek B" }
  ],
  "meta": {
    "requestId": "req_8f3a9b2d",
    "timestamp": "2025-06-10T08:15:00Z",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "totalItems": 145,
      "totalPages": 8
    }
  }
}
```

### 4.2 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "PROSPECT_NOT_FOUND",
    "message": "Prospek dengan ID tersebut tidak ditemukan.",
    "details": {}
  },
  "meta": {
    "requestId": "req_8f3a9b2e",
    "timestamp": "2025-06-10T08:15:00Z"
  }
}
```

**Katalog HTTP Status Code Umum:**

| Code | Penggunaan |
|---|---|
| 200 | Sukses (GET, PUT, PATCH, POST aksi non-creation) |
| 201 | Resource berhasil dibuat (POST creation) |
| 204 | Sukses tanpa body (DELETE) |
| 400 | Bad request — request malformed (JSON tidak valid, dll.) |
| 401 | Unauthorized — autentikasi gagal (lihat 020 §7.3) |
| 403 | Forbidden — otorisasi gagal (lihat 020 §7.3) |
| 404 | Resource tidak ditemukan |
| 409 | Conflict — state tidak sesuai (contoh: approval sudah diproses) |
| 422 | Validation error / precondition gagal |
| 429 | Rate limit terlampaui |
| 500 | Internal server error |
| 503 | Service unavailable (termasuk AI provider down) |

### 4.3 Validation Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Terdapat kesalahan pada data yang dikirim.",
    "details": {
      "fields": [
        {
          "field": "name",
          "code": "FIELD_REQUIRED",
          "message": "Nama prospek wajib diisi."
        },
        {
          "field": "estimatedValue",
          "code": "FIELD_MIN_VALUE",
          "message": "Estimasi nilai tidak boleh kurang dari 0."
        }
      ]
    }
  },
  "meta": {
    "requestId": "req_8f3a9b2f",
    "timestamp": "2025-06-10T08:15:00Z"
  }
}
```

---

## 5. AUTHENTICATION ENDPOINTS

### 5.1 POST /api/v1/auth/login

**Method:** POST
**Purpose:** Autentikasi user dengan username dan password; mengembalikan JWT token dan informasi user.
**Authorization Requirement:** Public (tidak memerlukan token)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body Schema:**
```json
{
  "username": "string, required, min 3 char",
  "password": "string, required, min 8 char"
}
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-06-10T16:15:00Z",
    "user": {
      "id": "u-0001",
      "name": "Budi Santoso",
      "username": "budi.santoso",
      "role": "cabang",
      "branchId": "br-0003",
      "branchName": "Cabang Surabaya",
      "deptId": null,
      "permissions": ["prospect.create", "prospect.read", "project.read"]
    }
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Username atau password salah |
| `AUTH_ACCOUNT_LOCKED` | 423 | Akun terkunci setelah 5x gagal berturut-turut |
| `AUTH_ACCOUNT_INACTIVE` | 403 | Akun dinonaktifkan admin |
| `VALIDATION_ERROR` | 422 | Field tidak lolos validasi |

**Validation Rules:**
- `username`: required, string, 3–100 karakter
- `password`: required, string, minimum 8 karakter

**Business Rules:**
- Setelah 5 kali gagal login berturut-turut dalam 15 menit, akun terkunci otomatis selama 15 menit (FR001).
- Setiap percobaan login (sukses maupun gagal) dicatat di audit log sesuai 020 §10.2.
- Token JWT berlaku 8 jam sejak diterbitkan (dikonfigurasi via CFG-05).

---

### 5.2 POST /api/v1/auth/logout

**Method:** POST
**Purpose:** Mengakhiri sesi aktif user saat ini; merevoke token.
**Authorization Requirement:** Authenticated (semua role)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body Schema:** Tidak ada (empty body)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": { "message": "Logout berhasil." }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTH_TOKEN_INVALID` | 401 | Token tidak valid |

**Business Rules:**
- Token (`jti`) dimasukkan ke daftar revoked di tabel `active_sessions` (`revoked_at` diisi).

---

### 5.3 GET /api/v1/auth/me

**Method:** GET
**Purpose:** Mengambil data user yang sedang login berdasarkan token aktif, untuk refresh session di frontend.
**Authorization Requirement:** Authenticated (semua role)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "u-0001",
    "name": "Budi Santoso",
    "username": "budi.santoso",
    "role": "cabang",
    "branchId": "br-0003",
    "branchName": "Cabang Surabaya",
    "deptId": null,
    "permissions": ["prospect.create", "prospect.read", "project.read"]
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTH_TOKEN_INVALID` | 401 | Token tidak valid/expired |
| `AUTH_SESSION_INVALID` | 401 | Session direvoke atau user dinonaktifkan |

---

### 5.4 POST /api/v1/auth/refresh

**Method:** POST
**Purpose:** Memperbarui access token menggunakan refresh token tanpa perlu login ulang.
**Authorization Requirement:** Valid refresh token (dikirim via HttpOnly cookie)

**Request Headers:**
```
Cookie: kinetic_refresh_token={refresh_token}
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-06-11T00:15:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token tidak valid/expired/revoked |

**Business Rules:**
- Refresh token berlaku 7 hari (dikonfigurasi via CFG-05).
- Setiap refresh menerbitkan access token baru dengan permission terkini dari database (memenuhi IR-020-03).

---

### 5.5 POST /api/v1/auth/change-password

**Method:** POST
**Purpose:** User mengganti password sendiri.
**Authorization Requirement:** Authenticated (semua role)

**Request Body Schema:**
```json
{
  "currentPassword": "string, required",
  "newPassword": "string, required, min 8 char, harus mengandung huruf dan angka"
}
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": { "message": "Password berhasil diubah. Silakan login ulang." }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTH_CURRENT_PASSWORD_INCORRECT` | 422 | Password lama salah |
| `VALIDATION_ERROR` | 422 | Password baru tidak memenuhi kompleksitas |

**Validation Rules:**
- `newPassword`: minimum 8 karakter, minimum 1 huruf dan 1 angka, tidak boleh sama dengan `currentPassword`.

**Business Rules:**
- Setelah ganti password berhasil, seluruh session aktif user (kecuali session saat ini) direvoke.

---

## 6. USERS ENDPOINTS

### 6.1 GET /api/v1/users

**Method:** GET
**Purpose:** Mengambil daftar user untuk modul administrasi.
**Authorization Requirement:** Permission `user.read` (role: `admin`)

**Query Parameters:**
| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `page` | integer | tidak | Default 1 |
| `perPage` | integer | tidak | Default 20 |
| `search` | string | tidak | Partial match nama/username |
| `role` | string | tidak | Filter berdasarkan role |
| `branchId` | uuid | tidak | Filter berdasarkan cabang |
| `isActive` | boolean | tidak | Filter status aktif |
| `sortBy` | string | tidak | `name`, `createdAt`, default `createdAt` |
| `sortDir` | string | tidak | `asc`/`desc`, default `desc` |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "u-0001",
      "name": "Budi Santoso",
      "username": "budi.santoso",
      "email": "budi.santoso@kineticcrm.id",
      "role": "cabang",
      "branchId": "br-0003",
      "branchName": "Cabang Surabaya",
      "deptId": null,
      "isActive": true,
      "isLocked": false,
      "lastLoginAt": "2025-06-09T08:00:00Z",
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 20, "totalItems": 56, "totalPages": 3 } }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_INSUFFICIENT_PERMISSION` | 403 | Role bukan admin |

---

### 6.2 POST /api/v1/users

**Method:** POST
**Purpose:** Membuat user baru.
**Authorization Requirement:** Permission `user.create` (role: `admin`)

**Request Body Schema:**
```json
{
  "name": "string, required, 3-150 char",
  "username": "string, required, unique, 3-50 char, alphanumeric+dot",
  "email": "string, required, unique, valid email format",
  "password": "string, required, min 8 char",
  "role": "string, required, valid role code",
  "branchId": "uuid, required jika role=cabang",
  "deptId": "uuid, required jika role=dept",
  "isActive": "boolean, default true"
}
```

**Success Response Schema (201):**
```json
{
  "success": true,
  "data": {
    "id": "u-0099",
    "name": "Siti Aminah",
    "username": "siti.aminah",
    "email": "siti.aminah@kineticcrm.id",
    "role": "cabang",
    "branchId": "br-0005",
    "isActive": true,
    "createdAt": "2025-06-10T08:20:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `USER_USERNAME_TAKEN` | 409 | Username sudah digunakan |
| `USER_EMAIL_TAKEN` | 409 | Email sudah digunakan |
| `VALIDATION_ERROR` | 422 | Field tidak valid |
| `USER_BRANCH_REQUIRED` | 422 | Role cabang tapi branchId kosong |
| `USER_DEPT_REQUIRED` | 422 | Role dept tapi deptId kosong |

**Business Rules:**
- Password disimpan dengan hashing bcrypt/argon2, tidak pernah dalam plaintext.
- Email notifikasi pembuatan akun dikirim ke user baru (Fase 2 — lihat 047).

---

### 6.3 GET /api/v1/users/{id}

**Method:** GET
**Purpose:** Mengambil detail satu user.
**Authorization Requirement:** Permission `user.read` (role: `admin`)

**Path Parameters:** `id` (uuid, required)

**Success Response Schema (200):** Sama dengan item pada 6.1, ditambah riwayat ringkas:
```json
{
  "success": true,
  "data": {
    "id": "u-0001",
    "name": "Budi Santoso",
    "username": "budi.santoso",
    "email": "budi.santoso@kineticcrm.id",
    "role": "cabang",
    "branchId": "br-0003",
    "deptId": null,
    "isActive": true,
    "isLocked": false,
    "failedLoginCount": 0,
    "lastLoginAt": "2025-06-09T08:00:00Z",
    "createdAt": "2025-01-10T00:00:00Z",
    "updatedAt": "2025-05-01T00:00:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `USER_NOT_FOUND` | 404 | ID tidak ditemukan |

---

### 6.4 PATCH /api/v1/users/{id}

**Method:** PATCH
**Purpose:** Mengubah data user (partial update).
**Authorization Requirement:** Permission `user.update` (role: `admin`)

**Request Body Schema:**
```json
{
  "name": "string, optional",
  "email": "string, optional, unique",
  "role": "string, optional",
  "branchId": "uuid, optional",
  "deptId": "uuid, optional",
  "isActive": "boolean, optional"
}
```

**Success Response Schema (200):** Object user terbaru.

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `USER_NOT_FOUND` | 404 | ID tidak ditemukan |
| `USER_CANNOT_MODIFY_SELF_ROLE` | 403 | Admin mencoba mengubah role dirinya sendiri |
| `VALIDATION_ERROR` | 422 | Field tidak valid |

**Business Rules:**
- Jika `role`, `branchId`, atau `deptId` berubah, seluruh session aktif user tersebut direvoke (lihat IR-020-04).

---

### 6.5 DELETE /api/v1/users/{id}

**Method:** DELETE
**Purpose:** Menonaktifkan user (soft-delete).
**Authorization Requirement:** Permission `user.delete` (role: `admin`)

**Success Response Schema (204):** Empty body.

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `USER_NOT_FOUND` | 404 | ID tidak ditemukan |
| `USER_CANNOT_DELETE_SELF` | 403 | Admin mencoba menghapus dirinya sendiri |

**Business Rules:**
- Soft-delete: `deleted_at` diisi, `is_active = false`. Seluruh session direvoke.

---

### 6.6 POST /api/v1/users/{id}/reset-password

**Method:** POST
**Purpose:** Admin mereset password user lain.
**Authorization Requirement:** Permission `user.reset_password` (role: `admin`)

**Request Body Schema:**
```json
{
  "newPassword": "string, optional — jika kosong, sistem generate password acak"
}
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password berhasil direset.",
    "temporaryPassword": "Xk9#mPq2"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `USER_NOT_FOUND` | 404 | ID tidak ditemukan |

**Business Rules:**
- Seluruh session aktif user tersebut direvoke setelah reset.
- `temporaryPassword` hanya ditampilkan satu kali dalam response ini; tidak disimpan dalam bentuk apapun yang dapat dibaca ulang.

---

### 6.7 POST /api/v1/users/{id}/lock

**Method:** POST
**Purpose:** Mengunci akun user secara manual.
**Authorization Requirement:** Permission `user.lock` (role: `admin`)

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "u-0001", "isLocked": true } }
```

### 6.8 POST /api/v1/users/{id}/unlock

**Method:** POST
**Purpose:** Membuka kunci akun user.
**Authorization Requirement:** Permission `user.unlock` (role: `admin`)

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "u-0001", "isLocked": false, "failedLoginCount": 0 } }
```

---

## 7. ROLES & PERMISSIONS ENDPOINTS

### 7.1 GET /api/v1/roles

**Method:** GET
**Purpose:** Daftar seluruh role (default + kustom).
**Authorization Requirement:** Permission `config_role.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "id": "role-cabang", "code": "cabang", "name": "Cabang", "isSystemDefault": true, "userCount": 32 },
    { "id": "role-custom-01", "code": "direktur_regional", "name": "Direktur Regional", "isSystemDefault": false, "userCount": 2 }
  ]
}
```

---

### 7.2 POST /api/v1/roles

**Method:** POST
**Purpose:** Membuat role kustom baru (CFG-04).
**Authorization Requirement:** Permission `config_role.create` (role: `admin`)

**Request Body Schema:**
```json
{
  "code": "string, required, unique, lowercase_snake_case",
  "name": "string, required, 3-100 char",
  "description": "string, optional"
}
```

**Success Response Schema (201):**
```json
{ "success": true, "data": { "id": "role-custom-02", "code": "direktur_regional", "name": "Direktur Regional", "isSystemDefault": false } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `ROLE_CODE_TAKEN` | 409 | Kode role sudah dipakai |
| `VALIDATION_ERROR` | 422 | Field tidak valid |

---

### 7.3 PATCH /api/v1/roles/{id}

**Method:** PATCH
**Purpose:** Mengubah nama/deskripsi role. Role default (`isSystemDefault=true`) tidak dapat diubah code-nya.
**Authorization Requirement:** Permission `config_role.update` (role: `admin`)

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `ROLE_SYSTEM_DEFAULT_PROTECTED` | 403 | Mencoba mengubah `code` role default |

---

### 7.4 DELETE /api/v1/roles/{id}

**Method:** DELETE
**Purpose:** Menghapus role kustom.
**Authorization Requirement:** Permission `config_role.delete` (role: `admin`)

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `ROLE_SYSTEM_DEFAULT_PROTECTED` | 403 | Role adalah salah satu dari 5 role default |
| `ROLE_IN_USE` | 409 | Masih ada user yang menggunakan role ini |

---

### 7.5 GET /api/v1/roles/{id}/permissions

**Method:** GET
**Purpose:** Mengambil permission matrix untuk satu role.
**Authorization Requirement:** Permission `config_role.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "roleId": "role-cabang",
    "permissions": ["prospect.create", "prospect.read", "prospect.update", "project.read", "project.update"]
  }
}
```

---

### 7.6 PUT /api/v1/roles/{id}/permissions

**Method:** PUT
**Purpose:** Mengganti seluruh set permission untuk satu role.
**Authorization Requirement:** Permission `config_role.update` (role: `admin`)

**Request Body Schema:**
```json
{ "permissions": ["prospect.create", "prospect.read", "project.read"] }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "roleId": "role-cabang", "permissions": ["prospect.create", "prospect.read", "project.read"] } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `PERMISSION_CODE_UNKNOWN` | 422 | Salah satu permission code tidak ada dalam katalog sistem |

**Business Rules:**
- Mengubah permission set memicu cache invalidation segera (IR-020-03).
- Tercatat di audit log sebagai `config_role.permissions_updated`.

---

### 7.7 GET /api/v1/permissions

**Method:** GET
**Purpose:** Mengambil katalog seluruh permission yang tersedia di sistem (untuk UI permission matrix builder).
**Authorization Requirement:** Permission `config_role.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "code": "prospect.create", "resource": "prospect", "action": "create", "label": "Membuat Prospek" },
    { "code": "prospect.read", "resource": "prospect", "action": "read", "label": "Membaca Prospek" }
  ]
}
```

---

## 8. DASHBOARD ENDPOINTS

### 8.1 GET /api/v1/dashboard/summary

**Method:** GET
**Purpose:** Mengambil seluruh data widget dashboard sesuai role user yang login (FE Spec §4).
**Authorization Requirement:** Permission `dashboard.read` (semua role)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `periodMonth` | integer, optional | Default bulan berjalan |
| `periodYear` | integer, optional | Default tahun berjalan |

**Success Response Schema (200) — contoh untuk role `mgmt`:**
```json
{
  "success": true,
  "data": {
    "activeProjects": { "count": 42, "pipelineValue": 18500000000 },
    "winRateThisMonth": 0.63,
    "atRiskProjects": { "count": 3 },
    "pipelineValueTotal": 25000000000,
    "trendWinLoss": [
      { "month": "2025-01", "won": 5, "lost": 2 },
      { "month": "2025-02", "won": 7, "lost": 1 }
    ],
    "progressVsTarget": { "targetValue": 30000000000, "actualValue": 18500000000, "percentage": 61.7 },
    "projectsByStatus": [
      { "status": "review_department", "count": 12 },
      { "status": "lphs_sios", "count": 8 }
    ]
  },
  "meta": { "cacheRefreshIntervalSeconds": 300 }
}
```

**Business Rules:**
- Widget yang dikembalikan disesuaikan berdasarkan `role` user dari token, sesuai matriks FE Spec §4.2; field yang tidak relevan untuk role tersebut tidak disertakan dalam response (bukan `null`, melainkan tidak ada key-nya — payload minimal).
- Data direfresh otomatis di client setiap 5 menit (FE Spec §4.1); endpoint ini tidak melakukan caching sisi server lebih dari 60 detik untuk menjaga akurasi near-real-time.

---

### 8.2 GET /api/v1/dashboard/approvals-pending

**Method:** GET
**Purpose:** Mengambil daftar approval pending untuk widget "Approval Pending" (maksimum 5 item terbaru, FE Spec §4.3).
**Authorization Requirement:** Permission `dashboard.read` AND `approval.read` (role: `pm`, `dept`, `mgmt`, `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    {
      "approvalId": "appr-0012",
      "resourceType": "rks",
      "resourceId": "proj-0044",
      "resourceName": "Pembangunan Gedung Cabang Bandung",
      "branchName": "Cabang Bandung",
      "waitingSince": "2025-06-08T09:00:00Z",
      "waitingDays": 2,
      "slaStatus": "warning"
    }
  ]
}
```

**Business Rules:**
- `slaStatus`: `ok` (< 1 hari), `warning` (1–2 hari), `critical` (> 2 hari atau mendekati SLA) — sesuai FE Spec §4.3 color coding.

---

### 8.3 GET /api/v1/dashboard/approaching-deadline

**Method:** GET
**Purpose:** Daftar proyek dengan deadline tender ≤ 7 hari (FE Spec §4.3).
**Authorization Requirement:** Permission `dashboard.read`

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "projectId": "proj-0033", "name": "Tender Jalan Tol Seksi 4", "deadlineTender": "2025-06-13", "daysRemaining": 3, "badge": "critical" }
  ]
}
```

**Business Rules:**
- `badge`: `critical` jika ≤ 3 hari, `warning` jika 4–7 hari.
- Sorted ascending by `deadlineTender`.

---

## 9. PROSPECTS ENDPOINTS

### 9.1 GET /api/v1/prospects

**Method:** GET
**Purpose:** Daftar prospek sesuai scope role (FE Spec §5.1).
**Authorization Requirement:** Permission `prospect.read`

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `status` | string | `prospecting`, `waiting_pm_approval`, `revision`, `approved` |
| `search` | string | Partial match nama prospek/customer |
| `dateFrom` / `dateTo` | date | Filter tanggal dibuat |
| `page`, `perPage`, `sortBy`, `sortDir` | — | Standar (lihat §3.3, §3.5) |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pros-0001",
      "name": "Pengadaan IT Kantor Pusat",
      "customerName": "PT Sumber Makmur",
      "status": "waiting_pm_approval",
      "createdBy": "Budi Santoso",
      "branchId": "br-0003",
      "createdAt": "2025-06-01T08:00:00Z"
    }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 20, "totalItems": 18, "totalPages": 1 } }
}
```

**Business Rules:**
- Role `cabang`: hanya prospek milik `branch_id` sendiri (lihat 020 §8.3).
- Role `pm`, `admin`: seluruh prospek.
- Role `dept`, `mgmt`: tidak memiliki akses (403 `AUTHORIZATION_NO_ACCESS`) — prospek bukan bagian dari scope dept/mgmt sesuai FE Spec §2.1 (sidebar tidak menampilkan menu Prospek untuk role tersebut).

---

### 9.2 POST /api/v1/prospects

**Method:** POST
**Purpose:** Membuat prospek baru (FE Spec §5.2).
**Authorization Requirement:** Permission `prospect.create` (role: `cabang`, `pm`, `admin`)

**Request Body Schema:**
```json
{
  "name": "string, required, 3-200 char",
  "customerId": "uuid, required",
  "description": "string, optional, max 2000 char",
  "estimatedValue": "number, optional, min 0",
  "estimatedDate": "date, optional, tidak boleh masa lalu",
  "categoryId": "uuid, required",
  "answers": [
    { "questionId": "uuid, required", "answerValue": "string|boolean|number, required sesuai tipe pertanyaan" }
  ]
}
```

**Success Response Schema (201):**
```json
{
  "success": true,
  "data": {
    "id": "pros-0099",
    "name": "Pengadaan IT Kantor Pusat",
    "status": "prospecting",
    "branchId": "br-0003",
    "createdAt": "2025-06-10T08:30:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Field tidak valid |
| `PROSPECT_ESTIMATED_DATE_IN_PAST` | 422 | `estimatedDate` di masa lalu |
| `CUSTOMER_NOT_FOUND` | 404 | `customerId` tidak ditemukan |
| `CATEGORY_NOT_FOUND` | 404 | `categoryId` tidak ditemukan |
| `QUESTION_REQUIRED_NOT_ANSWERED` | 422 | Pertanyaan wajib (sesuai Master Pertanyaan) belum dijawab |

**Validation Rules:**
- `name`: required, 3–200 karakter.
- `estimatedValue`: opsional, jika diisi minimum 0.
- `estimatedDate`: opsional, jika diisi tidak boleh tanggal masa lalu.
- `answers[]`: setiap pertanyaan yang ditandai wajib (`is_required=true` di Master Pertanyaan) harus terjawab.

**Business Rules:**
- `branch_id` diinject otomatis dari `userContext`, tidak diterima dari body (mass assignment prevention, lihat 020 §11.5).
- Status awal selalu `prospecting`.
- Dicatat ke audit log sebagai `prospect.create`.

---

### 9.3 GET /api/v1/prospects/{id}

**Method:** GET
**Purpose:** Detail satu prospek.
**Authorization Requirement:** Permission `prospect.read` + ownership check (role `cabang`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "pros-0001",
    "name": "Pengadaan IT Kantor Pusat",
    "customer": { "id": "cust-0010", "name": "PT Sumber Makmur" },
    "description": "Pengadaan server dan jaringan untuk kantor pusat baru.",
    "estimatedValue": 1500000000,
    "estimatedDate": "2025-08-01",
    "category": { "id": "cat-0002", "name": "IT Infrastructure" },
    "status": "waiting_pm_approval",
    "answers": [
      { "questionId": "q-001", "questionText": "Apakah ada budget terkonfirmasi?", "answerValue": "Ya" }
    ],
    "branchId": "br-0003",
    "createdBy": { "id": "u-0001", "name": "Budi Santoso" },
    "createdAt": "2025-06-01T08:00:00Z",
    "updatedAt": "2025-06-02T10:00:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `PROSPECT_NOT_FOUND` | 404 | Tidak ditemukan atau bukan milik cabang user (lihat 020 §7.3 catatan IDOR) |

---

### 9.4 PATCH /api/v1/prospects/{id}

**Method:** PATCH
**Purpose:** Mengubah data prospek (hanya saat status `draft`/`prospecting` atau `revision`).
**Authorization Requirement:** Permission `prospect.update` + ownership + status check

**Request Body Schema:** Sama dengan 9.2, seluruh field opsional (partial).

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `PROSPECT_NOT_FOUND` | 404 | Tidak ditemukan/bukan milik |
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status bukan `prospecting`/`revision` |
| `VALIDATION_ERROR` | 422 | Field tidak valid |

---

### 9.5 DELETE /api/v1/prospects/{id}

**Method:** DELETE
**Purpose:** Menghapus prospek (hanya status `prospecting`, draft belum disubmit).
**Authorization Requirement:** Permission `prospect.delete` (role `cabang` pemilik, atau `admin`)

**Success Response Schema (204):** Empty body.

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status sudah disubmit (`waiting_pm_approval` atau lebih lanjut) |

---

### 9.6 POST /api/v1/prospects/{id}/submit

**Method:** POST
**Purpose:** Mengirim prospek untuk approval PM (FR010).
**Authorization Requirement:** Permission `prospect.submit` + ownership

**Request Body Schema:** Tidak ada (empty)

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "pros-0001", "status": "waiting_pm_approval" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status bukan `prospecting`/`revision` |
| `PROSPECT_INCOMPLETE_ANSWERS` | 422 | Pertanyaan wajib belum lengkap |

**Business Rules:**
- Memicu notifikasi ke PM (lihat 046).
- State transition sesuai 013_GLOBAL_STATE_MACHINE_REFERENCE.

---

### 9.7 POST /api/v1/prospects/{id}/approve

**Method:** POST
**Purpose:** PM menyetujui prospek (FR011), yang berarti prospek siap dikonversi menjadi proyek.
**Authorization Requirement:** Permission `prospect.approve` (role: `pm`, `admin`)

**Request Body Schema:**
```json
{ "comment": "string, optional" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "pros-0001", "status": "approved" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status bukan `waiting_pm_approval` |

---

### 9.8 POST /api/v1/prospects/{id}/reject

**Method:** POST
**Purpose:** PM meminta revisi prospek (FR012).
**Authorization Requirement:** Permission `prospect.approve` (role: `pm`, `admin`)

**Request Body Schema:**
```json
{ "comment": "string, required, min 10 char — alasan revisi wajib diisi" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "pros-0001", "status": "revision" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 422 | `comment` kosong/terlalu pendek |

---

### 9.9 POST /api/v1/prospects/{id}/convert-to-project

**Method:** POST
**Purpose:** Mengonversi prospek yang sudah `approved` menjadi proyek (FR013-015).
**Authorization Requirement:** Permission `project.create` + prospect status `approved`

**Request Body Schema:**
```json
{
  "projectType": "string, required, enum: tender|prospecting",
  "deadlineTender": "date, required jika projectType=tender"
}
```

**Success Response Schema (201):**
```json
{
  "success": true,
  "data": { "id": "proj-0099", "prospectId": "pros-0001", "name": "Pengadaan IT Kantor Pusat", "status": "created", "projectType": "tender" }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Prospek belum `approved` |
| `PROSPECT_ALREADY_CONVERTED` | 409 | Prospek sudah pernah dikonversi |

---

## 10. PROJECTS ENDPOINTS

### 10.1 GET /api/v1/projects

**Method:** GET
**Purpose:** Daftar proyek sesuai scope role.
**Authorization Requirement:** Permission `project.read`

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `status` | string | Comma-separated, sesuai Master Status Proyek |
| `projectType` | string | `tender`, `prospecting` |
| `branchId` | uuid | Filter cabang (hanya efektif untuk role non-cabang) |
| `categoryId` | uuid | Filter kategori proyek |
| `search` | string | Partial match nama proyek |
| `dateFrom`/`dateTo` | date | Filter tanggal dibuat |
| `page`, `perPage`, `sortBy`, `sortDir` | — | Standar |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-0044",
      "name": "Pembangunan Gedung Cabang Bandung",
      "projectType": "tender",
      "status": "review_department",
      "branchName": "Cabang Bandung",
      "categoryName": "Konstruksi",
      "deadlineTender": "2025-06-20",
      "createdAt": "2025-05-15T00:00:00Z"
    }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 20, "totalItems": 42, "totalPages": 3 } }
}
```

**Business Rules:**
- Scope sesuai 020 §8.3 (ScopeBuilder.buildProjectScope): `cabang` → branch sendiri; `dept` → proyek yang melibatkan deptnya; `pm`/`mgmt`/`admin` → semua.

---

### 10.2 GET /api/v1/projects/{id}

**Method:** GET
**Purpose:** Detail proyek lengkap termasuk ringkasan seluruh tab (RKS, LPHS, Harga, Pemenang, Delivery, Timeline).
**Authorization Requirement:** Permission `project.read` + scope/ownership check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "proj-0044",
    "name": "Pembangunan Gedung Cabang Bandung",
    "projectType": "tender",
    "status": "review_department",
    "branch": { "id": "br-0007", "name": "Cabang Bandung" },
    "category": { "id": "cat-0001", "name": "Konstruksi" },
    "customer": { "id": "cust-0020", "name": "Dinas PU Kota Bandung" },
    "deadlineTender": "2025-06-20",
    "cancelledAt": null,
    "cancellationReason": null,
    "createdAt": "2025-05-15T00:00:00Z",
    "updatedAt": "2025-06-05T00:00:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `PROJECT_NOT_FOUND` | 404 | Tidak ditemukan/luar scope |

---

### 10.3 PATCH /api/v1/projects/{id}

**Method:** PATCH
**Purpose:** Mengubah field dasar proyek (nama, kategori, deadline) selama status memungkinkan.
**Authorization Requirement:** Permission `project.update` + ownership + status check

**Request Body Schema:**
```json
{
  "name": "string, optional",
  "categoryId": "uuid, optional",
  "deadlineTender": "date, optional"
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status `selesai` atau `cancelled` |

---

### 10.4 POST /api/v1/projects/{id}/cancel

**Method:** POST
**Purpose:** Membatalkan proyek pada tahap apa pun (GAP04/BP04, status cancelled).
**Authorization Requirement:** Permission `project.cancel` (role: `pm`, `mgmt`, `admin`)

**Request Body Schema:**
```json
{ "reason": "string, required, min 10 char", "confirm": "boolean, required, must be true" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "proj-0044", "status": "cancelled", "cancellationReason": "Customer membatalkan tender secara sepihak.", "cancelledAt": "2025-06-10T09:00:00Z" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `PROJECT_ALREADY_CANCELLED` | 409 | Sudah cancelled sebelumnya |
| `PROJECT_ALREADY_COMPLETED` | 409 | Status sudah `selesai`, tidak bisa cancel |
| `VALIDATION_ERROR` | 422 | `confirm` bukan `true` atau `reason` kosong |

**Business Rules:**
- Status `cancelled` final — tidak ada transisi keluar dari status ini.
- Proyek cancelled dikeluarkan dari kalkulasi pipeline aktif tetapi tetap muncul di laporan historis dengan flag tersendiri.
- Approval pending terkait proyek ini otomatis di-set `superseded` (lihat 013).

---

### 10.5 GET /api/v1/projects/{id}/timeline

**Method:** GET
**Purpose:** Mengambil seluruh timeline event proyek untuk audit trail visual.
**Authorization Requirement:** Permission `project.read` + scope check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "event": "project.created", "actor": "Budi Santoso", "timestamp": "2025-05-15T00:00:00Z" },
    { "event": "rks.submitted", "actor": "Budi Santoso", "timestamp": "2025-05-16T10:00:00Z" },
    { "event": "rks.approved", "actor": "Andi Wijaya (PM)", "timestamp": "2025-05-17T14:00:00Z" }
  ]
}
```

---

## 11. RKS ENDPOINTS

### 11.1 GET /api/v1/projects/{projectId}/rks

**Method:** GET
**Purpose:** Mengambil dokumen RKS terkini untuk satu proyek (FR030).
**Authorization Requirement:** Permission `rks.read` + scope check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "rks-0021",
    "projectId": "proj-0044",
    "status": "waiting_pm_approval",
    "content": "Rencana Kerja dan Syarat untuk pembangunan gedung 3 lantai...",
    "attachments": [ { "id": "doc-0101", "fileName": "RKS_Gedung_Bandung_v1.pdf" } ],
    "revisionNumber": 1,
    "submittedAt": "2025-05-16T10:00:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `RKS_NOT_FOUND` | 404 | RKS belum dibuat untuk proyek ini |

---

### 11.2 POST /api/v1/projects/{projectId}/rks

**Method:** POST
**Purpose:** Membuat/menyimpan draft RKS (FR031).
**Authorization Requirement:** Permission `rks.create` (role: `cabang` pemilik proyek, `pm`)

**Request Body Schema:**
```json
{
  "content": "string, required, min 50 char",
  "attachmentIds": ["uuid, optional — referensi dokumen yang sudah diupload"]
}
```

**Success Response Schema (201):**
```json
{ "success": true, "data": { "id": "rks-0021", "projectId": "proj-0044", "status": "draft", "revisionNumber": 1 } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 422 | `content` terlalu pendek |
| `PROJECT_NOT_FOUND` | 404 | Proyek tidak ditemukan/luar scope |

---

### 11.3 PATCH /api/v1/rks/{id}

**Method:** PATCH
**Purpose:** Mengubah draft RKS sebelum submit, atau merevisi setelah ditolak.
**Authorization Requirement:** Permission `rks.update` + ownership + status check (`draft`/`revision`)

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status bukan `draft`/`revision` |

---

### 11.4 POST /api/v1/rks/{id}/submit

**Method:** POST
**Purpose:** Mengirim RKS untuk review departemen (memicu transisi `review_department`, FR032).
**Authorization Requirement:** Permission `rks.update` + ownership

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "rks-0021", "status": "waiting_pm_approval" } }
```

---

### 11.5 POST /api/v1/rks/{id}/approve

**Method:** POST
**Purpose:** PM menyetujui RKS (FR033).
**Authorization Requirement:** Permission `rks.approve` (role: `pm`, `admin`) + approval assignment check (lihat 020 §8.2)

**Request Body Schema:**
```json
{ "comment": "string, optional" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "rks-0021", "status": "approved" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_APPROVAL_NOT_ASSIGNED` | 403 | PM ini bukan approver yang diassign |
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Status bukan `waiting_pm_approval` |

---

### 11.6 POST /api/v1/rks/{id}/reject

**Method:** POST
**Purpose:** PM meminta revisi RKS.
**Authorization Requirement:** Permission `rks.approve` (role: `pm`, `admin`)

**Request Body Schema:**
```json
{ "comment": "string, required, min 10 char" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "rks-0021", "status": "revision", "revisionNumber": 2 } }
```

---

## 12. LPHS/SIOS ENDPOINTS

### 12.1 GET /api/v1/projects/{projectId}/lphs-sios

**Method:** GET
**Purpose:** Mengambil dokumen LPHS/SIOS dan status approval paralel per departemen (redesain GAP08).
**Authorization Requirement:** Permission `lphs_sios.read` + scope check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "lphs-0015",
    "projectId": "proj-0044",
    "status": "lphs_sios",
    "selectedDepartments": [
      { "deptId": "dept-eng", "deptName": "Engineering", "approvalStatus": "approved", "approvedAt": "2025-05-20T10:00:00Z" },
      { "deptId": "dept-legal", "deptName": "Legal", "approvalStatus": "pending", "approvedAt": null }
    ],
    "pmApprovalStatus": "pending",
    "attachments": [ { "id": "doc-0150", "fileName": "LPHS_Draft_v1.pdf", "departmentId": "dept-eng" } ],
    "revisionNumber": 1
  }
}
```

**Business Rules:**
- Review oleh PM dan dept dapat dimulai bersamaan (parallelisasi BP02, lihat 040). Approval keseluruhan LPHS dianggap `approved` hanya jika seluruh dept yang dipilih **dan** PM sudah approve.

---

### 12.2 POST /api/v1/projects/{projectId}/lphs-sios

**Method:** POST
**Purpose:** Membuat draft LPHS/SIOS dan memilih departemen yang relevan.
**Authorization Requirement:** Permission `lphs_sios.create` (role: `cabang` pemilik, `pm`)

**Request Body Schema:**
```json
{
  "departmentIds": ["uuid, required, minimum 1"],
  "attachmentIds": ["uuid, optional"]
}
```

**Success Response Schema (201):**
```json
{ "success": true, "data": { "id": "lphs-0015", "projectId": "proj-0044", "status": "draft", "selectedDepartments": ["dept-eng", "dept-legal"] } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 422 | `departmentIds` kosong |
| `DEPARTMENT_NOT_FOUND` | 404 | Salah satu deptId tidak valid |

---

### 12.3 POST /api/v1/lphs-sios/{id}/submit

**Method:** POST
**Purpose:** Mengirim LPHS/SIOS untuk review paralel PM + Dept.
**Authorization Requirement:** Permission `lphs_sios.update` + ownership

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "lphs-0015", "status": "lphs_sios" } }
```

**Business Rules:**
- Memicu pembuatan approval task untuk PM dan untuk setiap dept yang dipilih secara bersamaan (lihat 040 §Parallel Review).

---

### 12.4 POST /api/v1/lphs-sios/{id}/departments/{deptId}/approve

**Method:** POST
**Purpose:** Satu departemen menyetujui LPHS dari sisi departemennya.
**Authorization Requirement:** Permission `lphs_sios.approve` (role: `dept` dengan `deptId` sesuai path)

**Request Body Schema:**
```json
{ "comment": "string, optional" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "lphsId": "lphs-0015", "deptId": "dept-eng", "approvalStatus": "approved" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_APPROVAL_NOT_ASSIGNED` | 403 | Dept user tidak sesuai `deptId` di path |
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Dept ini sudah approve/reject sebelumnya |

---

### 12.5 POST /api/v1/lphs-sios/{id}/departments/{deptId}/reject

**Method:** POST
**Purpose:** Satu departemen meminta revisi tertarget (BP03 — hanya dept yang relevan yang perlu approve ulang).
**Authorization Requirement:** Permission `lphs_sios.approve` (role: `dept` sesuai `deptId`)

**Request Body Schema:**
```json
{ "comment": "string, required, min 10 char" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "lphsId": "lphs-0015", "deptId": "dept-eng", "approvalStatus": "revision_requested" } }
```

**Business Rules:**
- Hanya approval status milik dept ini yang di-reset ke `pending` setelah revisi diajukan ulang (targeted reset, lihat 040). Dept lain yang sudah approve tidak perlu approve ulang.

---

### 12.6 POST /api/v1/lphs-sios/{id}/pm-approve

**Method:** POST
**Purpose:** PM memberikan approval pada sisi koordinasinya.
**Authorization Requirement:** Permission `lphs_sios.approve` (role: `pm`, `admin`)

**Success Response Schema (200):**
```json
{ "success": true, "data": { "lphsId": "lphs-0015", "pmApprovalStatus": "approved" } }
```

---

### 12.7 POST /api/v1/lphs-sios/{id}/departments/{deptId}/revise

**Method:** POST
**Purpose:** Cabang/PM mengunggah revisi LPHS yang ditargetkan ke dept spesifik yang meminta revisi.
**Authorization Requirement:** Permission `lphs_sios.revise` (role: `cabang` pemilik, `pm`)

**Request Body Schema:**
```json
{ "attachmentIds": ["uuid, required, minimum 1"], "note": "string, optional" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "lphsId": "lphs-0015", "deptId": "dept-eng", "approvalStatus": "pending", "revisionNumber": 2 } }
```

---

## 13. HARGA & KOMPETITOR ENDPOINTS

### 13.1 GET /api/v1/projects/{projectId}/harga

**Method:** GET
**Purpose:** Mengambil data harga penawaran dan kompetitor proyek (FR050-051).
**Authorization Requirement:** Permission `harga.read` + scope check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "harga-0010",
    "projectId": "proj-0044",
    "ourPrice": 4500000000,
    "submittedAt": "2025-06-01T00:00:00Z",
    "competitors": [
      { "competitorId": "comp-0003", "competitorName": "PT Bangun Sejahtera", "competitorPrice": 4650000000 },
      { "competitorId": "comp-0007", "competitorName": "PT Karya Mandiri", "competitorPrice": 4400000000 }
    ]
  }
}
```

**Business Rules:**
- `competitors[]` direferensikan ke Master Kompetitor (MD14, ternormalisasi — lihat 023), bukan JSON freeform.

---

### 13.2 POST /api/v1/projects/{projectId}/harga

**Method:** POST
**Purpose:** Input harga penawaran beserta data kompetitor.
**Authorization Requirement:** Permission `harga.create` (role: `cabang` pemilik, `pm`)

**Request Body Schema:**
```json
{
  "ourPrice": "number, required, min 0",
  "competitors": [
    { "competitorId": "uuid, optional — jika kompetitor baru, kirim competitorName", "competitorName": "string, required jika competitorId kosong", "competitorPrice": "number, required, min 0" }
  ]
}
```

**Success Response Schema (201):**
```json
{ "success": true, "data": { "id": "harga-0010", "projectId": "proj-0044", "ourPrice": 4500000000 } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 422 | `ourPrice` negatif atau kosong |

**Business Rules:**
- Jika `competitorName` dikirim tanpa `competitorId`, sistem otomatis membuat entri baru di Master Kompetitor (dengan status `pending_review` untuk dirapikan admin kemudian — Inferred Requirement IR-057-03: BA Review menyebut normalisasi kompetitor sebagai kebutuhan analitik; agar input lapangan tidak terhambat menunggu admin membuat master data dahulu, sistem mengizinkan entri cepat dengan status review menyusul).

---

### 13.3 PATCH /api/v1/harga/{id}

**Method:** PATCH
**Purpose:** Mengubah data harga/kompetitor sebelum status `pemenang_ditentukan`.
**Authorization Requirement:** Permission `harga.update` + ownership + status check

---

## 14. PEMENANG & DELIVERY ENDPOINTS

### 14.1 POST /api/v1/projects/{projectId}/pemenang

**Method:** POST
**Purpose:** Mencatat hasil tender: menang atau kalah (FR060).
**Authorization Requirement:** Permission `pemenang.create` (role: `cabang` pemilik, `pm`)

**Request Body Schema:**
```json
{
  "result": "string, required, enum: won|lost",
  "lossReasonId": "uuid, required jika result=lost",
  "lossReasonNote": "string, optional",
  "finalPrice": "number, optional, min 0"
}
```

**Success Response Schema (201):**
```json
{ "success": true, "data": { "id": "pemenang-0005", "projectId": "proj-0044", "result": "won", "decidedAt": "2025-06-10T09:00:00Z" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `VALIDATION_ERROR` | 422 | `lossReasonId` kosong padahal `result=lost` |
| `LOSS_REASON_NOT_FOUND` | 404 | `lossReasonId` tidak valid |

**Business Rules:**
- `lossReasonId` mengacu pada Master Alasan Kekalahan (GAP12, lihat 026), bukan teks bebas.
- Jika `result=won`, status proyek bertransisi ke `target_delivery`. Jika `result=lost`, proyek bertransisi ke status final `kalah`.

---

### 14.2 GET /api/v1/projects/{projectId}/pemenang

**Method:** GET
**Purpose:** Mengambil hasil tender proyek.
**Authorization Requirement:** Permission `pemenang.read` + scope check

---

### 14.3 POST /api/v1/projects/{projectId}/delivery

**Method:** POST
**Purpose:** Mencatat target delivery setelah menang tender (FR061-062).
**Authorization Requirement:** Permission `delivery.create` (role: `cabang` pemilik, `pm`)

**Request Body Schema:**
```json
{
  "deliveryDate": "date, required, tidak boleh masa lalu",
  "picName": "string, required",
  "notes": "string, optional"
}
```

**Success Response Schema (201):**
```json
{ "success": true, "data": { "id": "delivery-0003", "projectId": "proj-0044", "deliveryDate": "2025-09-01", "status": "scheduled" } }
```

---

### 14.4 PATCH /api/v1/delivery/{id}

**Method:** PATCH
**Purpose:** Update progress delivery (mis. status `in_progress`, `completed`).
**Authorization Requirement:** Permission `delivery.update` + ownership

**Request Body Schema:**
```json
{ "status": "string, optional, enum: scheduled|in_progress|completed|delayed", "notes": "string, optional" }
```

---

## 15. APPROVALS ENDPOINTS

### 15.1 GET /api/v1/approvals

**Method:** GET
**Purpose:** Approval Inbox — daftar approval pending yang diassign ke user yang login (FE Spec sidebar `/approvals`).
**Authorization Requirement:** Permission `approval.read` (role: `pm`, `dept`, `mgmt`, `admin`)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `status` | string | `pending`, `approved`, `rejected`. Default `pending` |
| `resourceType` | string | `prospect`, `rks`, `lphs_sios` |
| `page`, `perPage`, `sortBy`, `sortDir` | — | Standar |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "appr-0012",
      "resourceType": "rks",
      "resourceId": "proj-0044",
      "resourceName": "Pembangunan Gedung Cabang Bandung",
      "stage": "pm_review",
      "branchName": "Cabang Bandung",
      "waitingSince": "2025-06-08T09:00:00Z",
      "slaDeadline": "2025-06-10T09:00:00Z",
      "status": "pending"
    }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 20, "totalItems": 6, "totalPages": 1 } }
}
```

**Business Rules:**
- Hanya menampilkan approval yang `assigned_to_user_id = userContext.userId` ATAU `assigned_to_role/dept = userContext.role/deptId` (lihat 020 §8.2).

---

### 15.2 GET /api/v1/approvals/{id}

**Method:** GET
**Purpose:** Detail satu approval task untuk panel review (SlideDrawer di FE).
**Authorization Requirement:** Permission `approval.read` + assignment check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "appr-0012",
    "resourceType": "rks",
    "resourceId": "proj-0044",
    "resourceSnapshot": { "content": "Rencana Kerja dan Syarat...", "attachments": [] },
    "stage": "pm_review",
    "status": "pending",
    "history": [
      { "action": "submitted", "actor": "Budi Santoso", "timestamp": "2025-06-08T09:00:00Z" }
    ]
  }
}
```

---

### 15.3 POST /api/v1/approvals/{id}/decide

**Method:** POST
**Purpose:** Endpoint generik untuk approve/reject sebuah approval task (digunakan oleh Approval Engine Core, lihat 039).
**Authorization Requirement:** Permission `approval.approve` atau `approval.reject` + assignment check

**Request Body Schema:**
```json
{
  "decision": "string, required, enum: approved|rejected",
  "comment": "string, required jika decision=rejected, min 10 char"
}
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "appr-0012", "status": "approved", "decidedAt": "2025-06-10T10:00:00Z" } }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_APPROVAL_NOT_ASSIGNED` | 403 | Approval bukan untuk user ini |
| `APPROVAL_ALREADY_PROCESSED` | 409 | Approval sudah diproses sebelumnya |
| `LPHS_DEPT_APPROVALS_PENDING` | 422 | Precondition gagal (lihat 020 §8.2) |

---

### 15.4 POST /api/v1/approvals/{id}/reassign

**Method:** POST
**Purpose:** Admin melakukan re-assign approval ke backup approver (GAP07, BP01).
**Authorization Requirement:** Permission `approval.approve` (role: `admin`)

**Request Body Schema:**
```json
{ "newAssigneeUserId": "uuid, required", "reason": "string, required, min 10 char" }
```

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "appr-0012", "assignedToUserId": "u-0050", "reassignedAt": "2025-06-10T11:00:00Z" } }
```

**Business Rules:**
- Dicatat di audit log sebagai `approval.reassigned` dengan `actor_id` admin dan detail `reason`.
- Memicu notifikasi ke approver baru.

---

## 16. MASTER DATA ENDPOINTS

Pola CRUD master data bersifat seragam. Berikut kontrak generik yang berlaku untuk seluruh entitas Master Data (Customer, Department, Question, Question Type, Competitor, Period, Holiday, Loss Reason, Status Proyek, Approval Level, KPI, Target, Bobot), dengan path resource berbeda.

### 16.1 GET /api/v1/master/{resource}

**Method:** GET
**Purpose:** Daftar master data.
**Authorization Requirement:** Permission `master_{resource}.read` (role: `admin`; pengecualian: `master_competitor.read` juga untuk `pm`, `mgmt`)

**Contoh — GET /api/v1/master/customers:**
```json
{
  "success": true,
  "data": [
    { "id": "cust-0010", "name": "PT Sumber Makmur", "industry": "Manufaktur", "isActive": true }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 20, "totalItems": 80, "totalPages": 4 } }
}
```

### 16.2 POST /api/v1/master/{resource}

**Method:** POST
**Purpose:** Membuat entri master data baru.
**Authorization Requirement:** Permission `master_{resource}.create`

**Contoh — POST /api/v1/master/customers:**
```json
{ "name": "string, required, unique, 2-200 char", "industry": "string, optional", "address": "string, optional" }
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `MASTER_NAME_TAKEN` | 409 | Nama sudah ada (unique constraint per resource) |
| `VALIDATION_ERROR` | 422 | Field tidak valid |

### 16.3 PATCH /api/v1/master/{resource}/{id}

**Method:** PATCH
**Purpose:** Mengubah entri master data.
**Authorization Requirement:** Permission `master_{resource}.update`

### 16.4 DELETE /api/v1/master/{resource}/{id}

**Method:** DELETE
**Purpose:** Soft-delete (menonaktifkan) entri master data.
**Authorization Requirement:** Permission `master_{resource}.delete`

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `MASTER_DATA_IN_USE` | 409 | Entri masih dirujuk oleh data transaksional aktif (mis. customer masih punya prospek aktif) |

### 16.5 Daftar Resource Path Master Data

| Resource Path | Entitas | Field Khusus |
|---|---|---|
| `/master/companies` | Master Perusahaan (MD01) | `name`, `legalEntityNumber` |
| `/master/divisions` | Master Divisi (MD02) | `name`, `companyId` |
| `/master/branches` | Master Branch (MD03) | `name`, `code`, `address`, `city`, `divisionId`, `isActive` |
| `/master/categories` | Master Kategori Proyek (MD04) | `name`, `requiresLphs` (boolean) |
| `/master/statuses` | Master Status Proyek (MD05) — lihat juga §17 Configuration | `code`, `label`, `color`, `order` |
| `/master/approval-levels` | Master Approval Level (MD06) | `level`, `label`, `description` |
| `/master/kpis` | Master KPI (MD07) | `code`, `name`, `formula`, `unit` |
| `/master/customers` | Master Customer | `name`, `industry`, `address` |
| `/master/departments` | Master Departemen | `name`, `code`, `divisionId`, `parentDepartmentId` |
| `/master/questions` | Master Pertanyaan | `text`, `questionTypeId`, `isRequired`, `context` (`prospect`/`rks`) |
| `/master/competitors` | Master Kompetitor (MD14) | `name`, `notes`, `status` (`active`/`pending_review`) |
| `/master/periods` | Master Periode (MD10) | `name`, `startDate`, `endDate`, `isClosed` |
| `/master/holidays` | Master Hari Libur (MD13) | `date`, `description`, `isRecurringAnnually` |
| `/master/loss-reasons` | Master Alasan Kekalahan (GAP12) | `code`, `label` |
| `/master/document-types` | Master Tipe Dokumen (MD11) | `code`, `label`, `appliesToStage` |

---

## 17. CONFIGURATION ENDPOINTS

### 17.1 GET /api/v1/config/organization

**Method:** GET
**Purpose:** Mengambil struktur hierarki organisasi penuh (CFG-01).
**Authorization Requirement:** Permission `config_org.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "comp-0001",
        "name": "PT Kinetic Membangun Nusantara",
        "divisions": [
          {
            "id": "div-0001",
            "name": "Divisi Infrastruktur",
            "departments": [
              { "id": "dept-eng", "name": "Engineering", "branches": [{ "id": "br-0007", "name": "Cabang Bandung" }] }
            ]
          }
        ]
      }
    ]
  }
}
```

### 17.2 PUT /api/v1/config/organization

**Method:** PUT
**Purpose:** Memperbarui struktur organisasi (tambah/ubah/nonaktifkan unit).
**Authorization Requirement:** Permission `config_org.update` (role: `admin`)

**Business Rules:**
- Penghapusan unit organisasi yang masih memiliki user/proyek aktif ditolak dengan `MASTER_DATA_IN_USE`.

---

### 17.3 GET /api/v1/config/workflow

**Method:** GET
**Purpose:** Mengambil konfigurasi approval workflow per tahap (CFG-02).
**Authorization Requirement:** Permission `config_workflow.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "stage": "rks_review", "approverRole": "pm", "order": 1 },
    { "stage": "lphs_dept_review", "approverRole": "dept", "order": 2, "parallel": true },
    { "stage": "lphs_pm_coordination", "approverRole": "pm", "order": 2, "parallel": true },
    { "stage": "lphs_final_approval", "approverRole": "mgmt", "order": 3 }
  ]
}
```

### 17.4 PUT /api/v1/config/workflow

**Method:** PUT
**Purpose:** Mengubah konfigurasi workflow (tambah/ubah tahap, urutan, approver role).
**Authorization Requirement:** Permission `config_workflow.update` (role: `admin`)

---

### 17.5 GET /api/v1/config/sla

**Method:** GET
**Purpose:** Mengambil konfigurasi SLA per tahap approval (CFG-05).
**Authorization Requirement:** Permission `config_sla.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "stage": "rks_review", "slaWorkingDays": 2, "reminderDaysBefore": [1], "escalationRole": "mgmt" }
  ]
}
```

### 17.6 PUT /api/v1/config/sla

**Method:** PUT
**Purpose:** Mengubah SLA dan trigger eskalasi.
**Authorization Requirement:** Permission `config_sla.update` (role: `admin`)

**Request Body Schema:**
```json
{ "stage": "string, required", "slaWorkingDays": "integer, required, min 1", "reminderDaysBefore": ["integer"], "escalationRole": "string, required" }
```

---

### 17.7 GET /api/v1/config/notifications

**Method:** GET
**Purpose:** Mengambil template notifikasi per event (CFG-06, CFG-09).
**Authorization Requirement:** Permission `config_notification.read` (role: `admin`)

### 17.8 PUT /api/v1/config/notifications/{eventCode}

**Method:** PUT
**Purpose:** Mengubah template pesan untuk event tertentu.
**Authorization Requirement:** Permission `config_notification.update` (role: `admin`)

**Request Body Schema:**
```json
{ "channel": "string, required, enum: in_app|email", "template": "string, required", "recipients": ["string, enum role/dept code"] }
```

---

### 17.9 GET /api/v1/config/question-types

**Method:** GET
**Purpose:** Mengambil daftar tipe pertanyaan (CFG-12, migrasi dari localStorage GAP03).
**Authorization Requirement:** Permission `config_question_type.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "id": "qt-001", "code": "yes_no", "label": "Ya/Tidak", "options": ["Ya", "Tidak"] },
    { "id": "qt-002", "code": "single_choice", "label": "Pilihan Tunggal", "options": ["Opsi A", "Opsi B", "Opsi C"] }
  ]
}
```

### 17.10 POST /api/v1/config/question-types

**Method:** POST
**Purpose:** Membuat tipe pertanyaan baru.
**Authorization Requirement:** Permission `config_question_type.create` (role: `admin`)

**Request Body Schema:**
```json
{ "code": "string, required, unique", "label": "string, required", "options": ["string"], "optional jika tipe text/number" }
```

---

### 17.11 GET /api/v1/config/upload-policy

**Method:** GET
**Purpose:** Mengambil konfigurasi batas ukuran dan tipe file upload per jenis dokumen (CFG-13).
**Authorization Requirement:** Permission `config_upload.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "documentTypeCode": "RKS", "maxSizeMb": 10, "allowedMimeTypes": ["application/pdf", "application/msword"] }
  ]
}
```

### 17.12 PUT /api/v1/config/upload-policy/{documentTypeCode}

**Method:** PUT
**Authorization Requirement:** Permission `config_upload.update` (role: `admin`)

---

### 17.13 GET /api/v1/config/integrations

**Method:** GET
**Purpose:** Mengambil daftar konfigurasi integrasi eksternal (CFG-14), termasuk konfigurasi AI provider.
**Authorization Requirement:** Permission `config_integration.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "key": "SMTP_HOST", "value": "smtp.kineticcrm.id", "isSecret": false },
    { "key": "GEMINI_API_KEY", "value": "••••••••••••", "isSecret": true },
    { "key": "AI_PROVIDER", "value": "gemini", "isSecret": false },
    { "key": "AI_MODEL", "value": "gemini-2.5-flash", "isSecret": false }
  ]
}
```

**Business Rules:**
- Field dengan `isSecret=true` selalu dikembalikan sebagai mask (`••••••••••••`), tidak pernah dalam bentuk asli, sesuai 020 §9.4.

### 17.14 PUT /api/v1/config/integrations/{key}

**Method:** PUT
**Purpose:** Mengubah/merotasi nilai konfigurasi integrasi (termasuk API key).
**Authorization Requirement:** Permission `config_integration.update` (role: `admin`)

**Request Body Schema:**
```json
{ "value": "string, required" }
```

**Business Rules:**
- Nilai dienkripsi sebelum disimpan jika `isSecret=true` untuk key tersebut.
- Perubahan dicatat di audit log dengan `old_value` dan `new_value` di-mask.

---

## 18. NOTIFICATIONS ENDPOINTS

### 18.1 GET /api/v1/notifications

**Method:** GET
**Purpose:** Daftar notifikasi in-app milik user yang login (FR090).
**Authorization Requirement:** Permission `notification.read` (semua role, ownership otomatis by `recipient_id`)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `isRead` | boolean | Filter status baca |
| `page`, `perPage` | — | Standar |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "id": "notif-0090", "eventType": "approval_pending", "message": "RKS proyek Cabang Bandung menunggu approval Anda.", "resourceType": "rks", "resourceId": "rks-0021", "isRead": false, "createdAt": "2025-06-08T09:00:00Z" }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 20, "totalItems": 4, "totalPages": 1 }, "unreadCount": 3 }
}
```

**Business Rules:**
- Endpoint ini dipoll oleh client secara periodik (interval ditentukan di 046) untuk update badge counter.

### 18.2 POST /api/v1/notifications/{id}/mark-read

**Method:** POST
**Purpose:** Menandai satu notifikasi sebagai dibaca.
**Authorization Requirement:** Permission `notification.read` + ownership (`recipient_id = userContext.userId`)

**Success Response Schema (200):**
```json
{ "success": true, "data": { "id": "notif-0090", "isRead": true } }
```

### 18.3 POST /api/v1/notifications/mark-all-read

**Method:** POST
**Purpose:** Menandai seluruh notifikasi milik user sebagai dibaca.
**Authorization Requirement:** Permission `notification.read`

**Success Response Schema (200):**
```json
{ "success": true, "data": { "updatedCount": 3 } }
```

---

## 19. REPORTS ENDPOINTS

### 19.1 GET /api/v1/reports/win-loss

**Method:** GET
**Purpose:** Laporan Win/Loss (GAP11).
**Authorization Requirement:** Permission `report.read` (role: `mgmt`, `admin`)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `periodId` | uuid | Filter periode pelaporan |
| `branchId` | uuid | Filter cabang |
| `categoryId` | uuid | Filter kategori |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "totalProjects": 60,
    "won": 38,
    "lost": 22,
    "winRate": 0.633,
    "breakdown": [
      { "branchName": "Cabang Bandung", "won": 10, "lost": 4 }
    ]
  }
}
```

### 19.2 GET /api/v1/reports/pipeline

**Method:** GET
**Purpose:** Laporan Pipeline.
**Authorization Requirement:** Permission `report.read` (role: `mgmt`, `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "totalPipelineValue": 25000000000,
    "byStage": [ { "stage": "review_department", "count": 12, "value": 8000000000 } ]
  }
}
```

### 19.3 GET /api/v1/reports/progress-vs-target

**Method:** GET
**Purpose:** Laporan Progress vs Target per unit organisasi/periode (Target & KPI module).
**Authorization Requirement:** Permission `report.read` (role: `mgmt`, `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "branchName": "Cabang Bandung", "kpiCode": "pipeline_value", "target": 5000000000, "actual": 3200000000, "percentage": 64.0, "trafficLight": "yellow" }
  ]
}
```

### 19.4 POST /api/v1/reports/{reportType}/export

**Method:** POST
**Purpose:** Mengekspor laporan ke Excel atau PDF.
**Authorization Requirement:** Permission `report.export` (role: `mgmt`, `admin`)

**Path Parameters:** `reportType` — enum: `win-loss`, `pipeline`, `progress-vs-target`

**Request Body Schema:**
```json
{ "format": "string, required, enum: xlsx|pdf", "filters": { "periodId": "uuid, optional", "branchId": "uuid, optional" } }
```

**Success Response Schema (202):**
```json
{ "success": true, "data": { "exportJobId": "exp-0099", "status": "processing" } }
```

**Business Rules:**
- Export bersifat asynchronous untuk dataset besar (lihat 059 — Export Processing Time). Client polling `GET /api/v1/exports/{exportJobId}` untuk status dan URL download saat selesai.

### 19.5 GET /api/v1/exports/{exportJobId}

**Method:** GET
**Purpose:** Mengecek status job export dan mengambil URL download.
**Authorization Requirement:** Permission `report.export` + ownership (`requested_by = userContext.userId`)

**Success Response Schema (200):**
```json
{ "success": true, "data": { "exportJobId": "exp-0099", "status": "completed", "downloadUrl": "https://.../exports/exp-0099.xlsx", "expiresAt": "2025-06-11T09:00:00Z" } }
```

---

## 20. ATTACHMENTS / DOCUMENTS ENDPOINTS

### 20.1 POST /api/v1/documents

**Method:** POST
**Purpose:** Mengupload dokumen (FR070).
**Authorization Requirement:** Permission `document.upload` + scope check

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body Schema (multipart fields):**
```
file: binary, required
documentTypeCode: string, required (mengacu Master Tipe Dokumen)
resourceType: string, required (enum: prospect|rks|lphs_sios|harga)
resourceId: uuid, required
departmentId: uuid, optional (untuk LPHS revisi tertarget)
```

**Success Response Schema (201):**
```json
{
  "success": true,
  "data": {
    "id": "doc-0101",
    "fileName": "RKS_Gedung_Bandung_v1.pdf",
    "fileSizeBytes": 2458112,
    "mimeType": "application/pdf",
    "documentTypeCode": "RKS",
    "resourceType": "rks",
    "resourceId": "rks-0021",
    "versionNumber": 1,
    "uploadedAt": "2025-06-10T09:30:00Z"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `DOCUMENT_TYPE_NOT_ALLOWED` | 422 | Mime type tidak sesuai konfigurasi CFG-13 untuk `documentTypeCode` ini |
| `DOCUMENT_SIZE_EXCEEDED` | 422 | Ukuran file melebihi batas konfigurasi |
| `DOCUMENT_TYPE_NOT_FOUND` | 404 | `documentTypeCode` tidak dikenal |

**Business Rules:**
- File disimpan di luar webroot (lihat 048); response tidak pernah mengembalikan path filesystem, hanya `id` yang dipakai untuk endpoint download (lihat 020 §9.4).
- Jika dokumen dengan `resourceType` + `resourceId` + `documentTypeCode` yang sama sudah ada sebelumnya, upload baru otomatis menjadi versi baru (`versionNumber` increment) — lihat 049.

---

### 20.2 GET /api/v1/documents/{id}/download

**Method:** GET
**Purpose:** Mengunduh dokumen secara terautentikasi.
**Authorization Requirement:** Permission `document.download` + ownership/scope check

**Success Response:** Binary stream dengan header:
```
Content-Type: {mimeType asli}
Content-Disposition: attachment; filename="{fileName asli}"
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `DOCUMENT_NOT_FOUND` | 404 | Tidak ditemukan/luar scope |

**Business Rules:**
- Setiap download dicatat ke audit log (`document.download`, lihat 020 §10.2).

---

### 20.3 GET /api/v1/documents/{id}/versions

**Method:** GET
**Purpose:** Mengambil riwayat versi dokumen (GAP14, lihat 049).
**Authorization Requirement:** Permission `document.read` + scope check

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "versionNumber": 2, "uploadedBy": "Budi Santoso", "uploadedAt": "2025-06-09T10:00:00Z", "fileName": "RKS_Gedung_Bandung_v2.pdf" },
    { "versionNumber": 1, "uploadedBy": "Budi Santoso", "uploadedAt": "2025-05-16T10:00:00Z", "fileName": "RKS_Gedung_Bandung_v1.pdf" }
  ]
}
```

### 20.4 DELETE /api/v1/documents/{id}

**Method:** DELETE
**Purpose:** Menghapus dokumen draft yang belum disubmit.
**Authorization Requirement:** Permission `document.delete` (role: `pm`, `admin`) + status check

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_STATUS_LOCKED` | 403 | Dokumen sudah terkait resource yang disubmit |

---

## 21. AUDIT LOGS ENDPOINTS

### 21.1 GET /api/v1/audit-logs

**Method:** GET
**Purpose:** Mengambil audit log untuk keperluan investigasi/compliance (GAP16).
**Authorization Requirement:** Permission `audit_log.read` (role: `admin`)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `actorId` | uuid | Filter berdasarkan pelaku |
| `action` | string | Filter berdasarkan action code, contoh `prospect.create` |
| `resourceType` | string | Filter tipe resource |
| `resourceId` | uuid | Filter resource spesifik |
| `result` | string | `success`, `denied`, `error` |
| `dateFrom`/`dateTo` | date | Rentang tanggal |
| `page`, `perPage` | — | Standar (default `perPage=50` untuk audit log) |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-99001",
      "actorName": "Budi Santoso",
      "actorRole": "cabang",
      "action": "prospect.create",
      "resourceType": "prospect",
      "resourceId": "pros-0099",
      "ipAddress": "10.20.30.40",
      "result": "success",
      "createdAt": "2025-06-10T08:30:00Z"
    }
  ],
  "meta": { "pagination": { "page": 1, "perPage": 50, "totalItems": 12450, "totalPages": 249 } }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AUTHORIZATION_INSUFFICIENT_PERMISSION` | 403 | Role bukan admin |

**Business Rules:**
- Tidak ada endpoint PUT/PATCH/DELETE untuk resource ini — audit log bersifat append-only sesuai 020 §10.5.

### 21.2 GET /api/v1/audit-logs/{id}

**Method:** GET
**Purpose:** Detail satu entri audit log termasuk `payloadBefore`/`payloadAfter`.
**Authorization Requirement:** Permission `audit_log.read` (role: `admin`)

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "id": "log-99001",
    "actorName": "Budi Santoso",
    "action": "prospect.update",
    "payloadBefore": { "name": "Pengadaan IT Lama" },
    "payloadAfter": { "name": "Pengadaan IT Kantor Pusat" },
    "createdAt": "2025-06-10T08:30:00Z"
  }
}
```

### 21.3 POST /api/v1/audit-logs/export

**Method:** POST
**Purpose:** Mengekspor audit log ke CSV (GAP16).
**Authorization Requirement:** Permission `audit_log.export` (role: `admin`)

**Request Body Schema:**
```json
{ "dateFrom": "date, required", "dateTo": "date, required", "filters": { "actorId": "uuid, optional", "action": "string, optional" } }
```

**Success Response Schema (202):**
```json
{ "success": true, "data": { "exportJobId": "exp-audit-0012", "status": "processing" } }
```

**Business Rules:**
- Mengikuti pola async export yang sama dengan 19.4–19.5.
- Export audit log sendiri juga tercatat sebagai entri audit log baru (`audit_log.export`).

---

## 22. AI ENDPOINTS

Seluruh endpoint AI mengikuti prinsip arsitektur resmi: **Frontend → Backend API → AI Service Layer → Gemini API** (lihat 010). Business module tidak pernah memanggil Gemini API langsung; endpoint berikut adalah satu-satunya pintu masuk resmi dari frontend ke kapabilitas AI.

### 22.1 POST /api/v1/ai/tender-summary

**Method:** POST
**Purpose:** Menghasilkan ringkasan otomatis dokumen tender (RKS/LPHS) untuk satu proyek.
**Authorization Requirement:** Permission `project.read` + scope check (resource yang diringkas harus dalam scope user)

**Request Body Schema:**
```json
{ "projectId": "uuid, required", "documentType": "string, required, enum: rks|lphs_sios" }
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "summary": "Proyek ini merupakan tender pembangunan gedung 3 lantai dengan estimasi nilai Rp 4.5 miliar...",
    "keyPoints": ["Deadline penyerahan dokumen: 20 Juni 2025", "Memerlukan review dari 2 departemen: Engineering dan Legal"],
    "generatedAt": "2025-06-10T09:00:00Z",
    "provider": "gemini",
    "model": "gemini-2.5-flash"
  }
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AI_PROVIDER_UNAVAILABLE` | 503 | Gemini API tidak dapat dihubungi (lihat 010 — Retry Strategy) |
| `AI_RATE_LIMIT_EXCEEDED` | 429 | Rate limit AI Service Layer terlampaui |
| `AI_CONTENT_POLICY_VIOLATION` | 422 | Konten sumber tidak dapat diproses sesuai kebijakan provider |
| `PROJECT_NOT_FOUND` | 404 | Proyek tidak ditemukan/luar scope |

**Business Rules:**
- Setiap request AI dicatat di audit log dengan detail fitur AI yang dipanggil, sukses/gagal (lihat 010 — prinsip cross-document).
- Response di-cache 1 jam per `projectId` + `documentType` untuk efisiensi cost control (lihat 010).

---

### 22.2 POST /api/v1/ai/prospect-analysis

**Method:** POST
**Purpose:** Analisis AI terhadap data prospek untuk membantu keputusan PM (mis. probabilitas konversi).
**Authorization Requirement:** Permission `prospect.read` + scope check

**Request Body Schema:**
```json
{ "prospectId": "uuid, required" }
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "analysis": "Prospek ini memiliki profil serupa dengan 3 proyek sebelumnya yang dimenangkan di kategori IT Infrastructure...",
    "riskFactors": ["Customer belum mengonfirmasi budget"],
    "generatedAt": "2025-06-10T09:05:00Z"
  }
}
```

---

### 22.3 POST /api/v1/ai/competitor-analysis

**Method:** POST
**Purpose:** Analisis AI atas histori kompetitor pada kategori proyek tertentu.
**Authorization Requirement:** Permission `master_competitor.read` (role: `pm`, `mgmt`, `admin`)

**Request Body Schema:**
```json
{ "competitorId": "uuid, required" }
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "analysis": "PT Bangun Sejahtera cenderung mengajukan harga 3-5% di atas rata-rata pasar pada kategori Konstruksi...",
    "winRateAgainstUs": 0.35,
    "generatedAt": "2025-06-10T09:10:00Z"
  }
}
```

---

### 22.4 POST /api/v1/ai/kpi-insight

**Method:** POST
**Purpose:** Insight AI atas progress KPI vs target untuk membantu management.
**Authorization Requirement:** Permission `report.read` (role: `mgmt`, `admin`)

**Request Body Schema:**
```json
{ "branchId": "uuid, optional", "periodId": "uuid, required" }
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "insight": "Cabang Bandung berada di 64% dari target pipeline bulan ini, sedikit di bawah rata-rata historis 70% pada periode yang sama tahun lalu...",
    "generatedAt": "2025-06-10T09:15:00Z"
  }
}
```

---

### 22.5 POST /api/v1/ai/executive-summary

**Method:** POST
**Purpose:** Ringkasan eksekutif AI untuk widget dashboard management (lihat 050).
**Authorization Requirement:** Permission `dashboard.read` (role: `mgmt`, `admin`)

**Request Body Schema:**
```json
{ "periodMonth": "integer, required", "periodYear": "integer, required" }
```

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": {
    "summary": "Bulan ini, total pipeline aktif mencapai Rp 25 miliar dengan win rate 63%, naik 5% dari bulan lalu...",
    "generatedAt": "2025-06-10T09:20:00Z"
  }
}
```

---

### 22.6 GET /api/v1/ai/smart-search

**Method:** GET
**Purpose:** Pencarian semantik lintas modul (prospek, proyek, dokumen) menggunakan AI.
**Authorization Requirement:** Permission sesuai resource yang dicari; hasil difilter ulang berdasarkan scope user setelah AI mengembalikan kandidat

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `query` | string, required | Teks pencarian natural language |
| `scope` | string, optional | `prospects`, `projects`, `documents`, default semua |

**Success Response Schema (200):**
```json
{
  "success": true,
  "data": [
    { "resourceType": "project", "resourceId": "proj-0044", "name": "Pembangunan Gedung Cabang Bandung", "relevanceScore": 0.92 }
  ]
}
```

**Error Response Schema:**
| Code | HTTP | Kondisi |
|---|---|---|
| `AI_PROVIDER_UNAVAILABLE` | 503 | Provider AI tidak dapat dihubungi |
| `VALIDATION_ERROR` | 422 | `query` kosong |

**Business Rules:**
- Hasil dari AI Service Layer **wajib** difilter ulang oleh backend sesuai scope/ownership user (lihat 020 §3.4) sebelum dikembalikan ke client — AI tidak diberi izin untuk bypass authorization scope, sesuai prinsip "Business Module tidak boleh memanggil Gemini langsung" dan "AI Service Layer tidak menggantikan data scope enforcement" (Inferred Requirement IR-057-04: BA Review tidak membahas AI sama sekali secara eksplisit; namun 009/010 menetapkan AI Service Layer sebagai perantara wajib, sehingga smart search berbasis AI tetap harus tunduk pada data scope restriction yang sama dengan endpoint non-AI manapun, untuk mencegah AI menjadi celah kebocoran data lintas cabang).

---

## 23. INFERRED REQUIREMENTS

### IR-057-01: Pagination perPage Whitelist
Nilai `perPage` dibatasi ke `{10, 20, 50, 100}` mengikuti selector yang sudah ditetapkan FE Spec §5.1, untuk menjaga konsistensi UI-backend dan mencegah query dengan ukuran sembarang yang membebani server.

### IR-057-02: Single-Column Sort
BA Review dan FE Spec tidak menyebutkan kebutuhan multi-column sort pada tabel manapun di 014_UI_SCREEN_CATALOG; maka kontrak API Fase 1 hanya mendukung satu kolom sort aktif per request.

### IR-057-03: Fast-Entry Kompetitor Baru
Saat input harga penawaran di lapangan, user dapat memasukkan nama kompetitor baru tanpa menunggu admin membuat entri Master Kompetitor terlebih dahulu. Entri otomatis dibuat dengan status `pending_review` agar admin dapat merapikan/menggabungkan duplikat kemudian, tanpa menghalangi alur kerja cabang.

### IR-057-04: Data Scope Enforcement pada AI Smart Search
Hasil pencarian AI (smart search) wajib difilter ulang sesuai data scope user sebelum dikembalikan, karena AI Service Layer tidak boleh menjadi jalur bypass otorisasi data lintas cabang/departemen.

### IR-057-05: Async Export untuk Dataset Besar
Endpoint export laporan dan audit log bersifat asynchronous (202 Accepted + polling job status) karena volume data laporan/audit dapat melebihi batas waktu response HTTP standar — kebutuhan ini konsisten dengan target Export Processing Time yang akan didefinisikan terukur di 059_NON_FUNCTIONAL_REQUIREMENTS.

### IR-057-06: Endpoint Audit Log Read-Only Tanpa Pengecualian
Tidak ada endpoint UPDATE/DELETE untuk `audit_logs` di seluruh katalog API ini, termasuk untuk role `admin`, untuk menjamin sifat append-only yang dipersyaratkan 020 §10.5.

---

## 24. ENDPOINT SUMMARY TABLE

| Domain | Jumlah Endpoint | Path Prefix |
|---|---|---|
| Authentication | 5 | `/auth/*` |
| Users | 8 | `/users/*` |
| Roles & Permissions | 7 | `/roles/*`, `/permissions` |
| Dashboard | 3 | `/dashboard/*` |
| Prospects | 9 | `/prospects/*` |
| Projects | 5 | `/projects/*` |
| RKS | 6 | `/rks/*`, `/projects/{id}/rks` |
| LPHS/SIOS | 7 | `/lphs-sios/*` |
| Harga & Kompetitor | 3 | `/projects/{id}/harga`, `/harga/*` |
| Pemenang & Delivery | 4 | `/projects/{id}/pemenang`, `/delivery/*` |
| Approvals | 4 | `/approvals/*` |
| Master Data | 4 generik × 15 resource | `/master/*` |
| Configuration | 14 | `/config/*` |
| Notifications | 3 | `/notifications/*` |
| Reports | 5 | `/reports/*`, `/exports/*` |
| Documents | 4 | `/documents/*` |
| Audit Logs | 3 | `/audit-logs/*` |
| AI | 6 | `/ai/*` |
| **TOTAL** | **96 kontrak unik (di luar perkalian resource Master Data)** | |
