# 029 — KONFIGURASI SLA, REMINDER & ESKALASI
## KINETIC CRM — CFG-05 dan CFG-06

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 029 |
| **Nama Dokumen** | Konfigurasi SLA, Reminder & Eskalasi |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.2 (CFG-05, CFG-06), C.1 (GAP-06), D.5 |
| **Gap Resolution** | **GAP-06 Major**, CFG-05 High Priority, CFG-06 |
| **Status** | Final |

---

## 1. CFG-05 — KONFIGURASI SLA PER TAHAP APPROVAL

### 1.1 Overview

SLA (Service Level Agreement) mendefinisikan batas waktu maksimal dalam **hari kerja** untuk setiap tahap approval. BA Review GAP-06 (Major) mengidentifikasi bahwa PRD v1.0 tidak memiliki mekanisme SLA enforcement sama sekali — tidak ada batas waktu, tidak ada reminder, tidak ada eskalasi otomatis.

CFG-05 menyelesaikan ini dengan konfigurasi SLA yang dapat disesuaikan per tahap tanpa coding.

### 1.2 Entity: SlaConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `workflow_stage_id` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → workflow_stages.id | Tahap yang dikonfigurasi SLA-nya |
| `working_days_limit` | TINYINT UNSIGNED | NOT NULL | Batas hari kerja |
| `is_enforced` | TINYINT(1) | NOT NULL DEFAULT 1 | Jika false: tracking saja, tidak ada alert |
| `reminder_1_days_before` | TINYINT UNSIGNED | NULL | Kirim reminder pertama X hari sebelum deadline |
| `reminder_2_days_before` | TINYINT UNSIGNED | NULL | Reminder kedua (opsional) |
| `escalation_days_after` | TINYINT UNSIGNED | NULL | Eskalasi N hari setelah SLA terlampaui |
| `escalation_target_role` | VARCHAR(50) | NULL | Role yang menerima notifikasi eskalasi |
| `escalation_target_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | User spesifik yang menerima eskalasi |
| `notification_channels` | JSON | NOT NULL DEFAULT '["inapp"]' | ["inapp","email"] |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 1.3 Default SLA Configuration

| Tahap | Batas HK | Reminder 1 | Reminder 2 | Eskalasi Setelah | Eskalasi Ke |
|---|---|---|---|---|---|
| Review RKS (PM) | 3 HK | 1 HK sebelum | — | 1 HK setelah | management role |
| Review Dept LPHS | 5 HK | 2 HK sebelum | 1 HK sebelum | 2 HK setelah | management role |
| Approval Mgmt LPHS | 2 HK | 1 HK sebelum | — | 1 HK setelah | admin |
| Review Prospek (PM) | 3 HK | 1 HK sebelum | — | 1 HK setelah | management role |

### 1.4 UI — Halaman Konfigurasi SLA

Setiap workflow stage ditampilkan sebagai card yang dapat di-expand:

```
┌──────────────────────────────────────────────────────────┐
│ 📋 TAHAP 1: Review RKS (PM)                    [▼ Buka] │
├──────────────────────────────────────────────────────────┤
│ SLA Enforcement:        [✓] Aktif                        │
│ Batas Hari Kerja:       [3 ] hari kerja                  │
│                                                          │
│ REMINDER                                                 │
│ Reminder Pertama:       [1 ] hari kerja sebelum deadline │
│ Reminder Kedua:         [  ] hari kerja (kosong = tidak) │
│                                                          │
│ ESKALASI                                                 │
│ Eskalasi Otomatis:      [1 ] hari setelah SLA terlampaui │
│ Eskalasi Ke Role:       [Management ▼]                   │
│ Atau User Spesifik:     [Pilih user (opsional) ▼]        │
│                                                          │
│ Channel:                [✓] In-App  [ ] Email (Fase 2)   │
│                                                          │
│ Preview Kalkulasi:                                       │
│ "Jika disubmit hari Senin 2 Jun 2025:                   │
│  - Deadline: Kamis 5 Jun 2025 (3 hari kerja)            │
│  - Reminder: Rabu 4 Jun 2025"                           │
│                                                          │
│                                       [Simpan Tahap Ini] │
└──────────────────────────────────────────────────────────┘
```

### 1.5 Preview Kalkulasi Real-time

Saat Admin mengubah nilai `working_days_limit`, sistem menampilkan preview kalkulasi secara real-time:

- Input: hari ini = tanggal saat ini
- Kalkulasi: panggil fungsi `addWorkingDays()` dari dokumen 025
- Output: "Jika disubmit hari ini (Senin 2 Jun), deadline = {tanggal hasil kalkulasi}"

Ini membantu Admin memvalidasi bahwa konfigurasi yang diinput masuk akal.

### 1.6 Business Rules — CFG-05

| ID | Rule |
|---|---|
| BR-SLA-01 | `reminder_1_days_before` harus < `working_days_limit` |
| BR-SLA-02 | `reminder_2_days_before` harus < `reminder_1_days_before` (reminder kedua lebih dekat deadline) |
| BR-SLA-03 | Kalkulasi hari kerja menggunakan Master Hari Libur (dokumen 025) |
| BR-SLA-04 | SLA dihitung mulai hari **berikutnya** setelah submission (tidak termasuk hari H submission) |
| BR-SLA-05 | Jika `is_enforced = false`: SLA tracking tetap berjalan tetapi tidak ada alert; digunakan untuk monitoring |
| BR-SLA-06 | Eskalasi dikirim satu kali; tidak berulang kecuali dikonfigurasi ulang |
| BR-SLA-07 | Perubahan SLA tidak berlaku retroaktif; proyek yang sudah dalam proses approval menggunakan SLA saat submission |

### 1.7 API Endpoints — CFG-05

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/sla | Admin | List konfigurasi SLA semua tahap |
| PUT | /api/config/sla/:workflowStageId | Admin | Update SLA untuk satu tahap |
| GET | /api/config/sla/preview | Admin | Preview kalkulasi deadline (query: stageId, fromDate) |

---

## 2. CFG-06 — KONFIGURASI REMINDER & ESKALASI

### 2.1 Overview

CFG-06 adalah extension dari CFG-05 yang mengonfigurasi detail reminder (siapa dikirim, kapan, konten) dan eskalasi (kondisi trigger, penerima). Sementara CFG-05 mengontrol timing, CFG-06 mengontrol konten dan penerima.

### 2.2 Entity: ReminderConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `sla_config_id` | BIGINT UNSIGNED | NOT NULL, FK → sla_configs.id | SLA config yang terhubung |
| `reminder_sequence` | TINYINT UNSIGNED | NOT NULL | 1 = reminder pertama, 2 = kedua |
| `recipient_roles` | JSON | NOT NULL | Array role penerima: ["pm","cabang"] |
| `recipient_user_ids` | JSON | NULL | User spesifik tambahan |
| `notification_template_id` | BIGINT UNSIGNED | NOT NULL, FK → notification_templates.id | Template pesan |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 2.3 Entity: EscalationConfig

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `sla_config_id` | BIGINT UNSIGNED | NOT NULL, FK → sla_configs.id | |
| `escalation_sequence` | TINYINT UNSIGNED | NOT NULL DEFAULT 1 | Level eskalasi |
| `trigger_days_after_sla` | TINYINT UNSIGNED | NOT NULL | Hari setelah SLA terlampaui |
| `recipient_roles` | JSON | NOT NULL | Array role penerima eskalasi |
| `recipient_user_ids` | JSON | NULL | User spesifik tambahan |
| `notification_template_id` | BIGINT UNSIGNED | NOT NULL, FK → notification_templates.id | |
| `auto_reassign` | TINYINT(1) | NOT NULL DEFAULT 0 | Apakah otomatis re-assign ke backup approver |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |

### 2.4 Alur SLA + Reminder + Eskalasi

```
Submission masuk
  ↓
