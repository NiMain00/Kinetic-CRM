# 050 — DASHBOARD MODULE
## KINETIC CRM — Modul Dashboard Multi-Role

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 050 |
| **Nama Dokumen** | Dashboard Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0, 014_UI_SCREEN_CATALOG.md |
| **Dokumen Terkait** | 014 (UI Screen Catalog — DASH-01), 008_target_kpi (043-045), 011 (AI Features & Use Cases), 010 (AI Integration Architecture), 030 (CFG-08 Config Dashboard), 057 (API Endpoint Specification), 013 (Global State Machine Reference) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Backend Developer, Frontend Developer, Business Analyst, Product Owner, QA Engineer

---

## 1. PURPOSE

Modul ini mendesain penuh **Dashboard** KINETIC CRM — satu-satunya titik masuk monitoring real-time yang dilihat seluruh role setiap kali login. BA Review menandai dashboard versi PRD lama sebagai gap signifikan melalui dua temuan:

- **GAP-10 (Major):** "Dashboard tidak memiliki filter per cabang/divisi/periode untuk management" — manajemen tidak bisa drill-down ke performa unit tertentu, laporan tidak actionable.
- **D.6 (Rekomendasi Perbaikan Dashboard Monitoring):** daftar widget konkret yang harus ditambahkan (Pipeline Funnel, Progress vs Target, Approval Inbox preview, Win/Loss Trend, At-Risk Projects, Cabang Dashboard) beserta role yang berhak melihat masing-masing dan prioritasnya.

Layar Dashboard (`DASH-01`) sendiri sudah didokumentasikan lengkap di **014_UI_SCREEN_CATALOG.md** — purpose, komponen, visibility matrix per role, business rules, responsive behavior, dan accessibility requirements sudah final di sana. **Dokumen ini tidak mengulang isi tersebut.** Fokus dokumen ini adalah hal yang belum tercakup di 014: **kalkulasi di balik setiap widget, sumber data dan formula agregasi, refresh policy teknis, dan desain AI Executive Summary widget** — sebagaimana diwajibkan revisi v1.1 index untuk menaikkan AI dari sekadar env var menjadi komponen arsitektur resmi.

---

## 2. SCOPE

### In Scope

- Formula kalkulasi setiap widget (bagaimana angka di widget benar-benar dihitung dari data mentah)
- Sumber data per widget (tabel/entitas yang menjadi dasar agregasi)
- Refresh policy teknis (interval, strategi cache, invalidation)
- Desain filter granular (GAP-10): per cabang, divisi, kategori proyek, periode
- Desain AI Executive Summary widget: kontrak ke AI Service Layer, trigger, fallback jika AI gagal
- Aturan agregasi data lintas-role (bagaimana data yang sama menghasilkan angka berbeda untuk role berbeda)

### Out of Scope

- Layout visual, komponen UI, responsive breakpoint, accessibility per widget → **014_UI_SCREEN_CATALOG.md** (SCREEN: DASH-01) — dirujuk, tidak diulang
- Definisi Target & KPI, formula skor komposit → **043_TARGET_KPI_DATA_MODEL_AND_BUSINESS_RULES.md**, **045_PROGRESS_MONITORING_AND_SCORING.md**
- Konfigurasi widget per role oleh admin (CFG-08) → **030_CONFIG_TARGET_DASHBOARD_NOTIFICATION.md** — modul ini mengonsumsi hasil konfigurasi tersebut
- Arsitektur AI Service Layer secara umum, provider abstraction, rate limiting → **010_AI_INTEGRATION_ARCHITECTURE.md** — modul ini hanya mendefinisikan *cara dashboard memanggil* AI Service Layer, bukan cara AI Service Layer bekerja secara internal
- Laporan terekspor (Excel/PDF) → **051_REPORTING_MODULE.md**

---

## 3. GAP TRACEABILITY

