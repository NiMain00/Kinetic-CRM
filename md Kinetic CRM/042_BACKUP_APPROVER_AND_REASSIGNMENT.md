# 042 — BACKUP APPROVER & REASSIGNMENT
## KINETIC CRM — Mekanisme Backup Approver, Re-assign Manual, dan Delegasi

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 042 |
| **Nama Dokumen** | Backup Approver & Reassignment |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-07 Major), D.5 |
| **Gap Resolution** | **GAP-07 Major** |
| **Status** | Final |

---

## 1. PURPOSE

GAP-07 (Major) mengidentifikasi bahwa PRD v1.0 tidak memiliki mekanisme untuk menangani situasi ketika approver tidak tersedia: tidak ada backup approver, tidak ada delegasi sementara, dan Admin tidak bisa me-reassign approval yang sudah terlanjur dikirim ke seseorang yang sedang cuti atau resign.

Dokumen ini mendefinisikan tiga mekanisme yang bekerja berlapis:

1. **Backup Approver Otomatis** — dikonfigurasi per workflow stage; aktif saat primary approver tidak tersedia
2. **Delegasi Sementara** — approver mendelegasikan akses approvalnya ke kolega untuk periode tertentu
3. **Reassignment Manual** — Admin dapat mengalihkan approval yang sudah pending ke user lain kapan saja

---

## 2. BACKUP APPROVER OTOMATIS

### 2.1 Kapan Backup Approver Digunakan

Primary approver dianggap "tidak tersedia" jika salah satu kondisi berikut terpenuhi:

| Kondisi | Deteksi |
|---|---|
| User nonaktif | `users.is_active = 0` |
| Akun terkunci | `users.locked_until > NOW()` |
| Delegasi aktif | Ada record aktif di `approval_delegations` untuk user ini |
| Tidak ada user untuk posisi | Posisi `workflow_stage.approver_position_id` tidak punya holder aktif |

### 2.2 Resolution Logic (dari dokumen 039, didetailkan di sini)

```typescript
async function resolveApprover(workflowStageId: number, deptId?: number): Promise<User | null> {
  const stage = await getWorkflowStage(workflowStageId);

  // Step 1: Resolusi via posisi
  if (stage.approver_position_id) {
    const positionHolder = await getActivePositionHolder(stage.approver_position_id, deptId);
    if (positionHolder) {
      // Cek delegasi aktif untuk positionHolder
      const delegate = await getActiveDelegate(positionHolder.id);
      return delegate ?? positionHolder;
    }
  }

  // Step 2: Resolusi via role
  const roleUsers = await getActiveUsersByRole(stage.approver_role, deptId);
  if (roleUsers.length > 0) {
    // Ambil semua user dengan role ini; kirim notif ke semua; first to act wins
    return { type: 'role_based', users: roleUsers };
  }

  // Step 3: Backup approver manual dari konfigurasi
  if (stage.backup_approver_user_id) {
    const backup = await getUser(stage.backup_approver_user_id);
    if (backup?.is_active) return backup;
  }

  // Step 4: Tidak ada approver tersedia → alert Admin
  await alertAdminNoApprover(workflowStageId);
  return null;
}
```

### 2.3 Logging Backup Usage

Setiap kali backup digunakan (bukan primary), dicatat di `approval_decision_logs`:

```json
{
  "action": "created",
  "metadata": {
    "assigned_to": "backup",
    "primary_user_id": 5,
    "primary_unavailable_reason": "user_inactive",
    "backup_user_id": 8
  }
}
```

---

## 3. DELEGASI SEMENTARA (APPROVAL DELEGATION)

### 3.1 Entity: ApprovalDelegation (sudah didefinisikan di dokumen 016)

Ringkasan field kritis:

| Field | Keterangan |
|---|---|
| `delegator_user_id` | User yang mendelegasikan (mis: PM yang mau cuti) |
| `delegate_user_id` | User yang menerima delegasi |
| `start_date / end_date` | Periode delegasi |
| `status` | pending_approval → active → expired / cancelled |
| `approved_by` | Admin yang menyetujui |

### 3.2 Alur Delegasi

```
1. PM mengajukan delegasi ke PM lain untuk 1–2 minggu
   POST /api/config/delegations
   { delegator_user_id: 5, delegate_user_id: 9, start: "2025-08-01", end: "2025-08-14", reason: "Cuti tahunan" }
   → Status: pending_approval

2. Admin menyetujui
   PUT /api/config/delegations/:id/approve
   → Status: active
   → Kirim notifikasi ke delegator dan delegate

3. Selama periode delegasi:
   - Setiap approval request yang seharusnya ke delegator → dialihkan ke delegate
   - Inbox delegate menampilkan item dengan tag "[Delegasi dari Pak X]"
   - Delegator tidak lagi menerima notifikasi approval

4. Saat end_date tercapai:
   - Cron job setiap malam: UPDATE delegations SET status='expired' WHERE end_date < NOW()
   - Routing kembali ke delegator

5. Delegator/Admin dapat cancel sewaktu-waktu:
   PUT /api/config/delegations/:id/cancel
   → Status: cancelled; routing kembali ke delegator
```

### 3.3 Audit Trail Delegasi

Setiap approval yang diputuskan atas delegasi dicatat dengan metadata khusus:

```json
{
  "action": "approved",
  "actor_user_id": 9,
  "metadata": {
    "is_delegation": true,
    "delegated_from_user_id": 5,
    "delegation_id": 12
  },
  "notes": "Diputuskan atas delegasi dari Pak Cahyo (PM)"
}
```

Tampilan di audit log: "Disetujui oleh Bu Dewi (PM) **atas nama** Pak Cahyo (PM)"

---

