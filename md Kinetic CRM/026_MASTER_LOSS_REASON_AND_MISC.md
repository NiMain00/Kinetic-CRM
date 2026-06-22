# 026 — MASTER ALASAN KEKALAHAN & MASTER PENDUKUNG LAIN
## KINETIC CRM — Master Loss Reason, Approval Level, Notifikasi Template

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 026 |
| **Nama Dokumen** | Master Alasan Kekalahan & Master Pendukung |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section C.1 (GAP-12), B.1 (MD-06, MD-12, MD-15) |
| **Gap Resolution** | GAP-12 Minor, MD-06, MD-12, MD-15 |
| **Status** | Final |

---

## 1. MASTER ALASAN KEKALAHAN (GAP-12)

### 1.1 Purpose & Business Context

BA Review GAP-12 mengidentifikasi bahwa PRD v1.0 tidak menyediakan field terstruktur untuk alasan kekalahan tender. Cabang hanya bisa mengisi teks bebas (freeform) yang tidak bisa dianalisis secara agregat.

Dengan **Master Alasan Kekalahan**, alasan kekalahan menjadi terstandar dan dapat dianalisis: "Berapa persen kekalahan karena harga?" vs "Berapa persen karena teknis?" — data yang sangat berharga untuk perencanaan strategi kompetitif.

### 1.2 Entity: LossReason

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(200) | NOT NULL, UNIQUE | Label alasan kekalahan |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode sistem |
| `category` | ENUM('harga','teknis','relasi','administrasi','waktu','lainnya') | NOT NULL | Kategori besar alasan |
| `description` | TEXT | NULL | Penjelasan kapan alasan ini digunakan |
| `sort_order` | SMALLINT UNSIGNED | NOT NULL DEFAULT 0 | |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | NULL | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 1.3 Default Loss Reasons (Data Seed)

| Code | Name | Category |
|---|---|---|
| HARGA_TERLALU_TINGGI | Harga Penawaran Terlalu Tinggi | harga |
| HARGA_TIDAK_KOMPETITIF | Harga Tidak Kompetitif vs Kompetitor | harga |
| SPESIFIKASI_TEKNIS | Tidak Memenuhi Spesifikasi Teknis | teknis |
| PENGALAMAN_KURANG | Pengalaman / Track Record Kurang | teknis |
| RELASI_KOMPETITOR | Kompetitor Memiliki Hubungan Lebih Baik dengan Client | relasi |
| EVALUASI_ADMIN | Tidak Lulus Evaluasi Administrasi | administrasi |
| DOK_TIDAK_LENGKAP | Dokumen Tidak Lengkap | administrasi |
| KETERLAMBATAN | Keterlambatan Pengiriman Dokumen | waktu |
| BATALKAN_CLIENT | Tender Dibatalkan oleh Client | lainnya |
| TIDAK_DIKETAHUI | Alasan Tidak Diketahui | lainnya |
| LAINNYA | Alasan Lain (isi keterangan) | lainnya |

### 1.4 Entity: ProjectLossDetail (Relasi ke Proyek)

Satu proyek yang kalah memiliki satu record detail kekalahan.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `project_id` | BIGINT UNSIGNED | NOT NULL, FK → projects.id, UNIQUE | Satu proyek satu record |
| `loss_reason_id` | BIGINT UNSIGNED | NOT NULL, FK → loss_reasons.id | Alasan utama kekalahan |
| `secondary_reason_id` | BIGINT UNSIGNED | NULL, FK → loss_reasons.id | Alasan kedua (opsional) |
| `winner_competitor_id` | BIGINT UNSIGNED | NULL, FK → competitors.id | Kompetitor pemenang |
| `winner_price` | BIGINT | NULL | Harga penawaran pemenang (jika diketahui) |
| `our_price` | BIGINT | NOT NULL | Harga penawaran kita |
| `price_gap` | BIGINT | NULL | Selisih harga (winner_price - our_price; bisa negatif) |
| `notes` | TEXT | NULL | Catatan analisis tambahan dari Cabang |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 1.5 Business Rules — Loss Reason

| ID | Rule |
|---|---|
| BR-LOSS-01 | Saat input hasil tender = "Kalah", field loss_reason_id wajib diisi |
| BR-LOSS-02 | Alasan kekalahan harus dipilih dari Master Alasan Kekalahan; input freeform tidak diizinkan |
| BR-LOSS-03 | Jika alasan = LAINNYA, field `notes` menjadi wajib diisi minimal 20 karakter |
| BR-LOSS-04 | Alasan kekalahan yang sudah digunakan proyek tidak bisa dihapus permanen |
| BR-LOSS-05 | `price_gap` dikalkulasi otomatis backend dari `winner_price - our_price` |

### 1.6 Loss Analysis Queries

