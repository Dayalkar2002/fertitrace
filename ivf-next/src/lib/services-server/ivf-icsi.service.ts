import { isDbConfigured } from '@/lib/db/pool';
import { executeText, buildParams } from '@/lib/db/spExecutor';
import { rowVal } from '@/lib/db/row';

export async function loadIvfRecord(
  patId: number,
  satId: number,
  cycId: string,
  _cycleDate?: string
) {
  if (!isDbConfigured()) {
    return { exists: false, data: null };
  }

  try {
    const cleanCycId = cycId.trim();
    const res = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM IVF 
       WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID 
       ORDER BY IVFDateOfCreation DESC`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId },
        { name: '@CycID', value: cleanCycId },
      ]
    );

    const row = res.recordset?.[0];
    if (!row) {
      return { exists: false, data: null };
    }

    return { exists: true, data: row };
  } catch (err) {
    console.error('Error loading IVF record:', err);
    return { exists: false, data: null };
  }
}

export async function loadIcsiRecord(
  patId: number,
  satId: number,
  cycId: string,
  _cycleDate?: string
) {
  if (!isDbConfigured()) {
    return { exists: false, data: null };
  }

  try {
    const cleanCycId = cycId.trim();
    const res = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM ICSI 
       WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID 
       ORDER BY ICSIDateOfCreation DESC`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId },
        { name: '@CycID', value: cleanCycId },
      ]
    );

    const row = res.recordset?.[0];
    if (!row) {
      return { exists: false, data: null };
    }

    return { exists: true, data: row };
  } catch (err) {
    console.error('Error loading ICSI record:', err);
    return { exists: false, data: null };
  }
}

export async function loadMonitoringDrugs(
  patId: number,
  satId: number,
  cycId: string
) {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const cleanCycId = cycId.trim();
    const res = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 MCCDFSHDrug1, MCCDFSHDrug2, MCCDHMGDrug1, MCCDHMGDrgu2 
       FROM CycMonitoringChartCycleDay 
       WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId },
        { name: '@CycID', value: cleanCycId },
      ]
    );

    return res.recordset?.[0] || null;
  } catch (err) {
    console.error('Error loading monitoring drugs:', err);
    return null;
  }
}

