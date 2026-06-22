# 023 — MASTER KOMPETITOR
## KINETIC CRM — Normalisasi Master Kompetitor (GAP-09)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 023 |
| **Nama Dokumen** | Master Kompetitor |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.1 (MD-14), C.1 (GAP-09) |
| **Gap Resolution** | GAP-09 Major, MD-14 |
| **Status** | Final |

---

## 1. PURPOSE & BUSINESS CONTEXT

PRD v1.0 menyimpan data kompetitor sebagai **JSON bebas (freeform)** per proyek. Konsekuensinya:
- Tidak ada konsistensi nama kompetitor (PT ABC, ABC, PT. ABC = 3 entitas berbeda)
- Analisis kompetitor lintas proyek tidak bisa dilakukan
- Tidak bisa mengetahui kompetitor mana yang paling sering menang atau di segmen apa

Modul ini menormalisasi kompetitor sebagai **entitas master mandiri** dengan relasi many-to-many ke proyek, menyelesaikan **GAP-09 (Major)**.

---

## 2. ENTITY DEFINITIONS

### 2.1 Entity: Competitor

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Nama resmi kompetitor |
| `code` | VARCHAR(30) | NULL | Kode singkat / alias |
| `industry_id` | BIGINT UNSIGNED | NULL, FK → industries.id | Sektor industri kompetitor |
| `bidang_usaha` | VARCHAR(200) | NULL | Bidang usaha utama |
| `website` | VARCHAR(300) | NULL | Website perusahaan |
| `description` | TEXT | NULL | Catatan analisis umum |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Entity: ProjectCompetitor (Pivot — Relasi ke Proyek)

Satu proyek bisa memiliki banyak kompetitor; satu kompetitor bisa ada di banyak proyek.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, FK → projects.id | Proyek terkait |
| `competitor_id` | BIGINT UNSIGNED | NOT NULL, FK → competitors.id | Kompetitor yang terlibat |
| `estimated_price` | BIGINT | NULL | Estimasi harga penawaran kompetitor (dalam rupiah) |
| `strengths` | TEXT | NULL | Kelebihan kompetitor dalam konteks proyek ini |
| `notes` | TEXT | NULL | Catatan analisis spesifik proyek |
| `is_winner` | TINYINT(1) | NULL | NULL = belum diketahui; 1 = kompetitor ini yang menang; 0 = bukan pemenang |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(project_id, competitor_id)`

---

## 3. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-COMP-01 | Nama kompetitor harus unik di seluruh master |
| BR-COMP-02 | Saat menambah kompetitor ke proyek: user harus memilih dari Master Kompetitor; jika belum ada, bisa "+ Tambah Kompetitor Baru" yang sekaligus menyimpan ke master |
| BR-COMP-03 | Kompetitor nonaktif masih muncul di data historis proyek lama (referential integrity dijaga) |
| BR-COMP-04 | Kompetitor nonaktif tidak muncul di dropdown penambahan kompetitor baru |
| BR-COMP-05 | `is_winner = 1` pada satu kompetitor di proyek secara otomatis di-set saat Cabang input hasil kalah di Tab Pemenang |
| BR-COMP-06 | Hapus permanen kompetitor hanya diizinkan jika tidak ada proyek yang mereferensikannya |

---

## 4. ANALITIK KOMPETITOR (Basis untuk GAP-20, Fase 3)

Dengan data yang ternormalisasi, query analitik berikut menjadi mungkin:

```sql
-- Win rate per kompetitor (berapa kali dia menang dari total dia ikut)
SELECT
  c.name AS competitor_name,
  COUNT(*) AS total_proyek_diikuti,
  SUM(pc.is_winner) AS total_menang,
  ROUND(SUM(pc.is_winner) / COUNT(*) * 100, 1) AS win_rate_pct
FROM project_competitors pc
JOIN competitors c ON c.id = pc.competitor_id
JOIN projects p ON p.id = pc.project_id
WHERE p.status = 'selesai'
GROUP BY c.id, c.name
ORDER BY total_menang DESC;

-- Kompetitor dominan per kategori proyek
SELECT
  pc_cat.name AS category,
  c.name AS competitor,
  COUNT(*) AS kali_menang
FROM project_competitors pc
JOIN competitors c ON c.id = pc.competitor_id
JOIN projects p ON p.id = pc.project_id
JOIN project_categories pc_cat ON pc_cat.id = p.category_id
WHERE pc.is_winner = 1
GROUP BY pc_cat.id, c.id
ORDER BY pc_cat.name, kali_menang DESC;
```

---

## 5. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/competitors | Admin | List semua kompetitor |
| GET | /api/master/competitors/search | Auth | Search async untuk dropdown |
| POST | /api/master/competitors | Auth | Buat kompetitor baru (dari form proyek atau master) |
| PUT | /api/master/competitors/:id | Admin | Update kompetitor |
| PUT | /api/master/competitors/:id/deactivate | Admin | Nonaktifkan |
| GET | /api/master/competitors/:id/stats | Admin | Statistik: berapa proyek diikuti, win rate |
| GET | /api/projects/:id/competitors | Auth | List kompetitor di proyek tertentu |
| POST | /api/projects/:id/competitors | Cabang | Tambah kompetitor ke proyek |
| PUT | /api/projects/:id/competitors/:pcId | Cabang | Update data kompetitor dalam proyek |
| DELETE | /api/projects/:id/competitors/:pcId | Cabang | Hapus kompetitor dari proyek |

---

## 6. DATABASE SCHEMA (DDL)

```sql
CREATE TABLE competitors (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)    NOT NULL,
  code        VARCHAR(30)     NULL,
  industry_id BIGINT UNSIGNED NULL,
  bidang_usaha VARCHAR(200)   NULL,
  website     VARCHAR(300)    NULL,
  description TEXT            NULL,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL,
  updated_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_competitors_name (name),
  KEY idx_competitors_active   (is_active),
  KEY idx_competitors_industry (industry_id),
  CONSTRAINT fk_competitors_industry FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_competitors (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id      BIGINT UNSIGNED NOT NULL,
  competitor_id   BIGINT UNSIGNED NOT NULL,
  estimated_price BIGINT          NULL,
  strengths       TEXT            NULL,
  notes           TEXT            NULL,
  is_winner       TINYINT(1)      NULL,
  created_by      BIGINT UNSIGNED NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pc_project_competitor (project_id, competitor_id),
  KEY idx_pc_project_id    (project_id),
  KEY idx_pc_competitor_id (competitor_id),
  KEY idx_pc_is_winner     (is_winner),
  CONSTRAINT fk_pc_project    FOREIGN KEY (project_id)    REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_competitor FOREIGN KEY (competitor_id) REFERENCES competitors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-COMP-01 | Cabang tambah kompetitor ke proyek dari master | Tersimpan; nama konsisten dengan master |
| TC-COMP-02 | Cabang tambah kompetitor baru yang belum ada di master | Modal "Tambah Kompetitor Baru" → tersimpan ke master + langsung terhubung ke proyek |
| TC-COMP-03 | Cabang input hasil kalah dan pilih kompetitor pemenang | `is_winner = 1` pada kompetitor yang dipilih di proyek tersebut |
| TC-COMP-04 | Admin lihat statistik kompetitor PT ABC | Win rate, jumlah proyek diikuti, kategori dominan |
| TC-COMP-05 | Admin coba hapus kompetitor yang ada di 5 proyek | Error: "Kompetitor ini terhubung ke 5 proyek. Nonaktifkan saja." |

**Gap Resolution:** GAP-09 ✓ | MD-14 ✓
