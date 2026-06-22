# 041 — SLA & ESCALATION ENGINE
## KINETIC CRM — Engine Kalkulasi SLA, Reminder, dan Eskalasi Otomatis

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 041 |
| **Nama Dokumen** | SLA & Escalation Engine |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review Section C.1 (GAP-06 Major), B.2 (CFG-05, CFG-06) |
| **Gap Resolution** | **GAP-06 Major**, CFG-05, CFG-06, MD-13 |
| **Status** | Final |

---

## 1. PURPOSE

SLA Engine adalah komponen background yang berjalan sebagai scheduled job (cron). Bertanggung jawab untuk:
1. Menghitung deadline approval dalam hari kerja (mengecualikan weekend + hari libur nasional)
2. Mengirim reminder sebelum deadline terlampaui
3. Mengirim notifikasi OVERDUE saat SLA terlampaui
4. Mengeskalasi ke level yang lebih tinggi setelah N hari SLA terlampaui
5. Memperbarui `sla_status` di `approval_sla_tracking`

---

## 2. WORKING DAY CALCULATION

### 2.1 Algoritma Core

```typescript
import { addDays, isWeekend } from 'date-fns';

async function addWorkingDays(
  startDate: Date,
  workingDays: number,
  year: number
): Promise<Date> {
  // Load hari libur dari cache atau DB
  const holidays = await getHolidaysForYear(year);
  const holidaySet = new Set(holidays.map(h => h.toISOString().split('T')[0]));

  let count = 0;
  let current = new Date(startDate);

  // Mulai dari hari berikutnya (hari submission tidak dihitung)
  current = addDays(current, 1);

  while (count < workingDays) {
    const dateStr = current.toISOString().split('T')[0];
    const weekend = isWeekend(current);
    const holiday = holidaySet.has(dateStr);

    if (!weekend && !holiday) {
      count++;
    }

    if (count < workingDays) {
      current = addDays(current, 1);
    }
  }

  // Set ke akhir hari kerja (17:00 WIB)
  current.setHours(17, 0, 0, 0);
  return current;
}

async function countWorkingDaysRemaining(
  deadline: Date,
  referenceDate: Date = new Date()
): Promise<number> {
  const year = referenceDate.getFullYear();
  const holidays = await getHolidaysForYear(year);
  const holidaySet = new Set(holidays.map(h => h.toISOString().split('T')[0]));

  let count = 0;
  let current = addDays(referenceDate, 1); // mulai besok

  while (current <= deadline) {
    const dateStr = current.toISOString().split('T')[0];
    if (!isWeekend(current) && !holidaySet.has(dateStr)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}
```

### 2.2 Holiday Cache

```typescript
const HOLIDAY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam
const holidayCache = new Map<number, Date[]>();

async function getHolidaysForYear(year: number): Promise<Date[]> {
  if (holidayCache.has(year)) return holidayCache.get(year)!;

  const holidays = await db.query(
    'SELECT date FROM public_holidays WHERE year = ? AND is_active = 1',
    [year]
  );

  const dates = holidays.map(h => new Date(h.date));
  holidayCache.set(year, dates);

  // Auto-invalidate setelah TTL
  setTimeout(() => holidayCache.delete(year), HOLIDAY_CACHE_TTL);

  return dates;
}
```

---

## 3. SLA TRACKING LIFECYCLE

### 3.1 Saat Approval Request Dibuat

```typescript
async function initSlaTracking(approvalRequestId: number, workflowStageId: number) {
  const slaConfig = await getSlaConfig(workflowStageId);
  if (!slaConfig || !slaConfig.is_enforced) return; // skip jika tidak di-enforce

  const submittedAt = new Date();
  const deadlineAt = await addWorkingDays(submittedAt, slaConfig.working_days_limit, submittedAt.getFullYear());

  await db.insert('approval_sla_tracking', {
    approval_request_id: approvalRequestId,
    workflow_stage_id: workflowStageId,
    submitted_at: submittedAt,
    deadline_at: deadlineAt,
    sla_status: 'on_time'
  });
}
```

