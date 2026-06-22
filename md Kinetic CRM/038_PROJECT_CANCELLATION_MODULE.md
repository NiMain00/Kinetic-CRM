# 038 — PROJECT CANCELLATION MODULE
## KINETIC CRM — Modul Pembatalan Proyek (GAP-04 / BP-04)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 038 |
| **Nama Dokumen** | Project Cancellation Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-04 Critical, BP-04) |
| **Gap Resolution** | **GAP-04 Critical**, BP-04 |
| **Status** | Final |

---

## 1. PURPOSE & CRITICAL CONTEXT

> **GAP-04 (Critical):** PRD v1.0 tidak memiliki mekanisme pembatalan proyek. Tidak ada status `cancelled`, tidak ada cara untuk menandai proyek yang batal (mis: tender dibatalkan oleh client, atau perusahaan memutuskan tidak ikut tender). Akibatnya: proyek yang batal tetap muncul sebagai "aktif" di pipeline dan mempengaruhi kalkulasi KPI secara tidak akurat.

Modul ini mendefinisikan seluruh mekanisme pembatalan: siapa yang bisa membatalkan, kapan, dengan syarat apa, apa dampaknya pada data terkait, dan bagaimana proyek cancelled ditampilkan di sistem.

---

## 2. CANCELLATION RULES

### 2.1 Siapa yang Boleh Cancel

| Role | Bisa Cancel | Kondisi |
|---|---|---|
| Admin | ✓ | Dari status apapun (kecuali selesai) |
| PM | ✓ | Dari status apapun (kecuali selesai dan cancelled) |
| Cabang | — | Tidak bisa cancel proyek |
| Department | — | Tidak bisa cancel proyek |
| Management | — | Tidak bisa cancel proyek |

### 2.2 Dari Status Mana Proyek Bisa Dibatalkan

| Status Proyek | Bisa Dibatalkan? |
|---|---|
| created | ✓ |
| submit_rks | ✓ |
| review_department | ✓ |
| lphs_sios | ✓ |
| revision | ✓ |
| submit_harga | ✓ |
| pengumuman_pemenang | ✓ |
| target_delivery | ✓ |
| selesai | ✗ (terminal; sudah selesai tidak bisa dibatalkan) |
| cancelled | ✗ (sudah dibatalkan) |

### 2.3 Proses Pembatalan

```
PM/Admin klik "Batalkan Proyek" di PROJ-01 atau PROJ-03
    ↓
ConfirmDialog dengan form:
  - Alasan Pembatalan (textarea, wajib, min 20 karakter)
  - Inisiator (Client / Internal / Force Majeure / Lainnya) — dropdown
    ↓
Konfirmasi → POST /api/projects/:id/cancel
    ↓
Backend:
  1. Validasi: status bukan terminal; actor = PM atau Admin
  2. Update projects:
     - is_cancelled = 1
     - cancel_reason = alasan
     - cancelled_by = user_id
     - cancelled_at = NOW()
     - status_id → id status 'cancelled'
     - last_status_change_at = NOW()
  3. Catat di project_timeline_events (event_type = 'project_cancelled')
  4. Catat di audit_logs
  5. Kirim notifikasi ke Cabang
  6. Invalidasi semua pending approvals terkait proyek ini
    ↓
Response 200
```

---

## 3. ENTITY: ProjectCancellation (Detail)

Data pembatalan disimpan sebagai kolom tambahan di tabel `projects` (sudah didefinisikan di dokumen 033) ditambah tabel detail terpisah untuk informasi lengkap.

### 3.1 Tabel `project_cancellations`

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → projects.id | |
| `reason` | TEXT | NOT NULL | Alasan pembatalan (min 20 char) |
| `initiator_type` | ENUM('client','internal','force_majeure','other') | NOT NULL | Pihak yang menginisiasi |
| `status_at_cancellation` | VARCHAR(50) | NOT NULL | Kode status proyek saat dibatalkan |
| `cancelled_by` | BIGINT UNSIGNED | NOT NULL, FK → users.id | User yang membatalkan |
| `cancelled_at` | TIMESTAMP | NOT NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |

---

## 4. DAMPAK PEMBATALAN PADA DATA TERKAIT

### 4.1 Approval Requests yang Pending

Semua approval request yang masih `pending` untuk proyek yang dibatalkan otomatis dibatalkan:

```sql
UPDATE approval_requests
SET status = 'cancelled', cancelled_reason = 'Proyek dibatalkan'
WHERE project_id = :projectId AND status = 'pending';
```

Approver yang memiliki item pending di inbox akan melihat item tersebut berubah menjadi "Dibatalkan" dan hilang dari pending count.

### 4.2 SLA Tracking

Semua SLA tracking aktif untuk proyek ini dihentikan:
```sql
UPDATE approval_sla_tracking
SET sla_status = 'resolved', resolved_at = NOW()
WHERE approval_request_id IN (
  SELECT id FROM approval_requests WHERE project_id = :projectId
);
```

### 4.3 Kalkulasi KPI dan Laporan

- Proyek `cancelled` **tidak dihitung** dalam:
  - Widget "Proyek Aktif" di dashboard
  - Kalkulasi win rate
  - Nilai pipeline
  - Progress vs target KPI