| Referensi | Deskripsi | Bagaimana Diselesaikan |
|---|---|---|
| **GAP-10** | Dashboard tidak punya filter per cabang/divisi/periode untuk management | Bagian 5 (Filter Granular) |
| **D.6** | Daftar widget rekomendasi (Pipeline Funnel, Progress vs Target, Approval Inbox, Win/Loss Trend, At-Risk, Cabang Dashboard) | Bagian 4 (Widget Calculation Reference) — seluruh widget D.6 dipetakan ke kalkulasi konkret |
| **GAP-04** | Status `cancelled` tidak boleh muncul di widget proyek aktif | BR-DASH-CALC-02 (Bagian 4.1) |
| **GAP-01 / Modul Target & KPI** | Progress vs Target bergantung pada data target yang baru didesain penuh di 043-045 | BR-DASH-CALC-07 (Bagian 4.5) |
| **Revisi v1.1 Index** | AI Integration dinaikkan jadi komponen arsitektur resmi — termasuk AI Executive Summary widget di Dashboard | Bagian 6 (AI Executive Summary Widget) |

---

## 4. WIDGET CALCULATION REFERENCE

Bagian ini adalah inti dokumen: setiap widget yang sudah didefinisikan visualnya di 014 (DASH-01) dijelaskan di sini **bagaimana angkanya dihitung**.

### 4.1 Widget: Proyek Aktif (Count + Nilai Pipeline)

```sql
-- Pseudo-formula, scope WHERE disesuaikan per role (lihat Bagian 4.7)
COUNT(projects) WHERE status NOT IN ('selesai', 'cancelled')
SUM(projects.estimasi_nilai) WHERE status NOT IN ('selesai', 'cancelled')
```

**Business Rule BR-DASH-CALC-01:** "Aktif" didefinisikan sebagai seluruh status proyek **kecuali** `selesai` dan `cancelled` — merujuk pada daftar status resmi di 013_GLOBAL_STATE_MACHINE_REFERENCE (`created`, `submit_rks`, `review_department`, `lphs_sios`, `revision`, `submit_harga`, `pengumuman_pemenang`, `target_delivery`).

**Business Rule BR-DASH-CALC-02 (GAP-04):** Proyek berstatus `cancelled` **tidak pernah** dihitung sebagai aktif, terlepas dari kapan pembatalan terjadi dalam siklus hidup proyek. Ini secara eksplisit menutup GAP-04 untuk konteks dashboard — status `cancelled` yang baru ditambahkan ke state machine (038_PROJECT_CANCELLATION_MODULE) wajib dikecualikan dari seluruh widget yang menghitung "proyek aktif", bukan hanya widget ini.

### 4.2 Widget: Approval Pending (Preview)

Widget ini **tidak menghitung agregat baru** — ia memanggil endpoint yang sama dengan halaman Approval Inbox (`GET /api/approvals/pending`, didesain penuh di 039_APPROVAL_ENGINE_CORE) dengan parameter `limit=5`, diurutkan berdasarkan `waitingSince` ASC (item terlama di atas, selaras 014 DASH-01).

**Business Rule BR-DASH-CALC-03:** Dashboard tidak boleh memiliki logika query approval pending yang berbeda dari halaman Approval Inbox. Jika suatu item muncul di widget dashboard tapi tidak ada saat user membuka `/approvals`, ini dianggap bug konsistensi data, bukan varian fitur yang sah.

### 4.3 Widget: Approaching Deadline

```
WHERE projects.deadline_tender BETWEEN today() AND today() + 7 days
  AND projects.status NOT IN ('selesai', 'cancelled')
ORDER BY deadline_tender ASC
```

**Business Rule BR-DASH-CALC-04:** Kalkulasi "≤ 7 hari" memakai hari kalender, bukan hari kerja — berbeda dengan kalkulasi SLA approval (041_SLA_ESCALATION_ENGINE) yang memakai hari kerja. Alasan: `deadlineTender` adalah tanggal hard deadline dari pemberi tender (eksternal), bukan SLA internal yang bisa disesuaikan dengan kalender kerja.

### 4.4 Widget: Win Rate Bulan Ini

```
win_rate = COUNT(projects WHERE hasil_tender = 'menang' AND bulan(updated_at) = bulan_ini)
           / COUNT(projects WHERE hasil_tender IN ('menang','kalah') AND bulan(updated_at) = bulan_ini)
           × 100
```

