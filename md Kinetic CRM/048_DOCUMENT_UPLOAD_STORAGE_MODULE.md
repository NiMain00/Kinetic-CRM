# 048 — DOCUMENT UPLOAD & STORAGE MODULE
## KINETIC CRM — Modul Unggah dan Penyimpanan Dokumen

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 048 |
| **Nama Dokumen** | Document Upload & Storage Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0 |
| **Dokumen Terkait** | 022 (Master Tipe Dokumen — MD-11), 031 (CFG-13 Upload Config), 008 (Security Architecture), 014 (UI Screen Catalog — komponen FileDropzone), 049 (Document Versioning Module), 057 (API Endpoint Specification), 052 (Audit Trail Module) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Backend Developer, Frontend Developer, Security Engineer, DevOps Engineer, QA Engineer, Business Analyst

---

## 1. PURPOSE

Modul ini mendefinisikan secara lengkap bagaimana KINETIC CRM menangani **unggah, penyimpanan, dan pengunduhan dokumen** yang melekat pada entitas bisnis (Prospek, RKS, LPHS/SIOS, Harga Penawaran, Pemenang Tender/SPK, dan lampiran proyek lainnya).

Dokumen sumber (BA Review) mengidentifikasi kebutuhan ini melalui dua jalur:
1. **CFG-13 (Konfigurasi Ukuran & Tipe File Upload)** — batas ukuran dan tipe file per jenis dokumen saat ini bersifat hardcode dan global, padahal kebutuhan upload berbeda per tahap tender. BA Review menandai ini sebagai gap dengan prioritas **Low** namun tetap wajib diselesaikan karena berdampak pada maintainability jangka panjang.
2. **MD-11 (Master Tipe Dokumen)** — klasifikasi dokumen (RKS, LPHS, SIOS, SPK, Invoice, dll.) yang menjadi dasar pengelompokan dokumen di UI dan dasar penerapan aturan upload per tipe.

Modul ini menjawab pertanyaan operasional: dokumen disimpan di mana, divalidasi bagaimana, diunduh oleh siapa, dan diaudit sejauh mana. Modul **versioning** dokumen (apa yang terjadi ketika dokumen yang sama diunggah ulang) didesain terpisah di **049_DOCUMENT_VERSIONING_MODULE.md** (GAP-14) — dokumen ini menyediakan fondasi penyimpanan fisik yang dipakai modul tersebut.

---

## 2. SCOPE

### In Scope

- Model data dokumen (entitas `documents` dan relasinya ke entitas bisnis)
- Mekanisme upload (multipart, validasi client & server, dropzone)
- Strategi penyimpanan fisik (lokasi di luar webroot, penamaan file, struktur direktori)
- Mekanisme download terautentikasi (streaming, bukan static file serving)
- Validasi tipe MIME dan ukuran file, termasuk sumber konfigurasinya (CFG-13)
- Business rules upload per konteks (RKS, LPHS/SIOS, Harga, Pemenang/SPK, Dokumen Lainnya)
- Penanganan error upload (file terlalu besar, tipe tidak diizinkan, upload gagal di tengah jalan)
- API contract untuk upload dan download
- Keamanan: pencegahan path traversal, malware/MIME-sniffing, akses tidak sah
- Audit trail untuk aktivitas upload/download

### Out of Scope

- Versioning dokumen (riwayat versi, replace vs versi baru) → **049_DOCUMENT_VERSIONING_MODULE.md**
- Konfigurasi UI untuk mengatur batas ukuran/tipe per jenis dokumen → **031_CONFIG_SYSTEM_PERIOD_UPLOAD_INTEGRATION.md** (CFG-13), modul ini hanya mengonsumsi konfigurasi tersebut
- Klasifikasi/master tipe dokumen → **022_MASTER_PROJECT_STATUS_AND_DOCUMENT_TYPE.md** (MD-11), modul ini hanya mereferensikan
- Tampilan layar per tab (Tab Dokumen, Tab RKS, dll.) → **014_UI_SCREEN_CATALOG.md**
- Backup & disaster recovery untuk storage dokumen → **060_DOCKER_DEPLOYMENT_AND_OPERATIONS.md**

---

## 3. BUSINESS CONTEXT & GAP TRACEABILITY

