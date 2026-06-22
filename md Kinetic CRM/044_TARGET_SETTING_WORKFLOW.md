# 044 — TARGET SETTING WORKFLOW
## KINETIC CRM — Alur Input dan Update Target oleh Admin/Management

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 044 |
| **Nama Dokumen** | Target Setting Workflow |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-01), B.2 (CFG-07) |
| **Gap Resolution** | GAP-01 Critical |
| **Status** | Final |

---

## 1. TARGET SETTING WORKFLOW

### 1.1 Siapa yang Bisa Set Target

| Role | Scope Target yang Bisa Diset |
|---|---|
| Admin | Semua level (company, division, branch) |
| Management | Division dan Branch di bawah divisinya |
| PM | — (tidak bisa set target) |
| Cabang | — (tidak bisa set target) |

### 1.2 Alur Setting Target Baru (Periode Baru)

```
1. Admin/Management buka CFG-07 → Tab "Target per Periode"
2. Pilih Periode (dropdown reporting_periods)
3. Pilih Level (Company / Division / Branch)
4. Grid target muncul: baris = unit (cabang/divisi), kolom = KPI indicator
5. Isi nilai target per sel
6. Klik "Simpan Target [Periode] — [Level]"
    ↓
Backend:
  - Untuk setiap sel yang terisi: INSERT INTO kpi_targets
  - Untuk setiap sel kosong: skip (target tidak ditetapkan = realisasi dihitung tapi tidak ada target)
  - Validasi: target_value > 0
```

### 1.3 Alur Revisi Target (Target yang Sudah Ada)

```
1. Admin/Management buka target yang sudah ada
2. Ubah nilai sel yang perlu direvisi
3. Isi "Alasan Revisi" (wajib saat ada perubahan)
4. Klik "Simpan Revisi"
    ↓
Backend:
  - Untuk setiap target yang berubah:
    a. UPDATE kpi_targets SET is_current = 0 WHERE (kombinasi KPI+period+scope) AND is_current = 1
    b. INSERT kpi_targets baru dengan version + 1, is_current = 1, revision_reason = alasan
    c. UPDATE kpi_targets SET superseded_by = new_id WHERE id = old_id
```

### 1.4 Histori Versi Target

Admin dapat melihat histori versi target:

```
KPI: Win Rate | Periode: Q2 2025 | Cabang Jakarta

Versi  | Nilai Target | Diset Oleh        | Tanggal       | Alasan Revisi
──────────────────────────────────────────────────────────────────────────
v3     | 55%          | Pak Agus (Admin)  | 15 Jun 2025   | Penyesuaian setelah evaluasi tengah periode
v2     | 50%          | Bu Sari (Mgmt)    | 1 Apr 2025    | Revisi karena kondisi pasar Q2 lebih kompetitif
v1     | 60%          | Pak Agus (Admin)  | 1 Jan 2025    | Target awal (current = false)
```

### 1.5 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/kpi-targets | Admin, Management | List target (query: periodId, scopeType, scopeId) |
| POST | /api/config/kpi-targets/bulk | Admin, Management | Set/update target (bulk upsert) |
| GET | /api/config/kpi-targets/history | Admin | Histori versi per KPI+period+scope |
| GET | /api/config/kpi-targets/summary | Auth | Summary target vs realisasi saat ini |

### 1.6 POST /api/config/kpi-targets/bulk

```json
{
  "reporting_period_id": 3,
  "scope_type": "branch",
  "revision_reason": "Penyesuaian target Q2 berdasarkan pipeline aktual",
  "targets": [
    { "kpi_indicator_id": 1, "scope_id": 3, "target_value": 20 },
    { "kpi_indicator_id": 2, "scope_id": 3, "target_value": 10 },
    { "kpi_indicator_id": 3, "scope_id": 3, "target_value": 50.0 },
    { "kpi_indicator_id": 4, "scope_id": 3, "target_value": 5000000000 },
    { "kpi_indicator_id": 5, "scope_id": 3, "target_value": 10000000000 }
  ]
}
```

---

# 045 — PROGRESS MONITORING & SCORING
## KINETIC CRM — Kalkulasi Real-time, Snapshot Periodik, Traffic Light

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 045 |
| **Nama Dokumen** | Progress Monitoring & Scoring |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-01) |
| **Gap Resolution** | GAP-01 Critical |
| **Status** | Final |

---

## 2. PROGRESS MONITORING

### 2.1 Real-time vs Snapshot

| Mode | Kapan Digunakan | Sumber Data |
|---|---|---|
| **Real-time** | Dashboard widget, detail KPI halaman | Query langsung ke tabel projects + results |
| **Snapshot** | Grafik trending, laporan historis | Tabel kpi_snapshots |

### 2.2 API: Progress Real-time

