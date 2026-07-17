-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_enums` (`name` VARCHAR(50) NOT NULL PRIMARY KEY) AS
SELECT 'VisitStatus' WHERE NOT EXISTS (SELECT 1 FROM `_prisma_enums` WHERE `name` = 'VisitStatus');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_enums` (`name` VARCHAR(50) NOT NULL PRIMARY KEY) AS
SELECT 'TicketStatus' WHERE NOT EXISTS (SELECT 1 FROM `_prisma_enums` WHERE `name` = 'TicketStatus');

-- CreateTable
CREATE TABLE IF NOT EXISTS `visits` (
    `id` VARCHAR(191) NOT NULL,
    `prospect_id` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NULL,
    `visit_number` INT NOT NULL,
    `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `date` DATE NOT NULL,
    `notes` TEXT NULL,
    `pic_name` VARCHAR(255) NULL,
    `pic_user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visits_prospect_id_visit_number_key`(`prospect_id`, `visit_number`),
    INDEX `visits_prospect_id_idx`(`prospect_id`),
    INDEX `visits_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `tickets` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `prospect_id` VARCHAR(191) NOT NULL,
    `from_user_id` VARCHAR(191) NOT NULL,
    `to_user_id` VARCHAR(191) NOT NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `progress` INT NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tickets_prospect_id_idx`(`prospect_id`),
    INDEX `tickets_to_user_id_idx`(`to_user_id`),
    INDEX `tickets_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_pic_user_id_fkey` FOREIGN KEY (`pic_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_prospect_id_fkey` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
