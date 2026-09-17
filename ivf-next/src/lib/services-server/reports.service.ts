import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { rowVal } from '@/lib/db/row';
import {
  ART_CYCLE_TYPES,
  type ArtCycleOption,
  type ArtCycleSummaryResult,
  type ArtCycleTypeIndex,
  type IuiReportId,
  type IuiSummaryResult,
  type ReportRow,
  type ReportSection,
} from '@/lib/types/reports';

export type {
  ArtCycleOption,
  ArtCycleSummaryResult,
  ArtCycleTypeIndex,
  IuiReportId,
  IuiSummaryResult,
  ReportRow,
  ReportSection,
};

function toRows(result: { recordsets?: unknown[]; recordset?: unknown }): ReportRow[] {
  const set = (result.recordsets?.[0] ?? result.recordset) as ReportRow[] | undefined;
  if (!Array.isArray(set)) return [];
  return set.map((row) => ({ ...row }));
}

async function runSp(procName: string, paramNames: string, values: unknown[]): Promise<ReportRow[]> {
  const result = await executeDRL(procName, buildParams(paramNames, values));
  return toRows(result);
}

async function trySp(procName: string, paramNames: string, values: unknown[]): Promise<ReportRow[]> {
  try {
    return await runSp(procName, paramNames, values);
  } catch {
    return [];
  }
}

