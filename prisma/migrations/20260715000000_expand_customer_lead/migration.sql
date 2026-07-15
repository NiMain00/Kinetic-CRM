-- DropForeignKey
ALTER TABLE `workflow_stage_departments` DROP FOREIGN KEY `workflow_stage_departments_stage_id_fkey`;

-- DropIndex
DROP INDEX `projects_source_prospect_id_active_key` ON `projects`;

-- DropIndex
DROP INDEX `projects_source_prospect_id_key` ON `projects`;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `canonical_name` VARCHAR(255) NULL,
    ADD COLUMN `level` ENUM('hot', 'medium', 'low') NULL,
    ADD COLUMN `parent_id` VARCHAR(191) NULL,
    ADD COLUMN `requirements` TEXT NULL,
    ADD COLUMN `source` VARCHAR(50) NULL,
    ADD COLUMN `unit_level` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `prospects` ADD COLUMN `source` VARCHAR(50) NULL,
    MODIFY `status` enum('lead','non_potensial','potensial','waiting_supervisor','revision','approved') NOT NULL DEFAULT 'lead';

-- AlterTable
ALTER TABLE `workflow_stage_departments` DROP PRIMARY KEY,
    MODIFY `id` varchar(191) NOT NULL,
    MODIFY `stage_id` varchar(191) NOT NULL,
    ADD PRIMARY KEY (`id` ASC);

-- CreateIndex
CREATE INDEX `customers_parent_id_fkey` ON `customers`(`parent_id` ASC);

-- CreateIndex
CREATE INDEX `projects_source_prospect_id_idx` ON `projects`(`source_prospect_id` ASC);

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_stage_departments` ADD CONSTRAINT `workflow_stage_departments_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `workflow_stages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