### 3.2 SLA Status Transitions

```
on_time → warning    (saat workingDaysRemaining <= reminder_1_days_before)
warning → critical   (saat workingDaysRemaining <= 1)
critical → overdue   (saat deadline_at < NOW())
any → resolved       (saat approval_request.decided_at IS NOT NULL)
```

---

## 4. SCHEDULED JOB (CRON)

### 4.1 Job Schedule

```
Frekuensi: Setiap 1 jam (*/1 * * * *)
Timezone: Asia/Jakarta (WIB)
```

### 4.2 Job Logic

```typescript
async function slaCheckJob() {
  const now = new Date();

  // 1. Load semua SLA tracking yang masih aktif (belum resolved)
  const activeTrackings = await db.query(`
    SELECT ast.*, ar.assigned_to_user_id, ar.assigned_to_role,
           ar.entity_type, ar.entity_id, ar.project_id,
           sc.reminder_1_days_before, sc.reminder_2_days_before,
           sc.escalation_days_after, sc.escalation_target_role,
           sc.escalation_target_user_id
    FROM approval_sla_tracking ast
    JOIN approval_requests ar ON ar.id = ast.approval_request_id
    JOIN sla_configs sc ON sc.workflow_stage_id = ast.workflow_stage_id
    WHERE ast.resolved_at IS NULL
      AND ar.status = 'pending'
  `);

  for (const tracking of activeTrackings) {
    const workingDaysLeft = await countWorkingDaysRemaining(tracking.deadline_at, now);
    const isOverdue = now > tracking.deadline_at;

    // Hitung hari setelah overdue (jika overdue)
    const daysAfterDeadline = isOverdue
      ? await countWorkingDays(tracking.deadline_at, now)
      : 0;

    // 2. Update SLA status
    let newStatus = tracking.sla_status;
    if (isOverdue) newStatus = 'overdue';
    else if (workingDaysLeft <= 1) newStatus = 'critical';
    else if (workingDaysLeft <= tracking.reminder_1_days_before) newStatus = 'warning';

    if (newStatus !== tracking.sla_status) {
      await db.update('approval_sla_tracking', { sla_status: newStatus, is_overdue: isOverdue ? 1 : 0 }, { id: tracking.id });
    }

    // 3. Kirim reminder 1 (jika belum dikirim dan kondisi terpenuhi)
    if (!tracking.reminder_1_sent_at && workingDaysLeft <= tracking.reminder_1_days_before && !isOverdue) {
      await sendReminder(tracking, 1);
      await db.update('approval_sla_tracking', { reminder_1_sent_at: now }, { id: tracking.id });
    }

    // 4. Kirim reminder 2 (jika belum dikirim dan kondisi terpenuhi)
    if (tracking.reminder_2_days_before && !tracking.reminder_2_sent_at
        && workingDaysLeft <= tracking.reminder_2_days_before && !isOverdue) {
      await sendReminder(tracking, 2);
      await db.update('approval_sla_tracking', { reminder_2_sent_at: now }, { id: tracking.id });
    }

    // 5. Eskalasi (jika overdue dan belum dikirim eskalasi)
    if (isOverdue && !tracking.escalation_sent_at
        && tracking.escalation_days_after
        && daysAfterDeadline >= tracking.escalation_days_after) {
      await sendEscalation(tracking);
      await db.update('approval_sla_tracking', { escalation_sent_at: now }, { id: tracking.id });
    }
  }
}
```

### 4.3 sendReminder()

