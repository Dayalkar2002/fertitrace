import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { rowVal } from '@/lib/db/row';
import { isDbConfigured } from '@/lib/db/pool';
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
  if (type === 1) return 'FET Report';
  if (type === 2) return 'Oocytes Report';
  if (type === 3) return 'THO Report';
  if (type === 4) return 'Embryos Report';
  if (type === 5) return 'OD Report';
  if (type === 6) return 'OR Report';
  return 'OP Report';
}

function clampArtType(value: number): ArtCycleTypeIndex {
  if (value >= 0 && value <= 6) return value as ArtCycleTypeIndex;
  return 0;
}

const IUI_ANALYSIS_SQL = `
SELECT IUIAnalysis.IUIAID, IUIAnalysis.IUIASpermID, IUIAnalysis.IUIADate, IUIAnalysis.IUIVDate, IUIAnalysis.IUIAIndication,
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
  IUIAnalysis.IUIABRecovery, IUIAnalysis.IUIThawDate, IUIAAS24Hr, IUIAAS12Hr, IUIAFreezingId
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
ORDER BY IUIASpermID DESC, IUIAnalysis.IUIADate ASC, IUIAnalysis.IUIAID ASC
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

export function getCycleCategoryDisplay(rawType: string): string {
  const cleaned = (rawType || '').trim();
  const lower = cleaned.toLowerCase();
  if (lower === 'fresh' || lower.startsWith('fresh')) return 'Fresh Cycle';
  if (lower === 'fet' || lower.includes('frozen thaw')) return 'Frozen Thaw Cycle';
  if (lower === 'frozenoocytes' || lower.includes('oocyte freez')) return 'Oocyte Freezing';
  if (lower === 'thawoocytes' || lower.includes('thaw oocyte')) return 'Thaw Oocyte';
  if (lower === 'er' || lower.includes('embryo recipient')) return 'Embryo Recipient';
  if (lower === 'od' || lower.includes('oocyte donor')) return 'Oocyte Donor';
  if (lower === 'or' || lower.includes('oocyte recipient')) return 'Oocyte Recipient';
  if (cleaned) {
    const dashIdx = cleaned.lastIndexOf(' - ');
    if (dashIdx > 0) return cleaned.slice(0, dashIdx).trim();
    return cleaned;
  }
  return 'General';
}

export async function listArtCycles(patId: number, satId: number): Promise<ArtCycleOption[]> {
  const cycleNum = (cycId: string) => {
    const match = (cycId || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
  };

  const rows = await runSp('spPatientCycle', '@PatID,@SatID,@QueryIndex', [patId, satId, 1]);
  if (!rows.length && !isDbConfigured()) {
    return [
      { id: 'C41--Farah Mohammed Khan', label: 'C41--Farah Mohammed Khan (Fresh Cycle)' },
      { id: 'C410--Farah Mohammed Khan', label: 'C410--Farah Mohammed Khan (Fresh Cycle)' },
      { id: 'C412--Farah Mohammed Khan', label: 'C412--Farah Mohammed Khan (Frozen Thaw Cycle)' },
      { id: 'C413--Farah Mohammed Khan', label: 'C413--Farah Mohammed Khan (Embryo Recipient)' },
      { id: 'C414--Farah Mohammed Khan', label: 'C414--Farah Mohammed Khan (Oocyte Recipient)' },
      { id: 'C416--Farah Mohammed Khan', label: 'C416--Farah Mohammed Khan (Oocyte Freezing)' },
    ];
  }

  const options = rows
    .map((row) => {
      const rawId = rowVal(row, 'patid', 'PatID', 'PATID');
      if (!rawId || rawId === '0') return null;

      const cycId = rowVal(row, 'CycID', 'cycid') || '';
      const patName = rowVal(row, 'PatName', 'patname');
      const rawType = rowVal(row, 'CycOType', 'cycotype');
      const catDisplay = getCycleCategoryDisplay(rawType);

      // In SMART: string.Format("{0}--{1} ({2})", cycId, patName, catDisplay)
      const label = cycId
        ? `${cycId}--${patName || 'Patient'} (${catDisplay})`
        : (rawId.includes('(') ? rawId : `${rawId} (${catDisplay})`);

      return { id: rawId, label, cycId };
    })
    .filter((row): row is (ArtCycleOption & { cycId: string }) => row !== null);

  return options.sort((a, b) => cycleNum(a.cycId) - cycleNum(b.cycId) || a.cycId.localeCompare(b.cycId));
}

async function detectArtCycleType(cycleId: string, patName = ''): Promise<ArtCycleTypeIndex> {
  const cleanCycId = cycleId.includes('--') ? cycleId.split('--')[0].trim() : cycleId.trim();

  // Try direct query matching spReportCycle logic
  try {
    const outcomeResult = await executeText<{ CycOType?: string }>(
      `SELECT CycOType FROM CycOutCome WHERE LTRIM(RTRIM(CycID)) = @cycId`,
      [{ name: '@cycId', value: cleanCycId }]
    );
    const outcomeRows = outcomeResult.recordset || [];
    if (outcomeRows.length && outcomeRows[0]?.CycOType) {
      const cycOType = outcomeRows[0].CycOType.trim();
      const lower = cycOType.toLowerCase();
      if (lower === 'fresh' || lower.startsWith('fresh')) {
        const redResult = await executeText<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM CycMonitoringChartRemDay WHERE LTRIM(RTRIM(CycID)) = @cycId AND cycMCRDColor = 'Red'`,
          [{ name: '@cycId', value: cleanCycId }]
        );
        const redRows = redResult.recordset || [];
        if (redRows[0]?.cnt && redRows[0].cnt > 0) return 0; // OP+ET
        return 6; // OR+ET (Index 6)
      } else if (lower === 'fet' || lower.includes('frozen thaw')) {
        return 1; // FET (Index 1)
      } else if (lower === 'frozenoocytes' || lower.includes('oocyte freez')) {
        return 2; // OF (Index 2)
      } else if (lower === 'thawoocytes' || lower.includes('thaw oocyte')) {
        return 3; // THO+ET (Index 3)
      } else if (lower === 'er' || lower.includes('embryo recipient')) {
        return 4; // ER+ET (Index 4)
      } else if (lower === 'od' || lower.includes('oocyte donor')) {
        return 5; // OD (Index 5)
      } else if (lower === 'or' || lower.includes('oocyte recipient')) {
        return 6; // OR+ET (Index 6)
      }
    }
  } catch (err) {
    console.error('Error querying CycOutCome directly:', err);
  }

  // Fallback to legacy spReportCycle
  const legacyParam = cycleId.includes('--') ? cycleId : `${cleanCycId}--${patName || 'Patient'}`;
  const rows = await trySp('spReportCycle', '@PatID', [legacyParam]);
  const first = rows[0];
  if (first) {
    const raw = Object.values(first)[0];
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return clampArtType(parsed);
  }
  return 0;
}