| Referensi | Deskripsi | Bagaimana Diselesaikan di Modul Ini |
|---|---|---|
| **CFG-13** | Batas ukuran dan tipe file upload saat ini hardcode & global; kebutuhan upload berbeda per tahap tender | Batas disimpan di tabel `document_type_configs` (per tipe dokumen), dibaca saat validasi — lihat Bagian 6 |
| **MD-11** | Klasifikasi dokumen (RKS, LPHS, SIOS, SPK, Invoice, dll.) untuk navigasi & audit | Setiap baris `documents` wajib memiliki `document_type_id` yang merujuk ke master tipe dokumen (022) |
| **FR070** | Upload dokumen dengan validasi tipe/ukuran | Bagian 5 (Upload Flow) & Bagian 6 (Validasi) |
| **FR071** | Storage di luar webroot, download terautentikasi | Bagian 7 (Strategi Penyimpanan) & Bagian 8 (Download Flow) |

**Inferred Requirement (IR-048-01):** BA Review dan PRD tidak secara eksplisit menyatakan "dokumen disimpan di luar webroot" sebagai kalimat literal, namun ini adalah konsekuensi langsung dari kombinasi: (a) seluruh dokumen tender bersifat rahasia bisnis (RKS, harga penawaran, SPK) yang tidak boleh diakses tanpa otorisasi, dan (b) prinsip keamanan baku OWASP A01 (Broken Access Control) yang menjadi acuan 008_SECURITY_ARCHITECTURE. Jika file disimpan di dalam webroot dan dapat diakses lewat URL statis langsung, validasi role/scope di layer aplikasi akan bisa dilewati. Oleh karena itu storage di luar webroot + download terautentikasi ditetapkan sebagai requirement wajib, ditandai sebagai inferred karena tidak dieja secara verbatim di sumber.

---

## 4. DATA MODEL

### 4.1 Entitas `documents`

