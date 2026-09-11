import { apiFetch } from '@/lib/api';

export interface DashboardKpis {
  patients: number;
  satellites: number;
  cycles: number;
  iui: number;
  ivf: number;
  et: number;
  bt: number;
  oocytes?: number;
  embryos?: number;
  cryo?: number;
  witness?: number;
}

export interface DashboardModule {
  key: string;
  label: string;
  href: string;
  count: number;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  recentCycles: Array<{ id: string; date: string | null; type: string; outcome: string }>;
  recentIui: Array<{ id: string; date: string | null; outcome: string }>;
  modules: DashboardModule[];
}

export async function fetchDashboardSummary(
  token: string,
  opts?: { patId?: number; satId?: number }
): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (opts?.patId) params.set('patId', String(opts.patId));
  if (opts?.satId) params.set('satId', String(opts.satId));
  const qs = params.toString();
  const res = await apiFetch<{ success: boolean; data: DashboardSummary }>(
    `/dashboard${qs ? `?${qs}` : ''}`,
    {},
    token
  );
  return res.data;
}
