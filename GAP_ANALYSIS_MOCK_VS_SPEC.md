# GAP Analysis — Frontend Mock Data vs. Master Data Spec (Docs 021–026)

**Tanggal:** Juni 2026  
**Scope:** `frontend/src/features/master-data/MasterDataPage.tsx` vs. `md Kinetic CRM/021` – `026`  
**Catatan:** Backend belum dibangun — analisis hanya pada frontend mock data.

---

## 1. Customer (Doc 021 §1)

| Spec Field | Tipe Spec | Mock Field | Status |
|---|---|---|---|
| `id` | PK | `id` | ✅ |
| `name` | VARCHAR(200), UNIQUE | `name` | ✅ |
| `code` | VARCHAR(20), UNIQUE | `code` | ✅ |
| `type` | ENUM('swasta','bumn','pemerintah','**asing**') | `type` — `'Swasta'\|'BUMN'\|'Pemerintah'` | ⚠️ Missing `'asing'` |
| `industry_id` | BIGINT FK → industries.id | ❌ Tidak ada | ❌ |
| `pic_name` | VARCHAR(200) | `pic` (merging nama & phone) | ⚠️ Nama field beda |
| `pic_email` | VARCHAR(200) | `email` | ⚠️ Nama field beda |
| `pic_phone` | VARCHAR(30) | ❌ Tidak ada | ❌ |
| `address` | TEXT | ❌ Tidak ada | ❌ |
| `city` | VARCHAR(100) | ❌ Tidak ada | ❌ |
| `province` | VARCHAR(100) | ❌ Tidak ada | ❌ |
| `npwp` | VARCHAR(30) | ❌ Tidak ada | ❌ |
| `notes` | TEXT | ❌ Tidak ada | ❌ |
| `is_active` | TINYINT(1) | `status` (boolean) | ⚠️ Nama field beda |
| `created_by` | FK users | ❌ | ❌ |
| `updated_by` | FK users | ❌ | ❌ |
| `created_at` | TIMESTAMP | ❌ | ❌ |
| `updated_at` | TIMESTAMP | ❌ | ❌ |

**Form tambah customer** (modal) hanya memiliki: nama, kode, jenis (tanpa 'asing'), PIC, email — **tidak ada** industry, phone, address, city, province, npwp, notes.

---

## 2. ProjectCategory (Doc 021 §2)

**Status: ❌ Tidak diimplementasikan**

Mock data tidak memiliki entity ProjectCategory. Spec mendefinisikan 6 default categories:
- `KONSTRUKSI`, `IT_SISTEM`, `KONSULTANSI`, `PENGADAAN`, `JASA_UMUM`, `LAINNYA`

Masing-masing memiliki: `code`, `name`, `requires_lphs`, `requires_rks`, `default_workflow_type`, `color_hex`, `sort_order`.

Di mock data, kategori digantikan oleh `group` (free-text: "Data Pribadi", "Lokasi", "Verifikasi Fisik", "Keuangan", "RKS") — **struktur berbeda total dengan spec**.

---

## 3. Industry (Doc 021 §3)

**Status: ❌ Tidak diimplementasikan**

Spec mendefinisikan 11 industri default (Energi, Konstruksi, TI, Perbankan, dll.) sebagai tabel referensi untuk `customers.industry_id`. Tidak ada di mock data.

---

## 4. ProjectStatus (Doc 022 §1)

**Status: ❌ Tidak diimplementasikan**

Spec mendefinisikan 10 system statuses dengan warna, sort order, transisi:
- `created`, `submit_rks`, `review_department`, `lphs_sios`, `revision`, `submit_harga`, `pengumuman_pemenang`, `target_delivery`, `selesai`, `cancelled`

Tidak ada tab atau mock data untuk status proyek.

---

## 5. StatusTransition (Doc 022 §1.3)

**Status: ❌ Tidak diimplementasikan**

Tabel pivot `status_transitions` untuk mengatur transisi yang diizinkan antar status + role + requires_note. Tidak ada di mock data.

---

## 6. DocumentType (Doc 022 §2)

**Status: ❌ Tidak diimplementasikan (stub)**

