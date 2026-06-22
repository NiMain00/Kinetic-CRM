import { AiService, AnalysisResult } from './ai-service.interface';
import { AiProvider } from './provider.interface';

export class AiServiceImpl implements AiService {
  constructor(private provider: AiProvider) {}

  async summarize(content: string, context: 'rks' | 'lphs' | 'prospect' | 'general'): Promise<string> {
    const { text } = await this.provider.generateText(content);
    return text;
  }

  async analyze(_projectId: string): Promise<AnalysisResult> {
    return { summary: '', recommendations: [], risks: [] };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }

  async extractInsight(_data: unknown, _type: string): Promise<string> {
    return '';
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }
}
