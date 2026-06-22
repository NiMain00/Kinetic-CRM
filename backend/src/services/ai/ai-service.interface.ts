export interface AiService {
  summarize(content: string, context: 'rks' | 'lphs' | 'prospect' | 'general'): Promise<string>;
  analyze(projectId: string): Promise<AnalysisResult>;
  generateEmbedding(text: string): Promise<number[]>;
  extractInsight(data: unknown, type: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}

export interface AnalysisResult {
  summary: string;
  recommendations: string[];
  risks: string[];
}
