# 051 — REPORTING MODULE
## KINETIC CRM — Modul Laporan

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 051 |
| **Nama Dokumen** | Reporting Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0, 014_UI_SCREEN_CATALOG.md |
| **Dokumen Terkait** | 014 (UI Screen Catalog — REPT-01, REPT-02), 043-045 (Target & KPI), 050 (Dashboard Module), 037 (Pemenang Delivery Module), 026 (Master Loss Reason), 057 (API Endpoint Specification) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Backend Developer, Frontend Developer, Business Analyst, QA Engineer, Management (sebagai konsumen akhir laporan)

---

## 1. PURPOSE

Modul ini mendesain penuh **GAP-11 (Major)**: BA Review menemukan bahwa pada PRD lama, "tidak ada laporan periodik yang bisa diekspor (Excel/PDF)" — akibatnya laporan ke direksi harus dibuat manual dari data sistem, menimbulkan double work dan rawan error.

Tiga jenis laporan didesain di modul ini, sesuai penetapan index:

1. **Laporan Win/Loss** — rekap kemenangan/kekalahan tender per periode, sudah memiliki tampilan layar lengkap di 014 (`REPT-01`).
2. **Laporan Pipeline** — visualisasi funnel proyek aktif per tahap, sudah memiliki tampilan layar lengkap di 014 (`REPT-02`).
3. **Laporan Progress vs Target** — perbandingan realisasi terhadap target KPI per unit organisasi per periode. **Belum memiliki entri layar di 014** karena merupakan turunan langsung dari Modul Target & KPI (043-045) yang baru selesai didesain penuh setelah 014 dibuat. Dokumen ini mendesain layar tersebut secara lengkap mengikuti format dan konvensi yang identik dengan `REPT-01`/`REPT-02`.

Untuk dua laporan yang sudah punya entri di 014, dokumen ini **tidak mengulang** layout/komponen UI — hanya menambahkan detail yang belum tercakup di sana: **formula kalkulasi lengkap, mekanisme export Excel/PDF, dan struktur file hasil export**.

---

## 2. SCOPE

### In Scope

- Formula kalkulasi lengkap untuk ketiga jenis laporan
- Desain layar penuh untuk Laporan Progress vs Target (belum ada di 014)
- Mekanisme export: alur teknis, format file, struktur kolom Excel, layout PDF
- Business rules lintas-laporan (periode, status yang disertakan/dikecualikan)
- API contract untuk data laporan dan export

### Out of Scope

- Layout/komponen UI Laporan Win/Loss dan Pipeline → **014_UI_SCREEN_CATALOG.md** (REPT-01, REPT-02) — dirujuk, tidak diulang
- Definisi Target, Bobot, dan formula skor komposit KPI → **043_TARGET_KPI_DATA_MODEL_AND_BUSINESS_RULES.md**
- Kalkulasi widget Dashboard (meskipun mirip secara konsep) → **050_DASHBOARD_MODULE.md** — laporan ini adalah versi mendalam/historis, dashboard adalah versi ringkas/real-time

---

## 3. GAP TRACEABILITY

| Referensi | Deskripsi | Bagaimana Diselesaikan |
|---|---|---|
| **GAP-11 (Major)** | Tidak ada laporan periodik yang bisa diekspor (Excel/PDF); laporan ke direksi manual, rawan error | Bagian 6 (Export Mechanism) — seluruh laporan mendukung export Excel & PDF dengan filter yang dipertahankan |
| **GAP-12 (Minor)** | Tidak ada field "alasan kekalahan" terstruktur | Sudah diselesaikan di 026/037; dikonsumsi sebagai kolom `Alasan Kekalahan` pada Laporan Win/Loss (Bagian 4.1) |
| **R-07 (Rekomendasi Final BA Review)** | Modul Target & KPI sebagai deliverable dengan scope jelas | Laporan Progress vs Target (Bagian 5) adalah salah satu hasil akhir dari investasi tersebut |

---

## 4. LAPORAN WIN/LOSS — DETAIL KALKULASI

Layar (`REPT-01`) sudah final di 014; bagian ini hanya merinci formula yang menjadi dasar Summary Cards, BarChart, dan kolom DataTable yang sudah ditetapkan di sana.

### 4.1 Populasi Data

**Business Rule BR-RPT-01 (selaras BR-REPT-01 & BR-REPT-04 di 014):** Laporan ini hanya menyertakan proyek dengan `hasil_tender IN ('menang', 'kalah')` — proyek yang masih berjalan atau proyek `cancelled` tanpa hasil tender final tidak masuk hitungan laporan ini sama sekali (berbeda dari Widget Proyek per Status di Dashboard yang menyertakan semua status).

### 4.2 Formula Summary Cards

