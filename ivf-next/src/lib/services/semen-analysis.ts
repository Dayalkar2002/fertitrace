import { apiFetch } from '@/lib/api';
import type { CycAnalysisRecord } from '@/lib/services-server/semen-analysis.service';

export type { CycAnalysisRecord };

export async function fetchCycleSemenAnalysis(
  token: string,
  cycleId = '',
  patId = 0,
  analysisId = 0
): Promise<{ analysis: CycAnalysisRecord | null; history: CycAnalysisRecord[] }> {
  if (!token) return { analysis: null, history: [] };

  const params = new URLSearchParams();
  params.set('action', 'analysis');
  if (analysisId) params.set('analysisId', String(analysisId));
  if (cycleId) params.set('cycleId', cycleId);
  if (patId) params.set('patId', String(patId));

  try {
    const res = await apiFetch<{
      success: boolean;
      data: { analysis: CycAnalysisRecord | null; history: CycAnalysisRecord[] };
    }>(`/sperm?${params.toString()}`, {}, token);

    return res.data || { analysis: null, history: [] };
  } catch (error) {
    console.error('Failed to fetch semen analysis:', error);
    return { analysis: null, history: [] };
  }
}
