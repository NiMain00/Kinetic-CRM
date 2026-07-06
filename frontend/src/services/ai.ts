import apiClient from './api-client';
import type { ApiResponse } from '@/types/api/response';

export interface AiSuggestion {
  id: string;
  type: 'risk' | 'opportunity' | 'insight';
  title: string;
  description: string;
  confidence: number;
  relatedEntityId?: string;
}

export interface AiAnalysisResult {
  summary: string;
  suggestions: AiSuggestion[];
  riskScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export const aiService = {
  analyzeProject: (projectId: string) =>
    apiClient.get<ApiResponse<AiAnalysisResult>>(`/ai/analyze/project/${projectId}`),
  analyzeProspect: (prospectId: string) =>
    apiClient.get<ApiResponse<AiAnalysisResult>>(`/ai/analyze/prospect/${prospectId}`),
  suggestWinStrategy: (projectId: string) =>
    apiClient.get<ApiResponse<{ strategy: string; keyPoints: string[] }>>(`/ai/strategize/${projectId}`),
  predictWinRate: (projectId: string) =>
    apiClient.get<ApiResponse<{ predictedWinRate: number; confidence: number; factors: string[] }>>(`/ai/predict/${projectId}`),
  chat: (message: string, context?: { entityType?: string; entityId?: string }) =>
    apiClient.post<ApiResponse<{ reply: string }>>('/ai/chat', { message, context }),
};
