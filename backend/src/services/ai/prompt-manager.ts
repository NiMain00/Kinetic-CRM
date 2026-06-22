export const PROMPTS = {
  rks_summary: (c: string) => `Ringkas dokumen RKS berikut dalam 3-5 kalimat Bahasa Indonesia:\n${c}`,
  prospect_analysis: (d: string) => `Analisis prospek berikut dan rekomendasi:\n${d}`,
  competitor_analysis: (d: string) => `Analisis perbandingan kompetitor:\n${d}`,
};
