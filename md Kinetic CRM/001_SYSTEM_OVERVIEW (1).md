# 001 — SYSTEM OVERVIEW
## KINETIC CRM — Sales & Tender Management Platform

**Modul:** Overview & Governance
**Sumber Utama:** PRD §1-3, BA Review §A (Executive Summary)
**Dependensi Dokumen:** Tidak ada (dokumen dasar)
**Dirujuk Oleh:** Seluruh dokumen lain

---

## 1. TUJUAN DOKUMEN

Dokumen ini adalah titik masuk pemahaman sistem KINETIC CRM. Setiap pembaca baru — baik Business Analyst, System Analyst, UI/UX Designer, Frontend Developer, Backend Developer, Database Engineer, QA, maupun Project Manager — harus dapat memahami **apa sistem ini, mengapa dibangun, untuk siapa, dan seberapa luas cakupannya** hanya dari dokumen ini, sebelum membaca dokumen modul yang lebih detail.

---

## 2. DEFINISI PRODUK

**KINETIC CRM** adalah platform manajemen internal berbasis web yang mengotomasi dan menstandardisasi seluruh proses bisnis perusahaan dari **identifikasi prospek penjualan** hingga **penyelesaian proyek tender**, termasuk siklus penuh: prospecting → RKS (Rencana Kerja dan Syarat) → LPHS/SIOS (Laporan Hasil Survei/Surat Izin Operasi Survei) → penawaran harga → pengumuman pemenang → delivery.

Sistem ini menggantikan proses manual yang sebelumnya tersebar di berbagai media (email, spreadsheet, dokumen fisik, chat informal) menjadi satu alur digital yang **terintegrasi, terotomasi, dapat dikonfigurasi, dan dapat diaudit penuh**.

KINETIC CRM dibangun sebagai sistem CRM enterprise dengan tambahan kapabilitas **AI generatif (Gemini)** sebagai komponen arsitektur resmi untuk membantu ringkasan dokumen, analisis prospek, analisis kompetitor, dan insight KPI — bukan sekadar fitur tempelan, melainkan layer arsitektur yang dirancang dapat berganti provider di masa depan.

### 2.1 Perbedaan Filosofis dari Desain Sebelumnya (STMS v1.0)

Dokumentasi ini bukan sekadar terjemahan ulang dari PRD/BA Review/FE Spec STMS v1.0. KINETIC CRM mengoreksi sejumlah kelemahan fondasional yang ditemukan BA Review:

| Aspek | STMS v1.0 (As Reviewed) | KINETIC CRM (Desain Final) |
|---|---|---|
| Parameter bisnis | Hardcode di source code (14+ parameter) | Seluruhnya dikelola via Modul Configuration (CFG-01 s/d CFG-14) |
| Struktur organisasi | "Cabang" hanya atribut/role pada user | Hierarki Company→Division→Department→Branch sebagai entitas penuh |
| Data terstruktur kompleks | Disimpan sebagai JSON blob (department_approvals, lphs_data, tender_data, dst.) | Dinormalisasi penuh ke tabel relasional |
| Target & KPI | Tidak ada sama sekali | Modul Target & KPI penuh dengan versioning, bobot, scoring komposit |
| Approval | Sequential, single point of failure pada PM | Approval engine generik dengan parallel review, SLA, backup approver, reassignment |
| Tipe pertanyaan | Disimpan di localStorage browser | Dimigrasikan ke tabel `question_type_defs` di database |
| Kecerdasan buatan | Tidak ada | AI Service Layer resmi (Gemini) dengan provider abstraction |

---

## 3. PROBLEM STATEMENT

### 3.1 Kondisi Saat Ini (As-Is)

Berdasarkan PRD §2.1, kondisi operasional sebelum KINETIC CRM:

- Proses tender dan prospek dikelola secara manual menggunakan email, spreadsheet, dan dokumen fisik yang tersebar di berbagai lokasi/perangkat.
- Tidak ada visibilitas real-time terhadap status proyek; informasi harus diminta secara manual ke setiap pihak terkait.
- Approval dilakukan via email/chat tanpa alur formal; histori persetujuan sulit ditelusuri dan tidak ada enforcement deadline.
- Koordinasi antar departemen (Cabang, PM, Departemen Teknis, Management) tidak terstruktur, menimbulkan delay dan miskomunikasi.
- Dokumen tender (RKS, LPHS, SIOS, penawaran harga) disimpan di berbagai lokasi tanpa versioning yang jelas.
- Tidak ada laporan agregat otomatis; dashboard performa harus dibuat manual secara periodik.

