# 046 — IN-APP NOTIFICATION MODULE
## KINETIC CRM — Notifikasi In-App: Polling, Event Matrix, Badge Counter

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 046 |
| **Nama Dokumen** | In-App Notification Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD FR090–FR091, BA Review Section B.5 |
| **Gap Resolution** | GAP-13 (notifikasi deadline approaching) |
| **Status** | Final |

---

## 1. PURPOSE

Modul notifikasi in-app memberikan informasi real-time kepada pengguna tentang event yang relevan dengan pekerjaan mereka: approval yang masuk, keputusan approval, deadline yang mendekat, eskalasi SLA, dan perubahan status proyek. Semua notifikasi tersimpan di DB sehingga tidak hilang meskipun user sedang offline saat event terjadi.

---

## 2. ENTITY: Notification

### 2.1 Schema Tabel `notifications`

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK | |
| `recipient_user_id` | BIGINT UNSIGNED | NOT NULL, FK → users.id | Penerima notifikasi |
| `template_id` | BIGINT UNSIGNED | NULL, FK → notification_templates.id | Template yang digunakan |
| `event_code` | VARCHAR(100) | NOT NULL | Kode event yang memicu notifikasi |
| `title` | VARCHAR(300) | NOT NULL | Judul notifikasi (singkat) |
| `message` | TEXT | NOT NULL | Pesan lengkap (setelah substitusi variabel) |
| `entity_type` | VARCHAR(50) | NULL | Tipe entitas terkait (project, prospect, dll.) |
| `entity_id` | BIGINT UNSIGNED | NULL | ID entitas terkait |
| `action_url` | VARCHAR(500) | NULL | URL deep-link ke halaman terkait |
| `is_read` | TINYINT(1) | NOT NULL DEFAULT 0 | Sudah dibaca |
| `read_at` | TIMESTAMP | NULL | Kapan dibaca |
| `created_at` | TIMESTAMP | NOT NULL | |

### 2.2 Indexes

```sql
CREATE INDEX idx_notif_recipient     ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX idx_notif_entity        ON notifications(entity_type, entity_id);
CREATE INDEX idx_notif_event_code    ON notifications(event_code);
```

---

## 3. NOTIFICATION EVENT MATRIX (LENGKAP)

| Event Code | Trigger | Penerima | Action URL |
|---|---|---|---|
| `prospect.submitted` | Cabang submit prospek ke PM | PM yang assigned | /prospects/:id |
| `prospect.revision_sent` | PM kirim revisi prospek | Cabang pembuat | /prospects/:id |
| `prospect.approved` | PM approve prospek | Cabang pembuat | /prospects/:id |
| `project.created` | Proyek baru dibuat | PM yang assigned | /projects/:id |
| `project.rks_submitted` | Cabang submit RKS | PM proyek | /projects/:id |
| `project.rks_revision_sent` | PM revisi RKS | Cabang | /projects/:id |
| `project.rks_approved` | PM approve RKS | Cabang + Dept yang dipilih | /projects/:id |
| `project.lphs_dept_requested` | Draft LPHS diupload | Dept yang dipilih (per dept) | /projects/:id |
| `project.lphs_dept_approved` | Dept approve LPHS | PM (info update) | /projects/:id |
| `project.lphs_pm_approved` | PM approve LPHS | Semua dept terkait | /projects/:id |
| `project.lphs_all_approved` | Semua dept + PM approve | Management | /projects/:id |
| `project.lphs_mgmt_approved` | Management approve LPHS final | Cabang + PM | /projects/:id |
| `project.lphs_revision_sent` | Targeted revision LPHS | Cabang + dept yang ditarget | /projects/:id |
| `project.winner_inputted_win` | Cabang input hasil = menang | PM + Management | /projects/:id |
| `project.winner_inputted_lose` | Cabang input hasil = kalah | PM | /projects/:id |
| `project.delivery_completed` | Cabang konfirmasi delivery selesai | PM + Management | /projects/:id |
| `project.cancelled` | Proyek dibatalkan | Cabang + approver pending | /projects/:id |
| `project.deadline_approaching` | Deadline tender ≤ 7 hari (dari scheduler) | Cabang + PM | /projects/:id |
| `approval.sla_warning` | SLA approval mendekati batas (dari SLA engine) | Approver yang pending | /approvals |
| `approval.sla_overdue` | SLA approval terlampaui | Approver + Management | /approvals |
| `approval.escalated` | Eskalasi SLA | Management / Admin | /approvals |
| `approval.reassigned` | Approval di-reassign | Assignee baru | /approvals |
| `project.pm_reassigned` | PM proyek diganti | Cabang + PM baru | /projects/:id |
| `user.password_reset` | Admin reset password user | User bersangkutan | /profile/change-password |
| `user.account_activated` | Admin aktifkan akun user | User bersangkutan | /login |

