-- Create workflow_stage_departments table
CREATE TABLE IF NOT EXISTS `workflow_stage_departments` (
  `id` VARCHAR(36) NOT NULL,
  `stage_id` VARCHAR(36) NOT NULL,
  `department_code` VARCHAR(50) NOT NULL,
  `access_level` ENUM('read', 'write') NOT NULL DEFAULT 'read',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `workflow_stage_departments_stage_id_department_code_key` (`stage_id`, `department_code`),
  INDEX `workflow_stage_departments_stage_id_idx` (`stage_id`),
  CONSTRAINT `workflow_stage_departments_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