**Business Rule BR-DASH-CALC-05:** Proyek yang belum memiliki `hasil_tender` (belum mencapai tahap Pemenang) tidak dihitung di pembilang maupun penyebut — win rate hanya dihitung dari populasi proyek yang sudah selesai diputuskan menang/kalah pada bulan tersebut. Pembanding "bulan lalu" (ditampilkan di 014 sebagai "perbandingan bulan lalu") memakai formula identik dengan rentang bulan sebelumnya.

### 4.5 Widget: Proyek At-Risk

Formula mengikuti definisi BR-DASH-04 yang sudah ditetapkan di 014 (SCREEN: DASH-01):

```
at_risk = projects WHERE
  (DATEDIFF(today(), status_changed_at) >= 5)
  OR (deadline_tender IS NOT NULL AND DATEDIFF(deadline_tender, today()) <= 3)
```

**Business Rule BR-DASH-CALC-06:** `status_changed_at` adalah timestamp terakhir kali kolom `status` pada `projects` berubah — bukan `updated_at` umum, karena `updated_at` bisa berubah akibat aksi lain (mis. update field harga) tanpa perubahan status. Kolom ini harus tersedia di skema `projects` (lihat 053/054_FULL_DATABASE_SCHEMA_DDL) sebagai prasyarat widget ini berfungsi akurat.

### 4.6 Widget: Pipeline Value Total

```
SUM(projects.estimasi_nilai) WHERE status NOT IN ('selesai', 'cancelled')
```

Identik dengan komponen nilai pada Widget Proyek Aktif (4.1), ditampilkan sebagai widget independen untuk Management/Admin karena nilainya secara bisnis lebih signifikan dipisah ketimbang digabung di satu card kecil — keputusan tampilan ini sudah final di 014, dirujuk di sini hanya untuk menegaskan sumber data identik (menghindari duplikasi logika kalkulasi).

### 4.7 Widget: Trend Win/Loss (6 Bulan)

```
FOR each bulan IN [bulan_ini - 5 .. bulan_ini]:
  menang = COUNT(projects WHERE hasil_tender='menang' AND bulan(updated_at)=bulan)
  kalah  = COUNT(projects WHERE hasil_tender='kalah'  AND bulan(updated_at)=bulan)
```

Output berupa array 6 titik data (selaras kebutuhan Recharts BarChart di 014). Bulan tanpa data sama sekali (menang=0 dan kalah=0) tetap disertakan dalam array sebagai titik nol — bukan dihilangkan — agar sumbu X chart tetap kontinu 6 bulan, konsisten dengan "EmptyState jika data < 2 bulan" pada 014 yang menyiratkan chart tetap dirender dengan rentang waktu konsisten.

### 4.8 Widget: Progress vs Target Bulan Ini

**Business Rule BR-DASH-CALC-07 (ketergantungan ke Modul Target & KPI):** Widget ini **tidak menghitung ulang** logika scoring — ia membaca hasil yang sudah dihitung oleh **045_PROGRESS_MONITORING_AND_SCORING** (snapshot periodik progress vs target) melalui kontrak data yang sama. Dashboard hanya menyajikan: KPI (Jumlah Tender, Nilai Pipeline, Win Rate), nilai realisasi, nilai target aktif (sesuai versioning target — lihat 044), persentase pencapaian, dan traffic light. Jika 045 belum mengembalikan data untuk periode berjalan (misalnya admin belum menetapkan target — lihat BR-DASH-01 turunan di 014), widget menampilkan placeholder sesuai BR-DASH-03 (014).

### 4.9 Widget: Proyek per Status (Donut Chart)

```
GROUP BY projects.status
COUNT(*) per status, WHERE scope role terpenuhi (Bagian 4.10)
```

Seluruh status (termasuk `cancelled`) **disertakan** pada widget ini — berbeda dari Widget Proyek Aktif (4.1) yang mengecualikan `cancelled`. Alasan: widget ini bertujuan memberi gambaran distribusi *seluruh* proyek termasuk yang sudah berhenti, bukan hanya yang aktif; mengecualikan `cancelled` di sini justru akan menyembunyikan informasi yang berguna bagi PM/Management untuk memahami tingkat pembatalan proyek.

### 4.10 Widget: User Aktif Hari Ini

