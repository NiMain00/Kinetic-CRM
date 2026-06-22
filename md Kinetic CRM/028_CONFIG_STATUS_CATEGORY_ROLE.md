# 028 — KONFIGURASI STATUS, KATEGORI & ROLE
## KINETIC CRM — CFG-03, CFG-04, CFG-11

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 028 |
| **Nama Dokumen** | Konfigurasi Status Proyek, Role & Permission, Kategori Proyek |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.2 (CFG-03, CFG-04, CFG-11) |
| **Gap Resolution** | CFG-03, CFG-04 High Priority, CFG-11, GAP-02 |
| **Status** | Final |

---

## 1. CFG-03 — KONFIGURASI STATUS PROYEK

### 1.1 Overview

Halaman konfigurasi yang memungkinkan Admin mengelola daftar status proyek secara dinamis: mengubah label tampilan, warna badge, urutan, dan transisi yang diizinkan. Entitas teknis didefinisikan di dokumen 022.

### 1.2 UI Komponen

**List Status:**

| No | Kode | Label | Warna | Urutan | Tipe Proyek | Aktif | Aksi |
|---|---|---|---|---|---|---|---|
| 1 | created | Dibuat | ⬛ #6B7280 | 1 | Semua | ✓ | Edit \| — |
| 2 | submit_rks | RKS Disubmit | 🔵 #2563A8 | 2 | Tender | ✓ | Edit |
| ... | | | | | | | |

**Modal Edit Status:**
- Kode Status: Read-only jika `is_system = 1`; editable jika custom
- Label Tampilan: Input text, required
- Warna Badge: Color picker (wheel + hex input); preview badge real-time
- Warna Teks Badge: Color picker; default putih; preview kontras ratio
- Urutan: Number input; digunakan untuk urutan di filter dropdown
- Tipe Proyek: Checkbox multi: Tender / Prospecting
- Status Aktif: Toggle

**Tab Allowed Transitions (sub-panel di dalam modal edit atau panel terpisah):**

Tabel matrix: Status Asal (baris) × Status Tujuan (kolom) × Allowed Roles (dropdown per sel).

```
                CREATED  SUBMIT_RKS  LPHS  REVISION  SELESAI  CANCELLED
CREATED           —         PM          —      —         —       PM,Admin
SUBMIT_RKS        —          —         PM      PM        —       PM,Admin
LPHS              —          —          —      PM       MGMT     PM,Admin
...
```

### 1.3 Business Rules — CFG-03

| ID | Rule |
|---|---|
| BR-CFG03-01 | Status `is_system = true`: kode tidak bisa diubah, hanya label + warna |
| BR-CFG03-02 | Status yang sedang digunakan proyek aktif tidak bisa dinonaktifkan |
| BR-CFG03-03 | Status `is_terminal = true` tidak bisa memiliki transisi keluar |
| BR-CFG03-04 | Warna teks otomatis dipilih (hitam/putih) berdasarkan luminansi warna background untuk memenuhi WCAG AA kontras 4.5:1 |
| BR-CFG03-05 | Setiap perubahan status langsung tercermin di semua badge yang menampilkan status tersebut (data dari API, bukan hardcode) |

### 1.4 API Endpoints — CFG-03

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/statuses | Admin | List semua status |
| POST | /api/config/statuses | Admin | Buat status baru |
| PUT | /api/config/statuses/:id | Admin | Update status |
| PUT | /api/config/statuses/:id/deactivate | Admin | Nonaktifkan |
| GET | /api/config/status-transitions | Admin | List semua transisi |
| POST | /api/config/status-transitions | Admin | Tambah transisi baru |
| DELETE | /api/config/status-transitions/:id | Admin | Hapus transisi |

---

## 2. CFG-04 — KONFIGURASI ROLE & PERMISSION

### 2.1 Overview

Antarmuka untuk mengelola role dan permission matrix. Detail teknis di dokumen 017. Fokus di sini adalah **UX konfigurasi** dan **business rules** yang berlaku saat Admin mengoperasikan halaman ini.

### 2.2 UI Layout — Permission Matrix

Halaman dibagi menjadi dua tab:

**Tab 1: Kelola Role**
- DataTable: Kode | Nama Role | Data Scope | Sistem | Aktif | Aksi
- Tombol "Tambah Role" → modal form
- Edit: modal form pre-filled
- Nonaktifkan: konfirmasi + cek berapa user yang menggunakan role ini

**Tab 2: Permission Matrix**

```
FILTER MODUL: [Semua ▼] [Prospek] [Proyek] [Laporan] [Config] [Admin]

                                    CABANG  PM  DEPT  MGMT  ADMIN
── PROSPEK ─────────────────────────────────────────────────────
  Buat Prospek (prospects.create)     ✓     —    —     —     ✓
  Lihat Prospek (prospects.read)      ✓     ✓    —     —     ✓
  Approve Prospek (prospects.approve) —     ✓    —     —     ✓
── PROYEK ──────────────────────────────────────────────────────
  Buat Proyek (projects.create)       ✓     —    —     —     ✓
  Cancel Proyek (projects.cancel)     —     ✓    —     —     ✓
  ...

[Simpan Perubahan Matrix]
```

Setiap sel adalah checkbox. Role `admin` selalu `✓` dan disabled (tidak bisa dicabut melalui UI).

### 2.3 Scope Override per Permission

