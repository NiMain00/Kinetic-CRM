# 003 — GAP TRACEABILITY MATRIX
## KINETIC CRM — Pemetaan Resolusi 22 Gap BA Review

**Modul:** Overview & Governance
**Sumber Utama:** BA Review §C.1 (Gap Analysis), §C.2 (Risk Heatmap), §D (Improvement Recommendations), §F (Conclusion)
**Dependensi Dokumen:** 001, 002
**Dirujuk Oleh:** Seluruh dokumen modul yang menyelesaikan gap terkait

---

## 1. TUJUAN DOKUMEN

Dokumen ini adalah **bukti akuntabilitas**: memastikan seluruh 22 gap yang ditemukan BA Review (4 Critical, 7 Major, 5 Minor, 6 Future Enhancement) memiliki resolusi desain yang jelas, terlacak ke dokumen spesifik, dan tidak ada yang hilang begitu saja. Dokumen ini juga menjadi alat verifikasi bagi BA dan PM untuk memastikan blueprint KINETIC CRM benar-benar menutup seluruh temuan review.

---

## 2. RINGKASAN STATUS RESOLUSI

| Klasifikasi | Jumlah | Status Resolusi di KINETIC CRM |
|---|---|---|
| Critical | 4 | **100% diselesaikan secara desain** — seluruh 4 gap memiliki modul dedicated dengan desain penuh |
| Major | 7 | **100% diselesaikan secara desain** |
| Minor | 5 | **100% diselesaikan secara desain** |
| Future Enhancement | 6 | **100% didesain di tingkat arsitektur/roadmap**, implementasi penuh tetap di Fase 2/3 sesuai rekomendasi BA Review |

**Tidak ada gap yang dibiarkan tanpa dokumentasi resolusi.**

---

## 3. MATRIX DETAIL — CRITICAL GAP

| Gap ID | Deskripsi Gap (BA Review) | Dampak Bisnis | Dokumen Resolusi | Ringkasan Resolusi |
|---|---|---|---|---|
| **GAP01** | Tidak ada modul Target & KPI: tidak bisa mengukur progress vs target bisnis | Sistem hanya menjadi alat administrasi, bukan alat monitoring performa | 043, 044, 045 (Modul Target & KPI penuh) | Master KPI, Master Target (versioned), Master Bobot, formula skor komposit, workflow target setting, kalkulasi progress real-time + snapshot periodik — didesain **lengkap di Fase 1**, bukan sekadar roadmap |
| **GAP02** | Tidak ada Menu Configuration: semua parameter bisnis hardcode | Setiap perubahan bisnis membutuhkan deployment ulang | 027, 028, 029, 030, 031 (Modul Configuration CFG-01 s/d CFG-14) | Seluruh 14 area konfigurasi didesain penuh sebagai pengganti hardcode, prioritas Fase 1: CFG-01, 02, 03, 04, 05, 07, 12 |
| **GAP03** | Question Type Definitions disimpan di localStorage, bukan DB | Data hilang saat clear browser; bug production | 024 (Master Question & Question Type), 061 (Data Migration Strategy) | Tabel `question_type_defs` di database + endpoint CRUD + strategi migrasi data lama dari localStorage |
| **GAP04** | Tidak ada mekanisme cancel/nonaktifkan proyek yang tidak dilanjutkan | Data pipeline tidak akurat; proyek "zombie" mencemari laporan | 033 (Project Core), 038 (Project Cancellation Module) | Status `cancelled` dengan business rule lengkap: hak akses (PM/Admin), field alasan wajib, tidak dapat di-reopen |

---

## 4. MATRIX DETAIL — MAJOR GAP

| Gap ID | Deskripsi Gap (BA Review) | Dampak Bisnis | Dokumen Resolusi | Ringkasan Resolusi |
|---|---|---|---|---|
| **GAP05** | Hierarki organisasi tidak dimodelkan sebagai entitas (tidak ada tabel Branch, Divisi, Perusahaan) | Laporan per unit organisasi tidak akurat; manajemen cabang/divisi tidak mungkin tanpa kode | 015 (Organization Hierarchy Module) | Tabel `companies`, `divisions`, `departments`, `branches` dengan relasi hierarkis penuh dan FK ke `users`/`projects` |
| **GAP06** | Tidak ada SLA enforcement pada approval | Deadline tender terlewat akibat approval lambat | 041 (SLA & Escalation Engine), 029 (Konfigurasi SLA) | Engine SLA dengan kalkulasi hari kerja (memakai Master Holiday Calendar — 025), reminder T-X, eskalasi otomatis |
| **GAP07** | Tidak ada mekanisme re-assign approval jika approver tidak aktif | Proyek stuck jika PM/Dept Head resign atau sakit panjang | 042 (Backup Approver & Reassignment) | Backup approver per stage di konfigurasi workflow + fitur re-assign manual oleh admin, tercatat di audit log |
| **GAP08** | Review departemen tidak bisa dilakukan paralel dengan PM; semua sequential | Cycle time lebih panjang dari yang diperlukan | 035 (LPHS/SIOS Module), 040 (Parallel Review & Targeted Revision) | Redesain: departemen dapat memulai review bersamaan dengan PM; approval departemen terkunci sampai PM menyelesaikan approval-nya, tapi proses review (membaca dokumen, menyiapkan catatan) dapat dimulai lebih awal |
| **GAP09** | Kompetitor disimpan sebagai JSON bebas per proyek, tidak ada Master Kompetitor | Analisis kompetitor lintas proyek tidak mungkin | 023 (Master Competitor Module), 036 (Harga & Kompetitor Module) | Tabel `competitors` ternormalisasi + tabel relasi `project_competitors` (many-to-many) |
| **GAP10** | Dashboard tidak memiliki filter per cabang/divisi/periode untuk management | Management tidak bisa drill-down ke performa unit tertentu | 050 (Dashboard Module) | Filter granular: per cabang, divisi, kategori proyek, periode — pada seluruh widget yang relevan |
| **GAP11** | Tidak ada laporan periodik yang bisa diekspor (Excel/PDF) | Laporan ke direksi harus dibuat manual; double work dan rawan error | 051 (Reporting Module) | Modul Reporting dengan laporan Win/Loss, Pipeline, Progress vs Target; export Excel dan PDF |