```
GET /api/kpi/progress?periodId=3&scopeType=branch&scopeId=3

Response 200:
{
  "period": { "id": 3, "name": "Q2 2025", "start": "2025-04-01", "end": "2025-06-30" },
  "scope": { "type": "branch", "id": 3, "name": "Cabang Jakarta" },
  "composite_score": 94.7,
  "traffic_light": "green",
  "traffic_label": "Tercapai",
  "kpis": [
    {
      "id": 1, "code": "tender_count", "name": "Jumlah Tender",
      "unit": "count",
      "target": 20, "actual": 18,
      "achievement_pct": 90.0,
      "capped_pct": 90.0,
      "weight_pct": 20,
      "contribution": 18.0,
      "traffic_light": "green"
    },
    ...
  ],
  "last_updated": "2025-06-10T14:30:00Z"
}
```

### 2.3 Snapshot Cron Job

```typescript
// Berjalan setiap hari jam 00:01 WIB
async function takeKpiSnapshot() {
  const today = new Date();
  const activePeriods = await getActiveReportingPeriods(today);

  for (const period of activePeriods) {
    const allScopes = await getAllActiveScopes(); // company, divisions, branches

    for (const scope of allScopes) {
      const kpiIndicators = await getActiveKpiIndicators();

      for (const kpi of kpiIndicators) {
        const actualValue = await calculateKpiActual(kpi.id, period, scope);
        const target = await getCurrentTarget(kpi.id, period.id, scope.type, scope.id);

        if (target) {
          const achievementPct = target.target_value > 0
            ? (actualValue / target.target_value) * 100
            : 0;

          await upsertKpiSnapshot({
            kpi_indicator_id: kpi.id,
            reporting_period_id: period.id,
            scope_type: scope.type,
            scope_id: scope.id,
            snapshot_date: today,
            actual_value: actualValue,
            target_value: target.target_value,
            achievement_pct: Math.min(achievementPct, 100)
          });
        }
      }
    }
  }
}
```

### 2.4 API Endpoints — Progress

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/kpi/progress | Auth | Progress real-time KPI (query: periodId, scopeType, scopeId) |
| GET | /api/kpi/progress/all-branches | Management, Admin | Progress semua cabang dalam satu response |
| GET | /api/kpi/snapshots | Auth | Data snapshot historis untuk charting |
| GET | /api/kpi/composite-score | Auth | Hanya composite score + traffic light |

### 2.5 Dashboard Widget: Progress vs Target

Widget di Dashboard (DASH-01) menampilkan:

```
PROGRESS VS TARGET — Q2 2025
──────────────────────────────────────────────────────────
KPI                | Target | Realisasi | Capaian | Status
──────────────────────────────────────────────────────────
Jumlah Tender      |     20 |        18 |    90%  |  🟡
Jumlah Menang      |     10 |        10 |   100%  |  🟢
Win Rate           |    50% |     55.6% |   100%  |  🟢
Nilai Pipeline     | 5,0 M  |    4,5 M  |    90%  |  🟡
Nilai Kontrak      | 10,0 M |    8,2 M  |    82%  |  🟡
──────────────────────────────────────────────────────────
SKOR KOMPOSIT      |        |           |  94.7   |  🟢 Tercapai
```

Traffic light per KPI: ≥90% = 🟢, 60–89% = 🟡, 30–59% = 🟠, <30% = 🔴

### 2.6 Trending Chart

Chart multi-line di halaman laporan; X = tanggal snapshot, Y = achievement_pct.
Setiap KPI = satu garis; composite score = garis tebal.
Data dari `kpi_snapshots` dengan filter periode + scope.

### 2.7 Business Rules — Monitoring

| ID | Rule |
|---|---|
| BR-MON-01 | Realisasi selalu dihitung dari data aktual di DB (bukan input manual) |
| BR-MON-02 | Jika tidak ada target untuk KPI tertentu, baris ditampilkan dengan kolom target = "—" dan capaian = "—" |
| BR-MON-03 | Proyek cancelled tidak masuk kalkulasi realisasi KPI apapun |
| BR-MON-04 | Snapshot harian memungkinkan trending; jika cron gagal satu hari, snapshot untuk hari itu kosong (tidak di-backfill) |
| BR-MON-05 | Scope agregasi: composite score company = rata-rata weighted dari semua division; division = rata-rata weighted dari semua branch |

---

## 3. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-TRK-01 | Lihat progress Cabang Jakarta Q2 yang punya target semua KPI | Response berisi 5 KPI + composite score |
| TC-TRK-02 | Lihat progress Cabang Bandung yang tidak punya target | Response berisi 5 KPI dengan target = null; capaian = null |
| TC-TRK-03 | Win Rate actual > target (over-achievement) | capped_pct = 100% (tidak lebih dari 100%) |
| TC-TRK-04 | Snapshot cron berjalan | kpi_snapshots terisi untuk tanggal hari ini; semua scope dan KPI |
| TC-TRK-05 | Dashboard widget menampilkan traffic light merah untuk KPI Win Rate < 30% | Badge merah + label "Kritis" |
| TC-TRK-06 | Laporan trending 3 bulan terakhir | Line chart menggunakan data snapshot per hari; titik kosong di hari cron gagal |

**Gap Resolution:** GAP-01 Critical ✓ (dokumen 043, 044, 045 bersama-sama menyelesaikan GAP-01)
