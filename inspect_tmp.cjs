const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const cols = await p.$queryRawUnsafe(`SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='kinetic_crm' AND TABLE_NAME='projects' AND COLUMN_NAME IN ('source_prospect_id','source_prospect_id_active','type')`);
  console.log('COLUMNS:', JSON.stringify(cols));
  const idx = await p.$queryRawUnsafe(`SHOW INDEX FROM projects WHERE Key_name LIKE '%source_prospect_id%'`);
  console.log('INDEXES:', JSON.stringify(idx.map(i=>({key:i.Key_name,nonUnique:i.Non_unique}))));
  const mig = await p.$queryRawUnsafe(`SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at`);
  console.log('MIGRATIONS:', JSON.stringify(mig));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