```sql
-- Distribusi alasan kekalahan (12 bulan terakhir)
SELECT
  lr.category,
  lr.name AS loss_reason,
  COUNT(*) AS total_kalah,
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER() * 100, 1) AS pct
FROM project_loss_details pld
JOIN loss_reasons lr ON lr.id = pld.loss_reason_id
JOIN projects p ON p.id = pld.project_id
WHERE p.updated_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY lr.id
ORDER BY total_kalah DESC;

-- Rata-rata gap harga saat kalah per kategori
SELECT
  pc.name AS category,
  AVG(pld.price_gap) AS avg_price_gap,
  COUNT(*) AS sample_size
FROM project_loss_details pld
JOIN projects p ON p.id = pld.project_id
JOIN project_categories pc ON pc.id = p.category_id
WHERE pld.winner_price IS NOT NULL
GROUP BY pc.id;
```

### 1.7 API Endpoints — Loss Reason

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/master/loss-reasons | Auth | List alasan aktif (untuk dropdown) |
| GET | /api/config/loss-reasons | Admin | List semua dengan CRUD |
| POST | /api/config/loss-reasons | Admin | Buat alasan baru |
| PUT | /api/config/loss-reasons/:id | Admin | Update |
| PUT | /api/config/loss-reasons/:id/deactivate | Admin | Nonaktifkan |
| GET | /api/reports/loss-analysis | Management, Admin | Laporan analisis kekalahan |

### 1.8 DDL