```
COUNT(DISTINCT users.id) WHERE last_login_at >= start_of_today()
```

Hanya tersedia untuk Admin (sesuai matrix 014) karena bersifat metrik operasional sistem, bukan metrik bisnis tender.

### 4.11 Scope Data per Role (Berlaku untuk Seluruh Widget di Atas)

**Business Rule BR-DASH-CALC-08:** Setiap formula `WHERE` di atas **selalu** ditambah klausa scope sesuai role pemanggil, mengikuti aturan yang sama dengan 020_AUTHORIZATION_ENFORCEMENT_SPEC — bukan filter terpisah khusus dashboard:

| Role | Klausa Scope Tambahan |
|---|---|
| Cabang | `branch_id = current_user.branch_id` |
| PM | Tidak ada batasan branch — PM melihat seluruh cabang (selaras 014: "PM: semua") |
| Dept | `department_id = current_user.department_id` (hanya berlaku untuk widget Approval Pending) |
| Management | Tidak ada batasan branch/dept secara default — dapat dipersempit lewat filter granular (Bagian 5) |
| Admin | Tidak ada batasan |

---

## 5. FILTER GRANULAR (GAP-10)

### 5.1 Latar Belakang

GAP-10 secara spesifik menyasar keterbatasan Management: tanpa filter, Management hanya bisa melihat angka agregat seluruh perusahaan dan tidak bisa "drill-down ke performa unit tertentu" — laporan menjadi tidak actionable karena tidak bisa diisolasi per cabang/divisi/kategori/periode.

### 5.2 Dimensi Filter

| Filter | Berlaku untuk Role | Sumber Opsi |
|---|---|---|
| Cabang | Management, Admin | `GET /api/master/branches` (selaras 015_ORGANIZATION_HIERARCHY_MODULE) |
| Divisi | Management, Admin | `GET /api/master/divisions` |
| Kategori Proyek | Management, Admin, PM | `GET /api/master/project-categories` (MD-04, 021) |
| Periode | Management, Admin | `GET /api/master/periods` (MD-10, 025) — default: bulan berjalan |

**Business Rule BR-DASH-FILTER-01:** Filter Cabang dan Divisi bersifat hierarkis — memilih Divisi otomatis mempersempit opsi Cabang yang tersedia (hanya cabang di bawah divisi terpilih), selaras struktur organisasi 015. Memilih Cabang tanpa memilih Divisi tetap valid (Divisi diturunkan otomatis dari Cabang yang dipilih untuk keperluan agregasi).

**Business Rule BR-DASH-FILTER-02:** Role Cabang dan Dept **tidak** mendapat kontrol filter ini sama sekali — data mereka sudah otomatis terbatas oleh scope role (Bagian 4.11), menampilkan filter ini ke role tersebut hanya akan menyiratkan keberadaan pilihan yang sebenarnya tidak relevan/tidak berfungsi penuh untuk mereka.

**Business Rule BR-DASH-FILTER-03:** Filter dikirim sebagai query parameter tambahan pada endpoint `GET /api/dashboard/summary` yang sudah ada (014 menetapkan parameter `role` dan `branchId`; filter granular memperluas dengan `divisionId`, `categoryId`, `periodId`) — **bukan endpoint baru**. Filter yang tidak dipilih (default "Semua") tidak dikirim sebagai parameter, bukan dikirim sebagai string kosong, agar query backend dapat membedakan "tidak difilter" dari "difilter dengan nilai kosong yang invalid".

### 5.3 Perilaku UI Filter

Filter granular ditambahkan sebagai **FilterBar** di atas Grid Container widget (014 sudah mendefinisikan Grid Container; FilterBar adalah elemen baru yang ditambahkan tepat di atasnya untuk role Management/Admin). Mengubah filter memicu refetch seluruh widget secara serentak (bukan per-widget), karena seluruh widget berbagi satu query `dashboard/summary`.

---

## 6. AI EXECUTIVE SUMMARY WIDGET

### 6.1 Tujuan

Sesuai revisi v1.1 index, AI dinaikkan dari sekadar environment variable menjadi komponen arsitektur resmi. Widget ini, dikatalogkan sebagai salah satu fitur AI di **011_AI_FEATURES_AND_USE_CASES.md** ("Executive Dashboard Summary"), menghasilkan **ringkasan naratif singkat** dari data dashboard yang sedang ditampilkan — membantu Management memahami kondisi bisnis tanpa membaca seluruh widget satu per satu.

