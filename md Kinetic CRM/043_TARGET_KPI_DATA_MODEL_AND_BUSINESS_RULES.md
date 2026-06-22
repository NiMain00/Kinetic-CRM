# 043 — TARGET & KPI: DATA MODEL & BUSINESS RULES
## KINETIC CRM — Master KPI, Master Target, Bobot, Formula Skor Komposit

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 043 |
| **Nama Dokumen** | Target & KPI — Data Model & Business Rules |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-01 Critical), B.2 (CFG-07) |
| **Gap Resolution** | **GAP-01 Critical** |
| **Status** | Final |

---

## 1. PURPOSE & CRITICAL CONTEXT

> **GAP-01 (Critical):** PRD v1.0 tidak memiliki modul Target & KPI sama sekali. Tidak ada cara untuk menetapkan target penjualan, tidak ada tracking progress vs target, dan tidak ada skor kinerja. Ini adalah gap kritikal karena manajemen tidak dapat mengukur performa tim secara kuantitatif.

Dokumen ini mendefinisikan data model lengkap dan business rules untuk sistem Target & KPI, yang mencakup: definisi indikator KPI, penetapan target per periode per unit organisasi, versioning target (revisi), dan formula kalkulasi skor komposit.

---

## 2. ENTITIES LENGKAP

### 2.1 Entity: KpiIndicator (sudah diringkas di doc 030, detail penuh di sini)

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | |
| `name` | VARCHAR(200) | NOT NULL | |
| `description` | TEXT | NULL | Penjelasan cara pengukuran |
| `unit` | ENUM('count','percentage','currency') | NOT NULL | |
| `weight_pct` | DECIMAL(5,2) | NOT NULL | Bobot (0.00–100.00); total semua KPI aktif = 100.00 |
| `calculation_method` | TEXT | NOT NULL | Deskripsi formula SQL/logika kalkulasi |
| `higher_is_better` | TINYINT(1) | NOT NULL DEFAULT 1 | 0 untuk KPI negatif (mis: waktu rata-rata = makin kecil makin baik) |
| `decimal_places` | TINYINT UNSIGNED | NOT NULL DEFAULT 0 | Presisi desimal untuk tampilan |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 0 | KPI bawaan tidak bisa dihapus |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Constraint Penting:** `SUM(weight_pct) WHERE is_active = 1 = 100.00` (enforced di application layer saat save).

### 2.2 Entity: KpiTarget (versi penuh)

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `kpi_indicator_id` | BIGINT UNSIGNED | NOT NULL, FK | |
| `reporting_period_id` | BIGINT UNSIGNED | NOT NULL, FK | |
| `scope_type` | ENUM('company','division','branch') | NOT NULL | Level target |
| `scope_id` | BIGINT UNSIGNED | NULL | ID entity; NULL = seluruh company |
| `target_value` | DECIMAL(18,2) | NOT NULL | Nilai target |
| `version` | SMALLINT UNSIGNED | NOT NULL DEFAULT 1 | Versi target (revisi ke-N) |
| `is_current` | TINYINT(1) | NOT NULL DEFAULT 1 | Hanya satu yang aktif per KPI+period+scope |
| `revision_reason` | TEXT | NULL | Alasan revisi target |
| `set_by` | BIGINT UNSIGNED | NOT NULL, FK → users.id | |
| `superseded_by` | BIGINT UNSIGNED | NULL, FK → kpi_targets.id | FK ke versi berikutnya |
| `created_at` | TIMESTAMP | NOT NULL | |

**Partial Unique Constraint:**
```sql
CREATE UNIQUE INDEX uq_kpi_target_current
ON kpi_targets(kpi_indicator_id, reporting_period_id, scope_type, scope_id, is_current)
WHERE is_current = 1;
-- (Partial index — hanya berlaku di PostgreSQL; untuk MySQL gunakan soft constraint di application layer)
```

### 2.3 Entity: KpiSnapshot (Rekam Realisasi Periodik)

