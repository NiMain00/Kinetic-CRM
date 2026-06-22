# 025 — MASTER PERIODE & KALENDER HARI LIBUR
## KINETIC CRM — Master Periode Pelaporan dan Hari Libur Nasional

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 025 |
| **Nama Dokumen** | Master Periode Pelaporan & Kalender Hari Libur |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.1 (MD-10, MD-13), B.2 (CFG-05, CFG-10) |
| **Gap Resolution** | MD-10, MD-13, CFG-05 (kalkulasi hari kerja SLA), CFG-10 |
| **Status** | Final |

---

## 1. PURPOSE

Dua entitas master ini saling berkaitan dan keduanya dibutuhkan oleh:
- **SLA Engine** (dokumen 041): menghitung batas waktu approval dalam **hari kerja** (bukan hari kalender), dengan mengecualikan hari Sabtu, Minggu, dan hari libur nasional
- **Laporan periodik** (dokumen 051): membatasi rentang data laporan ke periode resmi (kuartal, semester, tahunan)
- **Target & KPI** (dokumen 043–045): menetapkan dan mengukur target per periode

---

## 2. MASTER PERIODE PELAPORAN

### 2.1 Entity: ReportingPeriod

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(200) | NOT NULL | Nama periode (mis: "Q1 2025", "Semester 1 2025") |
| `code` | VARCHAR(30) | NOT NULL, UNIQUE | Kode sistem (mis: 2025-Q1, 2025-S1, 2025-FY) |
| `type` | ENUM('monthly','quarterly','semester','annual') | NOT NULL | Tipe periode |
| `year` | SMALLINT UNSIGNED | NOT NULL | Tahun periode |
| `start_date` | DATE | NOT NULL | Tanggal mulai periode |
| `end_date` | DATE | NOT NULL | Tanggal akhir periode |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | Apakah periode ini sedang berjalan |
| `is_locked` | TINYINT(1) | NOT NULL DEFAULT 0 | Terkunci = tidak bisa diubah datanya (periode sudah tutup) |
| `notes` | TEXT | NULL | Catatan dari Admin |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Business Rules — Periode

| ID | Rule |
|---|---|
| BR-PER-01 | Tidak boleh ada dua periode dengan tipe dan rentang tanggal yang overlap |
| BR-PER-02 | `start_date` harus < `end_date` |
| BR-PER-03 | Periode yang `is_locked = true` tidak bisa diedit target atau input datanya |
| BR-PER-04 | Hanya satu periode per tipe yang bisa `is_active = true` pada satu waktu; sistem auto-deactivate periode lama saat periode baru diaktifkan |
| BR-PER-05 | Laporan menggunakan rentang tanggal periode; filter laporan dapat dibatasi ke periode yang sudah terdefinisi |
| BR-PER-06 | Periode dapat dibuat otomatis untuk 1 tahun ke depan via fitur "Generate Periods" |

### 2.3 Generate Periods (Batch Create)

Admin dapat meng-generate periode bulanan / kuartalan / semesteran sekaligus untuk satu tahun:

```
POST /api/config/reporting-periods/generate
Body: {
  year: 2026,
  types: ["quarterly", "semester", "annual"]
}
Response: { created: 7, periods: [...] }
```

Sistem membuat:
- 4 quarterly (Q1–Q4)
- 2 semester (S1–S2)
- 1 annual (FY2026)

### 2.4 DDL

