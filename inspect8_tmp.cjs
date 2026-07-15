const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const cols = await p.$queryRawUnsafe(`SELECT COLUMN_NAME, COLUMN_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kinetic_crm' AND TABLE_NAME='projects' AND COLUMN_NAME IN ('type','source_prospect_id_active')`);
  console.log('COLUMNS:', JSON.stringify(cols));
  const fk = await p.$queryRawUnsafe(`SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='kinetic_crm' AND TABLE_NAME='projects' AND REFERENCED_TABLE_NAME='prospects'`);
  console.log('FK:', JSON.stringify(fk));
  const mig = await p.$queryRawUnsafe(`SELECT migration_name, finished_at, CAST(applied_steps_count AS UNSIGNED) AS steps FROM _prisma_migrations ORDER BY started_at`);
  console.log('MIGRATIONS:', JSON.stringify(mig.map(m=>({m:m.migration_name,f:m.finished_at,s:m.steps}))));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
