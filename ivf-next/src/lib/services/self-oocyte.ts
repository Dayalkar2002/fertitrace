import { apiFetch } from '@/lib/api';
import type {
  SelfFrozenOocyte,
  SelfOocyteFreezeInput,
  SelfOocyteThawInput,
} from '@/lib/services-server/self-oocyte.service';

export type { SelfFrozenOocyte, SelfOocyteFreezeInput, SelfOocyteThawInput };

export async function fetchSelfFrozenOocytes(
  token: string,
  patId: number,
  satId: number
): Promise<SelfFrozenOocyte[]> {
  const res = await apiFetch<{ success: boolean; data: SelfFrozenOocyte[] }>(
    `/clinical/self-oocyte?action=frozen-inventory&patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data || [];
}

export async function submitSelfOocyteFreeze(
  token: string,
  payload: SelfOocyteFreezeInput
) {
  return apiFetch<{ success: boolean; data: { totalFrozen: number; cycleId: string } }>(
    '/clinical/self-oocyte',
    {
      method: 'POST',
      body: JSON.stringify({ action: 'freeze', ...payload }),
    },
    token
  );
}

export async function submitSelfOocyteThaw(
  token: string,
  payload: SelfOocyteThawInput
) {
  return apiFetch<{
    success: boolean;
    data: {
      totalThawed: number;
      survivedMII: number;
      survivedMI: number;
      survivedGV: number;
      degenerated: number;
      thawCycleId: string;
    };
  }>(
    '/clinical/self-oocyte',
    {
      method: 'POST',
      body: JSON.stringify({ action: 'thaw', ...payload }),
    },
    token
  );
}

export async function updateSingleOocyteLocation(
  token: string,
  oocyteId: number,
  location: string
) {
  return apiFetch<{ success: boolean; message?: string }>(
    '/clinical/self-oocyte',
    {
      method: 'PATCH',
      body: JSON.stringify({ oocyteId, location }),
    },
    token
  );
}
