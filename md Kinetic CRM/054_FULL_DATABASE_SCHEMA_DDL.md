# 054 — FULL DATABASE SCHEMA DDL
## KINETIC CRM — Skema Database Lengkap (DDL)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 054 |
| **Nama Dokumen** | Full Database Schema DDL |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 053 (Full Entity Relationship Diagram), 000_DOCUMENT_INDEX.md |
| **Dokumen Terkait** | 053 (ERD), 055 (Indexing and Query Optimization Strategy), 007 (Data Architecture Principles), 020 (Authorization Enforcement Spec) |
| **Status** | Final — Siap Digunakan |
| **Target RDBMS** | PostgreSQL 15+ (lihat 6 — Catatan Portabilitas untuk MySQL fallback) |

**Dibaca oleh:** Database Administrator, Backend Developer, DevOps Engineer

---

## 1. PURPOSE

Dokumen ini menerjemahkan model konseptual di **053_FULL_ENTITY_RELATIONSHIP_DIAGRAM.md** menjadi **DDL SQL konkret dan dapat dieksekusi langsung**. Setiap tabel, kolom, tipe data, constraint, foreign key, dan default value didefinisikan lengkap. Dokumen ini tidak mengulang justifikasi bisnis/relasi (sudah ada di 053) — fokusnya murni pada representasi fisik database.

---

## 2. SCOPE

### In Scope
- DDL `CREATE TABLE` lengkap untuk 61 entitas dari 053
- Tipe data SQL konkret, constraint (`NOT NULL`, `UNIQUE`, `CHECK`), default value
- Foreign key constraint dengan `ON DELETE`/`ON UPDATE` behavior
- Enum yang direpresentasikan sebagai `CHECK` constraint atau native `ENUM` type
- Extension PostgreSQL yang dibutuhkan (`uuid-ossp`/`pgcrypto`)

### Out of Scope
- Strategi index (selain `UNIQUE` yang implisit dari constraint) → 055
- Justifikasi bisnis per entitas/relasi → 053
- Row-Level Security policy detail → 020 §9.2

---

## 3. EXTENSIONS & GLOBAL CONVENTIONS

```sql
-- Extension wajib untuk UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Konvensi global yang berlaku di seluruh tabel:
-- 1. Primary key selalu UUID, default gen_random_uuid()
-- 2. Seluruh tabel transaksional memiliki created_at; tabel yang dapat diubah memiliki updated_at
-- 3. Soft-delete tabel memiliki deleted_at (NULL = belum dihapus)
-- 4. Foreign key default ON DELETE RESTRICT kecuali dinyatakan lain (mencegah penghapusan data yang masih dirujuk)
-- 5. Nama tabel snake_case singular tidak digunakan — menggunakan snake_case plural sesuai konvensi PostgreSQL umum
```

---

## 4. DOMAIN: ORGANIZATION & ACCESS

```sql
CREATE TABLE companies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(200) NOT NULL UNIQUE,
  legal_entity_number   VARCHAR(100),
  logo_document_id      UUID,
  address               TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE divisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(10) NOT NULL UNIQUE,
  head_user_id  UUID,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE departments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id            UUID REFERENCES divisions(id) ON DELETE RESTRICT,
  parent_department_id   UUID REFERENCES departments(id) ON DELETE RESTRICT,
  name                   VARCHAR(200) NOT NULL,
  code                   VARCHAR(10) NOT NULL UNIQUE,
  head_user_id           UUID,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ
);

CREATE TABLE branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id   UUID NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(20) NOT NULL UNIQUE,
  city          VARCHAR(100) NOT NULL,
  address       TEXT,
  pic_user_id   UUID,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE roles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(50) NOT NULL UNIQUE,
  name                VARCHAR(100) NOT NULL,
  description         TEXT,
  is_system_default   BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       VARCHAR(150) NOT NULL UNIQUE,
  resource   VARCHAR(100) NOT NULL,
  action     VARCHAR(50) NOT NULL,
  label      VARCHAR(200) NOT NULL
);

CREATE TABLE role_permissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id        UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(150) NOT NULL,
  username             VARCHAR(50) NOT NULL UNIQUE,
  email                VARCHAR(150) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  role_id              UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  branch_id            UUID REFERENCES branches(id) ON DELETE RESTRICT,
  department_id        UUID REFERENCES departments(id) ON DELETE RESTRICT,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  is_locked            BOOLEAN NOT NULL DEFAULT false,
  failed_login_count   INTEGER NOT NULL DEFAULT 0,
  last_login_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- Tambahan FK setelah users dibuat (resolusi circular dependency company/division/department/branch <-> users)
ALTER TABLE divisions   ADD CONSTRAINT fk_divisions_head_user   FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE departments ADD CONSTRAINT fk_departments_head_user FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE branches     ADD CONSTRAINT fk_branches_pic_user      FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE active_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti    VARCHAR(255) NOT NULL UNIQUE,
  ip_address   INET NOT NULL,
  user_agent   TEXT,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE positions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(150) NOT NULL UNIQUE,
  approval_level   INTEGER NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id   UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  is_backup     BOOLEAN NOT NULL DEFAULT false,
  valid_from    DATE,
  valid_until   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_user_positions_valid_range CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);
```