Tabel tunggal `documents` menampung seluruh file yang diunggah ke sistem, terlepas dari entitas bisnis mana yang menjadi induknya. Pendekatan **polymorphic-lite** dipakai: bukan freeform JSON (melanggar prinsip 007_DATA_ARCHITECTURE_PRINCIPLES), melainkan pasangan kolom `owner_type` + `owner_id` yang dibatasi oleh `CHECK constraint` pada nilai `owner_type` yang diperbolehkan.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | UUID | PK | Identifier dokumen |
| `owner_type` | VARCHAR(30) | NOT NULL, CHECK IN (`'prospect'`, `'project_rks'`, `'project_lphs'`, `'project_sios'`, `'project_harga'`, `'project_pemenang'`, `'project_other'`) | Entitas bisnis induk |
| `owner_id` | UUID | NOT NULL | FK logis ke entitas induk (FK fisik tidak memungkinkan karena polymorphic; divalidasi di service layer) |
| `document_type_id` | UUID | FK → `document_types.id`, NOT NULL | Klasifikasi dokumen (MD-11) |
| `file_name_original` | VARCHAR(255) | NOT NULL | Nama file asli saat diunggah (untuk ditampilkan ke user) |
| `file_name_stored` | VARCHAR(255) | NOT NULL, UNIQUE | Nama file fisik di storage (UUID-based, lihat Bagian 7.2) |
| `file_path` | VARCHAR(500) | NOT NULL | Path relatif terhadap root storage (bukan path absolut, bukan URL publik) |
| `mime_type` | VARCHAR(150) | NOT NULL | MIME type hasil deteksi server (bukan dari header client — lihat Bagian 6.3) |
| `file_size_bytes` | BIGINT | NOT NULL | Ukuran file dalam byte |
| `checksum_sha256` | VARCHAR(64) | NOT NULL | Hash integritas file, dihitung saat upload |
| `version_number` | INT | NOT NULL, DEFAULT 1 | Nomor versi (detail lengkap di 049) |
| `is_current_version` | BOOLEAN | NOT NULL, DEFAULT TRUE | Penanda versi aktif (detail lengkap di 049) |
| `uploaded_by` | UUID | FK → `users.id`, NOT NULL | Siapa yang mengunggah |
| `uploaded_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Kapan diunggah |
| `branch_id` | UUID | FK → `branches.id`, NOT NULL | Cabang pemilik (untuk scope query — lihat Bagian 9.2) |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT FALSE | Soft-delete (007_DATA_ARCHITECTURE_PRINCIPLES) |
| `deleted_at` | TIMESTAMP | NULLABLE | Waktu soft-delete |
| `deleted_by` | UUID | FK → `users.id`, NULLABLE | Siapa yang menghapus |

**Business Rule BR-DOC-01:** `owner_type` + `owner_id` tidak pernah divalidasi via foreign key fisik karena satu kolom `owner_id` bisa merujuk ke tabel berbeda-beda (`prospects.id`, `projects.id`, dst.) bergantung `owner_type`. Validasi keberadaan dan kepemilikan dilakukan di service layer backend sebelum insert, dan dicakup oleh test case keamanan di 062 (kategori: broken object reference).

**Business Rule BR-DOC-02:** Kolom `checksum_sha256` dipakai untuk dua hal: (a) mendeteksi file korup setelah transfer, (b) sebagai dasar deduplikasi opsional di masa depan (Fase 2+), bukan untuk Fase 1.

### 4.2 Entitas `document_types` (Referensi ke MD-11)

Tabel ini didefinisikan penuh di **022_MASTER_PROJECT_STATUS_AND_DOCUMENT_TYPE.md**; modul ini hanya merujuk kolom yang relevan untuk validasi upload:

| Kolom (relevan) | Keterangan |
|---|---|
| `id` | PK |
| `code` | Kode unik, contoh: `RKS`, `LPHS`, `SIOS`, `SPK`, `INVOICE`, `OTHER` |
| `name` | Nama tampilan, contoh: "Dokumen Tender (RKS)" |
| `is_active` | Soft-disable tipe dokumen |

### 4.3 Entitas `document_type_configs` (CFG-13)

Tabel ini adalah implementasi konkret CFG-13 — didesain penuh di **031_CONFIG_SYSTEM_PERIOD_UPLOAD_INTEGRATION.md**, dirujuk di sini karena modul upload membaca tabel ini setiap kali validasi dijalankan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | PK |
| `document_type_id` | UUID | FK → `document_types.id` |
| `max_file_size_mb` | INT | Batas ukuran maksimum per tipe dokumen (admin-configurable) |
| `allowed_mime_types` | TEXT | Daftar MIME type diizinkan, dipisah koma (mis. `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document`) |
| `max_files_per_upload` | INT | Batas jumlah file per aksi upload (default 1 kecuali ditentukan lain) |
| `updated_by` | UUID | FK → `users.id` |
| `updated_at` | TIMESTAMP | Audit perubahan konfigurasi |

**Business Rule BR-DOC-03:** Jika tidak ditemukan baris konfigurasi untuk suatu `document_type_id` (misalnya tipe dokumen baru ditambahkan admin tapi belum dikonfigurasi), sistem **wajib** memakai nilai default sistem (`max_file_size_mb = 25`, `allowed_mime_types` = PDF & DOCX saja) — bukan menolak upload secara membisu maupun mengizinkan tanpa batas. Default ini selaras dengan batas 25 MB yang sudah konsisten dipakai di seluruh layar upload pada FE Spec sumber (Tab RKS, Tab Harga).

---

## 5. UPLOAD FLOW

### 5.1 Alur End-to-End

```
1. User memilih/drag file ke FileDropzone (FE)
2. FE validasi awal (size, MIME dari ekstensi) — Bagian 6.1
3. FE kirim POST /api/documents/upload (multipart/form-data)
   payload: file, ownerType, ownerId, documentTypeId
4. BE terima file → simpan ke lokasi temporer
5. BE validasi ulang (size, MIME-sniffing aktual, ownerType+ownerId valid & milik user) — Bagian 6.2-6.4
   Jika gagal validasi → hapus file temporer → return 422 dengan pesan spesifik
