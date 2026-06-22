# 002 — GLOSSARY AND TERMINOLOGY
## KINETIC CRM — Kamus Istilah Domain & Teknis

**Modul:** Overview & Governance
**Sumber Utama:** PRD (seluruh bagian), BA Review (seluruh bagian), FE Spec (seluruh bagian)
**Dependensi Dokumen:** 001
**Dirujuk Oleh:** Seluruh dokumen lain

---

## 1. TUJUAN DOKUMEN

Dokumen ini menstandardisasi seluruh istilah yang dipakai di dokumentasi KINETIC CRM agar BA, FE, BE, DB Engineer, QA, dan PM menggunakan terminologi yang sama persis. Istilah domain bisnis tender Indonesia **dipertahankan apa adanya** (tidak diterjemahkan ke Inggris) karena merupakan istilah kerja yang akan tetap dipakai pengguna akhir di UI.

---

## 2. ISTILAH DOMAIN BISNIS (TETAP BAHASA INDONESIA)

| Istilah | Definisi | Konteks Pemakaian |
|---|---|---|
| **Prospek** | Peluang bisnis awal yang diidentifikasi staf cabang sebelum menjadi proyek resmi | Modul Prospek (032) |
| **RKS** (Rencana Kerja dan Syarat) | Dokumen yang mendefinisikan ketentuan teknis dan administratif suatu tender, diisi cabang dan direview PM | Modul RKS (034) |
| **LPHS** (Laporan Hasil Survei) | Dokumen laporan hasil survei lapangan/teknis sebelum penawaran harga, memerlukan approval multi-departemen | Modul LPHS/SIOS (035) |
| **SIOS** (Surat Izin Operasi Survei) | Dokumen izin operasional terkait survei, diproses bersamaan dengan LPHS dalam siklus yang sama | Modul LPHS/SIOS (035) |
| **SPK** (Surat Perintah Kerja) | Dokumen kontrak/perintah kerja yang diterbitkan setelah tender dimenangkan | Modul Pemenang & Delivery (037) |
| **Tender** | Tipe proyek yang melalui seluruh alur formal: RKS → review departemen → LPHS/SIOS → harga → pemenang → delivery | Project Core Module (033) |
| **Prospecting** (sebagai tipe proyek) | Tipe proyek non-tender yang melewati tahap RKS/LPHS dan langsung ke submit harga | Project Core Module (033) |
| **Cabang** | Unit operasional terdepan (Branch) tempat staf bekerja dan proyek di-assign | Organization Hierarchy Module (015) |
| **PM** (Project Manager) | Role yang mereview dan menyetujui RKS serta mengkoordinasikan proses LPHS | Seluruh modul approval |
| **Departemen** | Unit fungsional teknis (Engineering, Legal, Finance, dll.) yang mereview LPHS sesuai bidang | Organization Hierarchy Module (015) |
| **Management** | Role approval tingkat tertinggi, menyetujui LPHS final setelah seluruh departemen approve | Approval Engine (039) |
| **Win Rate** | Persentase proyek tender yang dimenangkan dari total proyek yang diumumkan hasilnya | Target & KPI Module (043), Reporting Module (051) |
| **Pipeline** | Kumpulan proyek aktif yang sedang berjalan dalam berbagai tahap, beserta nilai estimasinya | Dashboard Module (050) |
| **Kompetitor** | Entitas pesaing bisnis yang ikut dalam tender yang sama | Master Competitor Module (023) |
| **Target Delivery** | Tahap pasca-menang tender untuk mencatat tanggal mulai dan selesai pekerjaan | Pemenang & Delivery Module (037) |
| **Alasan Kekalahan** (Loss Reason) | Kategori terstruktur penyebab kekalahan tender (harga terlalu tinggi, keunggulan kompetitor, dll.) | Master Loss Reason (026) |

---

## 3. ISTILAH STATUS PROYEK (STATE MACHINE)

