# 052 — AUDIT TRAIL MODULE
## KINETIC CRM — Modul Jejak Audit

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 052 |
| **Nama Dokumen** | Audit Trail Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0, 014_UI_SCREEN_CATALOG.md |
| **Dokumen Terkait** | 014 (UI Screen Catalog — AUDT-01), 007 (Data Architecture Principles), 008 (Security Architecture), 010 (AI Integration Architecture), 048/049 (Document Upload & Versioning), 039 (Approval Engine Core), 057 (API Endpoint Specification) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Backend Developer, Security Engineer, Compliance Officer, Admin, QA Engineer, DevOps Engineer

---

## 1. PURPOSE

Modul ini mendesain penuh mekanisme **jejak audit (audit trail)** lintas seluruh sistem KINETIC CRM. Layar Audit Log (`AUDT-01`) sudah didokumentasikan lengkap secara visual di **014_UI_SCREEN_CATALOG.md** — komponen, filter, modal detail, dan business rules dasar (append-only, payload before/after, retensi minimal 1 tahun) sudah final di sana, menyelesaikan **GAP-16 (Minor)**: "Tidak ada export audit log dalam format yang bisa dianalisis (CSV/Excel)".

Dokumen ini **tidak mengulang** desain layar tersebut. Fokusnya adalah hal yang menjadi prasyarat agar layar tersebut dapat berfungsi dengan data yang benar dan lengkap: **skema tabel audit, daftar definitif event yang wajib diaudit di setiap modul bisnis, mekanisme penegakan append-only di level database, kebijakan retensi/arsip konkret, dan bagaimana modul AI (010) serta modul dokumen (048/049) terhubung ke jejak audit yang sama.**

---

## 2. SCOPE

### In Scope

- Skema tabel `audit_logs` lengkap
- Daftar event audit wajib per modul bisnis (matrix lintas-modul)
- Mekanisme penegakan append-only di level database (bukan hanya konvensi aplikasi)
- Struktur payload before/after dan justifikasi mengapa ini bukan pelanggaran prinsip anti-JSON-blob
- Kebijakan retensi dan strategi arsip data lampau
- Mekanisme export CSV (detail teknis di balik tombol yang sudah didesain di 014)
- Bagaimana audit trail terhubung ke aktivitas AI (010) dan aktivitas dokumen (048/049)

### Out of Scope

- Layout visual, filter UI, modal JSON diff → **014_UI_SCREEN_CATALOG.md** (AUDT-01) — dirujuk, tidak diulang
- Detail audit khusus permintaan AI (rate limiting, cost tracking) → **010_AI_INTEGRATION_ARCHITECTURE.md** — modul ini hanya mendefinisikan kontrak penyimpanan bersama
- Backup/disaster recovery untuk data audit → **060_DOCKER_DEPLOYMENT_AND_OPERATIONS.md**

---

## 3. GAP TRACEABILITY

| Referensi | Deskripsi | Bagaimana Diselesaikan |
|---|---|---|
| **GAP-16 (Minor)** | Tidak ada export audit log dalam format yang bisa dianalisis (CSV/Excel); compliance audit memerlukan export log, hanya bisa dilihat via UI saat ini | Bagian 7 (Export Mechanism) |
| **FR083** | Audit Trail (dirujuk 014) | Seluruh dokumen ini |
| **Prinsip Index — AI Audit** | "Seluruh request AI tercatat di audit log (siapa, kapan, fitur AI apa, berhasil/gagal) — terhubung ke modul 052" | Bagian 6.3 (Event Audit AI) |
| **Prinsip Index — Cost Control AI** | Cost control & rate limiting AI sebagai kebijakan terpusat | Audit log menjadi sumber data untuk kebijakan tersebut, didesain teknis penuh di 010 |

---

## 4. DATA MODEL

