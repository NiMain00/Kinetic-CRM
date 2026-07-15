const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    await p.$executeRawUnsafe(`ALTER TABLE \`projects\` ADD CONSTRAINT \`projects_source_prospect_id_fkey\` FOREIGN KEY (\`source_prospect_id\`) REFERENCES \`prospects\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;`);
    console.log('FK_READD: OK');
  } catch (e) {
    console.log('FK_READD ERROR:', e.message);
  }
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1);});
