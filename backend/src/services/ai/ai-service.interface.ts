export interface AiService {
  summarize(content: string, context: 'rks' | 'lphs' | 'prospect' | 'general'): Promise<string>;
  analyze(featureCode: string, data: string, userId?: string): Promise<AnalysisResult>;
  generateEmbedding(text: string): Promise<number[]>;
  extractInsight(featureCode: string, data: string, userId?: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}

export interface AnalysisResult {
  summary: string;
  recommendations: string[];
  risks: string[];
}
