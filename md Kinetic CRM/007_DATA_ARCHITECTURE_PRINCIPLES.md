# 007 — DATA ARCHITECTURE PRINCIPLES
## KINETIC CRM — Prinsip Arsitektur Data

**Modul:** Architecture
**Sumber Utama:** PRD §10 (Data Model Recommendation), §14.1 (Kritik Desain); BA Review §B.1, §B.4 (Risiko Inkonsistensi Data)
**Dependensi Dokumen:** 005, 006
**Dirujuk Oleh:** 053, 054, 055, seluruh modul bisnis (032-038), 039 (Approval Engine)

---

## 1. TUJUAN DOKUMEN

Menetapkan prinsip-prinsip desain data yang **wajib** diikuti oleh seluruh entitas di KINETIC CRM, sebagai respons langsung terhadap kritik tajam BA Review dan PRD §14.1 terhadap desain STMS v1.0 (JSON blob, state divergence, race condition).

---

## 2. PRINSIP 1 — ANTI JSON-BLOB: NORMALISASI PENUH

### 2.1 Latar Belakang Masalah

PRD §14.1 mengkritik: menyimpan `department_approvals`, `lphs_data`, `tender_data`, `competitors`, `pemenang_data`, `target_delivery`, `review_questions` sebagai kolom JSON longtext di tabel `projects` menghasilkan sistem yang **sulit diquery, sulit untuk reporting, dan rawan korupsi data** jika ada bug serialisasi.

### 2.2 Keputusan Desain KINETIC CRM

**Seluruh JSON blob struktural dieliminasi.** Setiap entitas yang sebelumnya berada dalam JSON dipecah menjadi tabel relasional dengan kolom dan tipe data eksplisit:

| JSON Blob Lama (STMS v1.0) | Tabel Relasional Baru (KINETIC CRM) |
|---|---|
| `projects.department_approvals` (JSON) | `project_department_approvals` (id, project_id, department_id, status, notes, decided_by, decided_at) |
| `projects.lphs_data` (JSON) | `project_lphs` (id, project_id, draft_lphs_doc_id, draft_sios_doc_id, pm_approval_status, ...) |
| `projects.tender_data` (JSON) | `project_rks` (id, project_id, tender_number, tender_name, deadline_date, ...) |
| `projects.competitors` (JSON) | `project_competitors` (id, project_id, competitor_id, estimated_offer_price, advantages, notes) — many-to-many ke master `competitors` |
| `projects.pemenang_data` (JSON) | `project_results` (id, project_id, result, contract_value, loss_reason_id, ...) |
| `projects.target_delivery` (JSON) | `project_deliveries` (id, project_id, start_date, end_date, description, completed_at) |
| `projects.review_questions` (JSON) | `project_review_questions` (id, project_id, stage, question_text) + `project_review_answers` (id, review_question_id, answer_text, answered_by) |

### 2.3 Pengecualian yang Diizinkan (JSON Tetap Dipakai)

Sesuai keputusan eksplisit bahwa **seluruh JSON blob dinormalisasi**, KINETIC CRM **tidak memiliki pengecualian** untuk data terstruktur. Satu-satunya tempat kolom bertipe JSON masih muncul dalam skema adalah:

- `audit_logs.payload_before` dan `audit_logs.payload_after` — **ini bukan data operasional yang diquery untuk business logic**, melainkan representasi snapshot mentah untuk keperluan forensik/audit. Sifatnya append-only dan tidak pernah menjadi sumber kebenaran untuk kalkulasi bisnis.
- `question_type_defs.config` — JSON di sini menyimpan **definisi skema** (opsi jawaban dinamis untuk tipe pertanyaan custom), bukan data transaksional. Ini disengaja karena tipe pertanyaan custom secara definisi memerlukan struktur fleksibel, namun field ini divalidasi dengan JSON Schema di backend sebelum disimpan (mengatasi Risiko 1 BA Review §B.4).

Kedua kasus ini **bukan pelanggaran** prinsip anti-JSON-blob karena tidak ada kebutuhan untuk query analitik terhadap isi field tersebut.