---

## 4. NOTIFICATION SERVICE

### 4.1 NotificationService Interface

```typescript
interface NotificationService {
  send(params: {
    event_code: string;
    recipient_user_ids: number[];
    entity_type?: string;
    entity_id?: number;
    variables: Record<string, string | number>;
    action_url?: string;
  }): Promise<void>;

  sendToRole(params: {
    event_code: string;
    roles: string[];
    branch_id?: number;
    entity_type?: string;
    entity_id?: number;
    variables: Record<string, string | number>;
  }): Promise<void>;
}
```

### 4.2 Implementasi send()

```typescript
async function send(params) {
  const template = await getNotificationTemplate(params.event_code);
  if (!template || !template.is_active) return;

  // Substitusi variabel
  const message = substituteVariables(template.template_inapp, params.variables);
  const title = extractTitle(message); // ambil baris pertama sebagai judul

  // Buat record notifikasi per penerima
  const notifications = params.recipient_user_ids.map(userId => ({
    recipient_user_id: userId,
    template_id: template.id,
    event_code: params.event_code,
    title,
    message,
    entity_type: params.entity_type ?? null,
    entity_id: params.entity_id ?? null,
    action_url: params.action_url ?? null,
    is_read: 0
  }));

  await db.bulkInsert('notifications', notifications);

  // Emit event untuk real-time (Fase 2: WebSocket / SSE)
  // Fase 1: client polling akan mengambil via GET /api/notifications
}
```

### 4.3 Deadline Approaching Job (GAP-13)

```typescript
// Cron: setiap hari jam 07:00 WIB
async function checkDeadlines() {
  const projectsNearDeadline = await db.query(`
    SELECT p.id, p.name, p.assigned_pm_id, p.branch_id,
           r.deadline_tender,
           DATEDIFF(r.deadline_tender, CURDATE()) AS days_remaining
    FROM projects p
    JOIN project_rks r ON r.project_id = p.id
    JOIN project_statuses ps ON ps.id = p.status_id
    WHERE ps.is_terminal = 0
      AND p.is_cancelled = 0
      AND r.deadline_tender IS NOT NULL
      AND DATEDIFF(r.deadline_tender, CURDATE()) BETWEEN 1 AND 7
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_id = p.id
          AND n.event_code = 'project.deadline_approaching'
          AND DATE(n.created_at) = CURDATE()
      )
  `);

  for (const project of projectsNearDeadline) {
    const branchUsers = await getUsersByBranch(project.branch_id);
    const recipients = [...branchUsers.map(u => u.id), project.assigned_pm_id].filter(Boolean);

    await notificationService.send({
      event_code: 'project.deadline_approaching',
      recipient_user_ids: [...new Set(recipients)],
      entity_type: 'project',
      entity_id: project.id,
      action_url: `/projects/${project.id}`,
      variables: {
        projectName: project.name,
        daysRemaining: project.days_remaining,
        deadlineDate: formatDate(project.deadline_tender)
      }
    });
  }
}
```

---

## 5. POLLING MECHANISM (FASE 1)

### 5.1 Frontend Polling

```typescript
// useNotifications hook
const POLL_INTERVAL = 60_000; // 60 detik

const { data } = useQuery({
  queryKey: ['notifications', 'unread'],
  queryFn: () => api.get('/api/notifications?unreadOnly=true&limit=10'),
  refetchInterval: POLL_INTERVAL,
  staleTime: POLL_INTERVAL - 5000
});

// Tampilkan toast jika count bertambah
useEffect(() => {
  if (data?.unread_count > previousCount) {
    toast.info(`${data.unread_count - previousCount} notifikasi baru`);
  }
}, [data?.unread_count]);
```

