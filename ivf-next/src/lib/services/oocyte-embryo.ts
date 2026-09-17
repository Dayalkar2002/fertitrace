import { apiFetch } from '@/lib/api';
import type { OocyteEmbryoOverview } from '@/lib/types/oocyte-embryo';

export async function loadOocyteEmbryoOverview(
  token: string,
  patId: number,
  satId: number
): Promise<OocyteEmbryoOverview> {
  const res = await apiFetch<{ success: boolean; data: OocyteEmbryoOverview }>(
    `/oocyte-embryo?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data;
}