---

## 5. MATRIX DETAIL — MINOR GAP

| Gap ID | Deskripsi Gap (BA Review) | Dampak Bisnis | Dokumen Resolusi | Ringkasan Resolusi |
|---|---|---|---|---|
| **GAP12** | Tidak ada field "alasan kekalahan" terstruktur saat proyek kalah tender | Analisis mengapa kalah tender tidak bisa dilakukan secara agregat | 026 (Master Loss Reason), 037 (Pemenang & Delivery Module) | Field `loss_reason_id` (dropdown dari master) + `loss_notes` (teks bebas) pada hasil tender |
| **GAP13** | Tidak ada notifikasi saat deadline tender kurang dari N hari | Cabang dan PM bisa lupa deadline yang approaching | 046 (In-App Notification Module) | Reminder in-app T-7, T-3, T-1 hari sebelum deadline tender, trigger matrix lengkap |
| **GAP14** | Tidak ada versioning dokumen | Reviewer bisa mereview dokumen yang sudah outdated tanpa sadar | 049 (Document Versioning Module) | Tabel `documents` dengan `version_number`; upload ulang = versi baru, bukan overwrite; UI histori versi |
| **GAP15** | Tidak ada health check endpoint untuk Docker monitoring | Monitoring infrastruktur tidak bisa dilakukan tanpa endpoint memadai | 060 (Docker Deployment & Operations) | Endpoint `GET /api/v1/health` dengan cek koneksi DB dan disk usage, terintegrasi healthcheck Docker Compose |
| **GAP16** | Tidak ada export audit log dalam format yang bisa dianalisis (CSV/Excel) | Compliance audit memerlukan export log | 052 (Audit Trail Module) | Endpoint export audit log dengan filter tanggal, user, dan tipe aksi, output CSV |

---

## 6. MATRIX DETAIL — FUTURE ENHANCEMENT

| Gap ID | Deskripsi Gap (BA Review) | Dampak Bisnis | Dokumen Resolusi | Ringkasan Resolusi & Fase |
|---|---|---|---|---|
| **GAP17** | Tidak ada integrasi SSO (Active Directory/Google Workspace) | User kelola password terpisah; risiko password lemah | 009 (Integration Architecture), 064 (Future Enhancement Roadmap) | Desain SAML/OAuth2 SSO disiapkan di tingkat arsitektur; implementasi **Fase 2** |
| **GAP18** | Tidak ada notifikasi email/WhatsApp eksternal | Notifikasi hanya in-app; user yang tidak buka sistem tidak tahu ada pending approval | 047 (Email & External Notification) | Desain **penuh** notifikasi SMTP (Fase 2) dan WhatsApp/Teams webhook (Fase 3) — didesain lengkap sekarang sesuai instruksi, implementasi bertahap |
| **GAP19** | Tidak ada approval via link one-click di email | Management harus login untuk approve sederhana; friksi tinggi | 047 (Email & External Notification) | Desain secure tokenized approval link dengan expiry — **Fase 2** |
| **GAP20** | Tidak ada analitik kompetitor lintas proyek | Tidak bisa mengetahui kompetitor yang sering menang dan di segmen apa | 023 (Master Competitor), 064 (Roadmap) | Fondasi data (normalisasi kompetitor) dibangun **Fase 1**; dashboard analitik lanjutan **Fase 3** |
| **GAP21** | Tidak ada integrasi sistem manajemen kontrak pasca tender menang | Proses kontrak kembali manual setelah menang | 064 (Future Enhancement Roadmap) | Modul Contract Management dasar — **Fase 3**, desain tingkat tinggi disiapkan |
| **GAP22** | Tidak ada mobile app/PWA untuk approval cepat di lapangan | Management yang sering di lapangan kesulitan approve via browser mobile | 058 (Frontend Architecture — responsive foundation), 064 (Roadmap) | Responsive design Fase 1 sebagai fondasi; PWA penuh — **Fase 3** |

