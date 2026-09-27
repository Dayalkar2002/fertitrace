import { apiFetch } from '@/lib/api';
import type {
  CycleHistory,
  CycleMonitoring,
  CycleOutcome,
  CycleSurvival,
  TabMasters,
} from '@/lib/types/cycle-detail';

export async function loadHistory(token: string, cycleId: string) {
  const res = await apiFetch<{
    success: boolean;
    data: { data: CycleHistory; masters: TabMasters };
  }>(`/cycles/${cycleId}/history`, {}, token);
  return res.data;
}

export async function saveHistory(token: string, cycleId: string, payload: CycleHistory) {
  const res = await apiFetch<{ success: boolean; data: CycleHistory; message: string }>(
    `/cycles/${cycleId}/history`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
  return res;
}

export async function loadSurvival(token: string, cycleId: string) {
  const res = await apiFetch<{ success: boolean; data: { data: CycleSurvival } }>(
    `/cycles/${cycleId}/survival`,
    {},
    token
  );
  return res.data.data;
}

export async function saveSurvival(token: string, cycleId: string, payload: CycleSurvival) {
  return apiFetch<{ success: boolean; data: CycleSurvival; message: string }>(
    `/cycles/${cycleId}/survival`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function loadMonitoring(token: string, cycleId: string) {
  const res = await apiFetch<{
    success: boolean;
    data: {
      data: CycleMonitoring;
      masters: TabMasters;
      monitoringSheet?: string;
      chartValues?: Record<string, Record<string, string>>;
    };
  }>(`/cycles/${cycleId}/monitoring`, {}, token);
  return res.data;
}

export async function saveMonitoring(token: string, cycleId: string, payload: CycleMonitoring) {
  return apiFetch<{ success: boolean; data: CycleMonitoring; message: string }>(
    `/cycles/${cycleId}/monitoring`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function loadOutcome(token: string, cycleId: string) {
  const res = await apiFetch<{ success: boolean; data: { data: CycleOutcome } }>(
    `/cycles/${cycleId}/outcome`,
    {},
    token
  );
  return res.data.data;
}

export async function saveOutcome(token: string, cycleId: string, payload: CycleOutcome) {
  return apiFetch<{ success: boolean; data: CycleOutcome; message: string }>(
    `/cycles/${cycleId}/outcome`,
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}