```
totalProyek = COUNT(projects WHERE hasil_tender IN ('menang','kalah') AND periode_filter)
menang      = COUNT(projects WHERE hasil_tender = 'menang' AND periode_filter)
kalah       = COUNT(projects WHERE hasil_tender = 'kalah' AND periode_filter)
winRate     = (menang / totalProyek) × 100   -- selaras BR-REPT-02 di 014
```

Filter `periode_filter` merepresentasikan kombinasi seluruh FilterBar yang sudah ditetapkan di 014 (rentang tanggal, cabang multi-select, kategori, tipe).

### 4.3 Formula BarChart Bulanan

Identik secara konsep dengan Widget Trend Win/Loss Dashboard (050 Bagian 4.7), namun rentang waktu mengikuti filter periode yang dipilih user di laporan ini (bisa lebih dari 6 bulan), bukan selalu 6 bulan terakhir tetap seperti di dashboard.

### 4.4 Kolom DataTable Detail

| Kolom | Sumber | Catatan |
|---|---|---|
| Nama Proyek | `projects.name` | — |
| Customer | `customers.name` (join) | — |
| Nilai Kontrak/Estimasi | `projects.nilai_kontrak` jika menang, else `projects.estimasi_nilai` | Menang memakai nilai kontrak aktual (037_PEMENANG_DELIVERY_MODULE), kalah memakai estimasi karena nilai kontrak final tidak pernah ada |
| Hasil | `projects.hasil_tender` | Badge Menang/Kalah |
| Kompetitor Pemenang | `competitors.name` (join via `project_competitors`, filter `is_winner = true`) | Hanya terisi jika hasil = kalah dan kompetitor pemenang diketahui (023_MASTER_COMPETITOR_MODULE); kosong jika tidak diketahui |
| Alasan Kekalahan | `loss_reasons.name` (join, GAP-12) | Hanya terisi jika hasil = kalah; kosong jika hasil = menang |
| Tgl Pengumuman | `projects.pengumuman_pemenang_at` | — |

---

## 5. LAPORAN PROGRESS VS TARGET — DESAIN PENUH

Laporan ini **belum memiliki entri di 014** dan didesain lengkap di sini, mengikuti konvensi visual dan struktural yang identik dengan `REPT-01`/`REPT-02` agar tidak menimbulkan inkonsistensi pengalaman pengguna antar laporan.

### 5.1 Identitas Layar

| Atribut | Nilai |
|---|---|
| Screen ID (usulan, selaras konvensi 014) | REPT-03 |
| Screen Name | Laporan Progress vs Target |
| Business Purpose | Menyajikan perbandingan realisasi KPI terhadap target yang ditetapkan (043-045) per unit organisasi per periode, dengan histori antar periode untuk melihat tren pencapaian dari waktu ke waktu |
| User Roles | Management, Admin |
| Route | `/reports/progress` |
| Navigation Entry Point | Submenu di bawah "Laporan" di sidebar, sejajar dengan Pipeline (selaras pola navigasi REPT-02) |

### 5.2 Komponen

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | "Laporan Progress vs Target", tombol "Export Excel" + "Export PDF" |
| FilterBar | Molecule | Periode (wajib pilih satu periode — bukan rentang), Cabang/Divisi, KPI (multi-select dari Master KPI) |
| Summary Cards | DashboardCard | Skor Komposit Rata-Rata, Jumlah Unit Mencapai Target (≥90%), Jumlah Unit Di Bawah Target (<60%) |
| Tabel Realisasi vs Target | DataTable | Baris = unit organisasi; kolom = setiap KPI terpilih (realisasi, target, %, traffic light) + Skor Komposit |
| Grafik Tren Skor Komposit | Recharts LineChart | Skor komposit unit terpilih lintas periode (jika lebih dari 1 periode tersedia secara historis) |

**Kolom Tabel Realisasi vs Target (contoh untuk 1 unit organisasi):**

| Unit | Jumlah Tender (Realisasi/Target) | % | Nilai Pipeline (Realisasi/Target) | % | Win Rate (Realisasi/Target) | % | Skor Komposit |
|---|---|---|---|---|---|---|---|
| Cabang Jakarta | 12 / 15 | 80% | Rp 4.2M / Rp 5M | 84% | 38.5% / 35% | 110% | 87.5 (Hijau) |

### 5.3 Formula

**Business Rule BR-RPT-02:** Laporan ini **tidak menghitung ulang** skor — ia membaca langsung hasil snapshot yang sudah dihitung dan disimpan oleh **045_PROGRESS_MONITORING_AND_SCORING** untuk periode yang dipilih. Ini memastikan angka yang dilihat Management di laporan historis selalu identik dengan angka yang pernah ditampilkan di Dashboard pada periode tersebut (single source of truth, tidak ada dua jalur kalkulasi independen untuk metrik yang sama).