### 4.1 Entitas `audit_logs`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | UUID | PK | Identifier log |
| `actor_user_id` | UUID | FK → `users.id`, NULLABLE | Siapa yang melakukan aksi. NULLABLE untuk aksi sistem otomatis (mis. eskalasi SLA otomatis — lihat 4.3) |
| `actor_ip_address` | VARCHAR(45) | NULLABLE | IP address (mendukung IPv6); NULL untuk aksi sistem otomatis |
| `action` | VARCHAR(50) | NOT NULL | Kode aksi, lihat daftar resmi di Bagian 5 |
| `entity_type` | VARCHAR(50) | NOT NULL | Nama entitas yang terdampak (mis. `prospect`, `project`, `user`, `config_sla`, `document`) |
| `entity_id` | UUID | NULLABLE | ID entitas terdampak; NULLABLE untuk aksi yang tidak terikat satu entitas (mis. `LOGIN`) |
| `payload_before` | JSONB | NULLABLE | Snapshot kondisi entitas sebelum perubahan; NULL untuk aksi `CREATE` |
| `payload_after` | JSONB | NULLABLE | Snapshot kondisi entitas setelah perubahan; NULL untuk aksi `DELETE` |
| `metadata` | JSONB | NULLABLE | Konteks tambahan spesifik aksi (lihat Bagian 5 dan 6) yang tidak masuk before/after, mis. `{ "reason": "..." }` untuk approval |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu kejadian — **kolom ini adalah satu-satunya timestamp**, tidak ada `updated_at` (lihat Bagian 4.2) |

**Inferred Requirement (IR-052-01):** Penggunaan tipe `JSONB` pada `payload_before`/`payload_after`/`metadata` **tampak** bertentangan dengan prinsip anti-JSON-blob di 007_DATA_ARCHITECTURE_PRINCIPLES. Ini secara sengaja dikecualikan karena perbedaan sifat data: prinsip anti-JSON-blob menyasar **data transaksional terstruktur yang akan di-query, difilter, dan divalidasi skema oleh aplikasi** (contoh kasus nyata yang ditemukan BA Review: jawaban checklist pertanyaan, daftar kompetitor) — data semacam itu butuh integritas relasional. Payload audit, sebaliknya, secara definisi adalah **snapshot historis read-only** dari struktur entitas yang *sudah* berubah-ubah dari waktu ke waktu (skema `projects` hari ini berbeda dari `projects` setahun lalu jika ada migrasi kolom) — memaksakan payload audit ke kolom relasional kaku akan merusak kemampuannya merekam bentuk data **apa adanya pada saat kejadian terjadi**, yang justru adalah tujuan utama audit trail. JSONB di sini berperan sebagai arsip, bukan sebagai sumber kebenaran operasional aplikasi.

### 4.2 Mengapa Tidak Ada `updated_at` atau Soft-Delete

**Business Rule BR-AUDIT-01 (penegasan dari 014 BR-AUDT-01):** Tabel `audit_logs` **tidak memiliki** kolom `updated_at`, `is_deleted`, maupun `deleted_at` — berbeda dari konvensi tabel lain di sistem (007_DATA_ARCHITECTURE_PRINCIPLES menetapkan soft-delete sebagai standar). Audit log adalah satu-satunya kategori tabel yang dikecualikan dari pola soft-delete, karena soft-delete mengandaikan baris *bisa* dianggap "terhapus" oleh aplikasi — sedangkan baris audit log tidak boleh memiliki status apa pun selain "ada secara permanen". Pengecualian ini didokumentasikan secara eksplisit agar tidak disalahartikan sebagai inkonsistensi desain saat review skema database (053/054).

---

## 5. APPEND-ONLY ENFORCEMENT (TEKNIS)

**Business Rule BR-AUDIT-02 (memperkuat BR-AUDT-01 di 014 — level implementasi):** Sifat "append-only" tidak boleh hanya menjadi konvensi di kode aplikasi (yang berisiko dilanggar oleh bug atau akses langsung ke database), melainkan **ditegakkan di level database**:

| Mekanisme | Implementasi |
|---|---|
| Mencegah `UPDATE` | Trigger database (`BEFORE UPDATE`) pada tabel `audit_logs` yang menolak (`RAISE EXCEPTION`) setiap percobaan update, tanpa kecuali — termasuk dari akun database admin aplikasi |
| Mencegah `DELETE` | Trigger database (`BEFORE DELETE`) yang menolak setiap percobaan delete dengan cara yang sama |
| Akses tulis terbatas | Hanya service layer backend yang memiliki kredensial `INSERT` ke tabel ini; tidak ada endpoint API yang mengekspos `PUT`/`PATCH`/`DELETE` untuk `audit_logs` (selaras 014: tidak ada aksi edit/hapus di layar AUDT-01) |
| Pengecualian arsip (Bagian 6) | Proses arsip (memindahkan baris lampau ke storage dingin) **bukan** `DELETE` konvensional — dijalankan lewat prosedur terkontrol yang juga tercatat sebagai event audit-nya sendiri (`AUDIT_LOG_ARCHIVED`), bukan penghapusan diam-diam |

