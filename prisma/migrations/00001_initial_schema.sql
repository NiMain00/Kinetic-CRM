-- CreateTable
CREATE TABLE `org_units` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `unit_type` ENUM('company', 'division', 'branch', 'department') NOT NULL,
    `city` VARCHAR(100) NULL,
    `province` VARCHAR(100) NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `org_units_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `avatar_url` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `failed_login_count` INTEGER NOT NULL DEFAULT 0,
    `last_login_at` DATETIME(3) NULL,
    `org_unit_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `active_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token_jti` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `active_sessions_token_jti_key`(`token_jti`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(150) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `permission_id` VARCHAR(191) NOT NULL,
    `scope_type` ENUM('global', 'department', 'project') NULL,
    `scope_id` VARCHAR(191) NULL,
    `stage_id` VARCHAR(191) NULL,
    `access_level` ENUM('read', 'write') NOT NULL DEFAULT 'write',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `role_permissions_role_id_permission_id_scope_type_scope_id_key`(`role_id`, `permission_id`, `scope_type`, `scope_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `scope_type` ENUM('global', 'department', 'project') NOT NULL,
    `scope_id` VARCHAR(191) NULL,
    `assigned_by` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_stages` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `sequence` DOUBLE NOT NULL,
    `owner_department_code` VARCHAR(50) NOT NULL,
    `prev_department_code` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `role_id` VARCHAR(191) NULL,

    UNIQUE INDEX `workflow_stages_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_members` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NOT NULL,
    `assigned_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_members_project_id_user_id_key`(`project_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_departments` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_departments_project_id_department_id_key`(`project_id`, `department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` ENUM('swasta', 'bumn', 'pemerintah', 'asing') NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `npwp` VARCHAR(50) NULL,
    `pic_name` VARCHAR(255) NULL,
    `pic_position` VARCHAR(255) NULL,
    `pic_phone` VARCHAR(50) NULL,
    `pic_email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `province` VARCHAR(100) NULL,
    `industry_id` VARCHAR(191) NULL,
    `provider_existing` VARCHAR(255) NULL,
    `is_new` BOOLEAN NULL DEFAULT false,
    `needs_verification` BOOLEAN NULL DEFAULT false,
    `verified_at` DATETIME(3) NULL,
    `verified_by` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `customers_name_key`(`name`),
    UNIQUE INDEX `customers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `industries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `industries_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `requires_lphs` BOOLEAN NOT NULL DEFAULT true,
    `requires_rks` BOOLEAN NOT NULL DEFAULT true,
    `default_workflow_type` VARCHAR(50) NOT NULL DEFAULT 'tender',
    `color_hex` VARCHAR(7) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_categories_name_key`(`name`),
    UNIQUE INDEX `project_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_status_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `color_hex` VARCHAR(7) NOT NULL,
    `text_color_hex` VARCHAR(7) NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `is_terminal` BOOLEAN NOT NULL DEFAULT false,
    `applicable_to` VARCHAR(20) NOT NULL DEFAULT 'both',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_status_definitions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitors` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NULL,
    `min_price` DECIMAL(18, 2) NULL,
    `max_price` DECIMAL(18, 2) NULL,
    `industry_id` VARCHAR(191) NULL,
    `bidang_usaha` VARCHAR(200) NULL,
    `website` VARCHAR(255) NULL,
    `advantages` TEXT NULL,
    `description` TEXT NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `competitors_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` ENUM('text', 'textarea', 'radio', 'checkbox', 'select', 'number', 'date') NOT NULL,
    `description` TEXT NULL,
    `has_options` BOOLEAN NOT NULL DEFAULT false,
    `validation_config` TEXT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `question_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `question_text` TEXT NOT NULL,
    `question_type_id` VARCHAR(191) NOT NULL,
    `context` ENUM('prospect', 'rks', 'both') NOT NULL,
    `category` VARCHAR(100) NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `placeholder_text` TEXT NULL,
    `help_text` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `option_label` VARCHAR(200) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periods` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` ENUM('monthly', 'quarterly', 'semester', 'annual') NOT NULL,
    `year` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `periods_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `date` DATE NOT NULL,
    `type` ENUM('national', 'regional') NOT NULL,
    `year` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `holidays_date_type_key`(`date`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loss_reasons` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `category` ENUM('harga', 'teknis', 'administrasi', 'lainnya') NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loss_reasons_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `allowed_extensions` TEXT NULL,
    `max_size_mb` INTEGER NULL,
    `is_required_at_stage` TEXT NULL,
    `applicable_to` VARCHAR(20) NOT NULL DEFAULT 'both',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `document_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `client` VARCHAR(255) NOT NULL,
    `customer_id` VARCHAR(191) NULL,
    `customer_type` ENUM('existing', 'new') NULL,
    `status` ENUM('non_potensial', 'potensial', 'waiting_supervisor', 'revision', 'approved') NOT NULL DEFAULT 'potensial',
    `prospect_type` VARCHAR(50) NULL,
    `potensi_unit` INTEGER NOT NULL DEFAULT 0,
    `estimated_value` DECIMAL(18, 2) NULL,
    `description` TEXT NULL,
    `branch` VARCHAR(100) NULL,
    `branch_id` VARCHAR(191) NULL,
    `category_id` VARCHAR(191) NULL,
    `industry_id` VARCHAR(191) NULL,
    `provider_existing` VARCHAR(255) NULL,
    `project_type` VARCHAR(100) NULL,
    `is_converted` BOOLEAN NOT NULL DEFAULT false,
    `converted_to_project_id` VARCHAR(191) NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `department_id` VARCHAR(191) NULL,
    `current_stage_id` VARCHAR(191) NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `prospects_converted_to_project_id_key`(`converted_to_project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospect_answers` (
    `id` VARCHAR(191) NOT NULL,
    `prospect_id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `answer_text` TEXT NULL,
    `answer_option_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prospect_answers_prospect_id_question_id_key`(`prospect_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospect_answer_options` (
    `id` VARCHAR(191) NOT NULL,
    `prospect_answer_id` VARCHAR(191) NOT NULL,
    `question_option_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `prospect_answer_options_prospect_answer_id_question_option_i_key`(`prospect_answer_id`, `question_option_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospect_review_questions` (
    `id` VARCHAR(191) NOT NULL,
    `prospect_id` VARCHAR(191) NOT NULL,
    `review_round` INTEGER NOT NULL,
    `question_text` TEXT NOT NULL,
    `answer_text` TEXT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `answered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospect_review_notes` (
    `id` VARCHAR(191) NOT NULL,
    `prospect_id` VARCHAR(191) NOT NULL,
    `review_round` INTEGER NOT NULL,
    `note_text` TEXT NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospect_timeline_events` (
    `id` VARCHAR(191) NOT NULL,
    `prospect_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `actor` VARCHAR(255) NOT NULL,
    `role` VARCHAR(100) NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `prev_val` VARCHAR(255) NULL,
    `new_val` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `client` VARCHAR(255) NOT NULL,
    `type` ENUM('tender', 'prospecting') NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `phase` VARCHAR(50) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `estimated_value` DECIMAL(18, 2) NULL,
    `deadline_tender` DATE NULL,
    `source_prospect_id` VARCHAR(191) NULL,
    `customer_id` VARCHAR(191) NULL,
    `provider_existing` VARCHAR(255) NULL,
    `branch` VARCHAR(100) NULL,
    `branch_id` VARCHAR(191) NULL,
    `department_id` VARCHAR(191) NULL,
    `category_id` VARCHAR(191) NULL,
    `status_id` VARCHAR(191) NULL,
    `current_stage_id` VARCHAR(191) NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `scope_departments` TEXT NULL,
    `author` VARCHAR(255) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `projects_code_key`(`code`),
    UNIQUE INDEX `projects_source_prospect_id_key`(`source_prospect_id`),
    INDEX `projects_status_idx`(`status`),
    INDEX `projects_type_idx`(`type`),
    INDEX `projects_created_by_user_id_idx`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_timeline_events` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `actor` VARCHAR(255) NOT NULL,
    `role` VARCHAR(100) NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `prev_val` VARCHAR(255) NULL,
    `new_val` VARCHAR(255) NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rks` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `nomor_tender` VARCHAR(100) NULL,
    `nama_tender` VARCHAR(255) NULL,
    `deadline_tender` DATE NULL,
    `aanwijzing` VARCHAR(255) NULL,
    `work_location` VARCHAR(255) NULL,
    `main_scope` TEXT NULL,
    `additional_notes` TEXT NULL,
    `status` ENUM('draft', 'waiting_pm_approval', 'revision', 'approved') NOT NULL DEFAULT 'draft',
    `revision_number` INTEGER NOT NULL DEFAULT 1,
    `submitted_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rks_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rks_review_questions` (
    `id` VARCHAR(191) NOT NULL,
    `rks_id` VARCHAR(191) NOT NULL,
    `review_round` INTEGER NOT NULL,
    `question_text` TEXT NOT NULL,
    `answer_text` TEXT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `answered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rks_review_notes` (
    `id` VARCHAR(191) NOT NULL,
    `rks_id` VARCHAR(191) NOT NULL,
    `review_round` INTEGER NOT NULL,
    `note_text` TEXT NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lphs_sios` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `status` ENUM('draft', 'lphs_sios', 'approved') NOT NULL DEFAULT 'draft',
    `lphs_file_name` VARCHAR(255) NULL,
    `lphs_file_size` VARCHAR(50) NULL,
    `lphs_external_url` TEXT NULL,
    `sios_file_name` VARCHAR(255) NULL,
    `sios_file_size` VARCHAR(50) NULL,
    `selected_departments` TEXT NULL,
    `departments_locked` BOOLEAN NOT NULL DEFAULT false,
    `pm_approval_status` ENUM('reviewing', 'pending_pm', 'approved', 'revision_requested') NOT NULL DEFAULT 'reviewing',
    `pm_approved_at` DATETIME(3) NULL,
    `pm_approved_by` VARCHAR(191) NULL,
    `mgmt_approval_status` ENUM('reviewing', 'pending_pm', 'approved', 'revision_requested') NOT NULL DEFAULT 'reviewing',
    `mgmt_approved_at` DATETIME(3) NULL,
    `mgmt_approved_by` VARCHAR(191) NULL,
    `final_approval_status` ENUM('reviewing', 'pending_pm', 'approved', 'revision_requested') NOT NULL DEFAULT 'pending_pm',
    `final_approved_at` DATETIME(3) NULL,
    `final_approved_by` VARCHAR(191) NULL,
    `overall_status` VARCHAR(50) NOT NULL DEFAULT 'draft',
    `revision_number` INTEGER NOT NULL DEFAULT 1,
    `submitted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lphs_sios_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lphs_department_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `lphs_sios_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NOT NULL,
    `approval_status` ENUM('reviewing', 'pending_pm', 'approved', 'revision_requested') NOT NULL DEFAULT 'reviewing',
    `comment` TEXT NULL,
    `reviewed_by` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lphs_department_reviews_lphs_sios_id_department_id_key`(`lphs_sios_id`, `department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lphs_targeted_revisions` (
    `id` VARCHAR(191) NOT NULL,
    `lphs_sios_id` VARCHAR(191) NOT NULL,
    `revision_number` INTEGER NOT NULL,
    `initiated_by` VARCHAR(191) NOT NULL,
    `initiated_role` VARCHAR(20) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lphs_targeted_revision_departments` (
    `id` VARCHAR(191) NOT NULL,
    `lphs_targeted_revision_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lphs_targeted_revision_departments_lphs_targeted_revision_id_key`(`lphs_targeted_revision_id`, `department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `our_price` DECIMAL(18, 2) NOT NULL,
    `margin_percentage` DECIMAL(5, 2) NULL,
    `note` TEXT NULL,
    `reference_link` TEXT NULL,
    `reference_url` TEXT NULL,
    `bottom_price` DECIMAL(18, 2) NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submitted_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `price_submissions_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_competitors` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `competitor_id` VARCHAR(191) NOT NULL,
    `competitor_price` DECIMAL(18, 2) NULL,
    `advantage_note` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_competitors_project_id_competitor_id_key`(`project_id`, `competitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tender_results` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `result` ENUM('won', 'lost') NOT NULL,
    `contract_value` DECIMAL(18, 2) NULL,
    `loss_reason_id` VARCHAR(191) NULL,
    `loss_reason_note` TEXT NULL,
    `spk_document` TEXT NULL,
    `decided_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decided_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tender_results_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_targets` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `actual_end_date` DATE NULL,
    `note` TEXT NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `completed_by` VARCHAR(191) NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'delayed') NOT NULL DEFAULT 'scheduled',
    `pic_name` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `delivery_targets_project_id_key`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `stage_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `warning_threshold` INTEGER NOT NULL,
    `critical_threshold` INTEGER NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `escalation_role` VARCHAR(100) NOT NULL,
    `sla_working_days` INTEGER NULL,
    `is_enforcement_active` BOOLEAN NOT NULL DEFAULT true,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sla_configurations_stage_id_key`(`stage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_reminder_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `sla_configuration_id` VARCHAR(191) NOT NULL,
    `reminder_days_before` INTEGER NOT NULL,
    `escalation_role_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approvals` (
    `id` VARCHAR(191) NOT NULL,
    `resource_type` ENUM('prospect', 'rks', 'lphs_sios') NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `stage_id` VARCHAR(191) NULL,
    `assigned_to_user_id` VARCHAR(191) NULL,
    `assigned_to_role_id` VARCHAR(191) NULL,
    `assigned_to_department_id` VARCHAR(191) NULL,
    `status` ENUM('pending', 'in_progress', 'approved', 'rejected', 'superseded') NOT NULL DEFAULT 'pending',
    `decision_comment` TEXT NULL,
    `decided_by` VARCHAR(191) NULL,
    `decided_at` DATETIME(3) NULL,
    `sla_deadline` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `approvals_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_reassignments` (
    `id` VARCHAR(191) NOT NULL,
    `approval_id` VARCHAR(191) NOT NULL,
    `previous_assignee_user_id` VARCHAR(191) NULL,
    `new_assignee_user_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `reassigned_by` VARCHAR(191) NOT NULL,
    `reassigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_chains` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_chain_levels` (
    `id` VARCHAR(191) NOT NULL,
    `chain_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `order_level` INTEGER NOT NULL,
    `min_amount` DECIMAL(18, 2) NULL,
    `max_amount` DECIMAL(18, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_requests` (
    `id` VARCHAR(191) NOT NULL,
    `chain_id` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_name` VARCHAR(255) NOT NULL,
    `entity_code` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `current_level` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'in_progress', 'approved', 'rejected', 'superseded') NOT NULL DEFAULT 'pending',
    `created_by` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_request_levels` (
    `id` VARCHAR(191) NOT NULL,
    `request_id` VARCHAR(191) NOT NULL,
    `level_id` VARCHAR(191) NOT NULL,
    `level_name` VARCHAR(200) NOT NULL,
    `status` ENUM('pending', 'in_progress', 'approved', 'rejected', 'superseded') NOT NULL DEFAULT 'pending',
    `approver` VARCHAR(255) NULL,
    `note` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backup_approver_delegations` (
    `id` VARCHAR(191) NOT NULL,
    `position_id` VARCHAR(191) NOT NULL,
    `primary_user_id` VARCHAR(191) NOT NULL,
    `backup_user_id` VARCHAR(191) NOT NULL,
    `valid_from` DATE NOT NULL,
    `valid_until` DATE NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `document_type_id` VARCHAR(191) NOT NULL,
    `resource_type` ENUM('prospect', 'rks', 'lphs_sios', 'harga', 'pemenang', 'project_misc') NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_size` VARCHAR(50) NULL,
    `file_size_bytes` INTEGER NULL,
    `mime_type` VARCHAR(150) NULL,
    `storage_path` TEXT NULL,
    `version_number` INTEGER NOT NULL DEFAULT 1,
    `is_latest_version` BOOLEAN NOT NULL DEFAULT true,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `documents_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `formula_description` TEXT NOT NULL,
    `unit` ENUM('currency', 'percentage', 'count') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kpi_definitions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_weights` (
    `id` VARCHAR(191) NOT NULL,
    `kpi_definition_id` VARCHAR(191) NOT NULL,
    `weight_percentage` DECIMAL(5, 2) NOT NULL,
    `effective_from` DATE NOT NULL,
    `effective_until` DATE NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `targets` (
    `id` VARCHAR(191) NOT NULL,
    `kpi_definition_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NULL,
    `category` VARCHAR(50) NULL,
    `scope_type` ENUM('branch', 'division', 'company') NOT NULL,
    `scope_id` VARCHAR(191) NOT NULL,
    `period_id` VARCHAR(191) NOT NULL,
    `target_value` DECIMAL(18, 2) NOT NULL,
    `actual_value` DECIMAL(18, 2) NULL,
    `unit` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `status` VARCHAR(50) NULL,
    `version_number` INTEGER NOT NULL DEFAULT 1,
    `is_current_version` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `target_progress_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `target_id` VARCHAR(191) NOT NULL,
    `snapshot_date` DATE NOT NULL,
    `actual_value` DECIMAL(18, 2) NOT NULL,
    `percentage_achieved` DECIMAL(6, 2) NOT NULL,
    `traffic_light_status` ENUM('red', 'yellow', 'green') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `target_progress_snapshots_target_id_snapshot_date_key`(`target_id`, `snapshot_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(191) NOT NULL,
    `event_code` VARCHAR(100) NOT NULL,
    `event_name` VARCHAR(200) NULL,
    `template_inapp` TEXT NULL,
    `channel` ENUM('in_app', 'email') NOT NULL DEFAULT 'in_app',
    `recipient_roles` TEXT NULL,
    `available_variables` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_templates_event_code_key`(`event_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_template_recipients` (
    `id` VARCHAR(191) NOT NULL,
    `notification_template_id` VARCHAR(191) NOT NULL,
    `recipient_role_id` VARCHAR(191) NULL,
    `recipient_department_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `notification_template_id` VARCHAR(191) NULL,
    `recipient_user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('approval', 'revision', 'status_change', 'assignment', 'system') NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `resource_type` VARCHAR(50) NULL,
    `resource_id` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `entity_type` VARCHAR(50) NULL,
    `icon` VARCHAR(50) NULL,
    `color` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_recipient_user_id_read_idx`(`recipient_user_id`, `read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actor_id` VARCHAR(191) NULL,
    `actor_name` VARCHAR(255) NULL,
    `actor_initials` VARCHAR(10) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` VARCHAR(191) NULL,
    `entity_name` VARCHAR(255) NULL,
    `summary` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload_before` TEXT NULL,
    `payload_after` TEXT NULL,
    `metadata` TEXT NULL,
    `impact` VARCHAR(20) NULL DEFAULT 'Low',
    `result` ENUM('success', 'denied', 'error') NOT NULL DEFAULT 'success',
    `error_code` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload_config` (
    `id` VARCHAR(191) NOT NULL,
    `max_file_size_mb` INTEGER NOT NULL DEFAULT 10,
    `allowed_extensions` TEXT NOT NULL,
    `storage_path` VARCHAR(255) NOT NULL,
    `max_files_per_upload` INTEGER NOT NULL DEFAULT 5,
    `enable_compression` BOOLEAN NOT NULL DEFAULT true,
    `allowed_mime_types` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload_policy_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `document_type_id` VARCHAR(191) NOT NULL,
    `max_size_mb` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `upload_policy_configurations_document_type_id_key`(`document_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload_policy_mime_types` (
    `id` VARCHAR(191) NOT NULL,
    `upload_policy_configuration_id` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `upload_policy_mime_types_upload_policy_configuration_id_mime_key`(`upload_policy_configuration_id`, `mime_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `connectors` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` ENUM('API', 'Webhook', 'Email', 'Database', 'cloud_storage', 'LDAP') NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('connected', 'disconnected', 'error') NOT NULL DEFAULT 'disconnected',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `last_tested` VARCHAR(100) NULL,
    `config_json` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `integration_configurations` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value_encrypted` TEXT NOT NULL,
    `is_secret` BOOLEAN NOT NULL DEFAULT false,
    `updated_by` VARCHAR(191) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `integration_configurations_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_request_logs` (
    `id` VARCHAR(191) NOT NULL,
    `requested_by` VARCHAR(191) NOT NULL,
    `feature_code` VARCHAR(50) NOT NULL,
    `resource_type` VARCHAR(50) NULL,
    `resource_id` VARCHAR(191) NULL,
    `provider` VARCHAR(50) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `status` ENUM('success', 'failed', 'rate_limited') NOT NULL,
    `latency_ms` INTEGER NULL,
    `error_code` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_config_groups` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('form', 'filter', 'sla', 'workflow', 'other') NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `input_config_groups_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `input_config_options` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `value` VARCHAR(100) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `color_hex` VARCHAR(7) NULL,
    `metadata` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `input_config_options_group_id_value_key`(`group_id`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurements` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `source_project_id` VARCHAR(191) NULL,
    `client` VARCHAR(255) NOT NULL,
    `contract_value` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `location` VARCHAR(255) NULL,
    `status` ENUM('draft', 'purchase_request', 'vendor_selection', 'po_process', 'Delivery', 'Progress', 'Closed', 'Cancelled') NOT NULL DEFAULT 'draft',
    `phase` VARCHAR(50) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `pr_number` VARCHAR(50) NULL,
    `pr_date` DATE NULL,
    `pr_notes` TEXT NULL,
    `selected_vendor` VARCHAR(255) NULL,
    `vendor_pic` VARCHAR(255) NULL,
    `vendor_contact` VARCHAR(100) NULL,
    `po_number` VARCHAR(50) NULL,
    `po_date` DATE NULL,
    `po_value` DECIMAL(18, 2) NULL,
    `po_notes` TEXT NULL,
    `target_start_date` DATE NULL,
    `target_end_date` DATE NULL,
    `unit_ready_date` DATE NULL,
    `unit_shipped_date` DATE NULL,
    `unit_received_date` DATE NULL,
    `actual_end_date` DATE NULL,
    `delivery_note` TEXT NULL,
    `is_delivered` BOOLEAN NOT NULL DEFAULT false,
    `delivered_at` DATETIME(3) NULL,
    `delivered_by` VARCHAR(191) NULL,
    `progress_notes` TEXT NULL,
    `is_closed` BOOLEAN NOT NULL DEFAULT false,
    `closed_at` DATETIME(3) NULL,
    `closed_by` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `procurements_code_key`(`code`),
    INDEX `procurements_status_idx`(`status`),
    INDEX `procurements_source_project_id_idx`(`source_project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` ENUM('manufacturer', 'distributor', 'agent', 'contractor', 'consultant') NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `pic_name` VARCHAR(255) NULL,
    `pic_position` VARCHAR(255) NULL,
    `npwp` VARCHAR(50) NULL,
    `rating` DECIMAL(3, 1) NOT NULL DEFAULT 0,
    `total_projects` INTEGER NOT NULL DEFAULT 0,
    `total_value` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `on_time_delivery` DECIMAL(5, 1) NOT NULL DEFAULT 0,
    `quality_score` DECIMAL(5, 1) NOT NULL DEFAULT 0,
    `compliance_score` DECIMAL(5, 1) NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive', 'blacklisted') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `categories` TEXT NULL,
    `certificates` TEXT NULL,
    `blacklist_reason` TEXT NULL,
    `blacklisted_at` DATETIME(3) NULL,
    `created_by_user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suppliers_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_evaluations` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NULL,
    `project_name` VARCHAR(255) NULL,
    `evaluator` VARCHAR(255) NULL,
    `evaluator_id` VARCHAR(191) NULL,
    `date` DATE NULL,
    `quality` INTEGER NOT NULL DEFAULT 0,
    `delivery` INTEGER NOT NULL DEFAULT 0,
    `pricing` INTEGER NOT NULL DEFAULT 0,
    `compliance` INTEGER NOT NULL DEFAULT 0,
    `communication` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `overall` DECIMAL(3, 1) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfqs` (
    `id` VARCHAR(191) NOT NULL,
    `procurement_id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `deadline` DATETIME(3) NULL,
    `status` ENUM('draft', 'sent', 'evaluating', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
    `selected_quote_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rfqs_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfq_items` (
    `id` VARCHAR(191) NOT NULL,
    `rfq_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(50) NOT NULL,
    `specifications` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfq_suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `rfq_id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rfq_suppliers_rfq_id_supplier_id_key`(`rfq_id`, `supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfq_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `rfq_id` VARCHAR(191) NOT NULL,
    `supplier_id` VARCHAR(191) NOT NULL,
    `supplier_name` VARCHAR(255) NOT NULL,
    `total_amount` DECIMAL(18, 2) NOT NULL,
    `delivery_time` VARCHAR(100) NULL,
    `validity_period` VARCHAR(100) NULL,
    `terms` TEXT NULL,
    `status` ENUM('pending', 'evaluated', 'selected', 'rejected') NOT NULL DEFAULT 'pending',
    `evaluator_notes` TEXT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfq_quote_items` (
    `id` VARCHAR(191) NOT NULL,
    `quote_id` VARCHAR(191) NOT NULL,
    `item_id` VARCHAR(191) NOT NULL,
    `unit_price` DECIMAL(18, 2) NOT NULL,
    `total_price` DECIMAL(18, 2) NOT NULL,
    `delivery_time` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_items` (
    `id` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('barang', 'jasa') NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `category_name` VARCHAR(200) NOT NULL,
    `base_price` DECIMAL(18, 2) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `master_items_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deal_line_items` (
    `id` VARCHAR(191) NOT NULL,
    `deal_id` VARCHAR(191) NOT NULL,
    `master_item_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `base_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `tax_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `project_requirement_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `deal_line_items_deal_id_idx`(`deal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_requirement_items` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `master_item_id` VARCHAR(191) NOT NULL,
    `quantity_required` INTEGER NOT NULL DEFAULT 0,
    `quantity_used` INTEGER NOT NULL DEFAULT 0,
    `quantity_procured` INTEGER NOT NULL DEFAULT 0,
    `source_deal_line_id` VARCHAR(191) NULL,
    `procurement_status` ENUM('none', 'partial', 'fully_submitted', 'received') NOT NULL DEFAULT 'none',
    `base_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `tax_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_requirement_items_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_items` (
    `id` VARCHAR(191) NOT NULL,
    `procurement_id` VARCHAR(191) NOT NULL,
    `master_item_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `quantity_received` INTEGER NOT NULL DEFAULT 0,
    `unit_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'ordered', 'partial', 'received', 'cancelled') NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `procurement_items_procurement_id_idx`(`procurement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `procurement_item_id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `project_requirement_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `procurement_allocations_procurement_item_id_project_requirem_key`(`procurement_item_id`, `project_requirement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `assignee` VARCHAR(255) NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `status` ENUM('todo', 'in_progress', 'review', 'done') NOT NULL DEFAULT 'todo',
    `due_date` DATE NULL,
    `parent_id` VARCHAR(191) NULL,
    `task_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL,
    `completed_by` VARCHAR(191) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tasks_project_id_status_idx`(`project_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `sender_name` VARCHAR(255) NOT NULL,
    `sender_role` VARCHAR(100) NULL,
    `content` TEXT NOT NULL,
    `message_type` ENUM('text', 'file', 'image') NOT NULL DEFAULT 'text',
    `file_url` TEXT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size` INTEGER NULL,
    `mentions` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `chat_messages_project_id_created_at_idx`(`project_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_message_read_receipts` (
    `id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chat_message_read_receipts_message_id_user_id_key`(`message_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity_relations` (
    `id` VARCHAR(191) NOT NULL,
    `source_type` VARCHAR(50) NOT NULL,
    `source_id` VARCHAR(191) NOT NULL,
    `target_type` VARCHAR(50) NOT NULL,
    `target_id` VARCHAR(191) NOT NULL,
    `relation_type` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `entity_relations_source_type_source_id_idx`(`source_type`, `source_id`),
    INDEX `entity_relations_target_type_target_id_idx`(`target_type`, `target_id`),
    UNIQUE INDEX `entity_relations_source_type_source_id_target_type_target_id_key`(`source_type`, `source_id`, `target_type`, `target_id`, `relation_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `org_units` ADD CONSTRAINT `org_units_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_org_unit_id_fkey` FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `active_sessions` ADD CONSTRAINT `active_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_stages` ADD CONSTRAINT `workflow_stages_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_departments` ADD CONSTRAINT `project_departments_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_question_type_id_fkey` FOREIGN KEY (`question_type_id`) REFERENCES `question_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `project_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_converted_to_project_id_fkey` FOREIGN KEY (`converted_to_project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_answers` ADD CONSTRAINT `prospect_answers_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_answers` ADD CONSTRAINT `prospect_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_answers` ADD CONSTRAINT `prospect_answers_answer_option_id_fkey` FOREIGN KEY (`answer_option_id`) REFERENCES `question_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_answer_options` ADD CONSTRAINT `prospect_answer_options_prospect_answer_id_fkey` FOREIGN KEY (`prospect_answer_id`) REFERENCES `prospect_answers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_answer_options` ADD CONSTRAINT `prospect_answer_options_question_option_id_fkey` FOREIGN KEY (`question_option_id`) REFERENCES `question_options`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_review_questions` ADD CONSTRAINT `prospect_review_questions_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_review_questions` ADD CONSTRAINT `prospect_review_questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_review_notes` ADD CONSTRAINT `prospect_review_notes_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_review_notes` ADD CONSTRAINT `prospect_review_notes_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospect_timeline_events` ADD CONSTRAINT `prospect_timeline_events_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_source_prospect_id_fkey` FOREIGN KEY (`source_prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `project_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `project_status_definitions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_timeline_events` ADD CONSTRAINT `project_timeline_events_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_timeline_events` ADD CONSTRAINT `project_timeline_events_actor_fkey` FOREIGN KEY (`actor`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rks` ADD CONSTRAINT `rks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rks_review_questions` ADD CONSTRAINT `rks_review_questions_rks_id_fkey` FOREIGN KEY (`rks_id`) REFERENCES `rks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rks_review_questions` ADD CONSTRAINT `rks_review_questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rks_review_notes` ADD CONSTRAINT `rks_review_notes_rks_id_fkey` FOREIGN KEY (`rks_id`) REFERENCES `rks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rks_review_notes` ADD CONSTRAINT `rks_review_notes_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_sios` ADD CONSTRAINT `lphs_sios_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_sios` ADD CONSTRAINT `lphs_sios_pm_approved_by_fkey` FOREIGN KEY (`pm_approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_sios` ADD CONSTRAINT `lphs_sios_mgmt_approved_by_fkey` FOREIGN KEY (`mgmt_approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_sios` ADD CONSTRAINT `lphs_sios_final_approved_by_fkey` FOREIGN KEY (`final_approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_department_reviews` ADD CONSTRAINT `lphs_department_reviews_lphs_sios_id_fkey` FOREIGN KEY (`lphs_sios_id`) REFERENCES `lphs_sios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_department_reviews` ADD CONSTRAINT `lphs_department_reviews_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `org_units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_department_reviews` ADD CONSTRAINT `lphs_department_reviews_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_targeted_revisions` ADD CONSTRAINT `lphs_targeted_revisions_lphs_sios_id_fkey` FOREIGN KEY (`lphs_sios_id`) REFERENCES `lphs_sios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_targeted_revisions` ADD CONSTRAINT `lphs_targeted_revisions_initiated_by_fkey` FOREIGN KEY (`initiated_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_targeted_revision_departments` ADD CONSTRAINT `lphs_targeted_revision_departments_lphs_targeted_revision_i_fkey` FOREIGN KEY (`lphs_targeted_revision_id`) REFERENCES `lphs_targeted_revisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lphs_targeted_revision_departments` ADD CONSTRAINT `lphs_targeted_revision_departments_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `org_units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_submissions` ADD CONSTRAINT `price_submissions_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_submissions` ADD CONSTRAINT `price_submissions_submitted_by_fkey` FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_competitors` ADD CONSTRAINT `project_competitors_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_competitors` ADD CONSTRAINT `project_competitors_competitor_id_fkey` FOREIGN KEY (`competitor_id`) REFERENCES `competitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_results` ADD CONSTRAINT `tender_results_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_results` ADD CONSTRAINT `tender_results_loss_reason_id_fkey` FOREIGN KEY (`loss_reason_id`) REFERENCES `loss_reasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tender_results` ADD CONSTRAINT `tender_results_decided_by_fkey` FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_targets` ADD CONSTRAINT `delivery_targets_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sla_configurations` ADD CONSTRAINT `sla_configurations_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sla_reminder_configurations` ADD CONSTRAINT `sla_reminder_configurations_sla_configuration_id_fkey` FOREIGN KEY (`sla_configuration_id`) REFERENCES `sla_configurations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sla_reminder_configurations` ADD CONSTRAINT `sla_reminder_configurations_escalation_role_id_fkey` FOREIGN KEY (`escalation_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sla_reminder_configurations` ADD CONSTRAINT `sla_reminder_configurations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_assigned_to_user_id_fkey` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_assigned_to_role_id_fkey` FOREIGN KEY (`assigned_to_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_assigned_to_department_id_fkey` FOREIGN KEY (`assigned_to_department_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_decided_by_fkey` FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_reassignments` ADD CONSTRAINT `approval_reassignments_approval_id_fkey` FOREIGN KEY (`approval_id`) REFERENCES `approvals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_reassignments` ADD CONSTRAINT `approval_reassignments_previous_assignee_user_id_fkey` FOREIGN KEY (`previous_assignee_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_reassignments` ADD CONSTRAINT `approval_reassignments_new_assignee_user_id_fkey` FOREIGN KEY (`new_assignee_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_reassignments` ADD CONSTRAINT `approval_reassignments_reassigned_by_fkey` FOREIGN KEY (`reassigned_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_chain_levels` ADD CONSTRAINT `approval_chain_levels_chain_id_fkey` FOREIGN KEY (`chain_id`) REFERENCES `approval_chains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_chain_id_fkey` FOREIGN KEY (`chain_id`) REFERENCES `approval_chains`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_request_levels` ADD CONSTRAINT `approval_request_levels_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `approval_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backup_approver_delegations` ADD CONSTRAINT `backup_approver_delegations_primary_user_id_fkey` FOREIGN KEY (`primary_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backup_approver_delegations` ADD CONSTRAINT `backup_approver_delegations_backup_user_id_fkey` FOREIGN KEY (`backup_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backup_approver_delegations` ADD CONSTRAINT `backup_approver_delegations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_document_type_id_fkey` FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_weights` ADD CONSTRAINT `kpi_weights_kpi_definition_id_fkey` FOREIGN KEY (`kpi_definition_id`) REFERENCES `kpi_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kpi_weights` ADD CONSTRAINT `kpi_weights_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `targets` ADD CONSTRAINT `targets_kpi_definition_id_fkey` FOREIGN KEY (`kpi_definition_id`) REFERENCES `kpi_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `targets` ADD CONSTRAINT `targets_period_id_fkey` FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `targets` ADD CONSTRAINT `targets_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `target_progress_snapshots` ADD CONSTRAINT `target_progress_snapshots_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `targets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_template_recipients` ADD CONSTRAINT `notification_template_recipients_notification_template_id_fkey` FOREIGN KEY (`notification_template_id`) REFERENCES `notification_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_template_recipients` ADD CONSTRAINT `notification_template_recipients_recipient_role_id_fkey` FOREIGN KEY (`recipient_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_template_recipients` ADD CONSTRAINT `notification_template_recipients_recipient_department_id_fkey` FOREIGN KEY (`recipient_department_id`) REFERENCES `org_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_notification_template_id_fkey` FOREIGN KEY (`notification_template_id`) REFERENCES `notification_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_user_id_fkey` FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_policy_configurations` ADD CONSTRAINT `upload_policy_configurations_document_type_id_fkey` FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_policy_mime_types` ADD CONSTRAINT `upload_policy_mime_types_upload_policy_configuration_id_fkey` FOREIGN KEY (`upload_policy_configuration_id`) REFERENCES `upload_policy_configurations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `integration_configurations` ADD CONSTRAINT `integration_configurations_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_request_logs` ADD CONSTRAINT `ai_request_logs_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `input_config_options` ADD CONSTRAINT `input_config_options_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `input_config_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurements` ADD CONSTRAINT `procurements_source_project_id_fkey` FOREIGN KEY (`source_project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurements` ADD CONSTRAINT `procurements_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurements` ADD CONSTRAINT `procurements_delivered_by_fkey` FOREIGN KEY (`delivered_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurements` ADD CONSTRAINT `procurements_closed_by_fkey` FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_evaluations` ADD CONSTRAINT `supplier_evaluations_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_evaluations` ADD CONSTRAINT `supplier_evaluations_evaluator_id_fkey` FOREIGN KEY (`evaluator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfqs` ADD CONSTRAINT `rfqs_procurement_id_fkey` FOREIGN KEY (`procurement_id`) REFERENCES `procurements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfqs` ADD CONSTRAINT `rfqs_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfq_items` ADD CONSTRAINT `rfq_items_rfq_id_fkey` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfq_suppliers` ADD CONSTRAINT `rfq_suppliers_rfq_id_fkey` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfq_suppliers` ADD CONSTRAINT `rfq_suppliers_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfq_quotes` ADD CONSTRAINT `rfq_quotes_rfq_id_fkey` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfq_quotes` ADD CONSTRAINT `rfq_quotes_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfq_quote_items` ADD CONSTRAINT `rfq_quote_items_quote_id_fkey` FOREIGN KEY (`quote_id`) REFERENCES `rfq_quotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deal_line_items` ADD CONSTRAINT `deal_line_items_master_item_id_fkey` FOREIGN KEY (`master_item_id`) REFERENCES `master_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_requirement_items` ADD CONSTRAINT `project_requirement_items_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_requirement_items` ADD CONSTRAINT `project_requirement_items_master_item_id_fkey` FOREIGN KEY (`master_item_id`) REFERENCES `master_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_items` ADD CONSTRAINT `procurement_items_procurement_id_fkey` FOREIGN KEY (`procurement_id`) REFERENCES `procurements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_items` ADD CONSTRAINT `procurement_items_master_item_id_fkey` FOREIGN KEY (`master_item_id`) REFERENCES `master_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_allocations` ADD CONSTRAINT `procurement_allocations_procurement_item_id_fkey` FOREIGN KEY (`procurement_item_id`) REFERENCES `procurement_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procurement_allocations` ADD CONSTRAINT `procurement_allocations_project_requirement_id_fkey` FOREIGN KEY (`project_requirement_id`) REFERENCES `project_requirement_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_completed_by_fkey` FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_message_read_receipts` ADD CONSTRAINT `chat_message_read_receipts_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_message_read_receipts` ADD CONSTRAINT `chat_message_read_receipts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
