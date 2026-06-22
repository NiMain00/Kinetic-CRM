import { GoogleGenAI } from '@google/genai';
import { AiProvider, GenerateOptions, GenerateResult } from './provider.interface';

export class GeminiAdapter implements AiProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.5-pro') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const response = await this.client.models.generateContent({
      model: options?.model || this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { maxOutputTokens: options?.maxTokens, temperature: options?.temperature ?? 0.2 },
    });
    return { text: response.text || '', status: 'success' };
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    return [];
  }

  async healthCheck(): Promise<boolean> {
    try { await this.generateText('ok'); return true; } catch { return false; }
  }
}
