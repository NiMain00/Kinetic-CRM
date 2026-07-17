-- Prisma migrations table (required by Prisma)
CREATE TABLE IF NOT EXISTS public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);

ALTER TABLE public._prisma_migrations OWNER TO postgres;

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d39d0659-9093-4b17-abb5-a3b921f93932', '80eaf45c686868851c8bf6b1319e06b1246589c04bb2b5556f793eacbd7c567b', '2026-07-17 01:09:50.940714+00', '20260717010947_init', NULL, NULL, '2026-07-17 01:09:47.89634+00', 1);

-- CreateEnum
CREATE TYPE "OrgUnitType" AS ENUM ('company', 'division', 'branch', 'department');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('swasta', 'bumn', 'pemerintah', 'asing');

-- CreateEnum
CREATE TYPE "CustomerLevel" AS ENUM ('hot', 'medium', 'low');

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('lead', 'non_potensial', 'potensial', 'waiting_supervisor', 'revision', 'approved');

-- CreateEnum
CREATE TYPE "ProspectCustomerType" AS ENUM ('existing', 'new');

-- CreateEnum
CREATE TYPE "RksStatus" AS ENUM ('draft', 'waiting_pm_approval', 'revision', 'approved');

-- CreateEnum
CREATE TYPE "LphsStatus" AS ENUM ('draft', 'lphs_sios', 'approved');

-- CreateEnum
CREATE TYPE "LphsApprovalStatus" AS ENUM ('reviewing', 'pending_pm', 'approved', 'revision_requested');

-- CreateEnum
CREATE TYPE "TenderResultEnum" AS ENUM ('won', 'lost');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'delayed');

-- CreateEnum
CREATE TYPE "ApprovalResourceType" AS ENUM ('prospect', 'rks', 'lphs_sios');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "ApprovalScopeType" AS ENUM ('global', 'department', 'project');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('read', 'write');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('approval', 'revision', 'status_change', 'assignment', 'system');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('success', 'denied', 'error');

