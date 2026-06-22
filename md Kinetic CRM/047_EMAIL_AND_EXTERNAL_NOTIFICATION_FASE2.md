# 047 — EMAIL & NOTIFIKASI EKSTERNAL (FASE 2)
## KINETIC CRM — Desain Penuh Email, WhatsApp, Teams & Approval via Link

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 047 |
| **Nama Dokumen** | Email & External Notification — Fase 2 |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section B.5, B.2 (CFG-09) |
| **Status** | Final — Implementasi Fase 2 |

---

## 1. FASE 2 NOTIFICATION CHANNELS

### 1.1 Channel yang Akan Diimplementasikan

| Channel | Fase | Library/Service | Trigger |
|---|---|---|---|
| Email (SMTP) | 2 | Nodemailer / Laravel Mail | Semua event notifikasi in-app + approval actions |
| WhatsApp Business | 3 | Meta Cloud API | Approval request, deadline approaching |
| Microsoft Teams | 3 | Teams Incoming Webhook | Approval request, SLA overdue |

### 1.2 Email Architecture

```
NotificationService.send()
    ↓
Cek notification_templates.is_email_enabled
    ↓ Ya
Email Queue (background job: Redis + Bull / Laravel Queue)
    ↓
EmailWorker:
  1. Load template_email_subject + template_email_body
  2. Substitusi variabel
  3. Send via SMTP (config dari env vars)
  4. Log result (success/fail) ke email_send_logs
```

### 1.3 Entity: EmailSendLog

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `notification_id` | BIGINT UNSIGNED FK | |
| `recipient_email` | VARCHAR(200) | |
| `status` | ENUM('queued','sent','failed','bounced') | |
| `smtp_message_id` | VARCHAR(200) | Message ID dari SMTP server |
| `error_message` | TEXT | Jika gagal |
| `sent_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

### 1.4 Approval One-Click via Email

Desain untuk Fase 2: approver dapat approve/revisi langsung dari email tanpa login ke aplikasi.

```
Email: "RKS Proyek X menunggu review Anda"
  [Approve] [Kirim Revisi]
      ↓
Klik [Approve]:
  GET /api/email-actions/approve?token=SECURE_TOKEN_HERE
      ↓
Backend:
  1. Validasi token (JWT signed, exp 48 jam, single-use)
  2. Lookup approval_request_id dari token payload
  3. Proses approval (sama dengan POST /api/approvals/:id/approve)
  4. Return halaman HTML konfirmasi: "Berhasil disetujui!"
```

Token payload:
```json
{
  "type": "email_action",
  "action": "approve",
  "request_id": 201,
  "user_id": 5,
  "iat": 1717200000,
  "exp": 1717372800  // 48 jam
}
```

**Security:** Token single-use (di-mark sebagai used setelah diproses); HTTPS wajib; token tidak disimpan di URL params yang terlog di server.

---

## 2. MIGRATION PATH: FASE 1 → FASE 2

Saat Fase 2 diimplementasikan:
1. Set `notification_templates.is_email_enabled = true` untuk event yang diprioritaskan
2. Aktifkan email queue worker
3. Konfigurasi SMTP di environment variables
4. Test dengan satu event terlebih dahulu (mis: `prospect.submitted`)

Tidak ada perubahan skema DB yang diperlukan; infrastructure sudah disiapkan di Fase 1.

**Gap Resolution:** CFG-09 ✓ | GAP-18 ✓ (Fase 2)

---

---

# 048 — DOCUMENT UPLOAD & STORAGE MODULE
## KINETIC CRM — Upload, Validasi, Storage, Download Terautentikasi

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 048 |
| **Nama Dokumen** | Document Upload & Storage Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR070–FR071, BA Review Section B.6 |
| **Status** | Final |

---

## 1. ENTITY: ProjectDocument

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, FK → projects.id | |
| `document_type_id` | BIGINT UNSIGNED | NOT NULL, FK → document_types.id | Tipe dokumen (RKS, LPHS, dll.) |
| `original_filename` | VARCHAR(300) | NOT NULL | Nama file asli |
| `stored_filename` | VARCHAR(300) | NOT NULL | Nama file di storage (UUID + ext) |
| `storage_path` | VARCHAR(500) | NOT NULL | Path relatif dari storage root |
| `file_size_bytes` | BIGINT UNSIGNED | NOT NULL | Ukuran file |
| `mime_type` | VARCHAR(100) | NOT NULL | MIME type yang terdeteksi |
| `file_extension` | VARCHAR(10) | NOT NULL | Ekstensi lowercase |
| `version` | SMALLINT UNSIGNED | NOT NULL DEFAULT 1 | Versi dokumen |
| `is_latest` | TINYINT(1) | NOT NULL DEFAULT 1 | Versi terbaru |
| `previous_version_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Link ke versi sebelumnya |
| `checksum_sha256` | VARCHAR(64) | NOT NULL | SHA-256 hash file untuk integrity check |
| `uploaded_by` | BIGINT UNSIGNED | NOT NULL, FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 1.1 Storage Path Convention

