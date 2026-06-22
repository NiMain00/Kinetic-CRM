interface PromptTemplate {
  version: number;
  template: (...args: string[]) => string;
}

export const PROMPTS: Record<string, PromptTemplate> = {
  tender_summary: {
    version: 1,
    template: (data: string) =>
      `Buat ringkasan tender berikut dalam 3-5 kalimat Bahasa Indonesia, soroti status, nilai, deadline, dan risiko:\n${data}`,
  },
  rks_summary: {
    version: 1,
    template: (content: string) =>
      `Ringkas dokumen RKS berikut dalam Bahasa Indonesia. Sebutkan ketentuan teknis utama, syarat administrasi, dan potensi risiko:\n${content}`,
  },
  lphs_summary: {
    version: 1,
    template: (content: string) =>
      `Ringkas dokumen LPHS/SIOS berikut dalam Bahasa Indonesia. Sebutkan temuan survei utama dan rekomendasi:\n${content}`,
  },
  prospect_analysis: {
    version: 1,
    template: (data: string) =>
      `Analisis prospek berikut dan berikan rekomendasi tindakan dalam Bahasa Indonesia:\n${data}`,
  },
  customer_insight: {
    version: 1,
    template: (data: string) =>
      `Beri wawasan tentang customer berikut berdasarkan data yang tersedia dalam Bahasa Indonesia:\n${data}`,
  },
  competitor_analysis: {
    version: 1,
    template: (data: string) =>
      `Analisis perbandingan kompetitor berikut dan berikan insight strategis dalam Bahasa Indonesia:\n${data}`,
  },
  meeting_summary: {
    version: 1,
    template: (content: string) =>
      `Ringkas notulen/catatan rapat berikut dalam Bahasa Indonesia sebutkan poin utama, keputusan, dan tindak lanjut:\n${content}`,
  },
  kpi_insight: {
    version: 1,
    template: (data: string) =>
      `Analisis data KPI berikut dan berikan insight tentang kinerja serta rekomendasi perbaikan dalam Bahasa Indonesia:\n${data}`,
  },
  dashboard_summary: {
    version: 1,
    template: (data: string) =>
      `Buat ringkasan eksekutif dashboard berikut dalam 2-3 kalimat Bahasa Indonesia, soroti pencapaian utama dan area yang perlu perhatian:\n${data}`,
  },
  smart_search: {
    version: 1,
    template: (query: string) =>
      `Cari informasi relevan terkait: ${query}`,
  },
};

export function getPrompt(featureCode: string, ...args: string[]): string | null {
  const entry = PROMPTS[featureCode];
  if (!entry) return null;
  return entry.template(...args);
}
