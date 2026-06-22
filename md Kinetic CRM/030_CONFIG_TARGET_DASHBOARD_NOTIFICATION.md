# 030 — KONFIGURASI TARGET, DASHBOARD & NOTIFIKASI
## KINETIC CRM — CFG-07, CFG-08, CFG-09

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 030 |
| **Nama Dokumen** | Konfigurasi Target KPI, Dashboard & Notifikasi Email |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.2 (CFG-07, CFG-08, CFG-09), C.1 (GAP-01) |
| **Gap Resolution** | GAP-01 Critical, CFG-07, CFG-08, CFG-09 |
| **Status** | Final |

---

## 1. CFG-07 — KONFIGURASI TARGET & BOBOT KPI

### 1.1 Overview

CFG-07 mendefinisikan struktur KPI yang akan diukur: indikator apa saja yang ditracking, bobot relatifnya dalam skor komposit, dan target per indikator per periode. Ini adalah konfigurasi yang menyelesaikan **GAP-01 Critical** (Modul Target & KPI tidak ada).

Detail desain penuh KPI ada di dokumen 043–045. CFG-07 adalah **antarmuka konfigurasi admin** untuk modul tersebut.

### 1.2 KPI Indicators yang Dikonfigurasi

| KPI Code | Nama | Satuan | Bobot Default |
|---|---|---|---|
| `tender_count` | Jumlah Tender yang Diikuti | count | 20% |
| `win_count` | Jumlah Tender Menang | count | 30% |
| `win_rate` | Win Rate | % | 25% |
| `pipeline_value` | Nilai Pipeline | Rp | 15% |
| `contract_value` | Nilai Kontrak Menang | Rp | 10% |
| **Total** | | | **100%** |

### 1.3 Entity: KpiIndicator

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode KPI |
| `name` | VARCHAR(200) | NOT NULL | Nama KPI |
| `description` | TEXT | NULL | |
| `unit` | ENUM('count','percentage','currency') | NOT NULL | Satuan pengukuran |
| `weight_pct` | DECIMAL(5,2) | NOT NULL | Bobot dalam persentase (0.00–100.00) |
| `higher_is_better` | TINYINT(1) | NOT NULL DEFAULT 1 | Untuk win_rate: 1; untuk future negative metrics: 0 |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL | |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 0 | KPI bawaan tidak bisa dihapus |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 1.4 Entity: KpiTarget

Target per KPI per periode per unit organisasi.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `kpi_indicator_id` | BIGINT UNSIGNED | NOT NULL, FK → kpi_indicators.id | |
| `reporting_period_id` | BIGINT UNSIGNED | NOT NULL, FK → reporting_periods.id | |
| `scope_type` | ENUM('company','division','branch') | NOT NULL | Level target |
| `scope_id` | BIGINT UNSIGNED | NULL | ID perusahaan/divisi/cabang; NULL = global |
| `target_value` | DECIMAL(15,2) | NOT NULL | Nilai target |
| `version` | SMALLINT UNSIGNED | NOT NULL DEFAULT 1 | Versi target (revisi) |
| `is_current` | TINYINT(1) | NOT NULL DEFAULT 1 | Hanya satu yang aktif per kombinasi KPI+period+scope |
| `notes` | TEXT | NULL | |
| `set_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(kpi_indicator_id, reporting_period_id, scope_type, scope_id, is_current)` — dengan partial index `WHERE is_current = 1`.

### 1.5 UI — Halaman Konfigurasi Target KPI

**Tab 1: Indikator KPI**

Tabel indikator dengan edit bobot inline:

```
Indikator KPI                    Bobot    Satuan      Aktif
───────────────────────────────────────────────────────────
Jumlah Tender Diikuti           [20%]    Count        ✓
Jumlah Tender Menang            [30%]    Count        ✓
Win Rate                        [25%]    Persentase   ✓
Nilai Pipeline                  [15%]    Rupiah (Rp)  ✓
Nilai Kontrak Menang            [10%]    Rupiah (Rp)  ✓
───────────────────────────────────────────────────────────
Total Bobot:                    [100%]   ← validasi real-time

[Simpan Bobot]
```

