const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    await p.$executeRawUnsafe(`ALTER TABLE \`projects\` ADD CONSTRAINT \`projects_source_prospect_id_fkey\` FOREIGN KEY (\`source_prospect_id\`) REFERENCES \`prospects\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;`);
    console.log('FK_READD: OK');
  } catch (e) {
    console.log('FK_READD ERROR MSG:', e.message);
  }
  const errs = await p.$queryRawUnsafe(`SHOW ENGINE INNODB STATUS`);
  // find the LATEST FOREIGN KEY ERROR section
  const statusText = errs && errs[0] ? (errs[0].Status || errs[0].status || '') : '';
  const idx = statusText.indexOf('LATEST FOREIGN KEY ERROR');
  console.log('INNODB_FK_ERR:', idx >= 0 ? statusText.slice(idx, idx + 1200) : 'NOT FOUND / ' + String(statusText).slice(0,300));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