6. BE generate file_name_stored (UUID) → pindahkan dari temporer ke lokasi permanen (Bagian 7)
7. BE hitung checksum_sha256
8. BE insert baris ke tabel `documents`
9. BE tulis audit log entry (siapa, kapan, dokumen apa, owner apa) → 052_AUDIT_TRAIL_MODULE
10. BE return 201 dengan metadata dokumen (id, fileName, size, uploadedAt)
11. FE tampilkan file di UI (nama, ukuran, ikon, tombol download) + toast sukses
```

**Business Rule BR-DOC-04:** Validasi di langkah 2 (client) **tidak pernah** dianggap cukup. Validasi di langkah 5 (server) bersifat wajib dan otoritatif — validasi client hanya bertujuan memberi feedback cepat ke user, bukan kontrol keamanan. Ini konsisten dengan prinsip "never trust the client" di 008_SECURITY_ARCHITECTURE.

**Business Rule BR-DOC-05:** Upload bersifat atomik per file: jika langkah 6-9 gagal di mana pun, seluruh operasi di-rollback (file fisik dihapus, tidak ada baris `documents` yang tertinggal). Tidak boleh ada kondisi "file ada di disk tapi tidak ada record di DB" atau sebaliknya.

### 5.2 Konteks Upload per Modul Bisnis

Tabel ini hanya merangkum *konteks pemicu* upload (siapa, kapan, owner_type apa) — detail field dan layout form tetap menjadi tanggung jawab 014_UI_SCREEN_CATALOG dan modul bisnis terkait (032-038). Dirangkum di sini agar tim backend memahami variasi `owner_type` yang harus didukung endpoint upload generik.

| Konteks | `owner_type` | `document_type_id` Default | Role yang Bisa Upload | Modul Terkait |
|---|---|---|---|---|
| Dokumen Tender (RKS) | `project_rks` | `RKS` | Cabang | 034_RKS_MODULE |
| Draft LPHS | `project_lphs` | `LPHS` | Cabang | 035_LPHS_SIOS_MODULE |
| Draft SIOS | `project_sios` | `SIOS` | Cabang | 035_LPHS_SIOS_MODULE |
| Dokumen Pendukung Harga | `project_harga` | `OTHER` | Cabang | 036_HARGA_KOMPETITOR_MODULE |
| Dokumen SPK/Kontrak (saat Menang) | `project_pemenang` | `SPK` | Cabang | 037_PEMENANG_DELIVERY_MODULE |
| Surat Kekalahan (saat Kalah) | `project_pemenang` | `OTHER` | Cabang | 037_PEMENANG_DELIVERY_MODULE |
| Dokumen Tambahan (Tab Dokumen) | `project_other` | Pilihan bebas dari master | Semua role dengan akses proyek | 014 — SUB-SCREEN PROJ-03j |

**Business Rule BR-DOC-06:** Tab "Dokumen" pada Detail Proyek adalah satu-satunya titik upload yang mengizinkan pemilihan `document_type_id` secara bebas oleh user. Seluruh titik upload lain (RKS, LPHS, SIOS, Harga, Pemenang) mengirim `document_type_id` secara implisit/terkunci sesuai konteks form — user tidak memilih tipe dokumen secara manual di form tersebut, untuk mencegah misklasifikasi yang akan merusak akurasi filter dan audit.

---

## 6. VALIDATION RULES

Validasi dijalankan berlapis: client (UX, bukan keamanan) dan server (otoritatif, lihat BR-DOC-04).

### 6.1 Validasi Sisi Client (FE)

| Aturan | Implementasi |
|---|---|
| Ukuran file | Dibaca dari `document_type_configs` via endpoint konfigurasi saat form dimuat; dropzone menolak file melebihi batas sebelum upload dimulai |
| Tipe file (ekstensi) | react-dropzone `accept` prop diisi dari `allowed_mime_types` yang sama |
| Jumlah file | Dropzone dikonfigurasi `maxFiles` sesuai `max_files_per_upload` |
| Pesan error | Inline di bawah dropzone: "Ukuran file melebihi X MB" / "Tipe file tidak didukung. Gunakan: PDF, DOCX" |

### 6.2 Validasi Ukuran (Server)

- Ukuran aktual file yang diterima diukur di server (bukan dipercaya dari header `Content-Length` client) dan dibandingkan terhadap `max_file_size_mb` dari `document_type_configs` (atau default BR-DOC-03).
- Jika melebihi batas: response `422` dengan kode error `FILE_TOO_LARGE`, payload menyertakan batas yang berlaku agar FE dapat menampilkan pesan akurat.

### 6.3 Validasi Tipe File / MIME-Sniffing (Server)

**Business Rule BR-DOC-07 (kritikal keamanan):** Server **tidak boleh** memercayai `Content-Type` header yang dikirim browser maupun ekstensi nama file. Server wajib melakukan **MIME-sniffing** terhadap byte konten file yang sebenarnya (magic number/file signature) untuk menentukan tipe file aktual, lalu mencocokkan hasil sniffing terhadap `allowed_mime_types`. Ini mencegah teknik upload malware yang menyamarkan file executable dengan ekstensi `.pdf`.

- Jika MIME hasil sniffing tidak cocok dengan `allowed_mime_types`: tolak dengan `422` kode error `INVALID_FILE_TYPE`.
- Jika MIME hasil sniffing **tidak cocok dengan ekstensi nama file** (mis. file `.pdf` yang isinya sebenarnya HTML): tolak dengan `422` kode error `FILE_TYPE_MISMATCH`, terlepas apakah MIME hasil sniffing-nya sendiri masuk daftar izin — ketidaksesuaian ini sendiri adalah indikator percobaan spoofing.

### 6.4 Validasi Kepemilikan & Otorisasi (Server)

| Validasi | Aturan |
|---|---|
| `owner_type` valid | Harus salah satu nilai dalam CHECK constraint (Bagian 4.1); nilai lain ditolak `400` |
| `owner_id` eksis | Entitas dengan ID tersebut harus ada di tabel yang sesuai (`prospects`, `projects`, dst.); jika tidak → `404` |
| Scope kepemilikan | User yang mengunggah harus memiliki akses ke entitas induk sesuai aturan RBAC scope (020_AUTHORIZATION_ENFORCEMENT_SPEC) — misal role Cabang hanya boleh upload ke proyek miliknya sendiri; pelanggaran → `403` |
| Status entitas mengizinkan upload | Sebagian entitas mengunci upload setelah status tertentu (misal RKS read-only setelah disubmit, kecuali status `revision`) — divalidasi terhadap state machine di 013_GLOBAL_STATE_MACHINE_REFERENCE; pelanggaran → `409 CONFLICT` |
| `document_type_id` aktif | Tipe dokumen yang dipilih harus `is_active = true` di master; jika tidak → `422` |

### 6.5 Tabel Kode Error Upload

| HTTP Status | Kode Error | Pesan untuk User |
|---|---|---|
| 422 | `FILE_TOO_LARGE` | "Ukuran file melebihi batas maksimum {X} MB untuk tipe dokumen ini" |
| 422 | `INVALID_FILE_TYPE` | "Tipe file tidak didukung untuk dokumen ini. Tipe yang diizinkan: {daftar}" |
| 422 | `FILE_TYPE_MISMATCH` | "File tidak dapat diverifikasi keamanannya. Silakan unggah ulang file asli" |
| 422 | `TOO_MANY_FILES` | "Maksimum {X} file per unggahan" |
| 400 | `INVALID_OWNER_TYPE` | "Permintaan tidak valid" (pesan generik — detail teknis hanya di log server) |
| 404 | `OWNER_NOT_FOUND` | "Data terkait tidak ditemukan" |
| 403 | `FORBIDDEN_UPLOAD` | "Anda tidak memiliki akses untuk mengunggah dokumen ke data ini" |
| 409 | `UPLOAD_LOCKED` | "Dokumen tidak dapat diunggah karena status saat ini tidak mengizinkan perubahan" |
| 500 | `UPLOAD_FAILED` | "Gagal mengunggah file. Silakan coba lagi" |

---

## 7. STORAGE STRATEGY

### 7.1 Prinsip Penyimpanan di Luar Webroot

**Business Rule BR-DOC-08 (kritikal keamanan, FR071):** Direktori penyimpanan dokumen **tidak boleh** berada di dalam direktori yang di-serve langsung oleh web server (Nginx) atau dapat diakses lewat URL statis. Struktur direktori container backend:

```
/app/                       ← webroot/application code (PUBLIC-facing via Nginx reverse proxy ke BE)
/storage/                   ← TIDAK di-mount sebagai static-served path
  └── documents/
      └── {branch_id}/
          └── {owner_type}/
              └── {yyyy}/{mm}/
                  └── {file_name_stored}
