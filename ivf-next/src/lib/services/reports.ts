import { apiFetch } from '@/lib/api';
import type {
  ArtCycleOption,
  ArtCycleSummaryResult,
  IuiReportId,
  IuiSummaryResult,
} from '@/lib/types/reports';

export type { ArtCycleOption, ArtCycleSummaryResult, IuiReportId, IuiSummaryResult };

export async function listIuiReportIds(
  token: string,
  patId: number,
  satId: number
): Promise<IuiReportId[]> {
  const res = await apiFetch<{ success: boolean; data: IuiReportId[] }>(
    `/reports/iui?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data || [];
}

export async function loadIuiSummary(
  token: string,
  patId: number,
  satId: number,
  iuiId: string,
  label = ''
): Promise<IuiSummaryResult> {
  const qs = new URLSearchParams({
    patId: String(patId),
    satId: String(satId),
    iuiId,
    label,
  });
  const res = await apiFetch<{ success: boolean; data: IuiSummaryResult }>(
    `/reports/iui?${qs.toString()}`,
    {},
    token
  );
  return res.data;
}

export async function listArtCycles(
  token: string,
  patId: number,
  satId: number
): Promise<ArtCycleOption[]> {
  const res = await apiFetch<{ success: boolean; data: ArtCycleOption[] }>(
    `/reports/art-cycle?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data || [];
}

export async function loadArtCycleSummary(token: string, cycleId: string): Promise<ArtCycleSummaryResult> {
  const res = await apiFetch<{ success: boolean; data: ArtCycleSummaryResult }>(
    `/reports/art-cycle?cycleId=${encodeURIComponent(cycleId)}`,
    {},
    token
  );
  return res.data;
}
