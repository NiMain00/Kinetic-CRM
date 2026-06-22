# 039 — APPROVAL ENGINE CORE
## KINETIC CRM — Engine Approval Generik Multi-Stage

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 039 |
| **Nama Dokumen** | Approval Engine Core |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section B.4 (D.5), PRD FR070–FR075 |
| **Gap Resolution** | GAP-06, GAP-07, GAP-08 (foundation) |
| **Status** | Final |

---

## 1. PURPOSE

Approval Engine adalah komponen arsitektur generik yang digunakan oleh semua modul yang memerlukan approval: Prospek, RKS, LPHS/SIOS, dan masa depan (Contract, Invoice, dll.). Alih-alih setiap modul mengimplementasikan logika approval sendiri, semua berkoordinasi melalui engine terpusat ini.

Engine ini bertanggung jawab atas:
1. Membuat dan melacak approval requests
2. Routing ke approver yang tepat (berbasis posisi/role)
3. Mencatat audit trail lengkap setiap keputusan
4. Mengintegrasikan dengan SLA Engine (dokumen 041) dan Notification Module (dokumen 046)

---

## 2. CORE ENTITIES

### 2.1 Entity: ApprovalRequest

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `entity_type` | ENUM('prospect','project_rks','project_lphs_pm','project_lphs_dept','project_lphs_mgmt') | NOT NULL | Tipe entitas yang butuh approval |
| `entity_id` | BIGINT UNSIGNED | NOT NULL | ID entitas (prospect_id, rks_id, lphs_id) |
| `project_id` | BIGINT UNSIGNED | NULL, FK | Proyek terkait (untuk grouping di inbox) |
| `workflow_stage_id` | BIGINT UNSIGNED | NULL, FK → workflow_stages.id | Tahap workflow yang sedang berjalan |
| `department_id` | BIGINT UNSIGNED | NULL, FK | Untuk LPHS: dept yang ditugaskan |
| `assigned_to_user_id` | BIGINT UNSIGNED | NULL, FK → users.id | Approver spesifik yang ditugaskan |
| `assigned_to_role` | VARCHAR(50) | NULL | Role approver jika belum assign ke user spesifik |
| `status` | ENUM('pending','approved','revision','cancelled','delegated') | NOT NULL DEFAULT 'pending' | |
| `decision` | ENUM('approve','revise') | NULL | Keputusan yang diambil |
| `decision_notes` | TEXT | NULL | Catatan saat keputusan |
| `decided_by` | BIGINT UNSIGNED | NULL, FK → users.id | Siapa yang memutuskan |
| `decided_at` | TIMESTAMP | NULL | |
| `round` | TINYINT UNSIGNED | NOT NULL DEFAULT 1 | Putaran ke-N (untuk multi-round review) |
| `parent_request_id` | BIGINT UNSIGNED | NULL, FK | Parent request jika re-request setelah revisi |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

### 2.2 Entity: ApprovalDecisionLog

Audit trail append-only setiap aksi pada approval request (termasuk reminder, eskalasi, delegasi).

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | |
| `request_id` | BIGINT UNSIGNED FK | FK → approval_requests.id |
| `action` | ENUM('created','approved','revision_sent','cancelled','delegated','escalated','reminder_sent','reassigned') | |
| `actor_user_id` | BIGINT UNSIGNED | NULL (NULL = sistem otomatis) |
| `notes` | TEXT | |
| `metadata` | JSON | Detail tambahan per aksi |
| `created_at` | TIMESTAMP | |

---

## 3. APPROVAL FLOW (GENERIK)

### 3.1 Flow Pembuatan Approval Request

```
Module calls ApprovalEngine.createRequest({
  entityType: 'project_rks',
  entityId: rksId,
  projectId: projectId,
  workflowStageId: stageId
})
    ↓
Engine:
  1. Resolusi approver: lookup workflow_stage → approver_role
     → Jika backup approver tersedia dan primary tidak aktif: gunakan backup
     → Jika ada delegasi aktif: route ke delegate
  2. Buat record ApprovalRequest (status = 'pending')
  3. Buat ApprovalSlaTracking (kalkulasi deadline dari SLA config)
  4. Emit event 'approval.created' → NotificationModule kirim notif ke approver
  5. Return request_id
```