### 6.2 Posisi dalam Layout

Widget ini muncul sebagai card khusus di **bagian paling atas Grid Container**, sebelum widget numerik lainnya, hanya untuk role **Management** dan **Admin** (role yang juga memiliki Widget Progress vs Target dan Pipeline Value Total — widget ini secara konseptual adalah ringkasan dari data yang mereka lihat).

### 6.3 Kontrak ke AI Service Layer

**Business Rule BR-DASH-AI-01 (wajib, prinsip arsitektur lintas-dokumen):** Widget ini **tidak pernah** memanggil Gemini API secara langsung. Alur panggilan wajib:

```
Dashboard Widget (FE)
    → GET /api/dashboard/ai-summary?{filter params yang sama dengan Bagian 5}
        → Backend API
            → AI Service Layer (kontrak internal: summarize)
                → Provider Gemini (saat ini)
```

Kontrak ini identik dengan diagram resmi yang ditetapkan index (Frontend → Backend API → AI Service Layer → Gemini API) dan didesain teknis penuh di **010_AI_INTEGRATION_ARCHITECTURE.md** — dokumen ini hanya mendefinisikan *payload spesifik* yang relevan untuk dashboard.

### 6.4 Payload & Isi Ringkasan

Backend menyusun payload terstruktur (bukan mengirim data mentah seluruh database) ke AI Service Layer, berisi angka-angka yang **sudah dihitung** oleh Bagian 4 dokumen ini — AI Service Layer berfungsi sebagai penyusun narasi atas angka yang sudah ada, bukan sebagai penghitung angka itu sendiri:

```json
{
  "feature": "executive_dashboard_summary",
  "period": "2025-06",
  "scopeFilter": { "branchId": null, "divisionId": null, "categoryId": null },
  "metrics": {
    "proyekAktif": { "count": 42, "nilaiPipeline": 18500000000 },
    "winRateBulanIni": 38.5,
    "winRateBulanLalu": 34.2,
    "proyekAtRisk": 6,
    "progressVsTarget": [
      { "kpi": "Jumlah Tender", "realisasi": 12, "target": 15, "pct": 80 },
      { "kpi": "Win Rate", "realisasi": 38.5, "target": 35, "pct": 110 }
    ]
  }
}
```

**Business Rule BR-DASH-AI-02:** AI Service Layer hanya menerima agregat terstruktur seperti contoh di atas — **tidak pernah** diberi akses ke data mentah tingkat baris (nama customer, isi dokumen RKS, dst.) untuk widget ini. Ini membatasi *blast radius* jika terjadi kebocoran prompt dan selaras kebijakan keamanan AI yang didesain di 010.

### 6.5 Trigger & Caching

**Business Rule BR-DASH-AI-03:** Ringkasan AI **tidak** dihasilkan ulang setiap refresh dashboard (yang terjadi setiap 5 menit sesuai BR-DASH-02 di 014). Ringkasan di-cache di backend dengan `staleTime` 1 jam dan hanya dihasilkan ulang jika: (a) cache kedaluwarsa, atau (b) filter granular (Bagian 5) berubah ke kombinasi yang belum memiliki cache, atau (c) user menekan tombol "Refresh Ringkasan" manual pada widget. Ini mencegah pemanggilan AI berulang yang tidak perlu pada data yang belum banyak berubah, selaras prinsip cost control AI yang ditetapkan sebagai kebijakan terpusat oleh index.

### 6.6 Fallback Jika AI Gagal/Tidak Tersedia

**Business Rule BR-DASH-AI-04:** Dashboard **tidak pernah boleh gagal memuat secara keseluruhan** akibat AI Service Layer error, timeout, atau rate-limited. Widget AI Executive Summary menangani kegagalan secara terisolasi:

| Kondisi | Perilaku Widget |
|---|---|
| AI Service Layer timeout/error | Card menampilkan teks: "Ringkasan AI tidak tersedia saat ini." + tombol "Coba Lagi" — widget lain tetap berfungsi normal |
| AI Service Layer rate-limited | Card menampilkan: "Ringkasan AI mencapai batas penggunaan. Coba lagi nanti." |
| Belum ada data cukup (proyek aktif = 0) | Card menampilkan ringkasan statis non-AI: "Belum ada aktivitas proyek pada periode ini." (tidak memanggil AI sama sekali — menghindari biaya panggilan AI untuk kondisi yang tidak butuh narasi) |

### 6.7 Audit

Setiap pemanggilan widget ini ke AI Service Layer tercatat di audit log (selaras prinsip index: "Seluruh request AI tercatat di audit log") dengan payload `{ userId, feature: 'executive_dashboard_summary', success, timestamp }` — detail penuh mekanisme audit AI didesain di 010, dirujuk di sini sebagai konsumen.

---

## 7. API CONTRACT SUMMARY

| Method | Endpoint | Tujuan | Role |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Data seluruh widget numerik (Bagian 4), menerima filter granular (Bagian 5) | Semua (scope per role) |
| GET | `/api/dashboard/ai-summary` | Ringkasan naratif AI Executive Summary (Bagian 6) | Management, Admin |
| GET | `/api/approvals/pending?limit=5` | Data Widget Approval Pending — endpoint sama dengan Approval Inbox | PM, Dept, Management |

**Query Parameters — `GET /api/dashboard/summary`:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `role` | string | Ya | Menentukan widget mana yang relevan dikembalikan |
| `branchId` | UUID | Tidak | Filter granular (Management/Admin) atau scope otomatis (Cabang) |
| `divisionId` | UUID | Tidak | Filter granular (Management/Admin) |
| `categoryId` | UUID | Tidak | Filter granular |
| `periodId` | UUID | Tidak | Default: periode berjalan (025_MASTER_PERIOD_AND_HOLIDAY_CALENDAR) |

---

## 8. ACCEPTANCE CRITERIA

| # | Kriteria |
|---|---|
| AC-050-01 | Widget Proyek Aktif tidak pernah menghitung proyek berstatus `cancelled`, terlepas dari kombinasi filter yang dipilih |
| AC-050-02 | Item yang muncul di Widget Approval Pending dashboard selalu konsisten dengan isi halaman `/approvals` pada saat yang sama |
| AC-050-03 | Mengubah filter Divisi pada Management secara otomatis mempersempit opsi Cabang yang tersedia sesuai hierarki organisasi |
| AC-050-04 | Mengubah salah satu filter granular memicu refetch seluruh widget secara serentak melalui satu query `dashboard/summary` |
| AC-050-05 | Role Cabang dan Dept tidak melihat kontrol filter granular sama sekali di UI |
| AC-050-06 | Widget Trend Win/Loss menampilkan 6 titik data bulan kontinu meskipun beberapa bulan tidak memiliki transaksi menang/kalah |
| AC-050-07 | AI Executive Summary widget tidak menerima data mentah tingkat baris (nama customer, isi dokumen) — hanya agregat terstruktur |
| AC-050-08 | Kegagalan AI Service Layer (timeout/error/rate-limit) tidak menyebabkan widget lain di dashboard gagal memuat |
| AC-050-09 | Ringkasan AI tidak dipanggil ulang pada refresh otomatis 5 menit jika cache 1 jam belum kedaluwarsa dan filter tidak berubah |
| AC-050-10 | Widget Progress vs Target menampilkan placeholder sesuai BR-DASH-03 (014) jika belum ada target ditetapkan untuk periode berjalan, tanpa error |
| AC-050-11 | Setiap pemanggilan AI Executive Summary tercatat di audit log dengan status sukses/gagal |

---

*Dokumen ini adalah versi 1.0 dari 050 Dashboard Module untuk KINETIC CRM.*
*Cross-reference dengan dokumen: 014 (UI Screen Catalog — DASH-01), 043-045 (Target & KPI), 010-011 (AI Architecture & Features), 030 (CFG-08), 039 (Approval Engine Core), 057 (API Endpoint Specification).*

---
**Akhir Dokumen 050 — Dashboard Module**
**KINETIC CRM | Confidential / Internal | Versi 1.0 | Juni 2025**
