ALTER TABLE `projects` ADD CONSTRAINT `projects_source_prospect_id_fkey` FOREIGN KEY (`source_prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SHOW WARNINGS;
SHOW ENGINE INNODB STATUS\G
