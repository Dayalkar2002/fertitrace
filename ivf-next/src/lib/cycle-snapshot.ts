import type { FreezeOocyteRow, RetrievalRow } from '@/lib/types/cycle';
import type { SpermLocationDetails } from '@/lib/services/sperm-id-location';

export const CYCLE_RETRIEVAL_SNAPSHOT_KEY = 'fertitrace.cycleRetrieval';
export const CYCLE_RETRIEVAL_LATEST_KEY = 'fertitrace.cycleRetrieval.latest';

export interface CycleRetrievalSpermSnapshot {
  source: string;
  sampleId: string;
  sampleLabel: string;
  details: Partial<SpermLocationDetails> | null;
}

export interface CycleRetrievalSnapshot {
  cycleId: string;
  patientId: number;
  cycleType: string;
  semenSource: string;
  monitoringSheet: string;
  ivfAllotted: number;
  icsiAllotted: number;
  totalRetrieved: number;
  freeze: FreezeOocyteRow | null;
  fetEmbryoCount: number;
  thawMii: number;
  thawMi: number;
  thawGv: number;
  thawSurvived: number;
  sperm: CycleRetrievalSpermSnapshot | null;
  savedAt: string;
}

function sumField(rows: RetrievalRow[], key: keyof RetrievalRow) {
  return rows.reduce((total, row) => {
    const value = row[key];
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  }, 0);
}

export function tallyOpuRows(rows: RetrievalRow[]) {
  const ivfAllotted = sumField(rows, 'ivf');
  const icsiAllotted = sumField(rows, 'icsi');
  const totalRetrieved = sumField(rows, 'total') || ivfAllotted + icsiAllotted;
  return { ivfAllotted, icsiAllotted, totalRetrieved };
}

export function snapshotStorageKey(cycleId: string) {
  return `${CYCLE_RETRIEVAL_SNAPSHOT_KEY}.${cycleId || 'draft'}`;
}

export function writeRetrievalSnapshot(snapshot: CycleRetrievalSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(snapshot);
    sessionStorage.setItem(snapshotStorageKey(snapshot.cycleId), payload);
    sessionStorage.setItem(CYCLE_RETRIEVAL_LATEST_KEY, payload);
  } catch {
    /* ignore quota */
  }
}

export function readRetrievalSnapshot(cycleId?: string, patientId?: number): CycleRetrievalSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    if (cycleId) {
      const byCycle = sessionStorage.getItem(snapshotStorageKey(cycleId));
      if (byCycle) return JSON.parse(byCycle) as CycleRetrievalSnapshot;
    }
    const latestRaw = sessionStorage.getItem(CYCLE_RETRIEVAL_LATEST_KEY);
    if (!latestRaw) return null;
    const latest = JSON.parse(latestRaw) as CycleRetrievalSnapshot;
    if (patientId && latest.patientId && latest.patientId !== patientId) return null;
    return latest;
  } catch {
    return null;
  }
}