-- CreateEnum
CREATE TYPE "AiRequestStatus" AS ENUM ('success', 'failed', 'rate_limited');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'review', 'done');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('draft', 'purchase_request', 'vendor_selection', 'po_process', 'Delivery', 'Progress', 'Closed', 'Cancelled');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('active', 'inactive', 'blacklisted');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('manufacturer', 'distributor', 'agent', 'contractor', 'consultant');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('draft', 'sent', 'evaluating', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "RfqQuoteStatus" AS ENUM ('pending', 'evaluated', 'selected', 'rejected');

-- CreateEnum
CREATE TYPE "ProcurementItemStatus" AS ENUM ('pending', 'ordered', 'partial', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "ProcurementStatusEnum" AS ENUM ('none', 'partial', 'fully_submitted', 'received');

-- CreateEnum
CREATE TYPE "MasterItemType" AS ENUM ('barang', 'jasa');

-- CreateEnum
CREATE TYPE "QuestionContext" AS ENUM ('prospect', 'rks', 'both');

-- CreateEnum
CREATE TYPE "QuestionTypeCode" AS ENUM ('text', 'textarea', 'radio', 'checkbox', 'select', 'number', 'date');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('monthly', 'quarterly', 'semester', 'annual');

-- CreateEnum
CREATE TYPE "KpiUnit" AS ENUM ('currency', 'percentage', 'count');

-- CreateEnum
CREATE TYPE "TrafficLight" AS ENUM ('red', 'yellow', 'green');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('branch', 'division', 'company');

-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('API', 'Webhook', 'Email', 'Database', 'cloud_storage', 'LDAP');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('connected', 'disconnected', 'error');

-- CreateEnum
CREATE TYPE "InputConfigCategory" AS ENUM ('form', 'filter', 'sla', 'workflow', 'other');

-- CreateEnum
CREATE TYPE "LossReasonCategory" AS ENUM ('harga', 'teknis', 'administrasi', 'lainnya');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('national', 'regional');

-- CreateEnum
CREATE TYPE "DocumentResourceType" AS ENUM ('prospect', 'rks', 'lphs_sios', 'harga', 'pemenang', 'project_misc');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('text', 'file', 'image');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "org_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parent_id" TEXT,
    "unit_type" "OrgUnitType" NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "address" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "org_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "org_unit_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_jti" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "scope_type" "ApprovalScopeType",
    "scope_id" TEXT,
    "stage_id" TEXT,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'write',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "scope_type" "ApprovalScopeType" NOT NULL,
    "scope_id" TEXT,
    "assigned_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "sequence" DOUBLE PRECISION NOT NULL,
    "owner_department_code" TEXT NOT NULL,
    "prev_department_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" TEXT,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stage_departments" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "department_code" TEXT NOT NULL,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'read',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_stage_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_departments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "city" TEXT NOT NULL,
    "npwp" TEXT,
    "pic_name" TEXT,
    "pic_position" TEXT,
    "pic_phone" TEXT,
    "pic_email" TEXT,
    "address" TEXT,
    "province" TEXT,
    "industry_id" TEXT,
    "provider_existing" TEXT,
    "is_new" BOOLEAN DEFAULT false,
    "needs_verification" BOOLEAN DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "level" "CustomerLevel",
    "requirements" TEXT,
    "unit_level" TEXT,
    "canonical_name" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "requires_lphs" BOOLEAN NOT NULL DEFAULT true,
    "requires_rks" BOOLEAN NOT NULL DEFAULT true,
    "default_workflow_type" TEXT NOT NULL DEFAULT 'tender',
    "color_hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_status_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color_hex" TEXT NOT NULL,
    "text_color_hex" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_terminal" BOOLEAN NOT NULL DEFAULT false,
    "applicable_to" TEXT NOT NULL DEFAULT 'both',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_status_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "min_price" DECIMAL(65,30),
    "max_price" DECIMAL(65,30),
    "industry_id" TEXT,
    "bidang_usaha" TEXT,
    "website" TEXT,
    "advantages" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" "QuestionTypeCode" NOT NULL,
    "description" TEXT,
    "has_options" BOOLEAN NOT NULL DEFAULT false,
    "validation_config" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type_id" TEXT NOT NULL,
    "context" "QuestionContext" NOT NULL,
    "category" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "placeholder_text" TEXT,
    "help_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "HolidayType" NOT NULL,
    "year" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_reasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "LossReasonCategory" NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "allowed_extensions" TEXT,
    "max_size_mb" INTEGER,
    "is_required_at_stage" TEXT,
    "applicable_to" TEXT NOT NULL DEFAULT 'both',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_type" "ProspectCustomerType",
    "status" "ProspectStatus" NOT NULL DEFAULT 'lead',
    "prospect_type" TEXT,
    "potensi_unit" INTEGER NOT NULL DEFAULT 0,
    "estimated_value" DECIMAL(65,30),
    "description" TEXT,
    "branch" TEXT,
    "branch_id" TEXT,
    "category_id" TEXT,
    "industry_id" TEXT,
    "provider_existing" TEXT,
    "project_type" TEXT,
    "is_converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_to_project_id" TEXT,
    "created_by_user_id" TEXT,
    "department_id" TEXT,
    "current_stage_id" TEXT,
    "owner_user_id" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_answers" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT,
    "answer_option_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_answer_options" (
    "id" TEXT NOT NULL,
    "prospect_answer_id" TEXT NOT NULL,
    "question_option_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_answer_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_review_questions" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "review_round" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "created_by" TEXT NOT NULL,
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_review_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_review_notes" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "review_round" INTEGER NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_review_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_timeline_events" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "role" TEXT,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "prev_val" TEXT,
    "new_val" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "visit_number" INTEGER NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'pending',
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "pic_name" TEXT,
    "pic_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prospect_id" TEXT,
    "customer_id" TEXT,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'pending',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "deadline" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_up_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "phase" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimated_value" DECIMAL(65,30),
    "deadline_tender" TIMESTAMP(3),
    "source_prospect_id" TEXT,
    "source_prospect_id_active" TEXT,
    "customer_id" TEXT,
    "provider_existing" TEXT,
    "branch" TEXT,
    "branch_id" TEXT,
    "department_id" TEXT,
    "category_id" TEXT,
    "status_id" TEXT,
    "current_stage_id" TEXT,
    "created_by_user_id" TEXT,
    "owner_user_id" TEXT,
    "scope_departments" TEXT,
    "author" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_timeline_events" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "role" TEXT,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "prev_val" TEXT,
    "new_val" TEXT,
    "file_name" TEXT,
    "file_size" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "nomor_tender" TEXT,
    "nama_tender" TEXT,
    "deadline_tender" TIMESTAMP(3),
    "aanwijzing" TEXT,
    "work_location" TEXT,
    "main_scope" TEXT,
    "additional_notes" TEXT,
    "answers" JSONB,
    "status" "RksStatus" NOT NULL DEFAULT 'draft',
    "revision_number" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rks_review_questions" (
    "id" TEXT NOT NULL,
    "rks_id" TEXT NOT NULL,
    "review_round" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "created_by" TEXT NOT NULL,
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rks_review_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rks_review_notes" (
    "id" TEXT NOT NULL,
    "rks_id" TEXT NOT NULL,
    "review_round" INTEGER NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rks_review_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lphs_sios" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "LphsStatus" NOT NULL DEFAULT 'draft',
    "lphs_file_name" TEXT,
    "lphs_file_size" TEXT,
    "lphs_external_url" TEXT,
    "sios_file_name" TEXT,
    "sios_file_size" TEXT,
    "selected_departments" TEXT,
    "departments_locked" BOOLEAN NOT NULL DEFAULT false,
    "pm_approval_status" "LphsApprovalStatus" NOT NULL DEFAULT 'reviewing',
    "pm_approved_at" TIMESTAMP(3),
    "pm_approved_by" TEXT,
    "mgmt_approval_status" "LphsApprovalStatus" NOT NULL DEFAULT 'reviewing',
    "mgmt_approved_at" TIMESTAMP(3),
    "mgmt_approved_by" TEXT,
    "final_approval_status" "LphsApprovalStatus" NOT NULL DEFAULT 'pending_pm',
    "final_approved_at" TIMESTAMP(3),
    "final_approved_by" TEXT,
    "overall_status" TEXT NOT NULL DEFAULT 'draft',
    "revision_number" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lphs_sios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lphs_department_reviews" (
    "id" TEXT NOT NULL,
    "lphs_sios_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "approval_status" "LphsApprovalStatus" NOT NULL DEFAULT 'reviewing',
    "comment" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lphs_department_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lphs_targeted_revisions" (
    "id" TEXT NOT NULL,
    "lphs_sios_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "initiated_by" TEXT NOT NULL,
    "initiated_role" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lphs_targeted_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lphs_targeted_revision_departments" (
    "id" TEXT NOT NULL,
    "lphs_targeted_revision_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lphs_targeted_revision_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_submissions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "our_price" DECIMAL(65,30) NOT NULL,
    "margin_percentage" DECIMAL(65,30),
    "note" TEXT,
    "reference_link" TEXT,
    "reference_url" TEXT,
    "bottom_price" DECIMAL(65,30),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_competitors" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "competitor_price" DECIMAL(65,30),
    "advantage_note" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_results" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "result" "TenderResultEnum" NOT NULL,
    "contract_value" DECIMAL(65,30),
    "loss_reason_id" TEXT,
    "loss_reason_note" TEXT,
    "spk_document" TEXT,
    "start_date" TIMESTAMP(3),
    "duration_days" INTEGER,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_targets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "note" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'scheduled',
    "pic_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_configurations" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "warning_threshold" INTEGER NOT NULL,
    "critical_threshold" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "escalation_role" TEXT NOT NULL,
    "sla_working_days" INTEGER,
    "is_enforcement_active" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_reminder_configurations" (
    "id" TEXT NOT NULL,
    "sla_configuration_id" TEXT NOT NULL,
    "reminder_days_before" INTEGER NOT NULL,
    "escalation_role_id" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sla_reminder_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "resource_type" "ApprovalResourceType" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "stage_id" TEXT,
    "assigned_to_user_id" TEXT,
    "assigned_to_role_id" TEXT,
    "assigned_to_department_id" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "decision_comment" TEXT,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "sla_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_reassignments" (
    "id" TEXT NOT NULL,
    "approval_id" TEXT NOT NULL,
    "previous_assignee_user_id" TEXT,
    "new_assignee_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reassigned_by" TEXT NOT NULL,
    "reassigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_reassignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_chains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_chain_levels" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "order_level" INTEGER NOT NULL,
    "min_amount" DECIMAL(65,30),
    "max_amount" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_chain_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_code" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "current_level" INTEGER NOT NULL DEFAULT 0,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "created_by" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_request_levels" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "level_name" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approver" TEXT,
    "note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_request_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_approver_delegations" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "primary_user_id" TEXT NOT NULL,
    "backup_user_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_approver_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "resource_type" "DocumentResourceType" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "department_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_size" TEXT,
    "file_size_bytes" INTEGER,
    "mime_type" TEXT,
    "storage_path" TEXT,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "is_latest_version" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula_description" TEXT NOT NULL,
    "unit" "KpiUnit" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_weights" (
    "id" TEXT NOT NULL,
    "kpi_definition_id" TEXT NOT NULL,
    "weight_percentage" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_until" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "kpi_definition_id" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "scope_type" "ScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "target_value" DECIMAL(65,30) NOT NULL,
    "actual_value" DECIMAL(65,30),
    "unit" TEXT,
    "description" TEXT,
    "status" TEXT,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "is_current_version" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_progress_snapshots" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "actual_value" DECIMAL(65,30) NOT NULL,
    "percentage_achieved" DECIMAL(65,30) NOT NULL,
    "traffic_light_status" "TrafficLight" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "target_progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "event_name" TEXT,
    "template_inapp" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "recipient_roles" TEXT,
    "available_variables" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template_recipients" (
    "id" TEXT NOT NULL,
    "notification_template_id" TEXT NOT NULL,
    "recipient_role_id" TEXT,
    "recipient_department_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_template_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "notification_template_id" TEXT,
    "recipient_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "resource_type" TEXT,
    "resource_id" TEXT,
    "entity_id" TEXT,
    "entity_type" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "actor_initials" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "entity_name" TEXT,
    "summary" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "payload_before" TEXT,
    "payload_after" TEXT,
    "metadata" TEXT,
    "impact" TEXT DEFAULT 'Low',
    "result" "AuditResult" NOT NULL DEFAULT 'success',
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_config" (
    "id" TEXT NOT NULL,
    "max_file_size_mb" INTEGER NOT NULL DEFAULT 10,
    "allowed_extensions" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "max_files_per_upload" INTEGER NOT NULL DEFAULT 5,
    "enable_compression" BOOLEAN NOT NULL DEFAULT true,
    "allowed_mime_types" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_policy_configurations" (
    "id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "max_size_mb" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_policy_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_policy_mime_types" (
    "id" TEXT NOT NULL,
    "upload_policy_configuration_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_policy_mime_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConnectorType" NOT NULL,
    "description" TEXT,
    "status" "ConnectorStatus" NOT NULL DEFAULT 'disconnected',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_tested" TEXT,
    "config_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configurations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value_encrypted" TEXT NOT NULL,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_targets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "target_value" DOUBLE PRECISION NOT NULL,
    "actual_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phases" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "assignee_role" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "warning_threshold" INTEGER NOT NULL,
    "critical_threshold" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "escalation_role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_request_logs" (
    "id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "feature_code" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AiRequestStatus" NOT NULL,
    "latency_ms" INTEGER,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "input_config_groups" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "InputConfigCategory" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "input_config_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "input_config_options" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color_hex" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "input_config_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "source_project_id" TEXT,
    "client" TEXT NOT NULL,
    "contract_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "location" TEXT,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'draft',
    "phase" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "pr_number" TEXT,
    "pr_date" TIMESTAMP(3),
    "pr_notes" TEXT,
    "selected_vendor" TEXT,
    "vendor_pic" TEXT,
    "vendor_contact" TEXT,
    "po_number" TEXT,
    "po_date" TIMESTAMP(3),
    "po_value" DECIMAL(65,30),
    "po_notes" TEXT,
    "target_start_date" TIMESTAMP(3),
    "target_end_date" TIMESTAMP(3),
    "unit_ready_date" TIMESTAMP(3),
    "unit_shipped_date" TIMESTAMP(3),
    "unit_received_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "delivery_note" TEXT,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivered_at" TIMESTAMP(3),
    "delivered_by" TEXT,
    "progress_notes" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "closed_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "pic_name" TEXT,
    "pic_position" TEXT,
    "npwp" TEXT,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_projects" INTEGER NOT NULL DEFAULT 0,
    "total_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "on_time_delivery" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quality_score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "compliance_score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "SupplierStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "categories" TEXT,
    "certificates" TEXT,
    "blacklist_reason" TEXT,
    "blacklisted_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_evaluations" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "project_id" TEXT,
    "project_name" TEXT,
    "evaluator" TEXT,
    "evaluator_id" TEXT,
    "date" TIMESTAMP(3),
    "quality" INTEGER NOT NULL DEFAULT 0,
    "delivery" INTEGER NOT NULL DEFAULT 0,
    "pricing" INTEGER NOT NULL DEFAULT 0,
    "compliance" INTEGER NOT NULL DEFAULT 0,
    "communication" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "overall" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "procurement_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "RfqStatus" NOT NULL DEFAULT 'draft',
    "selected_quote_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "specifications" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_suppliers" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_quotes" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "delivery_time" TEXT,
    "validity_period" TEXT,
    "terms" TEXT,
    "status" "RfqQuoteStatus" NOT NULL DEFAULT 'pending',
    "evaluator_notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_quote_items" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "delivery_time" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MasterItemType" NOT NULL,
    "unit" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "base_price" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "master_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_line_items" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "master_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "base_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "project_requirement_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_requirement_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "master_item_id" TEXT NOT NULL,
    "quantity_required" INTEGER NOT NULL DEFAULT 0,
    "quantity_used" INTEGER NOT NULL DEFAULT 0,
    "quantity_procured" INTEGER NOT NULL DEFAULT 0,
    "source_deal_line_id" TEXT,
    "procurement_status" "ProcurementStatusEnum" NOT NULL DEFAULT 'none',
    "base_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_requirement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_items" (
    "id" TEXT NOT NULL,
    "procurement_id" TEXT NOT NULL,
    "master_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "ProcurementItemStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_allocations" (
    "id" TEXT NOT NULL,
    "procurement_item_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "project_requirement_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "due_date" TIMESTAMP(3),
    "parent_id" TEXT,
    "task_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_role" TEXT,
    "content" TEXT NOT NULL,
    "message_type" "ChatMessageType" NOT NULL DEFAULT 'text',
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mentions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_read_receipts" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relations" (
    "id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_units_code_key" ON "org_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "active_sessions_token_jti_key" ON "active_sessions"("token_jti");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_scope_type_scope_id_key" ON "role_permissions"("role_id", "permission_id", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_code_key" ON "workflow_stages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stage_departments_stage_id_department_code_key" ON "workflow_stage_departments"("stage_id", "department_code");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_departments_project_id_department_id_key" ON "project_departments"("project_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_name_key" ON "customers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "industries_code_key" ON "industries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_name_key" ON "project_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_code_key" ON "project_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_status_definitions_code_key" ON "project_status_definitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_name_key" ON "competitors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "question_types_code_key" ON "question_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "periods_code_key" ON "periods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_type_key" ON "holidays"("date", "type");

-- CreateIndex
CREATE UNIQUE INDEX "loss_reasons_code_key" ON "loss_reasons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_code_key" ON "document_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "prospects_converted_to_project_id_key" ON "prospects"("converted_to_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "prospect_answers_prospect_id_question_id_key" ON "prospect_answers"("prospect_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "prospect_answer_options_prospect_answer_id_question_option__key" ON "prospect_answer_options"("prospect_answer_id", "question_option_id");

-- CreateIndex
CREATE INDEX "visits_prospect_id_idx" ON "visits"("prospect_id");

-- CreateIndex
CREATE INDEX "visits_customer_id_idx" ON "visits"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "visits_prospect_id_visit_number_key" ON "visits"("prospect_id", "visit_number");

-- CreateIndex
CREATE INDEX "follow_up_tasks_prospect_id_idx" ON "follow_up_tasks"("prospect_id");

-- CreateIndex
CREATE INDEX "follow_up_tasks_to_user_id_idx" ON "follow_up_tasks"("to_user_id");

-- CreateIndex
CREATE INDEX "follow_up_tasks_status_idx" ON "follow_up_tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_type_idx" ON "projects"("type");

-- CreateIndex
CREATE INDEX "projects_created_by_user_id_idx" ON "projects"("created_by_user_id");

-- CreateIndex
CREATE INDEX "projects_source_prospect_id_idx" ON "projects"("source_prospect_id");

-- CreateIndex
CREATE UNIQUE INDEX "rks_project_id_key" ON "rks"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "lphs_sios_project_id_key" ON "lphs_sios"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "lphs_department_reviews_lphs_sios_id_department_id_key" ON "lphs_department_reviews"("lphs_sios_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "lphs_targeted_revision_departments_lphs_targeted_revision_i_key" ON "lphs_targeted_revision_departments"("lphs_targeted_revision_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_submissions_project_id_key" ON "price_submissions"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_competitors_project_id_competitor_id_key" ON "project_competitors"("project_id", "competitor_id");

-- CreateIndex
CREATE UNIQUE INDEX "tender_results_project_id_key" ON "tender_results"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_targets_project_id_key" ON "delivery_targets"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "sla_configurations_stage_id_key" ON "sla_configurations"("stage_id");

-- CreateIndex
CREATE INDEX "approvals_resource_type_resource_id_idx" ON "approvals"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "documents_resource_type_resource_id_idx" ON "documents"("resource_type", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_definitions_code_key" ON "kpi_definitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "target_progress_snapshots_target_id_snapshot_date_key" ON "target_progress_snapshots"("target_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_code_key" ON "notification_templates"("event_code");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_read_idx" ON "notifications"("recipient_user_id", "read");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "upload_policy_configurations_document_type_id_key" ON "upload_policy_configurations"("document_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "upload_policy_mime_types_upload_policy_configuration_id_mim_key" ON "upload_policy_mime_types"("upload_policy_configuration_id", "mime_type");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configurations_key_key" ON "integration_configurations"("key");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_entity_type_key" ON "sla_policies"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "input_config_groups_key_key" ON "input_config_groups"("key");

-- CreateIndex
CREATE UNIQUE INDEX "input_config_options_group_id_value_key" ON "input_config_options"("group_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "procurements_code_key" ON "procurements"("code");

-- CreateIndex
CREATE INDEX "procurements_status_idx" ON "procurements"("status");

-- CreateIndex
CREATE INDEX "procurements_source_project_id_idx" ON "procurements"("source_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_number_key" ON "rfqs"("number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_suppliers_rfq_id_supplier_id_key" ON "rfq_suppliers"("rfq_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_items_sku_key" ON "master_items"("sku");

-- CreateIndex
CREATE INDEX "deal_line_items_deal_id_idx" ON "deal_line_items"("deal_id");

-- CreateIndex
CREATE INDEX "project_requirement_items_project_id_idx" ON "project_requirement_items"("project_id");

-- CreateIndex
CREATE INDEX "procurement_items_procurement_id_idx" ON "procurement_items"("procurement_id");

-- CreateIndex
CREATE UNIQUE INDEX "procurement_allocations_procurement_item_id_project_require_key" ON "procurement_allocations"("procurement_item_id", "project_requirement_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "chat_messages_project_id_created_at_idx" ON "chat_messages"("project_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_message_read_receipts_message_id_user_id_key" ON "chat_message_read_receipts"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "entity_relations_source_type_source_id_idx" ON "entity_relations"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "entity_relations_target_type_target_id_idx" ON "entity_relations"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relations_source_type_source_id_target_type_target_i_key" ON "entity_relations"("source_type", "source_id", "target_type", "target_id", "relation_type");

-- AddForeignKey
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stage_departments" ADD CONSTRAINT "workflow_stage_departments_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_departments" ADD CONSTRAINT "project_departments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "question_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_converted_to_project_id_fkey" FOREIGN KEY ("converted_to_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_answers" ADD CONSTRAINT "prospect_answers_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_answers" ADD CONSTRAINT "prospect_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_answers" ADD CONSTRAINT "prospect_answers_answer_option_id_fkey" FOREIGN KEY ("answer_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_answer_options" ADD CONSTRAINT "prospect_answer_options_prospect_answer_id_fkey" FOREIGN KEY ("prospect_answer_id") REFERENCES "prospect_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_answer_options" ADD CONSTRAINT "prospect_answer_options_question_option_id_fkey" FOREIGN KEY ("question_option_id") REFERENCES "question_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_review_questions" ADD CONSTRAINT "prospect_review_questions_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_review_questions" ADD CONSTRAINT "prospect_review_questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_review_notes" ADD CONSTRAINT "prospect_review_notes_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_review_notes" ADD CONSTRAINT "prospect_review_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_timeline_events" ADD CONSTRAINT "prospect_timeline_events_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_pic_user_id_fkey" FOREIGN KEY ("pic_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_source_prospect_id_fkey" FOREIGN KEY ("source_prospect_id") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "project_status_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_timeline_events" ADD CONSTRAINT "project_timeline_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_timeline_events" ADD CONSTRAINT "project_timeline_events_actor_fkey" FOREIGN KEY ("actor") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rks" ADD CONSTRAINT "rks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rks_review_questions" ADD CONSTRAINT "rks_review_questions_rks_id_fkey" FOREIGN KEY ("rks_id") REFERENCES "rks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rks_review_questions" ADD CONSTRAINT "rks_review_questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rks_review_notes" ADD CONSTRAINT "rks_review_notes_rks_id_fkey" FOREIGN KEY ("rks_id") REFERENCES "rks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rks_review_notes" ADD CONSTRAINT "rks_review_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_sios" ADD CONSTRAINT "lphs_sios_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_sios" ADD CONSTRAINT "lphs_sios_pm_approved_by_fkey" FOREIGN KEY ("pm_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_sios" ADD CONSTRAINT "lphs_sios_mgmt_approved_by_fkey" FOREIGN KEY ("mgmt_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_sios" ADD CONSTRAINT "lphs_sios_final_approved_by_fkey" FOREIGN KEY ("final_approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_department_reviews" ADD CONSTRAINT "lphs_department_reviews_lphs_sios_id_fkey" FOREIGN KEY ("lphs_sios_id") REFERENCES "lphs_sios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_department_reviews" ADD CONSTRAINT "lphs_department_reviews_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "org_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_department_reviews" ADD CONSTRAINT "lphs_department_reviews_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_targeted_revisions" ADD CONSTRAINT "lphs_targeted_revisions_lphs_sios_id_fkey" FOREIGN KEY ("lphs_sios_id") REFERENCES "lphs_sios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_targeted_revisions" ADD CONSTRAINT "lphs_targeted_revisions_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_targeted_revision_departments" ADD CONSTRAINT "lphs_targeted_revision_departments_lphs_targeted_revision__fkey" FOREIGN KEY ("lphs_targeted_revision_id") REFERENCES "lphs_targeted_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lphs_targeted_revision_departments" ADD CONSTRAINT "lphs_targeted_revision_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "org_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_submissions" ADD CONSTRAINT "price_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_submissions" ADD CONSTRAINT "price_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_competitors" ADD CONSTRAINT "project_competitors_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_results" ADD CONSTRAINT "tender_results_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_results" ADD CONSTRAINT "tender_results_loss_reason_id_fkey" FOREIGN KEY ("loss_reason_id") REFERENCES "loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_results" ADD CONSTRAINT "tender_results_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_targets" ADD CONSTRAINT "delivery_targets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_configurations" ADD CONSTRAINT "sla_configurations_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_reminder_configurations" ADD CONSTRAINT "sla_reminder_configurations_sla_configuration_id_fkey" FOREIGN KEY ("sla_configuration_id") REFERENCES "sla_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_reminder_configurations" ADD CONSTRAINT "sla_reminder_configurations_escalation_role_id_fkey" FOREIGN KEY ("escalation_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_reminder_configurations" ADD CONSTRAINT "sla_reminder_configurations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_assigned_to_role_id_fkey" FOREIGN KEY ("assigned_to_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_assigned_to_department_id_fkey" FOREIGN KEY ("assigned_to_department_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_reassignments" ADD CONSTRAINT "approval_reassignments_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_reassignments" ADD CONSTRAINT "approval_reassignments_previous_assignee_user_id_fkey" FOREIGN KEY ("previous_assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_reassignments" ADD CONSTRAINT "approval_reassignments_new_assignee_user_id_fkey" FOREIGN KEY ("new_assignee_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_reassignments" ADD CONSTRAINT "approval_reassignments_reassigned_by_fkey" FOREIGN KEY ("reassigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_chain_levels" ADD CONSTRAINT "approval_chain_levels_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "approval_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "approval_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_request_levels" ADD CONSTRAINT "approval_request_levels_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_approver_delegations" ADD CONSTRAINT "backup_approver_delegations_primary_user_id_fkey" FOREIGN KEY ("primary_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_approver_delegations" ADD CONSTRAINT "backup_approver_delegations_backup_user_id_fkey" FOREIGN KEY ("backup_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_approver_delegations" ADD CONSTRAINT "backup_approver_delegations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_weights" ADD CONSTRAINT "kpi_weights_kpi_definition_id_fkey" FOREIGN KEY ("kpi_definition_id") REFERENCES "kpi_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_weights" ADD CONSTRAINT "kpi_weights_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_kpi_definition_id_fkey" FOREIGN KEY ("kpi_definition_id") REFERENCES "kpi_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_progress_snapshots" ADD CONSTRAINT "target_progress_snapshots_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template_recipients" ADD CONSTRAINT "notification_template_recipients_notification_template_id_fkey" FOREIGN KEY ("notification_template_id") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template_recipients" ADD CONSTRAINT "notification_template_recipients_recipient_role_id_fkey" FOREIGN KEY ("recipient_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template_recipients" ADD CONSTRAINT "notification_template_recipients_recipient_department_id_fkey" FOREIGN KEY ("recipient_department_id") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_template_id_fkey" FOREIGN KEY ("notification_template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_policy_configurations" ADD CONSTRAINT "upload_policy_configurations_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_policy_mime_types" ADD CONSTRAINT "upload_policy_mime_types_upload_policy_configuration_id_fkey" FOREIGN KEY ("upload_policy_configuration_id") REFERENCES "upload_policy_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_configurations" ADD CONSTRAINT "integration_configurations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_config_options" ADD CONSTRAINT "input_config_options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "input_config_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_source_project_id_fkey" FOREIGN KEY ("source_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_delivered_by_fkey" FOREIGN KEY ("delivered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "supplier_evaluations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "supplier_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_suppliers" ADD CONSTRAINT "rfq_suppliers_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_suppliers" ADD CONSTRAINT "rfq_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quotes" ADD CONSTRAINT "rfq_quotes_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quotes" ADD CONSTRAINT "rfq_quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quote_items" ADD CONSTRAINT "rfq_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "rfq_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_line_items" ADD CONSTRAINT "deal_line_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_requirement_items" ADD CONSTRAINT "project_requirement_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_requirement_items" ADD CONSTRAINT "project_requirement_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_items" ADD CONSTRAINT "procurement_items_master_item_id_fkey" FOREIGN KEY ("master_item_id") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_allocations" ADD CONSTRAINT "procurement_allocations_procurement_item_id_fkey" FOREIGN KEY ("procurement_item_id") REFERENCES "procurement_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_allocations" ADD CONSTRAINT "procurement_allocations_project_requirement_id_fkey" FOREIGN KEY ("project_requirement_id") REFERENCES "project_requirement_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_read_receipts" ADD CONSTRAINT "chat_message_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Seed data
--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
--



--
-- Data for Name: org_units; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('org-company', 'PT. Kinetic Cerdas Indonesia', 'KINETIC', NULL, 'company', 'Jakarta', 'DKI Jakarta', 'Jl. Sudirman No. 123', NULL, NULL, true, 0, '2026-07-17 01:21:17.118', '2026-07-17 01:21:17.118', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('org-div-ops', 'Divisi Operasional', 'DIV-OPS', 'org-company', 'division', 'Jakarta', NULL, NULL, NULL, NULL, true, 1, '2026-07-17 01:21:17.168', '2026-07-17 01:21:17.168', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('org-div-sales', 'Divisi Sales & Marketing', 'DIV-SALES', 'org-company', 'division', 'Jakarta', NULL, NULL, NULL, NULL, true, 2, '2026-07-17 01:21:17.184', '2026-07-17 01:21:17.184', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('org-branch-jkt', 'Cabang Jakarta Pusat', 'JKT', 'org-div-sales', 'branch', 'Jakarta Pusat', NULL, NULL, NULL, NULL, true, 1, '2026-07-17 01:21:17.197', '2026-07-17 01:21:17.197', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('org-branch-bdg', 'Cabang Bandung', 'BDG', 'org-div-sales', 'branch', 'Bandung', NULL, NULL, NULL, NULL, true, 2, '2026-07-17 01:21:17.213', '2026-07-17 01:21:17.213', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('dept-pm', 'Project Management', 'DEPT-PM', 'org-div-ops', 'department', 'Jakarta', NULL, NULL, NULL, NULL, true, 1, '2026-07-17 01:21:17.236', '2026-07-17 01:21:17.236', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('dept-marketing', 'Marketing', 'DEPT-MKT', 'org-div-sales', 'department', 'Jakarta', NULL, NULL, NULL, NULL, true, 2, '2026-07-17 01:21:17.251', '2026-07-17 01:21:17.251', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('dept-finance', 'Finance', 'DEPT-FIN', 'org-div-ops', 'department', 'Jakarta', NULL, NULL, NULL, NULL, true, 3, '2026-07-17 01:21:17.264', '2026-07-17 01:21:17.264', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('dept-it', 'Information Technology', 'DEPT-IT', 'org-div-ops', 'department', 'Jakarta', NULL, NULL, NULL, NULL, true, 4, '2026-07-17 01:21:17.278', '2026-07-17 01:21:17.278', NULL);
INSERT INTO public.org_units (id, name, code, parent_id, unit_type, city, province, address, description, phone, is_active, sort_order, created_at, updated_at, deleted_at) VALUES ('dept-procurement', 'Procurement', 'DEPT-PROC', 'org-div-ops', 'department', 'Jakarta', NULL, NULL, NULL, NULL, true, 5, '2026-07-17 01:21:17.289', '2026-07-17 01:21:17.289', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.users (id, username, full_name, email, password_hash, phone, avatar_url, status, is_locked, failed_login_count, last_login_at, org_unit_id, created_at, updated_at, deleted_at) VALUES ('user-2', 'bambang', 'Bambang Permadi', 'bambang@kinetic.id', '$2b$10$7/.s7xo2bWZkQIx3/shgSuTZSd5kPhPuDxvBwMbYM5rlcA0mXf.qC', '0812-2222-2222', NULL, 'active', false, 0, NULL, 'dept-pm', '2026-07-17 01:21:18.399', '2026-07-17 01:21:18.399', NULL);
INSERT INTO public.users (id, username, full_name, email, password_hash, phone, avatar_url, status, is_locked, failed_login_count, last_login_at, org_unit_id, created_at, updated_at, deleted_at) VALUES ('user-3', 'rina', 'Rina Marlina', 'rina@kinetic.id', '$2b$10$7/.s7xo2bWZkQIx3/shgSuTZSd5kPhPuDxvBwMbYM5rlcA0mXf.qC', '0813-3333-3333', NULL, 'active', false, 0, NULL, 'dept-marketing', '2026-07-17 01:21:18.422', '2026-07-17 01:21:18.422', NULL);
INSERT INTO public.users (id, username, full_name, email, password_hash, phone, avatar_url, status, is_locked, failed_login_count, last_login_at, org_unit_id, created_at, updated_at, deleted_at) VALUES ('user-4', 'deni', 'Deni Saputra', 'deni@kinetic.id', '$2b$10$o8boRarfHe.iDLTHMnLZj.4J11lNzTfpJ5eueqX0TtaCzl1fTURc2', '0814-4444-4444', NULL, 'active', false, 0, NULL, 'dept-finance', '2026-07-17 01:21:18.446', '2026-07-17 01:21:18.446', NULL);
INSERT INTO public.users (id, username, full_name, email, password_hash, phone, avatar_url, status, is_locked, failed_login_count, last_login_at, org_unit_id, created_at, updated_at, deleted_at) VALUES ('user-5', 'siti', 'Siti Rahmawati', 'siti@kinetic.id', '$2b$10$o8boRarfHe.iDLTHMnLZj.4J11lNzTfpJ5eueqX0TtaCzl1fTURc2', '0815-5555-5555', NULL, 'active', false, 0, NULL, 'dept-procurement', '2026-07-17 01:21:18.473', '2026-07-17 01:21:18.473', NULL);
INSERT INTO public.users (id, username, full_name, email, password_hash, phone, avatar_url, status, is_locked, failed_login_count, last_login_at, org_unit_id, created_at, updated_at, deleted_at) VALUES ('user-6', 'ahmad', 'Ahmad Sulistyo', 'ahmad@kinetic.id', '$2b$10$o8boRarfHe.iDLTHMnLZj.4J11lNzTfpJ5eueqX0TtaCzl1fTURc2', '0816-6666-6666', NULL, 'active', false, 0, NULL, 'dept-pm', '2026-07-17 01:21:18.494', '2026-07-17 01:21:18.494', NULL);
INSERT INTO public.users (id, username, full_name, email, password_hash, phone, avatar_url, status, is_locked, failed_login_count, last_login_at, org_unit_id, created_at, updated_at, deleted_at) VALUES ('user-1', 'superadmin', 'Super Administrator', 'superadmin@kinetic.id', '$2b$10$7/.s7xo2bWZkQIx3/shgSuTZSd5kPhPuDxvBwMbYM5rlcA0mXf.qC', '0811-1111-1111', NULL, 'active', false, 0, '2026-07-17 01:23:27.474', 'dept-it', '2026-07-17 01:21:18.366', '2026-07-17 01:23:27.476', NULL);


--
-- Data for Name: active_sessions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.active_sessions (id, user_id, token_jti, ip_address, user_agent, expires_at, revoked_at, created_at) VALUES ('64f5f5b8-7e28-4177-bbeb-8226f15da4bb', 'user-1', '89145085-2296-42f7-99ae-3ee402211246', '172.20.0.1', NULL, '2026-07-17 09:23:16.781', NULL, '2026-07-17 01:23:16.783');
INSERT INTO public.active_sessions (id, user_id, token_jti, ip_address, user_agent, expires_at, revoked_at, created_at) VALUES ('ff91ac77-81f3-451f-9936-f250d74f479c', 'user-1', '55105644-a038-4cba-80a4-88fc32f88f54', '172.20.0.1', NULL, '2026-07-17 09:23:27.486', NULL, '2026-07-17 01:23:27.488');


--
-- Data for Name: ai_request_logs; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: approval_chains; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: approval_chain_levels; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-supervisor', 'Supervisor', NULL, true, '2026-07-17 01:21:17.301', '2026-07-17 01:21:17.301');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-superadmin', 'Super Admin', NULL, true, '2026-07-17 01:21:17.317', '2026-07-17 01:21:17.317');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-director', 'Director', NULL, true, '2026-07-17 01:21:17.331', '2026-07-17 01:21:17.331');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-admin', 'Admin', NULL, true, '2026-07-17 01:21:17.344', '2026-07-17 01:21:17.344');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-pm', 'PM', NULL, true, '2026-07-17 01:21:17.355', '2026-07-17 01:21:17.355');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-bm', 'Branch Manager', NULL, true, '2026-07-17 01:21:17.365', '2026-07-17 01:21:17.365');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-depthead', 'Dept Head', NULL, true, '2026-07-17 01:21:17.377', '2026-07-17 01:21:17.377');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-management', 'Management', NULL, true, '2026-07-17 01:21:17.391', '2026-07-17 01:21:17.391');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-reviewer', 'Reviewer', NULL, true, '2026-07-17 01:21:17.403', '2026-07-17 01:21:17.403');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-staff', 'Staff', NULL, true, '2026-07-17 01:21:17.415', '2026-07-17 01:21:17.415');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-pm-viewer', 'Project Viewer', NULL, false, '2026-07-17 01:21:17.427', '2026-07-17 01:21:17.427');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-pm-contrib', 'Project Contributor', NULL, false, '2026-07-17 01:21:17.437', '2026-07-17 01:21:17.437');
INSERT INTO public.roles (id, name, description, is_system, created_at, updated_at) VALUES ('role-pm-manager', 'Project Manager', NULL, false, '2026-07-17 01:21:17.448', '2026-07-17 01:21:17.448');


--
-- Data for Name: workflow_stages; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-prospecting', 'prospecting', 'Prospecting', 'prospect', 1, 'DEPT-MKT', NULL, true, '2026-07-17 01:21:17.968', '2026-07-17 01:21:17.968', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-supervisor-review', 'supervisor_review', 'Supervisor Review', 'prospect', 2, 'DEPT-MKT', 'DEPT-MKT', true, '2026-07-17 01:21:17.983', '2026-07-17 01:21:17.983', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-in-project', 'in_project', 'In Project', 'project', 3, 'DEPT-PM', 'DEPT-MKT', true, '2026-07-17 01:21:18.001', '2026-07-17 01:21:18.001', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-rks', 'rks', 'RKS', 'project', 4, 'DEPT-PM', 'DEPT-PM', true, '2026-07-17 01:21:18.013', '2026-07-17 01:21:18.013', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-lphs', 'lphs', 'LPHS/SIOS', 'project', 5, 'DEPT-PM', 'DEPT-PM', true, '2026-07-17 01:21:18.024', '2026-07-17 01:21:18.024', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-pricing', 'pricing', 'Pricing', 'project', 6, 'DEPT-FIN', 'DEPT-PM', true, '2026-07-17 01:21:18.038', '2026-07-17 01:21:18.038', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-tender', 'tender', 'Tender', 'project', 7, 'DEPT-PM', 'DEPT-FIN', true, '2026-07-17 01:21:18.062', '2026-07-17 01:21:18.062', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-closed', 'closed', 'Closed', 'project', 8, 'DEPT-PM', 'DEPT-PM', true, '2026-07-17 01:21:18.079', '2026-07-17 01:21:18.079', NULL);
INSERT INTO public.workflow_stages (id, code, name, module, sequence, owner_department_code, prev_department_code, is_active, created_at, updated_at, role_id) VALUES ('stage-cancelled', 'cancelled', 'Cancelled', 'project', 9, 'DEPT-PM', NULL, true, '2026-07-17 01:21:18.094', '2026-07-17 01:21:18.094', NULL);


--
-- Data for Name: approvals; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: approval_reassignments; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: approval_requests; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: approval_request_levels; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: backup_approver_delegations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.customers (id, name, code, type, city, npwp, pic_name, pic_position, pic_phone, pic_email, address, province, industry_id, provider_existing, is_new, needs_verification, verified_at, verified_by, is_active, parent_id, level, requirements, unit_level, canonical_name, source, created_at, updated_at, deleted_at) VALUES ('C001', 'PT. Telkom Indonesia Tbk.', 'TELKOM', 'bumn', 'Bandung', '01.234.567.8-091.000', 'Budi Santoso', 'Procurement Manager', '0812-3456-7890', 'budi@telkom.co.id', NULL, NULL, 'ind-telekom', NULL, false, false, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-17 01:21:19.602', '2026-07-17 01:21:19.602', NULL);
INSERT INTO public.customers (id, name, code, type, city, npwp, pic_name, pic_position, pic_phone, pic_email, address, province, industry_id, provider_existing, is_new, needs_verification, verified_at, verified_by, is_active, parent_id, level, requirements, unit_level, canonical_name, source, created_at, updated_at, deleted_at) VALUES ('C002', 'PT. Telekom Nusantara', 'TELKON', 'bumn', 'Jakarta Selatan', '02.345.678.9-092.001', 'Siti Aminah', 'IT Director', '0813-4567-8901', 'siti@telkomnusantara.co.id', NULL, NULL, 'ind-telekom', NULL, false, false, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-17 01:21:19.621', '2026-07-17 01:21:19.621', NULL);
INSERT INTO public.customers (id, name, code, type, city, npwp, pic_name, pic_position, pic_phone, pic_email, address, province, industry_id, provider_existing, is_new, needs_verification, verified_at, verified_by, is_active, parent_id, level, requirements, unit_level, canonical_name, source, created_at, updated_at, deleted_at) VALUES ('C003', 'Energi Bangsa Corp', 'EBC', 'swasta', 'Jakarta Pusat', NULL, 'Rizky Pratama', 'CEO', '0814-5678-9012', 'rizky@ebc.co.id', NULL, NULL, 'ind-energy', NULL, false, false, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-17 01:21:19.631', '2026-07-17 01:21:19.631', NULL);
INSERT INTO public.customers (id, name, code, type, city, npwp, pic_name, pic_position, pic_phone, pic_email, address, province, industry_id, provider_existing, is_new, needs_verification, verified_at, verified_by, is_active, parent_id, level, requirements, unit_level, canonical_name, source, created_at, updated_at, deleted_at) VALUES ('C004', 'Secure City Group', 'SCG', 'swasta', 'Jakarta Timur', NULL, 'Dian Permata', 'Security Manager', '0815-6789-0123', NULL, NULL, NULL, 'ind-telekom', NULL, false, false, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-17 01:21:19.645', '2026-07-17 01:21:19.645', NULL);
INSERT INTO public.customers (id, name, code, type, city, npwp, pic_name, pic_position, pic_phone, pic_email, address, province, industry_id, provider_existing, is_new, needs_verification, verified_at, verified_by, is_active, parent_id, level, requirements, unit_level, canonical_name, source, created_at, updated_at, deleted_at) VALUES ('C005', 'Pemerintah Provinsi DKI Jakarta', 'PEMDKI', 'pemerintah', 'Jakarta Pusat', NULL, 'Bambang Sutejo', 'Kepala Dinas', '021-1234567', NULL, NULL, NULL, 'ind-government', NULL, false, false, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-17 01:21:19.658', '2026-07-17 01:21:19.658', NULL);
INSERT INTO public.customers (id, name, code, type, city, npwp, pic_name, pic_position, pic_phone, pic_email, address, province, industry_id, provider_existing, is_new, needs_verification, verified_at, verified_by, is_active, parent_id, level, requirements, unit_level, canonical_name, source, created_at, updated_at, deleted_at) VALUES ('C006', 'Global Tech Solutions', 'GTS', 'asing', 'Jakarta Selatan', '04.567.890.1-094.003', 'John Smith', 'Regional Manager', '0817-8901-2345', NULL, NULL, NULL, 'ind-telekom', NULL, false, false, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-17 01:21:19.669', '2026-07-17 01:21:19.669', NULL);


--
-- Data for Name: project_categories; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.project_categories (id, name, code, description, requires_lphs, requires_rks, default_workflow_type, color_hex, sort_order, is_active, created_at, updated_at) VALUES ('cat-infra', 'Infrastruktur', 'INFRA', NULL, true, true, 'tender', NULL, 0, true, '2026-07-17 01:21:18.606', '2026-07-17 01:21:18.606');
INSERT INTO public.project_categories (id, name, code, description, requires_lphs, requires_rks, default_workflow_type, color_hex, sort_order, is_active, created_at, updated_at) VALUES ('cat-it', 'Teknologi Informasi', 'IT', NULL, true, true, 'tender', NULL, 0, true, '2026-07-17 01:21:18.624', '2026-07-17 01:21:18.624');
INSERT INTO public.project_categories (id, name, code, description, requires_lphs, requires_rks, default_workflow_type, color_hex, sort_order, is_active, created_at, updated_at) VALUES ('cat-consulting', 'Konsultansi', 'CONSULT', NULL, true, true, 'prospecting', NULL, 0, true, '2026-07-17 01:21:18.635', '2026-07-17 01:21:18.635');
INSERT INTO public.project_categories (id, name, code, description, requires_lphs, requires_rks, default_workflow_type, color_hex, sort_order, is_active, created_at, updated_at) VALUES ('cat-security', 'Keamanan', 'SECURITY', NULL, true, true, 'tender', NULL, 0, true, '2026-07-17 01:21:18.644', '2026-07-17 01:21:18.644');
INSERT INTO public.project_categories (id, name, code, description, requires_lphs, requires_rks, default_workflow_type, color_hex, sort_order, is_active, created_at, updated_at) VALUES ('cat-energy', 'Energi', 'ENERGY', NULL, true, true, 'tender', NULL, 0, true, '2026-07-17 01:21:18.654', '2026-07-17 01:21:18.654');


--
-- Data for Name: project_status_definitions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-prospecting', 'prospecting', 'Prospecting', NULL, '#6B7280', '#FFFFFF', 1, true, false, 'prospect', true, '2026-07-17 01:21:19.496', '2026-07-17 01:21:19.496');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-waiting-supervisor', 'waiting_supervisor', 'Waiting Supervisor', NULL, '#F59E0B', '#FFFFFF', 2, true, false, 'prospect', true, '2026-07-17 01:21:19.512', '2026-07-17 01:21:19.512');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-approved', 'approved', 'Approved', NULL, '#10B981', '#FFFFFF', 3, true, false, 'prospect', true, '2026-07-17 01:21:19.522', '2026-07-17 01:21:19.522');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-rks', 'rks', 'RKS', NULL, '#3B82F6', '#FFFFFF', 4, true, false, 'project', true, '2026-07-17 01:21:19.531', '2026-07-17 01:21:19.531');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-lphs', 'lphs', 'LPHS/SIOS', NULL, '#8B5CF6', '#FFFFFF', 5, true, false, 'project', true, '2026-07-17 01:21:19.542', '2026-07-17 01:21:19.542');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-pricing', 'pricing', 'Pricing', NULL, '#EC4899', '#FFFFFF', 6, true, false, 'project', true, '2026-07-17 01:21:19.553', '2026-07-17 01:21:19.553');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-tender', 'tender', 'Tender', NULL, '#F97316', '#FFFFFF', 7, true, false, 'project', true, '2026-07-17 01:21:19.564', '2026-07-17 01:21:19.564');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-won', 'won', 'Won', NULL, '#10B981', '#FFFFFF', 8, true, true, 'project', true, '2026-07-17 01:21:19.574', '2026-07-17 01:21:19.574');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-lost', 'lost', 'Lost', NULL, '#EF4444', '#FFFFFF', 9, true, true, 'project', true, '2026-07-17 01:21:19.584', '2026-07-17 01:21:19.584');
INSERT INTO public.project_status_definitions (id, code, label, description, color_hex, text_color_hex, sort_order, is_system, is_terminal, applicable_to, is_active, created_at, updated_at) VALUES ('ps-cancelled', 'cancelled', 'Cancelled', NULL, '#9CA3AF', '#FFFFFF', 10, true, true, 'both', true, '2026-07-17 01:21:19.592', '2026-07-17 01:21:19.592');


--
-- Data for Name: prospects; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.prospects (id, name, client, customer_id, customer_type, status, prospect_type, potensi_unit, estimated_value, description, branch, branch_id, category_id, industry_id, provider_existing, project_type, is_converted, converted_to_project_id, created_by_user_id, department_id, current_stage_id, owner_user_id, source, created_at, updated_at, deleted_at) VALUES ('prosp-1', 'Data Center Modernization', 'PT. Telekom Nusantara', 'C002', NULL, 'potensial', NULL, 3, 1250000000.000000000000000000000000000000, NULL, 'Jakarta Pusat', 'org-branch-jkt', NULL, NULL, NULL, NULL, false, NULL, 'user-1', 'dept-marketing', 'stage-prospecting', 'user-1', NULL, '2026-07-17 01:21:19.681', '2026-07-17 01:21:19.681', NULL);
INSERT INTO public.prospects (id, name, client, customer_id, customer_type, status, prospect_type, potensi_unit, estimated_value, description, branch, branch_id, category_id, industry_id, provider_existing, project_type, is_converted, converted_to_project_id, created_by_user_id, department_id, current_stage_id, owner_user_id, source, created_at, updated_at, deleted_at) VALUES ('prosp-2', 'High-Voltage Cable Supply', 'Energi Bangsa Corp', 'C003', NULL, 'approved', NULL, 5, 3400000000.000000000000000000000000000000, NULL, 'Bandung', 'org-branch-bdg', NULL, NULL, NULL, NULL, false, NULL, 'user-1', 'dept-marketing', 'stage-prospecting', 'user-1', NULL, '2026-07-17 01:21:19.701', '2026-07-17 01:21:19.701', NULL);
INSERT INTO public.prospects (id, name, client, customer_id, customer_type, status, prospect_type, potensi_unit, estimated_value, description, branch, branch_id, category_id, industry_id, provider_existing, project_type, is_converted, converted_to_project_id, created_by_user_id, department_id, current_stage_id, owner_user_id, source, created_at, updated_at, deleted_at) VALUES ('prosp-3', 'Surveillance System Phase 2', 'Secure City Group', 'C004', NULL, 'waiting_supervisor', NULL, 2, 850000000.000000000000000000000000000000, NULL, 'Jakarta Pusat', 'org-branch-jkt', NULL, NULL, NULL, NULL, false, NULL, 'user-2', 'dept-pm', 'stage-supervisor-review', 'user-2', NULL, '2026-07-17 01:21:19.72', '2026-07-17 01:21:19.72', NULL);


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.projects (id, code, name, client, type, location, status, phase, progress, estimated_value, deadline_tender, source_prospect_id, source_prospect_id_active, customer_id, provider_existing, branch, branch_id, department_id, category_id, status_id, current_stage_id, created_by_user_id, owner_user_id, scope_departments, author, date, created_at, updated_at, deleted_at) VALUES ('PR-2025-001', 'PR-2025-001', 'Pembangunan Infrastruktur Data Center - Tahap II', 'PT. Telkom Indonesia Tbk.', 'tender', 'Gatot Subroto, Jakarta', 'lphs', 'LPHS/SIOS', 65, 4250000000.000000000000000000000000000000, '2026-06-25 00:00:00', NULL, NULL, NULL, NULL, 'Jakarta Pusat', 'org-branch-jkt', 'dept-pm', 'cat-infra', NULL, 'stage-lphs', 'user-2', 'user-2', NULL, 'Bambang Permadi', '2025-02-24 00:00:00', '2026-07-17 01:21:19.742', '2026-07-17 01:21:19.742', NULL);
INSERT INTO public.projects (id, code, name, client, type, location, status, phase, progress, estimated_value, deadline_tender, source_prospect_id, source_prospect_id_active, customer_id, provider_existing, branch, branch_id, department_id, category_id, status_id, current_stage_id, created_by_user_id, owner_user_id, scope_departments, author, date, created_at, updated_at, deleted_at) VALUES ('PR-2025-002', 'PR-2025-002', 'Network Infrastructure Upgrade - Pemerintah Provinsi DKI', 'Pemerintah Provinsi DKI Jakarta', 'tender', 'Balai Kota, Jakarta', 'rks', 'RKS', 30, 2800000000.000000000000000000000000000000, '2026-08-15 00:00:00', NULL, NULL, NULL, NULL, 'Jakarta Pusat', 'org-branch-jkt', 'dept-pm', 'cat-it', NULL, 'stage-rks', 'user-2', 'user-2', NULL, 'Bambang Permadi', '2025-03-10 00:00:00', '2026-07-17 01:21:19.774', '2026-07-17 01:21:19.774', NULL);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: chat_message_read_receipts; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: competitors; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.competitors (id, name, code, min_price, max_price, industry_id, bidang_usaha, website, advantages, description, notes, is_active, created_at, updated_at, deleted_at) VALUES ('comp-1', 'Infrastructure Alpha', 'ALPHA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-07-17 01:21:18.743', '2026-07-17 01:21:18.743', NULL);
INSERT INTO public.competitors (id, name, code, min_price, max_price, industry_id, bidang_usaha, website, advantages, description, notes, is_active, created_at, updated_at, deleted_at) VALUES ('comp-2', 'BuildCore Systems', 'BUILDCORE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-07-17 01:21:18.76', '2026-07-17 01:21:18.76', NULL);
INSERT INTO public.competitors (id, name, code, min_price, max_price, industry_id, bidang_usaha, website, advantages, description, notes, is_active, created_at, updated_at, deleted_at) VALUES ('comp-3', 'TechSolusi Nusantara', 'TSN', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-07-17 01:21:18.769', '2026-07-17 01:21:18.769', NULL);
INSERT INTO public.competitors (id, name, code, min_price, max_price, industry_id, bidang_usaha, website, advantages, description, notes, is_active, created_at, updated_at, deleted_at) VALUES ('comp-4', 'Global Digital Services', 'GDS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-07-17 01:21:18.779', '2026-07-17 01:21:18.779', NULL);


--
-- Data for Name: connectors; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: master_items; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-001', 'SKU-AC-001', 'AC Central 10PK', 'barang', 'unit', 'cat-infra', 'Infrastruktur', 85000000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.229', '2026-07-17 01:21:20.229', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-002', 'SKU-SVR-001', 'Server Rack 42U', 'barang', 'unit', 'cat-it', 'Teknologi Informasi', 250000000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.245', '2026-07-17 01:21:20.245', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-003', 'SKU-FW-001', 'Firewall Fortinet 200F', 'barang', 'unit', 'cat-it', 'Teknologi Informasi', 180000000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.258', '2026-07-17 01:21:20.258', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-004', 'SKU-SW-001', 'Switch Cisco 3850 48 Port', 'barang', 'unit', 'cat-it', 'Teknologi Informasi', 95000000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.269', '2026-07-17 01:21:20.269', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-005', 'SKU-KBL-001', 'Kabel Fiber Optic 1km', 'barang', 'roll', 'cat-infra', 'Infrastruktur', 3500000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.279', '2026-07-17 01:21:20.279', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-006', 'SKU-CCTV-001', 'Camera CCTV 4MP PTZ', 'barang', 'unit', 'cat-security', 'Keamanan', 4500000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.291', '2026-07-17 01:21:20.291', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-007', 'SKU-UPS-001', 'UPS 3000VA Online', 'barang', 'unit', 'cat-infra', 'Infrastruktur', 35000000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.305', '2026-07-17 01:21:20.305', NULL);
INSERT INTO public.master_items (id, sku, name, type, unit, category_id, category_name, base_price, description, is_active, created_at, updated_at, deleted_at) VALUES ('item-008', 'SKU-INST-001', 'Jasa Instalasi Jaringan', 'jasa', 'paket', 'cat-it', 'Teknologi Informasi', 75000000.000000000000000000000000000000, NULL, true, '2026-07-17 01:21:20.318', '2026-07-17 01:21:20.318', NULL);


--
-- Data for Name: deal_line_items; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: delivery_targets; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.document_types (id, name, code, description, allowed_extensions, max_size_mb, is_required_at_stage, applicable_to, sort_order, is_system, is_active, created_at, updated_at) VALUES ('doctype-rks', 'RKS Document', 'RKS', NULL, '.pdf,.doc,.docx', NULL, NULL, 'project', 0, false, true, '2026-07-17 01:21:18.666', '2026-07-17 01:21:18.666');
INSERT INTO public.document_types (id, name, code, description, allowed_extensions, max_size_mb, is_required_at_stage, applicable_to, sort_order, is_system, is_active, created_at, updated_at) VALUES ('doctype-lphs', 'LPHS Document', 'LPHS', NULL, '.pdf,.xls,.xlsx', NULL, NULL, 'project', 0, false, true, '2026-07-17 01:21:18.683', '2026-07-17 01:21:18.683');
INSERT INTO public.document_types (id, name, code, description, allowed_extensions, max_size_mb, is_required_at_stage, applicable_to, sort_order, is_system, is_active, created_at, updated_at) VALUES ('doctype-sios', 'SIOS Document', 'SIOS', NULL, '.pdf', NULL, NULL, 'project', 0, false, true, '2026-07-17 01:21:18.692', '2026-07-17 01:21:18.692');
INSERT INTO public.document_types (id, name, code, description, allowed_extensions, max_size_mb, is_required_at_stage, applicable_to, sort_order, is_system, is_active, created_at, updated_at) VALUES ('doctype-spk', 'SPK/Contract', 'SPK', NULL, '.pdf,.doc,.docx', NULL, NULL, 'project', 0, false, true, '2026-07-17 01:21:18.703', '2026-07-17 01:21:18.703');
INSERT INTO public.document_types (id, name, code, description, allowed_extensions, max_size_mb, is_required_at_stage, applicable_to, sort_order, is_system, is_active, created_at, updated_at) VALUES ('doctype-boq', 'BOQ', 'BOQ', NULL, '.xls,.xlsx', NULL, NULL, 'project', 0, false, true, '2026-07-17 01:21:18.714', '2026-07-17 01:21:18.714');
INSERT INTO public.document_types (id, name, code, description, allowed_extensions, max_size_mb, is_required_at_stage, applicable_to, sort_order, is_system, is_active, created_at, updated_at) VALUES ('doctype-prospect', 'Prospect Document', 'PROSPECT', NULL, '.pdf,.doc,.docx,.jpg,.png', NULL, NULL, 'prospect', 0, false, true, '2026-07-17 01:21:18.732', '2026-07-17 01:21:18.732');


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: entity_relations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: follow_up_tasks; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: industries; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-telekom', 'Telekomunikasi', 'TELEKOM', true, '2026-07-17 01:21:18.511', '2026-07-17 01:21:18.511');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-finance', 'Perbankan & Keuangan', 'FINANCE', true, '2026-07-17 01:21:18.53', '2026-07-17 01:21:18.53');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-energy', 'Energi & Sumber Daya', 'ENERGY', true, '2026-07-17 01:21:18.539', '2026-07-17 01:21:18.539');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-government', 'Pemerintahan', 'GOVERNMENT', true, '2026-07-17 01:21:18.551', '2026-07-17 01:21:18.551');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-manufacturing', 'Manufaktur', 'MFG', true, '2026-07-17 01:21:18.561', '2026-07-17 01:21:18.561');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-healthcare', 'Kesehatan', 'HEALTH', true, '2026-07-17 01:21:18.577', '2026-07-17 01:21:18.577');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-education', 'Pendidikan', 'EDUCATION', true, '2026-07-17 01:21:18.585', '2026-07-17 01:21:18.585');
INSERT INTO public.industries (id, name, code, is_active, created_at, updated_at) VALUES ('ind-oilgas', 'Minyak & Gas', 'OILGAS', true, '2026-07-17 01:21:18.596', '2026-07-17 01:21:18.596');


--
-- Data for Name: input_config_groups; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-customer-types', 'customer_types', 'Tipe Pelanggan', 'Klasifikasi tipe pelanggan', 'form', true, '2026-07-17 01:21:19.867', '2026-07-17 01:21:19.867');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-project-types', 'project_types', 'Tipe Proyek', 'Klasifikasi jenis proyek / pengadaan', 'form', true, '2026-07-17 01:21:19.875', '2026-07-17 01:21:19.875');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-escalation-roles', 'escalation_roles', 'Peran Eskalasi SLA', 'Role yang menerima notifikasi eskalasi SLA', 'sla', true, '2026-07-17 01:21:19.881', '2026-07-17 01:21:19.881');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-sla-entity-types', 'sla_entity_types', 'Tipe Entitas SLA', 'Entitas yang dapat dikaitkan dengan SLA', 'sla', true, '2026-07-17 01:21:19.886', '2026-07-17 01:21:19.886');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-sla-units', 'sla_units', 'Satuan SLA', 'Satuan waktu untuk perhitungan SLA', 'sla', true, '2026-07-17 01:21:19.891', '2026-07-17 01:21:19.891');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-prospect-filter-tabs', 'prospect_filter_tabs', 'Tab Filter Prospek', 'Tab filter pada halaman daftar prospek', 'filter', true, '2026-07-17 01:21:19.897', '2026-07-17 01:21:19.897');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-pipeline-tabs', 'pipeline_tabs', 'Tab Pipeline', 'Tab filter pada halaman pipeline proyek', 'filter', true, '2026-07-17 01:21:19.902', '2026-07-17 01:21:19.902');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-account-statuses', 'account_statuses', 'Status Akun', 'Status akun pengguna', 'filter', true, '2026-07-17 01:21:19.906', '2026-07-17 01:21:19.906');
INSERT INTO public.input_config_groups (id, key, name, description, category, is_system, created_at, updated_at) VALUES ('icg-workflow-entity-tabs', 'workflow_entity_tabs', 'Tab Entitas Workflow', 'Tab filter pada halaman konfigurasi workflow', 'workflow', true, '2026-07-17 01:21:19.912', '2026-07-17 01:21:19.912');


--
-- Data for Name: input_config_options; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-ct-1', 'icg-customer-types', 'swasta', 'Swasta', 1, true, '#3B82F6', NULL, '2026-07-17 01:21:19.92');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-ct-2', 'icg-customer-types', 'bumn', 'BUMN / BUMD', 2, true, '#10B981', NULL, '2026-07-17 01:21:19.937');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-ct-3', 'icg-customer-types', 'pemerintah', 'Pemerintah', 3, true, '#F59E0B', NULL, '2026-07-17 01:21:19.944');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-ct-4', 'icg-customer-types', 'asing', 'Asing', 4, true, '#8B5CF6', NULL, '2026-07-17 01:21:19.95');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pt-1', 'icg-project-types', 'tender', 'Tender', 1, true, '#EF4444', NULL, '2026-07-17 01:21:19.958');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pt-2', 'icg-project-types', 'prospecting', 'Prospecting', 2, true, '#3B82F6', NULL, '2026-07-17 01:21:19.968');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pt-3', 'icg-project-types', 'pengadaan_langsung', 'Pengadaan Langsung', 3, true, '#10B981', NULL, '2026-07-17 01:21:19.977');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pt-4', 'icg-project-types', 'lelang', 'Lelang Umum', 4, true, '#F59E0B', NULL, '2026-07-17 01:21:19.984');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pt-5', 'icg-project-types', 'swakelola', 'Swakelola', 5, true, '#8B5CF6', NULL, '2026-07-17 01:21:19.991');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-er-1', 'icg-escalation-roles', 'pm', 'Project Manager', 1, true, NULL, NULL, '2026-07-17 01:21:19.997');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-er-2', 'icg-escalation-roles', 'branch_manager', 'Branch Manager', 2, true, NULL, NULL, '2026-07-17 01:21:20.004');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-er-3', 'icg-escalation-roles', 'dir_teknik', 'Direktur Teknik', 3, true, NULL, NULL, '2026-07-17 01:21:20.013');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-er-4', 'icg-escalation-roles', 'dir_keuangan', 'Direktur Keuangan', 4, true, NULL, NULL, '2026-07-17 01:21:20.019');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-er-5', 'icg-escalation-roles', 'super_admin', 'Super Admin', 5, true, NULL, NULL, '2026-07-17 01:21:20.024');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-set-1', 'icg-sla-entity-types', 'prospek', 'Prospek', 1, true, NULL, NULL, '2026-07-17 01:21:20.031');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-set-2', 'icg-sla-entity-types', 'rks', 'RKS', 2, true, NULL, NULL, '2026-07-17 01:21:20.037');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-set-3', 'icg-sla-entity-types', 'lphs', 'LPHS', 3, true, NULL, NULL, '2026-07-17 01:21:20.042');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-set-4', 'icg-sla-entity-types', 'pengadaan', 'Pengadaan', 4, true, NULL, NULL, '2026-07-17 01:21:20.049');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-su-1', 'icg-sla-units', 'jam', 'Jam', 1, true, NULL, NULL, '2026-07-17 01:21:20.068');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-su-2', 'icg-sla-units', 'hari', 'Hari', 2, true, NULL, NULL, '2026-07-17 01:21:20.074');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-su-3', 'icg-sla-units', 'minggu', 'Minggu', 3, true, NULL, NULL, '2026-07-17 01:21:20.08');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-su-4', 'icg-sla-units', 'bulan', 'Bulan', 4, true, NULL, NULL, '2026-07-17 01:21:20.091');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pft-1', 'icg-prospect-filter-tabs', 'all', 'Semua', 1, true, NULL, NULL, '2026-07-17 01:21:20.102');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pft-2', 'icg-prospect-filter-tabs', 'needs_review', 'Perlu Review', 2, true, NULL, NULL, '2026-07-17 01:21:20.108');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pft-3', 'icg-prospect-filter-tabs', 'my_prospects', 'Prospek Saya', 3, true, NULL, NULL, '2026-07-17 01:21:20.118');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pft-4', 'icg-prospect-filter-tabs', 'recent', 'Terbaru', 4, true, NULL, NULL, '2026-07-17 01:21:20.127');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pft-5', 'icg-prospect-filter-tabs', 'won', 'Menang', 5, true, NULL, NULL, '2026-07-17 01:21:20.136');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pft-6', 'icg-prospect-filter-tabs', 'lost', 'Kalah', 6, true, NULL, NULL, '2026-07-17 01:21:20.144');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pl-1', 'icg-pipeline-tabs', 'all', 'Semua', 1, true, NULL, NULL, '2026-07-17 01:21:20.153');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pl-2', 'icg-pipeline-tabs', 'prospecting', 'Prospecting', 2, true, NULL, NULL, '2026-07-17 01:21:20.163');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pl-3', 'icg-pipeline-tabs', 'tender', 'Tender', 3, true, NULL, NULL, '2026-07-17 01:21:20.172');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pl-4', 'icg-pipeline-tabs', 'negotiation', 'Negosiasi', 4, true, NULL, NULL, '2026-07-17 01:21:20.178');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pl-5', 'icg-pipeline-tabs', 'won', 'Menang', 5, true, NULL, NULL, '2026-07-17 01:21:20.184');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-pl-6', 'icg-pipeline-tabs', 'lost', 'Kalah', 6, true, NULL, NULL, '2026-07-17 01:21:20.189');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-as-1', 'icg-account-statuses', 'active', 'Aktif', 1, true, '#10B981', NULL, '2026-07-17 01:21:20.195');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-as-2', 'icg-account-statuses', 'inactive', 'Non-Aktif', 2, true, '#EF4444', NULL, '2026-07-17 01:21:20.2');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-as-3', 'icg-account-statuses', 'suspended', 'Ditangguhkan', 3, true, '#F59E0B', NULL, '2026-07-17 01:21:20.205');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-wet-1', 'icg-workflow-entity-tabs', 'prospek', 'Prospek', 1, true, NULL, NULL, '2026-07-17 01:21:20.212');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-wet-2', 'icg-workflow-entity-tabs', 'rks', 'RKS', 2, true, NULL, NULL, '2026-07-17 01:21:20.219');
INSERT INTO public.input_config_options (id, group_id, value, label, sort_order, is_active, color_hex, metadata, created_at) VALUES ('ico-wet-3', 'icg-workflow-entity-tabs', 'lphs', 'LPHS', 3, true, NULL, NULL, '2026-07-17 01:21:20.224');


--
-- Data for Name: integration_configurations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: kpi_definitions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: kpi_targets; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: kpi_weights; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: loss_reasons; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.loss_reasons (id, name, code, category, description, sort_order, is_active, created_at, updated_at) VALUES ('lr-price', 'Harga lebih tinggi', 'HARGA', 'harga', NULL, 0, true, '2026-07-17 01:21:19.434', '2026-07-17 01:21:19.434');
INSERT INTO public.loss_reasons (id, name, code, category, description, sort_order, is_active, created_at, updated_at) VALUES ('lr-tech', 'Kelemahan teknis', 'TEKNIS', 'teknis', NULL, 0, true, '2026-07-17 01:21:19.451', '2026-07-17 01:21:19.451');
INSERT INTO public.loss_reasons (id, name, code, category, description, sort_order, is_active, created_at, updated_at) VALUES ('lr-admin', 'Administrasi tidak lengkap', 'ADMIN', 'administrasi', NULL, 0, true, '2026-07-17 01:21:19.459', '2026-07-17 01:21:19.459');
INSERT INTO public.loss_reasons (id, name, code, category, description, sort_order, is_active, created_at, updated_at) VALUES ('lr-ref', 'Referensi kurang', 'REFERENSI', 'lainnya', NULL, 0, true, '2026-07-17 01:21:19.468', '2026-07-17 01:21:19.468');
INSERT INTO public.loss_reasons (id, name, code, category, description, sort_order, is_active, created_at, updated_at) VALUES ('lr-rel', 'Relasi kompetitor lebih kuat', 'RELASI', 'lainnya', NULL, 0, true, '2026-07-17 01:21:19.478', '2026-07-17 01:21:19.478');
INSERT INTO public.loss_reasons (id, name, code, category, description, sort_order, is_active, created_at, updated_at) VALUES ('lr-other', 'Lainnya', 'LAINNYA', 'lainnya', NULL, 0, true, '2026-07-17 01:21:19.487', '2026-07-17 01:21:19.487');


--
-- Data for Name: lphs_sios; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.lphs_sios (id, project_id, status, lphs_file_name, lphs_file_size, lphs_external_url, sios_file_name, sios_file_size, selected_departments, departments_locked, pm_approval_status, pm_approved_at, pm_approved_by, mgmt_approval_status, mgmt_approved_at, mgmt_approved_by, final_approval_status, final_approved_at, final_approved_by, overall_status, revision_number, submitted_at, created_at, updated_at) VALUES ('lphs-1', 'PR-2025-001', 'draft', 'LPHS_Telkom_v2.pdf', '3.4 MB', NULL, 'SIOS_Infra_TahapII.pdf', '1.2 MB', '["dept-it","dept-finance"]', false, 'approved', '2025-03-10 00:00:00', 'user-2', 'reviewing', NULL, NULL, 'pending_pm', NULL, NULL, 'dept_review', 1, '2025-03-08 00:00:00', '2026-07-17 01:21:19.811', '2026-07-17 01:21:19.811');


--
-- Data for Name: lphs_department_reviews; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: lphs_targeted_revisions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: lphs_targeted_revision_departments; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: notification_template_recipients; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: periods; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-dashboard-view', 'dashboard:view', 'View Dashboard', 'dashboard', NULL, '2026-07-17 01:21:17.457');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-notification-read', 'notification:read', 'Read Notifications', 'notification', NULL, '2026-07-17 01:21:17.47');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-profile-manage', 'profile:manage', 'Manage Profile', 'profile', NULL, '2026-07-17 01:21:17.48');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-user-read', 'user:read', 'Read Users', 'user', NULL, '2026-07-17 01:21:17.488');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-user-write', 'user:write', 'Create/Edit Users', 'user', NULL, '2026-07-17 01:21:17.498');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-user-delete', 'user:delete', 'Delete Users', 'user', NULL, '2026-07-17 01:21:17.508');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-prospect-read', 'prospect:read', 'Read Prospects', 'prospect', NULL, '2026-07-17 01:21:17.517');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-prospect-create', 'prospect:create', 'Create Prospects', 'prospect', NULL, '2026-07-17 01:21:17.527');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-prospect-edit', 'prospect:edit', 'Edit Prospects', 'prospect', NULL, '2026-07-17 01:21:17.537');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-prospect-delete', 'prospect:delete', 'Delete Prospects', 'prospect', NULL, '2026-07-17 01:21:17.545');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-prospect-write-prospecting', 'prospect:write:prospecting', 'Write (Prospecting)', 'prospect', NULL, '2026-07-17 01:21:17.554');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-prospect-approve-transition', 'prospect:approve:transition', 'Approve Transition', 'prospect', NULL, '2026-07-17 01:21:17.563');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-read', 'project:read', 'Read Projects', 'project', NULL, '2026-07-17 01:21:17.571');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-create', 'project:create', 'Create Projects', 'project', NULL, '2026-07-17 01:21:17.579');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-edit', 'project:edit', 'Edit Projects', 'project', NULL, '2026-07-17 01:21:17.589');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-write', 'project:write', 'Write Projects', 'project', NULL, '2026-07-17 01:21:17.597');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-delete', 'project:delete', 'Delete Projects', 'project', NULL, '2026-07-17 01:21:17.606');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-manage-members', 'project:manage:members', 'Manage Members', 'project', NULL, '2026-07-17 01:21:17.615');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-project-manage-scope', 'project:manage:scope', 'Manage Scope', 'project', NULL, '2026-07-17 01:21:17.626');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-customer-read', 'customer:read', 'Read Customers', 'customer', NULL, '2026-07-17 01:21:17.637');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-customer-write', 'customer:write', 'Create/Edit Customers', 'customer', NULL, '2026-07-17 01:21:17.648');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-pengadaan-read', 'pengadaan:read', 'Read Pengadaan', 'pengadaan', NULL, '2026-07-17 01:21:17.657');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-pengadaan-create', 'pengadaan:create', 'Create Pengadaan', 'pengadaan', NULL, '2026-07-17 01:21:17.665');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-pengadaan-write', 'pengadaan:write', 'Write Pengadaan', 'pengadaan', NULL, '2026-07-17 01:21:17.676');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-pengadaan-delete', 'pengadaan:delete', 'Delete Pengadaan', 'pengadaan', NULL, '2026-07-17 01:21:17.684');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-report-view-department', 'report:view:department', 'View Dept Reports', 'report', NULL, '2026-07-17 01:21:17.692');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-report-view-crossdept', 'report:view:crossdept', 'View Cross-Dept Reports', 'report', NULL, '2026-07-17 01:21:17.702');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-config-access', 'config:access', 'Access System Config', 'config', NULL, '2026-07-17 01:21:17.711');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-master-read', 'master:read', 'Read Master Data', 'master', NULL, '2026-07-17 01:21:17.721');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-master-write', 'master:write', 'Manage Master Data', 'master', NULL, '2026-07-17 01:21:17.731');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-rbac-read', 'rbac:read', 'Read RBAC', 'rbac', NULL, '2026-07-17 01:21:17.742');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-rbac-write', 'rbac:write', 'Manage RBAC', 'rbac', NULL, '2026-07-17 01:21:17.753');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-rks-read', 'rks:read', 'Read RKS', 'rks', NULL, '2026-07-17 01:21:17.775');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-rks-write', 'rks:write', 'Manage RKS', 'rks', NULL, '2026-07-17 01:21:17.788');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-lphs-read', 'lphs:read', 'Read LPHS', 'lphs', NULL, '2026-07-17 01:21:17.801');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-lphs-write', 'lphs:write', 'Manage LPHS', 'lphs', NULL, '2026-07-17 01:21:17.812');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-settings-read', 'settings:read', 'Read Settings', 'settings', NULL, '2026-07-17 01:21:17.823');
INSERT INTO public.permissions (id, code, name, module, description, created_at) VALUES ('perm-settings-write', 'settings:write', 'Manage Settings', 'settings', NULL, '2026-07-17 01:21:17.837');


--
-- Data for Name: price_submissions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.price_submissions (id, project_id, our_price, margin_percentage, note, reference_link, reference_url, bottom_price, submitted_at, submitted_by, created_at, updated_at) VALUES ('price-1', 'PR-2025-001', 4250000000.000000000000000000000000000000, 18.400000000000000000000000000000, 'Harga penawaran sudah termasuk biaya perizinan lingkungan.', NULL, 'https://kinetic.sharepoint.com/projects/prj-2025-001/internal-calc', NULL, '2026-07-17 01:21:19.833', 'user-2', '2026-07-17 01:21:19.833', '2026-07-17 01:21:19.833');


--
-- Data for Name: procurements; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.procurements (id, code, source_project_id, client, contract_value, location, status, phase, progress, pr_number, pr_date, pr_notes, selected_vendor, vendor_pic, vendor_contact, po_number, po_date, po_value, po_notes, target_start_date, target_end_date, unit_ready_date, unit_shipped_date, unit_received_date, actual_end_date, delivery_note, is_delivered, delivered_at, delivered_by, progress_notes, is_closed, closed_at, closed_by, created_by, created_by_user_id, created_at, updated_at, deleted_at) VALUES ('PRC-2025-001', 'PR-202601-0001', 'PR-2025-001', 'PT. Telkom Indonesia Tbk.', 753960000.000000000000000000000000000000, 'Gatot Subroto, Jakarta', 'vendor_selection', 'Vendor Selection', 35, 'PR/2026/00123', '2026-01-15 00:00:00', 'Pengadaan server dan firewall untuk data center tahap II.', 'PT. Teknologi Solusi Mandiri', 'Hendra Gunawan', '021-12345678', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, false, NULL, NULL, 'Bambang Permadi', 'user-2', '2026-01-20 00:00:00', '2026-07-17 01:21:20.457', NULL);
INSERT INTO public.procurements (id, code, source_project_id, client, contract_value, location, status, phase, progress, pr_number, pr_date, pr_notes, selected_vendor, vendor_pic, vendor_contact, po_number, po_date, po_value, po_notes, target_start_date, target_end_date, unit_ready_date, unit_shipped_date, unit_received_date, actual_end_date, delivery_note, is_delivered, delivered_at, delivered_by, progress_notes, is_closed, closed_at, closed_by, created_by, created_by_user_id, created_at, updated_at, deleted_at) VALUES ('PRC-2025-002', 'PR-202602-0001', 'PR-2025-002', 'Pemerintah Provinsi DKI Jakarta', 623085000.000000000000000000000000000000, 'Balai Kota, Jakarta', 'draft', 'Draft', 10, 'PR/2026/00145', '2026-02-01 00:00:00', 'Pengadaan switch, kabel fiber optic, dan jasa instalasi jaringan.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, false, NULL, NULL, 'Bambang Permadi', 'user-2', '2026-02-05 00:00:00', '2026-07-17 01:21:20.481', NULL);


--
-- Data for Name: procurement_items; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.procurement_items (id, procurement_id, master_item_id, quantity, quantity_received, unit_price, total_price, status, notes, created_at, updated_at) VALUES ('pr-item-001', 'PRC-2025-001', 'item-002', 2, 0, 225000000.000000000000000000000000000000, 450000000.000000000000000000000000000000, 'ordered', 'Server Rack 42U - termasuk rail kit', '2026-07-17 01:21:20.496', '2026-07-17 01:21:20.496');
INSERT INTO public.procurement_items (id, procurement_id, master_item_id, quantity, quantity_received, unit_price, total_price, status, notes, created_at, updated_at) VALUES ('pr-item-002', 'PRC-2025-001', 'item-003', 1, 0, 165600000.000000000000000000000000000000, 165600000.000000000000000000000000000000, 'ordered', 'Firewall Fortinet 200F - termasuk lisensi 3 tahun', '2026-07-17 01:21:20.513', '2026-07-17 01:21:20.513');
INSERT INTO public.procurement_items (id, procurement_id, master_item_id, quantity, quantity_received, unit_price, total_price, status, notes, created_at, updated_at) VALUES ('pr-item-003', 'PRC-2025-002', 'item-004', 5, 0, 83600000.000000000000000000000000000000, 418000000.000000000000000000000000000000, 'pending', NULL, '2026-07-17 01:21:20.524', '2026-07-17 01:21:20.524');
INSERT INTO public.procurement_items (id, procurement_id, master_item_id, quantity, quantity_received, unit_price, total_price, status, notes, created_at, updated_at) VALUES ('pr-item-004', 'PRC-2025-002', 'item-005', 10, 0, 3500000.000000000000000000000000000000, 35000000.000000000000000000000000000000, 'pending', NULL, '2026-07-17 01:21:20.536', '2026-07-17 01:21:20.536');
INSERT INTO public.procurement_items (id, procurement_id, master_item_id, quantity, quantity_received, unit_price, total_price, status, notes, created_at, updated_at) VALUES ('pr-item-005', 'PRC-2025-002', 'item-008', 1, 0, 75000000.000000000000000000000000000000, 75000000.000000000000000000000000000000, 'pending', NULL, '2026-07-17 01:21:20.545', '2026-07-17 01:21:20.545');


--
-- Data for Name: project_requirement_items; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.project_requirement_items (id, project_id, master_item_id, quantity_required, quantity_used, quantity_procured, source_deal_line_id, procurement_status, base_price, discount_percent, discount_amount, tax_percent, total_price, created_at, updated_at) VALUES ('req-001', 'PR-2025-001', 'item-002', 2, 0, 2, NULL, 'fully_submitted', 250000000.000000000000000000000000000000, 10.000000000000000000000000000000, 50000000.000000000000000000000000000000, 11.000000000000000000000000000000, 555000000.000000000000000000000000000000, '2026-07-17 01:21:20.376', '2026-07-17 01:21:20.376');
INSERT INTO public.project_requirement_items (id, project_id, master_item_id, quantity_required, quantity_used, quantity_procured, source_deal_line_id, procurement_status, base_price, discount_percent, discount_amount, tax_percent, total_price, created_at, updated_at) VALUES ('req-002', 'PR-2025-001', 'item-003', 1, 0, 1, NULL, 'fully_submitted', 180000000.000000000000000000000000000000, 8.000000000000000000000000000000, 14400000.000000000000000000000000000000, 11.000000000000000000000000000000, 198960000.000000000000000000000000000000, '2026-07-17 01:21:20.393', '2026-07-17 01:21:20.393');
INSERT INTO public.project_requirement_items (id, project_id, master_item_id, quantity_required, quantity_used, quantity_procured, source_deal_line_id, procurement_status, base_price, discount_percent, discount_amount, tax_percent, total_price, created_at, updated_at) VALUES ('req-003', 'PR-2025-001', 'item-007', 2, 0, 0, NULL, 'none', 35000000.000000000000000000000000000000, 5.000000000000000000000000000000, 3500000.000000000000000000000000000000, 11.000000000000000000000000000000, 73080000.000000000000000000000000000000, '2026-07-17 01:21:20.403', '2026-07-17 01:21:20.403');
INSERT INTO public.project_requirement_items (id, project_id, master_item_id, quantity_required, quantity_used, quantity_procured, source_deal_line_id, procurement_status, base_price, discount_percent, discount_amount, tax_percent, total_price, created_at, updated_at) VALUES ('req-004', 'PR-2025-002', 'item-004', 5, 0, 0, NULL, 'none', 95000000.000000000000000000000000000000, 12.000000000000000000000000000000, 11400000.000000000000000000000000000000, 11.000000000000000000000000000000, 500850000.000000000000000000000000000000, '2026-07-17 01:21:20.417', '2026-07-17 01:21:20.417');
INSERT INTO public.project_requirement_items (id, project_id, master_item_id, quantity_required, quantity_used, quantity_procured, source_deal_line_id, procurement_status, base_price, discount_percent, discount_amount, tax_percent, total_price, created_at, updated_at) VALUES ('req-005', 'PR-2025-002', 'item-005', 10, 0, 0, NULL, 'none', 3500000.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 11.000000000000000000000000000000, 38850000.000000000000000000000000000000, '2026-07-17 01:21:20.428', '2026-07-17 01:21:20.428');
INSERT INTO public.project_requirement_items (id, project_id, master_item_id, quantity_required, quantity_used, quantity_procured, source_deal_line_id, procurement_status, base_price, discount_percent, discount_amount, tax_percent, total_price, created_at, updated_at) VALUES ('req-006', 'PR-2025-002', 'item-008', 1, 0, 0, NULL, 'none', 75000000.000000000000000000000000000000, 0.000000000000000000000000000000, 0.000000000000000000000000000000, 11.000000000000000000000000000000, 83250000.000000000000000000000000000000, '2026-07-17 01:21:20.446', '2026-07-17 01:21:20.446');


--
-- Data for Name: procurement_allocations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.procurement_allocations (id, procurement_item_id, project_id, project_requirement_id, quantity, created_at) VALUES ('alloc-001', 'pr-item-001', 'PR-2025-001', 'req-001', 2, '2026-07-17 01:21:20.559');
INSERT INTO public.procurement_allocations (id, procurement_item_id, project_id, project_requirement_id, quantity, created_at) VALUES ('alloc-002', 'pr-item-002', 'PR-2025-001', 'req-002', 1, '2026-07-17 01:21:20.582');


--
-- Data for Name: project_competitors; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: project_departments; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.project_members (id, project_id, user_id, role_id, department_id, assigned_by, created_at) VALUES ('714427d2-4224-4f4a-80e6-2fd721f45d1e', 'PR-2025-001', 'user-2', 'role-pm', 'dept-pm', 'user-1', '2026-07-17 01:21:19.852');


--
-- Data for Name: project_phases; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: project_timeline_events; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: question_types; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-text', 'Text', 'text', NULL, false, NULL, false, true, '2026-07-17 01:21:18.793', '2026-07-17 01:21:18.793');
INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-textarea', 'Text Area', 'textarea', NULL, false, NULL, false, true, '2026-07-17 01:21:18.833', '2026-07-17 01:21:18.833');
INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-radio', 'Radio', 'radio', NULL, true, NULL, false, true, '2026-07-17 01:21:18.845', '2026-07-17 01:21:18.845');
INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-checkbox', 'Checkbox', 'checkbox', NULL, true, NULL, false, true, '2026-07-17 01:21:18.858', '2026-07-17 01:21:18.858');
INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-select', 'Select', 'select', NULL, true, NULL, false, true, '2026-07-17 01:21:18.867', '2026-07-17 01:21:18.867');
INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-number', 'Number', 'number', NULL, false, NULL, false, true, '2026-07-17 01:21:18.877', '2026-07-17 01:21:18.877');
INSERT INTO public.question_types (id, name, code, description, has_options, validation_config, is_system, is_active, created_at, updated_at) VALUES ('qt-date', 'Date', 'date', NULL, false, NULL, false, true, '2026-07-17 01:21:18.906', '2026-07-17 01:21:18.906');


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-001', 'Unit apa yang akan diadakan?', 'qt-text', 'prospect', 'Data Pribadi', true, 1, 'Contoh: AC Central, Server, Kendaraan Operasional', 'Sebutkan secara spesifik jenis unit yang dibutuhkan.', true, '2026-07-17 01:21:18.932', '2026-07-17 01:21:18.932', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-002', 'Jelaskan spesifikasi teknis unit yang dibutuhkan secara detail.', 'qt-textarea', 'prospect', 'Teknis', true, 2, 'Deskripsikan spesifikasi minimal...', 'Semakin detail spesifikasi, semakin akurat penawaran yang diterima.', true, '2026-07-17 01:21:18.95', '2026-07-17 01:21:18.95', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-003', 'Kategori pengadaan unit ini termasuk?', 'qt-radio', 'both', 'Legalitas', true, 3, NULL, NULL, true, '2026-07-17 01:21:18.962', '2026-07-17 01:21:18.962', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-004', 'Metode pengadaan apa yang akan digunakan?', 'qt-select', 'prospect', 'Legalitas', true, 4, NULL, 'Pilih metode yang sesuai dengan kebijakan perusahaan.', true, '2026-07-17 01:21:18.972', '2026-07-17 01:21:18.972', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-005', 'Fasilitas pendukung apa saja yang diperlukan?', 'qt-checkbox', 'both', 'Teknis', false, 5, NULL, 'Pilih semua yang relevan dengan kebutuhan unit.', true, '2026-07-17 01:21:18.984', '2026-07-17 01:21:18.984', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-006', 'Berapa estimasi anggaran yang tersedia untuk unit ini?', 'qt-number', 'prospect', 'Keuangan', true, 6, 'Contoh: 500000000', 'Dalam satuan Rupiah penuh (tanpa titik/koma).', true, '2026-07-17 01:21:19.004', '2026-07-17 01:21:19.004', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-007', 'Target waktu unit mulai beroperasi?', 'qt-date', 'both', 'Jadwal', true, 7, NULL, 'Perkiraan tanggal unit siap digunakan.', true, '2026-07-17 01:21:19.02', '2026-07-17 01:21:19.02', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-008', 'Lokasi pengiriman / instalasi unit?', 'qt-text', 'prospect', 'Lokasi', true, 8, 'Contoh: Jakarta Pusat, Kantor Cabang Bandung', 'Sebutkan lokasi tempat unit akan dikirim/diinstalasi.', true, '2026-07-17 01:21:19.029', '2026-07-17 01:21:19.029', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-009', 'Apakah tersedia lahan / ruang khusus untuk unit ini?', 'qt-radio', 'rks', 'Verifikasi Fisik', true, 9, NULL, 'Pastikan infrastruktur pendukung sudah siap.', true, '2026-07-17 01:21:19.043', '2026-07-17 01:21:19.043', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-010', 'Sebutkan syarat garansi dan layanan purna jual yang diharapkan.', 'qt-textarea', 'rks', 'Dokumen', false, 10, 'Contoh: Garansi 3 tahun, response time 1x24 jam...', 'Cantumkan ketentuan garansi minimal yang harus dipenuhi vendor.', true, '2026-07-17 01:21:19.075', '2026-07-17 01:21:19.075', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-011', 'Berapa estimasi volume / jumlah unit yang dibutuhkan?', 'qt-number', 'prospect', 'Keuangan', true, 11, 'Contoh: 5', 'Isikan jumlah unit yang akan diadakan.', true, '2026-07-17 01:21:19.09', '2026-07-17 01:21:19.09', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-012', 'Sumber dana pengadaan unit ini berasal dari?', 'qt-select', 'prospect', 'Keuangan', true, 12, NULL, 'Pilih sumber pendanaan yang berlaku.', true, '2026-07-17 01:21:19.105', '2026-07-17 01:21:19.105', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-013', 'Dokumen pendukung apa saja yang sudah tersedia?', 'qt-checkbox', 'both', 'Dokumen', false, 13, NULL, 'Centang dokumen yang sudah dimiliki.', true, '2026-07-17 01:21:19.118', '2026-07-17 01:21:19.118', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-014', 'Apakah unit ini merupakan pengadaan ulang (replacement)?', 'qt-radio', 'prospect', 'Lainnya', false, 14, NULL, 'Pengadaan ulang berarti mengganti unit lama yang sudah tidak layak.', true, '2026-07-17 01:21:19.138', '2026-07-17 01:21:19.138', NULL);
INSERT INTO public.questions (id, question_text, question_type_id, context, category, is_required, sort_order, placeholder_text, help_text, is_active, created_at, updated_at, deleted_at) VALUES ('q-015', 'Tanggal perkiraan pengiriman (estimasi) kapan?', 'qt-date', 'rks', 'Jadwal', true, 15, '', 'Perkiraan tanggal pengiriman dari vendor ke lokasi.', true, '2026-07-17 01:21:19.147', '2026-07-17 01:21:19.147', NULL);


--
-- Data for Name: question_options; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-001', 'q-003', 'Barang (Aset Tetap)', 0, '2026-07-17 01:21:19.16');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-002', 'q-003', 'Jasa Konsultasi', 1, '2026-07-17 01:21:19.174');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-003', 'q-003', 'Barang Habis Pakai', 2, '2026-07-17 01:21:19.183');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-004', 'q-003', 'Sewa / Leasing', 3, '2026-07-17 01:21:19.192');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-005', 'q-004', 'Tender Terbuka', 0, '2026-07-17 01:21:19.201');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-006', 'q-004', 'Tender Terbatas', 1, '2026-07-17 01:21:19.21');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-007', 'q-004', 'Penunjukan Langsung', 2, '2026-07-17 01:21:19.221');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-008', 'q-004', 'E-Purchasing (Katalog)', 3, '2026-07-17 01:21:19.233');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-009', 'q-005', 'Instalasi / Setting', 0, '2026-07-17 01:21:19.241');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-010', 'q-005', 'Pelatihan Operator', 1, '2026-07-17 01:21:19.25');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-011', 'q-005', 'Maintenance Berkala', 2, '2026-07-17 01:21:19.263');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-012', 'q-005', 'Suku Cadang Awal', 3, '2026-07-17 01:21:19.277');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-013', 'q-005', 'Dokumentasi Teknis', 4, '2026-07-17 01:21:19.289');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-014', 'q-009', 'Ya, tersedia', 0, '2026-07-17 01:21:19.298');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-015', 'q-009', 'Tidak, perlu persiapan', 1, '2026-07-17 01:21:19.307');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-016', 'q-009', 'Sedang dalam proses', 2, '2026-07-17 01:21:19.317');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-017', 'q-012', 'APBN / APBD', 0, '2026-07-17 01:21:19.326');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-018', 'q-012', 'Anggaran Perusahaan (Internal)', 1, '2026-07-17 01:21:19.336');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-019', 'q-012', 'Kredit Investasi Bank', 2, '2026-07-17 01:21:19.345');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-020', 'q-012', 'Kerjasama Pihak Ketiga (KSO)', 3, '2026-07-17 01:21:19.357');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-021', 'q-013', 'KAK (Kerangka Acuan Kerja)', 0, '2026-07-17 01:21:19.367');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-022', 'q-013', 'RAB (Rencana Anggaran Biaya)', 1, '2026-07-17 01:21:19.375');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-023', 'q-013', 'Gambar Teknis / Denah', 2, '2026-07-17 01:21:19.386');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-024', 'q-013', 'Surat Penawaran Vendor', 3, '2026-07-17 01:21:19.395');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-025', 'q-013', 'Izin / Rekomendasi Terkait', 4, '2026-07-17 01:21:19.404');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-026', 'q-014', 'Ya, replacement', 0, '2026-07-17 01:21:19.414');
INSERT INTO public.question_options (id, question_id, option_label, sort_order, created_at) VALUES ('qopt-027', 'q-014', 'Bukan, pengadaan baru', 1, '2026-07-17 01:21:19.423');