### 3.2 Flow Approve

```
Approver klik Approve di Approval Inbox
    ↓
POST /api/approvals/:requestId/approve { notes? }
    ↓
Engine:
  1. Validasi: actor = assigned_to_user_id atau actor memiliki role assigned_to_role
  2. Update ApprovalRequest: status = 'approved', decision = 'approve', decided_by, decided_at
  3. Catat ApprovalDecisionLog (action = 'approved')
  4. Resolve SLA tracking (resolved_at = now)
  5. Emit event 'approval.approved' → module yang bersangkutan handle transisi status
  6. Emit event 'notification.send' → notif ke submitter
```

### 3.3 Flow Kirim Revisi

```
Approver klik Kirim Revisi
    ↓
POST /api/approvals/:requestId/revise { notes, revision_details? }
    ↓
Engine:
  1. Validasi actor
  2. Update ApprovalRequest: status = 'revision', decision = 'revise'
  3. Catat ApprovalDecisionLog (action = 'revision_sent')
  4. Resolve SLA tracking
  5. Emit event 'approval.revision_sent' → module handle: status entitas → revision; notif ke Cabang
```

---

## 4. APPROVER RESOLUTION LOGIC

### 4.1 Priority Chain

```
1. Cek ApprovalDelegation aktif untuk primary approver
   → Jika ada: gunakan delegate_user_id
2. Cek workflow_stage.approver_position_id
   → Jika ada: cari user yang saat ini memegang posisi tersebut (dari user_positions)
3. Fallback ke workflow_stage.approver_role
   → Cari semua user aktif dengan role tersebut; notifikasi semua; first-to-act menang
4. Jika tidak ada yang bisa approve:
   → Alert ke Admin; request tetap pending; SLA tetap berjalan
```

### 4.2 Backup Approver

```
Jika primary approver tidak aktif (is_active = 0):
  → Gunakan workflow_stage.backup_approver_user_id
  → Catat di ApprovalDecisionLog (metadata: {reason: 'primary_inactive', primary_user_id: X})
```

---

## 5. PARALLEL APPROVAL SUPPORT

Untuk kasus LPHS yang memerlukan approval dari multiple departments secara paralel:

```
ApprovalEngine.createParallelRequests({
  entityType: 'project_lphs_dept',
  entityId: lphsId,
  projectId: projectId,
  departmentIds: [1, 3, 5],   // dept yang dipilih
  workflowStageId: stageId
})
    ↓
Engine membuat N ApprovalRequest (satu per dept)
Setiap request diassign ke head_user_id dari dept masing-masing
SLA tracking dibuat per request

Completion check (setelah setiap approval):
  IF ALL requests (entity_id=lphsId, entity_type='project_lphs_dept') HAVE status='approved'
  AND ApprovalRequest(entity_type='project_lphs_pm', entity_id=lphsId).status='approved'
  THEN: emit 'lphs.all_approved' → trigger management approval phase
```

---

## 6. APPROVAL INBOX API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/approvals/pending | PM, Dept, Mgmt, Admin | List pending approval untuk user ini |
| GET | /api/approvals/history | PM, Dept, Mgmt, Admin | Riwayat semua approval yang sudah diproses |
| GET | /api/approvals/:id | Auth | Detail satu approval request |
| POST | /api/approvals/:id/approve | Approver | Approve request |
| POST | /api/approvals/:id/revise | Approver | Kirim revisi |
| POST | /api/approvals/:id/reassign | Admin | Re-assign ke user/role lain |
| GET | /api/approvals/pending/count | Auth | Jumlah pending (untuk badge counter) |

### 6.1 GET /api/approvals/pending

