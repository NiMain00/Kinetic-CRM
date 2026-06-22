# 036 — HARGA PENAWARAN & KOMPETITOR MODULE
## KINETIC CRM — Modul Input Harga Penawaran dan Data Kompetitor per Proyek

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 036 |
| **Nama Dokumen** | Harga Penawaran & Kompetitor Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR050–FR051, BA Review Section B.4, C.1 (GAP-09) |
| **Gap Resolution** | GAP-09 (normalisasi kompetitor) |
| **Status** | Final |

---

## 1. PURPOSE

Modul ini menangani dua hal yang terjadi bersamaan di tahap `submit_harga`:
1. **Harga Penawaran** — Cabang memasukkan harga penawaran resmi yang akan diajukan ke customer
2. **Data Kompetitor** — Cabang mencatat informasi kompetitor yang diketahui ikut tender beserta estimasi harga mereka

Data harga penawaran menjadi referensi saat menghitung gap harga setelah hasil tender diketahui. Data kompetitor (dinormalisasi ke Master Kompetitor sesuai GAP-09) memungkinkan analisis kompetitif lintas proyek.

---

## 2. ENTITIES

### 2.1 Entity: ProjectBid (Harga Penawaran)

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → projects.id | Satu proyek satu bid |
| `bid_price` | BIGINT | NOT NULL | Harga penawaran (rupiah; tanpa desimal) |
| `margin_pct` | DECIMAL(5,2) | NULL | Margin keuntungan yang diharapkan (%) |
| `hpp` | BIGINT | NULL | Harga Pokok Penjualan / biaya dasar (rupiah) |
| `notes` | TEXT | NULL | Catatan strategi harga |
| `supporting_document_id` | BIGINT UNSIGNED | NULL, FK → project_documents.id | Dok perhitungan harga |
| `reference_url` | VARCHAR(500) | NULL | Link referensi eksternal |
| `status` | ENUM('draft','submitted') | NOT NULL DEFAULT 'draft' | |
| `submitted_at` | TIMESTAMP | NULL | |
| `submitted_by` | BIGINT UNSIGNED | NULL, FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Catatan implementasi harga:** Nilai rupiah disimpan dalam satuan **rupiah penuh** sebagai BIGINT (bukan DECIMAL) untuk menghindari floating-point issues. Frontend memformat tampilan dengan pemisah ribuan.

### 2.2 Entity: ProjectCompetitorEntry (referensi ke doc 023)

Relasi ke tabel `project_competitors` yang sudah didefinisikan di dokumen 023. Tidak ada tabel baru; modul ini hanya mengelola data di tabel yang sama.

---

## 3. BUSINESS RULES — HARGA PENAWARAN

| ID | Rule |
|---|---|
| BR-BID-01 | Harga penawaran hanya bisa diisi/diedit oleh Cabang (dan Admin) saat status proyek = `submit_harga` |
| BR-BID-02 | Harga penawaran > 0; tidak boleh negatif atau nol |
| BR-BID-03 | Simpan Draft: tidak perlu semua field terisi; memungkinkan pengisian bertahap |
| BR-BID-04 | Submit Harga Penawaran: bid_price wajib terisi; status proyek bergerak ke `pengumuman_pemenang` |
| BR-BID-05 | Setelah submit, bid_price menjadi read-only untuk semua role; hanya bisa dilihat |
| BR-BID-06 | margin_pct dan hpp adalah opsional; hanya untuk keperluan internal |
| BR-BID-07 | Bid price ditampilkan dalam format Rupiah (Rp X.XXX.XXX.XXX) di seluruh sistem |

---

## 4. BUSINESS RULES — KOMPETITOR PER PROYEK

| ID | Rule |
|---|---|
| BR-KOMP-01 | Nama kompetitor harus dipilih dari Master Kompetitor (GAP-09); tidak bisa input freeform |
| BR-KOMP-02 | Jika kompetitor belum ada di master: user klik "+ Kompetitor Baru" → mini-form inline → simpan ke master + langsung terhubung ke proyek |
| BR-KOMP-03 | Satu proyek bisa memiliki banyak kompetitor; satu kompetitor bisa ada di banyak proyek |
| BR-KOMP-04 | `estimated_price` kompetitor adalah opsional (tidak selalu diketahui) |
| BR-KOMP-05 | Cabang bisa add/edit/hapus kompetitor di proyek miliknya selama proyek belum `selesai` atau `cancelled` |
| BR-KOMP-06 | `is_winner` diisi saat modul Pemenang (dokumen 037) — bukan di modul ini |
| BR-KOMP-07 | Data kompetitor bisa diinput kapan saja selama lifecycle proyek (tidak dibatasi status) |