| Status (kode internal) | Label UI (Bahasa Indonesia) | Tipe Proyek | Deskripsi |
|---|---|---|---|
| `created` | Dibuat | Tender & Prospecting | Proyek baru dibuat, belum ada aksi lanjutan |
| `submit_rks` | RKS Disubmit | Tender | RKS sudah diisi dan disubmit, menunggu review PM |
| `revision` | Revisi | Tender | Dikembalikan untuk revisi (berlaku di tahap RKS maupun LPHS) |
| `review_department` | Review Departemen | Tender | RKS disetujui PM, dalam tahap review departemen-departemen terpilih |
| `lphs_sios` | LPHS/SIOS | Tender | Dalam proses penyusunan dan approval LPHS/SIOS |
| `submit_harga` | Submit Harga | Tender & Prospecting | Menunggu pengisian harga penawaran |
| `pengumuman_pemenang` | Pengumuman Pemenang | Tender & Prospecting | Menunggu input hasil tender (menang/kalah) |
| `target_delivery` | Target Delivery | Tender & Prospecting | Menunggu konfirmasi delivery setelah menang |
| `selesai` | Selesai | Tender & Prospecting | Proyek selesai (status akhir, hanya tercapai jika menang dan delivery selesai) |
| `cancelled` | Dibatalkan | Tender & Prospecting | Proyek dibatalkan dari tahap manapun, wajib disertai alasan |

> **Catatan:** status di atas dikelola dinamis melalui Master Status Proyek (022) dan Konfigurasi Status (028) — tabel ini adalah *nilai default Fase 1*, bukan daftar hardcode permanen.

---

## 4. ISTILAH STATUS PROSPEK

| Status | Label UI | Deskripsi |
|---|---|---|
| `prospecting` | Draft | Prospek baru dibuat, belum disubmit |
| `waiting_pm_approval` | Menunggu Approval PM | Disubmit ke PM, menunggu keputusan |
| `revision` | Revisi | PM meminta revisi, menunggu jawaban cabang |
| `approved` | Disetujui | PM menyetujui; dapat dikonversi menjadi proyek |

---

## 5. ISTILAH PERAN/ROLE (BASE ROLES FASE 1)

| Kode Role | Label UI | Deskripsi Singkat |
|---|---|---|
| `cabang` | Staf Cabang | Input prospek, RKS, harga, kompetitor, hasil tender |
| `pm` | Project Manager | Review & approval prospek dan RKS, koordinasi LPHS |
| `department` | Staf Departemen | Review LPHS sesuai bidang teknis |
| `management` | Management | Approval final LPHS, monitoring performa |
| `admin` | Administrator | Master data, konfigurasi, user management, audit |

> Role bersifat **dinamis** (lihat Role & Permission Module — 017); kode di atas adalah seed data awal, bukan enum hardcode di kode aplikasi.

---

## 6. ISTILAH KONFIGURASI (CFG)

| Kode | Nama Konfigurasi | Dokumen Rujukan |
|---|---|---|
| CFG-01 | Konfigurasi Hierarki Organisasi | 027 |
| CFG-02 | Konfigurasi Approval Workflow | 027 |
| CFG-03 | Konfigurasi Status Proyek | 028 |
| CFG-04 | Konfigurasi Role & Permission | 028 |
| CFG-05 | Konfigurasi SLA & Deadline | 029 |
| CFG-06 | Konfigurasi Reminder & Eskalasi | 029 |
| CFG-07 | Konfigurasi Target & Bobot KPI | 030 |
| CFG-08 | Konfigurasi Dashboard | 030 |
| CFG-09 | Konfigurasi Notifikasi Email | 030 |
| CFG-10 | Konfigurasi Periode Pelaporan | 031 |
| CFG-11 | Konfigurasi Kategori Proyek | 028 |
| CFG-12 | Konfigurasi Tipe Pertanyaan | 031 |
| CFG-13 | Konfigurasi Ukuran & Tipe File Upload | 031 |
| CFG-14 | Konfigurasi Integrasi Eksternal (termasuk AI Provider) | 031 |

---

## 7. ISTILAH GAP ANALYSIS (GAP & BP & R)

| Prefiks | Arti |
|---|---|
| `GAP01`–`GAP22` | Gap teridentifikasi dalam BA Review (4 Critical, 7 Major, 5 Minor, 6 Future Enhancement) |
| `BP01`–`BP05` | Bottleneck Proses dalam Business Process Flow (BA Review §B.4) |
| `R-01`–`R-08` | Rekomendasi Final BA Review (§F.1) |
| `MD01`–`MD31` | Master Data teridentifikasi (MD01-14 dari BA Review, MD15+ tambahan logis KINETIC CRM) |
| `FR001`–`FR122` | Functional Requirement dari PRD §7 |
| `BG-01`–`BG-08` | Business Goal (BG-01 s/d 06 dari PRD, BG-07/08 inferred KINETIC CRM) |