---

## 6. EVENT AUDIT WAJIB PER MODUL

Tabel berikut adalah **daftar definitif** aksi yang wajib menghasilkan baris `audit_logs` baru di setiap modul bisnis. Modul yang sudah didesain sebelumnya (015-045) diasumsikan mengimplementasikan pencatatan ini sesuai daftar berikut — dokumen ini menjadi rujukan tunggal lintas-modul agar tidak ada modul yang luput.

### 6.1 Autentikasi & Akses (019, 020)

| Aksi | `action` | `entity_type` | Catatan |
|---|---|---|---|
| Login sukses | `LOGIN_SUCCESS` | `user` | Mencatat IP (selaras BR-AUDT-03 di 014) |
| Login gagal | `LOGIN_FAILED` | `user` | Termasuk percobaan dengan username tidak valid (untuk deteksi brute-force) |
| Logout | `LOGOUT` | `user` | — |
| Akun terkunci (5x gagal) | `ACCOUNT_LOCKED` | `user` | — |

### 6.2 Entitas Bisnis Inti (032-038)

| Aksi | `action` | Catatan |
|---|---|---|
| Create | `CREATE` | `payload_before = NULL`, `payload_after` = state awal |
| Update | `UPDATE` | `payload_before`/`payload_after` = state sebelum/sesudah |
| Delete (soft-delete) | `DELETE` | `payload_after` = NULL atau menandai `is_deleted: true` |
| Perubahan status (state machine) | `STATUS_CHANGE` | `metadata` menyertakan `{ "fromStatus": "...", "toStatus": "...", "trigger": "..." }` — dicatat terpisah dari `UPDATE` generik karena perubahan status memiliki signifikansi bisnis lebih tinggi dan menjadi dasar 013_GLOBAL_STATE_MACHINE_REFERENCE |
| Approve | `APPROVE` | `metadata` menyertakan tahap approval (selaras 039_APPROVAL_ENGINE_CORE) |
| Kirim Revisi | `REQUEST_REVISION` | `metadata` menyertakan catatan revisi |
| Cancel Proyek | `CANCEL` | Selaras 038_PROJECT_CANCELLATION_MODULE |

### 6.3 Dokumen (048, 049)

| Aksi | `action` | Catatan |
|---|---|---|
| Upload berhasil | `DOCUMENT_UPLOADED` | Selaras 048 Bagian 9.3 — payload minimal sudah ditetapkan di sana, modul ini menjadi tabel penyimpanannya |
| Upload ditolak | `DOCUMENT_UPLOAD_REJECTED` | `metadata` menyertakan kode error (048 Bagian 6.5) |
| Download | `DOCUMENT_DOWNLOADED` | — |
| Akses ditolak | `DOCUMENT_ACCESS_DENIED` | — |
| Versi baru dibuat | `DOCUMENT_VERSION_CREATED` | Selaras 049 Bagian 5.1 langkah 6 — `metadata` menyertakan id versi lama dan baru |
| Soft-delete dokumen | `DOCUMENT_DELETED` | Selaras 049 BR-VER-08 — mencatat seluruh `document_group_id` terdampak |

### 6.4 Konfigurasi (027-031)

| Aksi | `action` | Catatan |
|---|---|---|
| Ubah konfigurasi apa pun | `CONFIG_UPDATED` | `entity_type` = nama spesifik config (mis. `config_sla`, `config_workflow`); `payload_before`/`after` = nilai konfigurasi sebelum/sesudah. Konfigurasi adalah kategori berdampak tinggi (mengubah perilaku sistem untuk semua user) sehingga **selalu** diaudit tanpa pengecualian |

### 6.5 Integrasi AI (010, 011, 050)

Sesuai prinsip resmi index ("Seluruh request AI tercatat di audit log"), setiap pemanggilan AI Service Layer dari fitur apa pun (011_AI_FEATURES_AND_USE_CASES) — termasuk AI Executive Summary Dashboard (050 Bagian 6.7) — wajib menghasilkan baris audit:

