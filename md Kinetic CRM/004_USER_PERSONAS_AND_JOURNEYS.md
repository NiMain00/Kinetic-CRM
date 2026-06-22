# 004 — USER PERSONAS AND JOURNEYS
## KINETIC CRM — Persona Pengguna & Perjalanan Pengguna End-to-End

**Modul:** Overview & Governance
**Sumber Utama:** PRD §4 (User Personas), §6 (User Journey)
**Dependensi Dokumen:** 001, 002, 003
**Dirujuk Oleh:** 013 (Global State Machine Reference), 014 (UI Screen Catalog), seluruh modul bisnis (032-038)

---

## 1. TUJUAN DOKUMEN

Dokumen ini mendalami **siapa** pengguna KINETIC CRM, **apa** kebutuhan dan pain point mereka, dan **bagaimana** mereka bergerak melalui sistem dari awal hingga akhir suatu proses bisnis. Dokumen ini menjadi rujukan utama bagi UI/UX Designer dalam merancang alur layar, dan bagi BA dalam memvalidasi bahwa setiap kebutuhan persona terpenuhi oleh modul yang didesain.

---

## 2. PERSONA PENGGUNA

### 2.1 Persona: Staf Cabang (Role: `cabang`)

| Aspek | Detail |
|---|---|
| **Profil** | Staf operasional di kantor cabang yang bertanggung jawab menginput data prospek, mengisi data tender (RKS), melaporkan harga penawaran, kompetitor, dan hasil tender. |
| **Frekuensi Penggunaan** | Harian — pengguna paling aktif input data |
| **Tingkat Literasi Teknologi** | Sedang; antarmuka harus sederhana dan jelas tanpa jargon teknis |
| **Kebutuhan Utama** | Interface sederhana untuk input data, upload dokumen, dan tracking status proyek yang ditangani cabang tersebut |
| **Pain Point (As-Is)** | Sering menunggu approval tanpa informasi kapan dan mengapa ada revisi; tidak tahu urutan langkah berikutnya |
| **Ekspektasi terhadap KINETIC CRM** | Notifikasi real-time saat ada permintaan revisi atau approval selesai; visibilitas penuh terhadap posisi proyek dalam alur (Stepper) |
| **Modul yang Paling Sering Diakses** | Prospect Management (032), Project Core (033), RKS (034), Harga & Kompetitor (036), Pemenang & Delivery (037), In-App Notification (046) |
| **Scope Data** | Hanya melihat dan mengedit data milik cabangnya sendiri (enforced di 020 Authorization Enforcement Spec) |

### 2.2 Persona: Project Manager — PM (Role: `pm`)

| Aspek | Detail |
|---|---|
| **Profil** | Bertanggung jawab mengawasi kualitas dokumen RKS, memastikan pertanyaan teknis terjawab, memberikan persetujuan sebelum eskalasi ke departemen/management, dan mengoordinasikan proses LPHS lintas departemen. |
| **Frekuensi Penggunaan** | Harian — peran approval inti |
| **Tingkat Literasi Teknologi** | Sedang-tinggi |
| **Kebutuhan Utama** | Kemampuan mereview dan memberikan catatan revisi terstruktur; melihat semua proyek yang perlu approval-nya dalam satu antrean |
| **Pain Point (As-Is)** | Tidak ada antrean pekerjaan yang jelas; PM harus mengingat sendiri atau dicari oleh cabang untuk diminta approve |
| **Ekspektasi terhadap KINETIC CRM** | Dashboard antrean approval terpusat (Approval Inbox); notifikasi push/in-app saat ada item pending; indikator SLA agar tahu mana yang mendesak |
| **Modul yang Paling Sering Diakses** | Approval Engine (039), Approval Inbox (bagian dari 014 UI Screen Catalog), RKS (034), LPHS/SIOS (035), Backup Approver (042) |
| **Risiko Khusus** | Diidentifikasi sebagai *single point of failure* (BP01) — mitigasi melalui backup approver dan reassignment (042) |

### 2.3 Persona: Staf Departemen (Role: `department`)

