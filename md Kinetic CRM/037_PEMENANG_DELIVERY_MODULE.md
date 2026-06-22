# 037 — PEMENANG TENDER & TARGET DELIVERY MODULE
## KINETIC CRM — Modul Input Hasil Tender dan Delivery (FR060–FR062)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 037 |
| **Nama Dokumen** | Pemenang Tender & Target Delivery Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR060–FR062, BA Review Section B.4, C.1 (GAP-12) |
| **Gap Resolution** | GAP-12 (alasan kekalahan terstruktur) |
| **Status** | Final |

---

## 1. PURPOSE

Modul Pemenang Tender menangani tahap krusial: setelah pengumuman resmi tender, Cabang memasukkan hasilnya — menang atau kalah. Ini adalah titik yang menentukan apakah proyek berlanjut ke delivery (jika menang) atau berakhir (jika kalah). Data yang dikumpulkan di sini menjadi basis laporan win/loss dan analisis strategi kompetitif.

Modul Target Delivery menangani fase pasca-kemenangan: menetapkan timeline delivery dan mengonfirmasi selesainya pekerjaan.

---

## 2. ENTITIES

### 2.1 Entity: ProjectWinnerResult

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → projects.id | |
| `result` | ENUM('win','lose') | NOT NULL | Hasil tender |
| `contract_value` | BIGINT | NULL | Nilai kontrak yang didapat (jika menang, rupiah) |
| `winner_competitor_id` | BIGINT UNSIGNED | NULL, FK → competitors.id | Siapa yang menang (jika kalah) |
| `loss_reason_id` | BIGINT UNSIGNED | NULL, FK → loss_reasons.id | Alasan kekalahan utama (jika kalah) |
| `secondary_loss_reason_id` | BIGINT UNSIGNED | NULL, FK → loss_reasons.id | Alasan kekalahan sekunder |
| `winner_price` | BIGINT | NULL | Harga penawaran pemenang (jika diketahui) |
| `price_gap` | BIGINT | NULL | winner_price - our_bid_price (dikalkulasi backend) |
| `announcement_date` | DATE | NULL | Tanggal pengumuman resmi |
| `spk_document_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Dok SPK/Kontrak (jika menang) |
| `loss_letter_document_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Surat kekalahan (jika kalah, opsional) |
| `notes` | TEXT | NULL | Catatan analisis tambahan |
| `submitted_by` | BIGINT UNSIGNED | NOT NULL, FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Entity: ProjectDelivery

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → projects.id | |
| `delivery_start_date` | DATE | NOT NULL | Tanggal mulai delivery |
| `delivery_end_date` | DATE | NOT NULL | Tanggal selesai delivery (target) |
| `actual_end_date` | DATE | NULL | Tanggal selesai aktual |
| `delivery_notes` | TEXT | NULL | Catatan detail delivery |
| `is_completed` | TINYINT(1) | NOT NULL DEFAULT 0 | Apakah delivery sudah dikonfirmasi selesai |
| `completed_at` | TIMESTAMP | NULL | |
| `completed_by` | BIGINT UNSIGNED | NULL, FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

## 3. STATE TRANSITIONS

### 3.1 Saat Input Hasil Tender

```
Status proyek: pengumuman_pemenang
    ↓
Cabang input hasil

Result = WIN:
  → contract_value wajib diisi
  → spk_document_id wajib ada
  → Status proyek → target_delivery
  → is_winner = null dikosongkan di project_competitors (kompetitor lain semua = false)
  → Update project_winner_result.result = 'win'
  → Notifikasi ke PM dan Management

Result = LOSE:
  → loss_reason_id wajib diisi (dari Master Alasan Kekalahan)
  → winner_competitor_id opsional (siapa yang menang)
  → winner_price opsional
  → Status proyek → selesai (terminal)
  → Jika winner_competitor_id diisi: project_competitors.is_winner = true untuk kompetitor itu
  → Notifikasi ke PM
```

### 3.2 Saat Konfirmasi Delivery Selesai