---

## 5. DOMAIN: MASTER DATA

```sql
CREATE TABLE customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL UNIQUE,
  code         VARCHAR(10) NOT NULL UNIQUE,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('swasta', 'bumn', 'pemerintah')),
  pic_contact  VARCHAR(150),
  email        VARCHAR(150),
  phone        VARCHAR(30),
  address      TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE project_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(150) NOT NULL UNIQUE,
  requires_lphs  BOOLEAN NOT NULL DEFAULT true,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_status_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(50) NOT NULL UNIQUE,
  label           VARCHAR(100) NOT NULL,
  color           VARCHAR(7) NOT NULL,
  display_order   INTEGER NOT NULL,
  is_terminal     BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approval_level_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level         INTEGER NOT NULL UNIQUE,
  label         VARCHAR(100) NOT NULL,
  description   TEXT
);

CREATE TABLE document_type_definitions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               VARCHAR(50) NOT NULL UNIQUE,
  label              VARCHAR(100) NOT NULL,
  applies_to_stage   VARCHAR(100),
  is_active          BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE competitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL UNIQUE,
  short_code      VARCHAR(20),
  business_field  VARCHAR(150),
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_review', 'inactive')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE question_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  label       VARCHAR(100) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE question_type_options (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_type_id  UUID NOT NULL REFERENCES question_types(id) ON DELETE CASCADE,
  option_label      VARCHAR(200) NOT NULL,
  display_order     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text             TEXT NOT NULL,
  question_type_id UUID NOT NULL REFERENCES question_types(id) ON DELETE RESTRICT,
  context          VARCHAR(20) NOT NULL CHECK (context IN ('prospect', 'rks')),
  category_label   VARCHAR(150),
  is_required      BOOLEAN NOT NULL DEFAULT false,
  display_order    INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE TABLE question_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_label    VARCHAR(200) NOT NULL,
  display_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE period_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_closed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_period_date_range CHECK (end_date >= start_date)
);

CREATE TABLE holidays (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                     DATE NOT NULL,
  description              VARCHAR(200) NOT NULL,
  is_recurring_annually    BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_holidays_date UNIQUE (date)
);

CREATE TABLE loss_reasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  label       VARCHAR(150) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. DOMAIN: PROSPECT MANAGEMENT

```sql
CREATE TABLE prospects (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      VARCHAR(200) NOT NULL,
  customer_id               UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id                 UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  category_id               UUID NOT NULL REFERENCES project_categories(id) ON DELETE RESTRICT,
  description               TEXT,
  estimated_value           DECIMAL(18,2),
  estimated_date            DATE,
  status                    VARCHAR(30) NOT NULL DEFAULT 'prospecting'
                             CHECK (status IN ('prospecting', 'waiting_pm_approval', 'revision', 'approved')),
  converted_to_project_id   UUID,
  created_by                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,
  CONSTRAINT chk_prospect_estimated_value CHECK (estimated_value IS NULL OR estimated_value >= 0)
);

CREATE TABLE prospect_answers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id        UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  answer_text        TEXT,
  answer_option_id   UUID REFERENCES question_options(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prospect_answer UNIQUE (prospect_id, question_id)
);

CREATE TABLE prospect_answer_options (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_answer_id    UUID NOT NULL REFERENCES prospect_answers(id) ON DELETE CASCADE,
  question_option_id    UUID NOT NULL REFERENCES question_options(id) ON DELETE RESTRICT,
  CONSTRAINT uq_prospect_answer_option UNIQUE (prospect_answer_id, question_option_id)
);

CREATE TABLE prospect_review_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id     UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  review_round    INTEGER NOT NULL,
  question_text   TEXT NOT NULL,
  answer_text     TEXT,
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answered_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prospect_review_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id    UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  review_round   INTEGER NOT NULL,
  note_text      TEXT NOT NULL,
  created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 7. DOMAIN: PROJECT CORE