### 3.2 Dampak Bisnis dari Kondisi As-Is

- Win rate tender tidak terukur secara akurat dan tepat waktu.
- Deadline tender terlewat akibat keterlambatan koordinasi approval.
- Risiko compliance: dokumen approval tidak lengkap saat audit internal/eksternal.
- Beban administrasi tinggi pada staf cabang dan Project Manager.
- **(Inferred Requirement)** Tidak ada cara terukur untuk membandingkan performa antar cabang/divisi, sehingga keputusan alokasi resource bersifat intuitif, bukan data-driven. *Alasan: BA Review §B.6 menyatakan tidak ada konsep target/bobot KPI di PRD v1.0 sama sekali — ini secara logis berarti perusahaan tidak memiliki basis objektif untuk evaluasi performa unit organisasi sampai modul Target & KPI dibangun.*

### 3.3 Mengapa Solusi Manual/Spreadsheet Tidak Lagi Memadai

Seiring pertumbuhan volume tender (Business Goal BG-06: skalabilitas 10x volume tanpa degradasi performa), pendekatan manual menjadi bottleneck struktural:

1. Spreadsheet tidak memiliki kontrol akses granular per cabang/role.
2. Tidak ada mekanisme enforcement urutan approval (siapa pun bisa "menyetujui" secara informal di luar urutan).
3. Tidak ada audit trail otomatis untuk kebutuhan kepatuhan (compliance).
4. Tidak ada agregasi otomatis lintas cabang/divisi untuk pelaporan eksekutif.
5. Risiko kehilangan data tinggi (file lokal, email yang terhapus, versi dokumen yang tertimpa).

---

## 4. BUSINESS GOALS & KEY PERFORMANCE INDICATORS

Sumber: PRD §3 (BG-01 s/d BG-06), divalidasi terhadap BA Review.

| ID | Tujuan Bisnis | Indikator Keberhasilan (KPI) | Target | Modul Pendukung |
|---|---|---|---|---|
| BG-01 | Digitalisasi end-to-end alur prospek dan tender | Eliminasi proses manual berbasis email/spreadsheet untuk approval | 100% dalam 3 bulan pasca go-live | Modul Prospek, Project Core, RKS, LPHS/SIOS, Approval Engine |
| BG-02 | Meningkatkan kecepatan proses approval | Rata-rata waktu per siklus approval < 2 hari kerja | < 2 hari kerja | Approval Engine, SLA & Escalation Engine, Parallel Review |
| BG-03 | Meningkatkan visibilitas status proyek lintas departemen | % proyek yang status real-time-nya tersedia di dashboard | 100% | Dashboard Module, Project Core |
| BG-04 | Meningkatkan akurasi pelaporan win/loss tender | Ketersediaan laporan win rate bulanan otomatis | Tersedia T+1 hari | Reporting Module, Pemenang & Delivery Module |
| BG-05 | Memastikan compliance dokumen dan audit trail | % approval yang memiliki histori lengkap | 100% | Audit Trail Module, Approval Engine, Document Management |
| BG-06 | Skalabilitas sistem untuk pertumbuhan volume proyek | Sistem mampu menangani 10x volume proyek saat ini tanpa degradasi performa | Tanpa degradasi performa | Architecture, Database Indexing Strategy, Infrastructure |
| **BG-07** *(Inferred)* | Memberikan basis objektif evaluasi performa unit organisasi | Tersedianya skor performa komposit per cabang/divisi per periode | Skor tersedia maksimal T+1 hari setelah tutup periode | Target & KPI Module — *Alasan: turunan langsung dari GAP01 (Critical Gap) BA Review yang menyatakan tanpa ini sistem "hanya menjadi alat administrasi, bukan alat monitoring performa"* |
| **BG-08** *(Inferred)* | Mempercepat pemahaman dokumen tender yang kompleks melalui AI | Waktu rata-rata staf membaca & memahami dokumen RKS/LPHS turun signifikan | Ringkasan AI tersedia < 30 detik setelah dokumen diupload | AI Integration Architecture, AI Features & Use Cases — *Alasan: kebutuhan AI ditambahkan secara eksplisit oleh stakeholder sebagai komponen arsitektur resmi; BG ini didefinisikan agar nilai bisnis AI dapat diukur, bukan sekadar fitur dekoratif* |

---

## 5. RUANG LINGKUP (SCOPE)

