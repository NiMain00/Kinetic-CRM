-- Replace the hard unique index on source_prospect_id with a soft-delete-aware
-- unique index so a prospect can be re-converted after its project is soft-deleted.
-- MySQL has no partial/filtered unique indexes, so we use a STORED generated column
-- that holds the prospect id only while the row is active (NULL once soft-deleted),
-- and a unique index on it. MySQL ignores NULLs in unique indexes, so soft-deleted
-- rows no longer collide while two ACTIVE projects for the same prospect still do.

-- NOTE: the plain index `projects_source_prospect_id_idx` and the DROP of the old unique index
-- `projects_source_prospect_id_key` were already applied by earlier partial runs. Remaining steps:

-- MySQL 8 refuses to create a STORED generated column whose expression references a FK column,
-- so temporarily drop the FK, create the generated column, then re-add the FK (the plain index
-- above backs it).
-- IMPORTANT: the column MUST be VIRTUAL, not STORED. MySQL (error 1215) forbids adding an
-- ON DELETE SET NULL / ON UPDATE CASCADE foreign key on a column that is the base of a STORED
-- generated column, so a STORED column makes the FK re-add below impossible. A VIRTUAL column
-- still supports a UNIQUE index and does not block the cascading FK.
ALTER TABLE `projects` DROP FOREIGN KEY `projects_source_prospect_id_fkey`;

-- Generated column carries the prospect id only while the project is active.
ALTER TABLE `projects`
  ADD COLUMN `source_prospect_id_active` VARCHAR(191)
  GENERATED ALWAYS AS (CASE WHEN `deleted_at` IS NULL THEN `source_prospect_id` ELSE NULL END) VIRTUAL;

-- Unique only among active rows (NULLs are not compared in a unique index).
ALTER TABLE `projects`
  ADD UNIQUE INDEX `projects_source_prospect_id_active_key` (`source_prospect_id_active`);

-- Re-create the FK (ON DELETE SET NULL) exactly as it was.
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_source_prospect_id_fkey`
  FOREIGN KEY (`source_prospect_id`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