```
storage/documents/projects/{project_id}/{document_type_code}/
  {uuid}_{original_filename}.{ext}

Contoh:
storage/documents/projects/123/RKS/
  a1b2c3d4-e5f6-7890-abcd-ef1234567890_Dokumen_RKS_Final.pdf
```

---

## 2. UPLOAD FLOW

### 2.1 Client-side Validation (sebelum upload)

```typescript
function validateFile(file: File, docType: DocumentType): ValidationResult {
  // Cek ekstensi
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!docType.allowed_extensions.includes(ext)) {
    return { valid: false, error: `Tipe file .${ext} tidak diizinkan untuk ${docType.name}` };
  }

  // Cek ukuran
  const maxBytes = docType.max_size_mb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Ukuran file melebihi batas ${docType.max_size_mb} MB` };
  }

  return { valid: true };
}
```

### 2.2 Upload API

```
POST /api/documents/upload
Content-Type: multipart/form-data

Fields:
  file:              (binary)
  project_id:        number
  document_type_id:  number

Backend:
  1. Validasi auth + permission (user punya akses ke project_id)
  2. Validasi tipe dan ukuran file (re-validate server-side)
  3. Scan MIME type (verifikasi bukan spoofing; libmagic atau fileinfo)
  4. Generate UUID filename untuk mencegah path traversal
  5. Kalkulasi SHA-256 checksum
  6. Simpan file ke storage path (di luar webroot)
  7. Insert ke project_documents
  8. Jika ada versi sebelumnya dengan tipe yang sama:
     - Update versi lama: is_latest = 0
     - Set previous_version_id = id versi lama
     - Increment version number
  9. Catat di project_timeline_events (event_type = 'document_uploaded')
  10. Return { document_id, filename, version, url: null (download via API) }
```

---

## 3. DOWNLOAD FLOW (AUTHENTICATED)

```
GET /api/documents/:id/download

Backend:
  1. Validasi auth: user login
  2. Validasi akses: user memiliki akses ke project_id yang terkait dokumen ini
  3. Lookup storage_path dari DB
  4. Verifikasi file ada di disk
  5. Set headers:
     Content-Type: {mime_type}
     Content-Disposition: attachment; filename="{original_filename}"
     Content-Length: {file_size_bytes}
  6. Stream file ke response (bukan redirect ke URL langsung)
```

**Security:** File tidak bisa diakses via URL langsung. Semua download melalui API yang memverifikasi auth + permission.

---

## 4. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-DOC-01 | Semua upload divalidasi tipe file (via MIME detection, bukan hanya ekstensi) |
| BR-DOC-02 | Ukuran file divalidasi di client (UX) dan di server (security) |
| BR-DOC-03 | File disimpan di luar webroot dengan nama UUID (bukan nama asli, mencegah path traversal) |
| BR-DOC-04 | SHA-256 checksum dikalkulasi saat upload dan disimpan untuk integrity check |
| BR-DOC-05 | Upload ulang tipe dokumen yang sama menghasilkan versi baru (versioning — GAP-14) |
| BR-DOC-06 | Download hanya melalui API terautentikasi; tidak ada URL publik |
| BR-DOC-07 | Semua upload tercatat di project timeline events |
| BR-DOC-08 | User yang bisa download: semua yang memiliki akses baca ke proyek tersebut |

---

## 5. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/documents/upload | Auth | Upload dokumen baru atau versi baru |
| GET | /api/documents/:id | Auth | Metadata dokumen |
| GET | /api/documents/:id/download | Auth | Stream download file |
| GET | /api/projects/:id/documents | Auth | List semua dokumen proyek |
| DELETE | /api/documents/:id | Admin | Hapus dokumen (soft-delete) |

---

## 6. DDL

```sql
CREATE TABLE project_documents (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id          BIGINT UNSIGNED NOT NULL,
  document_type_id    BIGINT UNSIGNED NOT NULL,
  original_filename   VARCHAR(300)    NOT NULL,
  stored_filename     VARCHAR(300)    NOT NULL,
  storage_path        VARCHAR(500)    NOT NULL,
  file_size_bytes     BIGINT UNSIGNED NOT NULL,
  mime_type           VARCHAR(100)    NOT NULL,
  file_extension      VARCHAR(10)     NOT NULL,
  version             SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_latest           TINYINT(1)      NOT NULL DEFAULT 1,
  previous_version_id BIGINT UNSIGNED NULL,
  checksum_sha256     VARCHAR(64)     NOT NULL,
  is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,
  deleted_at          TIMESTAMP       NULL,
  deleted_by          BIGINT UNSIGNED NULL,
  uploaded_by         BIGINT UNSIGNED NOT NULL,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pd_project     (project_id),
  KEY idx_pd_type        (document_type_id),
  KEY idx_pd_is_latest   (is_latest),
  CONSTRAINT fk_pd_project  FOREIGN KEY (project_id)         REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_type     FOREIGN KEY (document_type_id)   REFERENCES document_types(id),
  CONSTRAINT fk_pd_prev_ver FOREIGN KEY (previous_version_id) REFERENCES project_documents(id) ON DELETE SET NULL,
  CONSTRAINT fk_pd_uploader FOREIGN KEY (uploaded_by)        REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**FR Coverage:** FR070 ✓ | FR071 ✓ | GAP-14 (foundation) ✓

---

---

# 049 — DOCUMENT VERSIONING MODULE
## KINETIC CRM — Versioning Dokumen Penuh (GAP-14)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 049 |
| **Nama Dokumen** | Document Versioning Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-14 Minor) |
| **Gap Resolution** | **GAP-14 Minor** |
| **Status** | Final |