**Business Rule BR-RPT-03:** Karena target bersifat versioned (044_TARGET_SETTING_WORKFLOW — target baru = insert record baru dengan `effective_date`/`expired_date`, bukan overwrite), laporan untuk periode lampau selalu menggunakan target yang **aktif pada periode tersebut**, bukan target yang berlaku saat ini. Ini krusial agar laporan historis tidak berubah retroaktif hanya karena admin mengubah target bulan berjalan.

**Business Rule BR-RPT-04:** Traffic light dan ambang batas (merah <60%, kuning 60-89%, hijau ≥90%) memakai ambang yang identik dengan yang sudah ditetapkan untuk Dashboard (050 Bagian 4.8) — tidak ada ambang batas berbeda antara laporan dan dashboard untuk metrik yang sama.

### 5.4 Empty State & Error State

Mengikuti pola identik dengan `REPT-01`/`REPT-02` di 014 (skeleton shimmer saat loading, pesan "Belum ada target ditetapkan untuk periode ini" jika data target tidak tersedia — selaras BR-DASH-03).

### 5.5 Responsive Behavior

Mengikuti pola identik 014: tabel horizontal scroll di mobile, chart responsive container, summary card 2×2 di mobile.

### 5.6 Related GAP/CFG/MD Reference

GAP-01 (Target & KPI), R-07 (Rekomendasi Final BA Review), CFG-07 (Target & Bobot KPI).

---

## 6. EXPORT MECHANISM

Mekanisme berikut berlaku **seragam** untuk ketiga laporan (Win/Loss, Pipeline, Progress vs Target) — satu implementasi generik, bukan tiga implementasi export berbeda.

### 6.1 Alur Export

```
1. User klik "Export Excel" atau "Export PDF" dengan filter aktif tertentu
2. FE tampilkan toast "Menyiapkan laporan..." (non-blocking, selaras 014 Loading State)
3. FE POST /api/reports/{jenis}/export?format={excel|pdf}
   payload: seluruh filter aktif yang sama dengan query tampilan (BR-RPT-05)
4. BE generate file:
   - Excel: data tabel detail penuh (tidak dipotong pagination), 1 sheet ringkasan + 1 sheet detail
   - PDF: layout cetak mencakup summary cards, chart (di-render sebagai gambar statis), dan tabel detail
5. BE simpan file sementara / stream langsung sebagai response (lihat catatan keamanan Bagian 6.4)
6. FE terima file (blob) → trigger browser download otomatis
7. FE ganti toast jadi "Unduhan siap" lalu auto-dismiss (selaras 014 Loading State export)
8. BE tulis audit log: REPORT_EXPORTED (jenis laporan, format, filter, user, timestamp)
```

**Business Rule BR-RPT-05 (selaras BR-REPT-03 di 014):** Export selalu mempertahankan **seluruh** filter yang sedang aktif di layar saat tombol export ditekan — tidak ada dialog konfigurasi filter terpisah untuk export. Apa yang dilihat user di layar adalah persis apa yang akan ada di file hasil export (prinsip WYSIWYG export).

### 6.2 Struktur File Excel

| Sheet | Isi |
|---|---|
| `Ringkasan` | Summary cards dalam format tabel sederhana + metadata filter yang digunakan (periode, cabang, kategori) + timestamp generate |
| `Detail` | Seluruh baris DataTable detail laporan, tanpa pagination (semua baris yang cocok filter) |

**Business Rule BR-RPT-06:** Kolom pada sheet `Detail` Excel **identik urutan dan label** dengan kolom DataTable yang tampil di UI (Bagian 4.4 untuk Win/Loss, kolom funnel detail untuk Pipeline, kolom Bagian 5.2 untuk Progress vs Target) — tidak ada kolom tersembunyi tambahan atau kolom yang dihilangkan, untuk menjaga laporan yang diunduh dapat dipercaya sebagai representasi persis dari yang dilihat di sistem.

### 6.3 Struktur File PDF

PDF berorientasi presentasi (untuk dilampirkan ke laporan direksi), bukan replika 1:1 tabel mentah:

```
Header: Logo perusahaan + Judul Laporan + Periode + Filter Aktif (ringkas)
Section 1: Summary Cards (grid sederhana)
Section 2: Chart (di-render sebagai gambar PNG statis, bukan interaktif)
Section 3: Tabel Detail (paginated otomatis per halaman PDF jika data panjang)
Footer: Tanggal generate + "Dihasilkan oleh KINETIC CRM" per halaman
```

### 6.4 Keamanan Export