function section(name: string, rows: ReportRow[]): ReportSection[] {
  return rows.length ? [{ name, rows }] : [];
}

export async function loadArtCycleSummary(
  cycleId: string,
  overrideType?: number,
  patName = ''
): Promise<ArtCycleSummaryResult> {
  const cleanCycId = cycleId.includes('--') ? cycleId.split('--')[0].trim() : cycleId.trim();

  // Resolve patient name if not provided
  let resolvedPatName = patName.trim();
  if (!resolvedPatName && cycleId.includes('--')) {
    resolvedPatName = cycleId.split('--')[1].trim();
  }
  if (!resolvedPatName) {
    try {
      const patResult = await executeText<{ PatName: string }>(
        `SELECT TOP 1 P.PatName FROM PatientMaster P 
         INNER JOIN CycOutCome C ON P.PatID = C.PatID 
         WHERE LTRIM(RTRIM(C.CycID)) = @cycId`,
        [{ name: '@cycId', value: cleanCycId }]
      );
      const patRows = patResult.recordset || [];
      if (patRows[0]?.PatName) {
        resolvedPatName = patRows[0].PatName.trim();
      }
    } catch {
      // ignore
    }
  }

  // Legacy stored procedures expect @PatID in 'CycID--PatName' format
  const legacyParam = `${cleanCycId}--${resolvedPatName || 'Patient'}`;

  const type =
    overrideType !== undefined && overrideType >= 0
      ? clampArtType(overrideType)
      : await detectArtCycleType(cleanCycId, resolvedPatName);

  const typeLabel = ART_CYCLE_TYPES[type];
  let sections: ReportSection[] = [];

  if (type === 0) {
    // 0: OP+ET (Fresh Cycle)
    sections = [
      ...section('Patient Summary', await trySp('spRptPatSummary', '@PatID,@Flag', [legacyParam, 0])),
      ...section('ET Transfer', await trySp('spRptETCeller', '@PatID', [legacyParam])),
      ...section('BT Transfer', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BioTransfer'])),
      ...section('ET Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'ETFrozen'])),
      ...section('BT Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BTFrozen'])),
    ];
  } else if (type === 1) {
    // 1: FET (Frozen Thaw Cycle)
    sections = [
      ...section('FET Summary', await trySp('spRptPatSummary2', '@PatID,@Flag', [legacyParam, 1])),
      ...section('Patient Transfer', await trySp('spRptPatCeller', '@PatID', [legacyParam])),
      ...section('BT Transfer', await trySp('spRptPatCeller', '@PatID,@flag', [legacyParam, 'BTTransfer'])),
    ];
  } else if (type === 2) {
    // 2: OF (Oocyte Freezing)
    sections = [
      ...section('Oocyte Summary', await trySp('spRptOcyteSummary2', '@PatID,@Flag', [legacyParam, 1])),
      ...section('Oocyte Straw', await trySp('spRPTOcyteSTraw', '@PatID', [legacyParam])),
    ];
  } else if (type === 3) {
    // 3: THO (THO+ET, Thaw Oocyte)
    sections = [
      { name: 'Under Preparation', rows: [{ note: 'Summary report for Thaw Oocyte (THO+ET) is under preparation.' }] },
    ];
  } else if (type === 4) {
    // 4: ER (ER+ET, Embryo Recipient)
    sections = [
      ...section('Embryo Summary', await trySp('spRptERSummary', '@PatID,@Flag', [legacyParam, 1])),
      ...section('ET Celler', await trySp('spETBTCeller', '@PatID', [legacyParam])),
      ...section('BT Celler', await trySp('spETBTCeller', '@PatID,@flag', [legacyParam, 'BTTransfer'])),
      ...section('ET Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'ETFrozen'])),
      ...section('BT Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BTFrozen'])),
    ];
  } else if (type === 5) {
    // 5: OD (OD, Oocyte Donor)
    sections = [
      ...section('Patient Summary', await trySp('spRptPatSummary', '@PatID,@Flag', [legacyParam, 0])),
      ...section('ET Transfer', await trySp('spRptETCeller', '@PatID', [legacyParam])),
      ...section('BT Transfer', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BioTransfer'])),
      ...section('ET Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'ETFrozen'])),
      ...section('BT Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BTFrozen'])),
    ];
  } else if (type === 6) {
    // 6: OR (OR+ET, Oocyte Recipient)
    sections = [
      ...section('Patient Summary', await trySp('spRptPatSummary', '@PatID,@Flag', [legacyParam, 1])),
      ...section('ET Transfer', await trySp('spRptETCeller', '@PatID', [legacyParam])),
      ...section('BT Transfer', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BioTransfer'])),
      ...section('ET Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'ETFrozen'])),
      ...section('BT Frozen', await trySp('spRptETCeller', '@PatID,@flag', [legacyParam, 'BTFrozen'])),
    ];
  }

  // Fallback demo summary if database is unconfigured or returned no rows
  if (!sections.length && !isDbConfigured()) {
    sections = [
      {
        name: type === 1 ? 'FET Summary' : type === 2 ? 'Oocyte Summary' : type === 4 ? 'Embryo Summary' : 'Patient Summary',
        rows: [
          {
            PatName: resolvedPatName || 'Farah Mohammed Khan',
            PatRefNo: 'PT-004',
            PatAge: 37,
            PatHusbName: 'Mohammed Shaikh',
            PatHusbAge: 40,
            CycID: cleanCycId,
            CycODate: '08/09/2026',
            DocName: 'Dr. Sachin Kadam',
          },
        ],
      },
      {
        name: type === 2 ? 'Oocyte Straw' : type === 1 ? 'Patient Transfer' : 'ET Transfer',
        rows: [
          {
            StrawNo: 'ST-01',
            Location: 'Tank 1 / C-9',
            Grade: 'Grade A',
            Count: 4,
            Stage: 'Blastocyst (Day 5)',
          },
        ],
      },
    ];
  }

  return {
    cycleId: cleanCycId,
    type,
    typeLabel,
    title: artTitle(type),
    sections,
  };
}
