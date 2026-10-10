import { executeDRL, executeDML, buildParams, executeText } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';
import { listCommonMaster } from '@/lib/services-server/master.service';
import type {
  CycleHistory,
  CycleHistoryAttempt,
  CycleOutcome,
  CycleSurvival,
  TabMasters,
} from '@/lib/types/cycle-detail';

const HISTORY_SP = 'spCycHistory';
const HISTORY_ATTEMPT_SP = 'spCycHistoryAttempt';
const HISTORY_ATTEMPT_EXT_SP = 'spCycHistoryAttemptExtDRL';
const SURVIVAL_SP = 'spCycSurvivalReport';
const OUTCOME_SP = 'spCycOutCome';

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolByte(value: unknown): number {
  return value ? 1 : 0;
}

function parseDate(value?: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function formatDateStr(value?: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  if (d.getFullYear() <= 1905) return '';
  return d.toISOString().split('T')[0];
}

export function defaultHistory(): CycleHistory {
  return {
    height: 0,
    weight: 0,
    bmi: 0,
    allergyId: 0,
    medSurHistory: '',
    isg: 0,
    isp: 0,
    isAb: 0,
    isEct: 0,
    isDuration: 0,
    findings: {
      idiopathic: false,
      if: false,
      mf: false,
      dor: false,
      ovu: false,
      tf: false,
      cf: false,
      endo: false,
      other: false,
    },
    endoOpt: 0,
    otherTxt: '',
    indication: '',
    hlmp: '',
    hsg: '',
    stimProtId: 0,
    attemptCount: 0,
    attemptPrev: 0,
    attemptEw: 0,
    currentDate: new Date().toISOString().split('T')[0],
    comments: '',
    monitoringSheet: '',
    historyAttempts: [],
  };
}

export function defaultSurvival(): CycleSurvival {
  return {
    conc: 0,
    motility: 0,
    nmph1: 0,
    nmph2: 0,
    date: new Date().toISOString().split('T')[0],
    recovery: '',
    antibodies: '',
    saResult: { positive: false, borderline: false, negative: false },
    gnrh: { none: false, stopLupron: false, luteal: false },
    dosage: false,
    spermSource: { donor: false, donorCryo: false, husband: false, husbandCryo: false },
    transferType: { ivf: false, gift: false, zift: false, cryoAll: false },
    consent: { icsi: false, hatching: false, cryo: false, immatures: false, apa: false },
    comments: '',
  };
}

export function defaultOutcome(cycleType = ''): CycleOutcome {
  return {
    outcomeDate: new Date().toISOString().split('T')[0],
    bhcgDate: '',
    value: 0,
    noSacs: 0,
    ptDay: 0,
    outcome: 0,
    pregOpt: 0,
    pregDelOpt: 0,
    postTreatment: '',
    advice:
      '1. Bed Rest.\n2. No Sexual Relation\n3. Contact the clinic if:-\n   (i) Bleeding / spotting\n   (ii) Pain in abdomen\n   (iii) Fever\n   (iv) Other complains if any',
    treatment: '',
  };
}

export async function resolveCycleContext(cycleId: string): Promise<{ patId: number; satId: number; cycleType: string }> {
  const cleanId = (cycleId || '').trim();
  if (!cleanId) return { patId: 0, satId: 0, cycleType: '' };

  try {
    const outcomeRes = await executeText<{ PatID?: number; SatID?: number; CycOType?: string }>(
      `SELECT TOP 1 PatID, SatID, CycOType FROM CycOutCome WHERE LTRIM(RTRIM(CycID)) = @CycID`,
      buildParams('@CycID', [cleanId])
    );
    if (outcomeRes.recordset?.[0]) {
      const r = outcomeRes.recordset[0];
      return {
        patId: num(r.PatID),
        satId: num(r.SatID, 1),
        cycleType: String(r.CycOType || ''),
      };
    }

    const histRes = await executeText<{ PatID?: number; SatID?: number }>(
      `SELECT TOP 1 PatID, SatID FROM CycHistory WHERE LTRIM(RTRIM(CycID)) = @CycID`,
      buildParams('@CycID', [cleanId])
    );
    if (histRes.recordset?.[0]) {
      const r = histRes.recordset[0];
      return {
        patId: num(r.PatID),
        satId: num(r.SatID, 1),
        cycleType: '',
      };
    }
  } catch {
    /* fallback below */
  }

  return { patId: 0, satId: 1, cycleType: '' };
}

export async function loadTabMasters(): Promise<TabMasters> {
  const [allergies, stimProtocols, fshDrugs, hmgDrugs, cloDrugs, antaDrugs, otherDrugs, catheters] = await Promise.all([
    listCommonMaster(12).catch(() => []),
    listCommonMaster(13).catch(() => []),
    listCommonMaster(14).catch(() => []),
    listCommonMaster(15).catch(() => []),
    listCommonMaster(17).catch(() => []),
    listCommonMaster(18).catch(() => []),
    listCommonMaster(19).catch(() => []),
    listCommonMaster(9).catch(() => []),
  ]);
  return {
    allergies,
    stimProtocols,
    fshDrugs,
    hmgDrugs,
    cloDrugs,
    antaDrugs,
    otherDrugs,
    catheters,
  };
}

export async function loadHistory(cycleId: string, patId = 0, satId = 0): Promise<{ data: CycleHistory; masters: TabMasters }> {
  const masters = await loadTabMasters();
  const cleanId = (cycleId || '').trim();

  let resolvedPatId = patId;
  let resolvedSatId = satId;
  if (!resolvedPatId || !resolvedSatId) {
    const ctx = await resolveCycleContext(cleanId);
    if (!resolvedPatId) resolvedPatId = ctx.patId;
    if (!resolvedSatId) resolvedSatId = ctx.satId;
  }

  if (!cleanId || !isDbConfigured()) {
    return { data: defaultHistory(), masters };
  }

  try {
    const params = buildHistoryParams(defaultHistory(), resolvedPatId, resolvedSatId, cleanId, 2);
    const result = await executeDRL<Record<string, unknown>>(HISTORY_SP, params);
    const row = result.recordset?.[0];
    const data = row ? mapHistoryFromDb(row) : defaultHistory();

    const attemptParams = buildParams('@CycID,@CycHAID,@PatID,@SatID,@QueryIndex', [
      cleanId,
      0,
      resolvedPatId,
      resolvedSatId,
      1,
    ]);
    const attemptResult = await executeDRL<Record<string, unknown>>(HISTORY_ATTEMPT_EXT_SP, attemptParams).catch(() => ({ recordset: [] }));
    data.historyAttempts = (attemptResult.recordset || []).map((r) => ({
      cycleDate: formatDateStr(r.CycHACycleDate),
      ivf: !!r.CycHAPIVF,
      icsi: !!r.CycHAPICSI,
      stimProtId: num(r.StimProtID),
      lmp: formatDateStr(r.CycHALMP),
      stimDetails: String(r.CycHAStimDetails || ''),
      he2: num(r.CycHAHE2),
      prgs: num(r.CycHAPrgs),
      lh: num(r.CycHALH),
      hcg: String(r.CycHAHCG || ''),
      ovum: String(r.CycHAOvum || ''),
      oocytes: num(r.CycHAOocytes),
      fertilized: num(r.CycHAFertilized),
      remark: String(r.CycHARemark || ''),
    }));

    return { data, masters };
  } catch (err) {
    console.error('Failed to load cycle history from DB:', err);
    return { data: defaultHistory(), masters };
  }
}

export async function saveHistory(
  cycleId: string,
  payload: CycleHistory,
  patId = 0,
  satId = 0
): Promise<CycleHistory> {
  const cleanId = (cycleId || '').trim();
  let resolvedPatId = patId;
  let resolvedSatId = satId;
  if (!resolvedPatId || !resolvedSatId) {
    const ctx = await resolveCycleContext(cleanId);
    if (!resolvedPatId) resolvedPatId = ctx.patId;
    if (!resolvedSatId) resolvedSatId = ctx.satId;
  }

  if (isDbConfigured() && cleanId) {
    // Check if record exists
    const checkRes = await executeText<{ CycHID?: number }>(
      `SELECT TOP 1 CycHID FROM CycHistory WHERE LTRIM(RTRIM(CycID)) = @CycID`,
      buildParams('@CycID', [cleanId])
    ).catch(() => ({ recordset: [] }));

    const existingId = num(checkRes.recordset?.[0]?.CycHID, 0);
    const queryIndex = existingId > 0 ? 12 : 11;

    const params = buildHistoryParams(payload, resolvedPatId, resolvedSatId, cleanId, queryIndex, existingId);
    await executeDML(HISTORY_SP, params);

    for (const attempt of payload.historyAttempts || []) {
      const attemptParams = buildParams(
        '@CycID,@CycHAID,@PatID,@SatID,@CycHADateOfCreation,@CycHACycleDate,@CycHAPIVF,@CycHAPICSI,@StimProtID,@CycHALMP,@CycHAStimDetails,@CycHAHE2,@CycHAPrgs,@CycHALH,@CycHAHCG,@CycHAOvum,@CycHAOocytes,@CycHAFertilized,@CycHAOAllocatedIVF,@CycHAOAllocatedICSI,@CycHAOMIIIVF,@CycHAOMIIICSI,@CycHAOFertilizedIVF,@CycHAOFertilizedICSI,@CycHACEmbryosIVF,@CycHACEmbryosICSI,@CycHAETransferedIVF,@CycHAETransferedICSI,@CycHAEFrozenIVF,@CycHAEFrozenICSI,@CycHABTransferedIVF,@CycHABTransferedICSI,@CycHABFrozenIVF,@CycHABFrozenICSI,@CycHAETDoneOn,@ETCathID,@CycHAEGrdnCeller,@CycHABTDoneOn,@BTCathID,@CycHABGrd,@CycHABHcgDoneOne,@CycHARemark,@QueryIndex',
        [
          cleanId,
          0,
          resolvedPatId,
          resolvedSatId,
          new Date(),
          parseDate(attempt.cycleDate),
          boolByte(attempt.ivf),
          boolByte(attempt.icsi),
          num(attempt.stimProtId),
          parseDate(attempt.lmp),
          attempt.stimDetails || '',
          num(attempt.he2),
          num(attempt.prgs),
          num(attempt.lh),
          attempt.hcg || '',
          attempt.ovum || '',
          num(attempt.oocytes),
          num(attempt.fertilized),
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          new Date(1900, 0, 1),
          0,
          '',
          new Date(1900, 0, 1),
          0,
          '',
          new Date(1900, 0, 1),
          attempt.remark || '',
          11,
        ]
      );
      await executeDML(HISTORY_ATTEMPT_SP, attemptParams).catch(() => null);
    }
  }

  return payload;
}

export async function loadSurvival(cycleId: string, patId = 0, satId = 0): Promise<CycleSurvival> {
  const cleanId = (cycleId || '').trim();
  let resolvedPatId = patId;
  let resolvedSatId = satId;
  if (!resolvedPatId || !resolvedSatId) {
    const ctx = await resolveCycleContext(cleanId);
    if (!resolvedPatId) resolvedPatId = ctx.patId;
    if (!resolvedSatId) resolvedSatId = ctx.satId;
  }

  if (!cleanId || !isDbConfigured()) {
    return defaultSurvival();
  }

  try {
    const params = buildSurvivalParams(defaultSurvival(), resolvedPatId, resolvedSatId, cleanId, 2);
    const result = await executeDRL<Record<string, unknown>>(SURVIVAL_SP, params);
    const row = result.recordset?.[0];
    return row ? mapSurvivalFromDb(row) : defaultSurvival();
  } catch (err) {
    console.error('Failed to load cycle survival from DB:', err);
    return defaultSurvival();
  }
}

export async function saveSurvival(
  cycleId: string,
  payload: CycleSurvival,
  patId = 0,
  satId = 0
): Promise<CycleSurvival> {
  const cleanId = (cycleId || '').trim();
  let resolvedPatId = patId;
  let resolvedSatId = satId;
  if (!resolvedPatId || !resolvedSatId) {
    const ctx = await resolveCycleContext(cleanId);
    if (!resolvedPatId) resolvedPatId = ctx.patId;
    if (!resolvedSatId) resolvedSatId = ctx.satId;
  }

  if (isDbConfigured() && cleanId) {
    const checkRes = await executeText<{ CycSID?: number }>(
      `SELECT TOP 1 CycSID FROM CycSurvivalReport WHERE LTRIM(RTRIM(CycID)) = @CycID`,
      buildParams('@CycID', [cleanId])
    ).catch(() => ({ recordset: [] }));

    const existingId = num(checkRes.recordset?.[0]?.CycSID, 0);
    const queryIndex = existingId > 0 ? 12 : 11;

    const params = buildSurvivalParams(payload, resolvedPatId, resolvedSatId, cleanId, queryIndex, existingId);
    await executeDML(SURVIVAL_SP, params);
  }

  return payload;
}

export async function loadOutcome(cycleId: string, patId = 0, satId = 0, cycleType = ''): Promise<CycleOutcome> {
  const cleanId = (cycleId || '').trim();
  let resolvedPatId = patId;
  let resolvedSatId = satId;
  let resolvedType = cycleType;
  if (!resolvedPatId || !resolvedSatId || !resolvedType) {
    const ctx = await resolveCycleContext(cleanId);
    if (!resolvedPatId) resolvedPatId = ctx.patId;
    if (!resolvedSatId) resolvedSatId = ctx.satId;
    if (!resolvedType) resolvedType = ctx.cycleType;
  }

  if (!cleanId || !isDbConfigured()) {
    return defaultOutcome(resolvedType);
  }

  try {
    const params = buildOutcomeParams(defaultOutcome(resolvedType), resolvedPatId, resolvedSatId, cleanId, 2, 0, resolvedType);
    const result = await executeDRL<Record<string, unknown>>(OUTCOME_SP, params);
    const row = result.recordset?.[0];
    return row ? mapOutcomeFromDb(row) : defaultOutcome(resolvedType);
  } catch (err) {
    console.error('Failed to load cycle outcome from DB:', err);
    return defaultOutcome(resolvedType);
  }
}

export async function saveOutcome(
  cycleId: string,
  payload: CycleOutcome,
  patId = 0,
  satId = 0,
  cycleType = ''
): Promise<CycleOutcome> {
  const cleanId = (cycleId || '').trim();
  let resolvedPatId = patId;
  let resolvedSatId = satId;
  let resolvedType = cycleType;
  if (!resolvedPatId || !resolvedSatId || !resolvedType) {
    const ctx = await resolveCycleContext(cleanId);
    if (!resolvedPatId) resolvedPatId = ctx.patId;
    if (!resolvedSatId) resolvedSatId = ctx.satId;
    if (!resolvedType) resolvedType = ctx.cycleType;
  }

  if (isDbConfigured() && cleanId) {
    const checkRes = await executeText<{ CycOID?: number }>(
      `SELECT TOP 1 CycOID FROM CycOutCome WHERE LTRIM(RTRIM(CycID)) = @CycID`,
      buildParams('@CycID', [cleanId])
    ).catch(() => ({ recordset: [] }));

    const existingId = num(checkRes.recordset?.[0]?.CycOID, 0);
    const queryIndex = existingId > 0 ? 12 : 11;

    const params = buildOutcomeParams(payload, resolvedPatId, resolvedSatId, cleanId, queryIndex, existingId, resolvedType);
    await executeDML(OUTCOME_SP, params);
  }

  return payload;
}

// --- Parameter Builders ---

function buildHistoryParams(
  data: CycleHistory,
  patId: number,
  satId: number,
  cycId: string,
  queryIndex: number,
  cycHId = 0
) {
  const f = data.findings || ({} as CycleHistory['findings']);
  return buildParams(
    '@CycID,@CycHID,@PatID,@SatID,@CycHDateOfCreation,@CycHHeight,@CycHWeight,@CycHBMI,@AllergyID,@CycHMedSur,@CycHISG,@CycHISP,@CycHISAb,@CycHISEct,@CycHISDuration,@CycHIdio,@CycHIF,@CycHMF,@CycHDOR,@CycHOvu,@CycHTF,@CycHCF,@CycHEndo,@CycHEndoOpt,@CycHOther,@CycHOtherTXT,@CycHIndi,@CycHHAsian,@CycHHBlack,@CycHHWhite,@CycHHOther,@CycHHLMP,@CycHNHAsian,@CycHNHBlack,@CycHNHWhite,@CycHNHUnknown,@CycHHSG,@StimProtID,@CycHAttem,@CycHAttemPrev,@CycHAttemEW,@CycHCurrentDate,@CycHComments,@QueryIndex',
    [
      cycId,
      cycHId,
      num(patId),
      num(satId),
      new Date(),
      num(data.height),
      num(data.weight),
      num(data.bmi),
      num(data.allergyId),
      data.medSurHistory || '',
      num(data.isg),
      num(data.isp),
      num(data.isAb),
      num(data.isEct),
      num(data.isDuration),
      boolByte(f.idiopathic),
      boolByte(f.if),
      boolByte(f.mf),
      boolByte(f.dor),
      boolByte(f.ovu),
      boolByte(f.tf),
      boolByte(f.cf),
      boolByte(f.endo),
      num(data.endoOpt),
      boolByte(f.other),
      data.otherTxt || '',
      data.indication || '',
      0, 0, 0, 0, // Hispanic
      parseDate(data.hlmp),
      0, 0, 0, 0, // Non-hispanic
      data.hsg || '',
      num(data.stimProtId),
      num(data.attemptCount),
      num(data.attemptPrev),
      num(data.attemptEw),
      parseDate(data.currentDate),
      data.comments || '',
      queryIndex,
    ]
  );
}

function buildSurvivalParams(
  data: CycleSurvival,
  patId: number,
  satId: number,
  cycId: string,
  queryIndex: number,
  cycSId = 0
) {
  const sa = data.saResult || {};
  const g = data.gnrh || {};
  const sp = data.spermSource || {};
  const tr = data.transferType || {};
  const c = data.consent || {};
  return buildParams(
    '@CycID,@CycSID,@PatID,@SatID,@CycSDateOfCreation,@CycSSConcSpearm,@CycSSMotility,@CycSSNMPH1,@CycSSNMPH2,@CycSSDate,@CycSSRecovery,@CycSSAntibodies,@CycSAPositive,@CycSABorderline,@CycSANegative,@CycSGNone,@CycSGStopLupron,@CycSGLuteal,@CycSDosage,@CycSSpDonor,@CycSSpDonorCryo,@CycSSpHusb,@CycSSpHusbCryo,@CycSTIVF,@CycSTGIFT,@CycSTZIFT,@CycSTCryoAll,@CycSCICSI,@CycSCHatching,@CycSCCryo,@CycSCImmatures,@CycSCAPA,@CycSComments,@QueryIndex',
    [
      cycId,
      cycSId,
      num(patId),
      num(satId),
      new Date(),
      num(data.conc),
      num(data.motility),
      num(data.nmph1),
      num(data.nmph2),
      parseDate(data.date),
      data.recovery || '',
      data.antibodies || '',
      boolByte(sa.positive),
      boolByte(sa.borderline),
      boolByte(sa.negative),
      boolByte(g.none),
      boolByte(g.stopLupron),
      boolByte(g.luteal),
      boolByte(data.dosage),
      boolByte(sp.donor),
      boolByte(sp.donorCryo),
      boolByte(sp.husband),
      boolByte(sp.husbandCryo),
      boolByte(tr.ivf),
      boolByte(tr.gift),
      boolByte(tr.zift),
      boolByte(tr.cryoAll),
      boolByte(c.icsi),
      boolByte(c.hatching),
      boolByte(c.cryo),
      boolByte(c.immatures),
      boolByte(c.apa),
      data.comments || '',
      queryIndex,
    ]
  );
}

function buildOutcomeParams(
  data: CycleOutcome,
  patId: number,
  satId: number,
  cycId: string,
  queryIndex: number,
  cycOId = 0,
  cycleType = ''
) {
  return buildParams(
    '@CycID,@CycOID,@PatID,@SatID,@CycODate,@CycOBHCGDate,@CycODateOfCreation,@CycOValue,@CycONoSac,@CycOPTDay,@CycOOutcome,@CycOPregOpt,@CycOPregDelOpt,@CycOPostTreat,@CycOAdvice,@CycOTreatment,@QueryIndex,@CycOType',
    [
      cycId,
      cycOId,
      num(patId),
      num(satId),
      parseDate(data.outcomeDate),
      data.bhcgDate ? parseDate(data.bhcgDate) : new Date(1900, 0, 1),
      new Date(),
      num(data.value),
      num(data.noSacs),
      num(data.ptDay),
      num(data.outcome),
      num(data.pregOpt),
      num(data.pregDelOpt),
      data.postTreatment || '',
      data.advice || '',
      data.treatment || '',
      queryIndex,
      cycleType || '',
    ]
  );
}

// --- DB Mapping Helpers ---

function mapHistoryFromDb(row: Record<string, unknown>): CycleHistory {
  return {
    height: num(row.CycHHeight),
    weight: num(row.CycHWeight),
    bmi: num(row.CycHBMI),
    allergyId: num(row.AllergyID),
    medSurHistory: String(row.CycHMedSur || ''),
    isg: num(row.CycHISG),
    isp: num(row.CycHISP),
    isAb: num(row.CycHISAb),
    isEct: num(row.CycHISEct),
    isDuration: num(row.CycHISDuration),
    findings: {
      idiopathic: !!row.CycHIdio,
      if: !!row.CycHIF,
      mf: !!row.CycHMF,
      dor: !!row.CycHDOR,
      ovu: !!row.CycHOvu,
      tf: !!row.CycHTF,
      cf: !!row.CycHCF,
      endo: !!row.CycHEndo,
      other: !!row.CycHOther,
    },
    endoOpt: num(row.CycHEndoOpt),
    otherTxt: String(row.CycHOtherTXT || ''),
    indication: String(row.CycHIndi || ''),
    hlmp: formatDateStr(row.CycHHLMP),
    hsg: String(row.CycHHSG || ''),
    stimProtId: num(row.StimProtID),
    attemptCount: num(row.CycHAttem),
    attemptPrev: num(row.CycHAttemPrev),
    attemptEw: num(row.CycHAttemEW),
    currentDate: formatDateStr(row.CycHCurrentDate),
    comments: String(row.CycHComments || ''),
    monitoringSheet: '',
    historyAttempts: [],
  };
}

function mapSurvivalFromDb(row: Record<string, unknown>): CycleSurvival {
  return {
    conc: num(row.CycSSConcSpearm),
    motility: num(row.CycSSMotility),
    nmph1: num(row.CycSSNMPH1),
    nmph2: num(row.CycSSNMPH2),
    date: formatDateStr(row.CycSSDate),
    recovery: String(row.CycSSRecovery || ''),
    antibodies: String(row.CycSSAntibodies || ''),
    saResult: {
      positive: !!row.CycSAPositive,
      borderline: !!row.CycSABorderline,
      negative: !!row.CycSANegative,
    },
    gnrh: {
      none: !!row.CycSGNone,
      stopLupron: !!row.CycSGStopLupron,
      luteal: !!row.CycSGLuteal,
    },
    dosage: !!row.CycSDosage,
    spermSource: {
      donor: !!row.CycSSpDonor,
      donorCryo: !!row.CycSSpDonorCryo,
      husband: !!row.CycSSpHusb,
      husbandCryo: !!row.CycSSpHusbCryo,
    },
    transferType: {
      ivf: !!row.CycSTIVF,
      gift: !!row.CycSTGIFT,
      zift: !!row.CycSTZIFT,
      cryoAll: !!row.CycSTCryoAll,
    },
    consent: {
      icsi: !!row.CycSCICSI,
      hatching: !!row.CycSCHatching,
      cryo: !!row.CycSCCryo,
      immatures: !!row.CycSCImmatures,
      apa: !!row.CycSCAPA,
    },
    comments: String(row.CycSComments || ''),
  };
}

function cleanHtmlContent(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text) return '';
  // If no HTML tags or common entities, return as-is
  if (!/<[a-z!/][\s\S]*>/i.test(text) && !/&(?:nbsp|amp|lt|gt|quot|#39);/i.test(text)) {
    return text;
  }
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(div|p|h[1-6]|li|tr)[\s>]/gi, '\n$&')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(div|p|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapOutcomeFromDb(row: Record<string, unknown>): CycleOutcome {
  return {
    outcomeDate: formatDateStr(row.CycODate),
    bhcgDate: formatDateStr(row.CycOBHCGDate),
    value: num(row.CycOValue),
    noSacs: num(row.CycONoSac),
    ptDay: num(row.CycOPTDay),
    outcome: num(row.CycOOutcome),
    pregOpt: num(row.CycOPregOpt),
    pregDelOpt: num(row.CycOPregDelOpt),
    postTreatment: cleanHtmlContent(row.CycOPostTreat),
    advice: cleanHtmlContent(row.CycOAdvice),
    treatment: cleanHtmlContent(row.CycOTreatment),
  };
}
