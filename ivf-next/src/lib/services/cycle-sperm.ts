import { apiFetch } from '@/lib/api';

export interface CycleAnalysisSemenDetails {
  analysisId: string;
  spermTypeName: string;
  freezingId: string;
  vol: string;
  sperms: string;
  motility: string;
  progMotility: string;
  grade1: string;
  grade2: string;
  grade3: string;
  grade4: string;
  wbc: string;
  rbc: string;
  source: 'analysis';
}

export async function loadCycleAnalysisSemen(
  token: string,
  cycleId: string,
  patId: number
): Promise<CycleAnalysisSemenDetails | null> {
  if (!cycleId || !patId) return null;
  const res = await apiFetch<{ success: boolean; data: CycleAnalysisSemenDetails | null }>(
    `/cycles/${encodeURIComponent(cycleId)}/sperm-details?patId=${patId}`,
    {},
    token
  );
  return res.data ?? null;
}
