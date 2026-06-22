# 027 — KONFIGURASI ORGANISASI & APPROVAL WORKFLOW
## KINETIC CRM — CFG-01 dan CFG-02

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 027 |
| **Nama Dokumen** | Konfigurasi Organisasi & Approval Workflow |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.2 (CFG-01, CFG-02), D.3, D.5 |
| **Gap Resolution** | CFG-01 High Priority, CFG-02 High Priority, GAP-05, GAP-07 |
| **Status** | Final |

---

## 1. CFG-01 — KONFIGURASI HIERARKI ORGANISASI

### 1.1 Overview

CFG-01 adalah modul UI untuk mengelola entitas hierarki organisasi yang didefinisikan secara teknis di dokumen 015. Fokus dokumen ini adalah **perilaku UI, validasi interaksi, dan rules konfigurasi** yang berlaku saat Admin menggunakan antarmuka ini.

### 1.2 UI Behavior — Tree Navigator

Tree navigator menggunakan komponen hierarki dua-panel:
- **Panel Kiri (1/3):** Tree expandable dengan node per entitas; setiap node memiliki ikon, nama, dan badge status
- **Panel Kanan (2/3):** Form edit entitas yang dipilih + daftar entitas anak + tombol tambah anak

```
Panel Kiri                    Panel Kanan
─────────────────────────     ──────────────────────────────────────
▼ 🏢 PT. Maju Bersama         Editing: Divisi Infrastruktur
  ▼ 📊 Divisi Infrastruktur   ─────────────────────────────────────
    ▼ 👥 Engineering          Nama Divisi: [Divisi Infrastruktur  ]
    ▷ 👥 Legal                Kode:        [INFRA                 ]
    ▷ 👥 Finance              Kepala:      [Pak Budi (dropdown)   ]
    ▼ 📍 Cabang Jakarta       ─────────────────────────────────────
    ▷ 📍 Cabang Surabaya      Sub-entitas:
  ▷ 📊 Divisi Teknologi       + Tambah Departemen
                              + Tambah Cabang
                              ─────────────────────────────────────
                              [Simpan] [Nonaktifkan]
```

### 1.3 Tree Node States

| State | Visual | Keterangan |
|---|---|---|
| Aktif (default) | Teks normal, ikon berwarna | Entitas aktif dan bisa dipilih |
| Nonaktif | Teks italic abu-abu, ikon pudar | Entitas nonaktif; tidak bisa dipilih untuk operasi baru |
| Dipilih | Background biru muda, border kiri biru | Entitas yang sedang diedit di panel kanan |
| Loading | Skeleton shimmer | Saat tree dimuat pertama kali |
| Expanded | Ikon chevron down + anak-anak visible | Node yang sudah dibuka |
| Collapsed | Ikon chevron right + anak-anak hidden | Node yang belum dibuka |

### 1.4 Cascade Deactivation Dialog

Saat admin menekan "Nonaktifkan" pada entitas yang memiliki anak, sistem menampilkan dialog konfirmasi dengan rincian dampak:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Konfirmasi Nonaktifkan                               │
├─────────────────────────────────────────────────────────┤
│ Anda akan menonaktifkan "Divisi Infrastruktur".         │
│                                                         │
│ Tindakan ini akan menonaktifkan:                        │
│   • 3 departemen                                        │
│   • 2 cabang                                            │
│   • 18 pengguna aktif                                   │
│                                                         │
│ ⚠️ 12 proyek aktif milik cabang di divisi ini akan      │
│ tetap berjalan namun tidak bisa membuat proyek baru.    │
│                                                         │
│                    [Batal]  [Ya, Nonaktifkan]           │
└─────────────────────────────────────────────────────────┘
```

Tombol "Ya, Nonaktifkan" berwarna merah (danger). Batal mendapat fokus default.

### 1.5 Form Validation Rules per Entity Type

**Perusahaan:**
- Nama: required, unique global, 2–200 char
- Kode: required, unique global, 2–20 char, uppercase alphanumeric, auto-uppercase saat blur
- Logo: optional, PNG/JPG/SVG, max 2MB, preview setelah upload

**Divisi:**
- Nama: required, 2–200 char
- Kode: required, unique per perusahaan, 2–20 char, uppercase
- Perusahaan Induk: required, harus aktif, read-only jika sudah ada anak-anak

**Departemen:**
- Nama: required, 2–200 char
- Kode: required, unique per divisi, 2–20 char
- Divisi Induk: required, harus aktif
- Kepala Departemen: optional; user dengan role=department; validasi async

**Cabang:**
- Nama: required, 2–200 char
- Kode: required, unique per divisi, 2–20 char
- Kota: required
- Divisi Induk: required, harus aktif

---

## 2. CFG-02 — KONFIGURASI APPROVAL WORKFLOW

### 2.1 Overview

CFG-02 mendefinisikan alur approval yang berlaku untuk setiap tipe proyek. Ini adalah konfigurasi paling kritis dalam sistem karena menentukan siapa yang melakukan apa di setiap tahap tender.

**Prinsip desain fundamental dari BA Review D.3:**
> Approval dikonfigurasi berbasis **posisi/role**, bukan username individual. Pergantian pejabat tidak memerlukan reconfigurasi workflow.

### 2.2 Workflow Configuration Model

Setiap workflow terdiri dari **ordered list of stages**. Setiap stage memiliki:

```
WorkflowConfig
├── type: 'tender' | 'prospecting'
└── stages: [
      Stage {
        id, name, order,
        approver_role: 'pm' | 'department' | 'management',
        approver_position_id: FK → positions.id (opsional, lebih spesifik)
        backup_approver_user_id: FK → users.id (opsional, fallback manual)
        sla_working_days: number (dari CFG-05; ikut per-stage atau override)
        allowed_actions: ['approve', 'revise']
        requires_all_departments: boolean (untuk LPHS: harus semua dept approve)
        is_parallel: boolean (true = semua dept review paralel)
        is_active: boolean
      }
    ]
