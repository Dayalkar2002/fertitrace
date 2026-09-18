import { getRetrievalLayout, normalizeCycleType, oocyteSourceFromCreation } from '@/lib/cycle-utils';
import type { CycleEntry, RetrievalConfig, RetrievalData } from '@/lib/types/cycle';

const cycles = new Map<string, CycleEntry>();
const retrieval = new Map<string, RetrievalData>();

export function upsertCycle(entry: CycleEntry): CycleEntry {
  const cycleId = entry.cycleId || `C${entry.patientId || 0}${Date.now().toString().slice(-4)}`;
  const next: CycleEntry = {
    ...entry,
    cycleId,
    oocyteSource: oocyteSourceFromCreation(entry.oocyteSource || entry.cycleType),
    cycleType: normalizeCycleType(entry.cycleType || entry.oocyteSource),
  };
  cycles.set(cycleId, next);
  return next;
}

export function getStoredCycle(cycleId: string): CycleEntry | undefined {
  return cycles.get(cycleId);
}

export function saveStoredRetrieval(cycleId: string, data: RetrievalData): RetrievalData {
  retrieval.set(cycleId, data);
  return data;
}

export function getStoredRetrieval(cycleId: string): RetrievalData | undefined {
  return retrieval.get(cycleId);
}

export function buildRetrievalConfig(cycle: CycleEntry): RetrievalConfig {
  const layout = getRetrievalLayout(cycle.oocyteSource || cycle.cycleType);
  return {
    cycle,
    sections: layout.sections,
    patient: null,
    availableRecipients: [],
    lockedRecipients: [],
    donorAadhar: '',
    existingRetrieval: getStoredRetrieval(cycle.cycleId || '') || null,
  };
}
