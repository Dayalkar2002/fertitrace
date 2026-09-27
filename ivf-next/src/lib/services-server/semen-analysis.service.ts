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

  // Before Processing
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

  // After Processing
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
  return {
    analysisId: Number(r.CycAID || 0),
    cycleId: String(r.CycID || '').trim(),
    patientId: Number(r.PatID || 0),
    satelliteId: Number(r.SatID || 0),
    date: d,
    abstinence: Number(r.CycAAbstinence || 0),
    indication: String(r.IndicationName || 'ICSI').trim(),
    spermType: String(r.SpermIDName || 'Husband').trim(),
    labOperator: String(r.LabOperatorName || '').trim(),
    method: String(r.MethodName || 'No Culture').trim(),
    collProblem: String(r.CollProblemName || 'No').trim(),
    contamination: String(r.ContaminationName || 'No').trim(),
    whereToUse: String(r.CycAWTU || 'ICSI').trim(),

    appearance: String(r.AppearanceName || 'Normal').trim(),
    colour: String(r.ColourName || 'Normal').trim(),
    viscosity: String(r.ViscosityName || 'Normal').trim(),
    normomorphs1: Number(r.CycANMPH1 || 0),
    normomorphs2: Number(r.CycANMPH2 || 0),
    liquefaction: String(r.LiquefactionName || 'Normal').trim(),
    timeOfLiq: String(r.CycATimeOfLiq || '').trim(),
    agglutination: String(r.CycAAgglut || 'nil').trim(),
    antibodies: String(r.CycAAntibodies || 'nil').trim(),
    fructose: String(r.FructoseName || '+Ve').trim(),
    linearity: String(r.LinearityName || 'A').trim(),
    velocity: Number(r.CycAVelocity || 0),
    ph: Number(r.CycApH || 0),

    beforeVol: Number(r.CycABVol || 0),
    beforeSperms: Number(r.CycABSperms || 0),
    beforeMotility: Number(r.CycABMotility || 0),
    beforeProgMotility: Number(r.CycABProgMotility || 0),
    beforeGrade1: String(r.CycABGrade1 ?? '').trim(),
    beforeGrade2: String(r.CycABGrade2 ?? '').trim(),
    beforeGrade3: String(r.CycABGrade3 ?? '').trim(),
    beforeGrade4: String(r.CycABGrade4 ?? '').trim(),
    beforeWbc: Number(r.CycABWBC || 0),
    beforeRbc: Number(r.CycABRBC || 0),
    beforeEpith: Number(r.CycABECell || 0),
    beforeRound: Number(r.CycABRCell || 0),
    trialSwimUp: String(r.CycABRecovery || '').trim(),

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
    ISNULL(contamMaster.CommName, 'No') AS ContaminationName
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
`;

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
    const row = res.recordset?.[0];
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