| Aspek | Detail |
|---|---|
| **Profil** | Spesialis teknis per departemen (misal: Engineering, Legal, Finance) yang mereview aspek LPHS/SIOS sesuai bidangnya. |
| **Frekuensi Penggunaan** | Sesuai kebutuhan — saat ada item LPHS yang membutuhkan review departemennya |
| **Tingkat Literasi Teknologi** | Sedang |
| **Kebutuhan Utama** | Akses hanya ke proyek yang relevan dengan departemennya; kemampuan approve/revisi dengan catatan |
| **Pain Point (As-Is)** | Tidak tahu apakah dokumen sudah final atau masih draft saat diminta review |
| **Ekspektasi terhadap KINETIC CRM** | Versi dokumen yang jelas (Document Versioning — 049), riwayat perubahan, dan status dokumen yang tidak ambigu |
| **Modul yang Paling Sering Diakses** | LPHS/SIOS Module (035), Document Versioning (049), In-App Notification (046) |
| **Kapabilitas Baru (vs STMS v1.0)** | Dapat memulai review **paralel** dengan PM (GAP08), tidak perlu menunggu PM approve dulu sebelum mulai membaca dokumen |

### 2.4 Persona: Management (Role: `management`)

| Aspek | Detail |
|---|---|
| **Profil** | Pimpinan yang memberikan persetujuan akhir pada LPHS/SIOS setelah semua departemen setuju; juga konsumen utama dashboard performa dan KPI. |
| **Frekuensi Penggunaan** | Beberapa kali per minggu untuk approval; harian/mingguan untuk monitoring dashboard |
| **Tingkat Literasi Teknologi** | Variatif — UI harus ringkas dan ramah eksekutif |
| **Kebutuhan Utama** | Ringkasan eksekutif proyek, status approval semua departemen dalam satu tampilan, kemampuan approve/revisi dengan satu tindakan |
| **Pain Point (As-Is)** | Harus mengumpulkan informasi dari berbagai sumber sebelum membuat keputusan |
| **Ekspektasi terhadap KINETIC CRM** | One-page summary per proyek dengan semua status approval terkumpul; dashboard dengan filter granular per cabang/divisi/periode (GAP10); **AI Executive Summary** untuk meringkas kondisi pipeline secara naratif |
| **Modul yang Paling Sering Diakses** | Dashboard Module (050), Reporting Module (051), Target & KPI Module (043-045), AI Features (011) |

### 2.5 Persona: Administrator (Role: `admin`)

| Aspek | Detail |
|---|---|
| **Profil** | IT/Admin yang mengelola master data (users, customers, departments, pertanyaan), konfigurasi sistem, dan troubleshooting. |
| **Frekuensi Penggunaan** | Harian (operasional) dan insidental (konfigurasi) |
| **Tingkat Literasi Teknologi** | Tinggi |
| **Kebutuhan Utama** | CRUD master data, manajemen user dan role, akses audit log, monitoring sistem |
| **Pain Point (As-Is)** | Tidak ada antarmuka admin yang terpusat |
| **Ekspektasi terhadap KINETIC CRM** | Admin panel lengkap dengan kemampuan reassign approval untuk debugging/penyelesaian masalah operasional |
| **Modul yang Paling Sering Diakses** | Seluruh Modul Configuration (027-031), User Management (018), Role & Permission (017), Audit Trail (052), seluruh Master Data (021-026) |

### 2.6 Persona Tambahan: Direktur Regional *(Inferred — contoh perluasan role)*

| Aspek | Detail |
|---|---|
| **Profil** | Role baru yang dicontohkan BA Review sebagai validasi bahwa sistem RBAC harus dapat menambah role tanpa coding. |
| **Alasan Dimasukkan** | BA Review CFG-04 secara eksplisit menyebut "direktur regional" sebagai contoh role baru yang harus bisa ditambah tanpa coding — dimasukkan sebagai persona untuk memvalidasi desain Role & Permission Module (017) benar-benar generik |
| **Kebutuhan Hipotetis** | Approval scope lintas-cabang dalam satu region, di bawah Management tapi di atas PM dalam hierarki approval |
| **Modul Validasi** | Role & Permission Module (017), Organization Hierarchy Module (015) |

---

