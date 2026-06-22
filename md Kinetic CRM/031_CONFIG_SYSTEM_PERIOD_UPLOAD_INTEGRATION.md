# 031 — KONFIGURASI SISTEM: PERIODE, UPLOAD, TIPE PERTANYAAN & INTEGRASI
## KINETIC CRM — CFG-10, CFG-12, CFG-13, CFG-14

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 031 |
| **Nama Dokumen** | Konfigurasi Periode Pelaporan, Tipe Pertanyaan, Upload & Integrasi Eksternal |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.2 (CFG-10, CFG-12, CFG-13, CFG-14) |
| **Gap Resolution** | CFG-10, **CFG-12 High Priority (GAP-03)**, CFG-13, CFG-14 |
| **Status** | Final |

---

## 1. CFG-10 — KONFIGURASI PERIODE PELAPORAN

### 1.1 Overview

CFG-10 adalah antarmuka konfigurasi untuk mengelola Master Periode Pelaporan (detail teknis di dokumen 025). Entitas yang dikelola sama; fokus dokumen ini pada UI behavior, validasi konfigurasi, dan fitur generate batch.

### 1.2 UI Layout

**Halaman Daftar Periode:**

Tampilan dengan dua panel:
- **Panel kiri:** Filter per tahun + tombol "Generate Periode"
- **Panel kanan:** DataTable periode

| Kode | Nama | Tipe | Rentang | Status | Terkunci | Aksi |
|---|---|---|---|---|:---:|---|
| 2025-Q1 | Q1 2025 | Kuartalan | 1 Jan – 31 Mar 2025 | Aktif | ✓ | Lihat |
| 2025-Q2 | Q2 2025 | Kuartalan | 1 Apr – 30 Jun 2025 | Aktif | — | Edit \| Kunci |
| 2025-S1 | Semester 1 2025 | Semester | 1 Jan – 30 Jun 2025 | Aktif | — | Edit \| Kunci |
| 2025-FY | Full Year 2025 | Tahunan | 1 Jan – 31 Des 2025 | Aktif | — | Edit \| Kunci |

**Modal Generate Periode:**

```
Tahun Target: [2026  ]
Tipe yang Dibuat:
  [✓] Bulanan (12 periode)
  [✓] Kuartalan (4 periode: Q1–Q4)
  [✓] Semester (2 periode: S1, S2)
  [✓] Tahunan (1 periode: FY)
Total akan dibuat: 19 periode

[Preview Daftar] [Generate Sekarang]
```

Preview menampilkan list periode yang akan dibuat sebelum konfirmasi.

### 1.3 Business Rules — CFG-10

| ID | Rule |
|---|---|
| BR-CFG10-01 | Tidak boleh ada dua periode tipe yang sama dengan rentang tanggal overlap |
| BR-CFG10-02 | Kunci (`is_locked = true`) berarti: target tidak bisa diubah; laporan periode ini tidak bisa dimodifikasi |
| BR-CFG10-03 | Setelah periode dikunci, Admin tidak bisa membuka kunci kecuali dengan konfirmasi khusus (memerlukan catatan alasan) |
| BR-CFG10-04 | Generate periode otomatis menghindari duplikasi (periode yang sudah ada dilewati) |

### 1.4 API Endpoints — CFG-10

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/reporting-periods | Admin | List semua periode |
| POST | /api/config/reporting-periods | Admin | Buat periode manual |
| PUT | /api/config/reporting-periods/:id | Admin | Update periode (jika tidak locked) |
| POST | /api/config/reporting-periods/generate | Admin | Generate batch |
| PUT | /api/config/reporting-periods/:id/lock | Admin | Kunci periode |
| PUT | /api/config/reporting-periods/:id/unlock | Admin | Buka kunci (dengan reason) |
| PUT | /api/config/reporting-periods/:id/activate | Admin | Set sebagai periode aktif |

---

## 2. CFG-12 — KONFIGURASI TIPE PERTANYAAN (HIGH PRIORITY — GAP-03)

### 2.1 Critical Context

> **⚠️ PRIORITAS TINGGI — Penyelesaian GAP-03 (Critical Bug):** Tipe pertanyaan dan pertanyaan yang sebelumnya disimpan di localStorage browser **HARUS dimigrasikan ke DB** sebelum go-live. CFG-12 adalah UI konfigurasi yang memastikan Admin dapat mengelola data ini dari database, bukan dari browser local storage masing-masing.

### 2.2 UI Layout

**Tab 1: Tipe Pertanyaan**

Menampilkan dan mengelola definisi tipe jawaban yang tersedia.

