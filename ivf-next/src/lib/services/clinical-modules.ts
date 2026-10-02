import { apiFetch } from '@/lib/api';
import type { LookupItem } from '@/lib/types/master';

export interface CycleDateOption {
  cycId: string;
  cycleDate: string;
  label: string;
}

export function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'True';
}

export function formatCycleDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export function toDateInput(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

export function createCycleClinicalApi(basePath: string) {
  return {
    async getLookups<T = Record<string, LookupItem[]>>(token: string): Promise<T> {
      const res = await apiFetch<{ success: boolean; data: T }>(`${basePath}?action=lookups`, {}, token);
      return res.data;
    },
    async getCycleDates(token: string, patId: number, satId: number): Promise<CycleDateOption[]> {
      const res = await apiFetch<{ success: boolean; data: CycleDateOption[] }>(
        `${basePath}?action=cycle-dates&patId=${patId}&satId=${satId}`,
        {},
        token
      );
      return res.data;
    },
    async getMonitoring(token: string, patId: number, satId: number, cycId: string, cycleDate: string) {
      const qs = new URLSearchParams({ action: 'monitoring', patId: String(patId), satId: String(satId), cycId, cycleDate });
      const res = await apiFetch<{ success: boolean; data: Record<string, unknown> | null }>(
        `${basePath}?${qs.toString()}`,
        {},
        token
      );
      return res.data;
    },
    async loadRecord(token: string, patId: number, satId: number, cycId: string, cycleDate: string) {
      const qs = new URLSearchParams({ action: 'load', patId: String(patId), satId: String(satId), cycId, cycleDate });
      const res = await apiFetch<{ success: boolean; data: Record<string, unknown> | null; exists: boolean }>(
        `${basePath}?${qs.toString()}`,
        {},
        token
      );
      return res;
    },
    async save(token: string, payload: Record<string, unknown>) {
      return apiFetch<{ success: boolean; message: string; data: Record<string, unknown> }>(
        basePath,
        { method: 'POST', body: JSON.stringify(payload) },
        token
      );
    },
  };
}

export const ivfApi = createCycleClinicalApi('/ivf');
export const icsiApi = createCycleClinicalApi('/icsi');
export const etApi = createCycleClinicalApi('/et');
export const btApi = createCycleClinicalApi('/bt');