Snapshot diambil secara periodik (harian/mingguan) untuk trending dan historical chart.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `kpi_indicator_id` | BIGINT UNSIGNED | FK |
| `reporting_period_id` | BIGINT UNSIGNED | FK |
| `scope_type` | ENUM('company','division','branch') | |
| `scope_id` | BIGINT UNSIGNED | NULL |
| `snapshot_date` | DATE | Tanggal snapshot |
| `actual_value` | DECIMAL(18,2) | Nilai realisasi pada tanggal ini |
| `target_value` | DECIMAL(18,2) | Target pada saat snapshot |
| `achievement_pct` | DECIMAL(7,2) | actual/target * 100 |
| `created_at` | TIMESTAMP | |

---

## 3. KPI INDICATOR DEFINITIONS

### 3.1 KPI Bawaan (System KPIs)

**KPI-1: Jumlah Tender Diikuti**
- Code: `tender_count`
- Unit: count
- Formula: `COUNT(projects WHERE type='tender' AND status NOT IN ('cancelled') AND created_at BETWEEN period.start AND period.end AND branch_id = scope_id)`
- Weight default: 20%

**KPI-2: Jumlah Tender Menang**
- Code: `win_count`
- Unit: count
- Formula: `COUNT(project_winner_results WHERE result='win' AND projects.created_at BETWEEN period.start AND period.end AND branch_id = scope_id)`
- Weight default: 30%

**KPI-3: Win Rate**
- Code: `win_rate`
- Unit: percentage
- Formula: `(win_count / tender_count_with_result) * 100` — hanya proyek yang sudah ada hasil (win/lose), tidak termasuk yang masih berjalan
- Weight default: 25%

**KPI-4: Nilai Pipeline**
- Code: `pipeline_value`
- Unit: currency (Rp)
- Formula: `SUM(projects.estimated_value WHERE status NOT IN ('selesai','cancelled') AND branch_id = scope_id)`
- Weight default: 15%

**KPI-5: Nilai Kontrak Menang**
- Code: `contract_value`
- Unit: currency (Rp)
- Formula: `SUM(project_winner_results.contract_value WHERE result='win' AND period overlap)`
- Weight default: 10%

---

## 4. COMPOSITE SCORE FORMULA

### 4.1 Kalkulasi Per KPI

```
achievement_pct_i = (actual_value_i / target_value_i) * 100

Jika higher_is_better = true:
  capped_pct_i = MIN(achievement_pct_i, 100)  -- cap di 100%; over-achievement tidak bonus

Jika higher_is_better = false (untuk KPI yang makin kecil makin baik, mis: avg_response_time):
  capped_pct_i = MIN((target_value_i / actual_value_i) * 100, 100)
```

### 4.2 Weighted Composite Score

```
composite_score = SUM(capped_pct_i * weight_pct_i / 100)
                = (capped_pct_1 * w1 + capped_pct_2 * w2 + ... + capped_pct_n * wn) / 100

Range: 0 – 100
```

### 4.3 Traffic Light Classification

