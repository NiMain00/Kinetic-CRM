-- Rename table: tickets → follow_up_tasks
RENAME TABLE `tickets` TO `follow_up_tasks`;

-- Rename columns: resolved_at → completed_at
ALTER TABLE `follow_up_tasks` CHANGE COLUMN `resolved_at` `completed_at` DATETIME(3) NULL;

-- Add new columns
ALTER TABLE `follow_up_tasks` ADD COLUMN `deadline` DATE NULL AFTER `notes`;

-- Change status column type (open/in_progress/resolved/closed → pending/in_progress/completed)
UPDATE `follow_up_tasks` SET `status` = 'pending' WHERE `status` = 'open';
UPDATE `follow_up_tasks` SET `status` = 'completed' WHERE `status` = 'resolved';
UPDATE `follow_up_tasks` SET `status` = 'completed' WHERE `status` = 'closed';

ALTER TABLE `follow_up_tasks` MODIFY COLUMN `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending';

-- Remove 'urgent' from priority enum
UPDATE `follow_up_tasks` SET `priority` = 'high' WHERE `priority` = 'urgent';

-- Drop old foreign keys
ALTER TABLE `follow_up_tasks` DROP FOREIGN KEY `tickets_from_user_id_fkey`;
ALTER TABLE `follow_up_tasks` DROP FOREIGN KEY `tickets_prospect_id_fkey`;
ALTER TABLE `follow_up_tasks` DROP FOREIGN KEY `tickets_to_user_id_fkey`;

-- Drop old indexes
DROP INDEX `tickets_prospect_id_idx` ON `follow_up_tasks`;
DROP INDEX `tickets_to_user_id_idx` ON `follow_up_tasks`;
DROP INDEX `tickets_status_idx` ON `follow_up_tasks`;

-- Re-create indexes with new names
CREATE INDEX `follow_up_tasks_prospect_id_idx` ON `follow_up_tasks`(`prospect_id`);
CREATE INDEX `follow_up_tasks_to_user_id_idx` ON `follow_up_tasks`(`to_user_id`);
CREATE INDEX `follow_up_tasks_status_idx` ON `follow_up_tasks`(`status`);

-- Re-add foreign keys with new names
ALTER TABLE `follow_up_tasks` ADD CONSTRAINT `follow_up_tasks_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `follow_up_tasks` ADD CONSTRAINT `follow_up_tasks_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `follow_up_tasks` ADD CONSTRAINT `follow_up_tasks_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update the tasks table priority enum (remove 'urgent')
ALTER TABLE `tasks` MODIFY COLUMN `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium';
UPDATE `tasks` SET `priority` = 'high' WHERE `priority` = 'urgent';
