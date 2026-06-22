# 040 — PARALLEL REVIEW & TARGETED REVISION
## KINETIC CRM — Parallelisasi Review Dept+PM dan Revisi LPHS Tertarget

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 040 |
| **Nama Dokumen** | Parallel Review & Targeted Revision |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.2 (BP-02, BP-03), GAP-08 |
| **Gap Resolution** | **GAP-08 Major**, BP-02, BP-03 |
| **Status** | Final |

---

## 1. PURPOSE

Dokumen ini merinci implementasi teknis dari dua pola alur kerja kritis yang diidentifikasi di BA Review:

- **BP-02: Parallelisasi Review** — PM dan departemen-departemen mereview LPHS secara bersamaan, bukan berurutan, untuk mempercepat proses.
- **BP-03: Targeted Revision** — Saat revisi diperlukan, hanya departemen yang terdampak yang perlu mereview ulang; departemen yang sudah approve tidak perlu mengulang.

Implementasi teknis di LPHS Module (dokumen 035) mengacu ke spesifikasi mendalam di dokumen ini.

---

## 2. BP-02: PARALLEL REVIEW DETAIL

### 2.1 Masalah yang Diselesaikan

Alur lama (sequential):
```
Cabang upload → PM review → (setelah PM approve) → Dept A review → (setelah approve) → Dept B → ... → Management
```
Total waktu: SLA_PM + SLA_Dept_A + SLA_Dept_B + SLA_Management

Alur baru (parallel):
```
Cabang upload → PM review (paralel dengan) → Dept A, Dept B, Dept C review → (setelah SEMUA selesai) → Management
```
Total waktu: MAX(SLA_PM, SLA_DeptMax) + SLA_Management — penghematan signifikan.

### 2.2 State Matrix Parallelisasi

Status setiap actor ditrack secara independen:

```
                UPLOAD     REVIEWING   APPROVED   REVISION
PM              draft   →  reviewing → approved   revision
Dept A          pending →  reviewing → approved   revision
Dept B          pending →  reviewing → approved   revision
Dept C          pending →  reviewing → approved   revision
Management      —           —           —         pending (aktif saat kondisi terpenuhi)
```

### 2.3 Kondisi Lanjut ke Management

```
FUNCTION canProceedToManagement(lphsId) {
  pmRequest = getApprovalRequest(entity_type='project_lphs_pm', entity_id=lphsId)
  deptRequests = getAllApprovalRequests(entity_type='project_lphs_dept', entity_id=lphsId)

  return pmRequest.status == 'approved'
    AND ALL deptRequests HAVE status == 'approved'
}
```

Fungsi ini dipanggil setiap kali salah satu request (PM atau dept mana saja) berubah status ke `approved`. Jika kondisi terpenuhi: buat ManagementApprovalRequest.

### 2.4 Temporal Constraint

Dept BISA mulai review sebelum PM approve, tapi dept TIDAK BISA submit final approval sebelum PM approve.

Implementasi di layer API:
```
POST /api/approvals/:deptRequestId/approve
  Backend check:
    pmRequest = getApprovalRequest(entity_type='project_lphs_pm', entity_id=lphsId)
    IF pmRequest.status != 'approved':
      return 422 {
        message: "Review PM harus diselesaikan terlebih dahulu sebelum departemen dapat memberikan persetujuan final."
      }
```

Dept tetap bisa:
- Menulis catatan sementara (POST /api/approvals/:id/notes)
- Mengubah status mereka ke `reviewing` (menandakan sudah mulai review)
- Mengirim pertanyaan ke Cabang melalui catatan (bukan formal revision)

---

## 3. BP-03: TARGETED REVISION DETAIL

### 3.1 Masalah yang Diselesaikan

Revisi lama (reset semua):
```
Management kirim revisi → SEMUA dept harus re-approve → waktu lama
```

Revisi baru (targeted):
```
Management kirim revisi ke Dept Legal saja → hanya Dept Legal re-approve → selesai lebih cepat
```

### 3.2 Targeted Revision Request Payload

```json
POST /api/projects/:id/lphs/revise/mgmt
{
  "revision_notes": "Pasal 7.3 LPHS memerlukan review legal lebih mendalam terkait force majeure clause.",
  "targeted_dept_ids": [2],
  "revision_type": "targeted"
}
```

### 3.3 Targeted Revision Processing

```
1. Validasi: actor = Management atau Admin
2. Buat record di lphs_revision_log:
   { initiator_role: 'management', targeted_dept_ids: [2], revision_notes: "..." }
3. Untuk SETIAP dept_id dalam targeted_dept_ids:
   a. Update approval_request: status = 'revision', round += 1
   b. Reset lphs_department_approvals: status = 'revision', approved_at = NULL
   c. Catat di approval_decision_logs (action = 'revision_sent')
   d. Kirim notifikasi ke head of dept
4. Dept yang TIDAK ada dalam targeted_dept_ids:
   a. Status TIDAK berubah (tetap 'approved')
   b. approval_request TIDAK direset
5. Reset project_lphs.overall_status ke 'dept_review'
6. Kirim notifikasi ke Cabang: "Revisi LPHS diperlukan. Target: [nama dept]"
7. Notifikasi Management: "Revisi telah dikirim. Menunggu dept [nama] menyetujui kembali."
```