```json
{
  "data": [
    {
      "id": 201,
      "entity_type": "project_rks",
      "entity_id": 45,
      "project": {
        "id": 123,
        "code": "PRJ-2025-00123",
        "name": "Pembangunan Gedung Kantor Pusat",
        "branch": "Cabang Jakarta"
      },
      "type_label": "Review RKS",
      "status": "pending",
      "round": 1,
      "submitted_at": "2025-06-01T08:00:00Z",
      "waiting_since_hours": 26,
      "sla": {
        "deadline": "2025-06-04T08:00:00Z",
        "working_days_remaining": 2,
        "status": "warning"
      }
    }
  ],
  "meta": { "total": 3 }
}
```

---

## 7. DDL

```sql
CREATE TABLE approval_requests (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type           ENUM('prospect','project_rks','project_lphs_pm','project_lphs_dept','project_lphs_mgmt')
                                        NOT NULL,
  entity_id             BIGINT UNSIGNED NOT NULL,
  project_id            BIGINT UNSIGNED NULL,
  workflow_stage_id     BIGINT UNSIGNED NULL,
  department_id         BIGINT UNSIGNED NULL,
  assigned_to_user_id   BIGINT UNSIGNED NULL,
  assigned_to_role      VARCHAR(50)     NULL,
  status                ENUM('pending','approved','revision','cancelled','delegated')
                                        NOT NULL DEFAULT 'pending',
  decision              ENUM('approve','revise') NULL,
  decision_notes        TEXT            NULL,
  decided_by            BIGINT UNSIGNED NULL,
  decided_at            TIMESTAMP       NULL,
  round                 TINYINT UNSIGNED NOT NULL DEFAULT 1,
  parent_request_id     BIGINT UNSIGNED NULL,
  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ar_entity          (entity_type, entity_id),
  KEY idx_ar_project         (project_id),
  KEY idx_ar_assigned_user   (assigned_to_user_id),
  KEY idx_ar_status          (status),
  KEY idx_ar_dept            (department_id),
  CONSTRAINT fk_ar_project   FOREIGN KEY (project_id)         REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_stage     FOREIGN KEY (workflow_stage_id)  REFERENCES workflow_stages(id) ON DELETE SET NULL,
  CONSTRAINT fk_ar_dept      FOREIGN KEY (department_id)      REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_ar_assignee  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ar_decider   FOREIGN KEY (decided_by)          REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ar_parent    FOREIGN KEY (parent_request_id)   REFERENCES approval_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approval_decision_logs (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id     BIGINT UNSIGNED NOT NULL,
  action         ENUM('created','approved','revision_sent','cancelled','delegated','escalated','reminder_sent','reassigned')
                                 NOT NULL,
  actor_user_id  BIGINT UNSIGNED NULL,
  notes          TEXT            NULL,
  metadata       JSON            NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_adl_request (request_id),
  KEY idx_adl_action  (action),
  CONSTRAINT fk_adl_request FOREIGN KEY (request_id)    REFERENCES approval_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_adl_actor   FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-APR-01 | Approve oleh user yang bukan assigned approver | Error 403: "Anda tidak memiliki akses untuk approve item ini" |
| TC-APR-02 | Primary approver nonaktif → request dibuat | Request di-route ke backup approver; log mencatat alasan |
| TC-APR-03 | Delegasi aktif untuk PM X → request baru ke PM X | Request diassign ke delegate PM X |
| TC-APR-04 | Parallel approval LPHS: 3 dept, 2 approve 1 pending | overall_status tetap 'dept_review'; management belum dinotifikasi |
| TC-APR-05 | Semua 3 dept + PM approve LPHS | Management dinotifikasi; overall_status = 'mgmt_review' |
| TC-APR-06 | Admin reassign pending approval ke user lain | assigned_to_user_id berubah; user lama hilang dari inbox; user baru mendapat notifikasi |
| TC-APR-07 | Cancel proyek dengan 2 pending approval | Kedua approval otomatis status = cancelled |

**Gap Resolution:** GAP-06 ✓ (foundation SLA) | GAP-07 ✓ (reassign, backup) | GAP-08 ✓ (parallel support)
