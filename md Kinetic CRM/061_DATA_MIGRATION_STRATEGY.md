# 061 — DATA MIGRATION STRATEGY
## KINETIC CRM — Migrasi Data Manual dan Teknis (Inferred Scope)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 061 |
| **Nama Dokumen** | Data Migration Strategy |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0, Document Index v1.1 |
| **Klasifikasi** | **Inferred Scope** — PRD/BA Review/FE Spec tidak menyebut sistem digital lama yang digantikan. Proses existing adalah manual (email/spreadsheet/dokumen fisik). Dokumen ini mengacu ke: (a) migrasi data manual/spreadsheet ke KINETIC CRM saat onboarding, dan (b) migrasi teknis localStorage→DB (GAP-03). |
| **Gap Resolution** | GAP-03 (localStorage migration) |
| **Status** | Final |

---

## 1. KONTEKS MIGRASI

### 1.1 Kondisi Sebelum KINETIC CRM

Berdasarkan BA Review, proses tender saat ini dikelola secara **manual** menggunakan:
- **Spreadsheet Excel/Google Sheets** — tracking proyek, pipeline, win/loss
- **Email** — komunikasi approval, pengiriman dokumen tender
- **Dokumen fisik/PDF** — RKS, LPHS, SIOS, kontrak
- **WhatsApp/chat** — koordinasi informal antar cabang dan PM
- **localStorage browser** — data tipe pertanyaan (bug GAP-03)

Tidak ada sistem digital terpadu yang mengelola seluruh lifecycle tender. KINETIC CRM adalah **sistem baru**, bukan pengganti sistem digital yang sudah ada.

### 1.2 Dua Tipe Migrasi

| Tipe | Deskripsi | Prioritas |
|---|---|---|
| **Migrasi Teknis** | localStorage → Database (GAP-03) | Kritis — sebelum go-live |
| **Migrasi Data Onboarding** | Spreadsheet/manual → KINETIC CRM | Penting — saat onboarding |

---

## 2. MIGRASI TEKNIS: LOCALSTORAGE → DATABASE (GAP-03)

### 2.1 Scope

Data yang tersimpan di localStorage dan harus dimigrasikan ke DB:
- `questionTypes` — definisi tipe pertanyaan
- `prospectQuestions` — daftar pertanyaan form prospek
- `rksQuestions` — daftar pertanyaan form RKS

### 2.2 Detection Script (Frontend)

```typescript
// Dijalankan sekali saat Admin pertama login setelah upgrade
function detectLocalStorageLegacyData(): LegacyData | null {
  const questionTypes = localStorage.getItem('questionTypes');
  const prospectQuestions = localStorage.getItem('prospectQuestions');
  const rksQuestions = localStorage.getItem('rksQuestions');

  if (!questionTypes && !prospectQuestions && !rksQuestions) return null;

  return {
    questionTypes: questionTypes ? JSON.parse(questionTypes) : [],
    prospectQuestions: prospectQuestions ? JSON.parse(prospectQuestions) : [],
    rksQuestions: rksQuestions ? JSON.parse(rksQuestions) : [],
    detectedAt: new Date().toISOString(),
    browserUserAgent: navigator.userAgent
  };
}
```

### 2.3 Migration Banner & Flow

Saat Admin pertama login dan legacy data terdeteksi:

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠️  DATA LEGACY TERDETEKSI — MIGRASI DIPERLUKAN                  │
│                                                                  │
│ Sistem menemukan konfigurasi pertanyaan lama yang tersimpan      │
│ di browser ini (localStorage). Data ini perlu dipindahkan ke     │
│ database agar bisa digunakan oleh semua pengguna.                │
│                                                                  │
│ Ditemukan:                                                       │
│   • 3 tipe pertanyaan kustom                                     │
│   • 12 pertanyaan form Prospek                                   │
│   • 8 pertanyaan form RKS                                        │
│                                                                  │
│ [Preview Data] [Import ke Database] [Abaikan (tidak disarankan)] │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Migration API Endpoint

```
POST /api/config/questions/migrate-from-localstorage
Authorization: Admin only
Content-Type: application/json

Body:
{
  "question_types": [...],    // array QuestionType dari localStorage
  "prospect_questions": [...], // array Question dari localStorage
  "rks_questions": [...]       // array Question dari localStorage
}

Response 200:
{
  "success": true,
  "migrated": {
    "question_types": { "created": 2, "skipped_duplicates": 1 },
    "prospect_questions": { "created": 12, "skipped": 0 },
    "rks_questions": { "created": 8, "skipped": 0 }
  },
  "warnings": [
    "Tipe pertanyaan 'text' sudah ada sebagai tipe sistem; tidak ditimpa."
  ]
}
```

### 2.5 Post-Migration Cleanup

