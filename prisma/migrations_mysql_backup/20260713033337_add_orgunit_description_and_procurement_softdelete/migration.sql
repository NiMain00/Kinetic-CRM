-- AlterTable
ALTER TABLE `org_units` ADD COLUMN `description` TEXT NULL;

-- AlterTable
ALTER TABLE `procurements` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `rks` ADD COLUMN `answers` JSON NULL;

-- AlterTable
ALTER TABLE `tender_results` ADD COLUMN `duration_days` INTEGER NULL,
    ADD COLUMN `start_date` DATE NULL;