---

## 3. PRINSIP 2 — SINGLE SOURCE OF TRUTH: DATABASE, BUKAN STATE FRONTEND

### 3.1 Latar Belakang Masalah

PRD §14.1 mengkritik `AppContext.tsx` (STMS v1.0) yang menyimpan state aplikasi di memori dan hanya sinkron dengan backend pada aksi tertentu — menyebabkan potensi divergensi antara state UI dan database jika ada kegagalan jaringan di tengah aksi.

### 3.2 Keputusan Desain KINETIC CRM

- **Setelah setiap mutasi berhasil di backend, Frontend WAJIB melakukan re-fetch data dari server** (via React Query `invalidateQueries`), bukan mengandalkan optimistic update untuk operasi kritis seperti approval, perubahan status, atau submit data finansial.
- Optimistic update **hanya diizinkan** untuk operasi non-kritis dengan risiko rendah (contoh: menandai notifikasi sebagai "dibaca").
- React Query menjadi cache layer tunggal untuk server state; tidak ada duplikasi state proyek/prospek di Zustand store.

---

## 4. PRINSIP 3 — OPTIMISTIC LOCKING UNTUK MENCEGAH RACE CONDITION

### 4.1 Latar Belakang Masalah

BA Review §B.4 Risiko 2 dan PRD Risk R-02/R-06: jika dua user membuka entitas yang sama dan melakukan aksi bersamaan, salah satu aksi bisa "terlindas" (lost update).

### 4.2 Keputusan Desain KINETIC CRM

- Setiap entitas yang dapat diedit oleh lebih dari satu peran (terutama `projects`, `prospects`, dan seluruh tabel approval) memiliki kolom `updated_at` yang **wajib** dikirim balik oleh klien pada setiap request `PUT`/`PATCH`.
- Backend membandingkan `updated_at` yang dikirim klien dengan nilai aktual di database **sebelum** melakukan commit.
- Jika nilai berbeda (artinya ada update lain yang lebih dulu terjadi), backend mengembalikan **HTTP 409 Conflict** beserta data terbaru, dan Frontend menampilkan dialog: *"Data ini telah diubah oleh pengguna lain. Muat ulang untuk melihat versi terbaru."*
- Pola ini diterapkan secara konsisten di seluruh endpoint mutasi pada modul Project Core (033), Approval Engine (039), dan Target Setting (044).

---

## 5. PRINSIP 4 — SOFT DELETE, BUKAN HARD DELETE

### 5.1 Aturan Umum

- Seluruh entitas master data (Customer, Department, Branch, Division, Company, User, dll.) menggunakan **soft delete** melalui kolom `is_active` (boolean) — data tidak pernah dihapus secara fisik kecuali untuk kebutuhan kepatuhan privasi data eksplisit (di luar scope Fase 1).
- Entitas transaksional yang dapat "dihapus" oleh pengguna (misalnya draft prospek) menggunakan kolom `deleted_at` (nullable timestamp) — baris tetap ada di database untuk keperluan audit, tapi disembunyikan dari query default.
- **Pengecualian:** `audit_logs` tidak memiliki mekanisme delete sama sekali (append-only, lihat Prinsip 6).

### 5.2 Dampak terhadap Query

Setiap query daftar (list) di backend wajib menyertakan filter `WHERE is_active = 1` atau `WHERE deleted_at IS NULL` secara default, kecuali ada parameter eksplisit `includeInactive=true` (hanya untuk role Admin).

---

## 6. PRINSIP 5 — AUDIT-BY-DESIGN

- Setiap operasi `CREATE`, `UPDATE`, `DELETE`, dan transisi status (`APPROVE`, `REVISE`, `CANCEL`) **wajib** menulis baris ke tabel `audit_logs` sebagai bagian dari transaksi database yang sama (bukan proses asinkron terpisah yang berisiko gagal diam-diam).
- `audit_logs` bersifat **append-only**: tidak ada endpoint API yang mengizinkan `UPDATE` atau `DELETE` terhadap tabel ini, dan hak akses database user aplikasi (`app_user`) tidak diberi privilese `UPDATE`/`DELETE` pada tabel ini di level DBMS sebagai pertahanan berlapis.
- Detail lengkap di dokumen 052 (Audit Trail Module).