```
Status proyek: target_delivery
    ↓
Cabang input delivery_start_date dan delivery_end_date
    ↓
Status proyek masih: target_delivery (menunggu selesai aktual)
    ↓
Cabang klik "Konfirmasi Delivery Selesai"
    → is_completed = true; actual_end_date = hari ini (atau diinput manual)
    → Status proyek → selesai (terminal)
    → Notifikasi ke PM dan Management
```

---

## 4. BUSINESS RULES — PEMENANG

| ID | Rule |
|---|---|
| BR-WIN-01 | Form ini hanya bisa diisi saat status proyek = `pengumuman_pemenang` |
| BR-WIN-02 | Jika result = `win`: `contract_value` dan `spk_document_id` WAJIB diisi sebelum submit |
| BR-WIN-03 | Jika result = `lose`: `loss_reason_id` WAJIB dipilih dari Master Alasan Kekalahan (GAP-12); input freeform tidak diizinkan |
| BR-WIN-04 | Jika loss_reason = `LAINNYA`: field `notes` menjadi wajib (min 20 karakter) |
| BR-WIN-05 | `price_gap` dikalkulasi otomatis backend: `winner_price - project_bid.bid_price`; bisa negatif (artinya penawaran kita lebih murah tapi tetap kalah — alasan non-harga) |
| BR-WIN-06 | Setelah submit hasil, data tidak bisa diubah kecuali oleh Admin |
| BR-WIN-07 | Jika `winner_competitor_id` diisi: `project_competitors.is_winner = 1` untuk kompetitor tersebut |
| BR-WIN-08 | Hasil kalah langsung membawa proyek ke status `selesai` (terminal); tidak ada tahap delivery |

---

## 5. BUSINESS RULES — DELIVERY

| ID | Rule |
|---|---|
| BR-DEL-01 | Tab Target Delivery hanya aktif jika proyek status = `target_delivery` |
| BR-DEL-02 | `delivery_end_date` harus > `delivery_start_date` |
| BR-DEL-03 | Cabang bisa simpan delivery dates tanpa konfirmasi selesai (untuk planning awal) |
| BR-DEL-04 | "Konfirmasi Delivery Selesai" hanya bisa dilakukan setelah `delivery_start_date` dan `delivery_end_date` terisi |
| BR-DEL-05 | Saat konfirmasi selesai: status proyek → `selesai`; tidak bisa dibatalkan |
| BR-DEL-06 | `actual_end_date` default = hari konfirmasi; bisa diubah manual (mis: delivery sudah selesai kemarin) |

---

## 6. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/projects/:id/winner | Auth | Get data hasil tender |
| POST | /api/projects/:id/winner | Cabang, Admin | Submit hasil tender (win/lose) |
| GET | /api/projects/:id/delivery | Auth | Get data delivery |
| PUT | /api/projects/:id/delivery | Cabang, Admin | Save delivery dates |
| POST | /api/projects/:id/delivery/complete | Cabang, Admin | Konfirmasi delivery selesai |

### 6.1 POST /api/projects/:id/winner (WIN)

```json
{
  "result": "win",
  "contract_value": 48500000000,
  "announcement_date": "2025-09-10",
  "spk_document_id": 78,
  "notes": "Berhasil memenangkan tender dengan harga terendah dari 4 peserta."
}
```

### 6.2 POST /api/projects/:id/winner (LOSE)

```json
{
  "result": "lose",
  "loss_reason_id": 2,
  "secondary_loss_reason_id": 5,
  "winner_competitor_id": 7,
  "winner_price": 43000000000,
  "announcement_date": "2025-09-10",
  "loss_letter_document_id": 79,
  "notes": "Kalah tipis dari PT. ABC; mereka memiliki pengalaman proyek serupa lebih banyak."
}
```

**Response 200 (both cases):**
```json
{
  "success": true,
  "data": {
    "result": "lose",
    "project_new_status": "selesai",
    "price_gap": -5500000000,
    "price_gap_formatted": "-Rp 5.500.000.000"
  },
  "message": "Hasil tender berhasil disimpan. Proyek telah ditandai sebagai Selesai."
}
```