--
-- Data for Name: prospect_answers; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: prospect_answer_options; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: prospect_review_notes; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: prospect_review_questions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: prospect_timeline_events; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: rfqs; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.rfqs (id, procurement_id, number, title, description, deadline, status, selected_quote_id, created_at, created_by, sent_at, completed_at, notes, updated_at) VALUES ('rfq-001', 'PRC-2025-001', 'RFQ/2026/0001', 'RFQ Server & Firewall Data Center', 'Pengadaan server rack dan firewall untuk data center tahap II.', '2026-02-28 00:00:00', 'evaluating', 'rfq-quote-001', '2026-07-17 01:21:20.636', 'user-5', '2026-02-01 00:00:00', NULL, NULL, '2026-07-17 01:21:20.807');


--
-- Data for Name: rfq_items; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.rfq_items (id, rfq_id, name, quantity, unit, specifications, created_at) VALUES ('rfq-item-001', 'rfq-001', 'Server Rack 42U', 2, 'unit', 'Rack server 42U standar datacenter, termasuk rail kit dan PDU', '2026-07-17 01:21:20.655');
INSERT INTO public.rfq_items (id, rfq_id, name, quantity, unit, specifications, created_at) VALUES ('rfq-item-002', 'rfq-001', 'Firewall Fortinet 200F', 1, 'unit', 'Firewall Fortinet 200F with 3-year license', '2026-07-17 01:21:20.672');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.suppliers (id, name, code, type, city, phone, email, pic_name, pic_position, npwp, rating, total_projects, total_value, on_time_delivery, quality_score, compliance_score, status, notes, categories, certificates, blacklist_reason, blacklisted_at, created_by_user_id, created_at, updated_at) VALUES ('sup-001', 'PT. Teknologi Solusi Mandiri', 'TSM', 'distributor', 'Jakarta Pusat', '021-12345678', 'info@tsm.co.id', 'Hendra Gunawan', 'Sales Manager', '01.234.567.8-091.001', 4.500000000000000000000000000000, 12, 25000000000.000000000000000000000000000000, 92.000000000000000000000000000000, 88.000000000000000000000000000000, 95.000000000000000000000000000000, 'active', NULL, '["IT Infrastructure","Networking","Security"]', '["ISO 9001","ISO 27001"]', NULL, NULL, 'user-5', '2026-07-17 01:21:20.331', '2026-07-17 01:21:20.331');
INSERT INTO public.suppliers (id, name, code, type, city, phone, email, pic_name, pic_position, npwp, rating, total_projects, total_value, on_time_delivery, quality_score, compliance_score, status, notes, categories, certificates, blacklist_reason, blacklisted_at, created_by_user_id, created_at, updated_at) VALUES ('sup-002', 'CV. Mitra Elektrik Nusantara', 'MEN', 'manufacturer', 'Bandung', '022-87654321', 'sales@mitraelektrik.co.id', 'Agus Wijaya', 'Direktur', '02.345.678.9-092.002', 4.200000000000000000000000000000, 8, 18500000000.000000000000000000000000000000, 85.000000000000000000000000000000, 90.000000000000000000000000000000, 88.000000000000000000000000000000, 'active', NULL, '["Electrical","Infrastructure"]', '["ISO 9001","SNI"]', NULL, NULL, 'user-5', '2026-07-17 01:21:20.352', '2026-07-17 01:21:20.352');
INSERT INTO public.suppliers (id, name, code, type, city, phone, email, pic_name, pic_position, npwp, rating, total_projects, total_value, on_time_delivery, quality_score, compliance_score, status, notes, categories, certificates, blacklist_reason, blacklisted_at, created_by_user_id, created_at, updated_at) VALUES ('sup-003', 'PT. Global Data Systems', 'GDS', 'distributor', 'Jakarta Selatan', '021-23456789', 'contact@gds.co.id', 'Rudi Hartono', 'Branch Manager', '03.456.789.0-093.003', 3.800000000000000000000000000000, 5, 12000000000.000000000000000000000000000000, 78.000000000000000000000000000000, 82.000000000000000000000000000000, 75.000000000000000000000000000000, 'active', NULL, '["IT Hardware","Server"]', '["ISO 9001"]', NULL, NULL, 'user-5', '2026-07-17 01:21:20.362', '2026-07-17 01:21:20.362');