`MasterDocTypePage.tsx` return `null`. Spec mendefinisikan 8 tipe dokumen default (RKS, LPHS, SIOS, SPK, SURAT_KALAH, HARGA, INVOICE, LAINNYA) dengan `allowed_extensions`, `max_size_mb`, `is_required_at_stage`.

---

## 7. Competitor (Doc 023)

| Spec Field | Tipe Spec | Mock Field | Status |
|---|---|---|---|
| `id` | PK | `id` | ✅ |
| `name` | VARCHAR(200), UNIQUE | `name` | ✅ |
| `code` | VARCHAR(30) | `code` | ✅ |
| `industry_id` | BIGINT FK → industries.id | ❌ `segment` (free-text) | ❌ |
| `bidang_usaha` | VARCHAR(200) | ❌ | ❌ |
| `website` | VARCHAR(300) | ❌ | ❌ |
| `description` | TEXT | ❌ | ❌ |
| `is_active` | TINYINT(1) | `status` ('Aktif'/'Review'/'Non-Aktif') | ❌ Tipe + nilai beda |
| **Extra** | — | `initials` | ➕ Tidak ada di spec |
| **Extra** | — | `usage` (string: "24 Proyek") | ➕ Tidak ada di spec |

**Form tambah** hanya: nama, segment (dropdown), notes — tidak ada bidang_usaha, website, industry.

---

## 8. ProjectCompetitor (Doc 023 §2.2)

**Status: ❌ Tidak diimplementasikan**

Pivot table untuk relasi many-to-many proyek ↔ kompetitor dengan kolom: `estimated_price`, `strengths`, `notes`, `is_winner`.

---

## 9. QuestionType (Doc 024 §2)

| Spec | Mock | Status |
|---|---|---|
| 7 tipe: `text`, `textarea`, `radio`, `checkbox`, `select`, `number`, `date` | 5 tipe: `Short Text`, `Radio Button`, `File Upload`, `Multi Select`, `Date Picker` | ⚠️ Himpunan berbeda |
| `code` VARCHAR(50) system key | ❌ | ❌ |
| `has_options` TINYINT | ❌ (implied by type name) | ❌ |
| `validation_config` JSON | `config` string (JSON-like) | ⚠️ Nama beda |
| `is_system` TINYINT | ❌ | ❌ |
| `is_active` TINYINT | `active` boolean | ⚠️ Nama beda |
| **Extra** | `questionsCount`, `icon`, `desc` | ➕ Tidak di spec |

Spesifikasi teknis untuk `number` dan `date` type diminta di spec ([Doc 024 §2.3](024_MASTER_QUESTION_AND_QUESTION_TYPE.md)) namun tidak ada di mock. `File Upload` dan `Currency` ada di mock tetapi tidak disebut di spec.

---

## 10. Question (Doc 024 §3)

| Spec Field | Tipe Spec | Mock Field | Status |
|---|---|---|---|
| `id` | PK | `id` | ✅ |
| `question_text` | TEXT | `title` | ⚠️ Nama field beda |
| `question_type_id` | BIGINT FK → question_types.id | `type` (inline string) | ❌ Harus FK |
| `context` | ENUM('prospect','rks','both') | `group` (free-text) | ❌ Tipe + nilai beda |
| `category` | VARCHAR(100) | ❌ | ❌ |
| `is_required` | TINYINT | `required` | ✅ |
| `sort_order` | SMALLINT | ❌ (drag handle visual saja) | ❌ |
| `placeholder_text` | VARCHAR(500) | `placeholder` | ✅ |
| `help_text` | TEXT | `help` | ⚠️ Nama field beda |
| `is_active` | TINYINT(1) | `status` ('Aktif'/'Draft') | ❌ Tipe + nilai beda |
| `created_by` | FK | ❌ | ❌ |
| `updated_by` | FK | ❌ | ❌ |
| **Extra** | — | `icon`, `maxLen`, `options` | ➕ Tidak di spec |

---

## 11. QuestionOption (Doc 024 §3.2)

**Status: ❌ Tidak dimodelkan sebagai entity terpisah**

Spec mendefinisikan tabel `question_options` dengan: `id`, `question_id`, `option_text`, `option_value`, `sort_order`, `is_active`. Di mock data, opsi disimpan inline sebagai `options?: string[]` dalam object Question.

