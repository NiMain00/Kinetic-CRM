# ANALISIS GAP — Kinetic CRM

## Ringkasan

| Kategori | Jumlah |
|---|---|
| Entity Match (Frontend = Docs) | 18 |
| Entity Conflict (Frontend override Docs) | 10 |
| Entity Only in Frontend (added as new tables) | 12 |
| Entity Only in Docs (added as new tables) | 6 |
| **Total Entity di Prisma Schema Final** | **46 models** |

## Detail Gap per Entity

### Entity Match (18)
Customer, Industry, ProjectCategory, ProjectStatusDefinition, Competitor, QuestionType, Question, QuestionOption, Period, Holiday, LossReason, DocumentType, User, Role, Permission, RolePermission, SlaConfiguration, NotificationTemplate

### Entity Conflict — Frontend Wins (10)
1. **OrgUnit** — Docs punya 4 tabel (COMPANY, DIVISION, BRANCH, DEPT), Frontend punya 1 tabel (`OrgUnit` dengan `unitType`). → **Pakai Frontend**
2. **Prospect** — Docs pakai enum `prospecting|waiting_pm_approval|revision|approved`, Frontend pakai `Non Potensial|Potensial|Waiting Supervisor|Revision|Approved`. → **Pakai Frontend**
3. **ProspectReviewQuestion/Note** — Docs punya tabel khusus, Frontend tidak punya. → **Tambahkan dari Docs**
4. **Project nested fields** — Docs normalisasi ke tabel terpisah (RKS, LPHS, PRICE_SUBMISSION, PROJECT_COMPETITOR, TENDER_RESULT, DELIVERY_TARGET). → **Pakai Docs normalization**
5. **ApprovalChain/Level** — Frontend punya chain approval, Docs tidak. → **Tambahkan dari Frontend**
6. **WorkflowStage** — Frontend tambah `sequence`, `ownerDepartmentCode`, `prevDepartmentCode`. → **Pakai Frontend fields**
7. **KPI** — Docs normalisasi ke 4 tabel (KPI_DEFINITION, KPI_WEIGHT, TARGET, TARGET_PROGRESS_SNAPSHOT), Frontend hanya `KpiTarget` sederhana. → **Pakai Docs normalization**
8. **UserRole** — Docs pakai `POSITION/USER_POSITION`, Frontend pakai `UserRole` dengan `scopeType`. → **Pakai Frontend + tambah Position dari Docs**
9. **RolePermission** — Frontend tambah `scopeType`, `scopeId`, `stageId`, `accessLevel`. → **Pakai Frontend fields**
10. **Document** — Frontend embedded `DocGroup[]`, Docs normalisasi ke tabel `DOCUMENT`. → **Pakai Docs normalization**

### Entity Only in Frontend — Added (12)
Supplier, SupplierEvaluation, Rfq, RfqItem, RfqSupplier, RfqQuote, RfqQuoteItem, Procurement, ProcurementItem, ProcurementAllocation, Task, ChatMessage, ChatMessageReadReceipt, MasterItem, DealLineItem, ProjectRequirementItem, EntityRelation, InputConfigGroup, InputConfigOption, Connector, ApprovalChain, ApprovalChainLevel, ApprovalRequest, ApprovalRequestLevel, ProspectTimelineEvent

### Entity Only in Docs — Added (6)
ActiveSession, Position, UserPosition, BackupApproverDelegation, IntegrationConfiguration, AiRequestLog, UploadPolicyConfiguration, UploadPolicyMimeType, ApprovalReassignment, NotificationTemplateRecipient, LphsTargetedRevision, LphsTargetedRevisionDepartment

### Entity Removed/Consolidated
- `user_positions` → di-merge ke `UserRole` (frontend pattern menang)
- `approval_level_definitions` → di-merge ke `ApprovalChainLevel`
- `question_type_options` → tidak perlu, QuestionType sudah punya `hasOptions`, Question pakai `QuestionOption`
- `project_categories` → Frontend punya fields lebih kaya → konsolidasi

## Konflik PostgreSQL → MySQL 8
Semua tipe PostgreSQL di DDL (054) sudah dikonversi:
- `TIMESTAMPTZ` → `DateTime` (Prisma) → `DATETIME(3)` (MySQL)
- `JSONB` → dihilangkan; data yang sebelumnya JSONB dipetakan ke `String?` (JSON sebagai text) atau ke tabel relasional terpisah
- `INET` → `String @db.VarChar(45)`
- `BOOLEAN` → `Boolean` (Prisma) → `TINYINT(1)` (MySQL)
- `DECIMAL` → `Float` (Prisma) dengan `@db.Decimal(p,s)` (MySQL)
- `UUID` → `String @id @default(uuid())` (Prisma handle UUID generation)
- `SERIAL` → `Int @default(autoincrement())` (tidak dipakai, semua pakai UUID)