### 6.3 POST /api/projects/:id/delivery/complete

```json
{
  "actual_end_date": "2026-03-15",
  "completion_notes": "Semua item dalam SPK telah diserahterimakan."
}
```

---

## 7. DDL

```sql
CREATE TABLE project_winner_results (
  id                         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id                 BIGINT UNSIGNED NOT NULL,
  result                     ENUM('win','lose') NOT NULL,
  contract_value             BIGINT          NULL,
  winner_competitor_id       BIGINT UNSIGNED NULL,
  loss_reason_id             BIGINT UNSIGNED NULL,
  secondary_loss_reason_id   BIGINT UNSIGNED NULL,
  winner_price               BIGINT          NULL,
  price_gap                  BIGINT          NULL,
  announcement_date          DATE            NULL,
  spk_document_id            BIGINT UNSIGNED NULL,
  loss_letter_document_id    BIGINT UNSIGNED NULL,
  notes                      TEXT            NULL,
  submitted_by               BIGINT UNSIGNED NOT NULL,
  created_at                 TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pwr_project (project_id),
  KEY idx_pwr_result     (result),
  KEY idx_pwr_loss_reason (loss_reason_id),
  CONSTRAINT fk_pwr_project      FOREIGN KEY (project_id)               REFERENCES projects(id),
  CONSTRAINT fk_pwr_competitor   FOREIGN KEY (winner_competitor_id)      REFERENCES competitors(id) ON DELETE SET NULL,
  CONSTRAINT fk_pwr_loss_reason  FOREIGN KEY (loss_reason_id)            REFERENCES loss_reasons(id),
  CONSTRAINT fk_pwr_loss_reason2 FOREIGN KEY (secondary_loss_reason_id)  REFERENCES loss_reasons(id) ON DELETE SET NULL,
  CONSTRAINT fk_pwr_submitter    FOREIGN KEY (submitted_by)              REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_deliveries (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id         BIGINT UNSIGNED NOT NULL,
  delivery_start_date DATE           NOT NULL,
  delivery_end_date  DATE            NOT NULL,
  actual_end_date    DATE            NULL,
  delivery_notes     TEXT            NULL,
  is_completed       TINYINT(1)      NOT NULL DEFAULT 0,
  completed_at       TIMESTAMP       NULL,
  completed_by       BIGINT UNSIGNED NULL,
  created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pd_project (project_id),
  CONSTRAINT fk_pd_project   FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_completer FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-WIN-01 | Submit hasil WIN tanpa upload SPK | Error: "Dokumen SPK/Kontrak wajib diupload untuk hasil menang" |
| TC-WIN-02 | Submit hasil LOSE tanpa pilih alasan kekalahan | Error: "Alasan kekalahan wajib dipilih" |
| TC-WIN-03 | Submit LOSE dengan alasan "LAINNYA" tanpa notes | Error: "Catatan wajib diisi minimal 20 karakter untuk alasan Lainnya" |
| TC-WIN-04 | Submit WIN dengan contract_value | Status proyek → target_delivery; PM dan Management dinotifikasi |
| TC-WIN-05 | Submit LOSE + pilih winner_competitor | project_competitors.is_winner = 1 untuk kompetitor itu |
| TC-WIN-06 | Cabang coba submit hasil dari status selain pengumuman_pemenang | Error: "Aksi tidak diizinkan pada status proyek saat ini" |
| TC-DEL-01 | Input delivery_end_date < delivery_start_date | Error: "Tanggal selesai harus setelah tanggal mulai" |
| TC-DEL-02 | Konfirmasi delivery selesai sebelum isi delivery dates | Error: "Tanggal mulai dan selesai delivery wajib diisi terlebih dahulu" |
| TC-DEL-03 | Konfirmasi delivery selesai → status proyek | Status proyek → selesai; PM + Management dinotifikasi |

**FR Coverage:** FR060 ✓ | FR061 ✓ | FR062 ✓ | GAP-12 ✓