```sql
CREATE TABLE loss_reasons (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)    NOT NULL,
  code        VARCHAR(50)     NOT NULL,
  category    ENUM('harga','teknis','relasi','administrasi','waktu','lainnya') NOT NULL,
  description TEXT            NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_loss_reasons_code (code),
  UNIQUE KEY uq_loss_reasons_name (name),
  KEY idx_loss_reasons_category (category),
  KEY idx_loss_reasons_sort     (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_loss_details (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id            BIGINT UNSIGNED NOT NULL,
  loss_reason_id        BIGINT UNSIGNED NOT NULL,
  secondary_reason_id   BIGINT UNSIGNED NULL,
  winner_competitor_id  BIGINT UNSIGNED NULL,
  winner_price          BIGINT          NULL,
  our_price             BIGINT          NOT NULL,
  price_gap             BIGINT          NULL,
  notes                 TEXT            NULL,
  created_by            BIGINT UNSIGNED NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pld_project (project_id),
  KEY idx_pld_loss_reason   (loss_reason_id),
  KEY idx_pld_competitor    (winner_competitor_id),
  CONSTRAINT fk_pld_project    FOREIGN KEY (project_id)           REFERENCES projects(id),
  CONSTRAINT fk_pld_reason     FOREIGN KEY (loss_reason_id)       REFERENCES loss_reasons(id),
  CONSTRAINT fk_pld_sec_reason FOREIGN KEY (secondary_reason_id)  REFERENCES loss_reasons(id) ON DELETE SET NULL,
  CONSTRAINT fk_pld_competitor FOREIGN KEY (winner_competitor_id) REFERENCES competitors(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. MASTER APPROVAL LEVEL (MD-06)

### 2.1 Purpose

Mendefinisikan level hirarki dalam proses approval untuk referensi konfigurasi workflow. Digunakan oleh Approval Engine untuk menentukan eskalasi otomatis.

### 2.2 Entity: ApprovalLevel

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Nama level (mis: L1 - PM Review, L2 - Management) |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Kode (L1, L2, L3) |
| `level_number` | TINYINT UNSIGNED | NOT NULL | Nomor urut level (1 = terendah) |
| `escalates_to_level_id` | BIGINT UNSIGNED | NULL, FK → approval_levels.id | Level eskalasi berikutnya |
| `description` | TEXT | NULL | |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 2.3 Default Approval Levels

| Code | Name | level_number | escalates_to |
|---|---|---|---|
| L1 | Review PM / Kepala Cabang | 1 | L2 |
| L2 | Review Departemen / Kepala Dept | 2 | L3 |
| L3 | Persetujuan Management | 3 | NULL (terminal) |

### 2.4 DDL

```sql
CREATE TABLE approval_levels (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(100)    NOT NULL,
  code                  VARCHAR(20)     NOT NULL,
  level_number          TINYINT UNSIGNED NOT NULL,
  escalates_to_level_id BIGINT UNSIGNED NULL,
  description           TEXT            NULL,
  is_active             TINYINT(1)      NOT NULL DEFAULT 1,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_al_code         (code),
  UNIQUE KEY uq_al_level_number (level_number),
  CONSTRAINT fk_al_escalates FOREIGN KEY (escalates_to_level_id) REFERENCES approval_levels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. MASTER NOTIFIKASI TEMPLATE (MD-12)

### 3.1 Purpose

Mendefinisikan template teks untuk setiap event notifikasi in-app (dan email di Fase 2). Template mendukung variabel placeholder yang disubstitusi saat runtime. Admin dapat mengubah teks template melalui UI konfigurasi (CFG-09) tanpa coding.

### 3.2 Entity: NotificationTemplate

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `event_code` | VARCHAR(100) | NOT NULL, UNIQUE | Kode event sistem (snake_case) |
| `event_name` | VARCHAR(200) | NOT NULL | Nama event untuk display Admin |
| `template_inapp` | TEXT | NOT NULL | Template pesan in-app; mendukung {{variable}} |
| `template_email_subject` | VARCHAR(300) | NULL | Subject email (Fase 2) |
| `template_email_body` | TEXT | NULL | Body email HTML (Fase 2) |
| `recipient_roles` | JSON | NOT NULL | Array role penerima: ["cabang","pm"] |
| `available_variables` | JSON | NOT NULL | Daftar variabel yang tersedia untuk template ini |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `is_system` | TINYINT(1) | NOT NULL DEFAULT 1 | Template system tidak bisa dihapus |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 3.3 Default Notification Templates (Data Seed)

| event_code | event_name | template_inapp | recipient_roles |
|---|---|---|---|
| `prospect.submitted` | Prospek Disubmit ke PM | "Prospek **{{prospectName}}** dari {{branchName}} menunggu review Anda." | ["pm"] |
| `prospect.revision_sent` | Revisi Prospek Dikirim | "PM meminta revisi untuk prospek **{{prospectName}}**. Silakan periksa pertanyaan review." | ["cabang"] |
| `prospect.approved` | Prospek Disetujui | "Prospek **{{prospectName}}** telah disetujui oleh PM. Anda dapat mengkonversinya menjadi proyek." | ["cabang"] |
| `project.rks_submitted` | RKS Disubmit | "RKS proyek **{{projectName}}** menunggu review Anda." | ["pm"] |
| `project.rks_revision` | Revisi RKS | "PM meminta revisi RKS untuk proyek **{{projectName}}**." | ["cabang"] |
| `project.rks_approved` | RKS Disetujui | "RKS proyek **{{projectName}}** disetujui. Proses dapat dilanjutkan ke tahap berikutnya." | ["cabang"] |
| `project.lphs_dept_requested` | Review LPHS Diminta | "Departemen {{deptName}} diminta untuk mereview LPHS proyek **{{projectName}}**." | ["department"] |
| `project.lphs_all_dept_approved` | Semua Dept Setujui LPHS | "Semua departemen telah menyetujui LPHS proyek **{{projectName}}**. Menunggu persetujuan Management." | ["management"] |
| `project.lphs_mgmt_approved` | LPHS Disetujui Management | "LPHS proyek **{{projectName}}** disetujui oleh Management." | ["cabang","pm"] |
| `project.deadline_approaching` | Deadline Tender Mendekat | "⚠️ Proyek **{{projectName}}** memiliki deadline tender dalam {{daysRemaining}} hari ({{deadlineDate}})." | ["cabang","pm"] |
| `project.sla_warning` | Peringatan SLA Approval | "⏰ Item approval **{{itemName}}** akan mencapai batas SLA dalam {{hoursRemaining}} jam." | ["approver"] |
| `project.cancelled` | Proyek Dibatalkan | "Proyek **{{projectName}}** telah dibatalkan. Alasan: {{cancelReason}}." | ["cabang"] |

### 3.4 Variable Substitution

Saat mengirim notifikasi, backend melakukan substitusi:
```php
$message = str_replace(
    ['{{prospectName}}', '{{branchName}}', '{{daysRemaining}}'],
    [$prospect->name, $prospect->branch->name, $daysRemaining],
    $template->template_inapp
);
```

### 3.5 DDL

```sql
CREATE TABLE notification_templates (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_code              VARCHAR(100)    NOT NULL,
  event_name              VARCHAR(200)    NOT NULL,
  template_inapp          TEXT            NOT NULL,
  template_email_subject  VARCHAR(300)    NULL,
  template_email_body     TEXT            NULL,
  recipient_roles         JSON            NOT NULL,
  available_variables     JSON            NOT NULL,
  is_active               TINYINT(1)      NOT NULL DEFAULT 1,
  is_system               TINYINT(1)      NOT NULL DEFAULT 1,
  created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nt_event_code (event_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-LOSS-01 | Cabang input hasil tender = "Kalah" tanpa pilih alasan | Error: "Alasan kekalahan wajib dipilih" |
| TC-LOSS-02 | Pilih alasan "LAINNYA" tanpa isi notes | Error: "Catatan wajib diisi minimal 20 karakter untuk alasan Lainnya" |
| TC-LOSS-03 | Laporan analisis kekalahan menampilkan distribusi per kategori | Bar chart persentase per kategori alasan muncul |
| TC-NOTIF-01 | Admin ubah template pesan "prospect.approved" | Notifikasi berikutnya menggunakan teks baru |
| TC-NOTIF-02 | Variabel {{daysRemaining}} dalam template tersubstitusi dengan nilai aktual | Pesan tampil "deadline dalam 3 hari" |

**Gap Resolution:** GAP-12 ✓ | MD-06 ✓ | MD-12 ✓ | MD-15 ✓