--
-- Data for Name: rfq_quotes; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.rfq_quotes (id, rfq_id, supplier_id, supplier_name, total_amount, delivery_time, validity_period, terms, status, evaluator_notes, submitted_at, created_at) VALUES ('rfq-quote-001', 'rfq-001', 'sup-001', 'PT. Teknologi Solusi Mandiri', 615600000.000000000000000000000000000000, '30 hari', '60 hari', 'Pembayaran termin: 30% DP, 40% saat pengiriman, 30% setelah instalasi.', 'selected', 'Harga terbaik, pengiriman cepat, garansi 3 tahun.', '2026-07-17 01:21:20.718', '2026-07-17 01:21:20.718');
INSERT INTO public.rfq_quotes (id, rfq_id, supplier_id, supplier_name, total_amount, delivery_time, validity_period, terms, status, evaluator_notes, submitted_at, created_at) VALUES ('rfq-quote-002', 'rfq-001', 'sup-002', 'CV. Mitra Elektrik Nusantara', 678000000.000000000000000000000000000000, '45 hari', '60 hari', 'Pembayaran termin: 50% DP, 50% setelah pengiriman.', 'evaluated', NULL, '2026-07-17 01:21:20.734', '2026-07-17 01:21:20.734');


--
-- Data for Name: rfq_quote_items; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.rfq_quote_items (id, quote_id, item_id, unit_price, total_price, delivery_time, notes, created_at) VALUES ('rqi-001', 'rfq-quote-001', 'rfq-item-001', 225000000.000000000000000000000000000000, 450000000.000000000000000000000000000000, '30 hari', NULL, '2026-07-17 01:21:20.746');
INSERT INTO public.rfq_quote_items (id, quote_id, item_id, unit_price, total_price, delivery_time, notes, created_at) VALUES ('rqi-002', 'rfq-quote-001', 'rfq-item-002', 165600000.000000000000000000000000000000, 165600000.000000000000000000000000000000, '30 hari', NULL, '2026-07-17 01:21:20.761');
INSERT INTO public.rfq_quote_items (id, quote_id, item_id, unit_price, total_price, delivery_time, notes, created_at) VALUES ('rqi-003', 'rfq-quote-002', 'rfq-item-001', 248000000.000000000000000000000000000000, 496000000.000000000000000000000000000000, '45 hari', NULL, '2026-07-17 01:21:20.776');
INSERT INTO public.rfq_quote_items (id, quote_id, item_id, unit_price, total_price, delivery_time, notes, created_at) VALUES ('rqi-004', 'rfq-quote-002', 'rfq-item-002', 182000000.000000000000000000000000000000, 182000000.000000000000000000000000000000, '45 hari', NULL, '2026-07-17 01:21:20.789');