| Range Skor | Status | Warna | Label |
|---|---|---|---|
| ≥ 90 | Excellent | Hijau (#16A34A) | Tercapai |
| 60 – 89.99 | On Track | Kuning (#D97706) | Mendekati |
| 30 – 59.99 | At Risk | Oranye (#EA580C) | Perlu Perhatian |
| < 30 | Critical | Merah (#DC2626) | Kritis |

### 4.4 Contoh Kalkulasi

```
Periode: Q2 2025 | Scope: Cabang Jakarta | Target ditetapkan oleh Management

KPI-1 Jumlah Tender: actual=18, target=20, weight=20%
  achievement = 18/20 * 100 = 90%; capped = 90%
  kontribusi = 90 * 20/100 = 18.0

KPI-2 Jumlah Menang: actual=10, target=10, weight=30%
  achievement = 10/10 * 100 = 100%; capped = 100%
  kontribusi = 100 * 30/100 = 30.0

KPI-3 Win Rate: actual=55.6%, target=50%, weight=25%
  achievement = 55.6/50 * 100 = 111.1%; capped = 100%
  kontribusi = 100 * 25/100 = 25.0

KPI-4 Nilai Pipeline: actual=4.5B, target=5B, weight=15%
  achievement = 4.5/5 * 100 = 90%; capped = 90%
  kontribusi = 90 * 15/100 = 13.5

KPI-5 Nilai Kontrak: actual=8.2B, target=10B, weight=10%
  achievement = 8.2/10 * 100 = 82%; capped = 82%
  kontribusi = 82 * 10/100 = 8.2

Composite Score = 18.0 + 30.0 + 25.0 + 13.5 + 8.2 = 94.7/100
Traffic Light: Hijau (≥ 90) — "Tercapai"
```

---

## 5. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-KPI-01 | Total bobot semua KPI aktif HARUS = 100.00%; sistem validasi saat save |
| BR-KPI-02 | KPI sistem tidak bisa dihapus permanen; hanya bisa dinonaktifkan |
| BR-KPI-03 | Jika KPI dinonaktifkan, bobotnya harus direlokasikan ke KPI lain sebelum save; sistem tidak allow save jika total ≠ 100% |
| BR-KPI-04 | Target ditetapkan per kombinasi unik (kpi_id, period_id, scope_type, scope_id) |
| BR-KPI-05 | Revisi target: versi lama `is_current` di-set 0; versi baru dibuat dengan `version + 1` |
| BR-KPI-06 | Target tidak bisa direvisi jika periode sudah `is_locked = true` |
| BR-KPI-07 | Target level company = agregasi target semua division; target level division = agregasi semua branch di bawahnya; tidak perlu input manual (auto-agregasi) |
| BR-KPI-08 | Realisasi (actual_value) dihitung real-time dari query ke data proyek; bukan disimpan manual |
| BR-KPI-09 | Snapshot periodik diambil setiap hari jam 00:01 WIB oleh cron job |
| BR-KPI-10 | Win rate hanya dihitung dari proyek yang sudah ada hasil (win/lose); proyek yang masih berjalan tidak masuk denomintor |

---

## 6. REAL-TIME REALIZATION QUERIES

### 6.1 Query Realisasi KPI (untuk satu branch, satu periode)

```sql
-- KPI-1: Tender Count
SELECT COUNT(*) AS actual_value
FROM projects p
WHERE p.type = 'tender'
  AND p.is_cancelled = 0
  AND p.branch_id = :branchId
  AND p.created_at BETWEEN :periodStart AND :periodEnd;

-- KPI-2: Win Count
SELECT COUNT(*) AS actual_value
FROM project_winner_results pwr
JOIN projects p ON p.id = pwr.project_id
WHERE pwr.result = 'win'
  AND p.branch_id = :branchId
  AND p.created_at BETWEEN :periodStart AND :periodEnd;

-- KPI-3: Win Rate
SELECT
  CASE WHEN tender_total > 0 THEN ROUND(win_count / tender_total * 100, 1) ELSE 0 END AS win_rate
FROM (
  SELECT
    COUNT(*) AS tender_total,
    SUM(CASE WHEN pwr.result = 'win' THEN 1 ELSE 0 END) AS win_count
  FROM projects p
  LEFT JOIN project_winner_results pwr ON pwr.project_id = p.id
  WHERE p.type = 'tender'
    AND p.is_cancelled = 0
    AND pwr.result IS NOT NULL  -- hanya yang sudah ada hasil
    AND p.branch_id = :branchId
    AND p.created_at BETWEEN :periodStart AND :periodEnd
) sub;

-- KPI-4: Pipeline Value
SELECT COALESCE(SUM(p.estimated_value), 0) AS actual_value
FROM projects p
JOIN project_statuses ps ON ps.id = p.status_id
WHERE p.is_cancelled = 0
  AND ps.is_terminal = 0  -- hanya yang masih aktif
  AND p.branch_id = :branchId;
  -- Pipeline value: tidak dibatasi periode, ini adalah snapshot saat ini

-- KPI-5: Contract Value
SELECT COALESCE(SUM(pwr.contract_value), 0) AS actual_value
FROM project_winner_results pwr
JOIN projects p ON p.id = pwr.project_id
WHERE pwr.result = 'win'
  AND p.branch_id = :branchId
  AND pwr.created_at BETWEEN :periodStart AND :periodEnd;
```

---

## 7. DDL

```sql
CREATE TABLE kpi_indicators (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                VARCHAR(50)     NOT NULL,
  name                VARCHAR(200)    NOT NULL,
  description         TEXT            NULL,
  unit                ENUM('count','percentage','currency') NOT NULL,
  weight_pct          DECIMAL(5,2)    NOT NULL,
  calculation_method  TEXT            NOT NULL,
  higher_is_better    TINYINT(1)      NOT NULL DEFAULT 1,
  decimal_places      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sort_order          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active           TINYINT(1)      NOT NULL DEFAULT 1,
  is_system           TINYINT(1)      NOT NULL DEFAULT 0,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kpi_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kpi_targets (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kpi_indicator_id     BIGINT UNSIGNED NOT NULL,
  reporting_period_id  BIGINT UNSIGNED NOT NULL,
  scope_type           ENUM('company','division','branch') NOT NULL,
  scope_id             BIGINT UNSIGNED NULL,
  target_value         DECIMAL(18,2)   NOT NULL,
  version              SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_current           TINYINT(1)      NOT NULL DEFAULT 1,
  revision_reason      TEXT            NULL,
  set_by               BIGINT UNSIGNED NOT NULL,
  superseded_by        BIGINT UNSIGNED NULL,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kt_kpi        (kpi_indicator_id),
  KEY idx_kt_period     (reporting_period_id),
  KEY idx_kt_scope      (scope_type, scope_id),
  KEY idx_kt_is_current (is_current),
  CONSTRAINT fk_kt_kpi    FOREIGN KEY (kpi_indicator_id)    REFERENCES kpi_indicators(id),
  CONSTRAINT fk_kt_period FOREIGN KEY (reporting_period_id) REFERENCES reporting_periods(id),
  CONSTRAINT fk_kt_setter FOREIGN KEY (set_by)              REFERENCES users(id),
  CONSTRAINT fk_kt_super  FOREIGN KEY (superseded_by)       REFERENCES kpi_targets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kpi_snapshots (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kpi_indicator_id     BIGINT UNSIGNED NOT NULL,
  reporting_period_id  BIGINT UNSIGNED NOT NULL,
  scope_type           ENUM('company','division','branch') NOT NULL,
  scope_id             BIGINT UNSIGNED NULL,
  snapshot_date        DATE            NOT NULL,
  actual_value         DECIMAL(18,2)   NOT NULL,
  target_value         DECIMAL(18,2)   NOT NULL,
  achievement_pct      DECIMAL(7,2)    NOT NULL,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_snap_kpi_period_scope_date (kpi_indicator_id, reporting_period_id, scope_type, scope_id, snapshot_date),
  KEY idx_snap_date  (snapshot_date),
  KEY idx_snap_scope (scope_type, scope_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-KPI-01 | Admin set bobot total 95% (bukan 100%) | Error: "Total bobot harus tepat 100%; saat ini 95%" |
| TC-KPI-02 | Admin nonaktifkan KPI Win Rate tanpa relokasi bobot | Error: "Nonaktifkan KPI akan membuat total bobot menjadi 75%; harap relokasikan 25% ke KPI lain" |
| TC-KPI-03 | Cabang Jakarta: 18 tender, 10 menang, Q2 target 20 tender 10 menang | achievement tender = 90%, win = 100%; composite ≥ 90% |
| TC-KPI-04 | Revisi target Q2 setelah periode berjalan | Versi lama is_current = 0; versi baru dibuat; histori tersimpan |
| TC-KPI-05 | Revisi target periode yang sudah locked | Error: "Target periode yang sudah dikunci tidak dapat direvisi" |
| TC-KPI-06 | Win Rate hanya dihitung proyek yang sudah ada hasil | Proyek masih berjalan tidak masuk perhitungan win rate |

**Gap Resolution:** GAP-01 Critical ✓ | CFG-07 ✓
