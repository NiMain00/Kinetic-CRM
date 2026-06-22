# 019 — AUTHENTICATION & SESSION MODULE
## KINETIC CRM — Modul Autentikasi dan Manajemen Sesi

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 019 |
| **Nama Dokumen** | Authentication & Session Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR001–FR004, FE Spec Section 3, BA Review Section B.3 |
| **Status** | Final |

---

## 1. PURPOSE

Mendefinisikan mekanisme autentikasi lengkap untuk KINETIC CRM: login, JWT token management, session lifecycle, idle timeout, lockout policy, dan multi-session handling. Ini adalah modul keamanan fundamental yang mendukung seluruh sistem.

---

## 2. AUTHENTICATION FLOW

### 2.1 Login Flow

```
1. User input username + password di /login
2. Client validasi client-side (min length, required)
3. POST /api/auth/login → { username, password }
4. Backend:
   a. Cari user by username (case-insensitive)
   b. Cek is_active = 1; jika tidak → return 403 "Akun tidak aktif"
   c. Cek locked_until > NOW(); jika ya → return 423 "Akun terkunci"
   d. Verifikasi password dengan bcrypt.verify()
   e. Jika gagal: increment failed_login_count; cek threshold lockout
   f. Jika berhasil:
      - Reset failed_login_count = 0, locked_until = NULL
      - Update last_login_at, last_login_ip
      - Generate JWT access token (exp: 8 jam)
      - Generate refresh token (exp: 7 hari)
      - Simpan refresh token di DB (tabel sessions)
      - Return token + user data
5. Client simpan token ke httpOnly cookie (primary) atau localStorage (fallback)
6. Redirect ke /dashboard atau ke state.from (URL sebelumnya)
```

### 2.2 Logout Flow

```
1. User klik Logout
2. POST /api/auth/logout (dengan Authorization header)
3. Backend:
   a. Blacklist access token (simpan di cache dengan TTL = sisa exp token)
   b. Hapus/invalidate refresh token dari tabel sessions
4. Client: clear auth store → redirect /login
```

### 2.3 Token Refresh Flow

```
1. Access token expired (interceptor 401)
2. Client coba refresh: POST /api/auth/refresh dengan refresh token
3. Backend:
   a. Validasi refresh token dari DB
   b. Cek is_active user
   c. Generate access token baru
   d. Rotate refresh token (hapus lama, buat baru)
4. Jika refresh gagal → logout paksa → redirect /login
```

---

## 3. JWT TOKEN SPECIFICATION

### 3.1 Access Token Payload

```json
{
  "sub": 42,
  "name": "Budi Santoso",
  "username": "budi_santoso",
  "role": "cabang",
  "role_id": 5,
  "branch_id": 3,
  "department_id": null,
  "company_id": 1,
  "iat": 1717200000,
  "exp": 1717228800
}
```

- **Algorithm:** HS256 (Fase 1); RS256 direkomendasikan untuk Fase 2 multi-service
- **Secret:** Dari environment variable `JWT_SECRET` (min 64 karakter random)
- **Expiry:** 8 jam (28800 detik)
- **Audience:** `kinetic-crm-api`

### 3.2 Refresh Token

- Format: random 64-byte hex string (128 karakter)
- Expiry: 7 hari
- Storage: DB tabel `sessions` (hashed SHA-256 sebelum simpan)
- Single-use: setiap refresh menghasilkan token baru (rotation)

---

## 4. SESSION MANAGEMENT

### 4.1 Entity: Sessions

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `user_id` | BIGINT UNSIGNED FK | |
| `token_hash` | VARCHAR(64) NOT NULL | SHA-256 hash dari refresh token |
| `ip_address` | VARCHAR(45) | IP saat session dibuat |
| `user_agent` | VARCHAR(500) | Browser/device info |
| `expires_at` | TIMESTAMP NOT NULL | Expiry refresh token |
| `revoked_at` | TIMESTAMP NULL | Saat token direvoke (logout/invalidate) |
| `created_at` | TIMESTAMP NOT NULL | |

### 4.2 Multi-Session Handling

