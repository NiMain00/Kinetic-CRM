# 016 — POSITION MANAGEMENT MODULE
## KINETIC CRM — Master Posisi & Jabatan

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 016 |
| **Nama Dokumen** | Position Management Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section D.3, D.5 |
| **Gap Resolution** | GAP-05, GAP-07, CFG-02 |
| **Status** | Final |

---

## 1. PURPOSE & BUSINESS CONTEXT

### 1.1 Masalah yang Diselesaikan

BA Review (Section D.3) mengidentifikasi bahwa approval workflow pada PRD v1.0 dikonfigurasi per **user spesifik** (hardcode nama orang). Ini berarti:

- Saat ada pergantian pejabat (PM resign, Kepala Dept ganti), semua konfigurasi approval di seluruh proyek aktif harus diperbarui secara manual
- Tidak ada cara sistematis untuk mendefinisikan "siapapun yang menjabat sebagai Head of Engineering"
- Backup approver tidak bisa dikonfigurasi secara dinamis

**Solusi:** Modul Position Management mendefinisikan **jabatan/posisi** sebagai entitas mandiri. Approval workflow dikonfigurasi berbasis posisi (mis: "Head of Engineering"), bukan username. User kemudian di-assign ke posisi. Saat ada pergantian pejabat, cukup update assignment posisi — semua konfigurasi approval otomatis mengikuti.

### 1.2 Tujuan Modul

1. Mendefinisikan Master Posisi/Jabatan yang dapat dikonfigurasi Admin
2. Menjadi referensi untuk konfigurasi approval workflow berbasis posisi
3. Mendukung backup approver per posisi
4. Memungkinkan delegasi sementara (approval delegation)

---

## 2. ENTITY DEFINITION

### 2.1 Entity: Position (Posisi/Jabatan)

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(200) | NOT NULL | Nama jabatan (mis: "Project Manager", "Head of Engineering") |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Kode singkat (mis: PM, HOE, MGMT) |
| `level` | TINYINT UNSIGNED | NOT NULL DEFAULT 1 | Level hierarki: 1=Staff, 2=Supervisor, 3=Manager, 4=Director |
| `description` | TEXT | NULL | Deskripsi tanggung jawab posisi |
| `can_approve` | TINYINT(1) | NOT NULL DEFAULT 0 | Apakah posisi ini bisa menjadi approver dalam workflow |
| `org_scope` | ENUM('company','division','department','branch','global') | NOT NULL DEFAULT 'global' | Scope organisasi yang relevan untuk posisi ini |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `created_by` | BIGINT UNSIGNED | FK → users.id | |
| `updated_by` | BIGINT UNSIGNED | FK → users.id | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Entity: UserPosition (Assignment User ke Posisi)

Satu user bisa memegang satu posisi utama; posisi bisa dipegang oleh beberapa user (mis: ada 5 PM).

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `user_id` | BIGINT UNSIGNED | NOT NULL, FK → users.id | |
| `position_id` | BIGINT UNSIGNED | NOT NULL, FK → positions.id | |
| `org_unit_type` | ENUM('company','division','department','branch') | NULL | Di mana posisi ini dijabat |
| `org_unit_id` | BIGINT UNSIGNED | NULL | ID perusahaan/divisi/dept/cabang tempat posisi dijabat |
| `is_primary` | TINYINT(1) | NOT NULL DEFAULT 1 | Posisi utama user |
| `effective_from` | DATE | NOT NULL | Mulai berlaku |
| `effective_until` | DATE | NULL | Berakhir (NULL = tidak ada batas) |
| `is_active` | TINYINT(1) | NOT NULL DEFAULT 1 | |
| `assigned_by` | BIGINT UNSIGNED | FK → users.id | Admin yang assign |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.3 Entity: ApprovalDelegation (Delegasi Sementara)

Mendukung BA Review D.5: "User bisa mendelegasikan approval-nya ke user lain untuk periode tertentu (saat cuti)."

| Atribut | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | |
| `delegator_user_id` | BIGINT UNSIGNED | NOT NULL, FK → users.id | User yang mendelegasikan |
| `delegate_user_id` | BIGINT UNSIGNED | NOT NULL, FK → users.id | User yang menerima delegasi |
| `delegation_reason` | VARCHAR(500) | NOT NULL | Alasan delegasi (mis: "Cuti tahunan") |
| `start_date` | DATE | NOT NULL | Mulai delegasi |
| `end_date` | DATE | NOT NULL | Akhir delegasi |
| `status` | ENUM('pending_approval','active','expired','cancelled') | NOT NULL DEFAULT 'pending_approval' | |
| `approved_by` | BIGINT UNSIGNED | NULL, FK → users.id | Admin yang menyetujui delegasi |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

---

## 3. DEFAULT POSITIONS (DATA SEED)

Posisi bawaan sistem yang perlu di-seed saat instalasi:

| Code | Name | Level | can_approve | org_scope |
|---|---|---|---|---|
| ADMIN | Administrator Sistem | 4 | 0 | global |
| DIRECTOR | Direktur | 4 | 1 | company |
| MGMT | Management / GM | 3 | 1 | division |
| PM | Project Manager | 3 | 1 | global |
| HOD | Head of Department | 3 | 1 | department |
| HOB | Head of Branch (PIC Cabang) | 3 | 1 | branch |
| STAFF_CABANG | Staf Cabang | 1 | 0 | branch |
| STAFF_DEPT | Staf Departemen | 1 | 0 | department |

