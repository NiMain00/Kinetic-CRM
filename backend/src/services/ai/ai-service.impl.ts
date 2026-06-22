import { AiService, AnalysisResult } from './ai-service.interface';
import { AiProvider } from './provider.interface';
import { getPrompt } from './prompt-manager';
import { trackCost } from './cost-controller';
import { env } from '../../config/env';
import { AuditLogger } from '../../utils/audit-logger';

const audit = new AuditLogger();

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function withRetry<T>(fn: () => Promise<T>, retries: number = env.AI_MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === retries) throw err;
      const isRetryable = err.message?.includes('timeout') || err.message?.includes('5') || err.status === 429;
      if (!isRetryable) throw err;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw new Error('AI service unavailable after retries');
}

export class AiServiceImpl implements AiService {
  constructor(private provider: AiProvider) {}

  async summarize(featureCode: string, data: string, userId?: string): Promise<string> {
    if (!env.AI_ENABLED) throw Object.assign(new Error('Fitur AI tidak aktif'), { statusCode: 503, errorCode: 'AI_DISABLED' });

    const prompt = getPrompt(featureCode, data);
    if (!prompt) throw Object.assign(new Error(`Template prompt tidak ditemukan: ${featureCode}`), { statusCode: 400, errorCode: 'AI_PROMPT_NOT_FOUND' });

    const result = await withRetry(() => this.provider.generateText(prompt));
    await trackCost(result.tokens || 0, env.AI_MODEL);

    audit.log('ai_request', featureCode, 'N/A', { status: 'success', provider: env.AI_PROVIDER, userId });

    return result.text;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!env.AI_ENABLED) throw Object.assign(new Error('Fitur AI tidak aktif'), { statusCode: 503, errorCode: 'AI_DISABLED' });
    return this.provider.generateEmbedding(text);
  }

  async analyze(featureCode: string, data: string, userId?: string): Promise<AnalysisResult> {
    const text = await this.summarize(featureCode, data, userId);
    return { summary: text, recommendations: [], risks: [] };
  }

  async extractInsight(featureCode: string, data: string, userId?: string): Promise<string> {
    return this.summarize(featureCode, data, userId);
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.provider.healthCheck();
    } catch {
      return false;
    }
  }
}
