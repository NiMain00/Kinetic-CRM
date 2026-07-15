const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const idx = await p.$queryRawUnsafe(`SHOW INDEX FROM projects`);
  const keys = idx.map(i=>({key:i.Key_name,nonUnique:Number(i.Non_unique),col:i.Column_name}));
  console.log('INDEXES:', JSON.stringify(keys));
  const mig = await p.$queryRawUnsafe(`SELECT migration_name, finished_at, CAST(applied_steps_count AS UNSIGNED) AS steps, started_at FROM _prisma_migrations ORDER BY started_at`);
  console.log('MIGRATIONS:', JSON.stringify(mig.map(m=>({m:m.migration_name,f:m.finished_at,s:m.steps}))));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