```

### 2.3 Entity: WorkflowStage

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `workflow_type` | ENUM('tender','prospecting') | NOT NULL | Tipe workflow |
| `name` | VARCHAR(200) | NOT NULL | Nama tahap |
| `stage_order` | TINYINT UNSIGNED | NOT NULL | Urutan tahap (1-based) |
| `approver_role` | VARCHAR(50) | NOT NULL | Role yang approve: pm/department/management |
| `approver_position_id` | BIGINT UNSIGNED | NULL, FK → positions.id | Posisi spesifik (opsional) |
| `backup_approver_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | Backup approver manual |
| `sla_working_days` | TINYINT UNSIGNED | NOT NULL DEFAULT 3 | Batas SLA tahap ini |
| `allowed_actions` | JSON | NOT NULL | ["approve","revise"] |
| `is_parallel` | TINYINT(1) | NOT NULL DEFAULT 0 | True untuk review paralel dept |
| `requires_all_departments` | TINYINT(1) | NOT NULL DEFAULT 0 | Semua dept harus approve |
| `related_project_stage` | VARCHAR(50) | NULL | Kode status proyek yang terkait |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Unique Constraint:** `UNIQUE(workflow_type, stage_order)`

### 2.4 Default Workflow Configuration

**Workflow Tender:**

| Order | Nama Tahap | approver_role | is_parallel | SLA |
|---|---|---|:---:|---|
| 1 | Review RKS | pm | false | 3 hari kerja |
| 2 | Review Departemen + LPHS | department | true | 5 hari kerja |
| 3 | Persetujuan Management LPHS | management | false | 2 hari kerja |
| 4 | Input Harga | (Cabang submit, bukan approval) | false | — |
| 5 | Pengumuman Pemenang | (Cabang input) | false | — |
| 6 | Target Delivery | (Cabang input) | false | — |

**Workflow Prospecting:**

| Order | Nama Tahap | approver_role | SLA |
|---|---|:---:|---|
| 1 | Review Prospek | pm | 3 hari kerja |
| 2 | Input Harga | — | — |
| 3 | Pengumuman Pemenang | — | — |

### 2.5 Workflow Snapshot per Proyek

**Penting:** Setiap proyek menyimpan **snapshot konfigurasi workflow** pada saat proyek dibuat. Perubahan konfigurasi tidak retroaktif.

```sql
CREATE TABLE project_workflow_snapshots (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id    BIGINT UNSIGNED NOT NULL UNIQUE,
  workflow_type ENUM('tender','prospecting') NOT NULL,
  snapshot_data JSON            NOT NULL,  -- copy seluruh workflow stages saat proyek dibuat
  snapshotted_at TIMESTAMP      NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_pws_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.6 UI: Workflow Builder

Antarmuka konfigurasi workflow menggunakan builder visual:

```
Tab: [Workflow Tender] [Workflow Prospecting]

N proyek aktif menggunakan konfigurasi ini. Perubahan hanya berlaku untuk proyek baru.

TAHAP 1 ────────────────────────────────────────────────────── [Drag ⣿]
  Nama Tahap:    [Review RKS                                  ]
  Approver Role: [Project Manager (PM)        ▼]
  Posisi:        [PM (opsional, lebih spesifik) ▼]
  Backup User:   [Pak Cahyo - PM Backup        ▼]
  SLA:           [3] hari kerja
  Aksi:          [✓] Approve  [✓] Kirim Revisi
  Paralel:       [ ] Ya (untuk review departemen)
  Status:        [✓] Aktif

  [Hapus Tahap]