Setelah migrasi berhasil:
```typescript
function clearLegacyLocalStorage() {
  localStorage.removeItem('questionTypes');
  localStorage.removeItem('prospectQuestions');
  localStorage.removeItem('rksQuestions');
  // Tandai migrasi selesai
  localStorage.setItem('ls_migration_completed', new Date().toISOString());
}
```

---

## 3. MIGRASI DATA ONBOARDING: SPREADSHEET → KINETIC CRM

### 3.1 Data yang Perlu Dimigrasikan

| Data | Sumber Umum | Target Tabel | Prioritas |
|---|---|---|---|
| Data Customer | Spreadsheet / buku telepon | `customers` | Tinggi |
| Data Departemen | Struktur org perusahaan | `departments` | Tinggi |
| Data Cabang | Daftar cabang perusahaan | `branches` | Tinggi |
| Data Pengguna | HR / daftar karyawan | `users` | Tinggi |
| Data Kompetitor | Spreadsheet tracking | `competitors` | Sedang |
| Histori Proyek (opsional) | Excel tracking tender | `projects` (terbatas) | Rendah |
| Histori Win/Loss (opsional) | Excel rekapitulasi | `project_winner_results` | Rendah |

### 3.2 Urutan Migrasi (Dependency Order)

```
1. Master Data Organisasi
   companies → divisions → departments → branches

2. Master Data Referensi
   industries → customers → competitors → loss_reasons
   project_categories → project_statuses → document_types
   question_types → questions

3. Pengguna
   users (dengan role, branch_id, department_id)

4. Data Histori (opsional, jika diputuskan untuk dimigrasi)
   reporting_periods → projects → project_winner_results
```

### 3.3 Import Templates (CSV)

Admin dapat menggunakan template CSV yang disediakan sistem untuk import batch:

**Template: customers.csv**
```csv
name,code,type,pic_name,pic_email,city,notes
PT. Jasa Marga (Persero) Tbk,JASMARGA,bumn,Pak Budi,budi@jasamarga.co.id,Jakarta,
PT. Pembangunan Perumahan,PP,bumn,,,,
CV. Karya Mandiri,KARYAMANDIRI,swasta,Bu Sari,sari@karya.com,Surabaya,
```

**Template: users.csv**
```csv
name,username,email,role,branch_code,department_code
Budi Santoso,budi_santoso,budi@company.com,cabang,JKT-SEL,
Cahyo Purnomo,cahyo_pm,cahyo@company.com,pm,,
Sarah Engineering,sarah_eng,sarah@company.com,department,,ENG
```

### 3.4 Bulk Import API

```
POST /api/admin/import/customers
POST /api/admin/import/users
POST /api/admin/import/competitors
Content-Type: multipart/form-data

File: CSV file sesuai template
dry_run: true | false   (true = validasi saja tanpa simpan)

Response (dry_run=true):
{
  "valid_rows": 45,
  "invalid_rows": 3,
  "errors": [
    { "row": 5, "field": "email", "message": "Format email tidak valid" },
    { "row": 12, "field": "branch_code", "message": "Kode cabang JKT-TIM tidak ditemukan" }
  ],
  "preview": [
    { "row": 1, "name": "PT. Jasa Marga", "status": "will_create" },
    { "row": 2, "name": "PT. Waskita", "status": "will_skip_duplicate" }
  ]
}
```

### 3.5 Migrasi Histori Proyek (Opsional)

**Pertimbangan:** Migrasi histori proyek dari spreadsheet ke KINETIC CRM bersifat **opsional** dan **at-risk** karena:
- Data spreadsheet biasanya tidak lengkap atau tidak konsisten
- Timeline events tidak bisa direkonstruksi secara akurat
- Status intermediate tidak terdokumentasi

**Rekomendasi:** Migrasi hanya data proyek yang sudah **selesai** (win/lose) untuk keperluan baseline laporan win/loss. Proyek yang masih berjalan dimulai fresh di KINETIC CRM.

**Template: projects_history.csv**
```csv
project_name,customer_code,category_code,branch_code,type,result,contract_value,loss_reason_code,close_date
Gedung Kantor Pusat,JASMARGA,KONSTRUKSI,JKT-SEL,tender,win,48500000000,,2024-09-10
Pengadaan IT Infrastruktur,PPERSERO,IT_SISTEM,SBY,tender,lose,,HARGA_TERLALU_TINGGI,2024-11-05
```

---

## 4. DATA CLEANSING RULES

### 4.1 Validasi Umum

| Field | Rule Cleansing |
|---|---|
| Nama customer | Trim whitespace; capitalize proper; hapus karakter khusus kecuali . , & ( ) |
| Email | Lowercase; validasi format; hapus spasi |
| Kode (branch, customer) | Uppercase; hapus spasi; alphanumeric only |
| Nomor telepon | Standarisasi format: +62xxx atau 0xxx; hapus strip dan spasi |
| Nilai rupiah | Hapus Rp, titik, koma; pastikan integer |

