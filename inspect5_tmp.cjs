const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const eng = await p.$queryRawUnsafe(`SELECT TABLE_NAME, ENGINE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='kinetic_crm' AND TABLE_NAME IN ('projects','prospects')`);
  console.log('ENGINES:', JSON.stringify(eng));
  const fk_exists = await p.$queryRawUnsafe(`SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='kinetic_crm' AND TABLE_NAME='projects' AND REFERENCED_TABLE_NAME='prospects'`);
  console.log('EXISTING_FK:', JSON.stringify(fk_exists));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
