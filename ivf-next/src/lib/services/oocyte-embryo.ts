import { apiFetch } from '@/lib/api';
import type { OocyteEmbryoOverview } from '@/lib/types/oocyte-embryo';

export async function loadOocyteEmbryoOverview(
  token: string,
  patId: number,
  satId: number,
  cycleId?: string
): Promise<OocyteEmbryoOverview> {
  const qs = new URLSearchParams({
    patId: String(patId),
    satId: String(satId),
  });
  if (cycleId) {
    qs.set('cycleId', cycleId.trim());
  }
  const res = await apiFetch<{ success: boolean; data: OocyteEmbryoOverview }>(
    `/oocyte-embryo?${qs.toString()}`,
    {},
    token
  );
  return res.data;
}