Beberapa permission memiliki scope yang dapat dikonfigurasi per role. Klik sel yang sudah dicentang → dropdown scope muncul:

```
[✓] Lihat Proyek (projects.read)
    Scope untuk role CABANG: [Hanya Milik Cabang Sendiri ▼]
    Opsi: Hanya Milik Cabang Sendiri | Semua Data
```

### 2.4 Business Rules — CFG-04

| ID | Rule |
|---|---|
| BR-CFG04-01 | Role system (`is_system = 1`): nama dan kode tidak bisa diubah; permission bisa diubah kecuali untuk role admin |
| BR-CFG04-02 | Role admin: selalu punya semua permission; tampilan matrix admin read-only |
| BR-CFG04-03 | Nonaktifkan role yang digunakan user: peringatan "X pengguna menggunakan role ini"; setelah konfirmasi, user tersebut tidak bisa login sampai role mereka diubah |
| BR-CFG04-04 | Perubahan permission matrix efektif setelah cache permission user expired (15 menit) atau user re-login |
| BR-CFG04-05 | Setiap perubahan permission dicatat di audit log |
| BR-CFG04-06 | Role baru yang dibuat Admin dimulai tanpa permission; Admin harus assign manual |

### 2.5 API Endpoints — CFG-04

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/roles | Admin | List semua role |
| POST | /api/config/roles | Admin | Buat role baru |
| PUT | /api/config/roles/:id | Admin | Update role |
| PUT | /api/config/roles/:id/deactivate | Admin | Nonaktifkan role |
| GET | /api/config/permission-matrix | Admin | Full matrix role × permission |
| PUT | /api/config/permission-matrix | Admin | Bulk save matrix |
| GET | /api/config/permissions | Admin | List semua permission tersedia |

---

## 3. CFG-11 — KONFIGURASI KATEGORI PROYEK

### 3.1 Overview

Halaman konfigurasi untuk mengelola Master Kategori Proyek (detail teknis di dokumen 021). Memungkinkan Admin mengubah setting per kategori tanpa coding.

### 3.2 UI Komponen

**DataTable Kategori:**

| No | Kode | Nama | Wajib RKS | Wajib LPHS | Workflow Default | Warna | Aktif | Aksi |
|---|---|---|:---:|:---:|---|---|:---:|---|
| 1 | KONSTRUKSI | Konstruksi | ✓ | ✓ | Tender | 🟠 | ✓ | Edit |
| 2 | IT_SISTEM | IT & Sistem | ✓ | ✓ | Tender | 🔵 | ✓ | Edit |
| ... | | | | | | | | |

**Modal Form Edit Kategori:**
- Nama Kategori: Input text, required, unique
- Kode: Input text, required, uppercase; read-only jika sudah digunakan proyek
- Deskripsi: Textarea, optional
- Wajib RKS: Toggle — apakah proyek kategori ini memerlukan tahap RKS
- Wajib LPHS: Toggle — apakah proyek kategori ini memerlukan tahap LPHS/SIOS
- Workflow Default: Select (Tender / Prospecting)
- Warna Badge: Color picker
- Urutan Tampil: Number
- Status: Toggle Aktif/Nonaktif

### 3.3 Business Rules — CFG-11

| ID | Rule |
|---|---|
| BR-CFG11-01 | Kode kategori yang sudah digunakan proyek tidak bisa diubah |
| BR-CFG11-02 | Jika `wajib_lphs = false`, tab LPHS/SIOS disembunyikan di detail proyek untuk kategori ini |
| BR-CFG11-03 | Perubahan `wajib_lphs` atau `wajib_rks` tidak berlaku retroaktif untuk proyek yang sedang berjalan |
| BR-CFG11-04 | Kategori yang sudah digunakan proyek tidak bisa dihapus; hanya nonaktifkan |

### 3.4 API Endpoints — CFG-11

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/categories | Admin | List semua kategori |
| POST | /api/config/categories | Admin | Buat kategori baru |
| PUT | /api/config/categories/:id | Admin | Update kategori |
| PUT | /api/config/categories/:id/deactivate | Admin | Nonaktifkan |

---

## 4. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-CFG03-01 | Admin ubah label "submit_rks" → "RKS Terkirim" | Badge label berubah di semua tampilan proyek |
| TC-CFG03-02 | Admin ubah warna badge "revision" ke ungu | Badge proyek revision berubah ungu |
| TC-CFG03-03 | Admin coba nonaktifkan status yang dipakai 5 proyek | Error atau warning dengan count proyek |
| TC-CFG04-01 | Admin buat role baru "Auditor" | Role terbuat tanpa permission |
| TC-CFG04-02 | Admin assign permission reports.read ke Auditor | User role Auditor bisa akses /reports setelah re-login |
| TC-CFG04-03 | Admin unchecklist projects.create dari role Cabang | Setelah cache expire, Cabang tidak bisa buat proyek |
| TC-CFG11-01 | Admin set kategori "Jasa Umum" → Wajib LPHS = false | Proyek baru Jasa Umum tidak tampilkan tab LPHS |
| TC-CFG11-02 | Admin nonaktifkan kategori yang dipakai 10 proyek | Kategori nonaktif; proyek lama tidak terpengaruh; kategori tidak muncul di dropdown baru |

**Gap Resolution:** CFG-03 ✓ | CFG-04 ✓ | CFG-11 ✓ | GAP-02 ✓
