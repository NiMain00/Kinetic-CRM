# 018 — USER MANAGEMENT MODULE
## KINETIC CRM — Modul Manajemen Pengguna

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 018 |
| **Nama Dokumen** | User Management Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0, FE Spec Section 8.5 |
| **Gap Resolution** | GAP-05 (branch_id/dept_id pada user) |
| **Status** | Final |

---

## 1. PURPOSE

Modul ini mendefinisikan CRUD lengkap untuk akun pengguna sistem KINETIC CRM, mencakup: pembuatan akun, assignment role/cabang/departemen/posisi, reset password, manajemen status aktif/nonaktif, dan riwayat aktivitas pengguna. Admin adalah satu-satunya role yang dapat mengelola pengguna.

---

## 2. ENTITY: User

### 2.1 Schema Lengkap Tabel `users`

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(200) | NOT NULL | Nama lengkap |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Username login; alphanumeric + underscore |
| `email` | VARCHAR(200) | NOT NULL, UNIQUE | Email; digunakan untuk notifikasi & reset password |
| `password` | VARCHAR(255) | NOT NULL | Hashed (bcrypt, cost 12) |
| `role` | VARCHAR(50) | NOT NULL | Kode role string (legacy; akan digantikan role_id) |
| `role_id` | BIGINT UNSIGNED | NOT NULL, FK → roles.id | FK ke tabel roles (sistem baru) |
| `branch_id` | BIGINT UNSIGNED | NULL, FK → branches.id | Wajib jika role = cabang |
| `department_id` | BIGINT UNSIGNED | NULL, FK → departments.id | Wajib jika role = department |
| `company_id` | BIGINT UNSIGNED | NULL, FK → companies.id | Opsional; untuk konteks perusahaan |
| `position_id` | BIGINT UNSIGNED | NULL, FK → positions.id | Jabatan/posisi user |
| `avatar_path` | VARCHAR(500) | NULL | Path avatar di storage |
| `must_change_password` | TINYINT(1) | NOT NULL DEFAULT 1 | Wajib ganti password setelah dibuat Admin |
| `failed_login_count` | TINYINT UNSIGNED | NOT NULL DEFAULT 0 | Counter login gagal |
| `locked_until` | TIMESTAMP | NULL | Akun terkunci sampai timestamp ini |
| `last_login_at` | TIMESTAMP | NULL | Waktu login terakhir |
| `last_login_ip` | VARCHAR(45) | NULL | IP terakhir login |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | Soft-enable/disable |
| `created_by` | BIGINT UNSIGNED | NULL, FK → users.id | Admin yang membuat |
| `updated_by` | BIGINT UNSIGNED | NULL, FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

## 3. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-USER-01 | Admin tidak bisa menghapus user secara permanen; hanya nonaktifkan (soft-delete) |
| BR-USER-02 | Jika role = cabang, `branch_id` wajib diisi; `department_id` harus NULL |
| BR-USER-03 | Jika role = department, `department_id` wajib diisi; `branch_id` harus NULL |
| BR-USER-04 | Jika role = pm / management / admin, keduanya boleh NULL |
| BR-USER-05 | Username tidak bisa diubah setelah dibuat (immutable) |
| BR-USER-06 | Password awal di-generate atau diinput Admin; flag `must_change_password = true` |
| BR-USER-07 | Saat Admin reset password, password baru dikirim ke email user; flag `must_change_password` di-set true |
| BR-USER-08 | Setelah 5 kali login gagal, akun terkunci 15 menit (`locked_until = NOW() + 15 menit`) |
| BR-USER-09 | User yang dinonaktifkan tidak bisa login; session yang sedang aktif diinvalidasi |
| BR-USER-10 | User tidak bisa mengedit data diri sendiri melalui halaman admin; hanya melalui /profile |
| BR-USER-11 | Email harus unik di seluruh sistem |

---

## 4. CRUD OPERATIONS

### 4.1 Create User

```
POST /api/admin/users
Authorization: Admin only
Content-Type: application/json

Body:
{
  "name": "Budi Santoso",
  "username": "budi_santoso",
  "email": "budi@company.com",
  "role_id": 5,
  "branch_id": 3,
  "department_id": null,
  "position_id": 7,
  "password": "InitialPass123!"
}

Response 201:
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Budi Santoso",
    "username": "budi_santoso",
    "email": "budi@company.com",
    "role": { "id": 5, "code": "cabang", "name": "Staf Cabang" },
    "branch": { "id": 3, "name": "Cabang Jakarta Selatan" },
    "is_active": true,
    "must_change_password": true,
    "created_at": "2025-06-01T10:00:00Z"
  },
  "message": "Pengguna berhasil dibuat. Password awal telah dikirim ke email."
}
```

