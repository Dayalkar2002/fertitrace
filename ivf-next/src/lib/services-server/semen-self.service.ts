import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { formatSmartDate, rowNum, rowVal, toInputDate } from '@/lib/db/row';

const SEMEN_SELF_SP = 'spCycSelfSF';
const SEMEN_SELF_PARAMS =
  '@CycSelfSemenFreezingID,@PatID,@SatID,@CycSSID,@CycABVol,@CycABSperms,@CycABMotility,@CycABProgMotility,@CycABGrade1,@CycABGrade2,@CycABGrade3,@CycABGrade4,@CycABWBC,@CycABRBC,@CycABECell,@CycABRCell,@CycABRecovery,@CycABHams,@CycSSLocation,@QueryIndex,@iAppID,@iColID,@iViscoID,@iIUIANMPH1,@iIUIANMPH2,@iLiqID,@sIUIATimeOfLiq,@sIUIAAgglut,@sIUIAAntibodies,@iFrucID,@iIUIALin,@iIUIAVelocity,@dIUIApH,@iIUIACollProb,@iIUIAContamination,@iIUIAAbstinence,@iLabOptID,@iMtdID,@DIUIAPValidTillDate,@CycSSCreationDate,@sImpression';

export interface SemenSelfRecord {
  freezingId: string;
  cycSSID: number;
  vol: string;
  sperms: string;
  motility: string;
  progMotility: string;
  grade1: string;
  grade2: string;
  grade3: string;
  grade4: string;
  wbc: string;
  rbc: string;
  epithCell: string;
  roundCell: string;
  recovery: string;
  hams: boolean;
  location: string;
  frozenDate: string;
  frozenDateInput: string;
  thawDate: string;
  thawId: string;
  discardDate: string;
  validTill: string;
  validTillInput: string;
  husbandAadhar: string;
  abstinence: string;
  labOptId: number;
  methodId: number;
  collProbId: number;
  contaminationId: number;
  appearanceId: number;
  colourId: number;
  viscosityId: number;
  nmph1: string;
  nmph2: string;
  liqId: number;
  timeOfLiq: string;
  agglutination: string;
  antibodies: string;
  fructoseId: number;
  linearityId: number;
  velocity: string;
  ph: string;
  impression: string;
}

function listValues(patId: number, satId: number, queryIndex: number, cycSSID = 0, freezingId = ''): unknown[] {
  const now = new Date();
  return [
    freezingId,
    patId,
    satId,
    cycSSID,
    0,
    0,
    0,
    0,
    '',
    '',
    '',
    '',
    0,
    0,
    0,
    0,
    '',
    false,
    '',
    queryIndex,
    0,
    0,
    0,
    0,
    0,
    0,
    '',
    '',
    '',
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    now,
    now,
    '',
  ];
}

async function getHusbandAadhar(patId: number): Promise<string> {
  if (patId <= 0) return '';
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 LTRIM(RTRIM(ISNULL(NULLIF(PatHusbAdhar, ''), ISNULL(HusbandAdhar, '')))) AS HusbandAadhar
       FROM PatientMaster WHERE PatID = @PatID`,
      [{ name: '@PatID', value: patId }]
    );
    return rowVal(result.recordset?.[0] || {}, 'HusbandAadhar');
  } catch {
    try {
      const fallback = await executeText<Record<string, unknown>>(
        `SELECT TOP 1 LTRIM(RTRIM(ISNULL(HusbandAdhar, ''))) AS HusbandAadhar
         FROM PatientMaster WHERE PatID = @PatID`,
        [{ name: '@PatID', value: patId }]
      );
      return rowVal(fallback.recordset?.[0] || {}, 'HusbandAadhar');
    } catch {
      return '';
    }
  }
}

function mapRecord(row: Record<string, unknown>, husbandAadhar: string): SemenSelfRecord {
  const frozen = row.CycSSCreationDate ?? row.cycSSCreationDate;
  const validTill = row.CycValidTill ?? row.cycValidTill;
  return {
    freezingId: rowVal(row, 'CycSelfSemenFreezingID'),
    cycSSID: rowNum(row, 'CycSSID'),
    vol: rowVal(row, 'CycABVol'),
    sperms: rowVal(row, 'CycABSperms'),
    motility: rowVal(row, 'CycABMotility'),
    progMotility: rowVal(row, 'CycABProgMotility'),
    grade1: rowVal(row, 'CycABGrade1'),
    grade2: rowVal(row, 'CycABGrade2'),
    grade3: rowVal(row, 'CycABGrade3'),
    grade4: rowVal(row, 'CycABGrade4'),
    wbc: rowVal(row, 'CycABWBC'),
    rbc: rowVal(row, 'CycABRBC'),
    epithCell: rowVal(row, 'CycABECell'),
    roundCell: rowVal(row, 'CycABRCell'),
    recovery: rowVal(row, 'CycABRecovery'),
    hams: String(row.CycABHams ?? '').toLowerCase() === 'true' || row.CycABHams === true || row.CycABHams === 1,
    location: rowVal(row, 'CycSSLocation'),
    frozenDate: formatSmartDate(frozen),
    frozenDateInput: toInputDate(frozen),
    thawDate: formatSmartDate(row.Thawdate ?? row.ThawDate),
    thawId: rowVal(row, 'IUIThawID'),
    discardDate: formatSmartDate(row.DiscardDate),
    validTill: formatSmartDate(validTill),
    validTillInput: toInputDate(validTill),
    husbandAadhar,
    abstinence: rowVal(row, 'CycAbstinence'),
    labOptId: rowNum(row, 'LabOptID'),
    methodId: rowNum(row, 'MtdID'),
    collProbId: rowNum(row, 'CycCollProb'),
    contaminationId: rowNum(row, 'CycContamination'),
    appearanceId: rowNum(row, 'CycAppID'),
    colourId: rowNum(row, 'CycColID'),
    viscosityId: rowNum(row, 'CycViscoID'),
    nmph1: rowVal(row, 'CycNMPH1'),
    nmph2: rowVal(row, 'CycNMPH2'),
    liqId: rowNum(row, 'CycLiqID'),
    timeOfLiq: rowVal(row, 'CycTimeOfLiq'),
    agglutination: rowVal(row, 'CycAgglut'),
    antibodies: rowVal(row, 'CycAntibodies'),
    fructoseId: rowNum(row, 'CycFrucID'),
    linearityId: rowNum(row, 'CycLin'),
    velocity: rowVal(row, 'CycVelocity'),
    ph: rowVal(row, 'CycpH'),
    impression: rowVal(row, 'Impression'),
  };
}

export async function listSemenSelf(patId: number, satId: number): Promise<SemenSelfRecord[]> {
  if (!patId) return [];
  const result = await executeDRL<Record<string, unknown>>(
    SEMEN_SELF_SP,
    buildParams(SEMEN_SELF_PARAMS, listValues(patId, satId || 0, 1))
  );
  const husbandAadhar = await getHusbandAadhar(patId);
  return (result.recordset || []).map((row) => mapRecord(row, husbandAadhar));
}

export async function deleteSemenSelf(
  patId: number,
  satId: number,
  cycSSID: number,
  freezingId: string
): Promise<SemenSelfRecord[]> {
  if (!cycSSID && !freezingId) {
    throw Object.assign(new Error('Freezing record is required.'), { status: 400 });
  }
  await executeDRL(
    SEMEN_SELF_SP,
    buildParams(SEMEN_SELF_PARAMS, listValues(patId, satId || 0, 13, cycSSID, freezingId))
  );
  return listSemenSelf(patId, satId);
}