---

## 4. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-POS-01 | Posisi yang `can_approve = true` dapat dijadikan approver dalam konfigurasi workflow (CFG-02) |
| BR-POS-02 | Satu user memiliki satu posisi utama (`is_primary = true`); bisa memiliki posisi sekunder (mis: PLT/Acting) |
| BR-POS-03 | Posisi yang sudah digunakan dalam konfigurasi workflow tidak bisa dihapus permanen; hanya bisa dinonaktifkan |
| BR-POS-04 | Jika posisi approver tidak memiliki user yang assigned dan aktif, sistem fallback ke backup approver dari CFG-02 |
| BR-POS-05 | Delegasi approval harus disetujui oleh Admin sebelum berlaku |
| BR-POS-06 | Selama delegasi aktif, semua approval request yang ditujukan ke delegator diteruskan ke delegate |
| BR-POS-07 | Approval yang dilakukan atas delegasi dicatat di audit trail dengan keterangan "atas nama [delegator]" |
| BR-POS-08 | Delegasi tidak berlaku setelah `end_date`; sistem otomatis mengubah status ke `expired` |

---

## 5. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/config/positions | Admin | List semua posisi |
| POST | /api/config/positions | Admin | Buat posisi baru |
| PUT | /api/config/positions/:id | Admin | Update posisi |
| PUT | /api/config/positions/:id/deactivate | Admin | Nonaktifkan posisi |
| GET | /api/config/positions/:id/holders | Admin | Siapa yang menjabat posisi ini saat ini |
| POST | /api/config/user-positions | Admin | Assign user ke posisi |
| PUT | /api/config/user-positions/:id | Admin | Update assignment |
| DELETE | /api/config/user-positions/:id | Admin | Hapus assignment |
| GET | /api/config/delegations | Admin | List delegasi approval |
| POST | /api/config/delegations | Admin/User | Buat permintaan delegasi |
| PUT | /api/config/delegations/:id/approve | Admin | Setujui delegasi |
| PUT | /api/config/delegations/:id/cancel | Admin/Delegator | Batalkan delegasi |

---

## 6. DATABASE SCHEMA (DDL)

```sql
-- ============================================================
-- TABLE: positions
-- ============================================================
CREATE TABLE positions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)    NOT NULL,
  code        VARCHAR(50)     NOT NULL,
  level       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  description TEXT            NULL,
  can_approve TINYINT(1)      NOT NULL DEFAULT 0,
  org_scope   ENUM('company','division','department','branch','global') NOT NULL DEFAULT 'global',
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL,
  updated_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_positions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: user_positions
-- ============================================================
CREATE TABLE user_positions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  position_id   BIGINT UNSIGNED NOT NULL,
  org_unit_type ENUM('company','division','department','branch') NULL,
  org_unit_id   BIGINT UNSIGNED NULL,
  is_primary    TINYINT(1)      NOT NULL DEFAULT 1,
  effective_from DATE           NOT NULL,
  effective_until DATE          NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  assigned_by   BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_up_user     FOREIGN KEY (user_id)     REFERENCES users(id),
  CONSTRAINT fk_up_position FOREIGN KEY (position_id) REFERENCES positions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: approval_delegations
-- ============================================================
CREATE TABLE approval_delegations (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  delegator_user_id  BIGINT UNSIGNED NOT NULL,
  delegate_user_id   BIGINT UNSIGNED NOT NULL,
  delegation_reason  VARCHAR(500)    NOT NULL,
  start_date         DATE            NOT NULL,
  end_date           DATE            NOT NULL,
  status             ENUM('pending_approval','active','expired','cancelled') NOT NULL DEFAULT 'pending_approval',
  approved_by        BIGINT UNSIGNED NULL,
  created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_deleg_delegator FOREIGN KEY (delegator_user_id) REFERENCES users(id),
  CONSTRAINT fk_deleg_delegate  FOREIGN KEY (delegate_user_id)  REFERENCES users(id),
  CONSTRAINT fk_deleg_approver  FOREIGN KEY (approved_by)       REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-POS-01 | Admin assign user ke posisi PM | Assignment tersimpan; user muncul sebagai holder posisi PM |
| TC-POS-02 | PM aktif mendelegasikan approval ke PM lain untuk 5 hari | Delegasi pending approval Admin |
| TC-POS-03 | Admin menyetujui delegasi | Status active; approval request PM delegator diteruskan ke delegate |
| TC-POS-04 | Delegasi berakhir (end_date terlewat) | Status expired otomatis; routing approval kembali ke delegator |
| TC-POS-05 | Posisi yang digunakan di workflow dicoba nonaktifkan | Warning: "Posisi ini digunakan dalam konfigurasi workflow X" |
| TC-POS-06 | Kepala Dept ganti person; update assignment saja | Approval routing otomatis ke pejabat baru tanpa ubah config workflow |

---

## 8. RELATED DOCUMENTS

| Dokumen | Relasi |
|---|---|
| 015 — Organization Hierarchy | Posisi terhubung ke unit organisasi |
| 039 — Approval Engine Core | Approval routing berdasarkan position_id |
| 042 — Backup Approver & Reassignment | Delegasi dan backup berdasarkan modul ini |
| 027 — Config Organization & Workflow | CFG-02: assignment approver per posisi |

**Gap Resolution:** GAP-07 ✓ (re-assign/backup approver) | CFG-02 ✓