### 3.4 Completion Check setelah Targeted Revision

Setelah targeted dept re-approve, cek ulang kondisi lanjut ke management:

```
FUNCTION checkTargetedRevisionComplete(lphsId, targetedDeptIds) {
  allDeptRequests = getAllApprovalRequests(entity_type='project_lphs_dept', entity_id=lphsId)

  // Semua dept (yang targeted maupun tidak) harus approved
  IF ALL allDeptRequests HAVE status == 'approved'
     AND pmRequest.status == 'approved':
    triggerManagementReview(lphsId)
}
```

### 3.5 Visual di UI (Status Matrix)

Status matrix di Tab LPHS/SIOS menampilkan:

```
Departemen          Status              Approver            Update Terakhir
─────────────────────────────────────────────────────────────────────────
✓ Engineering       Disetujui           Pak Budi (HOE)      2 Jun 2025, 10:30
⚠ Legal             Perlu Revisi        Bu Sarah (HOL)      5 Jun 2025, 14:00
  (Catatan revisi: "Pasal 7.3 memerlukan review lebih lanjut")
✓ Finance           Disetujui           Pak Dedi (HOF)      3 Jun 2025, 09:15
─────────────────────────────────────────────────────────────────────────
Progress: 2/3 departemen disetujui
```

Badge warna:
- Hijau (✓): approved
- Kuning (⚠): revision / reviewing
- Abu-abu (-): pending (belum mulai)
- Merah (✗): revision overdue (SLA terlampaui)

---

## 4. INTERACTION BETWEEN PARALLEL AND TARGETED REVISION

### 4.1 Skenario: PM revision setelah beberapa dept sudah approve

```
Initial: PM = pending, Dept A = pending, Dept B = pending, Dept C = pending
    ↓
Dept A approve, Dept B approve
State: PM = reviewing, Dept A = approved, Dept B = approved, Dept C = reviewing
    ↓
PM kirim revision targeted ke Dept A
State: PM = reviewing, Dept A = REVISION, Dept B = approved (tidak berubah), Dept C = reviewing
    ↓
Cabang upload revisi
    ↓
Dept A review ulang → approve
State: PM = reviewing, Dept A = approved, Dept B = approved, Dept C = reviewing
    ↓
PM approve, Dept C approve
State: PM = approved, Dept A = approved, Dept B = approved, Dept C = approved
    ↓
canProceedToManagement() = true → Management approval dimulai
```

---

## 5. NOTIFICATION MAP

| Event | Penerima | Template |
|---|---|---|
| LPHS diupload Cabang | Semua dept yang dipilih + PM | "Draft LPHS proyek [nama] tersedia untuk review." |
| PM mulai review (opsional) | — | Tidak ada notif; status internal |
| Dept approve | PM (progress info, opsional) | — (hanya jika semua dept sudah approve) |
| Semua dept + PM approve | Management | "LPHS proyek [nama] siap untuk persetujuan final Anda." |
| PM targeted revision | Dept yang ditarget + Cabang | "Revisi LPHS diperlukan dari departemen [nama]." |
| Management targeted revision | Dept yang ditarget + Cabang | "Management meminta revisi LPHS dari departemen [nama]." |
| Management approve final | Cabang + PM | "LPHS proyek [nama] disetujui. Proses dapat dilanjutkan." |

---

## 6. QA TEST SCENARIOS — PARALLEL + TARGETED

| ID | Skenario | Expected Result |
|---|---|---|
| TC-PAR-01 | 3 dept mulai review sebelum PM approve | Status dept = 'reviewing'; allowed; tidak ada error |
| TC-PAR-02 | Dept A coba submit final approval sebelum PM approve | Error 422: "Menunggu PM menyelesaikan review terlebih dahulu" |
| TC-PAR-03 | PM approve → Dept A langsung bisa submit final approval | Dept A sukses approve; cek progress |
| TC-PAR-04 | Dept B dan C masih reviewing saat Dept A dan PM approve | canProceedToManagement = false; management belum dinotifikasi |
| TC-PAR-05 | Dept C (terakhir) approve → semua kondisi terpenuhi | Management dinotifikasi; overall_status = 'mgmt_review' |
| TC-TAR-01 | Management kirim targeted revision ke Dept Legal saja | Hanya Dept Legal status = revision; Dept Engineering dan Finance tetap approved |
| TC-TAR-02 | Cabang upload revisi setelah targeted revision | Dept Legal direset ke reviewing; dept lain tidak berubah |
| TC-TAR-03 | Dept Legal re-approve setelah targeted revision | canProceedToManagement() = true; kembali ke management review |
| TC-TAR-04 | Targeted revision ke 2 dari 3 dept | Status matrix menampilkan 2 dept revision + 1 dept approved |

**Gap Resolution:** GAP-08 ✓ | BP-02 ✓ | BP-03 ✓
