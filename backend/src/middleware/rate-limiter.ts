import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { env } from '../config/env';

const client = createClient({
  socket: { host: env.REDIS_HOST, port: env.REDIS_PORT },
  password: env.REDIS_PASSWORD || undefined,
});

(async () => { try { await client.connect(); } catch { /* redis optional */ } })();

export function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.sub || 'anonymous';
  const key = `rate:ai:${userId}`;
  client.incr(key).then(async (count) => {
    if (count === 1) await client.expire(key, 60);
    if (count > env.AI_RATE_LIMIT_RPM) {
      return res.status(429).json({
        success: false,
        error: { code: 'AI_RATE_LIMIT', message: 'Batas permintaan AI terlampaui. Coba lagi dalam 1 menit.' },
      });
    }
    next();
  }).catch(() => next());
}