---

## 1. VERSIONING MODEL

Setiap upload ulang dokumen dengan tipe yang sama dalam satu proyek menghasilkan versi baru. Model ini menggunakan **linked list** (melalui `previous_version_id`) untuk melacak riwayat versi.

```
Version 1 (original)
  ↓ uploaded v2
Version 2 (is_latest = 1; v1.is_latest = 0; v2.previous_version_id = v1.id)
  ↓ uploaded v3
Version 3 (is_latest = 1; v2.is_latest = 0; v3.previous_version_id = v2.id)
```

Mengambil versi terbaru: `WHERE document_type_id = X AND project_id = Y AND is_latest = 1`
Mengambil semua versi: traverse via `previous_version_id` atau query by type+project sorted by version DESC.

---

## 2. UI: VERSION HISTORY DISPLAY

Di Tab Dokumen (PROJ-03j), setiap dokumen yang memiliki > 1 versi menampilkan accordion expand:

```
📄 Dokumen RKS                                        [Unduh] [v3 — Terbaru]
   Diunggah: Bu Sari • 10 Jun 2025, 14:30 • 2.3 MB
   [▼ Lihat Riwayat Versi (3 versi)]
      ├── v3 (Terbaru)  — Bu Sari  — 10 Jun 2025 — 2.3 MB  [Unduh]
      ├── v2            — Pak Budi — 5 Jun 2025  — 2.1 MB  [Unduh]
      └── v1 (Awal)    — Pak Budi — 1 Jun 2025  — 2.0 MB  [Unduh]
```

- Badge "Terbaru" hanya pada versi dengan `is_latest = 1`
- Semua versi bisa didownload (tidak ada versi yang dihapus)
- Nama uploader + timestamp ditampilkan per versi

---

## 3. VERSION COMPARISON (INFERRED — Fase 2)

**Inferred Requirement IR-DOC-01:** Untuk dokumen tipe PDF atau Word, Fase 2 dapat menambahkan fitur "Bandingkan Versi" yang menampilkan diff visual antara dua versi. Tidak diimplementasikan di Fase 1; didesain sebagai placeholder.

---

## 4. API Endpoints — Versioning

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/documents/:id/versions | Auth | List semua versi dokumen ini |
| GET | /api/projects/:id/documents?typeId=X | Auth | Versi terbaru per tipe |

### 4.1 GET /api/documents/:id/versions

```json
{
  "data": [
    {
      "id": 91, "version": 3, "is_latest": true,
      "original_filename": "RKS_Final_Rev3.pdf",
      "file_size_bytes": 2415919, "file_size_formatted": "2.3 MB",
      "uploaded_by": { "id": 12, "name": "Bu Sari" },
      "created_at": "2025-06-10T14:30:00Z"
    },
    {
      "id": 78, "version": 2, "is_latest": false,
      "original_filename": "RKS_Final_Rev2.pdf",
      ...
    }
  ]
}
```

---

## 5. BUSINESS RULES — VERSIONING

| ID | Rule |
|---|---|
| BR-VER-01 | Upload ulang tipe yang sama di proyek yang sama → versi baru; versi lama tidak dihapus |
| BR-VER-02 | Semua versi bisa didownload; tidak ada rollback (karena semua tersimpan) |
| BR-VER-03 | `is_latest` hanya satu per kombinasi project_id + document_type_id |
| BR-VER-04 | Menghapus dokumen (Admin): soft-delete; `is_deleted = 1`; file fisik tidak dihapus segera (cleanup job berkala) |
| BR-VER-05 | Versi dokumen tercatat di project timeline: "v2 dari [tipe] diunggah oleh [nama]" |

**Gap Resolution:** GAP-14 ✓
