import { apiFetch } from '@/lib/api';
import type { SemenSelfRecord } from '@/lib/services-server/semen-self.service';

export type { SemenSelfRecord };

export async function listSemenSelf(
  token: string,
  patientId: number,
  satId: number
): Promise<SemenSelfRecord[]> {
  const res = await apiFetch<{ success: boolean; data: SemenSelfRecord[] }>(
    `/cryo/semen-self?patientId=${patientId}&satId=${satId || 0}`,
    {},
    token
  );
  return res.data || [];
}

export async function deleteSemenSelf(
  token: string,
  payload: { patientId: number; satId: number; cycSSID: number; freezingId: string }
): Promise<SemenSelfRecord[]> {
  const res = await apiFetch<{ success: boolean; data: SemenSelfRecord[] }>(
    '/cryo/semen-self',
    { method: 'DELETE', body: JSON.stringify(payload) },
    token
  );
  return res.data || [];
}