## 3. USER JOURNEY — PROSPEK MENJADI PROYEK

Sumber: PRD §6.1, divalidasi dan diperkaya dengan detail status dari BA Review.

```
[Cabang]                [Sistem]                      [PM]
   |                        |                            |
   | 1. Buat Prospek         |                            |
   |  (nama, customer,       |                            |
   |   deskripsi, checklist) |                            |
   |----------------------->|                            |
   |                        | Status: prospecting (draft) |
   |                        |                            |
   | 2. Submit ke PM         |                            |
   |----------------------->|                            |
   |                        | Status: waiting_pm_approval |
   |                        |---- Notifikasi in-app ----->|
   |                        |                            |
   |                        |          3. PM Review        |
   |                        |<---------------------------|
   |                        |                            |
   |                        |   4a. PM Approve            |
   |                        |<---------------------------|
   |                        | Status: approved             |
   |<--- Notifikasi --------|                            |
   | 5a. Cabang dapat        |                            |
   |  membuat Proyek dari    |                            |
   |  prospek ini             |                            |
   |                        |                            |
   |                  ATAU                                |
   |                        |   4b. PM Revision            |
   |                        |   (isi pertanyaan review)    |
   |                        |<---------------------------|
   |                        | Status: revision             |
   |<--- Notifikasi --------|                            |
   | 5b. Cabang menjawab      |                            |
   |  pertanyaan revisi       |                            |
   |----------------------->|                            |
   |                        | Status: waiting_pm_approval |
   |                        | (kembali ke langkah 3)       |
```

### 3.1 Detail Langkah dengan Validasi & Business Rule

| Langkah | Aktor | Aksi | Validasi/Business Rule | Modul Terkait |
|---|---|---|---|---|
| 1 | Cabang | Mengisi form prospek: nama, customer (dari master), deskripsi, checklist pertanyaan | Nama: required 3-200 karakter; Customer: required FK valid; Pertanyaan required harus diisi sebelum submit (boleh kosong jika hanya simpan draft) | 032 |
| 2 | Cabang | Klik "Submit ke PM" | Seluruh pertanyaan bertipe required harus terisi; jika tidak, submit diblokir dengan validasi error per field | 032 |
| 3 | PM | Membuka daftar prospek pending, mereview | PM dapat melihat seluruh prospek dari seluruh cabang (tidak ada scope restriction untuk role PM) | 032, 039 |
| 4a | PM | Approve | Status berubah `approved`; timeline event dibuat; notifikasi ke cabang pembuat | 032, 039, 046 |
| 4b | PM | Kirim Revisi (isi pertanyaan review) | Wajib minimal 1 pertanyaan review diisi | 032, 040 |
| 5a | Cabang | Klik "Buat Proyek" dari prospek approved | Proyek baru dibuat dengan `prospect_id` mengacu ke prospek asal; data prospek (customer, deskripsi) diwariskan sebagai referensi awal | 032, 033 |
| 5b | Cabang | Menjawab pertanyaan revisi, re-submit | Status kembali ke `waiting_pm_approval`; siklus 3-4 dapat berulang | 032 |

---

## 4. USER JOURNEY — ALUR TENDER LENGKAP (created → selesai)

Sumber: PRD §6.2, BA Review §B.4 (dengan perbaikan parallelisasi GAP08).

```
created
   │ (Cabang submit RKS)
   ▼
submit_rks ──────────────┐
   │ (PM approve,          │ (PM kirim revisi)
   │  semua pertanyaan      ▼
   │  review terjawab)   revision
   │                        │ (Cabang re-submit)
   │◄───────────────────────┘
   ▼
review_department  [PARALEL: Dept mulai review dokumen
   │                 begitu RKS approved; approval Dept
   │                 terkunci sampai langkah berikut]
   ▼
lphs_sios ────────────────┐
   │ (Semua Dept +          │ (PM atau Management kirim
   │  Management approve)   │  revisi — dapat ditarget ke
   │                        │  Dept spesifik, GAP08/BP03)
   │                        ▼
   │                     revision
   │                        │ (Cabang re-submit,
   │                        │  hanya Dept terkait
   │                        │  yang approve ulang)
   │◄───────────────────────┘
   ▼
submit_harga
   │ (Cabang isi harga & kompetitor)
   ▼
pengumuman_pemenang
   │ (Cabang input menang/kalah + dokumen pendukung)
   ▼
target_delivery
   │ (Cabang isi tanggal mulai/selesai delivery)
   ▼
selesai

[Dari status manapun sebelum 'selesai', PM atau Admin
 dapat memicu transisi ke 'cancelled' dengan alasan wajib]
```

