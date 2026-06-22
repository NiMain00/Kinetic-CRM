export interface AiProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  generateEmbedding(text: string): Promise<number[]>;
  healthCheck(): Promise<boolean>;
}

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  status: 'success' | 'error';
  tokens?: number;
}