--
-- Data for Name: rfq_suppliers; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.rfq_suppliers (id, rfq_id, supplier_id, created_at) VALUES ('rfs-001', 'rfq-001', 'sup-001', '2026-07-17 01:21:20.681');
INSERT INTO public.rfq_suppliers (id, rfq_id, supplier_id, created_at) VALUES ('rfs-002', 'rfq-001', 'sup-002', '2026-07-17 01:21:20.695');
INSERT INTO public.rfq_suppliers (id, rfq_id, supplier_id, created_at) VALUES ('rfs-003', 'rfq-001', 'sup-003', '2026-07-17 01:21:20.709');


--
-- Data for Name: rks; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.rks (id, project_id, nomor_tender, nama_tender, deadline_tender, aanwijzing, work_location, main_scope, additional_notes, answers, status, revision_number, submitted_at, approved_at, created_at, updated_at) VALUES ('rks-1', 'PR-2025-002', 'TND/2025/HQ/0043', 'Network Infrastructure Upgrade - Pemerintah Provinsi DKI', '2026-08-15 00:00:00', 'Ya, Terjadwal', 'Balai Kota, Jakarta', 'Pengadaan dan instalasi perangkat jaringan fiber optic, switch, router, dan firewall untuk 20 titik kantor wilayah.', 'Perhatikan persyaratan TKDN minimal 40%.', NULL, 'draft', 1, NULL, NULL, '2026-07-17 01:21:19.791', '2026-07-17 01:21:19.791');


