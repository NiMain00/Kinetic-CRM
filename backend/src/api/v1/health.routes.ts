import { Router } from 'express';
import { createClient } from 'redis';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import fs from 'fs';

const router = Router();

router.get('/', async (_req, res) => {
  const checks: Record<string, string> = {};
  let overallStatus = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (e: any) {
    checks.database = `error: ${e.message}`;
    overallStatus = 'degraded';
  }

  try {
    const redis = createClient({
      socket: { host: env.REDIS_HOST, port: env.REDIS_PORT },
      password: env.REDIS_PASSWORD || undefined,
    });
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    checks.redis = 'ok';
  } catch (e: any) {
    checks.redis = `error: ${e.message}`;
    overallStatus = 'degraded';
  }

  try {
    await fs.promises.access(env.STORAGE_ROOT);
    checks.storage = 'ok';
  } catch {
    checks.storage = 'error: storage directory not accessible';
    overallStatus = 'degraded';
  }

  checks.ai_service = env.GEMINI_API_KEY ? 'configured' : 'not_configured';
  if (!env.GEMINI_API_KEY && overallStatus === 'ok') overallStatus = 'degraded';

  const httpStatus = overallStatus === 'ok' ? 200 : 503;
  res.status(httpStatus).json({
    success: true,
    data: {
      status: overallStatus,
      version: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      checks,
    },
  });
});

export default router;
