const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const orphans = await p.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM projects WHERE source_prospect_id IS NOT NULL AND source_prospect_id NOT IN (SELECT id FROM prospects)`);
  console.log('ORPHANS:', JSON.stringify(orphans.map(r=>({c:Number(r.c)}))));
  const types = await p.$queryRawUnsafe(`SELECT c1.COLUMN_TYPE AS proj_type, c2.COLUMN_TYPE AS prop_type FROM (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='projects' AND COLUMN_NAME='source_prospect_id') c1, (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='prospects' AND COLUMN_NAME='id') c2`);
  console.log('TYPES:', JSON.stringify(types));
  const coll = await p.$queryRawUnsafe(`SELECT c1.COLLATION_NAME AS proj_coll, c2.COLLATION_NAME AS prop_coll FROM (SELECT COLLATION_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='projects' AND COLUMN_NAME='source_prospect_id') c1, (SELECT COLLATION_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='prospects' AND COLUMN_NAME='id') c2`);
  console.log('COLLATIONS:', JSON.stringify(coll));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