- Satu user **dapat memiliki multiple session aktif** (mis: laptop + handphone)
- Maksimal **3 session aktif per user** secara bersamaan
- Jika melebihi 3: session terlama dihapus (oldest-first eviction)
- Logout hanya menghapus session saat ini (bukan semua session)
- Admin dapat melihat dan invalidasi semua session user melalui panel admin

### 4.3 Session Invalidation Events

Session otomatis diinvalidasi saat:
- User logout
- Admin nonaktifkan user
- Admin reset password user
- Admin manual invalidate dari panel (fitur Inferred IR-SESSION-01)
- Token refresh gagal (token tidak ditemukan / expired)

---

## 5. IDLE TIMEOUT

### 5.1 Mekanisme

```
- VITE_SESSION_WARN_MINUTES (default: 25) = menit sebelum expired tampilkan warning
- Warning modal muncul dengan countdown timer
- Jika user klik "Lanjutkan": trigger GET /api/auth/me → backend refresh TTL session
- Jika tidak ada aksi dalam waktu 5 menit setelah warning: logout paksa
- Jika tab tidak aktif: warning tetap ditampilkan saat tab kembali aktif
```

### 5.2 Frontend Implementation

```typescript
// useSessionTimeout hook
const WARNING_MS = (VITE_SESSION_WARN_MINUTES - 5) * 60 * 1000;
const EXPIRE_MS = VITE_SESSION_WARN_MINUTES * 60 * 1000;

useEffect(() => {
  const warnTimer = setTimeout(showWarningModal, WARNING_MS);
  const expireTimer = setTimeout(forceLogout, EXPIRE_MS);
  return () => { clearTimeout(warnTimer); clearTimeout(expireTimer); };
}, [lastActivity]);

// Reset timer on user activity (click, keypress, mousemove)
const resetTimer = debounce(() => setLastActivity(Date.now()), 1000);
```

---

## 6. LOCKOUT POLICY

| Event | Aksi |
|---|---|
| 3 kali login gagal | Tampilkan pesan "Hati-hati: X percobaan lagi akan mengunci akun" |
| 5 kali login gagal | `locked_until = NOW() + 15 menit`; `failed_login_count = 5` |
| Login berhasil | `failed_login_count = 0`; `locked_until = NULL` |
| Lockout aktif | Return HTTP 423 dengan pesan "Akun terkunci sampai HH:MM. Silakan coba lagi." |
| Admin unlock manual | `locked_until = NULL`; `failed_login_count = 0` |

---

## 7. MUST CHANGE PASSWORD FLOW

Jika `must_change_password = true` (setelah create user atau reset password):

```
1. Login berhasil
2. Backend response tetap 200 dengan token
3. Token payload mengandung: "must_change_password": true
4. Frontend redirect ke /profile/change-password SEBELUM /dashboard
5. Semua route lain di-redirect ke /profile/change-password sampai password diganti
6. Setelah ganti password: must_change_password = false; redirect /dashboard
```

---

## 8. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/auth/login | Public | Login; return access + refresh token |
| POST | /api/auth/logout | Bearer | Logout; invalidate current session |
| POST | /api/auth/refresh | RefreshToken | Refresh access token |
| GET | /api/auth/me | Bearer | Get current user data |
| PUT | /api/auth/change-password | Bearer | Ganti password (current + new) |
| PUT | /api/auth/profile | Bearer | Update profil diri (name, email, avatar) |
| GET | /api/admin/users/:id/sessions | Admin | List session aktif user |
| DELETE | /api/admin/users/:id/sessions | Admin | Invalidasi semua session user |
| PUT | /api/admin/users/:id/unlock | Admin | Manual unlock akun terkunci |

### 8.1 Login Request/Response

**Request:**
```json
POST /api/auth/login
{ "username": "budi_santoso", "password": "MyPass123!" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "a1b2c3d4...",
    "token_type": "Bearer",
    "expires_in": 28800,
    "user": {
      "id": 42,
      "name": "Budi Santoso",
      "username": "budi_santoso",
      "email": "budi@company.com",
      "role": "cabang",
      "role_id": 5,
      "branch_id": 3,
      "branch_name": "Cabang Jakarta Selatan",
      "department_id": null,
      "must_change_password": false,
      "avatar_url": "/storage/avatars/42.jpg"
    }
  }
}
```