function isTrue(value: unknown): boolean {
  if (value === true || value === 1) return true;
  const text = String(value ?? '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes';
}

function indicationFromLabel(label: string): string {
  const idx = label.indexOf('---');
  return (idx >= 0 ? label.slice(idx + 3) : label).trim();
}

function iuiKindFromIndication(indication: string): 'Single IUI' | 'Double IUI' {
  const double = ['IUI Double Husband', 'Thaw Double Husband', 'Thaw Double Donor'];
  return double.includes(indication) ? 'Double IUI' : 'Single IUI';
}

function joinFlags(row: ReportRow, flags: Array<[string, string]>): string {
  return flags
    .filter(([key]) => isTrue(rowVal(row, key)))
    .map(([, label]) => label)
    .join(', ');
}

function artTitle(type: ArtCycleTypeIndex): string {
  if (type === 3) return 'Embryos Report';
  if (type === 2) return 'FET Report';
  if (type === 4) return 'Oocytes Report';
  return 'OP Report';
}

function clampArtType(value: number): ArtCycleTypeIndex {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return 0;
}

const IUI_ANALYSIS_SQL = `
SELECT TOP 1 IUIAnalysis.IUIASpermID, IUIAnalysis.IUIADate, IUIAnalysis.IUIVDate, IUIAnalysis.IUIAIndication,
  IUIAnalysis.IUIACollProb, IUIAnalysis.IUIAAbstinence, IUIAnalysis.LabOptID, IUIAnalysis.MtdID,
  IUIAnalysis.IUIAContamination, IUIAnalysis.AppID, IUIAnalysis.ColID, IUIAnalysis.ViscoID,
  IUIAnalysis.IUIANMPH1, IUIAnalysis.IUIANMPH2, IUIAnalysis.LiqID, IUIAnalysis.IUIATimeOfLiq,
  IUIAnalysis.IUIAAgglut, IUIAnalysis.IUIAAntibodies, IUIAnalysis.FrucID, IUIAnalysis.IUIALin,
  IUIAnalysis.IUIAVelocity, IUIAnalysis.IUIApH, IUIAnalysis.IUIABVol, IUIAnalysis.IUIABSperms,
  IUIAnalysis.IUIABMotility, IUIAnalysis.IUIABProgMotility, IUIAnalysis.IUIABGrade1,
  IUIAnalysis.IUIABGrade2, IUIAnalysis.IUIABGrade3, IUIAnalysis.IUIABGrade4, IUIAnalysis.IUIABWBC,
  IUIAnalysis.IUIABRBC, IUIAnalysis.IUIABECell, IUIAnalysis.IUIABRCell, IUIAnalysis.IUIAAVol,
  IUIAnalysis.IUIAASperms, IUIAnalysis.IUIAAMotility, IUIAnalysis.IUIAAProgMotility,
  CommonMaster.CommName AS LabOptName, CommonMaster_1.CommName AS MtdName,
  CommonMaster_2.CommName AS AppName, CommonMaster_3.CommName AS ColName,
  CommonMaster_4.CommName AS LiqName, CommonMaster_5.CommName AS FrucName,
  CommonMaster_6.CommName AS ViscoName, CommonMaster_7.CommName AS SpermName,
  CommonMaster_8.CommName AS IndicationName, CommonMaster_9.CommName AS CollProbName,
  CommonMaster_10.CommName AS LinName, CommonMaster_11.CommName AS LinAName,
  CommonMaster_12.CommName AS IUIAContaminationName, CommonMaster_13.CommName AS IUIIndicationName,
  IUIAAS24Hr, IUIAAS12Hr, IUIAFreezingId
FROM IUIAnalysis
INNER JOIN IUIUterusOvaries ON IUIUterusOvaries.IUIID = IUIAnalysis.IUIID
LEFT JOIN CommonMaster ON IUIAnalysis.LabOptID = CommonMaster.CommID
LEFT JOIN CommonMaster AS CommonMaster_1 ON IUIAnalysis.MtdID = CommonMaster_1.CommID
LEFT JOIN CommonMaster AS CommonMaster_2 ON IUIAnalysis.AppID = CommonMaster_2.CommID
LEFT JOIN CommonMaster AS CommonMaster_3 ON IUIAnalysis.ColID = CommonMaster_3.CommID
LEFT JOIN CommonMaster AS CommonMaster_4 ON IUIAnalysis.LiqID = CommonMaster_4.CommID
LEFT JOIN CommonMaster AS CommonMaster_5 ON IUIAnalysis.FrucID = CommonMaster_5.CommID
LEFT JOIN CommonMaster AS CommonMaster_6 ON IUIAnalysis.ViscoID = CommonMaster_6.CommID
LEFT JOIN CommonMaster AS CommonMaster_7 ON IUIAnalysis.IUIASpermID = CommonMaster_7.CommID
LEFT JOIN CommonMaster AS CommonMaster_8 ON IUIAnalysis.IUIAIndication = CommonMaster_8.CommID
LEFT JOIN CommonMaster AS CommonMaster_9 ON IUIAnalysis.IUIACollProb = CommonMaster_9.CommID
LEFT JOIN CommonMaster AS CommonMaster_10 ON IUIAnalysis.IUIALin = CommonMaster_10.CommID
LEFT JOIN CommonMaster AS CommonMaster_11 ON IUIAnalysis.IUIALinearity = CommonMaster_11.CommID
LEFT JOIN CommonMaster AS CommonMaster_12 ON IUIAnalysis.IUIAContamination = CommonMaster_12.CommID
LEFT JOIN CommonMaster AS CommonMaster_13 ON IUIUterusOvaries.IUIIndication = CommonMaster_13.CommID
WHERE IUIAnalysis.IUIID = @IUIID AND IUIAnalysis.PatID = @PatID AND IUIAnalysis.SatID = @SatID
ORDER BY IUIASpermID DESC
`;

export async function listIuiReportIds(patId: number, satId: number): Promise<IuiReportId[]> {
  const rows = await runSp('spIUIUterusOvariesExtDRL', '@PatID,@SatID,@QueryIndex', [patId, satId, 2]);
  return rows
    .map((row) => {
      const iuiId = rowVal(row, 'IUIID', 'IuiId');
      if (!iuiId || iuiId === '0') return null;
      const label = rowVal(row, 'IUIIndication', 'Indication') || iuiId;
      return { iuiId, label };
    })
    .filter((row): row is IuiReportId => row !== null);
}

export async function loadIuiSummary(patId: number, satId: number, iuiId: string, label = ''): Promise<IuiSummaryResult> {
  const params = [
    { name: '@PatID', value: patId },
    { name: '@SatID', value: satId },
    { name: '@IUIID', value: iuiId },
  ];

  const uterusResult = await executeText<ReportRow>(
    `SELECT *, CommName AS RefDoctor
     FROM IUIUterusOvaries
     INNER JOIN PatientMaster ON IUIUterusOvaries.PatID = PatientMaster.PatID
     LEFT JOIN CommonMaster ON CommonMaster.CommID = PatientMaster.RefID
       AND IUIUterusOvaries.SatID = PatientMaster.SatId
     LEFT JOIN IUIOutCome ON IUIOutCome.PatID = PatientMaster.PatID
       AND IUIOutCome.IUIID = IUIUterusOvaries.IUIID
     WHERE PatientMaster.PatID = @PatID
       AND PatientMaster.SatID = @SatID
       AND IUIUterusOvaries.IUIID = @IUIID`,
    params
  );
  const uterus = toRows(uterusResult);

  const follicularResult = await executeText<ReportRow>(
    `SELECT * FROM IUIFollicularStudy
     WHERE IUIID = @IUIID AND PatID = @PatID AND SatID = @SatID`,
    params
  );
  const follicular = toRows(follicularResult);

  const analysisResult = await executeText<ReportRow>(IUI_ANALYSIS_SQL, params);
  const analysis = toRows(analysisResult);

  const firstUterus = uterus[0] || {};
  const firstAnalysis = analysis[0] || {};
  const indication =
    rowVal(firstAnalysis, 'IUIIndicationName', 'IndicationName') || indicationFromLabel(label);

  return {
    iuiId,
    indication,
    iuiKind: iuiKindFromIndication(indication),
    uterusFlags: joinFlags(firstUterus, [
      ['IUIUNS', 'Uterus Not Seen'],
      ['IUIUN', 'Normal'],
      ['IUIUEA', 'Enlarged'],
      ['IUIURf', 'RF'],
      ['IUIURv', 'RV'],
    ]),
    echoPattern: joinFlags(firstUterus, [
      ['IUIUEPHomo', 'Homogeneous'],
      ['IUIUEPHetro', 'Hetrogeneous'],
    ]),
    sections: [
      { name: 'Patient / Uterus & Ovaries', rows: uterus },
      { name: 'Follicular Study', rows: follicular },
      { name: 'IUI Analysis', rows: analysis },
    ],
  };
}

export async function listArtCycles(patId: number, satId: number): Promise<ArtCycleOption[]> {
  const rows = await runSp('spPatientCycle', '@PatID,@SatID,@QueryIndex', [patId, satId, 1]);
  return rows
    .map((row) => {
      const id = rowVal(row, 'patid', 'PatID', 'PATID');
      if (!id || id === '0') return null;
      return { id, label: id };
    })
    .filter((row): row is ArtCycleOption => row !== null);
}

async function detectArtCycleType(cycleId: string): Promise<ArtCycleTypeIndex> {
  const rows = await trySp('spReportCycle', '@PatID', [cycleId]);
  const first = rows[0];
  if (!first) return 0;
  const raw = Object.values(first)[0];
  return clampArtType(Number(raw));
}

function section(name: string, rows: ReportRow[]): ReportSection[] {
  return rows.length ? [{ name, rows }] : [];
}

export async function loadArtCycleSummary(cycleId: string): Promise<ArtCycleSummaryResult> {
  const type = await detectArtCycleType(cycleId);
  const typeLabel = ART_CYCLE_TYPES[type];
  let sections: ReportSection[] = [];

  if (type === 0 || type === 1) {
    const flag = type === 0 ? 0 : 1;
    sections = [
      ...section('Patient Summary', await trySp('spRptPatSummary', '@PatID,@Flag', [cycleId, flag])),
      ...section('ET Transfer', await trySp('spRptETCeller', '@PatID', [cycleId])),
      ...section('BT Transfer', await trySp('spRptETCeller', '@PatID,@flag', [cycleId, 'BioTransfer'])),
      ...section('ET Frozen', await trySp('spRptETCeller', '@PatID,@flag', [cycleId, 'ETFrozen'])),
      ...section('BT Frozen', await trySp('spRptETCeller', '@PatID,@flag', [cycleId, 'BTFrozen'])),
    ];
  } else if (type === 3) {
    sections = [
      ...section('Embryo Summary', await trySp('spRptERSummary', '@PatID,@Flag', [cycleId, 1])),
      ...section('ET Celler', await trySp('spETBTCeller', '@PatID', [cycleId])),
      ...section('BT Celler', await trySp('spETBTCeller', '@PatID,@flag', [cycleId, 'BTTransfer'])),
      ...section('ET Frozen', await trySp('spRptETCeller', '@PatID,@flag', [cycleId, 'ETFrozen'])),
      ...section('BT Frozen', await trySp('spRptETCeller', '@PatID,@flag', [cycleId, 'BTFrozen'])),
    ];
  } else if (type === 4) {
    sections = [
      ...section('Oocyte Summary', await trySp('spRptOcyteSummary2', '@PatID,@Flag', [cycleId, 1])),
      ...section('Oocyte Straw', await trySp('spRPTOcyteSTraw', '@PatID', [cycleId])),
    ];
  } else {
    sections = [
      ...section('FET Summary', await trySp('spRptPatSummary2', '@PatID,@Flag', [cycleId, 1])),
      ...section('Patient Transfer', await trySp('spRptPatCeller', '@PatID', [cycleId])),
      ...section('BT Transfer', await trySp('spRptPatCeller', '@PatID,@flag', [cycleId, 'BTTransfer'])),
    ];
  }

  return {
    cycleId,
    type,
    typeLabel,
    title: artTitle(type),
    sections,
  };
}
