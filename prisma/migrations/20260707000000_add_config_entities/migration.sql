-- CreateTable
CREATE TABLE `kpi_targets` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `target_value` DOUBLE NOT NULL,
    `actual_value` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(20) NOT NULL,
    `period` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_phases` (
    `id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(100) NOT NULL,
    `phase` VARCHAR(100) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_steps` (
    `id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `assignee_role` VARCHAR(100) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_policies` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `warning_threshold` INTEGER NOT NULL,
    `critical_threshold` INTEGER NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `escalation_role` VARCHAR(100) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sla_policies_entity_type_key`(`entity_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