export async function saveIvfRecord(payload: Record<string, unknown>) {
  if (!isDbConfigured()) {
    return { success: true, message: 'IVF record saved (offline/demo mode).', data: {} };
  }

  try {
    const patId = Number(payload.patId || 0);
    const satId = Number(payload.satId || 0);
    const cycId = String(payload.cycId || '').trim();
    let ivfId = String(payload.ivfId || '').trim();

    // Check if record exists
    const existing = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 IVFID FROM IVF WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId },
        { name: '@CycID', value: cycId },
      ]
    );

    const isUpdate = existing.recordset && existing.recordset.length > 0;
    if (isUpdate && !ivfId) {
      ivfId = rowVal(existing.recordset[0], 'IVFID');
    }

    if (!ivfId) {
      // Generate new IVFID
      const maxRes = await executeText<Record<string, unknown>>(
        `SELECT ISNULL(MAX(CAST(SUBSTRING(IVFID, 4, 10) AS INT)), 0) + 1 AS NextID FROM IVF WHERE IVFID LIKE 'IVF%'`
      );
      const nextNum = maxRes.recordset?.[0]?.NextID || 1;
      ivfId = `IVF${nextNum}`;
    }

    const n = (val: unknown) => (val != null && val !== '' ? Number(val) : 0);
    const b = (val: unknown) => (val === true || val === 1 || val === '1' ? 1 : 0);

    if (isUpdate) {
      await executeText(
        `UPDATE IVF SET
          IVFSGnRN = @IVFSGnRN,
          IVFSLuteal = @IVFSLuteal,
          IVFSStopL = @IVFSStopL,
          IVFSNone = @IVFSNone,
          MCCDFSHDrug1 = @MCCDFSHDrug1,
          MCCDFSHDrug2 = @MCCDFSHDrug2,
          MCCDHMGDrug1 = @MCCDHMGDrug1,
          MCCDHMGDrgu2 = @MCCDHMGDrgu2,
          IVFSOther = @IVFSOther,
          IVFSOtherVal = @IVFSOtherVal,
          IVFSNaturalCycle = @IVFSNaturalCycle,
          IVFSE2Pattern1 = @IVFSE2Pattern1,
          IVFSE2Pattern2 = @IVFSE2Pattern2,
          IVFSE2Pattern3 = @IVFSE2Pattern3,
          IVFSE2Pattern4 = @IVFSE2Pattern4,
          IVFSNODStimulation = @IVFSNODStimulation,
          IVFSIntervalToHCG = @IVFSIntervalToHCG,
          IVFSIntervalFromHCGHrs = @IVFSIntervalFromHCGHrs,
          IVFSIntervalFromHCGMin = @IVFSIntervalFromHCGMin,
          IVFPInsemination = @IVFPInsemination,
          IVFPConcStandard = @IVFPConcStandard,
          IVFPHigh = @IVFPHigh,
          IVFPICSI = @IVFPICSI,
          IVFPSpAssHatch = @IVFPSpAssHatch,
          IVFPSpEBiopsy = @IVFPSpEBiopsy,
          IVFPSpCTrans = @IVFPSpCTrans,
          IVFPRetPerID = @IVFPRetPerID,
          IVFPTransPerID = @IVFPTransPerID,
          LabOptID = @LabOptID,
          IVFSType1 = @IVFSType1,
          IVFSType2 = @IVFSType2,
          IVFSType3 = @IVFSType3,
          IVFSType4 = @IVFSType4,
          IVFOIMetaII = @IVFOIMetaII,
          IVFOIMetaI = @IVFOIMetaI,
          IVFOIGV = @IVFOIGV,
          IVFOIDEG = @IVFOIDEG,
          IVFFMetaII0pb = @IVFFMetaII0pb,
          IVFFMetaII0PN = @IVFFMetaII0PN,
          IVFFMetaII1PN = @IVFFMetaII1PN,
          IVFFMetaII2PN = @IVFFMetaII2PN,
          IVFFMetaII3PN = @IVFFMetaII3PN,
          IVFFMetaIIStuck = @IVFFMetaIIStuck,
          IVFFMetaIICont = @IVFFMetaIICont,
          IVFFMetaIICleaved = @IVFFMetaIICleaved,
          IVFFMetaI0pb = @IVFFMetaI0pb,
          IVFFMetaI0PN = @IVFFMetaI0PN,
          IVFFMetaI1PN = @IVFFMetaI1PN,
          IVFFMetaI2PN = @IVFFMetaI2PN,
          IVFFMetaI3PN = @IVFFMetaI3PN,
          IVFFMetaIStuck = @IVFFMetaIStuck,
          IVFFMetaICont = @IVFFMetaICont,
          IVFFMetaICleaved = @IVFFMetaICleaved,
          IVFFGV0pb = @IVFFGV0pb,
          IVFFGV0PN = @IVFFGV0PN,
          IVFFGV1PN = @IVFFGV1PN,
          IVFFGV2PN = @IVFFGV2PN,
          IVFFGV3PN = @IVFFGV3PN,
          IVFFGVStuck = @IVFFGVStuck,
          IVFFGVCont = @IVFFGVCont,
          IVFFGVCleaved = @IVFFGVCleaved,
          IVFMediaBrand = @IVFMediaBrand,
          IVFMediaSeries = @IVFMediaSeries,
          IVFIncubatorUsed = @IVFIncubatorUsed,
          IVFGas = @IVFGas
        WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID`,
        [
          { name: '@PatID', value: patId },
          { name: '@SatID', value: satId },
          { name: '@CycID', value: cycId },
          { name: '@IVFSGnRN', value: b(payload.gnrhFollicular) },
          { name: '@IVFSLuteal', value: b(payload.gnrhLuteal) },
          { name: '@IVFSStopL', value: b(payload.gnrhStopL) },
          { name: '@IVFSNone', value: b(payload.gnrhNone) },
          { name: '@MCCDFSHDrug1', value: n(payload.fshDrug1) },
          { name: '@MCCDFSHDrug2', value: n(payload.fshDrug2) },
          { name: '@MCCDHMGDrug1', value: n(payload.hmgDrug1) },
          { name: '@MCCDHMGDrgu2', value: n(payload.hmgDrug2) },
          { name: '@IVFSOther', value: b(payload.otherCycle) },
          { name: '@IVFSOtherVal', value: n(payload.otherCycleVal) },
          { name: '@IVFSNaturalCycle', value: b(payload.naturalCycle) },
          { name: '@IVFSE2Pattern1', value: n(payload.e2Pattern1) },
          { name: '@IVFSE2Pattern2', value: n(payload.e2Pattern2) },
          { name: '@IVFSE2Pattern3', value: n(payload.e2Pattern3) },
          { name: '@IVFSE2Pattern4', value: n(payload.e2Pattern4) },
          { name: '@IVFSNODStimulation', value: n(payload.daysStimulation) },
          { name: '@IVFSIntervalToHCG', value: n(payload.intervalToHcg) },
          { name: '@IVFSIntervalFromHCGHrs', value: n(payload.intervalFromHcgHrs) },
          { name: '@IVFSIntervalFromHCGMin', value: n(payload.intervalFromHcgMin) },
          { name: '@IVFPInsemination', value: n(payload.inseminationHours) },
          { name: '@IVFPConcStandard', value: b(payload.concStandard) },
          { name: '@IVFPHigh', value: b(payload.concHigh) },
          { name: '@IVFPICSI', value: b(payload.concIcsi) },
          { name: '@IVFPSpAssHatch', value: b(payload.spAssHatch) },
          { name: '@IVFPSpEBiopsy', value: b(payload.spEmbryoBiopsy) },
          { name: '@IVFPSpCTrans', value: b(payload.spImsi) },
          { name: '@IVFPRetPerID', value: n(payload.retPerId) },
          { name: '@IVFPTransPerID', value: n(payload.transPerId) },
          { name: '@LabOptID', value: n(payload.labOptId) },
          { name: '@IVFSType1', value: n(payload.semenType1) },
          { name: '@IVFSType2', value: n(payload.semenType2) },
          { name: '@IVFSType3', value: n(payload.semenType3) },
          { name: '@IVFSType4', value: n(payload.semenType4) },
          { name: '@IVFOIMetaII', value: n(payload.oiMetaII) },
          { name: '@IVFOIMetaI', value: n(payload.oiMetaI) },
          { name: '@IVFOIGV', value: n(payload.oiGV) },
          { name: '@IVFOIDEG', value: n(payload.oiDeg) },
          { name: '@IVFFMetaII0pb', value: n(payload.fMetaII0pb) },
          { name: '@IVFFMetaII0PN', value: n(payload.fMetaII0PN) },
          { name: '@IVFFMetaII1PN', value: n(payload.fMetaII1PN) },
          { name: '@IVFFMetaII2PN', value: n(payload.fMetaII2PN) },
          { name: '@IVFFMetaII3PN', value: n(payload.fMetaII3PN) },
          { name: '@IVFFMetaIIStuck', value: n(payload.fMetaIIStuck) },
          { name: '@IVFFMetaIICont', value: b(payload.fMetaIICont) },
          { name: '@IVFFMetaIICleaved', value: n(payload.fMetaIICleaved) },
          { name: '@IVFFMetaI0pb', value: n(payload.fMetaI0pb) },
          { name: '@IVFFMetaI0PN', value: n(payload.fMetaI0PN) },
          { name: '@IVFFMetaI1PN', value: n(payload.fMetaI1PN) },
          { name: '@IVFFMetaI2PN', value: n(payload.fMetaI2PN) },
          { name: '@IVFFMetaI3PN', value: n(payload.fMetaI3PN) },
          { name: '@IVFFMetaIStuck', value: n(payload.fMetaIStuck) },
          { name: '@IVFFMetaICont', value: b(payload.fMetaICont) },
          { name: '@IVFFMetaICleaved', value: n(payload.fMetaICleaved) },
          { name: '@IVFFGV0pb', value: n(payload.fGV0pb) },
          { name: '@IVFFGV0PN', value: n(payload.fGV0PN) },
          { name: '@IVFFGV1PN', value: n(payload.fGV1PN) },
          { name: '@IVFFGV2PN', value: n(payload.fGV2PN) },
          { name: '@IVFFGV3PN', value: n(payload.fGV3PN) },
          { name: '@IVFFGVStuck', value: n(payload.fGVStuck) },
          { name: '@IVFFGVCont', value: b(payload.fGVCont) },
          { name: '@IVFFGVCleaved', value: n(payload.fGVCleaved) },
          { name: '@IVFMediaBrand', value: n(payload.mediaBrand) },
          { name: '@IVFMediaSeries', value: n(payload.mediaSeries) },
          { name: '@IVFIncubatorUsed', value: n(payload.incubatorUsed) },
          { name: '@IVFGas', value: n(payload.gas) },
        ]
      );
    } else {
      await executeText(
        `INSERT INTO IVF (
          IVFID, PatID, SatID, CycID, IVFCycleDate, IVFDateOfCreation,
          IVFSGnRN, IVFSLuteal, IVFSStopL, IVFSNone,
          MCCDFSHDrug1, MCCDFSHDrug2, MCCDHMGDrug1, MCCDHMGDrgu2,
          IVFSOther, IVFSOtherVal, IVFSNaturalCycle,
          IVFSE2Pattern1, IVFSE2Pattern2, IVFSE2Pattern3, IVFSE2Pattern4,
          IVFSNODStimulation, IVFSIntervalToHCG, IVFSIntervalFromHCGHrs, IVFSIntervalFromHCGMin,
          IVFPInsemination, IVFPConcStandard, IVFPHigh, IVFPICSI,
          IVFPSpAssHatch, IVFPSpEBiopsy, IVFPSpCTrans,
          IVFPRetPerID, IVFPTransPerID, LabOptID,
          IVFSType1, IVFSType2, IVFSType3, IVFSType4,
          IVFOIMetaII, IVFOIMetaI, IVFOIGV, IVFOIDEG,
          IVFFMetaII0pb, IVFFMetaII0PN, IVFFMetaII1PN, IVFFMetaII2PN, IVFFMetaII3PN, IVFFMetaIIStuck, IVFFMetaIICont, IVFFMetaIICleaved,
          IVFFMetaI0pb, IVFFMetaI0PN, IVFFMetaI1PN, IVFFMetaI2PN, IVFFMetaI3PN, IVFFMetaIStuck, IVFFMetaICont, IVFFMetaICleaved,
          IVFFGV0pb, IVFFGV0PN, IVFFGV1PN, IVFFGV2PN, IVFFGV3PN, IVFFGVStuck, IVFFGVCont, IVFFGVCleaved,
          IVFMediaBrand, IVFMediaSeries, IVFIncubatorUsed, IVFGas
        ) VALUES (
          @IVFID, @PatID, @SatID, @CycID, @IVFCycleDate, GETDATE(),
          @IVFSGnRN, @IVFSLuteal, @IVFSStopL, @IVFSNone,
          @MCCDFSHDrug1, @MCCDFSHDrug2, @MCCDHMGDrug1, @MCCDHMGDrgu2,
          @IVFSOther, @IVFSOtherVal, @IVFSNaturalCycle,
          @IVFSE2Pattern1, @IVFSE2Pattern2, @IVFSE2Pattern3, @IVFSE2Pattern4,
          @IVFSNODStimulation, @IVFSIntervalToHCG, @IVFSIntervalFromHCGHrs, @IVFSIntervalFromHCGMin,
          @IVFPInsemination, @IVFPConcStandard, @IVFPHigh, @IVFPICSI,
          @IVFPSpAssHatch, @IVFPSpEBiopsy, @IVFPSpCTrans,
          @IVFPRetPerID, @IVFPTransPerID, @LabOptID,
          @IVFSType1, @IVFSType2, @IVFSType3, @IVFSType4,
          @IVFOIMetaII, @IVFOIMetaI, @IVFOIGV, @IVFOIDEG,
          @IVFFMetaII0pb, @IVFFMetaII0PN, @IVFFMetaII1PN, @IVFFMetaII2PN, @IVFFMetaII3PN, @IVFFMetaIIStuck, @IVFFMetaIICont, @IVFFMetaIICleaved,
          @IVFFMetaI0pb, @IVFFMetaI0PN, @IVFFMetaI1PN, @IVFFMetaI2PN, @IVFFMetaI3PN, @IVFFMetaIStuck, @IVFFMetaICont, @IVFFMetaICleaved,
          @IVFFGV0pb, @IVFFGV0PN, @IVFFGV1PN, @IVFFGV2PN, @IVFFGV3PN, @IVFFGVStuck, @IVFFGVCont, @IVFFGVCleaved,
          @IVFMediaBrand, @IVFMediaSeries, @IVFIncubatorUsed, @IVFGas
        )`,
        [
          { name: '@IVFID', value: ivfId },
          { name: '@PatID', value: patId },
          { name: '@SatID', value: satId },
          { name: '@CycID', value: cycId },
          { name: '@IVFCycleDate', value: payload.cycleDate || new Date().toISOString().slice(0, 10) },
          { name: '@IVFSGnRN', value: b(payload.gnrhFollicular) },
          { name: '@IVFSLuteal', value: b(payload.gnrhLuteal) },
          { name: '@IVFSStopL', value: b(payload.gnrhStopL) },
          { name: '@IVFSNone', value: b(payload.gnrhNone) },
          { name: '@MCCDFSHDrug1', value: n(payload.fshDrug1) },
          { name: '@MCCDFSHDrug2', value: n(payload.fshDrug2) },
          { name: '@MCCDHMGDrug1', value: n(payload.hmgDrug1) },
          { name: '@MCCDHMGDrgu2', value: n(payload.hmgDrug2) },
          { name: '@IVFSOther', value: b(payload.otherCycle) },
          { name: '@IVFSOtherVal', value: n(payload.otherCycleVal) },
          { name: '@IVFSNaturalCycle', value: b(payload.naturalCycle) },
          { name: '@IVFSE2Pattern1', value: n(payload.e2Pattern1) },
          { name: '@IVFSE2Pattern2', value: n(payload.e2Pattern2) },
          { name: '@IVFSE2Pattern3', value: n(payload.e2Pattern3) },
          { name: '@IVFSE2Pattern4', value: n(payload.e2Pattern4) },
          { name: '@IVFSNODStimulation', value: n(payload.daysStimulation) },
          { name: '@IVFSIntervalToHCG', value: n(payload.intervalToHcg) },
          { name: '@IVFSIntervalFromHCGHrs', value: n(payload.intervalFromHcgHrs) },
          { name: '@IVFSIntervalFromHCGMin', value: n(payload.intervalFromHcgMin) },
          { name: '@IVFPInsemination', value: n(payload.inseminationHours) },
          { name: '@IVFPConcStandard', value: b(payload.concStandard) },
          { name: '@IVFPHigh', value: b(payload.concHigh) },
          { name: '@IVFPICSI', value: b(payload.concIcsi) },
          { name: '@IVFPSpAssHatch', value: b(payload.spAssHatch) },
          { name: '@IVFPSpEBiopsy', value: b(payload.spEmbryoBiopsy) },
          { name: '@IVFPSpCTrans', value: b(payload.spImsi) },
          { name: '@IVFPRetPerID', value: n(payload.retPerId) },
          { name: '@IVFPTransPerID', value: n(payload.transPerId) },
          { name: '@LabOptID', value: n(payload.labOptId) },
          { name: '@IVFSType1', value: n(payload.semenType1) },
          { name: '@IVFSType2', value: n(payload.semenType2) },
          { name: '@IVFSType3', value: n(payload.semenType3) },
          { name: '@IVFSType4', value: n(payload.semenType4) },
          { name: '@IVFOIMetaII', value: n(payload.oiMetaII) },
          { name: '@IVFOIMetaI', value: n(payload.oiMetaI) },
          { name: '@IVFOIGV', value: n(payload.oiGV) },
          { name: '@IVFOIDEG', value: n(payload.oiDeg) },
          { name: '@IVFFMetaII0pb', value: n(payload.fMetaII0pb) },
          { name: '@IVFFMetaII0PN', value: n(payload.fMetaII0PN) },
          { name: '@IVFFMetaII1PN', value: n(payload.fMetaII1PN) },
          { name: '@IVFFMetaII2PN', value: n(payload.fMetaII2PN) },
          { name: '@IVFFMetaII3PN', value: n(payload.fMetaII3PN) },
          { name: '@IVFFMetaIIStuck', value: n(payload.fMetaIIStuck) },
          { name: '@IVFFMetaIICont', value: b(payload.fMetaIICont) },
          { name: '@IVFFMetaIICleaved', value: n(payload.fMetaIICleaved) },
          { name: '@IVFFMetaI0pb', value: n(payload.fMetaI0pb) },
          { name: '@IVFFMetaI0PN', value: n(payload.fMetaI0PN) },
          { name: '@IVFFMetaI1PN', value: n(payload.fMetaI1PN) },
          { name: '@IVFFMetaI2PN', value: n(payload.fMetaI2PN) },
          { name: '@IVFFMetaI3PN', value: n(payload.fMetaI3PN) },
          { name: '@IVFFMetaIStuck', value: n(payload.fMetaIStuck) },
          { name: '@IVFFMetaICont', value: b(payload.fMetaICont) },
          { name: '@IVFFMetaICleaved', value: n(payload.fMetaICleaved) },
          { name: '@IVFFGV0pb', value: n(payload.fGV0pb) },
          { name: '@IVFFGV0PN', value: n(payload.fGV0PN) },
          { name: '@IVFFGV1PN', value: n(payload.fGV1PN) },
          { name: '@IVFFGV2PN', value: n(payload.fGV2PN) },
          { name: '@IVFFGV3PN', value: n(payload.fGV3PN) },
          { name: '@IVFFGVStuck', value: n(payload.fGVStuck) },
          { name: '@IVFFGVCont', value: b(payload.fGVCont) },
          { name: '@IVFFGVCleaved', value: n(payload.fGVCleaved) },
          { name: '@IVFMediaBrand', value: n(payload.mediaBrand) },
          { name: '@IVFMediaSeries', value: n(payload.mediaSeries) },
          { name: '@IVFIncubatorUsed', value: n(payload.incubatorUsed) },
          { name: '@IVFGas', value: n(payload.gas) },
        ]
      );
    }

    return {
      success: true,
      message: isUpdate ? 'IVF record updated successfully.' : 'IVF record saved successfully.',
      data: { ivfId },
    };
  } catch (err) {
    console.error('Error saving IVF record:', err);
    return { success: false, message: 'Failed to save IVF record.' };
  }
}