---

## 7. PRINSIP 6 — VERSIONING UNTUK DATA YANG BERUBAH SEPANJANG WAKTU

KINETIC CRM membedakan dua jenis versioning:

| Jenis Versioning | Penerapan | Mekanisme |
|---|---|---|
| **Versioning Dokumen** | File yang diupload ulang (RKS, LPHS, SIOS, dll.) | Kolom `version_number` pada tabel `documents`; upload baru = baris baru, file lama tetap dapat diunduh |
| **Versioning Data Bertanggal-Efektif** | Target KPI, Bobot KPI | Kolom `effective_date` dan `expired_date`; update target = `INSERT` baris baru dengan `effective_date` baru, baris lama diberi `expired_date`, **tidak pernah** `UPDATE` nilai target lama secara langsung |

Alasan: BA Review §B.6 menekankan kebutuhan audit historis ("berapa target bulan lalu") yang mustahil jika target di-overwrite.

---

## 8. PRINSIP 7 — SNAPSHOT UNTUK DATA HISTORIS YANG TIDAK BOLEH BERUBAH

- Tabel `reporting_snapshots` menyimpan hasil kalkulasi realisasi vs target **pada akhir periode**, sebagai salinan tetap (immutable record).
- Tujuannya: jika data sumber (misalnya nilai proyek) dikoreksi setelah periode ditutup, laporan historis tetap menunjukkan angka yang dilaporkan pada saat itu — bukan angka yang sudah berubah akibat koreksi belakangan.
- Dashboard real-time (050) menghitung progress dari data live; laporan periode yang sudah ditutup (051) membaca dari snapshot.

---

## 9. PRINSIP 8 — KEAMANAN FILE STORAGE

- File dokumen disimpan **di luar webroot** dan hanya dapat diakses melalui endpoint backend yang terautentikasi dan terotorisasi (bukan URL statis langsung).
- Nama file disanitasi sebelum disimpan (anti path-traversal, anti karakter berbahaya); nama asli ditampilkan di UI sementara nama fisik di disk menggunakan UUID atau hash.
- Detail lengkap di dokumen 048.

---

## 10. PRINSIP 9 — INDEXING SADAR-QUERY

Setiap tabel yang akan difilter di dashboard/laporan (status, cabang, periode, customer) memiliki index komposit yang dirancang berdasarkan **pola query aktual**, bukan ditambahkan reaktif setelah masalah performa muncul. Detail lengkap di dokumen 055.

---

## 11. RINGKASAN PRINSIP UNTUK REFERENSI CEPAT

| # | Prinsip | Mengatasi Masalah |
|---|---|---|
| 1 | Anti JSON-Blob — normalisasi penuh | PRD §14.1, sulit query & reporting |
| 2 | Single Source of Truth = Database | Risiko 2 BA Review, AppContext divergence |
| 3 | Optimistic Locking | Risk R-02/R-06 PRD, race condition |
| 4 | Soft Delete | Kebutuhan audit & recovery data |
| 5 | Audit-by-Design | BG-05, compliance |
| 6 | Versioning (dokumen & data bertanggal-efektif) | GAP14, BA Review §B.6 |
| 7 | Snapshot untuk data historis | BA Review §B.6 Progress Calculation |
| 8 | Keamanan file storage | PRD §8.4, FR070-071 |
| 9 | Indexing sadar-query | BG-06 skalabilitas |

---

## 12. FUTURE SCALABILITY NOTE

Jika volume data proyek tumbuh signifikan (BG-06: 10x volume), prinsip-prinsip di atas memungkinkan jalur scaling tanpa migrasi besar:
- Partitioning tabel `audit_logs` dan `timeline_events` berdasarkan rentang tanggal.
- Read replica MySQL untuk query reporting berat, memisahkan beban dari transaksi operasional.
- Migrasi file storage dari volume lokal ke S3-compatible storage (path sudah diabstraksi sejak Fase 1).
