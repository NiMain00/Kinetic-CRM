-- AlterTable: make prospect_id optional, add customer_id
ALTER TABLE `follow_up_tasks` MODIFY `prospect_id` VARCHAR(191) NULL;
ALTER TABLE `follow_up_tasks` ADD COLUMN `customer_id` VARCHAR(191) NULL AFTER `prospect_id`;
ALTER TABLE `follow_up_tasks` ADD INDEX `follow_up_tasks_customer_id_idx`(`customer_id`);

-- Update prospect FK: CASCADE → SET NULL
ALTER TABLE `follow_up_tasks` DROP FOREIGN KEY `follow_up_tasks_prospect_id_fkey`;
ALTER TABLE `follow_up_tasks` ADD CONSTRAINT `follow_up_tasks_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key for customer_id
ALTER TABLE `follow_up_tasks` ADD CONSTRAINT `follow_up_tasks_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