```sql
CREATE TABLE reporting_periods (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200)    NOT NULL,
  code       VARCHAR(30)     NOT NULL,
  type       ENUM('monthly','quarterly','semester','annual') NOT NULL,
  year       SMALLINT UNSIGNED NOT NULL,
  start_date DATE            NOT NULL,
  end_date   DATE            NOT NULL,
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  is_locked  TINYINT(1)      NOT NULL DEFAULT 0,
  notes      TEXT            NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_periods_code (code),
  KEY idx_periods_year      (year),
  KEY idx_periods_type      (type),
  KEY idx_periods_is_active (is_active),
  KEY idx_periods_dates     (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5 API Endpoints — Periode

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/reporting-periods | Admin | List semua periode |
| GET | /api/master/reporting-periods | Auth | List periode aktif (untuk dropdown laporan/target) |
| POST | /api/config/reporting-periods | Admin | Buat periode manual |
| POST | /api/config/reporting-periods/generate | Admin | Generate batch untuk satu tahun |
| PUT | /api/config/reporting-periods/:id | Admin | Update periode (jika belum locked) |
| PUT | /api/config/reporting-periods/:id/lock | Admin | Kunci periode |
| PUT | /api/config/reporting-periods/:id/activate | Admin | Aktifkan periode sebagai current period |

---

## 3. MASTER HARI LIBUR NASIONAL

### 3.1 Entity: PublicHoliday

Digunakan oleh SLA Engine untuk mengecualikan hari libur dari hitungan hari kerja.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `date` | DATE | NOT NULL, UNIQUE | Tanggal hari libur |
| `name` | VARCHAR(200) | NOT NULL | Nama hari libur |
| `type` | ENUM('national','company_specific','optional') | NOT NULL DEFAULT 'national' | Tipe hari libur |
| `year` | SMALLINT UNSIGNED | NOT NULL | Tahun (generated dari date untuk index) |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 3.2 Business Rules — Hari Libur

| ID | Rule |
|---|---|
| BR-HOL-01 | Hari Sabtu dan Minggu selalu dianggap bukan hari kerja; tidak perlu dimasukkan ke tabel ini |
| BR-HOL-02 | Tabel ini hanya untuk hari libur **tambahan** (hari libur nasional, cuti bersama, libur khusus perusahaan) |
| BR-HOL-03 | SLA Engine menggunakan `PublicHoliday` + weekend rule untuk kalkulasi hari kerja |
| BR-HOL-04 | Admin dapat import data hari libur dari file CSV untuk satu tahun sekaligus |
| BR-HOL-05 | Hari libur yang sudah dilewati tidak boleh dihapus (audit trail) |

### 3.3 Hari Libur Nasional Indonesia 2025 (Data Seed)

| Tanggal | Nama |
|---|---|
| 2025-01-01 | Tahun Baru Masehi |
| 2025-01-27 | Isra Miraj Nabi Muhammad SAW |
| 2025-01-29 | Tahun Baru Imlek 2576 |
| 2025-03-29 | Hari Raya Nyepi |
| 2025-03-29 | Wafat Isa Al Masih |
| 2025-03-31 | Isra Miraj |
| 2025-04-18 | Wafat Isa Al Masih |
| 2025-05-01 | Hari Buruh Internasional |
| 2025-05-12 | Hari Raya Idul Fitri 1 Syawal 1446 H |
| 2025-05-13 | Hari Raya Idul Fitri 2 Syawal 1446 H |
| 2025-05-29 | Kenaikan Isa Al Masih |
| 2025-06-01 | Hari Lahir Pancasila |
| 2025-06-06 | Hari Raya Idul Adha |
| 2025-06-27 | Tahun Baru Islam 1447 H |
| 2025-08-17 | Hari Kemerdekaan RI |
| 2025-09-05 | Maulid Nabi Muhammad SAW |
| 2025-12-25 | Hari Raya Natal |
| 2025-12-26 | Cuti Bersama Natal |

### 3.4 Algoritma Kalkulasi Hari Kerja

```typescript
/**
 * Hitung tanggal deadline berdasarkan hari kerja
 * @param startDate - tanggal mulai (hari submission approval)
 * @param workingDays - jumlah hari kerja yang diberikan (dari CFG-05)
 * @param holidays - array tanggal libur dari DB
 * @returns deadline date
 */
function addWorkingDays(
  startDate: Date,
  workingDays: number,
  holidays: string[]  // format 'YYYY-MM-DD'
): Date {
  let count = 0;
  let current = new Date(startDate);
  current.setDate(current.getDate() + 1); // mulai dari hari berikutnya

  while (count < workingDays) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(dateStr);

    if (!isWeekend && !isHoliday) {
      count++;
    }

    if (count < workingDays) {
      current.setDate(current.getDate() + 1);
    }
  }

  return current;
}