### 4.2 Read User List

```
GET /api/admin/users?search=budi&roleId=&isActive=&branchId=&page=1&perPage=20

Response 200:
{
  "data": [ { ...user objects... } ],
  "meta": { "total": 45, "page": 1, "perPage": 20, "lastPage": 3 }
}
```

### 4.3 Update User

```
PUT /api/admin/users/:id
Body: { name?, email?, role_id?, branch_id?, department_id?, position_id?, is_active? }

Note: username dan password tidak bisa diubah melalui endpoint ini.
```

### 4.4 Deactivate User

```
PUT /api/admin/users/:id/deactivate
Body: { reason: "Karyawan resign" }

Efek:
- is_active = 0
- Semua active sessions user diinvalidasi
- Pending approvals yang di-assign ke user ini dinotifikasi ke backup approver
```

### 4.5 Activate User

```
PUT /api/admin/users/:id/activate
Efek: is_active = 1; must_change_password = 1 (wajib ganti password setelah diaktifkan ulang)
```

### 4.6 Reset Password

```
POST /api/admin/users/:id/reset-password
Body: {} (tidak perlu body)

Efek:
- Generate password baru yang aman (random 12 char)
- Hash dan simpan ke DB
- Set must_change_password = true
- Kirim email ke user dengan password baru
- Invalidasi semua session aktif user

Response 200:
{
  "success": true,
  "message": "Password baru telah dikirim ke email budi@company.com"
}
```

---

## 5. VALIDATION RULES

| Field | Rule | Pesan Error |
|---|---|---|
| name | Required, 2–200 char | "Nama lengkap wajib diisi" |
| username | Required, 3–50 char, alphanumeric+underscore, unique | "Username sudah digunakan" |
| email | Required, format email, unique | "Email sudah terdaftar" |
| role_id | Required, must exist in roles | "Role tidak valid" |
| branch_id | Required jika role=cabang, must be active branch | "Cabang tidak ditemukan atau tidak aktif" |
| department_id | Required jika role=department, must be active dept | "Departemen tidak valid" |
| password (saat create) | Required, min 8 char | "Password minimal 8 karakter" |

---

## 6. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/admin/users | Admin | List pengguna dengan filter |
| POST | /api/admin/users | Admin | Buat pengguna baru |
| GET | /api/admin/users/:id | Admin | Detail pengguna |
| PUT | /api/admin/users/:id | Admin | Update data pengguna |
| PUT | /api/admin/users/:id/deactivate | Admin | Nonaktifkan pengguna |
| PUT | /api/admin/users/:id/activate | Admin | Aktifkan kembali pengguna |
| POST | /api/admin/users/:id/reset-password | Admin | Reset password + kirim email |
| GET | /api/admin/users/:id/activity | Admin | Riwayat aktivitas pengguna |

---

## 7. DATABASE INDEXES

```sql
CREATE INDEX idx_users_username   ON users(username);
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_role_id    ON users(role_id);
CREATE INDEX idx_users_branch_id  ON users(branch_id);
CREATE INDEX idx_users_dept_id    ON users(department_id);
CREATE INDEX idx_users_is_active  ON users(is_active);
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-USER-01 | Admin buat user baru dengan role cabang tanpa isi branch_id | Error 422: "Cabang wajib dipilih untuk role Staf Cabang" |
| TC-USER-02 | Admin buat user dengan username yang sudah ada | Error 422: "Username sudah digunakan" |
| TC-USER-03 | Admin reset password user | Password baru dikirim ke email; user harus ganti password saat login berikutnya |
| TC-USER-04 | Admin nonaktifkan user yang sedang login | Session user diinvalidasi; user otomatis logout |
| TC-USER-05 | User yang dinonaktifkan mencoba login | Error: "Akun Anda tidak aktif. Hubungi Administrator." |
| TC-USER-06 | Admin coba hapus user (tidak ada tombol hapus) | Tidak bisa; hanya nonaktifkan |
| TC-USER-07 | User login gagal 5 kali | Akun terkunci 15 menit; pesan "Akun terkunci" |
| TC-USER-08 | Admin aktifkan kembali user yang nonaktif | is_active = 1; must_change_password = 1 |

---

## 9. RELATED DOCUMENTS

| Dokumen | Relasi |
|---|---|
| 015 — Organization Hierarchy | branch_id dan department_id FK |
| 017 — Role & Permission | role_id FK; permission matrix |
| 019 — Authentication Session | Login, lockout, session lifecycle |
| 016 — Position Management | position_id FK; delegasi approval |

**Gap Resolution:** GAP-05 ✓ (branch_id/dept_id pada user)
