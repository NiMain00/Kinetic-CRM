# 008 — SECURITY ARCHITECTURE
## KINETIC CRM — Arsitektur Keamanan

**Modul:** Architecture
**Sumber Utama:** PRD §9.1 (Security NFR), §8.1 (Autentikasi); BA Review (implikasi keamanan dari berbagai gap)
**Dependensi Dokumen:** 005, 007
**Dirujuk Oleh:** 019 (Authentication), 020 (Authorization Enforcement), 048 (Document Upload), 059 (Non-Functional Requirements)

---

## 1. TUJUAN DOKUMEN

Mendefinisikan kontrol keamanan menyeluruh yang wajib diterapkan di setiap layer KINETIC CRM, melampaui sekadar daftar NFR PRD — menjadi blueprint implementasi konkret bagi Backend Developer dan DevOps.

---

## 2. AUTENTIKASI

| Kontrol | Spesifikasi |
|---|---|
| Mekanisme | JWT dengan expiry 8 jam, ATAU session cookie `HttpOnly` + `Secure` + `SameSite=Strict` |
| Password Hashing | bcrypt, cost factor minimal 12 |
| Password Policy | Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka |
| Account Lockout | Setelah 5 kali gagal login berturut-turut, akun terkunci 15 menit |
| Idle Session Timeout | 30 menit tanpa aktivitas → session expired, redirect ke login |
| Multi-Session Handling | Dua session aktif bersamaan untuk user yang sama → session terlama diinvalidasi |
| Deaktivasi User Real-Time | Admin menonaktifkan user yang sedang online → session diinvalidasi dalam 5 menit (melalui pengecekan status `is_active` pada setiap request, bukan hanya saat login) |
| Rate Limiting Login | Endpoint `/api/v1/auth/login` dibatasi 10 request/menit per IP |

Detail proses lengkap di dokumen 019.

---

## 3. OTORISASI (RBAC ENFORCEMENT)

| Kontrol | Spesifikasi |
|---|---|
| Model | Role-Based Access Control dinamis (bukan enum hardcode) — lihat 017 |
| Layer Enforcement | (1) Route Guard Frontend [UX saja], (2) Middleware Backend [enforcement sesungguhnya], (3) Query Scope Database [pertahanan terakhir] |
| Prinsip | **Setiap endpoint backend WAJIB memvalidasi role dan scope dari token/session server, tidak pernah hanya mempercayai klaim dari client** |
| Granularitas | Permission per kombinasi (role, resource, action) — lihat Permission Matrix di 017 |

Detail teknis enforcement berlapis di dokumen 020.

---

## 4. ENKRIPSI

| Aspek | Kontrol |
|---|---|
| Data in Transit | HTTPS wajib di **semua** environment termasuk development (self-signed cert via Docker untuk lokal) |
| Data at Rest (Password) | bcrypt hash, tidak pernah disimpan plaintext atau reversible encryption |
| Secrets | Disimpan hanya di environment variables (`.env`), tidak pernah di source code atau version control — lihat 060 |
| API Key AI (Gemini) | Disimpan sebagai secret backend, tidak pernah terekspos ke Frontend atau response API manapun |

---

## 5. OWASP TOP 10 — KONTROL SPESIFIK

| Risiko OWASP | Kontrol KINETIC CRM |
|---|---|
| **A01 Broken Access Control** | RBAC enforcement berlapis (lihat §3); setiap query daftar disaring berdasarkan scope user (cabang/dept) di level backend, bukan hanya disembunyikan di UI |
| **A02 Cryptographic Failures** | bcrypt cost ≥12, HTTPS wajib, secrets via env var |
| **A03 Injection (SQL Injection)** | **Wajib** PDO prepared statements di seluruh backend PHP; raw SQL concatenation dilarang tanpa kecuali (mengatasi Risk R-07 PRD) |
| **A04 Insecure Design** | State machine eksplisit dengan precondition enforcement backend (lihat 039); optimistic locking (007) |
| **A05 Security Misconfiguration** | Environment separation eksplisit (local/dev/staging/production — lihat 060); pesan error generik ke user, detail hanya di log server |
| **A07 Identification & Auth Failures** | Lihat §2 — lockout, idle timeout, rate limiting |
| **A08 Software & Data Integrity Failures** | Audit log append-only (007 Prinsip 5); validasi JSON Schema untuk `question_type_defs.config` |
| **A09 Security Logging & Monitoring Failures** | Audit log mencatat seluruh login (berhasil/gagal), mutasi data, dan akses dokumen — lihat 052 |
| **A10 Server-Side Request Forgery** | AI Service Layer (010) memvalidasi dan membatasi tujuan request keluar (hanya ke endpoint Gemini API resmi, tidak menerima URL dinamis dari input user) |