Validasi: total bobot harus tepat 100%. Jika tidak: error inline.

**Tab 2: Target per Periode**

Matrix target per KPI per unit per periode:

```
Periode: [Q1 2025 ▼]    Level: [Per Cabang ▼]

CABANG            | Jml Tender | Jml Menang | Win Rate | Pipeline (Rp)
──────────────────────────────────────────────────────────────────────
Cabang Jakarta    | [20      ] | [10      ] | [50%   ] | [5,000,000,000]
Cabang Surabaya   | [15      ] | [7       ] | [45%   ] | [3,000,000,000]
Cabang Bandung    | [10      ] | [5       ] | [50%   ] | [2,500,000,000]
──────────────────────────────────────────────────────────────────────
TOTAL DIVISI      | 45         | 22         | 48.9%    | 10,500,000,000

[Simpan Target Q1 2025]
```

Nilai di dalam `[ ]` adalah editable input. Nilai tanpa bracket adalah kalkulasi otomatis (aggregasi).

### 1.6 Composite Score Formula

Skor komposit dihitung dari realisasi vs target setiap KPI dikalikan bobotnya:

```
skor_kpi_i = MIN(realisasi_i / target_i, 1.0) * 100  -- cap di 100%
skor_komposit = SUM(skor_kpi_i * weight_i / 100)

Contoh:
  KPI Jml Tender: realisasi=18, target=20, weight=20% → 90 * 20/100 = 18
  KPI Win Rate: realisasi=55%, target=50%, weight=25% → 100 * 25/100 = 25 (cap 100%)
  ...
  Skor Komposit = 18 + 25 + ... = 82.5 (dari 100)
```

Traffic light: merah < 60, kuning 60–89, hijau ≥ 90.

### 1.7 API Endpoints — CFG-07

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/kpi-indicators | Admin | List semua KPI indikator |
| PUT | /api/config/kpi-indicators/:id | Admin | Update bobot dan setting KPI |
| POST | /api/config/kpi-indicators/reweight | Admin | Bulk update semua bobot sekaligus |
| GET | /api/config/kpi-targets | Admin | List target (query: periodId, scopeType, scopeId) |
| POST | /api/config/kpi-targets | Admin | Set / update target |
| GET | /api/config/kpi-targets/history | Admin | Histori versi target |

---

## 2. CFG-08 — KONFIGURASI DASHBOARD

### 2.1 Overview

CFG-08 mendefinisikan widget mana yang ditampilkan di dashboard untuk setiap role, dan pengaturan refresh rate. Menggantikan tampilan dashboard yang hardcode per role.

### 2.2 Entity: DashboardConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `role_code` | VARCHAR(50) | NOT NULL, UNIQUE | Role yang dikonfigurasi |
| `widget_config` | JSON | NOT NULL | Array konfigurasi widget + urutan |
| `refresh_interval_minutes` | TINYINT UNSIGNED | NOT NULL DEFAULT 5 | Interval auto-refresh |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.3 Widget Config JSON Structure

```json
{
  "widgets": [
    {
      "widget_id": "active_projects",
      "title": "Proyek Aktif",
      "is_visible": true,
      "position": 1,
      "size": "small"
    },
    {
      "widget_id": "approval_pending",
      "title": "Approval Pending",
      "is_visible": true,
      "position": 2,
      "size": "medium"
    },
    {
      "widget_id": "trend_win_loss",
      "title": "Trend Win/Loss",
      "is_visible": true,
      "position": 3,
      "size": "large"
    }
  ]
}
```

### 2.4 Available Widgets

| widget_id | Nama | Ukuran | Role Default |
|---|---|---|---|
| `active_projects` | Proyek Aktif | small | cabang, pm, management, admin |
| `approval_pending` | Approval Pending | medium | pm, department, management, admin |
| `approaching_deadline` | Mendekati Deadline | medium | cabang, pm, management, admin |
| `win_rate_monthly` | Win Rate Bulan Ini | small | cabang, management, admin |
| `at_risk_projects` | Proyek At-Risk | medium | pm, management, admin |
| `pipeline_value` | Total Nilai Pipeline | small | management, admin |
| `trend_win_loss` | Trend Win/Loss | large | management, admin |
| `progress_vs_target` | Progress vs Target | medium | management, admin |
| `projects_by_status` | Proyek per Status | medium | pm, management, admin |
| `active_users_today` | User Aktif Hari Ini | small | admin |