```sql
CREATE TABLE projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id           UUID REFERENCES prospects(id) ON DELETE RESTRICT,
  name                  VARCHAR(200) NOT NULL,
  project_type          VARCHAR(20) NOT NULL CHECK (project_type IN ('tender', 'prospecting')),
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id             UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  category_id           UUID NOT NULL REFERENCES project_categories(id) ON DELETE RESTRICT,
  status_id             UUID NOT NULL REFERENCES project_status_definitions(id) ON DELETE RESTRICT,
  deadline_tender       DATE,
  tender_number         VARCHAR(100),
  tender_name           VARCHAR(200),
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  cancelled_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  CONSTRAINT uq_projects_tender_number_per_customer UNIQUE (customer_id, tender_number)
);

-- Resolusi FK prospects.converted_to_project_id setelah tabel projects dibuat
ALTER TABLE prospects ADD CONSTRAINT fk_prospects_converted_project
  FOREIGN KEY (converted_to_project_id) REFERENCES projects(id) ON DELETE SET NULL;

CREATE TABLE project_timeline_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type   VARCHAR(100) NOT NULL,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  description  TEXT NOT NULL,
  metadata     JSONB,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan Penggunaan JSONB pada `project_timeline_events.metadata`:** Ini adalah pengecualian terbatas terhadap prinsip anti-JSON-blob (007), dijustifikasi karena `metadata` murni bersifat **deskriptif/display-only** (detail tambahan kontekstual sebuah event timeline yang tidak pernah menjadi syarat query relasional/filter bisnis) — bukan data transaksional yang memerlukan integritas referensial atau agregasi SQL. Field ini tidak pernah menjadi sumber kebenaran (source of truth) untuk state bisnis; seluruh state bisnis tetap berada di kolom relasional eksplisit pada tabel-tabel domain terkait.

---

## 8. DOMAIN: RKS MODULE

```sql
CREATE TABLE rks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'waiting_pm_approval', 'revision', 'approved')),
  revision_number   INTEGER NOT NULL DEFAULT 1,
  submitted_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rks_review_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rks_id          UUID NOT NULL REFERENCES rks(id) ON DELETE CASCADE,
  review_round    INTEGER NOT NULL,
  question_text   TEXT NOT NULL,
  answer_text     TEXT,
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  answered_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rks_review_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rks_id         UUID NOT NULL REFERENCES rks(id) ON DELETE CASCADE,
  review_round   INTEGER NOT NULL,
  note_text      TEXT NOT NULL,
  created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 9. DOMAIN: LPHS/SIOS MODULE

```sql
CREATE TABLE lphs_sios (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  status                   VARCHAR(30) NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'lphs_sios', 'approved')),
  link_lphs_external       TEXT,
  pm_approval_status       VARCHAR(30) NOT NULL DEFAULT 'pending'
                            CHECK (pm_approval_status IN ('pending', 'approved', 'revision_requested')),
  pm_approved_at           TIMESTAMPTZ,
  pm_approved_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  final_approval_status    VARCHAR(30) NOT NULL DEFAULT 'pending'
                            CHECK (final_approval_status IN ('pending', 'approved', 'revision_requested')),
  final_approved_at        TIMESTAMPTZ,
  final_approved_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  revision_number          INTEGER NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lphs_department_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lphs_sios_id      UUID NOT NULL REFERENCES lphs_sios(id) ON DELETE CASCADE,
  department_id     UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  approval_status   VARCHAR(30) NOT NULL DEFAULT 'reviewing'
                     CHECK (approval_status IN ('reviewing', 'pending_pm', 'approved', 'revision_requested')),
  comment           TEXT,
  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lphs_dept_review UNIQUE (lphs_sios_id, department_id)
);

CREATE TABLE lphs_targeted_revisions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lphs_sios_id       UUID NOT NULL REFERENCES lphs_sios(id) ON DELETE CASCADE,
  revision_number    INTEGER NOT NULL,
  initiated_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  initiated_role     VARCHAR(20) NOT NULL CHECK (initiated_role IN ('pm', 'management')),
  note               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lphs_targeted_revision_departments (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lphs_targeted_revision_id     UUID NOT NULL REFERENCES lphs_targeted_revisions(id) ON DELETE CASCADE,
  department_id                 UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT uq_lphs_targeted_revision_dept UNIQUE (lphs_targeted_revision_id, department_id)
);
```

---