---

## 6. CSRF, XSS, DAN INPUT SANITIZATION

| Kontrol | Spesifikasi |
|---|---|
| CSRF Protection | CSRF token wajib untuk seluruh mutasi (`POST`/`PUT`/`DELETE`) |
| XSS Prevention | Output escaping konsisten di Frontend React (default React behavior + sanitasi tambahan untuk konten yang dirender sebagai HTML, misal hasil ringkasan AI) dan response API backend |
| Input Sanitization | Seluruh input user divalidasi dan di-escape sebelum query DB; validasi dilakukan di Frontend (UX) **dan** Backend (keamanan sesungguhnya) |
| Validasi MIME Type Upload | Validasi dilakukan di server berdasarkan **konten file** (magic byte), bukan hanya ekstensi nama file — lihat 048 |

---

## 7. KEAMANAN UPLOAD FILE

| Kontrol | Spesifikasi |
|---|---|
| Tipe File Diizinkan | PDF, DOCX, XLSX, JPEG, PNG (dapat dikonfigurasi per tipe dokumen via CFG-13 — lihat 031) |
| Ukuran Maksimum | 25 MB per file (default, dapat dikonfigurasi) |
| Lokasi Penyimpanan | Di luar webroot, tidak dapat diakses langsung via URL statis |
| Validasi | Client-side (UX) **dan** server-side (keamanan); validasi MIME type di server berbasis konten file |
| Sanitasi Nama File | Nama file disanitasi (anti path traversal, anti karakter berbahaya) sebelum disimpan; nama fisik di disk menggunakan identifier acak |
| Audit | Setiap upload dan download dicatat di `audit_logs` |

---

## 8. KEAMANAN SPESIFIK AI (LAPISAN TAMBAHAN)

| Kontrol | Spesifikasi |
|---|---|
| Isolasi Akses | Hanya AI Service Layer yang memiliki kredensial untuk memanggil Gemini API; modul bisnis tidak memiliki akses langsung |
| Validasi Input ke AI | Data sensitif (password, token) tidak pernah dimasukkan ke dalam prompt; data yang dikirim ke provider AI eksternal dibatasi pada konten yang relevan dengan fitur (misal isi dokumen RKS untuk fitur ringkasan) |
| Audit Permintaan AI | Setiap permintaan AI tercatat: siapa, kapan, fitur apa, berhasil/gagal — lihat 052 |
| Rate Limiting per User | Mencegah penyalahgunaan kuota AI oleh satu user (detail di 010) |
| Data Residency/Privasi *(Inferred)* | **Inferred Requirement** — karena KINETIC CRM mengirim data bisnis (isi dokumen tender, data customer) ke provider eksternal (Gemini), kebijakan data governance harus memastikan tidak ada data customer yang bersifat rahasia kontraktual dikirim tanpa anonimisasi jika diperlukan oleh kebijakan perusahaan. *Alasan: tidak disebutkan eksplisit di tiga dokumen sumber karena AI baru ditambahkan; ini adalah praktik standar saat mengintegrasikan LLM eksternal dengan data bisnis sensitif. Detail kebijakan didelegasikan ke 010 §Security Policy.* |

---

## 9. SECRETS MANAGEMENT (RINGKASAN — DETAIL DI 060)

- Seluruh secret (DB password, JWT secret, `GEMINI_API_KEY`) hanya berasal dari environment variables.
- Tidak ada secret yang di-commit ke version control; `.env.example` disediakan sebagai template tanpa nilai asli.
- Rotasi API key (termasuk Gemini) dapat dilakukan tanpa redeploy aplikasi (CFG-14, lihat 031).

---

## 10. KEAMANAN INFRASTRUKTUR (RINGKASAN — DETAIL DI 060)

- Container berjalan dengan privilese minimal (non-root user di dalam container jika memungkinkan).
- Port database (MySQL) tidak diekspos ke host di environment production.
- Environment separation (local/dev/staging/production) memastikan kredensial dan tingkat logging berbeda per environment.

---

## 11. CHECKLIST KEAMANAN SEBELUM GO-LIVE

- [ ] Seluruh endpoint API diuji dengan token role yang salah (negative test RBAC) — lihat 062
- [ ] Seluruh form input diuji dengan payload XSS/SQLi dasar
- [ ] HTTPS aktif di seluruh environment termasuk staging
- [ ] Rate limiting login dan AI berfungsi
- [ ] Audit log tidak dapat diedit/dihapus melalui API manapun
- [ ] API key Gemini tidak muncul di response API atau console log Frontend
- [ ] File upload ditolak untuk tipe file di luar whitelist, termasuk saat ekstensi dipalsukan