**Response 401 (credentials salah):**
```json
{
  "success": false,
  "message": "Username atau password salah",
  "attempts_remaining": 2
}
```

**Response 423 (terkunci):**
```json
{
  "success": false,
  "message": "Akun terkunci sampai 10:45 WIB. Silakan coba lagi.",
  "locked_until": "2025-06-01T03:45:00Z"
}
```

---

## 9. SECURITY REQUIREMENTS

| Requirement | Detail |
|---|---|
| Password hashing | bcrypt dengan cost factor 12 |
| JWT secret | Min 64 karakter; dari env var; rotasi berkala |
| HTTPS | Wajib di production; HTTP redirect ke HTTPS |
| httpOnly cookie | Access token di-set via Set-Cookie dengan httpOnly + Secure + SameSite=Strict |
| Token blacklist | Access token yang di-logout di-cache (Redis/in-memory) sampai exp |
| Rate limiting | Login endpoint: max 10 request/menit per IP |
| Input sanitization | Username dan password di-sanitize sebelum diproses |
| No plaintext password | Password tidak pernah di-log atau di-return dalam response |

---

## 10. DATABASE SCHEMA (DDL)

```sql
-- ============================================================
-- TABLE: sessions
-- ============================================================
CREATE TABLE sessions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  VARCHAR(64)     NOT NULL,
  ip_address  VARCHAR(45)     NULL,
  user_agent  VARCHAR(500)    NULL,
  expires_at  TIMESTAMP       NOT NULL,
  revoked_at  TIMESTAMP       NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY idx_sessions_user_id    (user_id),
  KEY idx_sessions_expires_at (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: token_blacklist (untuk blacklist access token yang logout)
-- ============================================================
CREATE TABLE token_blacklist (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_jti   VARCHAR(100)    NOT NULL,
  expires_at  TIMESTAMP       NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token_blacklist_jti (token_jti),
  KEY idx_token_blacklist_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 11. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-AUTH-01 | Login dengan credentials benar | HTTP 200; token diterima; redirect /dashboard |
| TC-AUTH-02 | Login dengan password salah | HTTP 401; attempts_remaining menurun |
| TC-AUTH-03 | Login gagal 5 kali berturut-turut | HTTP 423; akun terkunci 15 menit |
| TC-AUTH-04 | Login saat akun terkunci | HTTP 423 dengan sisa waktu lockout |
| TC-AUTH-05 | Access token expired, ada valid refresh token | Auto-refresh; tidak perlu login ulang |
| TC-AUTH-06 | Access token expired, refresh token juga expired | Logout paksa; redirect /login + toast |
| TC-AUTH-07 | User nonaktif mencoba login | HTTP 403; "Akun tidak aktif" |
| TC-AUTH-08 | Idle timeout + warning | Modal warning muncul; countdown 5 menit |
| TC-AUTH-09 | Klik "Lanjutkan" di warning modal | Session diperpanjang; modal tutup |
| TC-AUTH-10 | User baru (must_change_password=true) login | Redirect ke /profile/change-password; route lain blocked |
| TC-AUTH-11 | 2 browser login bersamaan dengan user sama | Keduanya valid; keduanya dapat token berbeda |
| TC-AUTH-12 | Logout dari satu browser | Session browser itu saja invalid; browser lain tetap aktif |
| TC-AUTH-13 | Admin reset password user yang sedang login | Semua session user diinvalidasi; user di-logout |

---

## 12. RELATED DOCUMENTS

| Dokumen | Relasi |
|---|---|
| 018 — User Management | User entity yang digunakan dalam auth |
| 017 — Role & Permission | Role dan permission dari JWT payload |
| 020 — Authorization Enforcement | Penggunaan JWT di middleware backend |
| 008 — Security Architecture | OWASP controls, HTTPS enforcement |

**FR Coverage:** FR001 (Login) ✓ | FR002 (Session) ✓ | FR003 (Password) ✓ | FR004 (Lockout) ✓
