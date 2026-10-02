import { buildParams, executeText } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface CycAnalysisRecord {
  analysisId: number;
  cycleId: string;
  patientId: number;
  satelliteId: number;
  date: string;
  abstinence: number;
  indication: string;
  spermType: string;
  labOperator: string;
  method: string;
  collProblem: string;
  contamination: string;
  whereToUse: string;
  freezingId?: string;
  isFrozen?: boolean;
  location?: string;
  isHams?: boolean;

  // Physical / Basic Details
  appearance: string;
  colour: string;
  viscosity: string;
  normomorphs1: number;
  normomorphs2: number;
  liquefaction: string;
  timeOfLiq: string;
  agglutination: string;
  antibodies: string;
  fructose: string;
  linearity: string;
  velocity: number;
  ph: number;

  // Before Processing / Pre-Freezing
  beforeVol: number;
  beforeSperms: number;
  beforeMotility: number;
  beforeProgMotility: number;
  beforeGrade1: string;
  beforeGrade2: string;
  beforeGrade3: string;
  beforeGrade4: string;
  beforeWbc: number;
  beforeRbc: number;
  beforeEpith: number;
  beforeRound: number;
  trialSwimUp: string;

  // After Processing / Post-Thaw
  afterVol: number;
  afterSperms: number;
  afterMotility: number;
  afterProgMotility: number;
  afterLinearity: string;
  afterGrade1: string;
  afterGrade2: string;
  afterGrade3: string;
  afterGrade4: string;
  afterWbc: number;
  afterRbc: number;
  afterEpith: number;
  afterRound: number;
}

function mapRowToAnalysis(r: Record<string, unknown>): CycAnalysisRecord {
  const d = r.CycADate ? new Date(String(r.CycADate)).toISOString().split('T')[0] : '';
  const freezingId = String(r.CycAFreezingId || '').trim();
  const isFrozen = Boolean(freezingId && freezingId !== '0');

  // Helper to fallback to freezing record if CycAnalysis value is 0 or empty string
  const pickNum = (cycVal: unknown, freezeVal: unknown): number => {
    const n1 = Number(cycVal || 0);
    if (n1 > 0) return n1;
    return Number(freezeVal || 0);
  };

  const pickGrade = (cycVal: unknown, freezeVal: unknown): string => {
    const s1 = String(cycVal ?? '').trim();
    if (s1 && s1 !== '0') return s1;
    const s2 = String(freezeVal ?? '').trim();
    return s2 || (s1 === '0' ? '0' : '');
  };

  const isHams = Boolean(r.CycABHams || r.FreezeHams);
  const beforeVol = pickNum(r.CycABVol, r.FreezeVol);
  const beforeSperms = pickNum(r.CycABSperms, r.FreezeSperms);
  const beforeMotility = pickNum(r.CycABMotility, r.FreezeMotility);
  const beforeProgMotility = pickNum(r.CycABProgMotility, r.FreezeProgMotility);
  const beforeGrade1 = pickGrade(r.CycABGrade1, r.FreezeGrade1);
  const beforeGrade2 = pickGrade(r.CycABGrade2, r.FreezeGrade2);
  const beforeGrade3 = pickGrade(r.CycABGrade3, r.FreezeGrade3);
  const beforeGrade4 = pickGrade(r.CycABGrade4, r.FreezeGrade4);
  const beforeWbc = pickNum(r.CycABWBC, r.FreezeWBC);
  const beforeRbc = pickNum(r.CycABRBC, r.FreezeRBC);
  const beforeEpith = pickNum(r.CycABECell, r.FreezeECell);
  const beforeRound = pickNum(r.CycABRCell, r.FreezeRCell);
  const trialSwimUp = String(
    r.CycABRecovery ?? r.FreezeRecovery ?? (isHams ? "Ham's" : '')
  ).trim();

  const abstinence = Number(r.CycAAbstinence || 0) || Number(r.FreezeAbstinence || 0);
  const location = String(r.FreezeLocation || '').trim() || undefined;

  return {
    analysisId: Number(r.CycAID || 0),
    cycleId: String(r.CycID || '').trim(),
    patientId: Number(r.PatID || 0),
    satelliteId: Number(r.SatID || 0),
    date: d,
    abstinence,
    indication: String(r.IndicationName || 'ICSI').trim(),
    spermType: String(r.SpermIDName || 'Husband').trim(),
    labOperator: String(r.LabOperatorName || '').trim(),
    method: String(r.MethodName || 'No Culture').trim(),
    collProblem: String(r.CollProblemName || 'No').trim(),
    contamination: String(r.ContaminationName || 'No').trim(),
    whereToUse: String(r.CycAWTU || 'ICSI').trim(),
    freezingId: freezingId || undefined,
    isFrozen,
    location,
    isHams,

    appearance: String(r.AppearanceName || 'Normal').trim(),
    colour: String(r.ColourName || 'Normal').trim(),
    viscosity: String(r.ViscosityName || 'Normal').trim(),
    normomorphs1: Number(r.CycANMPH1 || r.FreezeNMPH1 || 0),
    normomorphs2: Number(r.CycANMPH2 || r.FreezeNMPH2 || 0),
    liquefaction: String(r.LiquefactionName || 'Normal').trim(),
    timeOfLiq: String(r.CycATimeOfLiq || r.FreezeTimeOfLiq || '').trim(),
    agglutination: String(r.CycAAgglut || r.FreezeAgglut || 'nil').trim(),
    antibodies: String(r.CycAAntibodies || r.FreezeAntibodies || 'nil').trim(),
    fructose: String(r.FructoseName || '+Ve').trim(),
    linearity: String(r.LinearityName || 'A').trim(),
    velocity: Number(r.CycAVelocity || r.FreezeVelocity || 0),
    ph: Number(r.CycApH || r.FreezePH || 0),

    beforeVol,
    beforeSperms,
    beforeMotility,
    beforeProgMotility,
    beforeGrade1,
    beforeGrade2,
    beforeGrade3,
    beforeGrade4,
    beforeWbc,
    beforeRbc,
    beforeEpith,
    beforeRound,
    trialSwimUp,

    afterVol: Number(r.CycAAVol || 0),
    afterSperms: Number(r.CycAASperms || 0),
    afterMotility: Number(r.CycAAMotility || 0),
    afterProgMotility: Number(r.CycAAProgMotility || 0),
    afterLinearity: String(r.AfterLinearityName || r.LinearityName || 'A').trim(),
    afterGrade1: String(r.CycAAGrade1 ?? '').trim(),
    afterGrade2: String(r.CycAAGrade2 ?? '').trim(),
    afterGrade3: String(r.CycAAGrade3 ?? '').trim(),
    afterGrade4: String(r.CycAAGrade4 ?? '').trim(),
    afterWbc: Number(r.CycAAWBC || 0),
    afterRbc: Number(r.CycAARBC || 0),
    afterEpith: Number(r.CycAAECell || 0),
    afterRound: Number(r.CycAARCell || 0),
  };
}