| Kode | Nama Tipe | Punya Opsi | Sistem | Aktif | Digunakan | Aksi |
|---|---|:---:|:---:|:---:|---|---|
| text | Teks Singkat | — | ✓ | ✓ | 8 pertanyaan | Lihat |
| textarea | Teks Panjang | — | ✓ | ✓ | 3 pertanyaan | Lihat |
| radio | Pilihan Tunggal | ✓ | ✓ | ✓ | 5 pertanyaan | Lihat |
| checkbox | Pilihan Banyak | ✓ | ✓ | ✓ | 2 pertanyaan | Lihat |
| select | Dropdown | ✓ | ✓ | ✓ | 4 pertanyaan | Lihat |

Tipe sistem hanya bisa dilihat detail, tidak bisa diedit/hapus. Kolom "Digunakan" menampilkan count pertanyaan yang menggunakan tipe ini.

**Tab 2: Pertanyaan Prospek**

DataTable pertanyaan untuk form prospek dengan:
- Drag-and-drop reorder
- Toggle aktif/nonaktif
- Edit pertanyaan via modal
- Preview form real-time di panel kanan

**Tab 3: Pertanyaan RKS**

Identik dengan Tab 2 namun untuk pertanyaan form RKS.

### 2.3 Form Modal Pertanyaan

```
Teks Pertanyaan: [ Apakah customer sudah pernah menjadi client sebelumnya? ]
Tipe Jawaban:    [ Pilihan Tunggal (Radio)     ▼ ]

Opsi Jawaban (drag untuk urutkan):
  ⣿ [Ya, sudah        ] [Hapus]
  ⣿ [Belum pernah     ] [Hapus]
  ⣿ [Dalam proses     ] [Hapus]
  [+ Tambah Opsi]

Wajib Diisi:    [✓] Ya
Kategori:       [ Komersial ▼ ]
Teks Bantuan:   [ Pilih yang paling sesuai dengan riwayat hubungan dengan customer ]

PREVIEW:
┌──────────────────────────────────────────┐
│ Apakah customer sudah pernah menjadi     │
│ client sebelumnya? *                     │
│                                          │
│ ○ Ya, sudah                              │
│ ○ Belum pernah                           │
│ ○ Dalam proses                           │
│                                          │
│ Pilih yang paling sesuai dengan riwayat  │
│ hubungan dengan customer                 │
└──────────────────────────────────────────┘
```

Preview diperbarui real-time saat teks dan opsi berubah.

### 2.4 Migration Tool (One-Time Action)

Halaman ini juga menampilkan **Migration Banner** jika sistem mendeteksi bahwa localStorage masih memiliki data pertanyaan yang belum dimigrasikan:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ DATA MIGRASI DIPERLUKAN                              │
│                                                         │
│ Sistem mendeteksi konfigurasi tipe pertanyaan yang      │
│ tersimpan di localStorage browser Anda (legacy).        │
│ Data ini perlu dimigrasikan ke database agar konsisten  │
│ untuk semua pengguna.                                   │
│                                                         │
│ Ditemukan: 12 pertanyaan, 3 tipe kustom                 │
│                                                         │
│           [Import dari localStorage]  [Abaikan]         │
└─────────────────────────────────────────────────────────┘
```

Tombol "Import dari localStorage" menjalankan script migrasi satu arah: baca dari localStorage → validasi → POST ke API → hapus dari localStorage.

### 2.5 Business Rules — CFG-12

| ID | Rule |
|---|---|
| **BR-CFG12-01 KRITIS** | Semua data tipe pertanyaan dan pertanyaan WAJIB di DB, bukan localStorage |
| BR-CFG12-02 | Tipe sistem tidak bisa diedit atau dihapus (kode, nama, has_options) |
| BR-CFG12-03 | Tipe kustom yang digunakan pertanyaan aktif tidak bisa dihapus |
| BR-CFG12-04 | Pertanyaan yang memiliki jawaban tersimpan tidak bisa dihapus permanen; hanya nonaktifkan |
| BR-CFG12-05 | Reorder pertanyaan melalui drag-and-drop; urutan tersimpan ke DB via PATCH /reorder |

### 2.6 API Endpoints — CFG-12

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/question-types | Admin | List tipe pertanyaan |
| POST | /api/config/question-types | Admin | Buat tipe kustom |
| GET | /api/config/questions | Admin | List pertanyaan (query: context) |
| POST | /api/config/questions | Admin | Buat pertanyaan |
| PUT | /api/config/questions/:id | Admin | Update pertanyaan |
| PUT | /api/config/questions/:id/deactivate | Admin | Nonaktifkan |
| PATCH | /api/config/questions/reorder | Admin | Bulk update urutan |
| POST | /api/config/questions/migrate-from-localstorage | Admin | One-time migration tool |

---

## 3. CFG-13 — KONFIGURASI UPLOAD FILE

### 3.1 Overview

CFG-13 mendefinisikan aturan upload file yang berlaku secara global di sistem: ukuran maksimal per file, tipe file yang diizinkan, dan batas total storage per proyek. Konfigurasi ini override nilai default pada setiap `document_type`.

### 3.2 Entity: UploadConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `config_key` | VARCHAR(100) | NOT NULL, UNIQUE | Kunci konfigurasi |
| `config_value` | VARCHAR(500) | NOT NULL | Nilai konfigurasi |
| `description` | TEXT | NULL | Deskripsi setting |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 3.3 Default Upload Configuration

| config_key | config_value | Keterangan |
|---|---|---|
| `global_max_file_size_mb` | `25` | Batas ukuran per file (MB) |
| `global_allowed_extensions` | `pdf,docx,doc,xlsx,xls,jpg,jpeg,png` | Ekstensi yang diizinkan secara global |
| `project_max_storage_mb` | `500` | Total storage per proyek (MB) |
| `avatar_max_size_mb` | `2` | Batas ukuran avatar pengguna |
| `avatar_allowed_extensions` | `jpg,jpeg,png,gif` | |
| `company_logo_max_size_mb` | `2` | |
| `company_logo_allowed_extensions` | `jpg,jpeg,png,svg` | |
| `upload_storage_path` | `storage/documents` | Path relatif storage (dari app root) |
| `enable_virus_scan` | `false` | Aktifkan ClamAV scan (Fase 2) |

### 3.4 Storage Architecture

```
{APP_ROOT}/storage/                 ← WAJIB di luar webroot
  ├── documents/
  │   ├── prospects/{prospectId}/   ← Dokumen prospek
  │   └── projects/{projectId}/     ← Dokumen proyek (per tipe)
  ├── avatars/                      ← Avatar pengguna
  └── logos/                        ← Logo perusahaan