### 5.1 In Scope — Fase 1 (Sumber: PRD §5.1, diperluas)

- Manajemen prospek: CRUD, alur approval PM, revisi, eskalasi ke proyek.
- Manajemen proyek tender dan non-tender (prospecting): alur status dari `created` hingga `selesai`, termasuk status `cancelled`.
- Modul RKS: input data tender, upload dokumen, pengisian pertanyaan master, review PM.
- Modul LPHS/SIOS: draft upload, approval multi-departemen (dengan kemampuan paralel), approval PM dan management.
- Modul Harga & Kompetitor: input penawaran harga, data kompetitor (entitas master ternormalisasi).
- Modul Pemenang & Delivery: pencatatan hasil tender (termasuk alasan kekalahan terstruktur) dan target delivery.
- Approval workflow multi-role yang dapat dikonfigurasi, dengan histori keputusan lengkap, SLA, dan eskalasi.
- Timeline event per proyek.
- Audit log seluruh aktivitas (append-only).
- Dashboard ringkasan dan KPI per role dengan filter granular.
- **Modul Target & KPI** (Target, Bobot, scoring performa per unit organisasi per periode).
- **Modul Configuration** penuh (CFG-01 s/d CFG-14) sebagai pengganti seluruh parameter hardcode.
- **Hierarki organisasi** (Company, Division, Department, Branch) sebagai entitas data formal.
- Master data lengkap (lihat dokumen 003 Gap Traceability Matrix dan seluruh dokumen 021-026).
- Upload dan download dokumen dengan **versioning**.
- Sistem notifikasi in-app.
- **Integrasi AI (Gemini)** untuk ringkasan dokumen, analisis prospek/kompetitor, smart search, dan insight KPI — melalui AI Service Layer.
- Containerization menggunakan Docker (Docker Compose), dengan environment separation (local/dev/staging/production).
- Role-based access control (RBAC) dinamis (bukan enum hardcode).
- Reporting dengan export Excel/PDF.

### 5.2 Out of Scope (Fase Pertama)

Sumber: PRD §5.2. Item-item ini didesain di tingkat arsitektur/roadmap (dokumen 064 Future Enhancement Roadmap, 009 Integration Architecture, 047 Email Notification) tetapi **implementasi penuhnya** berada di luar Fase 1:

- Integrasi dengan sistem ERP/CRM eksternal pihak ketiga (SAP, Salesforce) — desain API publik disiapkan di roadmap.
- Aplikasi mobile native (iOS/Android); Fase 1 hanya responsif di browser. PWA didesain sebagai opsi Fase 3.
- Notifikasi email/SMS/WhatsApp/Teams eksternal — didesain penuh di dokumen 047, implementasi Fase 2/3.
- e-Signature terintegrasi.
- Modul keuangan/invoicing.
- Pelaporan BI lanjutan (Power BI/Tableau integration) — Fase 3.
- Single Sign-On (SSO) dengan Active Directory/Google Workspace — Fase 2, didesain di roadmap.
- Modul Contract Management pasca-tender-menang — Fase 3.
- Provider AI selain Gemini (OpenAI, Claude, Azure OpenAI) — abstraksi disiapkan di Fase 1, aktivasi provider lain adalah opsi masa depan.

---

## 6. STAKEHOLDER & AKTOR SISTEM

| Aktor | Kategori | Keterlibatan Utama |
|---|---|---|
| Staf Cabang | Pengguna Operasional | Input prospek, RKS, harga, kompetitor, hasil tender, delivery |
| Project Manager (PM) | Pengguna Operasional / Approver | Review & approval prospek, RKS, koordinasi LPHS lintas departemen |
| Staf Departemen Teknis | Approver Spesialis | Review LPHS/SIOS sesuai bidang (Engineering, Legal, Finance, dll.) |
| Management | Approver Eksekutif | Approval final LPHS, monitoring dashboard, evaluasi performa unit |
| Administrator (IT/Admin) | Pengelola Sistem | Master data, konfigurasi sistem, user/role management, audit |
| **Direktur Regional** *(role contoh perluasan)* | Approver Eksekutif Lanjutan | Dicontohkan BA Review sebagai role baru yang harus bisa ditambahkan tanpa coding — divalidasi oleh desain Role & Permission Module dinamis |
| Tim Pengembang (FE/BE/DB) | Internal — Pembangun Sistem | Konsumen utama seluruh dokumentasi ini |
| QA Engineer | Internal — Penjamin Kualitas | Konsumen Master Test Case Catalog (062) |
| Project Manager (Proyek IT) | Internal — Perencana | Konsumen Sprint Planning (063) |