```

- Volume `/storage/documents` di-mount sebagai **Docker volume terpisah** (detail mounting di 060_DOCKER_DEPLOYMENT_AND_OPERATIONS) yang hanya dapat diakses oleh proses backend, bukan oleh Nginx static file serving.
- Partisi berdasarkan `branch_id` mempermudah penerapan kebijakan retensi/arsip per cabang di masa depan dan membatasi blast radius bila satu direktori cabang bermasalah.
- Partisi berdasarkan `{yyyy}/{mm}` (bulan upload) mencegah satu direktori berisi puluhan ribu file flat, yang akan memperlambat operasi filesystem.

### 7.2 Konvensi Penamaan File Fisik

**Business Rule BR-DOC-09:** `file_name_stored` **selalu** berupa UUID v4 (mis. `8f14e45f-ceea-4c54-bf45-1d2c3b9a1234.pdf`) — **tidak pernah** memakai `file_name_original` secara langsung. Alasan:
1. **Keamanan** — mencegah path traversal (`../../etc/passwd`) dan injeksi karakter berbahaya dari nama file yang dikontrol user.
2. **Mencegah collision** — dua file dengan nama asli identik dari cabang berbeda tidak akan saling menimpa.
3. **Mencegah kebocoran informasi via nama file** — nama file asli (yang mungkin berisi nama customer/proyek sensitif) tidak pernah terlihat di URL atau log server tingkat infrastruktur.

Ekstensi file pada `file_name_stored` tetap dipertahankan (diturunkan dari hasil MIME-sniffing, bukan dari input user) agar tooling filesystem-level tetap dapat mengenali tipe file bila diperlukan untuk operasional/forensik.

### 7.3 Mengapa Bukan Object Storage (S3-Compatible) di Fase 1

**Inferred Requirement (IR-048-02):** PRD dan BA Review tidak menyebutkan kebutuhan object storage eksternal (S3/MinIO) untuk Fase 1, dan seluruh arsitektur deployment yang dirujuk index (Docker Compose, single-host) mengasumsikan volume lokal. Filesystem lokal dengan Docker volume dipilih untuk Fase 1 karena kompleksitas operasional lebih rendah dan skala data Fase 1 (dokumen tender per cabang) belum membutuhkan object storage terdistribusi. **Migrasi ke object storage S3-compatible** ditandai sebagai kandidat Fase 2+ dan dicatat di 064_FUTURE_ENHANCEMENT_ROADMAP — desain `file_path` sebagai path relatif (bukan absolut OS-specific) di Bagian 4.1 secara sengaja dipilih agar migrasi tersebut tidak memerlukan perubahan skema data, hanya perubahan implementasi service layer penyimpanan.

---

## 8. DOWNLOAD FLOW

### 8.1 Prinsip: Streaming Terautentikasi, Bukan Static File Serving

**Business Rule BR-DOC-10 (FR071):** Dokumen **tidak pernah** diunduh melalui URL statis langsung ke file di disk. Satu-satunya jalur download adalah:

```
GET /api/documents/:id/download
```

Endpoint ini diproteksi oleh middleware autentikasi yang sama dengan endpoint API lainnya (008_SECURITY_ARCHITECTURE), dan backend men-stream isi file dari `/storage/documents/...` sebagai response — file tidak pernah disajikan sebagai aset statis yang dapat ditebak/diakses langsung lewat path.

### 8.2 Alur End-to-End

```
1. FE memanggil GET /api/documents/:id/download dengan Authorization header (Bearer token)
2. BE validasi token & ambil identitas user — selaras 019_AUTHENTICATION_SESSION_MODULE
3. BE ambil baris `documents` berdasarkan :id; jika is_deleted=true atau tidak ada → 404
4. BE validasi scope kepemilikan: apakah user berhak mengakses owner_type+owner_id terkait
   (aturan sama dengan BR-DOC-04 pada Bagian 6.4, arah download)
   Jika tidak berhak → 403 (BUKAN 404 — lihat catatan keamanan di bawah)