```

**Security requirement:** Direktori storage harus di luar webroot dan tidak dapat diakses langsung via URL. Download harus melalui authenticated API endpoint yang men-stream file.

### 3.5 API Endpoints — CFG-13

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/upload-settings | Admin | List semua konfigurasi upload |
| PUT | /api/config/upload-settings | Admin | Bulk update konfigurasi |
| GET | /api/config/storage-usage | Admin | Statistik penggunaan storage (total, per proyek terbesar) |

---

## 4. CFG-14 — KONFIGURASI INTEGRASI EKSTERNAL & AI PROVIDER

### 4.1 Overview

CFG-14 mengonfigurasi integrasi dengan layanan eksternal: AI Provider (Gemini), SMTP Email (Fase 2), SSO (Fase 3), dan ERP/CRM External (Fase 3). Semua secrets (API Key, password SMTP) disimpan di **environment variables**, bukan DB, untuk keamanan. DB hanya menyimpan konfigurasi non-sensitif (provider name, model, endpoint URL).

### 4.2 Entity: IntegrationConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `integration_code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode integrasi: ai_gemini, smtp, sso_saml |
| `integration_name` | VARCHAR(200) | NOT NULL | Nama tampilan |
| `phase` | TINYINT UNSIGNED | NOT NULL | 1, 2, atau 3 |
| `is_enabled` | TINYINT(1) | NOT NULL DEFAULT 0 | Toggle aktif/nonaktif |
| `config_json` | JSON | NULL | Konfigurasi non-sensitif |
| `status` | ENUM('not_configured','configured','connected','error') | NOT NULL DEFAULT 'not_configured' | Status koneksi terakhir |
| `last_tested_at` | TIMESTAMP | NULL | Kapan terakhir ditest |
| `last_error` | TEXT | NULL | Pesan error terakhir |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 4.3 AI Provider Configuration (Gemini — Fase 1 Aktif)

Konfigurasi AI disimpan split: **environment variables** untuk secrets, **DB** untuk preferensi.

**Environment Variables (di .env / Docker secrets):**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
AI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.3
AI_TIMEOUT_SECONDS=30
AI_MAX_RETRIES=3
AI_RATE_LIMIT_RPM=60
```

**DB config_json untuk integrasi AI:**
```json
{
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "endpoint": "https://generativelanguage.googleapis.com/v1beta",
  "features_enabled": {
    "tender_summary": true,
    "rks_summary": true,
    "prospect_analysis": false,
    "kpi_insight": true
  },
  "cost_limit_usd_per_day": 10.0,
  "log_prompts": false
}
```

**UI untuk AI Config:**
```
INTEGRASI AI (Google Gemini)                     [✓ Terhubung]
────────────────────────────────────────────────────────────────
API Key:         [••••••••••••••••AIzaSy] [Ubah]
Model:           [gemini-1.5-flash       ▼]
Max Tokens:      [2048  ]
Temperature:     [0.3   ]
Rate Limit/Min:  [60    ]