---

## 7. PEMETAAN BOTTLENECK PROSES (BP01–BP05)

| BP ID | Deskripsi (BA Review §B.4) | Dokumen Resolusi |
|---|---|---|
| BP01 | Single point of failure pada PM untuk seluruh approval RKS/LPHS | 042 (Backup Approver & Reassignment) |
| BP02 | Tidak ada parallelisasi review departemen dan PM | 040 (Parallel Review & Targeted Revision) |
| BP03 | Revisi LPHS mereset semua approval departemen tanpa selective reset | 040 (Parallel Review & Targeted Revision) |
| BP04 | Tidak ada mekanisme cancel proyek | 038 (Project Cancellation Module) |
| BP05 | Alur prospecting tidak memiliki tahap review sama sekali | 033 (Project Core Module) — opsional review PM untuk prospecting di atas nilai threshold (configurable) |

---

## 8. PEMETAAN RISIKO DATA (R-01, R-02 dari BA Review §B.4)

| Risiko | Deskripsi | Dokumen Resolusi |
|---|---|---|
| Risiko 1 | JSON di DB tidak tervalidasi skema | 007 (Data Architecture Principles) — JSON blob dieliminasi total melalui normalisasi penuh, sehingga risiko ini tidak relevan lagi di desain final |
| Risiko 2 | State di AppContext vs DB bisa diverge (race condition antar user) | 007 (Data Architecture Principles), 039 (Approval Engine Core) — optimistic locking dengan pengecekan `updated_at`, reload otomatis setelah mutasi |

---

## 9. PEMETAAN REKOMENDASI FINAL BA REVIEW (R-01 s/d R-08)

| Rekomendasi | Deskripsi (BA Review §F.1) | Dokumen Resolusi | Status |
|---|---|---|---|
| R-01 | Selesaikan 4 Critical Gap sebelum development | 027-031, 038, 024, 043-045 | Diselesaikan secara desain di blueprint ini |
| R-02 | Modelkan hierarki organisasi secara eksplisit | 015 | Selesai |
| R-03 | Bangun Modul Configuration sebagai backbone fleksibilitas | 027-031 | Selesai |
| R-04 | Redesain approval flow dengan parallelisasi dan SLA | 040, 041 | Selesai |
| R-05 | Tambahkan 7 Master Data Fase 1 ke data model | 015, 021, 022, 023, 016 (Position) | Selesai — Perusahaan, Divisi, Branch, Status Proyek, Approval Level, Tipe Dokumen, Kategori Proyek seluruhnya dipetakan |
| R-06 | Implementasikan notifikasi in-app sebagai prioritas tinggi (bukan fase 2) | 046 | Selesai — didesain sebagai bagian Fase 1 |
| R-07 | Rencanakan Modul Target & KPI sebagai deliverable Fase 2 dengan scope jelas | 043, 044, 045 | **Ditingkatkan** — atas instruksi eksplisit, didesain penuh dan siap dikerjakan di Fase 1 (bukan ditunda ke Fase 2) |
| R-08 | Pastikan Docker Compose mencakup semua service dengan health check dan volume tepat | 060 | Selesai |

---

## 10. GAP TAMBAHAN YANG DITEMUKAN SELAMA PENYUSUNAN DOKUMENTASI INI (Inferred)

Selain 22 gap resmi BA Review, proses analisis menyeluruh terhadap ketiga dokumen sumber menemukan beberapa kebutuhan implisit tambahan. Seluruhnya ditandai sebagai **Inferred Requirement** di dokumen aslinya:

| Kebutuhan Tambahan | Alasan Ditemukan | Dokumen Resolusi |
|---|---|---|
| Master Position/Job Title sebagai entitas formal | BA Review merekomendasikan approval berbasis "Head of Dept" bukan nama user, tapi tidak mendefinisikan entitas Position secara eksplisit | 016 |
| Role & Permission sebagai entitas dinamis (bukan enum) | CFG-04 menyebutkan kebutuhan ini tapi PRD/FE Spec masih menulis role sebagai enum hardcode di beberapa tempat | 017 |
| AI Integration Architecture | Ditambahkan sebagai instruksi eksplisit stakeholder setelah review index v1.0 | 010, 011 |
| UI Screen Catalog & Information Architecture | Ditambahkan sebagai instruksi eksplisit stakeholder | 012, 014 |
| Global State Machine Reference | Ditambahkan sebagai instruksi eksplisit stakeholder untuk konsolidasi lintas modul | 013 |
| Data Migration Strategy (scope: proses manual + localStorage) | Ditambahkan sebagai instruksi eksplisit; scope disesuaikan karena tidak ada sistem digital lama yang disebutkan di ketiga dokumen sumber | 061 |

---

## 11. KESIMPULAN

Seluruh 22 gap BA Review, 5 bottleneck proses, 2 risiko data, dan 8 rekomendasi final telah dipetakan ke dokumen resolusi yang konkret dan dapat ditindaklanjuti. Tidak ada temuan BA Review yang tidak memiliki jejak penyelesaian dalam blueprint KINETIC CRM ini.