| Aksi | `action` | Catatan |
|---|---|---|
| Permintaan AI berhasil | `AI_REQUEST_SUCCESS` | `entity_type` = `ai_feature`; `metadata` = `{ "feature": "...", "provider": "gemini", "tokensUsed": N }` — **tidak pernah** menyimpan isi prompt/response penuh sebagai `payload_after` (lihat catatan keamanan di bawah) |
| Permintaan AI gagal | `AI_REQUEST_FAILED` | `metadata` menyertakan kode error/alasan kegagalan |

**Business Rule BR-AUDIT-03 (batas data sensitif pada audit AI):** Audit log untuk aktivitas AI **tidak boleh** menyimpan isi penuh prompt atau response AI sebagai bagian dari `payload_after`/`metadata` apabila data tersebut berasal dari/mengandung informasi bisnis sensitif (nama customer, isi dokumen RKS, dst. — selaras pembatasan data AI Executive Summary di 050 BR-DASH-AI-02). Audit log mencatat **bahwa** permintaan terjadi dan **hasilnya** (sukses/gagal), bukan **isi lengkap** percakapan dengan AI — detail retensi prompt/response itu sendiri (jika diperlukan untuk debugging) menjadi tanggung jawab logging terpisah yang didesain di 010, bukan tabel `audit_logs` yang dapat diakses lewat layar AUDT-01.

### 6.6 Laporan (051)

| Aksi | `action` | Catatan |
|---|---|---|
| Export laporan | `REPORT_EXPORTED` | Selaras 051 Bagian 6.1 langkah 8 — `metadata` = `{ "reportType": "...", "format": "...", "filters": {...} }` |

---

## 7. RETENTION & ARCHIVAL POLICY

**Business Rule BR-AUDIT-04 (memperkuat BR-AUDT-04 di 014):** Retensi minimal **1 tahun** pada tabel operasional `audit_logs` (dapat di-query langsung lewat layar AUDT-01 dengan performa baik). Data lebih lama dari 1 tahun mengikuti prosedur arsip berikut:

```
1. Job terjadwal (bulanan) memindai baris dengan created_at < (now() - 1 tahun)
2. Baris yang memenuhi kriteria di-export ke cold storage (format Parquet/CSV terkompresi)
   di lokasi storage yang sama prinsipnya dengan 048 Bagian 7 (di luar webroot, tidak public)
3. Setelah verifikasi integritas hasil arsip, baris dipindahkan dari tabel operasional
   (bukan UPDATE/DELETE biasa — lihat pengecualian terkontrol di Bagian 5)
4. Job menulis satu baris audit baru: action = AUDIT_LOG_ARCHIVED,
   metadata = { "rangeFrom": "...", "rangeTo": "...", "rowCount": N, "archiveLocation": "..." }
```

**Business Rule BR-AUDIT-05:** Data yang sudah diarsipkan tetap dapat diambil kembali (restore) oleh Admin untuk keperluan investigasi/compliance jangka panjang, namun proses ini bersifat manual/on-demand (bukan tersedia langsung di layar AUDT-01 pada Fase 1) — ditandai sebagai **Inferred Requirement (IR-052-02)**: BA Review menetapkan "retensi minimal 1 tahun; data lebih lama diarsipkan" tanpa merinci mekanisme arsip itu sendiri; desain di atas adalah interpretasi operasional paling wajar dari instruksi tersebut, mengingat kebutuhan compliance umumnya menuntut kemampuan retrieve meski tidak instan.

---

## 8. EXPORT MECHANISM (DETAIL TEKNIS GAP-16)

Tombol "Export CSV" sudah didesain visualnya di 014; bagian ini merinci implementasi di baliknya.

### 8.1 Alur Export

```
1. User menerapkan filter (User, Tipe Aksi, Entitas, Tanggal) di layar AUDT-01
2. User klik "Export CSV"
3. FE POST /api/admin/audit-logs/export dengan filter aktif
4. BE validasi: filter tanggal WAJIB ada dan rentang tidak boleh melebihi 90 hari per export
   (lihat BR-AUDIT-06 di bawah)
5. BE generate CSV: setiap baris = satu event audit, kolom sesuai DataTable (014: Timestamp,
   User, Aksi, Entitas, Entity ID, IP Address) ditambah kolom Payload Before/After
   sebagai string JSON terformat dalam satu sel (bukan dipecah kolom, karena struktur
   before/after bervariasi per entity_type)
6. BE stream file sebagai response (prinsip sama dengan 048 Bagian 8.1 — tidak pernah
   disimpan sebagai file statis yang dapat diakses ulang)
7. BE tulis baris audit baru: action = AUDIT_LOG_EXPORTED (export terhadap audit log
   itu sendiri tercatat, demi ketertelusuran penuh)
8. FE trigger download otomatis
```