SLA Engine menghitung deadline = submission + N hari kerja (skip weekend + holiday)
  ↓
Scheduler job (cron setiap 1 jam) cek:
  ├── Jika (deadline - today) ≤ reminder_1_days_before → kirim reminder 1
  ├── Jika (deadline - today) ≤ reminder_2_days_before → kirim reminder 2
  ├── Jika today > deadline → status SLA = OVERDUE; kirim notif OVERDUE ke approver
  └── Jika (today - deadline) ≥ escalation_days_after → eskalasi ke management/admin
        └── Jika auto_reassign = true → re-assign ke backup approver otomatis
```

### 2.5 SLA Status pada Approval Item

Setiap approval item memiliki status SLA yang dikalkulasi real-time:

| Status SLA | Kondisi | Warna |
|---|---|---|
| `on_time` | Sisa hari > reminder_1_days_before | Hijau |
| `warning` | Sisa hari ≤ reminder_1_days_before | Kuning |
| `critical` | Sisa hari ≤ 1 | Oranye |
| `overdue` | Sudah melewati deadline | Merah |
| `not_enforced` | `is_enforced = false` | Abu-abu |

Status ini ditampilkan di:
- Kolom "SLA Sisa" di Approval Inbox (APPR-01)
- Badge di widget Approval Pending di Dashboard
- Detail approval dalam drawer review (APPR-02)

### 2.6 Entity: ApprovalSlaTracking

Tracking aktual setiap approval item:

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `approval_request_id` | BIGINT UNSIGNED | FK ke tabel approval requests |
| `workflow_stage_id` | BIGINT UNSIGNED | Tahap yang sedang berjalan |
| `submitted_at` | TIMESTAMP | Waktu submission ke tahap ini |
| `deadline_at` | TIMESTAMP | Kalkulasi deadline (hari kerja) |
| `sla_status` | ENUM(...) | Status SLA saat ini |
| `reminder_1_sent_at` | TIMESTAMP NULL | Kapan reminder pertama dikirim |
| `reminder_2_sent_at` | TIMESTAMP NULL | Kapan reminder kedua dikirim |
| `escalation_sent_at` | TIMESTAMP NULL | Kapan eskalasi dikirim |
| `resolved_at` | TIMESTAMP NULL | Kapan approval diselesaikan |
| `is_overdue` | TINYINT(1) | Apakah selesai setelah deadline |

### 2.7 DDL

```sql
CREATE TABLE sla_configs (
  id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workflow_stage_id           BIGINT UNSIGNED NOT NULL,
  working_days_limit          TINYINT UNSIGNED NOT NULL,
  is_enforced                 TINYINT(1)       NOT NULL DEFAULT 1,
  reminder_1_days_before      TINYINT UNSIGNED NULL,
  reminder_2_days_before      TINYINT UNSIGNED NULL,
  escalation_days_after       TINYINT UNSIGNED NULL,
  escalation_target_role      VARCHAR(50)      NULL,
  escalation_target_user_id   BIGINT UNSIGNED  NULL,
  notification_channels       JSON             NOT NULL DEFAULT '["inapp"]',
  created_at                  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sla_stage (workflow_stage_id),
  CONSTRAINT fk_sla_stage   FOREIGN KEY (workflow_stage_id)         REFERENCES workflow_stages(id),
  CONSTRAINT fk_sla_user    FOREIGN KEY (escalation_target_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approval_sla_tracking (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  approval_request_id  BIGINT UNSIGNED NOT NULL,
  workflow_stage_id    BIGINT UNSIGNED NOT NULL,
  submitted_at         TIMESTAMP       NOT NULL,
  deadline_at          TIMESTAMP       NOT NULL,
  sla_status           ENUM('on_time','warning','critical','overdue','not_enforced','resolved') NOT NULL DEFAULT 'on_time',
  reminder_1_sent_at   TIMESTAMP       NULL,
  reminder_2_sent_at   TIMESTAMP       NULL,
  escalation_sent_at   TIMESTAMP       NULL,
  resolved_at          TIMESTAMP       NULL,
  is_overdue           TINYINT(1)      NOT NULL DEFAULT 0,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ast_request   (approval_request_id),
  KEY idx_ast_status    (sla_status),
  KEY idx_ast_deadline  (deadline_at),
  CONSTRAINT fk_ast_stage FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-SLA-01 | SLA 3 HK, submission Senin, tidak ada hari libur | Deadline = Kamis |
| TC-SLA-02 | SLA 3 HK, submission Kamis, Jumat libur nasional | Deadline = Selasa minggu depan (skip Jumat libur + weekend) |
| TC-SLA-03 | Reminder 1 HK sebelum deadline, hari ini = H-1 | Notifikasi reminder dikirim ke PM |
| TC-SLA-04 | SLA terlampaui 1 hari | Status = OVERDUE; badge merah di Approval Inbox |
| TC-SLA-05 | Eskalasi 1 HK setelah SLA terlampaui, `auto_reassign = true` | Notif eskalasi ke management; approval di-reassign ke backup approver |
| TC-SLA-06 | Admin set `is_enforced = false` untuk tahap Review Dept | Tidak ada alert SLA untuk tahap itu; tracking tetap berjalan (untuk statistik) |
| TC-CFG06-01 | Admin ubah reminder dari 1 HK menjadi 2 HK sebelum deadline | Reminder berikutnya menggunakan timing baru; yang sudah dikirim tidak terpengaruh |

**Gap Resolution:** GAP-06 ✓ | CFG-05 ✓ | CFG-06 ✓ | MD-13 (kalkulasi hari kerja) ✓