## 4. REASSIGNMENT MANUAL OLEH ADMIN

### 4.1 Kapan Digunakan

- Approver resign mendadak tanpa sempat delegasi
- Approval routing salah (mis: tidak ada backup dikonfigurasi)
- Permintaan khusus dari management untuk memindahkan approval

### 4.2 Proses Re-assign

```
Admin ke Approval Inbox (APPR-01) → pilih item pending → dropdown "⋯" → "Re-assign"
    ↓
Dialog Re-assign:
  Approver Saat Ini: Pak X (PM) — nonaktif
  Re-assign ke:      [ Pilih user yang bisa approve ▼ ] (filtered: aktif + memiliki permission)
  Alasan Re-assign:  [ Pak X sudah tidak aktif di perusahaan ]
  [Konfirmasi Re-assign]
    ↓
POST /api/approvals/:requestId/reassign
{ new_user_id: 9, reason: "Pak X sudah tidak aktif" }
    ↓
Backend:
  1. Update approval_requests.assigned_to_user_id = 9
  2. Catat di approval_decision_logs (action = 'reassigned', metadata = {from: 5, to: 9, reason: "..."})
  3. Kirim notif ke user baru: "Anda di-assign untuk mereview [item]"
  4. Update SLA tracking: deadline tidak berubah (SLA tetap dihitung dari submission awal)
```

### 4.3 Constraint Re-assign

| Constraint | Detail |
|---|---|
| Hanya Admin | Role lain tidak bisa re-assign |
| Target user harus aktif | `users.is_active = 1` |
| Target user harus memiliki permission | Harus memiliki `approvals.action` permission |
| SLA tidak di-reset | Deadline tetap dari submission awal; re-assign tidak memperpanjang SLA |
| Hanya request `pending` | Tidak bisa re-assign request yang sudah approved/revision/cancelled |

---

## 5. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | /api/config/delegations | Auth (self) | Ajukan delegasi |
| GET | /api/config/delegations | Admin | List semua delegasi |
| GET | /api/config/delegations/my | Auth | Delegasi milik sendiri (sebagai delegator atau delegate) |
| PUT | /api/config/delegations/:id/approve | Admin | Setujui delegasi |
| PUT | /api/config/delegations/:id/cancel | Admin, Delegator | Batalkan delegasi |
| POST | /api/approvals/:id/reassign | Admin | Re-assign approval ke user lain |
| GET | /api/approvals/:id/reassign-eligible-users | Admin | List user yang eligible sebagai target reassign |

### 5.1 POST /api/approvals/:id/reassign

**Request:**
```json
{
  "new_user_id": 9,
  "reason": "Approver sebelumnya sudah tidak aktif di perusahaan per 1 Juli 2025."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "request_id": 201,
    "previous_assignee": { "id": 5, "name": "Pak Cahyo" },
    "new_assignee": { "id": 9, "name": "Bu Dewi" },
    "reassigned_at": "2025-07-02T09:00:00Z"
  },
  "message": "Approval berhasil di-reassign ke Bu Dewi."
}
```

---

## 6. DASHBOARD VISIBILITY

### 6.1 Delegation Banner di Inbox

Saat user login sebagai delegate yang sedang aktif, tampilkan banner di Approval Inbox:

```
┌──────────────────────────────────────────────────────────────┐
│ ℹ️ Anda sedang menerima delegasi approval dari Pak Cahyo (PM) │
│ Periode: 1 Agustus – 14 Agustus 2025                         │
│ Semua approval Pak Cahyo akan muncul di inbox Anda.           │
│                                            [Lihat Detail]     │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Tag Item Delegasi

Item approval yang merupakan delegasi ditandai dengan badge di Approval Inbox:

```
[Delegasi dari Pak Cahyo]  RKS Proyek Gedung X  •  Cabang Jakarta  •  Sisa 2 HK
```

---

## 7. DDL

```sql
-- Tabel approval_delegations sudah didefinisikan di dokumen 016
-- Tidak ada tabel baru di dokumen ini

-- Index tambahan untuk performa
CREATE INDEX idx_ad_delegator_status
  ON approval_delegations(delegator_user_id, status, start_date, end_date);

CREATE INDEX idx_ad_delegate_status
  ON approval_delegations(delegate_user_id, status, start_date, end_date);
```

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-BAK-01 | Primary approver nonaktif saat approval dibuat | Approval otomatis dialihkan ke backup approver; log mencatat alasan |
| TC-BAK-02 | Tidak ada primary dan tidak ada backup dikonfigurasi | Admin menerima alert; approval tetap pending; SLA berjalan |
| TC-DEL-01 | PM ajukan delegasi ke PM lain untuk 2 minggu | Status = pending_approval; Admin mendapat notifikasi |
| TC-DEL-02 | Admin approve delegasi | Status = active; delegate menerima notifikasi; item approval PM muncul di inbox delegate |
| TC-DEL-03 | Audit log approval yang diputuskan atas delegasi | Mencantumkan "atas nama [delegator]" |
| TC-DEL-04 | Delegasi berakhir (end_date terlewat) | Status = expired; routing kembali ke delegator |
| TC-DEL-05 | Admin cancel delegasi sebelum end_date | Status = cancelled; routing langsung ke delegator |
| TC-REA-01 | Admin reassign approval pending ke user lain | assigned_to_user_id berubah; user baru dinotifikasi; SLA tidak berubah |
| TC-REA-02 | Admin coba reassign approval yang sudah approved | Error: "Hanya approval berstatus pending yang dapat di-reassign" |
| TC-REA-03 | Admin pilih target reassign yang tidak aktif | Target user tidak muncul di dropdown eligible users |

**Gap Resolution:** GAP-07 ✓