### 4.2 Duplicate Detection

```sql
-- Deteksi customer duplikat sebelum import
SELECT name, COUNT(*) AS count
FROM import_staging_customers
GROUP BY LOWER(TRIM(name))
HAVING count > 1;
```

Strategi: beri pilihan ke Admin — merge (pertahankan satu) atau import keduanya dengan suffix.

### 4.3 Data Validation Checkpoint

Sebelum commit import ke tabel utama, jalankan:
```sql
-- Validasi FK integrity
SELECT s.branch_code FROM import_staging_users s
LEFT JOIN branches b ON b.code = s.branch_code
WHERE s.branch_code IS NOT NULL AND b.id IS NULL;
-- Harus 0 rows; jika ada = FK violation
```

---

## 5. ROLLBACK STRATEGY

### 5.1 Rollback per Tipe Migrasi

| Tipe Migrasi | Rollback Metode | Window |
|---|---|---|
| localStorage → DB | Tidak diperlukan (data lama masih di localStorage sampai cleanup manual) | Unlimited |
| Bulk import customer/user | `DELETE FROM customers WHERE imported_batch_id = :batchId` | Sebelum cleanup batch flag |
| Histori proyek | Drop staging table; tidak ada perubahan ke tabel utama | Unlimited (gunakan dry_run terlebih dahulu) |

### 5.2 Import Batch Tracking

Setiap import batch mendapatkan ID unik; semua record yang diimport memiliki `import_batch_id`:

```sql
-- Tambah kolom ke tabel yang bisa diimport
ALTER TABLE customers ADD COLUMN import_batch_id VARCHAR(50) NULL;
ALTER TABLE users     ADD COLUMN import_batch_id VARCHAR(50) NULL;

-- Rollback batch tertentu
DELETE FROM customers WHERE import_batch_id = '2025-06-onboarding-batch-1';
```

---

## 6. RECONCILIATION PROCESS

Setelah onboarding selesai, jalankan reconciliation untuk memastikan data konsisten:

```sql
-- Cek user tanpa branch yang seharusnya punya branch
SELECT u.username, u.role FROM users u
WHERE u.role = 'cabang' AND u.branch_id IS NULL;

-- Cek customer tanpa proyek (mungkin tidak perlu ada)
SELECT c.name FROM customers c
LEFT JOIN projects p ON p.customer_id = c.id
WHERE p.id IS NULL;

-- Cek orphan data
SELECT COUNT(*) FROM project_rks r
LEFT JOIN projects p ON p.id = r.project_id
WHERE p.id IS NULL;
-- Harus 0
```

---

## 7. MIGRATION TIMELINE REKOMENDASI

| Fase | Aktivitas | Durasi |
|---|---|---|
| T-4 minggu | Siapkan template CSV; kumpulkan data dari spreadsheet tim | 1 minggu |
| T-3 minggu | Cleansing dan validasi data di spreadsheet | 1 minggu |
| T-2 minggu | Dry-run import di environment staging; identifikasi dan perbaiki errors | 1 minggu |
| T-1 minggu | Migrasi teknis localStorage → DB; test di staging | 3 hari |
| T-0 (Go-live) | Import data master ke production; buat akun user; briefing tim | 1 hari |
| T+1 minggu | Monitoring intensif; support untuk user yang mengalami issue | Ongoing |

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-MIG-01 | Admin import 50 customer dari CSV valid | 50 customer terbuat; batch_id tersimpan |
| TC-MIG-02 | Import CSV dengan 3 baris invalid (email salah) | Valid rows diimport; invalid rows di-skip dengan error report |
| TC-MIG-03 | dry_run=true import customer | Tidak ada perubahan DB; hanya tampilkan preview + errors |
| TC-MIG-04 | Rollback batch import customer | DELETE by batch_id; 0 customer tersisa dari batch itu |
| TC-MIG-05 | Migrasi localStorage: Admin login, terdeteksi legacy data | Banner migrasi muncul |
| TC-MIG-06 | Admin klik "Import ke Database" dari banner | Data tipe pertanyaan + pertanyaan tersimpan ke DB; banner hilang |
| TC-MIG-07 | Setelah migrasi localStorage, buka form prospek | Pertanyaan tampil dari DB (bukan localStorage) |
| TC-MIG-08 | Import user dengan branch_code yang tidak ada | Error per baris: "Kode cabang tidak ditemukan"; baris lain tetap diimport |

**Gap Resolution:** GAP-03 ✓ (localStorage migration) | Inferred Scope ✓ (data onboarding strategy)