5. BE baca file dari file_path di storage
6. BE set response header:
   Content-Type: {mime_type tersimpan}
   Content-Disposition: attachment; filename="{file_name_original}"
7. BE stream isi file ke response body
8. BE tulis audit log entry (siapa mengunduh dokumen apa, kapan) → 052_AUDIT_TRAIL_MODULE
9. FE memicu browser save-as menggunakan filename asli dari header
```

**Catatan keamanan penting:** Pada langkah 4, percobaan akses dokumen yang ada tetapi di luar scope user **wajib direspons `403 Forbidden`**, bukan `404 Not Found`, supaya konsisten dengan kebijakan response code yang sudah dipakai endpoint lain di sistem (lihat pola response code di Bagian 6.5 dan 020_AUTHORIZATION_ENFORCEMENT_SPEC) — hal ini diberlakukan sebagai standar lintas-API, bukan eksklusif untuk dokumen.

### 8.3 Akses dari Tab Dokumen Berdasarkan Kategori

Sebagaimana ditetapkan di FE Spec sumber untuk Tab Dokumen (PROJ-03j di 014), dokumen ditampilkan **dikelompokkan per tipe dokumen** (RKS, LPHS, SIOS, Harga, Kontrak, Lainnya) dengan badge versi jika ada riwayat lebih dari satu versi. Modul ini menyediakan field `document_type_id` dan `version_number` yang menjadi dasar pengelompokan dan badge tersebut — implementasi tampilan tetap mengikuti 014 dan detail versi mengikuti 049.

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Ringkasan Ancaman dan Mitigasi

| Ancaman | Mitigasi |
|---|---|
| Path traversal lewat nama file | `file_name_stored` selalu UUID, tidak pernah dari input user (BR-DOC-09) |
| Upload malware menyamar sebagai dokumen | MIME-sniffing wajib di server, bukan trust client header (BR-DOC-07) |
| Akses dokumen lintas-cabang/lintas-role tanpa otorisasi | Download wajib lewat endpoint terautentikasi + validasi scope (BR-DOC-10); tidak ada static file serving |
| Enumerasi ID dokumen untuk menebak dokumen lain | UUID v4 untuk `id` (bukan auto-increment integer) mempersulit enumerasi sekuensial |
| Denial-of-service via file besar berulang | Validasi ukuran di server sebelum file selesai diterima penuh (streaming validation, bukan buffer seluruh file ke memori dahulu) — detail mekanisme streaming menjadi tanggung jawab implementasi BE sesuai 008_SECURITY_ARCHITECTURE |
| Kebocoran informasi lewat pesan error | Pesan error yang ditampilkan ke user bersifat generik untuk kasus yang menyentuh existensi data lintas-tenant (mis. `INVALID_OWNER_TYPE` tidak membocorkan owner_type valid apa saja) |

### 9.2 Data Scoping pada Query Dokumen

**Business Rule BR-DOC-11:** Setiap query yang menampilkan daftar dokumen (mis. `GET /api/projects/:id/documents`) wajib menerapkan scope yang sama dengan entitas induknya — kolom `branch_id` pada tabel `documents` bukanlah sumber kebenaran independen untuk otorisasi, melainkan optimisasi indeks; keputusan otorisasi final selalu merujuk ke aturan scope RBAC di 020_AUTHORIZATION_ENFORCEMENT_SPEC terhadap entitas induk (`owner_type`/`owner_id`).

### 9.3 Audit Trail

Setiap aksi berikut **wajib** tercatat di audit log (052_AUDIT_TRAIL_MODULE) dengan payload minimal `{ userId, documentId, ownerType, ownerId, action, timestamp, ipAddress }`:

| Aksi | Event Audit |
|---|---|
| Upload berhasil | `DOCUMENT_UPLOADED` |
| Upload ditolak (validasi gagal) | `DOCUMENT_UPLOAD_REJECTED` (mencatat kode error) |
| Download berhasil | `DOCUMENT_DOWNLOADED` |
| Download ditolak (403/404) | `DOCUMENT_ACCESS_DENIED` |
| Soft-delete dokumen | `DOCUMENT_DELETED` |

---

## 10. API CONTRACT SUMMARY

Kontrak lengkap (request/response schema penuh, seluruh kode error) didefinisikan di **057_FULL_API_ENDPOINT_SPECIFICATION.md**. Ringkasan berikut hanya untuk orientasi cepat dan konsistensi dengan FE Spec sumber:

| Method | Endpoint | Tujuan | Role |
|---|---|---|---|
| POST | `/api/documents/upload` | Upload dokumen (multipart/form-data) | Semua (scope sesuai owner) |
| GET | `/api/documents/:id/download` | Download/stream file | Semua (scope sesuai owner) |
| GET | `/api/projects/:id/documents` | List dokumen milik satu proyek, dikelompokkan per tipe | Semua (scope) |
| DELETE | `/api/documents/:id` | Soft-delete dokumen | Sesuai role yang berwenang per konteks (lihat 9.2 dan modul bisnis terkait) |
| GET | `/api/config/document-types/:id` | Ambil konfigurasi `max_file_size_mb` & `allowed_mime_types` untuk validasi FE sebelum upload | Semua (read-only) |

**Request Payload — `POST /api/documents/upload`:**

```
Content-Type: multipart/form-data