---

## 5. API ENDPOINTS

### 5.1 Harga Penawaran

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/projects/:id/bid | Auth | Get data harga penawaran |
| PUT | /api/projects/:id/bid | Cabang, Admin | Save / update draft harga |
| POST | /api/projects/:id/bid/submit | Cabang, Admin | Submit harga → status proyek ke pengumuman_pemenang |

**PUT /api/projects/:id/bid**
```json
{
  "bid_price": 48500000000,
  "margin_pct": 12.5,
  "hpp": 43111111111,
  "notes": "Harga sudah include contingency 5% untuk risiko material",
  "reference_url": "https://drive.google.com/file/d/xxx"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "project_id": 123,
    "bid_price": 48500000000,
    "bid_price_formatted": "Rp 48.500.000.000",
    "margin_pct": 12.5,
    "status": "draft"
  }
}
```

### 5.2 Kompetitor per Proyek

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/projects/:id/competitors | Auth | List kompetitor di proyek ini |
| POST | /api/projects/:id/competitors | Cabang, Admin | Tambah kompetitor ke proyek |
| PUT | /api/projects/:id/competitors/:pcId | Cabang, Admin | Update data kompetitor dalam proyek |
| DELETE | /api/projects/:id/competitors/:pcId | Cabang, Admin | Hapus kompetitor dari proyek |

**POST /api/projects/:id/competitors**
```json
{
  "competitor_id": 7,
  "estimated_price": 45000000000,
  "strengths": "Memiliki pengalaman lebih banyak di proyek sejenis dan hubungan baik dengan client",
  "notes": "Kompetitor terkuat; perlu strategi harga yang agresif"
}
```

Jika kompetitor baru (belum di master):
```json
{
  "new_competitor": {
    "name": "PT. Konstruksi Maju",
    "bidang_usaha": "Konstruksi Sipil"
  },
  "estimated_price": 45000000000,
  "strengths": "Harga sangat kompetitif"
}
```
Backend: simpan ke `competitors` dulu, lalu buat `project_competitors`.

---

## 6. DATABASE SCHEMA (DDL)

```sql
CREATE TABLE project_bids (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id            BIGINT UNSIGNED NOT NULL,
  bid_price             BIGINT          NOT NULL,
  margin_pct            DECIMAL(5,2)    NULL,
  hpp                   BIGINT          NULL,
  notes                 TEXT            NULL,
  supporting_document_id BIGINT UNSIGNED NULL,
  reference_url         VARCHAR(500)    NULL,
  status                ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  submitted_at          TIMESTAMP       NULL,
  submitted_by          BIGINT UNSIGNED NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bids_project (project_id),
  KEY idx_bids_status  (status),
  CONSTRAINT fk_bids_project   FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_submitter FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Tabel `project_competitors` sudah didefinisikan di dokumen 023.

---

## 7. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-BID-01 | Cabang submit harga dengan bid_price = 0 | Error 422: "Harga penawaran harus lebih dari 0" |
| TC-BID-02 | Cabang simpan draft tanpa bid_price | Berhasil tersimpan; status = draft |
| TC-BID-03 | Cabang submit harga (bid_price terisi) | Status bid = submitted; status proyek → pengumuman_pemenang |
| TC-BID-04 | PM coba edit harga penawaran yang sudah disubmit | Error 403: "Hanya Cabang yang dapat mengisi harga penawaran" |
| TC-BID-05 | Cabang tambah kompetitor yang belum ada di master | Kompetitor baru tersimpan ke master; terhubung ke proyek |
| TC-BID-06 | Cabang tambah kompetitor yang sudah ada di master | Langsung pilih dari dropdown; tidak buat duplikat |
| TC-BID-07 | Tampilkan estimated_price kompetitor dalam format Rupiah | "Rp 45.000.000.000" (bukan angka mentah) |

**FR Coverage:** FR050 ✓ | FR051 ✓ | GAP-09 ✓