---

## 12. ProspectAnswer / ProjectRksAnswer (Doc 024 §4)

**Status: ❌ Tidak diimplementasikan**

Spec mendefinisikan `prospect_answers` dan `project_rks_answers` untuk menyimpan jawaban per prospek/proyek. Tidak ada di mock data.

---

## 13. ReportingPeriod (Doc 025 §2)

**Status: ❌ Tidak diimplementasikan (stub)**

`MasterPeriodPage.tsx` return `null`. Spec mendefinisikan `reporting_periods` dengan: `name`, `code`, `type` (monthly/quarterly/semester/annual), `year`, `start_date`, `end_date`, `is_locked`, ditambah fitur generate batch.

---

## 14. PublicHoliday (Doc 025 §3)

**Status: ❌ Tidak diimplementasikan (stub)**

`MasterHolidayPage.tsx` return `null`. Spec mendefinisikan `public_holidays` dengan 17 hari libur nasional 2025, algoritma `addWorkingDays()`, import CSV.

---

## 15. LossReason (Doc 026 §1)

**Status: ❌ Tidak diimplementasikan (stub)**

`MasterLossReasonPage.tsx` return `null`. Spec mendefinisikan 11 loss reasons default dengan kategori (harga, teknis, relasi, administrasi, waktu, lainnya) dan `project_loss_details` untuk data kekalahan proyek.

---

## 16. ProjectLossDetail (Doc 026 §1.4)

**Status: ❌ Tidak diimplementasikan**

Detail kekalahan proyek dengan: `loss_reason_id`, `secondary_reason_id`, `winner_competitor_id`, `winner_price`, `our_price`, `price_gap`.

---

## 17. ApprovalLevel (Doc 026 §2)

**Status: ❌ Tidak diimplementasikan**

3 level approval default: L1 (Review PM), L2 (Review Dept), L3 (Persetujuan Management) dengan `escalates_to_level_id` untuk chain.

---

## 18. NotificationTemplate (Doc 026 §3)

**Status: ❌ Tidak diimplementasikan**

12 event notifications dengan template variable substitution (`{{prospectName}}`, `{{daysRemaining}}`, dll.).

---

## Ringkasan per Tab

| Tab di Mock Data | Sesuai Spec? | Detail |
|---|---|---|
| Form Editor (MAST-03) | ⚠️ Sebagian | Question entity ada tapi field name & struktur berbeda |
| Tipe Respon (CONF-07) | ⚠️ Sebagian | Type set berbeda, field struktur berbeda |
| Master Customer | ⚠️ Sebagian | Missing 7+ fields, wrong enum values |
| Kompetitor (GAP-09) | ⚠️ Sebagian | Wrong fields (`segment` instead of `industry_id`, missing `bidang_usaha` dll.) |
| Departemen | ❌ Tidak di master data spec | Di luar scope docs 021–026 |
| Hak Pengguna (MAST-05) | ❌ Tidak di master data spec | Di luar scope docs 021–026 |
| Audit Log | ❌ Tidak di master data spec | Di luar scope docs 021–026 |

## Entity Coverage

| Entity | Doc | Status |
|--------|:---:|:------:|
| Customer | 021 | ⚠️ Sebagian |
| ProjectCategory | 021 | ❌ |
| Industry | 021 | ❌ |
| ProjectStatus | 022 | ❌ |
| StatusTransition | 022 | ❌ |
| DocumentType | 022 | ❌ |
| Competitor | 023 | ⚠️ Sebagian |
| ProjectCompetitor | 023 | ❌ |
| QuestionType | 024 | ⚠️ Sebagian |
| Question | 024 | ⚠️ Sebagian |
| QuestionOption | 024 | ❌ |
| ProspectAnswer | 024 | ❌ |
| ProjectRksAnswer | 024 | ❌ |
| ReportingPeriod | 025 | ❌ |
| PublicHoliday | 025 | ❌ |
| LossReason | 026 | ❌ |
| ProjectLossDetail | 026 | ❌ |
| ApprovalLevel | 026 | ❌ |
| NotificationTemplate | 026 | ❌ |