Fitur AI Aktif:
  [✓] Ringkasan Tender
  [✓] Ringkasan RKS
  [ ] Analisis Prospek (akan datang)
  [✓] Insight KPI

Batas Biaya:     [$ 10.00 ] per hari
Log Prompt:      [ ] Aktifkan (hanya untuk debugging)

[Test Koneksi]  [Simpan Konfigurasi]
```

Test koneksi mengirim prompt sederhana ke Gemini dan menampilkan hasilnya (latency, token used, response preview).

### 4.4 SMTP Configuration (Fase 2)

```
INTEGRASI EMAIL (SMTP)                           [○ Belum Dikonfigurasi]
────────────────────────────────────────────────
Host:       [smtp.company.com  ]
Port:       [587  ]
Username:   [noreply@company.com]
Password:   [••••••••••••] [Ubah]
Enkripsi:   [TLS ▼]
From Name:  [KINETIC CRM System]

[Test Kirim Email]  [Simpan]
```

### 4.5 SSO Configuration (Fase 3 — Read Only untuk Fase 1)

```
INTEGRASI SSO / Active Directory                 [Fase 3 — Belum Tersedia]
────────────────────────────────────────────────
Provider:   SAML 2.0 / OAuth2
Status:     Akan tersedia di Fase 3 pengembangan.
```

### 4.6 Business Rules — CFG-14

| ID | Rule |
|---|---|
| BR-CFG14-01 | API Key dan password SMTP **TIDAK PERNAH** disimpan di tabel DB; hanya di environment variables |
| BR-CFG14-02 | UI menampilkan API Key dalam format masked (••••); admin memasukkan nilai baru hanya saat update |
| BR-CFG14-03 | Test koneksi harus berhasil sebelum integrasi dapat diaktifkan (`is_enabled = true`) |
| BR-CFG14-04 | Jika test koneksi gagal: `status = 'error'`; `last_error` diisi dengan pesan; integrasi tidak aktif |
| BR-CFG14-05 | Batas biaya AI (`cost_limit_usd_per_day`): jika terlampaui, AI service dinonaktifkan sementara sampai reset tengah malam |
| BR-CFG14-06 | `log_prompts = false` secara default untuk privasi; hanya aktifkan saat debugging dengan persetujuan |
| BR-CFG14-07 | AI Service Layer selalu menjadi perantara; modul bisnis tidak boleh memanggil Gemini API langsung (sesuai prinsip arsitektur dokumen 010) |

### 4.7 API Endpoints — CFG-14

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/integrations | Admin | List semua integrasi dan statusnya |
| PUT | /api/config/integrations/:code | Admin | Update konfigurasi integrasi |
| POST | /api/config/integrations/:code/test | Admin | Test koneksi integrasi |
| PUT | /api/config/integrations/:code/toggle | Admin | Enable/disable integrasi |
| GET | /api/config/integrations/ai/usage | Admin | Statistik penggunaan AI (token, cost) |

---

## 5. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-CFG10-01 | Generate periode 2026 (quarterly + semester + annual) | 7 periode terbuat; yang sudah ada dilewati |
| TC-CFG10-02 | Kunci periode Q1 2025 | is_locked = true; target Q1 tidak bisa diubah |
| **TC-CFG12-01 KRITIS** | Buka form prospek di browser yang localStorage sudah di-clear | Pertanyaan tetap muncul dari DB (bukan localStorage) |
| TC-CFG12-02 | Admin nonaktifkan pertanyaan yang digunakan 5 prospek aktif | Warning; setelah konfirm: nonaktif; pertanyaan hilang dari form baru; masih tampil di 5 prospek lama |
| TC-CFG13-01 | Upload file 30MB (melebihi limit 25MB) | Error client-side sebelum request terkirim: "Ukuran file melebihi batas 25 MB" |
| TC-CFG13-02 | Upload file .exe | Error: "Tipe file tidak diizinkan" |
| TC-CFG14-01 | Admin update GEMINI_API_KEY dengan key yang salah → Test Koneksi | Error: "Autentikasi gagal. Periksa API Key."; is_enabled tetap false |
| TC-CFG14-02 | Penggunaan AI mencapai batas biaya harian | AI dinonaktifkan sementara; error message di fitur AI: "Batas penggunaan harian tercapai" |

**Gap Resolution:** CFG-10 ✓ | GAP-03 Critical ✓ (CFG-12) | CFG-13 ✓ | CFG-14 ✓
