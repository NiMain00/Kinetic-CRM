import 'dotenv/config';
import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

async function main() {
  await prisma.$connect();
  console.log('Database connected');
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

main().catch((err) => { console.error('Failed to start:', err); process.exit(1); });
