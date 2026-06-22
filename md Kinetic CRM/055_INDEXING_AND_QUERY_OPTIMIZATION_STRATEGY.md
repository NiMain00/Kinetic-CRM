# 055 — INDEXING AND QUERY OPTIMIZATION STRATEGY
## KINETIC CRM — Strategi Index dan Optimasi Query

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 055 |
| **Nama Dokumen** | Indexing and Query Optimization Strategy |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 053 (Full Entity Relationship Diagram), 054 (Full Database Schema DDL), 059 (Non-Functional Requirements) |
| **Dokumen Terkait** | 054 (DDL), 057 (Full API Endpoint Specification), 059 (Non-Functional Requirements), 020 (Authorization Enforcement Spec) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Database Administrator, Backend Developer, Performance Engineer, DevOps Engineer

---

## 1. PURPOSE

Dokumen ini mendefinisikan **strategi index konkret** untuk setiap tabel di **054_FULL_DATABASE_SCHEMA_DDL.md**, dipetakan langsung ke target performa terukur di **059_NON_FUNCTIONAL_REQUIREMENTS.md** (§3, §5). Setiap index yang didefinisikan di sini memiliki justifikasi query pattern yang konkret — bukan index spekulatif "siapa tahu nanti dibutuhkan".

---

## 2. SCOPE

### In Scope
- Index untuk seluruh query pattern kritis yang teridentifikasi dari 057 (kontrak endpoint) dan 020 (scope filtering)
- Composite index untuk query multi-kondisi (filter + sort + scope)
- Full-text search index untuk fitur `search` di seluruh endpoint list
- Partitioning strategy masa depan untuk tabel volume tinggi (`audit_logs`, `notifications`)
- Query pattern kritis dengan contoh EXPLAIN yang diharapkan

### Out of Scope
- DDL `CREATE TABLE` dasar (sudah di 054)
- Definisi entitas dan relasi (sudah di 053)

---

## 3. PRINSIP UMUM INDEXING

1. **Setiap foreign key yang sering menjadi filter scope (020 §3.4) wajib diindeks** — PostgreSQL tidak otomatis membuat index pada foreign key (berbeda dari primary key).
2. **Composite index disusun dengan kolom equality filter dahulu, lalu kolom range/sort** — sesuai praktik terbaik PostgreSQL B-tree (kolom yang difilter dengan `=` ditempatkan sebelum kolom yang difilter dengan `>`/`<`/`ORDER BY`).
3. **Partial index digunakan untuk kondisi yang sering difilter dan bersifat selektif** — misalnya `WHERE deleted_at IS NULL` atau `WHERE is_active = true`, mengurangi ukuran index dan meningkatkan cache hit ratio.
4. **Index tidak dibuat untuk tabel kecil yang jarang berubah** (misalnya `roles`, `permissions`) kecuali pada kolom yang sudah `UNIQUE`.
5. **Setiap index baru harus dijustifikasi oleh query pattern konkret** dari 057 — bagian §5 dokumen ini memetakan setiap index ke endpoint API yang dilayaninya.

---

## 4. INDEX PER TABEL

### 4.1 Organization & Access

```sql
-- users: filter scope berdasarkan branch/department (020 §8.3), login lookup
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_branch_id ON users(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_department_id ON users(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role_id ON users(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active_search ON users(is_active, name) WHERE deleted_at IS NULL;

-- active_sessions: lookup token saat setiap request (020 §6.3) — paling kritikal untuk latency
CREATE UNIQUE INDEX idx_active_sessions_token_jti ON active_sessions(token_jti);
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_active_sessions_expires_at ON active_sessions(expires_at) WHERE revoked_at IS NULL;

-- role_permissions: lookup permission set saat login (020 §6.5)
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);

-- branches/departments/divisions: lookup hierarki untuk CONF-01 tree
CREATE INDEX idx_branches_division_id ON branches(division_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_departments_division_id ON departments(division_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_departments_parent_id ON departments(parent_department_id) WHERE deleted_at IS NULL;

-- user_positions: lookup backup approver (042)
CREATE INDEX idx_user_positions_position_id ON user_positions(position_id);
CREATE INDEX idx_user_positions_user_id ON user_positions(user_id);
```