const BASE_QUERY = `
  SELECT 
    a.*,
    LTRIM(RTRIM(a.CycID)) AS CycIDClean,
    ISNULL(spermIdMaster.CommName, 'Husband') AS SpermIDName,
    ISNULL(indMaster.CommName, 'ICSI') AS IndicationName,
    ISNULL(labOptMaster.CommName, '') AS LabOperatorName,
    ISNULL(mtdMaster.CommName, 'No Culture') AS MethodName,
    ISNULL(appMaster.CommName, 'Normal') AS AppearanceName,
    ISNULL(colMaster.CommName, 'Normal') AS ColourName,
    ISNULL(viscoMaster.CommName, 'Normal') AS ViscosityName,
    ISNULL(liqMaster.CommName, 'Normal') AS LiquefactionName,
    ISNULL(frucMaster.CommName, '+Ve') AS FructoseName,
    ISNULL(linMaster.CommName, 'A') AS LinearityName,
    ISNULL(afterLinMaster.CommName, 'A') AS AfterLinearityName,
    ISNULL(collProbMaster.CommName, 'No') AS CollProblemName,
    ISNULL(contamMaster.CommName, 'No') AS ContaminationName,
    -- Pre-freeze values from CycSelfSemenFreezing or SemenDonor
    ISNULL(selfFreeze.CycABVol, donorFreeze.sdSemenQty) AS FreezeVol,
    ISNULL(selfFreeze.CycABSperms, donorFreeze.sdSemenCount) AS FreezeSperms,
    ISNULL(selfFreeze.CycABMotility, donorFreeze.sdSemenMotility) AS FreezeMotility,
    ISNULL(selfFreeze.CycABProgMotility, donorFreeze.sdSemenProgMotility) AS FreezeProgMotility,
    selfFreeze.CycABGrade1 AS FreezeGrade1,
    selfFreeze.CycABGrade2 AS FreezeGrade2,
    selfFreeze.CycABGrade3 AS FreezeGrade3,
    selfFreeze.CycABGrade4 AS FreezeGrade4,
    ISNULL(selfFreeze.CycABWBC, donorFreeze.sdSemenWBC) AS FreezeWBC,
    ISNULL(selfFreeze.CycABRBC, donorFreeze.sdSemenRBC) AS FreezeRBC,
    selfFreeze.CycABECell AS FreezeECell,
    selfFreeze.CycABRCell AS FreezeRCell,
    ISNULL(selfFreeze.CycABRecovery, donorFreeze.sdRemarks) AS FreezeRecovery,
    selfFreeze.CycABHams AS FreezeHams,
    selfFreeze.CycNMPH1 AS FreezeNMPH1,
    selfFreeze.CycNMPH2 AS FreezeNMPH2,
    selfFreeze.CycTimeOfLiq AS FreezeTimeOfLiq,
    selfFreeze.CycAgglut AS FreezeAgglut,
    selfFreeze.CycAntibodies AS FreezeAntibodies,
    selfFreeze.CycVelocity AS FreezeVelocity,
    selfFreeze.CycpH AS FreezePH,
    selfFreeze.CycAbstinence AS FreezeAbstinence,
    ISNULL(selfFreeze.CycSSLocation, donorFreeze.sdLocation) AS FreezeLocation
  FROM CycAnalysis a
  LEFT JOIN CommonMaster spermIdMaster ON TRY_CAST(a.CycASpermID AS INT) = spermIdMaster.CommID
  LEFT JOIN CommonMaster indMaster ON TRY_CAST(a.CycAIndication AS INT) = indMaster.CommID
  LEFT JOIN CommonMaster labOptMaster ON a.LabOptID = labOptMaster.CommID
  LEFT JOIN CommonMaster mtdMaster ON a.MtdID = mtdMaster.CommID
  LEFT JOIN CommonMaster appMaster ON a.AppID = appMaster.CommID
  LEFT JOIN CommonMaster colMaster ON a.ColID = colMaster.CommID
  LEFT JOIN CommonMaster viscoMaster ON a.ViscoID = viscoMaster.CommID
  LEFT JOIN CommonMaster liqMaster ON a.LiqID = liqMaster.CommID
  LEFT JOIN CommonMaster frucMaster ON a.FrucID = frucMaster.CommID
  LEFT JOIN CommonMaster linMaster ON TRY_CAST(a.CycALin AS INT) = linMaster.CommID
  LEFT JOIN CommonMaster afterLinMaster ON TRY_CAST(a.CycALinearity AS INT) = afterLinMaster.CommID
  LEFT JOIN CommonMaster collProbMaster ON TRY_CAST(a.CycACollProb AS INT) = collProbMaster.CommID
  LEFT JOIN CommonMaster contamMaster ON TRY_CAST(a.CycAContamination AS INT) = contamMaster.CommID
  LEFT JOIN CycSelfSemenFreezing selfFreeze ON LTRIM(RTRIM(ISNULL(a.CycAFreezingId, ''))) = LTRIM(RTRIM(ISNULL(selfFreeze.CycSelfSemenFreezingID, '')))
  LEFT JOIN SemenDonor donorFreeze ON LTRIM(RTRIM(ISNULL(a.CycAFreezingId, ''))) = LTRIM(RTRIM(ISNULL(donorFreeze.sdDonorID, '')))
`;

