import { createClient } from 'redis';
import { env } from '../../config/env';

const MODEL_COST_PER_1K_TOKENS: Record<string, number> = {
  'gemini-2.5-pro': 0.00125,
  'gemini-1.5-flash': 0.000075,
  'text-embedding-004': 0.0001,
};

const client = createClient({
  socket: { host: env.REDIS_HOST, port: env.REDIS_PORT },
  password: env.REDIS_PASSWORD || undefined,
});

(async () => { try { await client.connect(); } catch { /* redis optional */ } })();

export async function trackCost(tokens: number, model: string): Promise<boolean> {
  const costPer1k = MODEL_COST_PER_1K_TOKENS[model] || 0.001;
  const estimatedCost = (tokens / 1000) * costPer1k;
  const dateKey = new Date().toISOString().slice(0, 10);
  const key = `cost:ai:daily:${dateKey}`;

  try {
    const current = parseFloat(await client.get(key) || '0');
    const newTotal = current + estimatedCost;
    if (newTotal > env.AI_COST_LIMIT_USD_PER_DAY) return false;
    await client.set(key, newTotal.toString());
    await client.expire(key, 86400);
    return true;
  } catch {
    return true;
  }
}
