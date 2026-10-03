import { apiFetch } from '@/lib/api';
import type { CryoMatchRow, CryoScanValidationResult } from '@/lib/services-server/cryonavigation.service';

export type { CryoMatchRow, CryoScanValidationResult };

export async function fetchCryoInventory(
  token: string,
  patId?: number,
  filterBarcode?: string
): Promise<CryoMatchRow[]> {
  const qs = new URLSearchParams();
  qs.set('action', 'inventory');
  if (patId !== undefined) qs.set('patId', String(patId));
  if (filterBarcode) qs.set('query', filterBarcode);

  const res = await apiFetch<{ success: boolean; data: CryoMatchRow[] }>(
    `/cryonavigation?${qs.toString()}`,
    {},
    token
  );
  return res.data || [];
}

export async function validateCryoScanApi(
  token: string,
  scannedCode: string,
  expectedPatId?: number
): Promise<CryoScanValidationResult> {
  const res = await apiFetch<{ success: boolean; data: CryoScanValidationResult }>(
    '/cryonavigation',
    {
      method: 'POST',
      body: JSON.stringify({
        action: 'validate',
        scannedCode,
        expectedPatId,
      }),
    },
    token
  );
  return res.data;
}
