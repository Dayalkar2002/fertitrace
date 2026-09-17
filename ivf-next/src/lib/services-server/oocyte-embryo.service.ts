import { executeDRL, executeText } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';
import { formatSmartDate, rowNum, rowVal } from '@/lib/db/row';
import type {
  EtEmbryoRow,
  LabSource,
  OocyteEmbryoOverview,
  OocyteItem,
  SourceSummary,
} from '@/lib/types/oocyte-embryo';

export type { EtEmbryoRow, LabSource, OocyteEmbryoOverview, OocyteItem, SourceSummary };

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

function emptySummary(source: LabSource): SourceSummary {
  return {
    source,
    hasRecord: false,
    recordId: '',
    cycleId: '',
    cycleDate: '',
    retrieved: 0,
    matureMII: 0,
    immature: 0,
    degenerated: 0,
    fertilized2PN: 0,
    abnormalPn: 0,
    unfertilized: 0,
    cleavage: 0,
    blastocyst: 0,
    cryopreserved: 0,
    transferred: 0,
    stuck: 0,
    discard: 0,
    donated: 0,
    donatedForResearch: 0,
  };
}

function field(row: Record<string, unknown>, prefix: string, suffix: string): number {
  return rowNum(row, `${prefix}${suffix}`);
}

function summarizeLabRow(row: Record<string, unknown>, source: LabSource): SourceSummary {
  const prefix = source;
  const matureMII = field(row, prefix, 'OIMetaII');
  const metaI = field(row, prefix, 'OIMetaI');
  const gv = field(row, prefix, 'OIGV');
  const degenerated = field(row, prefix, 'OIDEG');
  return {
    source,
    hasRecord: true,
    recordId: rowVal(row, source === 'IVF' ? 'IVFID' : 'ICSIID'),
    cycleId: rowVal(row, 'CycID'),
    cycleDate: formatSmartDate(rowVal(row, source === 'IVF' ? 'IVFCycleDate' : 'ICSICycleDate')),
    retrieved: matureMII + metaI + gv + degenerated,
    matureMII,
    immature: metaI + gv,
    degenerated,
    fertilized2PN: field(row, prefix, 'FMetaII2PN') + field(row, prefix, 'FMetaI2PN') + field(row, prefix, 'FGV2PN'),
    abnormalPn:
      field(row, prefix, 'FMetaII1PN') +
      field(row, prefix, 'FMetaII3PN') +
      field(row, prefix, 'FMetaI1PN') +
      field(row, prefix, 'FMetaI3PN') +
      field(row, prefix, 'FGV1PN') +
      field(row, prefix, 'FGV3PN'),
    unfertilized: field(row, prefix, 'FMetaII0PN') + field(row, prefix, 'FMetaI0PN') + field(row, prefix, 'FGV0PN'),
    cleavage: field(row, prefix, 'FMetaIICleaved') + field(row, prefix, 'FMetaICleaved') + field(row, prefix, 'FGVCleaved'),
    blastocyst: 0,
    cryopreserved: 0,
    transferred: 0,
    stuck: field(row, prefix, 'FMetaIIStuck') + field(row, prefix, 'FMetaIStuck') + field(row, prefix, 'FGVStuck'),
    discard: 0,
    donated: 0,
    donatedForResearch: 0,
  };
}

const ACTION_NAMES: Record<number, string> = {
  0: 'Select',
  1: 'Transfer',
  2: 'Freeze',
  3: 'Stuck',
  4: 'KeepForBlast',
  5: 'Discard',
  6: 'Donated',
  7: 'DonatedForResearch',
};

const CELLER_NAMES: Record<number, string> = {
  0: 'Select',
  1: '2 Celler',
  2: '3 Celler',
  3: '4 Celler',
  4: '5 Celler',
  5: '6 Celler',
  6: '7 Celler',
  7: '8 Celler',
  8: '9 Celler',
  9: '10 Celler',
  10: 'Multi Celler',
};

const GRADE_NAMES: Record<number, string> = {
  0: 'Select',
  1: 'Grade I',
  2: 'Grade II',
  3: 'Grade III',
  4: 'Grade IV',
};

function applyEtActions(summary: SourceSummary, embryos: EtEmbryoRow[]): SourceSummary {
  const rows = embryos.filter((row) => row.source === summary.source);
  if (!rows.length) return summary;
  const count = (id: number) => rows.filter((row) => row.action === id).length;
  return {
    ...summary,
    transferred: count(1),
    cryopreserved: count(2),
    stuck: count(3),
    blastocyst: count(4),
    discard: count(5),
    donated: count(6),
    donatedForResearch: count(7),
  };
}

async function latestLabRow(table: 'IVF' | 'ICSI', dateCol: string, patId: number, satId: number): Promise<Record<string, unknown> | null> {
  const params = [
    { name: '@PatID', value: patId },
    { name: '@SatID', value: satId },
  ];
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM ${table}
       WHERE PatID = @PatID AND SatID = @SatID
       ORDER BY ${dateCol} DESC`,
      params
    );
    if (result.recordset?.[0]) return result.recordset[0];
  } catch {
    // column name can differ; fall through
  }
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM ${table} WHERE PatID = @PatID AND SatID = @SatID`,
      params
    );
    return result.recordset?.[0] || null;
  } catch {
    return null;
  }
}

async function loadEtEmbryos(patId: number, satId: number): Promise<EtEmbryoRow[]> {
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT ETEDID, ETEDSource, ETEDCeller, ETEDGrade, ETEDAction, ETEDRemark, ETEDLocation, CycID
       FROM ETEmbryoDetailsGrid
       WHERE PatID = @PatID AND SatID = @SatID
       ORDER BY ETEDSource DESC, ETEDID`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId },
      ]
    );
    return (result.recordset || []).map((row) => {
      const sourceText = rowVal(row, 'ETEDSource').toUpperCase();
      const source: LabSource = sourceText === 'ICSI' ? 'ICSI' : 'IVF';
      const action = rowNum(row, 'ETEDAction');
      return {
        id: rowVal(row, 'ETEDID') || `${source}-${rowVal(row, 'CycID')}`,
        source,
        celler: CELLER_NAMES[rowNum(row, 'ETEDCeller')] || '',
        grade: GRADE_NAMES[rowNum(row, 'ETEDGrade')] || '',
        action,
        actionLabel: ACTION_NAMES[action] || 'Select',
        location: rowVal(row, 'ETEDLocation'),
        remark: rowVal(row, 'ETEDRemark'),
        cycleId: rowVal(row, 'CycID'),
      };
    });
  } catch {
    return [];
  }
}

export async function getIvfIcsiOverview(patId: number, satId: number): Promise<OocyteEmbryoOverview> {
  const [ivfRow, icsiRow, embryos] = await Promise.all([
    latestLabRow('IVF', 'IVFCycleDate', patId, satId),
    latestLabRow('ICSI', 'ICSICycleDate', patId, satId),
    loadEtEmbryos(patId, satId),
  ]);

  const ivf = applyEtActions(ivfRow ? summarizeLabRow(ivfRow, 'IVF') : emptySummary('IVF'), embryos);
  const icsi = applyEtActions(icsiRow ? summarizeLabRow(icsiRow, 'ICSI') : emptySummary('ICSI'), embryos);

  return { ivf, icsi, embryos };
}