**Business Rule BR-RPT-07:** Endpoint export tunduk pada aturan otorisasi dan scope yang identik dengan endpoint tampilan data laporan (`GET /api/reports/*`) — seorang Management yang scope-nya dibatasi (jika suatu saat scope dipersempit oleh admin) tidak bisa memperoleh data lebih luas lewat export dibanding yang ia lihat di layar. File hasil export di-stream langsung sebagai response (mengikuti prinsip download terautentikasi yang sama dengan 048_DOCUMENT_UPLOAD_STORAGE_MODULE Bagian 8.1) — tidak disimpan sebagai file statis yang dapat diakses ulang lewat URL tertebak.

### 6.5 Batas Ukuran Data Export

**Business Rule BR-RPT-08:** Jika hasil filter menghasilkan lebih dari 10.000 baris pada sheet `Detail`, sistem tetap memproses export sepenuhnya (tidak memotong data) namun menampilkan peringatan non-blocking ke user sebelum generate dimulai: "Laporan ini berisi data besar dan mungkin memerlukan waktu lebih lama." Ini adalah **Inferred Requirement (IR-051-01)** — BA Review dan PRD tidak menyebutkan ambang batas spesifik; angka 10.000 dipilih sebagai batas wajar berdasarkan praktik umum performa Excel generation di backend dan untuk mencegah pengalaman pengguna yang membingungkan (toast "menyiapkan laporan" yang tidak kunjung selesai tanpa indikasi).

---

## 7. API CONTRACT SUMMARY

| Method | Endpoint | Tujuan | Role |
|---|---|---|---|
| GET | `/api/reports/win-loss` | Data Laporan Win/Loss (selaras 014 REPT-01) | Management, Admin |
| GET | `/api/reports/pipeline` | Data Laporan Pipeline (selaras 014 REPT-02) | Management, Admin |
| GET | `/api/reports/progress` | Data Laporan Progress vs Target (Bagian 5) | Management, Admin |
| POST | `/api/reports/win-loss/export` | Export Laporan Win/Loss | Management, Admin |
| POST | `/api/reports/pipeline/export` | Export Laporan Pipeline | Management, Admin |
| POST | `/api/reports/progress/export` | Export Laporan Progress vs Target | Management, Admin |

**Query Parameters — `GET /api/reports/progress`:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `periodId` | UUID | Ya | Satu periode spesifik (bukan rentang) |
| `branchId` / `divisionId` | UUID | Tidak | Filter unit organisasi |
| `kpiIds` | UUID[] | Tidak | Default: semua KPI aktif |

**Request Body — `POST /api/reports/{jenis}/export`:**

```json
{
  "format": "excel",
  "filters": {
    "periodId": "uuid",
    "branchId": null,
    "categoryId": null
  }
}
```

---

## 8. ACCEPTANCE CRITERIA

| # | Kriteria |
|---|---|
| AC-051-01 | Laporan Win/Loss hanya menampilkan proyek dengan `hasil_tender` terisi (menang/kalah); proyek berjalan tidak muncul |
| AC-051-02 | Kolom "Alasan Kekalahan" pada Laporan Win/Loss kosong untuk baris dengan hasil "Menang" |
| AC-051-03 | Laporan Progress vs Target untuk periode lampau menggunakan target yang aktif pada periode tersebut, bukan target terkini, meskipun target sudah diubah admin setelahnya |
| AC-051-04 | Traffic light pada Laporan Progress vs Target memakai ambang batas identik dengan Dashboard (merah <60%, kuning 60-89%, hijau ≥90%) |
| AC-051-05 | Export Excel maupun PDF selalu mencerminkan filter yang aktif di layar pada saat tombol export ditekan |
| AC-051-06 | Kolom pada sheet Excel "Detail" identik urutan dan jumlahnya dengan kolom DataTable yang tampil di UI |
| AC-051-07 | User dengan scope terbatas tidak dapat memperoleh data di luar scope-nya melalui endpoint export, meskipun memodifikasi parameter filter secara manual |
| AC-051-08 | Setiap export berhasil tercatat di audit log dengan jenis laporan, format, dan filter yang digunakan |
| AC-051-09 | Export dengan hasil data >10.000 baris tetap berhasil generate penuh, didahului peringatan non-blocking ke user |
| AC-051-10 | Data Laporan Progress vs Target identik dengan data yang pernah ditampilkan Dashboard pada periode yang sama (tidak ada dua jalur kalkulasi berbeda) |

---

*Dokumen ini adalah versi 1.0 dari 051 Reporting Module untuk KINETIC CRM.*
*Cross-reference dengan dokumen: 014 (UI Screen Catalog — REPT-01, REPT-02), 043-045 (Target & KPI), 050 (Dashboard Module), 037 (Pemenang Delivery Module), 026 (Master Loss Reason), 057 (API Endpoint Specification).*

---
**Akhir Dokumen 051 — Reporting Module**
**KINETIC CRM | Confidential / Internal | Versi 1.0 | Juni 2025**
