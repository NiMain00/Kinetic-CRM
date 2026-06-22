import { AiProvider, GenerateOptions, GenerateResult } from './provider.interface';

export class OpenAIAdapter implements AiProvider {
  async generateText(_prompt: string, _options?: GenerateOptions): Promise<GenerateResult> {
    return { text: '', status: 'success' };
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    return [];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
