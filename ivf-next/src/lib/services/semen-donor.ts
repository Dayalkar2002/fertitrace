import { apiFetch } from '@/lib/api';
import type {
  SemenDonorDetail,
  SemenDonorLab,
  SemenDonorListRow,
  SemenDonorSaveInput,
} from '@/lib/services-server/semen-donor.service';

export type { SemenDonorDetail, SemenDonorLab, SemenDonorListRow, SemenDonorSaveInput };

export async function listSemenDonors(token: string): Promise<SemenDonorListRow[]> {
  const res = await apiFetch<{ success: boolean; data: SemenDonorListRow[] }>(
    '/cryo/semen-donor',
    {},
    token
  );
  return res.data || [];
}

export async function listDonorLabs(token: string): Promise<SemenDonorLab[]> {
  const res = await apiFetch<{ success: boolean; data: SemenDonorLab[] }>(
    '/cryo/semen-donor?labs=1',
    {},
    token
  );
  return res.data || [];
}

export async function getSemenDonor(token: string, donorIdSrNo: number): Promise<SemenDonorDetail> {
  const res = await apiFetch<{ success: boolean; data: SemenDonorDetail }>(
    `/cryo/semen-donor/${donorIdSrNo}`,
    {},
    token
  );
  return res.data;
}

export async function searchSemenDonorByAadhar(
  token: string,
  aadhar: string
): Promise<SemenDonorDetail | null> {
  const res = await apiFetch<{ success: boolean; data: SemenDonorDetail | null }>(
    `/cryo/semen-donor?aadhar=${encodeURIComponent(aadhar)}`,
    {},
    token
  );
  return res.data ?? null;
}

export async function saveSemenDonor(
  token: string,
  payload: SemenDonorSaveInput
): Promise<{ message: string; duplicate?: boolean; detail: SemenDonorDetail | null; list: SemenDonorListRow[] }> {
  const res = await apiFetch<{
    success: boolean;
    message: string;
    duplicate?: boolean;
    data: SemenDonorDetail | null;
    list: SemenDonorListRow[];
  }>('/cryo/semen-donor', { method: 'POST', body: JSON.stringify(payload) }, token);
  return { message: res.message, duplicate: res.duplicate, detail: res.data, list: res.list || [] };
}

export async function deleteSemenDonor(token: string, donorIdSrNo: number): Promise<SemenDonorListRow[]> {
  const res = await apiFetch<{ success: boolean; data: SemenDonorListRow[] }>(
    `/cryo/semen-donor/${donorIdSrNo}`,
    { method: 'DELETE' },
    token
  );
  return res.data || [];
}