/**
 * Hitung berapa hari kerja tersisa dari hari ini sampai deadline
 */
function workingDaysRemaining(
  deadline: Date,
  holidays: string[]
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;
  let current = new Date(today);
  current.setDate(current.getDate() + 1);

  while (current <= deadline) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
```

### 3.5 Caching Holidays

Hari libur untuk tahun berjalan di-cache di Redis/in-memory:
- Cache key: `holidays:{year}` (mis: `holidays:2025`)
- Cache value: JSON array string tanggal: `["2025-01-01","2025-01-29",...]`
- TTL: 24 jam
- Invalidate: saat Admin menambah/menghapus hari libur

### 3.6 DDL

```sql
CREATE TABLE public_holidays (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  date       DATE            NOT NULL,
  name       VARCHAR(200)    NOT NULL,
  type       ENUM('national','company_specific','optional') NOT NULL DEFAULT 'national',
  year       SMALLINT UNSIGNED NOT NULL,
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_holidays_date (date),
  KEY idx_holidays_year      (year),
  KEY idx_holidays_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.7 API Endpoints — Hari Libur

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/holidays | Admin | List semua hari libur (query: year=2025) |
| GET | /api/master/holidays | Internal/BE | List hari libur aktif untuk kalkulasi SLA |
| POST | /api/config/holidays | Admin | Tambah hari libur |
| PUT | /api/config/holidays/:id | Admin | Update hari libur (jika belum lewat) |
| DELETE | /api/config/holidays/:id | Admin | Hapus hari libur (jika belum lewat dan belum digunakan SLA) |
| POST | /api/config/holidays/import | Admin | Import CSV hari libur untuk 1 tahun |

### 3.8 Format Import CSV

```csv
date,name,type
2026-01-01,Tahun Baru Masehi,national
2026-02-17,Tahun Baru Imlek 2577,national
2026-03-20,Hari Raya Nyepi,national
```

---

## 4. RELASI KE MODUL LAIN

| Modul | Penggunaan |
|---|---|
| 041 — SLA Engine | `addWorkingDays()` dan `workingDaysRemaining()` menggunakan tabel `public_holidays` |
| 043–045 — Target & KPI | Target ditetapkan per `reporting_period_id` |
| 051 — Laporan | Filter laporan menggunakan `reporting_period_id` atau date range dari periode |
| 029 — Config SLA | SLA dikonfigurasi dalam hari kerja; kalkulasi aktual menggunakan modul ini |

---

## 5. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-PER-01 | Admin generate periode untuk tahun 2026 (quarterly + semester + annual) | 7 periode terbuat: Q1, Q2, Q3, Q4, S1, S2, FY2026 |
| TC-PER-02 | Buat dua periode Q1 2025 yang tanggalnya overlap | Error 422: "Terdapat overlap periode" |
| TC-PER-03 | Admin kunci periode Q1 2025 | is_locked = true; input target Q1 2025 tidak bisa diubah |
| TC-HOL-01 | SLA 3 hari kerja, submission hari Jumat, hari Senin libur nasional | Deadline = hari Rabu (skip Sabtu, Minggu, Senin libur) |
| TC-HOL-02 | Admin tambah hari libur baru | Cache hari libur diinvalidasi; kalkulasi SLA berikutnya sudah menggunakan data baru |
| TC-HOL-03 | Import CSV 20 hari libur 2026 | Semua 20 tanggal tersimpan; duplikat ditolak dengan pesan per baris |
| TC-HOL-04 | Hitung SLA 5 hari kerja mulai Senin, tidak ada libur | Deadline = Senin berikutnya |

**Gap Resolution:** MD-10 ✓ | MD-13 ✓ | CFG-05 (kalkulasi hari kerja) ✓ | CFG-10 ✓