**Business Rule BR-AUDIT-06 (memperkuat BR-AUDT-05 di 014):** 014 sudah menetapkan "tidak bisa export semua log sekaligus tanpa filter". Dokumen ini menambahkan batas konkret: filter tanggal **wajib diisi** dan rentang maksimum **90 hari** per export, untuk mencegah satu permintaan export menghasilkan file berukuran sangat besar yang membebani backend maupun browser. Kebutuhan export rentang lebih panjang (misal audit tahunan untuk compliance eksternal) dilakukan lewat beberapa export berurutan, bukan satu file raksasa.

### 8.2 Format Kolom CSV

| Kolom CSV | Sumber |
|---|---|
| Timestamp | `created_at` (format ISO 8601) |
| User | `actor_user_id` → join nama user, atau `"SYSTEM"` jika NULL |
| Aksi | `action` |
| Entitas | `entity_type` |
| Entity ID | `entity_id` |
| IP Address | `actor_ip_address`, atau kosong jika NULL |
| Payload Before | `payload_before` sebagai string JSON (escaped untuk CSV) |
| Payload After | `payload_after` sebagai string JSON (escaped untuk CSV) |
| Metadata | `metadata` sebagai string JSON (escaped untuk CSV) |

---

## 9. API CONTRACT SUMMARY

| Method | Endpoint | Tujuan | Role |
|---|---|---|---|
| GET | `/api/admin/audit-logs` | List log dengan filter & pagination (selaras 014) | Admin |
| GET | `/api/admin/audit-logs/:id` | Detail satu log (payload before/after penuh untuk modal diff) | Admin |
| POST | `/api/admin/audit-logs/export` | Export CSV dengan filter wajib (Bagian 8) | Admin |

---

## 10. ACCEPTANCE CRITERIA

| # | Kriteria |
|---|---|
| AC-052-01 | Percobaan `UPDATE` atau `DELETE` langsung ke tabel `audit_logs` lewat koneksi database mana pun ditolak oleh trigger, bukan hanya dicegah di layer aplikasi |
| AC-052-02 | Setiap aksi CREATE/UPDATE/DELETE pada entitas bisnis inti (032-038) menghasilkan baris audit dengan `payload_before`/`payload_after` yang akurat |
| AC-052-03 | Perubahan status (state machine) entitas menghasilkan event `STATUS_CHANGE` terpisah dari `UPDATE` generik, dengan `fromStatus`/`toStatus` di metadata |
| AC-052-04 | Setiap perubahan konfigurasi apa pun (027-031) tercatat sebagai `CONFIG_UPDATED` tanpa pengecualian |
| AC-052-05 | Setiap pemanggilan AI Service Layer dari fitur apa pun tercatat sebagai `AI_REQUEST_SUCCESS`/`AI_REQUEST_FAILED`, tanpa menyimpan isi prompt/response sensitif di kolom yang dapat diakses lewat layar AUDT-01 |
| AC-052-06 | Login sukses dan gagal tercatat lengkap dengan IP address |
| AC-052-07 | Export CSV ditolak jika filter tanggal tidak diisi atau rentang melebihi 90 hari |
| AC-052-08 | Baris audit yang berusia lebih dari 1 tahun masih dapat diambil kembali melalui prosedur restore manual, tidak hilang permanen |
| AC-052-09 | Proses arsip data lampau menghasilkan baris audit `AUDIT_LOG_ARCHIVED` sebagai bukti proses berjalan, bukan penghapusan diam-diam |
| AC-052-10 | Export terhadap audit log itu sendiri (aksi export) juga menghasilkan baris audit baru (`AUDIT_LOG_EXPORTED`) |

---

*Dokumen ini adalah versi 1.0 dari 052 Audit Trail Module untuk KINETIC CRM.*
*Cross-reference dengan dokumen: 014 (UI Screen Catalog — AUDT-01), 007 (Data Architecture Principles), 008 (Security Architecture), 010 (AI Integration Architecture), 048/049 (Document Modules), 039 (Approval Engine Core), 057 (API Endpoint Specification).*

---
**Akhir Dokumen 052 — Audit Trail Module**
**KINETIC CRM | Confidential / Internal | Versi 1.0 | Juni 2025**
