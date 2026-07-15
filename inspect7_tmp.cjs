const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    await p.$executeRawUnsafe(`ALTER TABLE \`projects\` ADD CONSTRAINT \`projects_source_prospect_id_fkey\` FOREIGN KEY (\`source_prospect_id\`) REFERENCES \`prospects\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;`);
    console.log('FK_READD: OK');
  } catch (e) {
    console.log('FK_READD ERROR:', e.message.split('\n')[0]);
  }
  const w = await p.$queryRawUnsafe(`SHOW WARNINGS`);
  console.log('WARNINGS:', JSON.stringify(w.map(r=>({lvl:r.Level,code:r.Code,msg:r.Message}))));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