file            : binary (wajib)
ownerType       : string, salah satu CHECK constraint Bagian 4.1 (wajib)
ownerId         : UUID (wajib)
documentTypeId  : UUID (wajib)
```

**Response Sukses (201):**

```json
{
  "id": "uuid",
  "fileNameOriginal": "RKS_Tender_2025.pdf",
  "fileSizeBytes": 4582931,
  "mimeType": "application/pdf",
  "documentTypeId": "uuid",
  "versionNumber": 1,
  "uploadedBy": { "id": "uuid", "name": "Nama User" },
  "uploadedAt": "2025-06-12T08:30:00Z"
}
```

**Response Gagal Validasi (422):**

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Ukuran file melebihi batas maksimum 25 MB untuk tipe dokumen ini"
  }
}
```

---

## 11. ACCEPTANCE CRITERIA

| # | Kriteria |
|---|---|
| AC-048-01 | Upload file dengan ukuran dan tipe sesuai konfigurasi `document_type_configs` berhasil dan menghasilkan baris baru di tabel `documents` |
| AC-048-02 | Upload file yang melebihi `max_file_size_mb` ditolak server dengan `422 FILE_TOO_LARGE`, terlepas dari validasi client |
| AC-048-03 | Upload file dengan ekstensi `.pdf` tetapi isi sebenarnya bukan PDF (MIME-sniffing tidak cocok) ditolak dengan `422 FILE_TYPE_MISMATCH` |
| AC-048-04 | File fisik di storage disimpan dengan nama UUID, bukan nama file asli, dan berada di path yang tidak dapat diakses lewat URL statis Nginx |
| AC-048-05 | Percobaan download dokumen oleh user yang tidak memiliki scope akses ke entitas induk menghasilkan `403`, bukan menyajikan file |
| AC-048-06 | Percobaan akses langsung ke path penyimpanan dokumen tanpa melalui endpoint API (mis. langsung ke Nginx) gagal/tidak ditemukan |
| AC-048-07 | Setiap upload dan download berhasil maupun ditolak tercatat di audit log dengan payload sesuai Bagian 9.3 |
| AC-048-08 | Jika `document_type_configs` belum ada untuk suatu tipe dokumen, sistem memakai default 25 MB + PDF/DOCX sesuai BR-DOC-03, bukan menolak atau mengizinkan tanpa batas |
| AC-048-09 | Soft-delete dokumen tidak menghapus file fisik dari storage (memungkinkan recovery/audit), hanya menandai `is_deleted = true` |
| AC-048-10 | Upload ke entitas dengan status yang mengunci perubahan (misal RKS yang sudah disubmit dan bukan status revision) ditolak dengan `409 UPLOAD_LOCKED` |

---

*Dokumen ini adalah versi 1.0 dari 048 Document Upload & Storage Module untuk KINETIC CRM.*
*Cross-reference dengan dokumen: 022 (Master Tipe Dokumen), 031 (CFG-13), 049 (Document Versioning), 052 (Audit Trail), 057 (API Endpoint Specification), 008 (Security Architecture).*

---
**Akhir Dokumen 048 — Document Upload & Storage Module**
**KINETIC CRM | Confidential / Internal | Versi 1.0 | Juni 2025**