**Query Pattern Kritis — JWT Middleware Session Validation (020 §6.3):**
```sql
-- Dijalankan pada SETIAP request API; harus sub-millisecond
SELECT s.id, u.is_active, u.role_id
FROM active_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.token_jti = :jti AND s.expires_at > NOW() AND s.revoked_at IS NULL AND u.is_active = true;
-- Dilayani oleh idx_active_sessions_token_jti (unique lookup O(log n))
```

### 4.2 Master Data

```sql
-- customers: search-as-you-type (057 §9.2, FE Spec PROS-02)
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_active ON customers(is_active) WHERE deleted_at IS NULL;

-- questions: filter by context (prospect/rks) untuk render DynamicQuestionForm
CREATE INDEX idx_questions_context_order ON questions(context, display_order) WHERE deleted_at IS NULL AND is_active = true;

-- competitors: lookup untuk Tab Kompetitor (PROJ-03f) dan analitik
CREATE INDEX idx_competitors_name_trgm ON competitors USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_competitors_status ON competitors(status) WHERE deleted_at IS NULL;

-- holidays: lookup kalkulasi SLA hari kerja (041) — dipanggil sangat sering oleh SLA engine
CREATE INDEX idx_holidays_date ON holidays(date);
```

**Catatan Extension Wajib untuk Full-Text Search:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```
Extension `pg_trgm` diperlukan untuk index GIN trigram yang mendukung pencarian partial-match case-insensitive (`ILIKE '%keyword%'`) dengan performa jauh lebih baik dibanding sequential scan, memenuhi target Search Response Time p95 ≤ 400ms (059 §3).

### 4.3 Prospect Management

```sql
-- prospects: query list utama (057 §9.1) — kombinasi scope branch_id + filter status + search + sort createdAt
CREATE INDEX idx_prospects_branch_status ON prospects(branch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_prospects_created_at ON prospects(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_prospects_name_trgm ON prospects USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_prospects_customer_id ON prospects(customer_id) WHERE deleted_at IS NULL;

-- prospect_answers: lookup jawaban per prospek saat render detail (057 §9.3)
CREATE INDEX idx_prospect_answers_prospect_id ON prospect_answers(prospect_id);

-- prospect_review_questions: lookup per round untuk Tab Review PM
CREATE INDEX idx_prospect_review_q_prospect_round ON prospect_review_questions(prospect_id, review_round);
```

**Query Pattern Kritis — Daftar Prospek dengan Scope (057 §9.1):**
```sql
-- Role cabang: scope branch_id wajib + filter status opsional + search + pagination
SELECT * FROM prospects
WHERE deleted_at IS NULL
  AND branch_id = :branchId
  AND (:status IS NULL OR status = :status)
  AND (:search IS NULL OR name ILIKE '%' || :search || '%')
ORDER BY created_at DESC
LIMIT :perPage OFFSET :offset;
-- Dilayani oleh idx_prospects_branch_status (composite, equality dahulu) + idx_prospects_name_trgm untuk search
```

### 4.4 Project Core

```sql
-- projects: query list (057 §10.1) dengan scope branch_id ATAU dept involvement + filter status + sort
CREATE INDEX idx_projects_branch_status ON projects(branch_id, status_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_at ON projects(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_deadline_tender ON projects(deadline_tender) WHERE deleted_at IS NULL AND deadline_tender IS NOT NULL;
CREATE INDEX idx_projects_category_id ON projects(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_customer_id ON projects(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_prospect_id ON projects(prospect_id) WHERE deleted_at IS NULL;

-- project_timeline_events: query timeline per proyek (057 §10.5), selalu sort ASC/DESC by occurred_at
CREATE INDEX idx_timeline_project_occurred ON project_timeline_events(project_id, occurred_at DESC);
```

**Query Pattern Kritis — Widget Dashboard "Approaching Deadline" (057 §8.3):**
```sql
SELECT id, name, deadline_tender FROM projects
WHERE deleted_at IS NULL
  AND deadline_tender BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND status_id NOT IN (SELECT id FROM project_status_definitions WHERE is_terminal = true)
ORDER BY deadline_tender ASC;
-- Dilayani oleh idx_projects_deadline_tender (partial index, hanya baris dengan deadline terisi)
```

### 4.5 RKS, LPHS/SIOS

```sql
-- rks: lookup by project_id sudah dijamin UNIQUE di 054, tidak perlu index tambahan
-- (unique constraint pada project_id otomatis membuat index)

CREATE INDEX idx_rks_review_q_rks_round ON rks_review_questions(rks_id, review_round);

-- lphs_sios: unique constraint pada project_id sudah otomatis terindeks
CREATE INDEX idx_lphs_dept_review_lphs_id ON lphs_department_reviews(lphs_sios_id);
CREATE INDEX idx_lphs_dept_review_dept_id ON lphs_department_reviews(department_id, approval_status);
```

**Query Pattern Kritis — Status Matrix LPHS Approval per Departemen (057 §12.1):**
```sql
-- Menampilkan progress ring "X dari Y dept approve" — dijalankan setiap kali Tab LPHS dibuka
SELECT department_id, approval_status FROM lphs_department_reviews WHERE lphs_sios_id = :lphsId;
-- Dilayani oleh primary key implicit index pada lphs_department_reviews + idx_lphs_dept_review_lphs_id
```

### 4.6 Harga & Kompetitor

```sql
-- price_submissions: unique constraint pada project_id sudah otomatis terindeks
CREATE INDEX idx_project_competitors_project_id ON project_competitors(project_id);
CREATE INDEX idx_project_competitors_competitor_id ON project_competitors(competitor_id);
```

**Query Pattern Kritis — Analitik Kompetitor Lintas Proyek (010, AI Competitor Analysis):**
```sql
-- "Win rate kita melawan Kompetitor X" — agregasi lintas proyek
SELECT
  COUNT(*) FILTER (WHERE tr.result = 'won') AS won_against,
  COUNT(*) AS total_matchup
FROM project_competitors pc
JOIN tender_results tr ON tr.project_id = pc.project_id
WHERE pc.competitor_id = :competitorId;
-- Dilayani oleh idx_project_competitors_competitor_id + index implisit unique pada tender_results.project_id
```

### 4.7 Pemenang & Delivery

```sql
-- tender_results: dipakai untuk laporan Win/Loss (057 §19.1), join berat dengan projects
CREATE INDEX idx_tender_results_result ON tender_results(result);
CREATE INDEX idx_tender_results_decided_at ON tender_results(decided_at DESC);
CREATE INDEX idx_tender_results_loss_reason ON tender_results(loss_reason_id) WHERE loss_reason_id IS NOT NULL;

CREATE INDEX idx_delivery_targets_status ON delivery_targets(status);
```

**Query Pattern Kritis — Laporan Win/Loss dengan Filter Periode+Cabang (057 §19.1):**
```sql
SELECT p.branch_id, b.name AS branch_name,
       COUNT(*) FILTER (WHERE tr.result = 'won') AS won,
       COUNT(*) FILTER (WHERE tr.result = 'lost') AS lost
FROM tender_results tr
JOIN projects p ON p.id = tr.project_id
JOIN branches b ON b.id = p.branch_id
WHERE tr.decided_at BETWEEN :periodStart AND :periodEnd
  AND (:branchId IS NULL OR p.branch_id = :branchId)
GROUP BY p.branch_id, b.name;
-- Dilayani oleh idx_tender_results_decided_at + idx_projects_branch_status; target p95 ≤ 300ms (059 §5, Query Performance join kompleks)
```

### 4.8 Approval & Workflow Engine

```sql
-- approvals: query Approval Inbox (057 §15.1) — filter assignment (user/role/dept) + status, paling sering diakses
CREATE INDEX idx_approvals_assigned_user_status ON approvals(assigned_to_user_id, status) WHERE assigned_to_user_id IS NOT NULL;
CREATE INDEX idx_approvals_assigned_role_status ON approvals(assigned_to_role_id, status) WHERE assigned_to_role_id IS NOT NULL;
CREATE INDEX idx_approvals_assigned_dept_status ON approvals(assigned_to_department_id, status) WHERE assigned_to_department_id IS NOT NULL;
CREATE INDEX idx_approvals_resource ON approvals(resource_type, resource_id);
CREATE INDEX idx_approvals_sla_deadline ON approvals(sla_deadline) WHERE status = 'pending';

CREATE INDEX idx_approval_reassignments_approval_id ON approval_reassignments(approval_id);
```

**Query Pattern Kritis — Approval Inbox per User (057 §15.1):**
```sql
SELECT * FROM approvals
WHERE status = 'pending'
  AND (assigned_to_user_id = :userId OR assigned_to_role_id = :userRoleId OR assigned_to_department_id = :userDeptId)
ORDER BY sla_deadline ASC NULLS LAST;
-- Dilayani oleh tiga partial index terpisah (idx_approvals_assigned_*); planner PostgreSQL menggunakan Bitmap OR
```

**Query Pattern Kritis — SLA Escalation Engine Scheduled Job (041, 059 §5 Background Job):**
```sql
-- Dijalankan setiap 15 menit, harus selesai ≤ 60 detik untuk seluruh proyek aktif
SELECT id, sla_deadline, assigned_to_user_id FROM approvals
WHERE status = 'pending' AND sla_deadline < NOW() + INTERVAL '1 day';
-- Dilayani oleh idx_approvals_sla_deadline (partial index hanya status=pending, sangat selektif)
```

### 4.9 Document Management

```sql
-- documents: query Tab Dokumen (057 §20) — filter resource + tipe + versi terkini
CREATE INDEX idx_documents_resource ON documents(resource_type, resource_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_resource_type_latest ON documents(resource_type, resource_id, document_type_id)
  WHERE deleted_at IS NULL AND is_latest_version = true;
CREATE INDEX idx_documents_department_id ON documents(department_id) WHERE department_id IS NOT NULL;
```

**Query Pattern Kritis — Daftar Dokumen Versi Terkini per Proyek (057 §20.1):**
```sql
SELECT * FROM documents
WHERE resource_type = 'rks' AND resource_id = :resourceId AND is_latest_version = true AND deleted_at IS NULL;
-- Dilayani oleh idx_documents_resource_type_latest (composite, fully covers WHERE clause)
```

### 4.10 Target & KPI

```sql
-- targets: query Progress vs Target (057 §19.3) — filter scope + periode + versi current
CREATE INDEX idx_targets_scope_period ON targets(scope_type, scope_id, period_id) WHERE is_current_version = true;
CREATE INDEX idx_targets_kpi_definition ON targets(kpi_definition_id);

CREATE INDEX idx_target_snapshots_target_date ON target_progress_snapshots(target_id, snapshot_date DESC);

CREATE INDEX idx_kpi_weights_definition_effective ON kpi_weights(kpi_definition_id, effective_from DESC);
```

**Query Pattern Kritis — Dashboard Widget Progress vs Target (057 §8.1):**
```sql
SELECT t.target_value, tps.actual_value, tps.percentage_achieved, tps.traffic_light_status
FROM targets t
JOIN target_progress_snapshots tps ON tps.target_id = t.id
WHERE t.scope_type = 'branch' AND t.scope_id = :branchId
  AND t.period_id = :currentPeriodId AND t.is_current_version = true
ORDER BY tps.snapshot_date DESC LIMIT 1;
-- Dilayani oleh idx_targets_scope_period + idx_target_snapshots_target_date
```

### 4.11 Notification

```sql
-- notifications: query polling badge counter (057 §18.1) — paling sering dipanggil di seluruh sistem (polling interval, 046)
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_user_id, is_read, created_at DESC);
```

**Query Pattern Kritis — Polling Notifikasi (057 §18.1, dipanggil setiap interval polling oleh SEMUA user aktif):**
```sql
SELECT * FROM notifications
WHERE recipient_user_id = :userId AND is_read = false
ORDER BY created_at DESC LIMIT 20;
-- Dilayani oleh idx_notifications_recipient_unread; index ini PALING KRITIKAL untuk throughput
-- karena dipanggil oleh setiap user aktif secara periodik (lihat 059 §5, Background Job Performance notification dispatch)
```

### 4.12 Audit

```sql
-- audit_logs: query investigasi (057 §21.1) — volume tertinggi di seluruh sistem, partitioning wajib (lihat §6)
CREATE INDEX idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_result ON audit_logs(result) WHERE result = 'denied';
```

**Catatan Khusus Index Audit Log:** Index `idx_audit_logs_result` bersifat partial dan hanya menyimpan baris `result = 'denied'`, mendukung query monitoring keamanan (059 §15, alert "Failed login attempt anomali") tanpa membebani index dengan mayoritas baris `success` yang tidak relevan untuk use case investigasi keamanan.

### 4.13 Configuration & AI

```sql
CREATE UNIQUE INDEX idx_integration_config_key ON integration_configurations(key);
CREATE INDEX idx_ai_request_logs_requested_by ON ai_request_logs(requested_by, created_at DESC);
CREATE INDEX idx_ai_request_logs_feature_status ON ai_request_logs(feature_code, status, created_at DESC);
```

**Query Pattern Kritis — AI Cost/Error Rate Monitoring (010, 059 §14 AI Service Layer Monitoring):**
```sql
SELECT feature_code, status, COUNT(*), AVG(latency_ms)
FROM ai_request_logs
WHERE created_at > NOW() - INTERVAL '15 minutes'
GROUP BY feature_code, status;
-- Dilayani oleh idx_ai_request_logs_feature_status; mendukung alert threshold 059 §15 (AI provider error rate >10%)
```

---

## 5. PEMETAAN INDEX KE ENDPOINT API

Tabel berikut memetakan setiap index utama ke endpoint 057 yang dilayaninya, untuk memudahkan QA memverifikasi index benar-benar terpakai (via `EXPLAIN ANALYZE`) saat performance testing.

| Index | Endpoint 057 yang Dilayani | Target 059 Terkait |
|---|---|---|
| `idx_active_sessions_token_jti` | Seluruh endpoint (middleware auth) | API response time p95 |
| `idx_prospects_branch_status` | GET /prospects | Search response time |
| `idx_projects_branch_status` | GET /projects | Search response time |
| `idx_projects_deadline_tender` | GET /dashboard/approaching-deadline | Dashboard load time |
| `idx_approvals_assigned_user_status` | GET /approvals | Dashboard load time, Approval Pending widget |
| `idx_approvals_sla_deadline` | Background job SLA escalation (041) | Background job performance |
| `idx_notifications_recipient_unread` | GET /notifications | Background job performance (notification dispatch) |
| `idx_documents_resource_type_latest` | GET /documents/:id/versions, Tab Dokumen | API response time |
| `idx_targets_scope_period` | GET /reports/progress-vs-target | Query performance join kompleks |
| `idx_audit_logs_actor_created` | GET /audit-logs | Tidak ada target spesifik (akses admin jarang, prioritas lebih rendah) |
| `idx_ai_request_logs_feature_status` | Internal monitoring AI Service Layer | AI feature response time, cost control |

---

## 6. PARTITIONING STRATEGY MASA DEPAN

Sesuai 059 §7 (Scalability Requirements: `audit_logs` ditargetkan hingga 2.000.000 baris, `notifications` hingga 1.000.000 baris), berikut strategi partitioning yang **dipersiapkan secara arsitektural namun belum diaktifkan di Fase 1** (diaktifkan saat volume mendekati threshold):

### 6.1 Partitioning `audit_logs` (Range Partition by `created_at`)

```sql
-- Struktur partitioning yang disiapkan untuk migrasi saat volume tabel mendekati 1.5 juta baris
-- (ambang aktivasi: 75% dari target skala 2 juta baris di 059 §7)

CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_y2025q3 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE audit_logs_y2025q4 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
-- Partisi baru dibuat otomatis per kuartal melalui scheduled job (lihat 060 untuk operasional)
```

**Manfaat:** Query dengan filter `created_at` (mayoritas query investigasi audit, lihat §4.12) hanya men-scan partisi relevan (partition pruning), bukan seluruh tabel. Retensi 5 tahun (059 §18) juga lebih mudah dikelola dengan `DROP PARTITION` dibanding `DELETE` baris massal yang membebani I/O.

### 6.2 Partitioning `notifications` (Range Partition by `created_at`)

Strategi serupa diterapkan untuk `notifications`, dengan kebijakan tambahan: partisi yang lebih tua dari retensi 1 tahun (059 §18) di-`DROP` langsung (bukan soft-delete), karena notifikasi tidak memiliki kebutuhan audit jangka panjang.

### 6.3 Kriteria Aktivasi Partitioning

**Inferred Requirement IR-055-01:** BA Review dan FE Spec tidak menyebutkan kapan partitioning harus diaktifkan. Threshold 75% dari target skala (059 §7) dipilih sebagai ambang aman yang memberi waktu cukup untuk migrasi terencana (downtime minimal) sebelum performa terdegradasi akibat ukuran tabel — dilakukan sebagai bagian dari maintenance window terjadwal (lihat 059 §6).

---

## 7. QUERY PATTERN ANTI-PATTERN YANG DIHINDARI

Untuk menjaga target performa 059 §3 dan §5, pola berikut secara eksplisit **dilarang** dalam implementasi service layer:

| Anti-Pattern | Alasan Dilarang | Alternatif yang Benar |
|---|---|---|
| `SELECT *` pada tabel dengan kolom besar (`rks.content`, `audit_logs.payload_*`) saat hanya listing | Transfer data berlebih memperlambat response time list | Pilih kolom eksplisit untuk endpoint list; `SELECT *` hanya untuk endpoint detail single resource |
| `WHERE column LIKE '%keyword%'` tanpa index trigram | Sequential scan pada tabel besar, melanggar target Search Response Time | Gunakan index GIN trigram (§4.2-§4.3) atau full-text search index |
| N+1 query untuk relasi (mis. loop fetch competitor per project_competitor) | Menyebabkan ratusan round-trip DB untuk satu response, melanggar API response time p95 | Gunakan `JOIN` atau `WHERE id IN (...)` batch fetch di service layer |
| Query tanpa `LIMIT` pada endpoint list | Risiko mengembalikan seluruh tabel saat data bertambah besar | Pagination wajib di seluruh endpoint list (057 §3.3) |
| Index pada kolom dengan kardinalitas rendah dan tanpa filter selektif (mis. `is_active` sendirian tanpa kombinasi) | Index tidak efektif menyaring baris, menambah overhead write tanpa manfaat read | Gunakan composite/partial index yang menggabungkan kolom selektif (lihat §3 prinsip 2-3) |

---

## 8. MONITORING QUERY PERFORMANCE BERKELANJUTAN

Sesuai 059 §14 (Database Monitoring), berikut konfigurasi wajib untuk deteksi regresi performa query:

```sql
-- Aktifkan slow query logging untuk query > 1 detik (059 §14)
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Aktifkan pg_stat_statements untuk tracking query pattern teragregasi
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Review Berkala:** Tim DBA/Backend melakukan review `pg_stat_statements` setiap sprint untuk mengidentifikasi query baru yang muncul dari fitur baru namun belum memiliki index pendukung — proses ini terintegrasi dengan Definition-of-Done modul baru (lihat 063).

---

## 9. INFERRED REQUIREMENTS

### IR-055-01: Threshold Aktivasi Partitioning
Partitioning `audit_logs` dan `notifications` diaktifkan pada 75% dari target skala volume data di 059 §7, bukan menunggu hingga 100% tercapai, untuk memberi ruang waktu migrasi terencana tanpa tekanan performa darurat. BA Review tidak menyebutkan kapan tepatnya, sehingga ambang ini diturunkan sebagai praktik operasional konservatif.

### IR-055-02: pg_trgm sebagai Strategi Search Wajib
Seluruh kolom `name`/teks yang menjadi target filter `search` di 057 (prospects, projects, customers, competitors) menggunakan index GIN trigram (`pg_trgm`), bukan full-text search PostgreSQL standar (`tsvector`), karena kebutuhan pencarian di FE Spec bersifat partial-match substring (mis. "Gedung" cocok dengan "Pembangunan Gedung Kantor"), yang lebih sesuai dengan semantik trigram dibanding tokenized full-text search yang berbasis kata utuh.