### 2.5 API Endpoints — CFG-08

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/dashboard | Admin | List konfigurasi dashboard per role |
| PUT | /api/config/dashboard/:roleCode | Admin | Update konfigurasi dashboard role tertentu |
| GET | /api/config/dashboard/available-widgets | Admin | List semua widget yang tersedia |

---

## 3. CFG-09 — KONFIGURASI NOTIFIKASI EMAIL (FASE 2)

### 3.1 Overview

CFG-09 mengonfigurasi template dan pengiriman notifikasi **email** untuk setiap event sistem. Ini adalah Fase 2 fitur; di Fase 1 hanya notifikasi in-app yang aktif. Namun konfigurasi ini didesain sekarang agar implementasi Fase 2 hanya perlu mengaktifkan channel email yang sudah terkonfigurasi.

### 3.2 Entity: EmailNotificationConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `notification_template_id` | BIGINT UNSIGNED | NOT NULL, FK | Template notifikasi |
| `is_email_enabled` | TINYINT(1) | NOT NULL DEFAULT 0 | Default 0 sampai Fase 2 |
| `email_delay_minutes` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | Delay sebelum kirim email (anti-spam jika aksi cepat dibatalkan) |
| `smtp_config_id` | BIGINT UNSIGNED | NULL, FK | Konfigurasi SMTP server |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 3.3 SMTP Configuration

```
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=***
SMTP_FROM_NAME=KINETIC CRM
SMTP_ENCRYPTION=tls
```

Konfigurasi SMTP disimpan di environment variables (bukan DB) untuk keamanan. Admin dapat melakukan test send dari UI.

### 3.4 UI — Konfigurasi Notifikasi

**Bagian 1: Konfigurasi SMTP (Fase 2)**
- Input fields SMTP (host, port, user, pass, encryption)
- Tombol "Test Kirim Email" → kirim email test ke alamat admin

**Bagian 2: Template Matrix**

| Event | In-App | Email (Fase 2) | Edit Template |
|---|:---:|:---:|---|
| Prospek Disubmit ke PM | ✓ aktif | [ ] belum aktif | [Edit] |
| Revisi Prospek Dikirim | ✓ aktif | [ ] belum aktif | [Edit] |
| Deadline Approaching | ✓ aktif | [ ] belum aktif | [Edit] |
| ... | | | |

Toggle email per event; saat Fase 2 diaktifkan, toggle ini yang diubah Admin.

### 3.5 API Endpoints — CFG-09

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/notifications | Admin | List konfigurasi notifikasi semua event |
| PUT | /api/config/notifications/:templateId | Admin | Update template dan enable/disable per event |
| POST | /api/config/notifications/test-email | Admin | Kirim test email (Fase 2) |
| GET | /api/config/smtp-status | Admin | Cek status koneksi SMTP (Fase 2) |

---

## 4. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-CFG07-01 | Admin set bobot total 95% (bukan 100%) | Error: "Total bobot harus tepat 100%" |
| TC-CFG07-02 | Admin set target Q1 2025 untuk Cabang Jakarta | Target tersimpan; dashboard menampilkan progress vs target |
| TC-CFG07-03 | Realisasi 55%, target 50%, bobot 25% → skor KPI ini | 100 × 25/100 = 25 (cap 100% karena 55 > 50) |
| TC-CFG08-01 | Admin sembunyikan widget trend_win_loss untuk role PM | Dashboard PM tidak menampilkan chart trend win/loss |
| TC-CFG08-02 | Admin ubah refresh interval menjadi 10 menit | Dashboard auto-refresh setiap 10 menit |
| TC-CFG09-01 | Admin aktifkan email untuk event "Prospek Disubmit" | Flag `is_email_enabled = true` tersimpan; email akan dikirim di Fase 2 |

**Gap Resolution:** GAP-01 Critical ✓ | CFG-07 ✓ | CFG-08 ✓ | CFG-09 ✓
