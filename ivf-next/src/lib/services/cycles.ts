import { apiFetch } from '@/lib/api';
import type {
  CycleCreationPayload,
  CycleCreationResult,
  CycleEntry,
  CycleEntryPayload,
  DonorAadharCheck,
  PatientCycleRow,
  RetrievalConfig,
  RetrievalData,
  SourceOption,
} from '@/lib/types/cycle';

export async function previewCycleId(token: string, patId: number, satId: number): Promise<string> {
  const res = await apiFetch<{ success: boolean; data: { cycleId: string } }>(
    `/cycles/creation?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data.cycleId;
}

export async function saveCycleCreation(
  token: string,
  payload: CycleCreationPayload
): Promise<CycleCreationResult> {
  const res = await apiFetch<{ success: boolean; data: CycleCreationResult; message: string }>(
    '/cycles/creation',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
  return res.data;
}

export async function fetchRetrievalRecipients(token: string, patId: number, satId: number, cycleId: string) {
  const params = new URLSearchParams({ patId: String(patId), satId: String(satId), cycleId });
  const res = await apiFetch<{
    success: boolean;
    data: { lockedRecipientId: number; recipients: { id: number; name: string }[] };
  }>(`/cycles/retrieval-lookups?${params}`, {}, token);
  return res.data;
}

export async function fetchRecipientCycles(token: string, recipientId: number, satId: number, cycleId: string) {
  const params = new URLSearchParams({
    recipientId: String(recipientId),
    satId: String(satId),
    cycleId,
  });
  const res = await apiFetch<{ success: boolean; data: { cycles: { id: string; label: string }[] } }>(
    `/cycles/retrieval-lookups?${params}`,
    {},
    token
  );
  return res.data.cycles || [];
}

export async function listPatientCycles(
  token: string,
  patId: number,
  satId: number
): Promise<PatientCycleRow[]> {
  const res = await apiFetch<{ success: boolean; data: PatientCycleRow[] }>(
    `/cycles/list?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data || [];
}

export async function fetchCycleTypes(token: string): Promise<{
  oocyteSources: SourceOption[];
  semenSources: SourceOption[];
}> {
  const res = await apiFetch<{
    success: boolean;
    data: { oocyteSources: SourceOption[]; semenSources: SourceOption[] };
  }>('/cycles/types', {}, token);
  return res.data;
}

export async function saveCycleEntry(
  token: string,
  entry: CycleEntryPayload
): Promise<CycleEntry> {
  const res = await apiFetch<{ success: boolean; data: CycleEntry; message: string }>(
    '/cycles/entry',
    { method: 'POST', body: JSON.stringify(entry) },
    token
  );
  return res.data;
}

export async function fetchRetrievalConfig(
  token: string,
  cycleId: string
): Promise<RetrievalConfig> {
  const res = await apiFetch<{ success: boolean; data: RetrievalConfig }>(
    `/cycles/${cycleId}/retrieval-config`,
    {},
    token
  );
  return res.data;
}

export async function saveRetrieval(
  token: string,
  cycleId: string,
  sections: RetrievalData
): Promise<CycleEntry> {
  const res = await apiFetch<{ success: boolean; data: CycleEntry; message: string }>(
    `/cycles/${cycleId}/retrieval`,
    { method: 'POST', body: JSON.stringify({ sections }) },
    token
  );
  return res.data;
}

export async function checkDonorAadhar(
  token: string,
  donorPatId: number,
  recipientPatId: number,
  excludeCycId?: string
): Promise<DonorAadharCheck> {
  const params = new URLSearchParams({
    donorPatId: String(donorPatId),
    recipientPatId: String(recipientPatId),
  });
  if (excludeCycId) params.set('excludeCycId', excludeCycId);
  const res = await apiFetch<{ success: boolean; data: DonorAadharCheck }>(
    `/cycles/donor-aadhar-check?${params.toString()}`,
    {},
    token
  );
  return res.data;
}
