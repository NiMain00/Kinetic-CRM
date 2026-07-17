/*
  # Change projects.type from ENUM to VARCHAR(50)

  The original `type` column was a Prisma `ProjectType` enum restricted to
  ('tender','prospecting'). Project kinds are config-driven (see the
  `project_types` master config, which allows e.g. e-katalog, lelang,
  swakelola, pengadaan_langsung, …). Sending any non-enum value caused a
  PrismaClientValidationError that blocked ALL project creation.

  Switching the column to VARCHAR(50) (the same approach already used for
  `status`) accepts any config-driven type and removes the runtime breakage.
  Existing 'tender'/'prospecting' rows remain valid string values.
*/

ALTER TABLE `projects` MODIFY `type` VARCHAR(50) NOT NULL;
