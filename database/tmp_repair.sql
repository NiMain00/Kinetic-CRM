ALTER TABLE `projects` DROP INDEX `projects_source_prospect_id_active_key`;
ALTER TABLE `projects` DROP COLUMN `source_prospect_id_active`;
ALTER TABLE `projects`
  ADD COLUMN `source_prospect_id_active` VARCHAR(191)
  GENERATED ALWAYS AS (CASE WHEN `deleted_at` IS NULL THEN `source_prospect_id` ELSE NULL END) VIRTUAL;
ALTER TABLE `projects`
  ADD UNIQUE INDEX `projects_source_prospect_id_active_key` (`source_prospect_id_active`);
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_source_prospect_id_fkey`
  FOREIGN KEY (`source_prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SELECT 'REPAIR_OK' AS result;
