import { executeDRL, executeDML } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export type SpermWorkflowMode = 'Semen Analysis' | 'IUI' | 'IVF / ICSI' | 'Cryopreservation';

export interface SpermSampleRecord {
  id: string;
  patientId: string;
  patientName: string;
  partnerName?: string;
  cycleId?: string;
  procedure: string;
  workflowMode: SpermWorkflowMode;
  source: 'Husband / Partner' | 'Donor';
  sampleState: 'Fresh' | 'Frozen' | 'Thawed / Prepared';
  collectionDateTime: string;
  collectionMethod: string;
  abstinenceDays: number;
  donorId?: string;
  sampleId: string;
  rfidBarcode?: string;
  status: 'VALIDATED' | 'PENDING' | 'REJECTED';
  checks: {
    patientCoupleMatch: boolean;
    cycleMatch: boolean;
    sourceValid: boolean;
    sampleStateValid: boolean;
    intendedUseValid: boolean;
    sampleAvailability: boolean;
    processSequenceValid: boolean;
    operatorAuthorized: boolean;
  };
  preparation?: {
    preparationId: string;
    method: string;
    dateTime: string;
    preparedBy: string;
    concentration: number;
    motility: number;
    progressiveMotility: number;
    volume: number;
    finalVolume: number;
    vitality?: number;
    morphology?: number;
    notes?: string;
  };
  linkage?: {
    dishOrSyringeId: string;
    procedure: 'ICSI' | 'Conventional IVF' | 'IUI';
    linkedOn: string;
    linkedBy: string;
    status: 'LINK CONFIRMED' | 'PENDING';
  };
  cryo?: {
    freezingDateTime: string;
    method: string;
    cryoprotectant: string;
    cryoprotectantConc: number;
    equilibrationTime: number;
    freezingBy: string;
    containerType: string;
    strawType: string;
    sealingType: string;
    strawRange: string;
    strawCount: number;
    volumePerStraw: number;
    totalVolume: number;
    storageTank: string;
    canister: string;
    rackLevel: string;
    straws: Array<{
      strawNo: string;
      volume: number;
      location: string;
      status: 'In Freezer' | 'Thawed' | 'Discarded';
      filledBy: string;
      filledOn: string;
    }>;
    witnessName: string;
    witnessStatus: 'Completed' | 'Pending';
  };
  authorization?: {
    authorizedBy: string;
    authorizedOn: string;
    status: 'AUTHORIZED' | 'PENDING' | 'REJECTED';
  };
}

// In-memory persistent state across requests
const spermStore: SpermSampleRecord[] = [
  {
    id: 'SP-26-00018472',
    patientId: 'P-2026-00125',
    patientName: 'Mrs. Anjali Sharma',
    partnerName: 'Mr. Rohit Sharma',
    cycleId: 'C-2026-00158',
    procedure: 'IVF / ICSI',
    workflowMode: 'IVF / ICSI',
    source: 'Husband / Partner',
    sampleState: 'Fresh',
    collectionDateTime: '18-Aug-2026 09:42 AM',
    collectionMethod: 'Masturbation',
    abstinenceDays: 3,
    sampleId: 'SEM-26-00018472',
    rfidBarcode: 'RF-88921-X',
    status: 'VALIDATED',
    checks: {
      patientCoupleMatch: true,
      cycleMatch: true,
      sourceValid: true,
      sampleStateValid: true,
      intendedUseValid: true,
      sampleAvailability: true,
      processSequenceValid: true,
      operatorAuthorized: true,
    },
    preparation: {
      preparationId: 'PREP-26-000918',
      method: 'Density Gradient',
      dateTime: '18-Aug-2026 10:18 AM',
      preparedBy: 'EMB-02 - Dr. Amit Verma',
      concentration: 85,
      motility: 65,
      progressiveMotility: 55,
      volume: 2.5,
      finalVolume: 0.5,
      vitality: 75,
      morphology: 5,
      notes: 'Good post-wash recovery with high progressive motility.',
    },
    linkage: {
      dishOrSyringeId: 'ICSI-DISH-26-000421',
      procedure: 'ICSI',
      linkedOn: '18-Aug-2026 10:25 AM',
      linkedBy: 'EMB-02 - Dr. Amit Verma',
      status: 'LINK CONFIRMED',
    },
    authorization: {
      authorizedBy: 'Dr. Satish Sharma (EMB-01)',
      authorizedOn: '18-Aug-2026 10:30 AM',
      status: 'AUTHORIZED',
    },
  },
];

export async function getSpermSamples(patientId?: string): Promise<SpermSampleRecord[]> {
  if (patientId) {
    const filtered = spermStore.filter(
      (s) => s.patientId === patientId || String(s.patientId).includes(patientId)
    );
    return filtered.length > 0 ? filtered : spermStore;
  }
  return spermStore;
}

export async function saveSpermSample(record: SpermSampleRecord): Promise<SpermSampleRecord> {
  const existingIdx = spermStore.findIndex((s) => s.id === record.id || s.sampleId === record.sampleId);
  if (existingIdx >= 0) {
    spermStore[existingIdx] = { ...spermStore[existingIdx], ...record };
  } else {
    spermStore.unshift(record);
  }

  // Sync to database if available
  if (isDbConfigured()) {
    try {
      const patIdNum = Number(String(record.patientId).replace(/\D/g, '')) || 0;
      await executeDRL('spCycSelfSF', [
        { name: '@PatID', value: patIdNum },
        { name: '@SatID', value: 1 },
        { name: '@CycSSID', value: 0 },
      ]);
    } catch {
      // Gracefully continue with in-memory state
    }
  }

  return record;
}