```typescript
async function sendReminder(tracking: SlaTracking, sequence: number) {
  const templateCode = sequence === 1 ? 'project.sla_warning' : 'project.sla_critical';
  const approver = await getApprover(tracking.approval_request_id);

  await notificationService.send({
    template_code: templateCode,
    recipient_user_ids: [approver.id],
    variables: {
      itemName: await getEntityName(tracking.entity_type, tracking.entity_id),
      hoursRemaining: calculateHoursUntilDeadline(tracking.deadline_at),
      deadlineFormatted: formatDate(tracking.deadline_at)
    }
  });

  await auditLog('sla_reminder_sent', null, {
    request_id: tracking.approval_request_id,
    sequence,
    recipient: approver.id
  });
}
```

### 4.4 sendEscalation()

```typescript
async function sendEscalation(tracking: SlaTracking) {
  const escalationRecipients = await resolveEscalationRecipients(tracking);

  await notificationService.send({
    template_code: 'project.sla_escalation',
    recipient_user_ids: escalationRecipients.map(u => u.id),
    variables: {
      itemName: await getEntityName(tracking.entity_type, tracking.entity_id),
      daysOverdue: await countWorkingDays(tracking.deadline_at, new Date()),
      originalApprover: await getUserName(tracking.approval_request.assigned_to_user_id)
    }
  });

  // Catat di approval_decision_logs
  await db.insert('approval_decision_logs', {
    request_id: tracking.approval_request_id,
    action: 'escalated',
    actor_user_id: null, // sistem
    metadata: { escalation_recipients: escalationRecipients.map(u => u.id) }
  });
}
```

---

## 5. SLA DASHBOARD & REPORTING

### 5.1 SLA Summary Query

```sql
-- SLA performance summary: berapa % yang selesai sebelum deadline
SELECT
  ws.name AS stage_name,
  COUNT(*) AS total_requests,
  SUM(CASE WHEN ast.is_overdue = 0 AND ast.resolved_at IS NOT NULL THEN 1 ELSE 0 END) AS on_time_count,
  SUM(CASE WHEN ast.is_overdue = 1 THEN 1 ELSE 0 END) AS overdue_count,
  ROUND(
    SUM(CASE WHEN ast.is_overdue = 0 AND ast.resolved_at IS NOT NULL THEN 1 ELSE 0 END)
    / COUNT(*) * 100, 1
  ) AS on_time_pct
FROM approval_sla_tracking ast
JOIN workflow_stages ws ON ws.id = ast.workflow_stage_id
WHERE ast.resolved_at IS NOT NULL
GROUP BY ws.id, ws.name
ORDER BY on_time_pct ASC;
```

### 5.2 API Endpoints — SLA

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/approvals/:id/sla | Auth | SLA detail untuk satu approval request |
| GET | /api/reports/sla-performance | Admin, Management | Laporan performa SLA per tahap |

---

## 6. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-SLA-01 | Submit approval hari Kamis, SLA 3 HK, tidak ada libur | Deadline = Selasa minggu depan (skip weekend) |
| TC-SLA-02 | Submit hari Kamis, SLA 3 HK, Senin libur nasional | Deadline = Rabu (skip Jumat (libur), Sabtu, Minggu, Senin libur) |
| TC-SLA-03 | Cron job jalan; 1 HK sebelum deadline → reminder belum terkirim | Reminder terkirim; reminder_1_sent_at diisi |
| TC-SLA-04 | Cron job jalan; deadline sudah lewat 1 HK | is_overdue = 1; sla_status = overdue |
| TC-SLA-05 | Cron job jalan; overdue 2 HK; escalation_days_after = 1 | Eskalasi terkirim ke management; escalation_sent_at diisi |
| TC-SLA-06 | Approval diselesaikan sebelum deadline | resolved_at diisi; sla_status = resolved; is_overdue = 0 |
| TC-SLA-07 | Approval diselesaikan setelah deadline | resolved_at diisi; sla_status = resolved; is_overdue = 1 (tercatat kalah SLA) |

**Gap Resolution:** GAP-06 ✓ | CFG-05 ✓ | CFG-06 ✓ | MD-13 ✓ (kalkulasi hari kerja)