## 10. DOMAIN: HARGA & KOMPETITOR

```sql
CREATE TABLE price_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  our_price           DECIMAL(18,2) NOT NULL CHECK (our_price >= 0),
  margin_percentage   DECIMAL(5,2) CHECK (margin_percentage IS NULL OR (margin_percentage >= 0 AND margin_percentage <= 100)),
  note                TEXT,
  reference_link      TEXT,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_competitors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  competitor_id      UUID NOT NULL REFERENCES competitors(id) ON DELETE RESTRICT,
  competitor_price   DECIMAL(18,2) CHECK (competitor_price IS NULL OR competitor_price >= 0),
  advantage_note     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_competitor UNIQUE (project_id, competitor_id)
);
```

---

## 11. DOMAIN: PEMENANG & DELIVERY

```sql
CREATE TABLE tender_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  result              VARCHAR(10) NOT NULL CHECK (result IN ('won', 'lost')),
  final_price         DECIMAL(18,2) CHECK (final_price IS NULL OR final_price >= 0),
  loss_reason_id      UUID REFERENCES loss_reasons(id) ON DELETE RESTRICT,
  loss_reason_note    TEXT,
  decided_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_tender_result_loss_reason CHECK (
    (result = 'lost' AND loss_reason_id IS NOT NULL) OR (result = 'won')
  )
);

CREATE TABLE delivery_targets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  pic_name       VARCHAR(150) NOT NULL,
  notes          TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'delayed')),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_delivery_date_range CHECK (end_date > start_date)
);
```

---

## 12. DOMAIN: APPROVAL & WORKFLOW ENGINE

```sql
CREATE TABLE approval_workflow_stages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_code          VARCHAR(100) NOT NULL UNIQUE,
  label               VARCHAR(150) NOT NULL,
  approver_role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  display_order       INTEGER NOT NULL,
  is_parallel         BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approvals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type               VARCHAR(30) NOT NULL CHECK (resource_type IN ('prospect', 'rks', 'lphs_sios')),
  resource_id                 UUID NOT NULL,
  stage_id                    UUID NOT NULL REFERENCES approval_workflow_stages(id) ON DELETE RESTRICT,
  assigned_to_user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_role_id         UUID REFERENCES roles(id) ON DELETE SET NULL,
  assigned_to_department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  status                      VARCHAR(20) NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')),
  decision_comment            TEXT,
  decided_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
  decided_at                  TIMESTAMPTZ,
  sla_deadline                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_approval_assignee CHECK (
    assigned_to_user_id IS NOT NULL OR assigned_to_role_id IS NOT NULL OR assigned_to_department_id IS NOT NULL
  )
);

CREATE TABLE approval_reassignments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id                 UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  previous_assignee_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  new_assignee_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason                      TEXT NOT NULL,
  reassigned_by               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reassigned_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE backup_approver_delegations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id     UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
  primary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  backup_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  valid_from      DATE NOT NULL,
  valid_until     DATE NOT NULL,
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_backup_delegation_range CHECK (valid_until >= valid_from),
  CONSTRAINT chk_backup_delegation_distinct CHECK (primary_user_id <> backup_user_id)
);
```

**Catatan Implementasi Polymorphic Reference (`approvals.resource_id`):** Sesuai 053 §12, kolom ini **tidak** memiliki foreign key constraint database karena merujuk tabel berbeda sesuai `resource_type`. Integritas referensial divalidasi di service layer (lihat 020 §8.2). DBA harus memastikan tidak ada proses migrasi/cleanup yang menghapus baris `prospects`/`rks`/`lphs_sios` tanpa terlebih dahulu menangani `approvals` terkait (lihat prosedur di 061).

---

## 13. DOMAIN: DOCUMENT MANAGEMENT

```sql
CREATE TABLE documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id    UUID NOT NULL REFERENCES document_type_definitions(id) ON DELETE RESTRICT,
  resource_type       VARCHAR(30) NOT NULL CHECK (resource_type IN ('prospect', 'rks', 'lphs_sios', 'harga', 'pemenang', 'project_misc')),
  resource_id         UUID NOT NULL,
  department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
  file_name           VARCHAR(255) NOT NULL,
  file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type           VARCHAR(150) NOT NULL,
  storage_path        TEXT NOT NULL,
  version_number      INTEGER NOT NULL DEFAULT 1,
  is_latest_version   BOOLEAN NOT NULL DEFAULT true,
  uploaded_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
```

---

## 14. DOMAIN: TARGET & KPI MODULE