- Proyek `cancelled` **tetap muncul** di:
  - Daftar proyek (dengan filter aktif; bisa difilter/hide)
  - Laporan historis (dengan filter)
  - Audit log
  - Timeline proyek yang sudah ada sebelum dibatalkan

### 4.4 Notifikasi saat Cancel

| Penerima | Pesan |
|---|---|
| Cabang pemilik proyek | "Proyek [nama] telah dibatalkan oleh [PM/Admin]. Alasan: [alasan]." |
| PM (jika yang cancel = Admin) | "Proyek [nama] telah dibatalkan." |
| Approver dengan pending item | Item approval hilang dari inbox + notifikasi "Proyek terkait telah dibatalkan" |

---

## 5. TAMPILAN PROYEK CANCELLED DI UI

### 5.1 Daftar Proyek (PROJ-01)

- Badge status `Dibatalkan` berwarna merah tua (#9F1239) dengan teks "Dibatalkan"
- Baris proyek cancelled memiliki opacity 0.7 (visual de-emphasis)
- Filter default: semua status termasuk cancelled tampil; ada filter cepat "Sembunyikan yang Dibatalkan"
- Kolom Aksi: tidak ada tombol untuk submit/approve/dll; hanya "Lihat Detail"

### 5.2 Detail Proyek (PROJ-03)

- Banner merah di atas halaman: "⛔ Proyek ini telah dibatalkan pada [tanggal] oleh [nama user]. Alasan: [alasan]"
- Semua tab menjadi read-only
- Semua tombol aksi disembunyikan
- Tab Timeline masih menampilkan semua riwayat termasuk event pembatalan

### 5.3 Dashboard

- Widget "Proyek Aktif": **tidak menghitung** proyek cancelled
- Widget "Win Rate": **tidak menghitung** proyek cancelled
- Widget "Pipeline Value": **tidak termasuk** proyek cancelled

---

## 6. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/projects/:id/cancel | PM, Admin | Batalkan proyek |
| GET | /api/projects/:id/cancellation | Auth | Detail pembatalan proyek |

### 6.1 POST /api/projects/:id/cancel

**Request:**
```json
{
  "reason": "Client membatalkan pengadaan ini karena pemangkasan anggaran internal untuk tahun fiskal berjalan.",
  "initiator_type": "client"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "project_id": 123,
    "project_code": "PRJ-2025-00123",
    "new_status": "cancelled",
    "cancelled_at": "2025-07-15T14:30:00Z",
    "cancelled_by": { "id": 5, "name": "Pak Cahyo (PM)" }
  },
  "message": "Proyek PRJ-2025-00123 telah dibatalkan."
}
```

**Error 422 (status terminal):**
```json
{
  "success": false,
  "message": "Proyek yang sudah berstatus Selesai tidak dapat dibatalkan."
}
```

**Error 403 (role tidak bisa cancel):**
```json
{
  "success": false,
  "message": "Hanya PM dan Admin yang dapat membatalkan proyek."
}
```

---

## 7. DDL

```sql
CREATE TABLE project_cancellations (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id                BIGINT UNSIGNED NOT NULL,
  reason                    TEXT            NOT NULL,
  initiator_type            ENUM('client','internal','force_majeure','other') NOT NULL,
  status_at_cancellation    VARCHAR(50)     NOT NULL,
  cancelled_by              BIGINT UNSIGNED NOT NULL,
  cancelled_at              TIMESTAMP       NOT NULL,
  created_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pc_project (project_id),
  KEY idx_pc_initiator_type   (initiator_type),
  KEY idx_pc_cancelled_at     (cancelled_at),
  CONSTRAINT fk_pc_project   FOREIGN KEY (project_id)   REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_cancelled  FOREIGN KEY (cancelled_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-CANC-01 | PM batalkan proyek di status submit_rks | is_cancelled = 1; status = cancelled; Cabang dinotifikasi |
| TC-CANC-02 | PM batalkan proyek di status selesai (terminal) | Error: "Proyek yang sudah Selesai tidak dapat dibatalkan" |
| TC-CANC-03 | Cabang coba batalkan proyek | Error 403: "Hanya PM dan Admin..." |
| TC-CANC-04 | Cancel tanpa alasan | Error 422: "Alasan pembatalan wajib diisi (minimal 20 karakter)" |
| TC-CANC-05 | Cancel proyek dengan pending approval | Pending approval diinvalidasi; approver menerima notifikasi |
| TC-CANC-06 | Dashboard setelah 3 proyek dicancelled | Count "Proyek Aktif" berkurang 3; Pipeline value berkurang |
| TC-CANC-07 | Filter daftar proyek "Semua" | Proyek cancelled tampil dengan badge merah dan opacity rendah |
| TC-CANC-08 | Filter daftar proyek "Sembunyikan Dibatalkan" | Proyek cancelled tidak tampil |
| TC-CANC-09 | Lihat detail proyek cancelled | Banner merah + semua tab read-only + timeline lengkap |
| TC-CANC-10 | Laporan Win/Loss tidak termasuk proyek cancelled | Count dan nilai hanya dari proyek selesai (bukan cancelled) |

**Gap Resolution:** GAP-04 Critical ✓ | BP-04 ✓
