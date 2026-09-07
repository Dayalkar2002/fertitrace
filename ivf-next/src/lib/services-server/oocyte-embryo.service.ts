import { executeDRL } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface OocyteItem {
  id: string;
  oocyteId: string;
  collectionDateTime: string;
  maturity: 'MII' | 'MI' | 'GV' | 'Degenerated';
  morphologyGrade: 'A' | 'B' | 'C' | '-';
  linkedSpermId: string;
  status: 'Retrieved' | 'Fertilized' | 'Immature' | 'Degenerated' | 'Discarded';
  fertilizationResult?: '2PN' | '1PN' | '3PN' | '0PN' | 'Degenerate';
  embryoId?: string;
  day3Grade?: string;
  day5Grade?: string;
  cryoStrawNo?: string;
  transferStatus?: 'Transferred' | 'Cryopreserved' | 'Culturing' | 'Discarded';
}

export interface OocyteEmbryoData {
  patientId: string;
  patientName: string;
  cycleId: string;
  cycleType: string;
  cycleDay: number;
  lmp: string;
  operator: string;
  summary: {
    retrieved: number;
    matureMII: number;
    immature: number;
    degenerated: number;
    fertilized2PN: number;
    cleavage: number;
    blastocyst: number;
    cryopreserved: number;
  };
  oocytes: OocyteItem[];
}

// In-memory active cycle session data mirroring the mockups
let cycleStore: OocyteEmbryoData = {
  patientId: 'P-2026-00125',
  patientName: 'Mrs. Anjali Sharma',
  cycleId: 'C-2026-00158',
  cycleType: 'IVF / ICSI',
  cycleDay: 16,
  lmp: '02-Aug-2026',
  operator: 'Dr. Satish Sharma (EMB-01)',
  summary: {
    retrieved: 12,
    matureMII: 10,
    immature: 2,
    degenerated: 0,
    fertilized2PN: 8,
    cleavage: 7,
    blastocyst: 3,
    cryopreserved: 3,
  },
  oocytes: [
    {
      id: '1',
      oocyteId: 'OO-26-001201',
      collectionDateTime: '18-Aug-2026 09:20',
      maturity: 'MII',
      morphologyGrade: 'A',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-01',
      day3Grade: '8-Cell Grade A',
      day5Grade: '4AA',
      transferStatus: 'Transferred',
    },
    {
      id: '2',
      oocyteId: 'OO-26-001202',
      collectionDateTime: '18-Aug-2026 09:21',
      maturity: 'MII',
      morphologyGrade: 'A',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-02',
      day3Grade: '8-Cell Grade A',
      day5Grade: '4AA',
      transferStatus: 'Transferred',
    },
    {
      id: '3',
      oocyteId: 'OO-26-001203',
      collectionDateTime: '18-Aug-2026 09:22',
      maturity: 'MII',
      morphologyGrade: 'B',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-03',
      day3Grade: '6-Cell Grade B',
      day5Grade: '3AB',
      cryoStrawNo: 'STR-26-001',
      transferStatus: 'Cryopreserved',
    },
    {
      id: '4',
      oocyteId: 'OO-26-001204',
      collectionDateTime: '18-Aug-2026 09:22',
      maturity: 'MI',
      morphologyGrade: '-',
      linkedSpermId: '-',
      status: 'Immature',
      fertilizationResult: '0PN',
      transferStatus: 'Culturing',
    },
    {
      id: '5',
      oocyteId: 'OO-26-001205',
      collectionDateTime: '18-Aug-2026 09:23',
      maturity: 'GV',
      morphologyGrade: '-',
      linkedSpermId: '-',
      status: 'Immature',
      fertilizationResult: '0PN',
      transferStatus: 'Culturing',
    },
    {
      id: '6',
      oocyteId: 'OO-26-001206',
      collectionDateTime: '18-Aug-2026 09:24',
      maturity: 'MII',
      morphologyGrade: 'A',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-04',
      day3Grade: '8-Cell Grade A',
      day5Grade: '3BA',
      cryoStrawNo: 'STR-26-002',
      transferStatus: 'Cryopreserved',
    },
    {
      id: '7',
      oocyteId: 'OO-26-001207',
      collectionDateTime: '18-Aug-2026 09:25',
      maturity: 'MII',
      morphologyGrade: 'B',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-05',
      day3Grade: '7-Cell Grade B',
      day5Grade: '3BB',
      cryoStrawNo: 'STR-26-003',
      transferStatus: 'Cryopreserved',
    },
    {
      id: '8',
      oocyteId: 'OO-26-001208',
      collectionDateTime: '18-Aug-2026 09:26',
      maturity: 'MII',
      morphologyGrade: 'A',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-06',
      day3Grade: '8-Cell Grade A',
      transferStatus: 'Culturing',
    },
    {
      id: '9',
      oocyteId: 'OO-26-001209',
      collectionDateTime: '18-Aug-2026 09:27',
      maturity: 'MII',
      morphologyGrade: 'B',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-07',
      day3Grade: '6-Cell Grade B',
      transferStatus: 'Culturing',
    },
    {
      id: '10',
      oocyteId: 'OO-26-001210',
      collectionDateTime: '18-Aug-2026 09:28',
      maturity: 'MII',
      morphologyGrade: 'A',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Fertilized',
      fertilizationResult: '2PN',
      embryoId: 'EMB-26-08',
      day3Grade: '8-Cell Grade A',
      transferStatus: 'Culturing',
    },
    {
      id: '11',
      oocyteId: 'OO-26-001211',
      collectionDateTime: '18-Aug-2026 09:29',
      maturity: 'MII',
      morphologyGrade: 'B',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Retrieved',
      transferStatus: 'Culturing',
    },
    {
      id: '12',
      oocyteId: 'OO-26-001212',
      collectionDateTime: '18-Aug-2026 09:30',
      maturity: 'MII',
      morphologyGrade: 'B',
      linkedSpermId: 'SEM-26-00018472',
      status: 'Retrieved',
      transferStatus: 'Culturing',
    },
  ],
};

export async function getOocyteEmbryoData(patientId?: string): Promise<OocyteEmbryoData> {
  if (isDbConfigured()) {
    try {
      const patIdNum = Number(String(patientId || '125').replace(/\D/g, '')) || 125;
      await executeDRL('spCycIVFRetrieval', [
        { name: '@PatID', value: patIdNum },
        { name: '@SatID', value: 1 },
      ]);
    } catch {
      // Gracefully continue with session data
    }
  }

  if (patientId && patientId !== cycleStore.patientId) {
    return {
      ...cycleStore,
      patientId,
    };
  }

  return cycleStore;
}

export async function updateOocyteEmbryoData(data: Partial<OocyteEmbryoData>): Promise<OocyteEmbryoData> {
  cycleStore = {
    ...cycleStore,
    ...data,
    summary: {
      ...cycleStore.summary,
      ...(data.summary || {}),
    },
  };
  return cycleStore;
}