---

## 8. ISTILAH TEKNIS UMUM

| Istilah | Definisi |
|---|---|
| **RBAC** | Role-Based Access Control — kontrol akses berdasarkan peran pengguna |
| **State Machine** | Model status proyek/prospek dengan transisi terdefinisi dan precondition |
| **Optimistic Locking** | Teknik mencegah race condition dengan memeriksa kolom `updated_at`/versi sebelum commit perubahan |
| **Soft Delete** | Penghapusan logis (flag `is_active=false` atau `deleted_at`) tanpa menghapus baris data secara fisik |
| **Append-Only** | Sifat tabel (khususnya audit log) yang hanya bisa ditambah, tidak bisa diubah/dihapus |
| **SLA** (Service Level Agreement) | Batas waktu maksimum suatu tahap approval harus diselesaikan |
| **Eskalasi** | Proses otomatis memindahkan tanggung jawab approval ke pihak lain ketika SLA terlampaui |
| **Backup Approver** | Approver pengganti yang dikonfigurasi di muka untuk skenario approver utama tidak aktif |
| **Reassignment** | Tindakan admin memindahkan kewajiban approval dari satu user ke user lain secara manual |
| **Snapshot** | Salinan data agregat pada satu titik waktu (akhir periode) untuk keperluan laporan historis yang tidak berubah meski data sumber dikoreksi |
| **Versioning (Dokumen)** | Mekanisme penyimpanan riwayat file ketika dokumen yang sama diupload ulang |
| **Versioning (Target)** | Mekanisme penyimpanan riwayat nilai target dengan `effective_date`/`expired_date`, bukan overwrite |

---

## 9. ISTILAH ARSITEKTUR AI

| Istilah | Definisi |
|---|---|
| **AI Service Layer** | Layer arsitektur internal yang mengabstraksi seluruh interaksi dengan provider AI; satu-satunya pintu masuk akses AI dari Backend |
| **Provider Abstraction Layer** | Sub-komponen AI Service Layer yang menstandardisasi kontrak panggilan (request/response) agar provider dapat diganti tanpa mengubah modul bisnis |
| **Prompt Management** | Pengelolaan template prompt terversi dan terpisah dari kode aplikasi |
| **AI Request Lifecycle** | Siklus penuh satu permintaan AI: validasi input → rate limit check → prompt construction → panggilan provider → retry (jika perlu) → parsing respons → logging → return ke caller |
| **Cost Control (AI)** | Kebijakan pembatasan biaya pemakaian AI (kuota per user/hari, panjang maksimum input/output) |
| **Smart Search** | Fitur pencarian berbasis AI yang memahami maksud (intent) bukan hanya pencocokan kata kunci literal |

---

## 10. ISTILAH UI/FRONTEND

| Istilah | Definisi |
|---|---|
| **SPA** | Single Page Application |
| **Drawer** | Panel UI yang muncul slide-in dari tepi layar (kanan), digunakan untuk review approval cepat |
| **Stepper** | Komponen visual yang menampilkan posisi proyek dalam alur tahapan |
| **Skeleton Loading** | Placeholder shimmer yang ditampilkan saat data sedang dimuat pertama kali |
| **Empty State** | Tampilan khusus ketika daftar/data tidak memiliki isi |
| **Optimistic Update** | Teknik UI memperbarui tampilan segera setelah aksi, sebelum konfirmasi server, lalu disesuaikan jika gagal — **tidak dipakai untuk aksi approval kritis** di KINETIC CRM (lihat 007 Data Architecture Principles) |

---

## 11. KONVENSI PENULISAN DALAM DOKUMENTASI INI

- ID requirement, gap, dan kode lain ditulis dengan format tetap (mis. `FR010`, `GAP05`, `CFG-07`) agar mudah dicari (Ctrl+F) di seluruh dokumen.
- Nama tabel database ditulis dengan `snake_case` dan font monospace, mis. `project_department_approvals`.
- Nama endpoint API ditulis dengan format `METHOD /api/v1/path`, mis. `POST /api/v1/projects/{id}/cancel`.
- Nama komponen Frontend ditulis dengan `PascalCase`, mis. `ApprovalMatrix`.
- Setiap requirement baru yang tidak berasal langsung dari ketiga dokumen sumber ditandai **"(Inferred Requirement)"** disertai alasan singkat di tempat requirement tersebut pertama kali muncul.