TAHAP 2 ────────────────────────────────────────────────────── [Drag ⣿]
  ...

[+ Tambah Tahap]

──────────────────────────────────────
Preview Flowchart:
[Buat Proyek] → [Review RKS (PM, 3HK)] → [Review Dept + LPHS (paralel, 5HK)]
             → [Approval Management (2HK)] → [Input Harga] → [Selesai]

[Simpan Konfigurasi]
```

### 2.7 Preview Flowchart

Preview flowchart divisualisasikan sebagai diagram alur horizontal sederhana (SVG atau HTML + CSS) yang menggambarkan urutan tahap dan approver-nya. Diperbarui real-time saat konfigurasi berubah (sebelum disimpan).

### 2.8 Business Rules — CFG-02

| ID | Rule |
|---|---|
| BR-CFG02-01 | Minimal harus ada 1 tahap aktif dalam setiap workflow |
| BR-CFG02-02 | Urutan tahap tidak boleh ada yang sama (unique constraint pada stage_order per workflow_type) |
| BR-CFG02-03 | Jika is_parallel = true, semua dept yang dipilih di proyek LPHS harus approve sebelum lanjut |
| BR-CFG02-04 | Backup approver yang dipilih harus user dengan can_approve = true (via posisi) |
| BR-CFG02-05 | Perubahan konfigurasi memunculkan banner peringatan: "N proyek aktif menggunakan konfigurasi sebelumnya" |
| BR-CFG02-06 | Setiap perubahan workflow dicatat di audit log dengan before/after snapshot |
| BR-CFG02-07 | Backup approver di tahap ini override backup approver global dari tabel posisi |

### 2.9 API Endpoints — CFG-02

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/workflow | Admin | List semua workflow stages per tipe |
| GET | /api/config/workflow/tender | Admin | Workflow tender |
| GET | /api/config/workflow/prospecting | Admin | Workflow prospecting |
| PUT | /api/config/workflow/:type | Admin | Simpan konfigurasi workflow (replace all stages) |
| GET | /api/config/workflow/:type/active-projects-count | Admin | Berapa proyek aktif yang menggunakan konfigurasi ini |

### 2.10 DDL

```sql
CREATE TABLE workflow_stages (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workflow_type            ENUM('tender','prospecting') NOT NULL,
  name                     VARCHAR(200)    NOT NULL,
  stage_order              TINYINT UNSIGNED NOT NULL,
  approver_role            VARCHAR(50)     NOT NULL,
  approver_position_id     BIGINT UNSIGNED NULL,
  backup_approver_user_id  BIGINT UNSIGNED NULL,
  sla_working_days         TINYINT UNSIGNED NOT NULL DEFAULT 3,
  allowed_actions          JSON            NOT NULL,
  is_parallel              TINYINT(1)      NOT NULL DEFAULT 0,
  requires_all_departments TINYINT(1)      NOT NULL DEFAULT 0,
  related_project_stage    VARCHAR(50)     NULL,
  is_active                TINYINT(1)      NOT NULL DEFAULT 1,
  created_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ws_type_order (workflow_type, stage_order),
  KEY idx_ws_type           (workflow_type),
  CONSTRAINT fk_ws_position FOREIGN KEY (approver_position_id)    REFERENCES positions(id) ON DELETE SET NULL,
  CONSTRAINT fk_ws_backup   FOREIGN KEY (backup_approver_user_id) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-CFG01-01 | Admin tambah cabang baru di bawah divisi aktif | Cabang tersimpan; muncul di tree sebagai anak divisi |
| TC-CFG01-02 | Admin coba tambah cabang di bawah divisi nonaktif | Error: "Divisi induk tidak aktif" |
| TC-CFG01-03 | Nonaktifkan perusahaan satu-satunya | Error: "Tidak dapat menonaktifkan satu-satunya perusahaan aktif" |
| TC-CFG02-01 | Admin simpan workflow tender dengan 0 tahap aktif | Error: "Workflow harus memiliki minimal 1 tahap aktif" |
| TC-CFG02-02 | Admin ubah SLA tahap Review RKS dari 3 → 5 hari kerja | Perubahan disimpan; proyek baru menggunakan SLA 5 hari; proyek lama tetap 3 hari |
| TC-CFG02-03 | Admin hapus backup approver dari konfigurasi | Approval routing tetap ke approver utama; fallback ke null (Admin notified) |
| TC-CFG02-04 | Preview flowchart diperbarui saat urutan tahap di-drag | Preview berubah real-time sebelum save |

**Gap Resolution:** CFG-01 ✓ | CFG-02 ✓ | GAP-05 ✓ | GAP-07 ✓