### 5.2 Badge Counter

```typescript
// Badge di TopBar bell icon
const unreadCount = data?.unread_count ?? 0;
// Tampilkan: jika > 99 tampilkan "99+"
const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);
```

---

## 6. API ENDPOINTS

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | /api/notifications | Auth | List notifikasi (query: unreadOnly, limit, page) |
| GET | /api/notifications/count | Auth | Count unread (untuk badge; lightweight) |
| PUT | /api/notifications/:id/read | Auth | Mark satu notifikasi sebagai dibaca |
| PUT | /api/notifications/read-all | Auth | Mark semua sebagai dibaca |
| DELETE | /api/notifications/:id | Auth | Hapus satu notifikasi |

### 6.1 GET /api/notifications Response

```json
{
  "unread_count": 3,
  "data": [
    {
      "id": 501,
      "event_code": "project.rks_submitted",
      "title": "RKS Proyek Gedung X menunggu review",
      "message": "RKS proyek Pembangunan Gedung Kantor Pusat dari Cabang Jakarta menunggu review Anda.",
      "entity_type": "project",
      "entity_id": 123,
      "action_url": "/projects/123",
      "is_read": false,
      "created_at": "2025-06-10T08:30:00Z",
      "created_at_relative": "2 jam lalu"
    }
  ],
  "meta": { "total": 15, "unread": 3, "page": 1, "perPage": 10 }
}
```

---

## 7. BUSINESS RULES

| ID | Rule |
|---|---|
| BR-NOTIF-01 | Notifikasi hanya dikirim ke user yang aktif (`is_active = 1`) |
| BR-NOTIF-02 | Notifikasi disimpan di DB; tidak hilang jika user offline saat event terjadi |
| BR-NOTIF-03 | Polling interval: 60 detik di Fase 1; digantikan WebSocket/SSE di Fase 2 |
| BR-NOTIF-04 | Mark as read tidak menghapus notifikasi; hanya mengubah `is_read = 1` |
| BR-NOTIF-05 | Template notifikasi dapat dikustomisasi Admin melalui CFG-09 |
| BR-NOTIF-06 | Deadline approaching: cek setiap hari; tidak mengirim duplikat pada hari yang sama |
| BR-NOTIF-07 | Notifikasi untuk proyek yang sudah cancelled tidak perlu dikirim (skip jika `project.is_cancelled = 1`) |
| BR-NOTIF-08 | Jika `recipient_user_ids` kosong (mis: PM belum di-assign): notifikasi tidak dikirim; catat warning di log |

---

## 8. QA TEST SCENARIOS

| ID | Skenario | Expected Result |
|---|---|---|
| TC-NOTIF-01 | Cabang submit prospek ke PM | PM menerima notifikasi in-app; badge +1 |
| TC-NOTIF-02 | User buka notifikasi (klik bell) | Dropdown menampilkan 10 notifikasi terbaru |
| TC-NOTIF-03 | User klik notifikasi | navigate ke action_url; is_read = 1 |
| TC-NOTIF-04 | User klik "Tandai Semua Dibaca" | Semua notifikasi is_read = 1; badge = 0 |
| TC-NOTIF-05 | Polling 60 detik; ada 2 notifikasi baru | Toast "2 notifikasi baru"; badge diperbarui |
| TC-NOTIF-06 | Proyek dengan deadline 3 hari lagi → cron berjalan | Cabang dan PM menerima notifikasi deadline |
| TC-NOTIF-07 | Cron berjalan lagi hari yang sama | Tidak mengirim notifikasi duplikat (cek exists per hari) |
| **TC-NOTIF-08** | User clear browser cache (tidak ada localStorage) | Notifikasi tetap ada (tersimpan di DB, bukan localStorage) |

**FR Coverage:** FR090 ✓ | FR091 ✓ | GAP-13 ✓