### 4.1 Tabel Aktor per Tahap

| Tahap | Aktor Utama | Aktor Pendukung | SLA Berlaku |
|---|---|---|---|
| `created` → `submit_rks` | Cabang | — | Tidak ada (input awal) |
| `submit_rks` → `review_department` | PM (approve) | Cabang (jika revisi) | Ya — SLA Review RKS |
| `review_department` → `lphs_sios` | Departemen-departemen terpilih | PM (mengawasi) | Ya — SLA per Departemen |
| `lphs_sios` → `submit_harga` | Management (approval final) | PM, Departemen (approval berurutan/paralel) | Ya — SLA Management |
| `submit_harga` → `pengumuman_pemenang` | Cabang | — | Tidak ada (input data) |
| `pengumuman_pemenang` → `target_delivery` | Cabang | — | Tidak ada |
| `target_delivery` → `selesai` | Cabang | — | Tidak ada |
| Manapun → `cancelled` | PM atau Admin | — | Tidak ada |

---

## 5. USER JOURNEY — NON-TENDER (PROSPECTING)

Sumber: PRD §6.3, dengan penambahan opsional review (rekomendasi BA Review D.4).

```
created (type: prospecting)
   │
   │ [OPSIONAL — Inferred dari rekomendasi BA Review D.4:
   │  jika nilai estimasi proyek > threshold yang
   │  dikonfigurasi, PM diminta approval sebelum lanjut.
   │  Alasan: BP05 — tidak ada quality gate sama sekali
   │  pada alur asli, berisiko penawaran tidak terkoordinasi
   │  untuk proyek bernilai besar]
   ▼
submit_harga
   │ (Cabang isi harga & kompetitor)
   ▼
pengumuman_pemenang
   │ (Cabang input menang/kalah)
   ▼
target_delivery
   │
   ▼
selesai
```

> Tahap RKS, review departemen, dan LPHS/SIOS **tidak berlaku** untuk tipe proyek `prospecting` — baik di UI (tab disembunyikan) maupun di backend (endpoint terkait menolak request untuk proyek bertipe ini).

---

## 6. PETA INTERAKSI PERSONA × MODUL (RINGKASAN)

| Modul | Cabang | PM | Departemen | Management | Admin |
|---|---|---|---|---|---|
| Prospect Management (032) | CRUD scope sendiri | Review semua | — | — | Full akses |
| Project Core (033) | CRUD scope sendiri | Lihat semua | Lihat relevan | Lihat semua | Full akses |
| RKS (034) | Input/edit | Review/approve | — | — | Full akses |
| LPHS/SIOS (035) | Upload draft | Review/approve | Review/approve (scope dept) | Approval final | Full akses |
| Target & KPI (043-045) | Lihat target cabang sendiri | — | — | Set target, lihat semua | Set target, full akses |
| Dashboard (050) | Widget scope cabang | Widget antrean approval | Widget scope dept | Widget eksekutif + filter | Widget sistem |
| Configuration (027-031) | — | — | — | — | Full akses (eksklusif admin) |
| Audit Trail (052) | — | — | — | — | Lihat & export |

---

## 7. KESIMPULAN

Lima persona inti (Cabang, PM, Departemen, Management, Admin) dan satu persona validasi perluasan (Direktur Regional) tervalidasi memiliki jalur penggunaan (user journey) yang lengkap dan tidak ada celah interaksi yang hilang dari ketiga dokumen sumber. Journey Prospek→Proyek, Tender end-to-end, dan Non-Tender seluruhnya telah diperkaya dengan detail validasi, business rule, dan perbaikan desain (parallelisasi, opsional review) sesuai rekomendasi BA Review.