---

## 7. PRINSIP DESAIN UTAMA (DESIGN PRINCIPLES)

Prinsip-prinsip berikut berlaku di **seluruh** dokumen turunan dan menjadi acuan ketika terdapat ambiguitas:

1. **Tidak ada hardcode untuk parameter bisnis.** Setiap nilai yang mungkin berubah karena keputusan bisnis (status, role, SLA, target, dsb.) harus dapat dikonfigurasi melalui Modul Configuration.
2. **Tidak ada JSON blob untuk data terstruktur yang dapat diquery.** Setiap data yang berpotensi dianalisis, dihitung, atau dilaporkan harus berada dalam tabel relasional dengan kolom dan tipe data yang jelas.
3. **Audit-by-design.** Setiap aksi mutasi data (create/update/delete/approve/reject) tercatat secara otomatis di audit log; logging bukan fitur tambahan, melainkan bagian dari desain setiap modul.
4. **Approval berbasis posisi, bukan nama individu.** Konfigurasi siapa yang approve didasarkan pada jabatan/posisi struktural, agar pergantian pejabat tidak memerlukan rekonfigurasi sistem.
5. **State machine eksplisit dengan precondition enforcement di backend.** Frontend tidak pernah menjadi satu-satunya penjaga aturan transisi status.
6. **AI sebagai layer arsitektur, bukan integrasi langsung.** Seluruh akses AI melalui AI Service Layer yang provider-agnostic.
7. **Optimistic locking untuk mencegah race condition** pada entitas yang dapat diedit bersamaan (proyek, approval).
8. **Setiap gap yang ditemukan BA Review diselesaikan secara desain, dilacak melalui Gap Traceability Matrix (003), dan tidak ada gap yang dibiarkan tanpa rekomendasi konkret.**

---

## 8. RINGKASAN ARSITEKTUR TINGGI (PREVIEW)

Detail lengkap di dokumen 005. Ringkasan singkat:

- **Frontend:** React + TypeScript SPA (lihat 058 untuk detail komponen).
- **Backend:** REST API (PHP berbasis rekomendasi PRD, dengan struktur versioned `/api/v1/`).
- **Database:** MySQL relasional, ternormalisasi penuh (lihat 053, 054).
- **AI Layer:** AI Service Layer → Gemini API, dengan provider abstraction (lihat 010, 011).
- **Infrastruktur:** Docker Compose multi-container dengan environment separation (lihat 060).

---

## 9. ASUMSI GLOBAL

Sumber: PRD §13.2, divalidasi dan diperluas:

- Sistem digunakan di lingkungan intranet perusahaan; tidak wajib diakses dari internet publik pada Fase 1.
- Satu user memiliki satu role aktif pada satu waktu (tidak ada multi-role simultan di Fase 1; multi-role adalah kandidat Future Enhancement).
- Infrastruktur Docker berjalan di server Linux (Ubuntu 22.04 LTS atau setara).
- Browser yang didukung: Chrome 110+, Firefox 110+, Edge 110+.
- Data awal (seed) master customer, departemen, dan pertanyaan disediakan oleh tim bisnis sebelum go-live — lihat 061 Data Migration Strategy.
- **(Inferred)** Akses ke Gemini API tersedia dan API key disediakan oleh tim infrastruktur sebelum go-live fitur AI. *Alasan: stakeholder meminta AI sebagai komponen arsitektur resmi tanpa menyebutkan ketersediaan akun/API key; ini diasumsikan sebagai prasyarat operasional standar.*

---

## 10. CARA MEMBACA DOKUMENTASI INI

1. Mulai dari dokumen ini (001) untuk gambaran besar.
2. Baca 002 (Glossary) untuk memahami istilah domain sebelum ke dokumen modul.
3. Baca 003 (Gap Traceability Matrix) untuk memahami *mengapa* desain tertentu berbeda dari PRD asli.
4. Baca 004 (User Personas & Journeys) untuk memahami perspektif pengguna.
5. Baca 005-012 (Architecture) untuk memahami kerangka teknis sebelum membaca modul bisnis detail.
6. Baca 013-014 (Reference & Catalog) sebagai rujukan cepat saat membaca modul manapun.
7. Lanjutkan ke modul sesuai kebutuhan peran Anda (BA → 015-038; FE → 014, 058; BE → 039-052, 056-057; DB → 053-055; QA → 062; PM → 063).