export async function getSemenAnalysisById(
  analysisId: number
): Promise<CycAnalysisRecord | null> {
  if (!analysisId || !isDbConfigured()) return null;

  try {
    const res = await executeText<Record<string, unknown>>(
      `${BASE_QUERY} WHERE a.CycAID = @CycAID`,
      [{ name: '@CycAID', value: analysisId }]
    );
    const row = res.recordset?.[0];
    if (!row) return null;
    return mapRowToAnalysis(row);
  } catch (error) {
    console.error('Error fetching semen analysis by id:', analysisId, error);
    return null;
  }
}

export async function getCycleSemenAnalysis(
  cycleId: string,
  patId = 0
): Promise<CycAnalysisRecord | null> {
  const cleanId = (cycleId || '').trim();
  if (!cleanId && !patId) return null;
  if (!isDbConfigured()) return null;

  try {
    let whereClause = '';
    const params = [];
    if (cleanId) {
      whereClause = 'WHERE LTRIM(RTRIM(a.CycID)) = @CycID';
      params.push({ name: '@CycID', value: cleanId });
      if (patId) {
        whereClause += ' AND a.PatID = @PatID';
        params.push({ name: '@PatID', value: patId });
      }
    } else {
      whereClause = 'WHERE a.PatID = @PatID';
      params.push({ name: '@PatID', value: patId });
    }

    const res = await executeText<Record<string, unknown>>(
      `${BASE_QUERY} ${whereClause} ORDER BY a.CycAID DESC`,
      params
    );
    let row = res.recordset?.[0];

    // If querying by cycleId returned nothing, fallback to patient's latest record
    if (!row && patId) {
      const fallbackRes = await executeText<Record<string, unknown>>(
        `${BASE_QUERY} WHERE a.PatID = @PatID ORDER BY a.CycAID DESC`,
        [{ name: '@PatID', value: patId }]
      );
      row = fallbackRes.recordset?.[0];
    }

    if (!row) return null;
    return mapRowToAnalysis(row);
  } catch (error) {
    console.error('Error fetching semen analysis for cycle:', cycleId, error);
    return null;
  }
}

export async function getPatientSemenAnalysisList(
  patId: number
): Promise<CycAnalysisRecord[]> {
  if (!patId || !isDbConfigured()) return [];

  try {
    const res = await executeText<Record<string, unknown>>(
      `${BASE_QUERY} WHERE a.PatID = @PatID ORDER BY a.CycAID DESC`,
      [{ name: '@PatID', value: patId }]
    );
    return (res.recordset || []).map(mapRowToAnalysis);
  } catch (error) {
    console.error('Error fetching semen analysis list for patient:', patId, error);
    return [];
  }
}