--
-- Data for Name: rks_review_notes; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: rks_review_questions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('05fa47b3-d28e-469b-aba6-d7dcf9878022', 'role-superadmin', 'perm-dashboard-view', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('5ba04c22-5618-494f-96f0-8f8b8e36f9d4', 'role-superadmin', 'perm-notification-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('aceaf2b0-c763-4e56-abe8-9fb085d84692', 'role-superadmin', 'perm-profile-manage', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('f42456dd-fdc5-4c97-bec8-23e5b58f47e6', 'role-superadmin', 'perm-user-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('703decf0-99dc-4717-b2ef-bd66fc713bfe', 'role-superadmin', 'perm-user-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('bc368c0d-b1a4-43d8-a0a4-b892757480e2', 'role-superadmin', 'perm-user-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('5ea12905-4946-4a75-b6ee-0296302883eb', 'role-superadmin', 'perm-prospect-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3a025862-7c8f-4d44-9c36-96669650612a', 'role-superadmin', 'perm-prospect-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('643c3452-c4a2-4487-97a9-28a5a2be4d8b', 'role-superadmin', 'perm-prospect-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('aa494c3e-d04c-449c-af4f-a9af2526d209', 'role-superadmin', 'perm-prospect-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3a2f2306-6290-416f-962d-33044866a3bb', 'role-superadmin', 'perm-prospect-write-prospecting', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('69583e64-a6b0-4f7d-a157-630b78969e46', 'role-superadmin', 'perm-prospect-approve-transition', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('82312979-788f-48ef-8ceb-27ea12056e66', 'role-superadmin', 'perm-project-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('816e91c0-a9c2-4647-a48b-6dea092330e3', 'role-superadmin', 'perm-project-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('fc1e57ab-b81c-47b5-b20c-1af1cec12a42', 'role-superadmin', 'perm-project-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('bb44921c-ff8e-4129-bc99-00644126c435', 'role-superadmin', 'perm-project-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ea71d3e2-f915-457e-a984-4cd0b8bc5081', 'role-superadmin', 'perm-project-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2225bbe5-fd56-464c-a404-99d21a3daf35', 'role-superadmin', 'perm-project-manage-members', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('9fbf8d75-784c-4b6d-9ccc-a8c470903a71', 'role-superadmin', 'perm-project-manage-scope', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ccd646c3-3899-4a82-bb29-0dc147267bbb', 'role-superadmin', 'perm-customer-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('c59524d6-62ba-42bf-847e-fbeebab75150', 'role-superadmin', 'perm-customer-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('7276ef0c-c64e-44c9-b585-138753948368', 'role-superadmin', 'perm-pengadaan-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('7ab80637-a07f-4d2e-bb15-f7b120f0117f', 'role-superadmin', 'perm-pengadaan-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('5aac7776-0407-4dc6-9456-f0a78ccd003d', 'role-superadmin', 'perm-pengadaan-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('77ae91a7-6c72-4996-bf4e-1d5378fd0ae3', 'role-superadmin', 'perm-pengadaan-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('b5fb2dd4-ff90-470e-adcd-ab0c3c5df27c', 'role-superadmin', 'perm-report-view-department', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2408242d-551b-4096-ad84-adc41da07eaa', 'role-superadmin', 'perm-report-view-crossdept', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('e8cd6991-55f7-4b28-bd4e-e18cda2f99ef', 'role-superadmin', 'perm-config-access', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('742dc63f-efd1-46a3-86ad-0f88f411db55', 'role-superadmin', 'perm-master-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3175cb62-033e-4475-b78e-ac6ffefc4d01', 'role-superadmin', 'perm-master-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('59c7d68d-6cf1-43de-bf84-8c3d93f51f29', 'role-superadmin', 'perm-rbac-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('41235587-7853-4255-a40a-ceada232f05f', 'role-superadmin', 'perm-rbac-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('249f29ab-179e-4741-af67-2e73f282fc44', 'role-superadmin', 'perm-rks-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('17c9e76e-c525-48ba-870a-350838d5ea70', 'role-superadmin', 'perm-rks-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('174155bb-de77-4a66-a6a7-fccd956986f7', 'role-superadmin', 'perm-lphs-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('6b4cc91c-b503-4d49-b7d5-02a653691737', 'role-superadmin', 'perm-lphs-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('54184815-949a-4871-90cf-bb0986cb109c', 'role-superadmin', 'perm-settings-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('5af44f0f-8bfb-4604-a8e9-ff85b5d5fc7d', 'role-superadmin', 'perm-settings-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('46827ca7-662c-476f-b621-1ca53a4e5203', 'role-director', 'perm-dashboard-view', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3b1296be-280b-477a-a5ce-b5bef87b2216', 'role-director', 'perm-notification-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('819c73e5-7081-4dde-90a7-4c9c043f780a', 'role-director', 'perm-profile-manage', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('f6b57f08-2493-4ac6-ae91-7b2c32f99d56', 'role-director', 'perm-user-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('965e8d5d-9b70-4293-83be-4a705e85a4cb', 'role-director', 'perm-user-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('63c7fb75-a7cf-4772-a608-03f1df6fa096', 'role-director', 'perm-user-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('1763baf3-e05e-44df-a375-88fc741808a5', 'role-director', 'perm-prospect-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('800591f9-4d47-46d9-9874-72cf04622baa', 'role-director', 'perm-prospect-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('8b2bf889-f3bd-4299-8dd3-8cb3dffdcba6', 'role-director', 'perm-prospect-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('c0763bb7-b4ac-43fe-a6ad-f5ba89bfea58', 'role-director', 'perm-prospect-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('c72588c4-d3f7-40b7-9c76-956b77606131', 'role-director', 'perm-prospect-write-prospecting', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('57cc56f2-9a0f-49dd-b8f2-93e0c172b342', 'role-director', 'perm-prospect-approve-transition', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('91cd0041-5980-4419-a259-a0264640a480', 'role-director', 'perm-project-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('c0225a9d-c77b-4ad8-a57c-3a9bd063d953', 'role-director', 'perm-project-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('07b85449-0046-439c-9f81-5c1354d5b34b', 'role-director', 'perm-project-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('d94e17a5-ffec-4bb4-b5c2-080306535dfb', 'role-director', 'perm-project-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('04efae39-9068-40b6-97b3-56ae1c650a44', 'role-director', 'perm-project-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('49bc6ba1-6d32-4dbc-ba0d-3e007fadf02e', 'role-director', 'perm-project-manage-members', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('0a87b76e-8ad3-48fa-a8b1-9b185b6c4254', 'role-director', 'perm-project-manage-scope', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('585291c6-a186-4b15-bd9d-6b9aee8baef7', 'role-director', 'perm-customer-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('af559a07-3b9a-48ca-842e-17848c32989b', 'role-director', 'perm-customer-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('a1b6ba23-183c-4c42-976a-123d7e350b0b', 'role-director', 'perm-pengadaan-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('07ad05e4-4daf-49c9-b77f-f2eb72535a64', 'role-director', 'perm-pengadaan-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('4e01a921-e580-4346-ac81-1f677ed089c1', 'role-director', 'perm-pengadaan-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('791b0f37-d044-4a72-a24e-ff9dc17fcd84', 'role-director', 'perm-pengadaan-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3920eda2-4af3-4905-a6f0-937f588ce84d', 'role-director', 'perm-report-view-department', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('8ee29aec-2cb8-42ca-bc2d-0d876593e9ec', 'role-director', 'perm-report-view-crossdept', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('97fb87eb-1746-4d3f-a804-40e24bee2bbc', 'role-director', 'perm-config-access', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('1adc1961-1331-4824-810b-14fffb16113a', 'role-director', 'perm-master-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('b8474df5-a2d9-4641-9000-e746f0e5e1d4', 'role-director', 'perm-master-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('daad67d3-fdaa-4678-82d4-02542eac0cc9', 'role-director', 'perm-rbac-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('cc45b642-92df-45d4-9f4f-7397518b6413', 'role-director', 'perm-rbac-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('dc4683bb-d11c-48a7-a47f-42658eda4988', 'role-director', 'perm-rks-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3776e621-27d9-4c15-9526-4d35cd51b3d4', 'role-director', 'perm-rks-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2fdcf018-ab40-4fa5-885f-08c5940ec645', 'role-director', 'perm-lphs-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('545ba067-ffa9-45a0-9b82-cfa448a0baaa', 'role-director', 'perm-lphs-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ca2faa3a-0f92-453b-8ecc-a1d4568d55b9', 'role-director', 'perm-settings-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('348e7c22-d1a0-40c8-9e4e-686b90f44ac4', 'role-director', 'perm-settings-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2fb1a49d-fcdf-4e95-8032-0833c0764525', 'role-admin', 'perm-dashboard-view', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3fa3ba2a-141e-40c1-8248-e7fdb61a5e7e', 'role-admin', 'perm-notification-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('7fdd62a3-a9a6-422f-b3db-0ba099131cd7', 'role-admin', 'perm-profile-manage', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('b422e90d-8b65-41fc-8454-cdd9c01d5193', 'role-admin', 'perm-user-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2a53cbec-3099-41e6-bc58-696ff41d7837', 'role-admin', 'perm-user-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('797020c6-7be6-4bab-b1aa-96ff2f100d2a', 'role-admin', 'perm-user-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('bd711a5f-8979-4b99-ac07-5035dc999a3e', 'role-admin', 'perm-prospect-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3ca008ad-9c02-48fd-b206-cf1cc0df868b', 'role-admin', 'perm-prospect-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2329663e-a63b-4278-a8a0-b2810837e2da', 'role-admin', 'perm-prospect-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2a44355e-d2e0-4509-9118-7ad0d3bbf6e2', 'role-admin', 'perm-prospect-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('688cf8c0-a4ac-4a73-b077-92a2b87ab14f', 'role-admin', 'perm-prospect-write-prospecting', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('6a9b4b91-8c00-4e5f-a3c4-c4be2d620280', 'role-admin', 'perm-prospect-approve-transition', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('bd703665-627b-44f1-b22a-83b8f5f57111', 'role-admin', 'perm-project-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('6f136168-884c-4f2c-a871-72b63e893391', 'role-admin', 'perm-project-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('77f2485d-c55b-4652-9ff1-7cf40fb40691', 'role-admin', 'perm-project-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('37663f5f-aad1-4281-8ef1-adde094a148b', 'role-admin', 'perm-project-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('f26d2b9e-685f-4f37-9682-373d5cbbe124', 'role-admin', 'perm-project-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2a79c93a-489a-43a7-a3ac-332b76b14308', 'role-admin', 'perm-project-manage-members', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('9ffb6cc2-704e-4448-bb7b-81b09d8e123c', 'role-admin', 'perm-project-manage-scope', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('959fa6c4-3311-4b40-a25b-a26088ae2e4c', 'role-admin', 'perm-customer-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ed79e5ef-2930-4fd9-854e-b11eda28cd5d', 'role-admin', 'perm-customer-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('a0d67d6e-da0e-462b-9d8a-8e958a1e5776', 'role-admin', 'perm-pengadaan-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('d48d15ad-d177-42be-9d94-4e814ff4d21c', 'role-admin', 'perm-pengadaan-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('021a0b01-4e9f-49c0-9ff5-f4a1f6d570e6', 'role-admin', 'perm-pengadaan-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('530044c0-79ab-4035-a060-b78dcf605a2b', 'role-admin', 'perm-pengadaan-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('cb11b667-2f96-4a49-8b40-bf8ab6d7e160', 'role-admin', 'perm-report-view-department', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('db840265-e006-4433-b08a-deeb7825e5a3', 'role-admin', 'perm-report-view-crossdept', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('d814083e-2672-4512-9d6c-d7c20afa3837', 'role-admin', 'perm-config-access', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('1aeb2495-0c1f-45d5-9827-34bbf2a50f2f', 'role-admin', 'perm-master-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('4b15ad62-77d0-4a28-8641-b61c564f4422', 'role-admin', 'perm-master-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('1408cf8e-bde9-4871-94f1-1bf550c28a21', 'role-admin', 'perm-rbac-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('4ad68f54-6ffe-4e91-9de0-cc0deecb1088', 'role-admin', 'perm-rbac-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('767c02d2-f9bb-4081-966f-c8acde3969a1', 'role-admin', 'perm-rks-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('1204b4ad-be69-46b3-af30-401cc0f07bf5', 'role-admin', 'perm-rks-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('a604d346-bcbe-42ee-ad76-2d4fc9c6d144', 'role-admin', 'perm-lphs-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3b6f6995-107f-49ef-8ba8-881aa7531535', 'role-admin', 'perm-lphs-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('437e4645-1997-42b4-aeb5-edb436cd7410', 'role-admin', 'perm-settings-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ea54ef79-6e9d-4b0e-8343-b75c110d136e', 'role-admin', 'perm-settings-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('7f13b238-53b7-4e51-8194-b0e42f58feec', 'role-supervisor', 'perm-dashboard-view', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('9b178f4d-8d1d-47c8-a27b-e08976d8eb10', 'role-supervisor', 'perm-notification-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ae1d8ea5-7c71-42ff-9320-05c87b34c2da', 'role-supervisor', 'perm-profile-manage', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('aab52414-8391-4d77-9dbd-9ad0363d14cd', 'role-supervisor', 'perm-user-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('45899d6c-a362-47ae-868a-05af7d0c2cf6', 'role-supervisor', 'perm-user-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('05e8e08a-cf10-455a-8b35-dd369bb75e8e', 'role-supervisor', 'perm-user-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ea4e19cc-497f-4077-9c2c-8243cae8ebad', 'role-supervisor', 'perm-prospect-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('241c03b6-e144-4ba5-b000-25ad43ad18b7', 'role-supervisor', 'perm-prospect-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('9780c98f-5a6c-4aac-ac85-c43d9f35b9d1', 'role-supervisor', 'perm-prospect-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('f8203c5e-cb54-4537-acdd-be6738c93bb2', 'role-supervisor', 'perm-prospect-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('7f58f300-bfd8-4383-8a14-23bf01d30dd2', 'role-supervisor', 'perm-prospect-write-prospecting', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('26d997cd-09d9-4f8e-853b-87343a7cb82e', 'role-supervisor', 'perm-prospect-approve-transition', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2a6a5770-9200-4a2f-bd85-00914c7d3463', 'role-supervisor', 'perm-project-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('81453242-0e3e-4b2a-b76f-7144a59a7d55', 'role-supervisor', 'perm-project-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('dce911d5-3089-446b-9e02-ce426b1bc953', 'role-supervisor', 'perm-project-edit', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('583982c0-89eb-451d-8c82-7da2abc73aa6', 'role-supervisor', 'perm-project-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3f94d1ec-0f98-49e9-bbfe-6df0c2fcaf91', 'role-supervisor', 'perm-project-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('2615fe1e-02c7-4f01-bf05-6642ab870404', 'role-supervisor', 'perm-project-manage-members', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('1b6d5ab2-7c36-41bf-b893-afcf903a1775', 'role-supervisor', 'perm-project-manage-scope', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('a1a93fb4-778b-4708-9ad0-895dcbd8d9a7', 'role-supervisor', 'perm-customer-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('d47d2372-e193-4d53-a34f-322bca3a176c', 'role-supervisor', 'perm-customer-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('ef741390-e929-4a59-8db1-72253629cf8b', 'role-supervisor', 'perm-pengadaan-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('77963cb3-5da5-4ae1-a499-8879fc02aed6', 'role-supervisor', 'perm-pengadaan-create', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('aa8a8335-81a5-4596-a63a-83072ef89d5d', 'role-supervisor', 'perm-pengadaan-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('d9433d42-9ce3-4541-bac3-8360c2a904f6', 'role-supervisor', 'perm-pengadaan-delete', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('acc0a5c3-19f2-4f7c-a5db-a5fd3f282f08', 'role-supervisor', 'perm-report-view-department', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('6887f9b1-9723-45ac-800d-d526af1630ba', 'role-supervisor', 'perm-report-view-crossdept', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('78f8eb2e-d489-4f20-a54f-ee95ca315e35', 'role-supervisor', 'perm-config-access', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('4dd87fde-79de-4191-b84e-b64c8141447a', 'role-supervisor', 'perm-master-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('c8e07446-b233-41df-bfd7-887d12d5a680', 'role-supervisor', 'perm-master-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('d7813310-7d2e-4345-bbee-ad6d05298588', 'role-supervisor', 'perm-rbac-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('a1ed13bb-1dcc-4661-8fb0-ba5b0a56938e', 'role-supervisor', 'perm-rbac-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('cabe575a-3682-4946-8e87-018cf1388532', 'role-supervisor', 'perm-rks-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('cb80e2c7-7d43-4469-992a-4384c3157a8b', 'role-supervisor', 'perm-rks-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('e602968f-3d2b-43c1-84a8-c9c9a9ee88cd', 'role-supervisor', 'perm-lphs-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('e29007a5-3009-4dc9-8823-370cc89487bc', 'role-supervisor', 'perm-lphs-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('3ee3bc58-a859-43c0-a590-f2091097fa22', 'role-supervisor', 'perm-settings-read', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');
INSERT INTO public.role_permissions (id, role_id, permission_id, scope_type, scope_id, stage_id, access_level, created_at) VALUES ('a43038cf-729d-4d15-9f2c-e79585bde87b', 'role-supervisor', 'perm-settings-write', 'global', NULL, NULL, 'write', '2026-07-17 01:21:17.86');


--
-- Data for Name: sla_configurations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: sla_policies; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: sla_reminder_configurations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: supplier_evaluations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.supplier_evaluations (id, supplier_id, project_id, project_name, evaluator, evaluator_id, date, quality, delivery, pricing, compliance, communication, notes, overall, created_at) VALUES ('eval-001', 'sup-001', 'PR-2025-001', 'Pembangunan Infrastruktur Data Center - Tahap II', 'Bambang Permadi', 'user-2', '2025-12-15 00:00:00', 90, 85, 80, 95, 88, 'Supplier handal, respon cepat, harga kompetitif.', 87.599999999999990000000000000000, '2026-07-17 01:21:20.602');
INSERT INTO public.supplier_evaluations (id, supplier_id, project_id, project_name, evaluator, evaluator_id, date, quality, delivery, pricing, compliance, communication, notes, overall, created_at) VALUES ('eval-002', 'sup-002', 'PR-2025-001', 'Pembangunan Infrastruktur Data Center - Tahap II', 'Siti Rahmawati', 'user-5', '2025-11-20 00:00:00', 85, 90, 82, 85, 78, 'Kualitas produk baik, pengiriman tepat waktu.', 84.000000000000000000000000000000, '2026-07-17 01:21:20.625');


--
-- Data for Name: targets; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: target_progress_snapshots; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: tender_results; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: upload_config; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: upload_policy_configurations; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: upload_policy_mime_types; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--

INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-1-0', 'user-1', 'role-superadmin', 'global', NULL, NULL, NULL, '2026-07-17 01:21:18.384');
INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-1-1', 'user-1', 'role-supervisor', 'global', NULL, NULL, NULL, '2026-07-17 01:21:18.392');
INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-2-2', 'user-2', 'role-pm', 'department', 'dept-pm', NULL, NULL, '2026-07-17 01:21:18.41');
INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-3-3', 'user-3', 'role-bm', 'department', 'dept-marketing', NULL, NULL, '2026-07-17 01:21:18.44');
INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-4-4', 'user-4', 'role-staff', 'department', 'dept-finance', NULL, NULL, '2026-07-17 01:21:18.468');
INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-5-5', 'user-5', 'role-staff', 'department', 'dept-procurement', NULL, NULL, '2026-07-17 01:21:18.488');
INSERT INTO public.user_roles (id, user_id, role_id, scope_type, scope_id, assigned_by, expires_at, created_at) VALUES ('ur-user-6-6', 'user-6', 'role-staff', 'department', 'dept-pm', NULL, NULL, '2026-07-17 01:21:18.507');


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: workflow_stage_departments; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: kinetic_user
--



--
-- PostgreSQL database dump complete
--