export async function saveIcsiRecord(payload: Record<string, unknown>) {
  if (!isDbConfigured()) {
    return { success: true, message: 'ICSI record saved (offline/demo mode).', data: {} };
  }

  try {
    const patId = Number(payload.patId || 0);
    const satId = Number(payload.satId || 0);
    const cycId = String(payload.cycId || '').trim();
    let icsiId = String(payload.icsiId || '').trim();

    // Check if record exists
    const existing = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 ICSIID FROM ICSI WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId },
        { name: '@CycID', value: cycId },
      ]
    );

    const isUpdate = existing.recordset && existing.recordset.length > 0;
    if (isUpdate && !icsiId) {
      icsiId = rowVal(existing.recordset[0], 'ICSIID');
    }

    if (!icsiId) {
      const maxRes = await executeText<Record<string, unknown>>(
        `SELECT ISNULL(MAX(CAST(SUBSTRING(ICSIID, 5, 10) AS INT)), 0) + 1 AS NextID FROM ICSI WHERE ICSIID LIKE 'ICSI%'`
      );
      const nextNum = maxRes.recordset?.[0]?.NextID || 1;
      icsiId = `ICSI${nextNum}`;
    }

    const n = (val: unknown) => (val != null && val !== '' ? Number(val) : 0);
    const b = (val: unknown) => (val === true || val === 1 || val === '1' ? 1 : 0);

    if (isUpdate) {
      await executeText(
        `UPDATE ICSI SET
          ICSISGnRN = @ICSISGnRN,
          ICSISLuteal = @ICSISLuteal,
          ICSISStopL = @ICSISStopL,
          ICSISNone = @ICSISNone,
          MCCDFSHDrug1 = @MCCDFSHDrug1,
          MCCDFSHDrug2 = @MCCDFSHDrug2,
          MCCDHMGDrug1 = @MCCDHMGDrug1,
          MCCDHMGDrgu2 = @MCCDHMGDrgu2,
          ICSISOther = @ICSISOther,
          ICSISOtherVal = @ICSISOtherVal,
          ICSISNaturalCycle = @ICSISNaturalCycle,
          ICSISE2Pattern1 = @ICSISE2Pattern1,
          ICSISE2Pattern2 = @ICSISE2Pattern2,
          ICSISE2Pattern3 = @ICSISE2Pattern3,
          ICSISE2Pattern4 = @ICSISE2Pattern4,
          ICSISNODStimulation = @ICSISNODStimulation,
          ICSISIntervalToHCG = @ICSISIntervalToHCG,
          ICSISIntervalFromHCGHrs = @ICSISIntervalFromHCGHrs,
          ICSISIntervalFromHCGMin = @ICSISIntervalFromHCGMin,
          ICSIPRetPerID = @ICSIPRetPerID,
          ICSIPTransPerID = @ICSIPTransPerID,
          LabOptID = @LabOptID,
          ICSISType1 = @ICSISType1,
          ICSISType2 = @ICSISType2,
          ICSISType3 = @ICSISType3,
          ICSISType4 = @ICSISType4,
          ICSIOIMetaII = @ICSIOIMetaII,
          ICSIOIMetaI = @ICSIOIMetaI,
          ICSIOIGV = @ICSIOIGV,
          ICSIOIDEG = @ICSIOIDEG,
          ICSIFMetaII0pb = @ICSIFMetaII0pb,
          ICSIFMetaII0PN = @ICSIFMetaII0PN,
          ICSIFMetaII1PN = @ICSIFMetaII1PN,
          ICSIFMetaII2PN = @ICSIFMetaII2PN,
          ICSIFMetaII3PN = @ICSIFMetaII3PN,
          ICSIFMetaIIStuck = @ICSIFMetaIIStuck,
          ICSIFMetaIICont = @ICSIFMetaIICont,
          ICSIFMetaIICleaved = @ICSIFMetaIICleaved,
          ICSIFMetaI0pb = @ICSIFMetaI0pb,
          ICSIFMetaI0PN = @ICSIFMetaI0PN,
          ICSIFMetaI1PN = @ICSIFMetaI1PN,
          ICSIFMetaI2PN = @ICSIFMetaI2PN,
          ICSIFMetaI3PN = @ICSIFMetaI3PN,
          ICSIFMetaIStuck = @ICSIFMetaIStuck,
          ICSIFMetaICont = @ICSIFMetaICont,
          ICSIFMetaICleaved = @ICSIFMetaICleaved,
          ICSIFGV0pb = @ICSIFGV0pb,
          ICSIFGV0PN = @ICSIFGV0PN,
          ICSIFGV1PN = @ICSIFGV1PN,
          ICSIFGV2PN = @ICSIFGV2PN,
          ICSIFGV3PN = @ICSIFGV3PN,
          ICSIFGVStuck = @ICSIFGVStuck,
          ICSIFGVCont = @ICSIFGVCont,
          ICSIFGVCleaved = @ICSIFGVCleaved,
          MediaBrand = @MediaBrand,
          MediaSeries = @MediaSeries,
          IncubatorUsed = @IncubatorUsed,
          Gas = @Gas
        WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID`,
        [
          { name: '@PatID', value: patId },
          { name: '@SatID', value: satId },
          { name: '@CycID', value: cycId },
          { name: '@ICSISGnRN', value: b(payload.gnrhFollicular) },
          { name: '@ICSISLuteal', value: b(payload.gnrhLuteal) },
          { name: '@ICSISStopL', value: b(payload.gnrhStopL) },
          { name: '@ICSISNone', value: b(payload.gnrhNone) },
          { name: '@MCCDFSHDrug1', value: n(payload.fshDrug1) },
          { name: '@MCCDFSHDrug2', value: n(payload.fshDrug2) },
          { name: '@MCCDHMGDrug1', value: n(payload.hmgDrug1) },
          { name: '@MCCDHMGDrgu2', value: n(payload.hmgDrug2) },
          { name: '@ICSISOther', value: b(payload.otherCycle) },
          { name: '@ICSISOtherVal', value: n(payload.otherCycleVal) },
          { name: '@ICSISNaturalCycle', value: b(payload.naturalCycle) },
          { name: '@ICSISE2Pattern1', value: n(payload.e2Pattern1) },
          { name: '@ICSISE2Pattern2', value: n(payload.e2Pattern2) },
          { name: '@ICSISE2Pattern3', value: n(payload.e2Pattern3) },
          { name: '@ICSISE2Pattern4', value: n(payload.e2Pattern4) },
          { name: '@ICSISNODStimulation', value: n(payload.daysStimulation) },
          { name: '@ICSISIntervalToHCG', value: n(payload.intervalToHcg) },
          { name: '@ICSISIntervalFromHCGHrs', value: n(payload.intervalFromHcgHrs) },
          { name: '@ICSISIntervalFromHCGMin', value: n(payload.intervalFromHcgMin) },
          { name: '@ICSIPRetPerID', value: n(payload.retPerId) },
          { name: '@ICSIPTransPerID', value: n(payload.transPerId) },
          { name: '@LabOptID', value: n(payload.labOptId) },
          { name: '@ICSISType1', value: n(payload.semenType1) },
          { name: '@ICSISType2', value: n(payload.semenType2) },
          { name: '@ICSISType3', value: n(payload.semenType3) },
          { name: '@ICSISType4', value: n(payload.semenType4) },
          { name: '@ICSIOIMetaII', value: n(payload.oiMetaII) },
          { name: '@ICSIOIMetaI', value: n(payload.oiMetaI) },
          { name: '@ICSIOIGV', value: n(payload.oiGV) },
          { name: '@ICSIOIDEG', value: n(payload.oiDeg) },
          { name: '@ICSIFMetaII0pb', value: n(payload.fMetaII0pb) },
          { name: '@ICSIFMetaII0PN', value: n(payload.fMetaII0PN) },
          { name: '@ICSIFMetaII1PN', value: n(payload.fMetaII1PN) },
          { name: '@ICSIFMetaII2PN', value: n(payload.fMetaII2PN) },
          { name: '@ICSIFMetaII3PN', value: n(payload.fMetaII3PN) },
          { name: '@ICSIFMetaIIStuck', value: n(payload.fMetaIIStuck) },
          { name: '@ICSIFMetaIICont', value: b(payload.fMetaIICont) },
          { name: '@ICSIFMetaIICleaved', value: n(payload.fMetaIICleaved) },
          { name: '@ICSIFMetaI0pb', value: n(payload.fMetaI0pb) },
          { name: '@ICSIFMetaI0PN', value: n(payload.fMetaI0PN) },
          { name: '@ICSIFMetaI1PN', value: n(payload.fMetaI1PN) },
          { name: '@ICSIFMetaI2PN', value: n(payload.fMetaI2PN) },
          { name: '@ICSIFMetaI3PN', value: n(payload.fMetaI3PN) },
          { name: '@ICSIFMetaIStuck', value: n(payload.fMetaIStuck) },
          { name: '@ICSIFMetaICont', value: b(payload.fMetaICont) },
          { name: '@ICSIFMetaICleaved', value: n(payload.fMetaICleaved) },
          { name: '@ICSIFGV0pb', value: n(payload.fGV0pb) },
          { name: '@ICSIFGV0PN', value: n(payload.fGV0PN) },
          { name: '@ICSIFGV1PN', value: n(payload.fGV1PN) },
          { name: '@ICSIFGV2PN', value: n(payload.fGV2PN) },
          { name: '@ICSIFGV3PN', value: n(payload.fGV3PN) },
          { name: '@ICSIFGVStuck', value: n(payload.fGVStuck) },
          { name: '@ICSIFGVCont', value: b(payload.fGVCont) },
          { name: '@ICSIFGVCleaved', value: n(payload.fGVCleaved) },
          { name: '@MediaBrand', value: n(payload.mediaBrand) },
          { name: '@MediaSeries', value: n(payload.mediaSeries) },
          { name: '@IncubatorUsed', value: n(payload.incubatorUsed) },
          { name: '@Gas', value: n(payload.gas) },
        ]
      );
    } else {
      await executeText(
        `INSERT INTO ICSI (
          ICSIID, PatID, SatID, CycID, ICSICycleDate, ICSIDateOfCreation,
          ICSISGnRN, ICSISLuteal, ICSISStopL, ICSISNone,
          MCCDFSHDrug1, MCCDFSHDrug2, MCCDHMGDrug1, MCCDHMGDrgu2,
          ICSISOther, ICSISOtherVal, ICSISNaturalCycle,
          ICSISE2Pattern1, ICSISE2Pattern2, ICSISE2Pattern3, ICSISE2Pattern4,
          ICSISNODStimulation, ICSISIntervalToHCG, ICSISIntervalFromHCGHrs, ICSISIntervalFromHCGMin,
          ICSIPRetPerID, ICSIPTransPerID, LabOptID,
          ICSISType1, ICSISType2, ICSISType3, ICSISType4,
          ICSIOIMetaII, ICSIOIMetaI, ICSIOIGV, ICSIOIDEG,
          ICSIFMetaII0pb, ICSIFMetaII0PN, ICSIFMetaII1PN, ICSIFMetaII2PN, ICSIFMetaII3PN, ICSIFMetaIIStuck, ICSIFMetaIICont, ICSIFMetaIICleaved,
          ICSIFMetaI0pb, ICSIFMetaI0PN, ICSIFMetaI1PN, ICSIFMetaI2PN, ICSIFMetaI3PN, ICSIFMetaIStuck, ICSIFMetaICont, ICSIFMetaICleaved,
          ICSIFGV0pb, ICSIFGV0PN, ICSIFGV1PN, ICSIFGV2PN, ICSIFGV3PN, ICSIFGVStuck, ICSIFGVCont, ICSIFGVCleaved,
          MediaBrand, MediaSeries, IncubatorUsed, Gas
        ) VALUES (
          @ICSIID, @PatID, @SatID, @CycID, @ICSICycleDate, GETDATE(),
          @ICSISGnRN, @ICSISLuteal, @ICSISStopL, @ICSISNone,
          @MCCDFSHDrug1, @MCCDFSHDrug2, @MCCDHMGDrug1, @MCCDHMGDrgu2,
          @ICSISOther, @ICSISOtherVal, @ICSISNaturalCycle,
          @ICSISE2Pattern1, @ICSISE2Pattern2, @ICSISE2Pattern3, @ICSISE2Pattern4,
          @ICSISNODStimulation, @ICSISIntervalToHCG, @ICSISIntervalFromHCGHrs, @ICSISIntervalFromHCGMin,
          @ICSIPRetPerID, @ICSIPTransPerID, @LabOptID,
          @ICSISType1, @ICSISType2, @ICSISType3, @ICSISType4,
          @ICSIOIMetaII, @ICSIOIMetaI, @ICSIOIGV, @ICSIOIDEG,
          @ICSIFMetaII0pb, @ICSIFMetaII0PN, @ICSIFMetaII1PN, @ICSIFMetaII2PN, @ICSIFMetaII3PN, @ICSIFMetaIIStuck, @ICSIFMetaIICont, @ICSIFMetaIICleaved,
          @ICSIFMetaI0pb, @ICSIFMetaI0PN, @ICSIFMetaI1PN, @ICSIFMetaI2PN, @ICSIFMetaI3PN, @ICSIFMetaIStuck, @ICSIFMetaICont, @ICSIFMetaICleaved,
          @ICSIFGV0pb, @ICSIFGV0PN, @ICSIFGV1PN, @ICSIFGV2PN, @ICSIFGV3PN, @ICSIFGVStuck, @ICSIFGVCont, @ICSIFGVCleaved,
          @MediaBrand, @MediaSeries, @IncubatorUsed, @Gas
        )`,
        [
          { name: '@ICSIID', value: icsiId },
          { name: '@PatID', value: patId },
          { name: '@SatID', value: satId },
          { name: '@CycID', value: cycId },
          { name: '@ICSICycleDate', value: payload.cycleDate || new Date().toISOString().slice(0, 10) },
          { name: '@ICSISGnRN', value: b(payload.gnrhFollicular) },
          { name: '@ICSISLuteal', value: b(payload.gnrhLuteal) },
          { name: '@ICSISStopL', value: b(payload.gnrhStopL) },
          { name: '@ICSISNone', value: b(payload.gnrhNone) },
          { name: '@MCCDFSHDrug1', value: n(payload.fshDrug1) },
          { name: '@MCCDFSHDrug2', value: n(payload.fshDrug2) },
          { name: '@MCCDHMGDrug1', value: n(payload.hmgDrug1) },
          { name: '@MCCDHMGDrgu2', value: n(payload.hmgDrug2) },
          { name: '@ICSISOther', value: b(payload.otherCycle) },
          { name: '@ICSISOtherVal', value: n(payload.otherCycleVal) },
          { name: '@ICSISNaturalCycle', value: b(payload.naturalCycle) },
          { name: '@ICSISE2Pattern1', value: n(payload.e2Pattern1) },
          { name: '@ICSISE2Pattern2', value: n(payload.e2Pattern2) },
          { name: '@ICSISE2Pattern3', value: n(payload.e2Pattern3) },
          { name: '@ICSISE2Pattern4', value: n(payload.e2Pattern4) },
          { name: '@ICSISNODStimulation', value: n(payload.daysStimulation) },
          { name: '@ICSISIntervalToHCG', value: n(payload.intervalToHcg) },
          { name: '@ICSISIntervalFromHCGHrs', value: n(payload.intervalFromHcgHrs) },
          { name: '@ICSISIntervalFromHCGMin', value: n(payload.intervalFromHcgMin) },
          { name: '@ICSIPRetPerID', value: n(payload.retPerId) },
          { name: '@ICSIPTransPerID', value: n(payload.transPerId) },
          { name: '@LabOptID', value: n(payload.labOptId) },
          { name: '@ICSISType1', value: n(payload.semenType1) },
          { name: '@ICSISType2', value: n(payload.semenType2) },
          { name: '@ICSISType3', value: n(payload.semenType3) },
          { name: '@ICSISType4', value: n(payload.semenType4) },
          { name: '@ICSIOIMetaII', value: n(payload.oiMetaII) },
          { name: '@ICSIOIMetaI', value: n(payload.oiMetaI) },
          { name: '@ICSIOIGV', value: n(payload.oiGV) },
          { name: '@ICSIOIDEG', value: n(payload.oiDeg) },
          { name: '@ICSIFMetaII0pb', value: n(payload.fMetaII0pb) },
          { name: '@ICSIFMetaII0PN', value: n(payload.fMetaII0PN) },
          { name: '@ICSIFMetaII1PN', value: n(payload.fMetaII1PN) },
          { name: '@ICSIFMetaII2PN', value: n(payload.fMetaII2PN) },
          { name: '@ICSIFMetaII3PN', value: n(payload.fMetaII3PN) },
          { name: '@ICSIFMetaIIStuck', value: n(payload.fMetaIIStuck) },
          { name: '@ICSIFMetaIICont', value: b(payload.fMetaIICont) },
          { name: '@ICSIFMetaIICleaved', value: n(payload.fMetaIICleaved) },
          { name: '@ICSIFMetaI0pb', value: n(payload.fMetaI0pb) },
          { name: '@ICSIFMetaI0PN', value: n(payload.fMetaI0PN) },
          { name: '@ICSIFMetaI1PN', value: n(payload.fMetaI1PN) },
          { name: '@ICSIFMetaI2PN', value: n(payload.fMetaI2PN) },
          { name: '@ICSIFMetaI3PN', value: n(payload.fMetaI3PN) },
          { name: '@ICSIFMetaIStuck', value: n(payload.fMetaIStuck) },
          { name: '@ICSIFMetaICont', value: b(payload.fMetaICont) },
          { name: '@ICSIFMetaICleaved', value: n(payload.fMetaICleaved) },
          { name: '@ICSIFGV0pb', value: n(payload.fGV0pb) },
          { name: '@ICSIFGV0PN', value: n(payload.fGV0PN) },
          { name: '@ICSIFGV1PN', value: n(payload.fGV1PN) },
          { name: '@ICSIFGV2PN', value: n(payload.fGV2PN) },
          { name: '@ICSIFGV3PN', value: n(payload.fGV3PN) },
          { name: '@ICSIFGVStuck', value: n(payload.fGVStuck) },
          { name: '@ICSIFGVCont', value: b(payload.fGVCont) },
          { name: '@ICSIFGVCleaved', value: n(payload.fGVCleaved) },
          { name: '@MediaBrand', value: n(payload.mediaBrand) },
          { name: '@MediaSeries', value: n(payload.mediaSeries) },
          { name: '@IncubatorUsed', value: n(payload.incubatorUsed) },
          { name: '@Gas', value: n(payload.gas) },
        ]
      );
    }

    return {
      success: true,
      message: isUpdate ? 'ICSI record updated successfully.' : 'ICSI record saved successfully.',
      data: { icsiId },
    };
  } catch (err) {
    console.error('Error saving ICSI record:', err);
    return { success: false, message: 'Failed to save ICSI record.' };
  }
}