```sql
CREATE TABLE kpi_definitions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                   VARCHAR(50) NOT NULL UNIQUE,
  name                   VARCHAR(150) NOT NULL,
  formula_description    TEXT NOT NULL,
  unit                   VARCHAR(20) NOT NULL CHECK (unit IN ('currency', 'percentage', 'count')),
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kpi_weights (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id    UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE RESTRICT,
  weight_percentage    DECIMAL(5,2) NOT NULL CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  effective_from       DATE NOT NULL,
  effective_until      DATE,
  created_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_kpi_weight_range CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

CREATE TABLE targets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id    UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE RESTRICT,
  scope_type           VARCHAR(20) NOT NULL CHECK (scope_type IN ('branch', 'division', 'company')),
  scope_id             UUID NOT NULL,
  period_id            UUID NOT NULL REFERENCES period_definitions(id) ON DELETE RESTRICT,
  target_value         DECIMAL(18,2) NOT NULL,
  version_number       INTEGER NOT NULL DEFAULT 1,
  is_current_version   BOOLEAN NOT NULL DEFAULT true,
  created_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE target_progress_snapshots (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id                UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  snapshot_date            DATE NOT NULL,
  actual_value             DECIMAL(18,2) NOT NULL,
  percentage_achieved      DECIMAL(6,2) NOT NULL,
  traffic_light_status     VARCHAR(10) NOT NULL CHECK (traffic_light_status IN ('red', 'yellow', 'green')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_target_snapshot_date UNIQUE (target_id, snapshot_date)
);
```

**Catatan Polymorphic Reference `targets.scope_id`:** Sama dengan pola `approvals.resource_id` — merujuk ke `branches.id`, `divisions.id`, atau `companies.id` sesuai `scope_type`, divalidasi di service layer.

---

## 15. DOMAIN: NOTIFICATION

```sql
CREATE TABLE notification_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code      VARCHAR(100) NOT NULL UNIQUE,
  template_text   TEXT NOT NULL,
  channel         VARCHAR(20) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_template_recipients (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_template_id      UUID NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
  recipient_role_id             UUID REFERENCES roles(id) ON DELETE CASCADE,
  recipient_department_id       UUID REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT chk_notif_recipient_target CHECK (
    recipient_role_id IS NOT NULL OR recipient_department_id IS NOT NULL
  )
);

CREATE TABLE notifications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_template_id    UUID NOT NULL REFERENCES notification_templates(id) ON DELETE RESTRICT,
  recipient_user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type               VARCHAR(50),
  resource_id                 UUID,
  message                     TEXT NOT NULL,
  is_read                     BOOLEAN NOT NULL DEFAULT false,
  read_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 16. DOMAIN: AUDIT

```sql
CREATE TABLE audit_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id                UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role_snapshot     VARCHAR(50) NOT NULL,
  action                  VARCHAR(150) NOT NULL,
  resource_type           VARCHAR(50),
  resource_id             UUID,
  branch_id_snapshot      UUID,
  ip_address              INET NOT NULL,
  user_agent              TEXT,
  payload_before          JSONB,
  payload_after           JSONB,
  metadata                JSONB,
  result                  VARCHAR(20) NOT NULL CHECK (result IN ('success', 'denied', 'error')),
  error_code               VARCHAR(100),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Catatan Penggunaan JSONB pada `audit_logs`:** Sesuai 053 §16 dan 007, ini adalah satu-satunya tabel transaksional yang diizinkan menggunakan JSONB untuk `payload_before`/`payload_after`/`metadata`, karena perannya murni sebagai snapshot historis read-only (write-once, append-only) — bukan data yang di-query secara relasional untuk operasi bisnis. Database user `app_read_write_user` hanya memiliki `INSERT` dan `SELECT` pada tabel ini (lihat 020 §10.5); tidak ada `UPDATE`/`DELETE` privilege.

---

## 17. DOMAIN: CONFIGURATION & AI

