import { GoogleGenAI } from '@google/genai';
import { AiProvider, GenerateOptions, GenerateResult } from './provider.interface';
import { env } from '../../config/env';

export class GeminiAdapter implements AiProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new GoogleGenAI({ apiKey: apiKey || env.GEMINI_API_KEY });
    this.model = model || env.AI_MODEL;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (env.AI_TIMEOUT_SECONDS || 30) * 1000);

    try {
      const response = await this.client.models.generateContent({
        model: options?.model || this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: options?.maxTokens || env.AI_MAX_TOKENS,
          temperature: options?.temperature ?? env.AI_TEMPERATURE,
        },
      });
      const text = response.text || '';
      if (!text) throw new Error('AI returned empty response');
      const tokens = (response as any).usageMetadata?.totalTokenCount || 0;
      return { text, status: 'success', tokens };
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('AI request timed out');
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.models.generateContent({
        model: env.AI_EMBEDDING_MODEL,
        contents: [{ role: 'user', parts: [{ text }] }],
      });
      const embedding = (response as any)?.embedding?.values as number[];
      return embedding || [];
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generateText('ok', { maxTokens: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