```sql
CREATE TABLE sla_configurations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id                 UUID NOT NULL UNIQUE REFERENCES approval_workflow_stages(id) ON DELETE CASCADE,
  sla_working_days         INTEGER NOT NULL CHECK (sla_working_days >= 1),
  is_enforcement_active    BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sla_reminder_configurations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_configuration_id     UUID NOT NULL REFERENCES sla_configurations(id) ON DELETE CASCADE,
  reminder_days_before     INTEGER NOT NULL CHECK (reminder_days_before >= 0),
  escalation_role_id       UUID REFERENCES roles(id) ON DELETE SET NULL
);

CREATE TABLE upload_policy_configurations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id    UUID NOT NULL UNIQUE REFERENCES document_type_definitions(id) ON DELETE CASCADE,
  max_size_mb         INTEGER NOT NULL CHECK (max_size_mb > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE upload_policy_mime_types (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_policy_configuration_id      UUID NOT NULL REFERENCES upload_policy_configurations(id) ON DELETE CASCADE,
  mime_type                           VARCHAR(150) NOT NULL,
  CONSTRAINT uq_upload_policy_mime UNIQUE (upload_policy_configuration_id, mime_type)
);

CREATE TABLE integration_configurations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key               VARCHAR(100) NOT NULL UNIQUE,
  value_encrypted   TEXT NOT NULL,
  is_secret         BOOLEAN NOT NULL DEFAULT false,
  updated_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_request_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  feature_code    VARCHAR(50) NOT NULL CHECK (feature_code IN (
                    'tender_summary', 'prospect_analysis', 'competitor_analysis',
                    'kpi_insight', 'executive_summary', 'smart_search'
                  )),
  resource_type   VARCHAR(50),
  resource_id     UUID,
  provider        VARCHAR(50) NOT NULL,
  model           VARCHAR(100) NOT NULL,
  status          VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'rate_limited')),
  latency_ms      INTEGER,
  error_code      VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 18. DATABASE USER PRIVILEGE SEPARATION

Sesuai Inferred Requirement IR-020-02 (020 §12), berikut DDL pembuatan database role dengan privilege terbatas:

```sql
-- User aplikasi utama: read/write tabel bisnis, INSERT+SELECT only pada audit_logs
CREATE ROLE app_read_write_user WITH LOGIN PASSWORD '__SET_VIA_SECRET_MANAGER__';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_read_write_user;
REVOKE UPDATE, DELETE ON audit_logs FROM app_read_write_user;
GRANT SELECT, INSERT ON audit_logs TO app_read_write_user;

-- User reporting: read-only, untuk query laporan/dashboard analitik berat
CREATE ROLE app_readonly_user WITH LOGIN PASSWORD '__SET_VIA_SECRET_MANAGER__';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly_user;

-- User migration: DDL privilege, hanya dipakai saat deployment
CREATE ROLE app_migration_user WITH LOGIN PASSWORD '__SET_VIA_SECRET_MANAGER__' CREATEDB;
GRANT ALL PRIVILEGES ON SCHEMA public TO app_migration_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_migration_user;

-- Tidak ada role yang diberikan SUPERUSER di environment production (lihat 059 §9.3, IR-020-02)
```

---

## 19. CATATAN PORTABILITAS MYSQL (Fallback)

Jika tim infrastruktur memilih MySQL alih-alih PostgreSQL (lihat IR-020-01 di 020 §12), penyesuaian berikut wajib diterapkan:

| Konstruksi PostgreSQL | Equivalent MySQL 8.0+ |
|---|---|
| `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `CHAR(36) PRIMARY KEY DEFAULT (UUID())` atau generate UUID di application layer |
| `TIMESTAMPTZ` | `TIMESTAMP` (MySQL menyimpan dalam UTC internal jika `time_zone` dikonfigurasi konsisten) |
| `JSONB` | `JSON` (MySQL tidak memiliki tipe binary JSON terpisah, namun mendukung index pada generated column dari JSON) |
| `CHECK` constraint | Didukung penuh sejak MySQL 8.0.16; versi lebih lama memerlukan enforcement di application/trigger layer |
| `INET` (tipe IP address) | `VARCHAR(45)` (mendukung IPv4 dan IPv6 sebagai string) |
| Row-Level Security (native) | **Tidak didukung** — wajib fallback ke ScopeBuilder pattern di service layer (lihat 020 §9.2, IR-020-01) |

---

## 20. RINGKASAN JUMLAH TABEL

| Domain | Jumlah Tabel |
|---|---|
| Organization & Access | 11 |
| Master Data | 13 |
| Prospect Management | 5 |
| Project Core | 2 |
| RKS Module | 3 |
| LPHS/SIOS Module | 4 |
| Harga & Kompetitor | 2 |
| Pemenang & Delivery | 2 |
| Approval & Workflow Engine | 4 |
| Document Management | 1 |
| Target & KPI | 4 |
| Notification | 3 |
| Audit | 1 |
| Configuration & AI | 6 |
| **TOTAL** | **61 tabel** |

Konsisten dengan jumlah entitas pada 053 §19.
