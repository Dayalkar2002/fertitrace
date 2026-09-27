import { buildParams, executeText } from '@/lib/db/spExecutor';
import { listCommonMaster } from '@/lib/services-server/master.service';
import type {
  CycleMonitoring,
  MonitoringDay0,
  MonitoringRemDay,
  TabMasters,
} from '@/lib/types/cycle-detail';
import type { MonitoringChartValues } from '@/lib/monitoring-sheet';

const defaultDay0 = (): MonitoringDay0 => ({
  date: '',
  fshDrug1: 0,
  fshDrug1Dose: 0,
  fshDrug2: 0,
  fshDrug2Dose: 0,
  hmgDrug1: 0,
  hmgDrug1Dose: 0,
  hmgDrug2: 0,
  hmgDrug2Dose: 0,
  cloDrug1: 0,
  cloDrug1Dose: 0,
  antaDrug1: 0,
  antaDrug1Dose: 0,
  othDrug1: 0,
  othDrug1Dose: 0,
  gnrha: 0,
  e2: 0,
  lh: 0,
  fsh: 0,
  tsh: 0,
  prol: 0,
  prog: 0,
  remarks: '',
  ultrasound: '',
  endometrium: '',
});

export async function getMonitoringChartForCycle(
  cycleId: string,
  patId = 0,
  satId = 0
): Promise<{ data: CycleMonitoring; chartValues: MonitoringChartValues; masters: TabMasters }> {
  const cleanId = (cycleId || '').trim();

  // 1. Day 0
  let day0: MonitoringDay0 = defaultDay0();
  if (cleanId) {
    const d0Params = buildParams('@CycID,@PatID,@SatID', [cleanId, patId || 0, satId || 0]);
    const d0Res = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM CycMonitoringChartCycleDay
       WHERE LTRIM(RTRIM(CycID)) = @CycID AND (@PatID = 0 OR PatID = @PatID) AND (@SatID = 0 OR SatID = @SatID)`,
      d0Params
    ).catch(() => ({ recordset: [] }));

    const r = d0Res.recordset?.[0];
    if (r) {
      day0 = {
        date: r.CycMCCDDate ? new Date(String(r.CycMCCDDate)).toISOString().split('T')[0] : '',
        fshDrug1: Number(r.CycMCCDFSHDrug1 || 0),
        fshDrug1Dose: Number(r.CycMCCDFSHDrug1Dose || 0),
        fshDrug2: Number(r.CycMCCDFSHDrug2 || 0),
        fshDrug2Dose: Number(r.CycMCCDFSHDrug2Dose || 0),
        hmgDrug1: Number(r.CycMCCDHMGDrug1 || 0),
        hmgDrug1Dose: Number(r.CycMCCDHMGDrug1Dose || 0),
        hmgDrug2: Number(r.CycMCCDHMGDrug2 || 0),
        hmgDrug2Dose: Number(r.CycMCCDHMGDrug2Dose || 0),
        cloDrug1: Number(r.CycMCCDCloDrug1 || 0),
        cloDrug1Dose: Number(r.CycMCCDCloDrug1Dose || 0),
        antaDrug1: Number(r.CycMCCDAntaDrug1 || 0),
        antaDrug1Dose: Number(r.CycMCCDAntaDrug1Dose || 0),
        othDrug1: Number(r.CycMCCDOthDrug1 || 0),
        othDrug1Dose: Number(r.CycMCCDOthDrug1Dose || 0),
        gnrha: Number(r.CycMCCDFGnRHa || 0),
        e2: Number(r.CycMCCDFE2 || 0),
        lh: Number(r.CycMCCDFLH || 0),
        fsh: Number(r.CycMCCDFFSH || 0),
        tsh: Number(r.CycMCCDFTSH || 0),
        prol: Number(r.CycMCCDFProl || 0),
        prog: Number(r.CycMCCDFProg || 0),
        remarks: String(r.CycMCCDFRemarks || ''),
        ultrasound: String(r.CycMCCDFUltraSound || ''),
        endometrium: String(r.CycMCCDFEndometrium || ''),
      };
    }
  }

  // 2. Remaining Days
  const remDays: MonitoringRemDay[] = [];
  if (cleanId) {
    const remParams = buildParams('@CycID,@PatID,@SatID', [cleanId, patId || 0, satId || 0]);
    const remRes = await executeText<Record<string, unknown>>(
      `SELECT * FROM CycMonitoringChartRemDay
       WHERE LTRIM(RTRIM(CycID)) = @CycID AND (@PatID = 0 OR PatID = @PatID) AND (@SatID = 0 OR SatID = @SatID)
       ORDER BY CycMCRDDay ASC`,
      remParams
    ).catch(() => ({ recordset: [] }));

    for (const r of remRes.recordset || []) {
      remDays.push({
        day: Number(r.CycMCRDDay || 0),
        date: r.CycMCRDDate ? new Date(String(r.CycMCRDDate)).toISOString().split('T')[0] : '',
        fshDrug1: Number(r.CycMCRDFSHDrug1 || 0),
        fshDrug2: Number(r.CycMCRDFSHDrug2 || 0),
        hmgDrug1: Number(r.CycMCRDHMGDrug1 || 0),
        hmgDrug2: Number(r.CycMCRDHMGDrug2 || 0),
        cloDrug1: Number(r.CycMCRDCloDrug1 || 0),
        antaDrug1: Number(r.CycMCRDAntaDrug1 || 0),
        othDrug1: Number(r.CycMCRDOthDrug1 || 0),
        e2: Number(r.CycMCRDFE2 || 0),
        lh: Number(r.CycMCRDFLH || 0),
        fsh: Number(r.CycMCRDFFSH || 0),
        gnrha: Number(r.CycMCRDFGnRHa || 0),
        follicleLeft: Number(r.CycMCRDFTLeft || 0),
        follicleRight: Number(r.CycMCRDFTRight || 0),
        endometrium: String(r.CycMCRDFEndometrium || ''),
        remarks: String(r.CycMCRDFRemarks || ''),
        hcg: Boolean(r.CycMCRDHCG),
        hcgDose: Number(r.CycMCRDHCGDose || 0),
        ultrasound: String(r.CycMCRDUltraSound || ''),
      });
    }
  }

  // 3. Chart values formatted for CycleMonitoringChart grid
  const chartValues: MonitoringChartValues = {};
  const setCell = (rowKey: string, colKey: string, val: unknown) => {
    if (val === null || val === undefined || val === '' || val === 0) return;
    if (!chartValues[rowKey]) chartValues[rowKey] = {};
    chartValues[rowKey][colKey] = String(val);
  };

  if (day0.date) setCell('date', 'd0', day0.date);
  if (day0.fshDrug1Dose) setCell('drugDose', 'd0', String(day0.fshDrug1Dose));
  if (day0.e2) setCell('e2', 'd0', String(day0.e2));
  if (day0.lh) setCell('lh', 'd0', String(day0.lh));
  if (day0.fsh) setCell('fsh', 'd0', String(day0.fsh));
  if (day0.endometrium) setCell('endo', 'd0', day0.endometrium);

  for (const r of remDays) {
    const colKey = `d${r.day}`;
    if (r.date) setCell('date', colKey, r.date);
    if (r.fshDrug1) setCell('drugDose', colKey, String(r.fshDrug1));
    else if (r.hmgDrug1) setCell('drugDose', colKey, String(r.hmgDrug1));
    if (r.gnrha) setCell('gnrh', colKey, String(r.gnrha));
    if (r.antaDrug1) setCell('antagonist', colKey, String(r.antaDrug1));
    if (r.e2) setCell('e2', colKey, String(r.e2));
    if (r.lh) setCell('lh', colKey, String(r.lh));
    if (r.fsh) setCell('fsh', colKey, String(r.fsh));
    if (r.endometrium) setCell('endo', colKey, r.endometrium);
    if (r.follicleLeft) setCell('folLt', colKey, String(r.follicleLeft));
    if (r.follicleRight) setCell('folRt', colKey, String(r.follicleRight));
    if (r.hcg) setCell('rhcg', colKey, r.hcgDose ? String(r.hcgDose) : 'Yes');
  }

  // 4. Masters for dropdowns
  const [fshDrugs, hmgDrugs, cloDrugs, antaDrugs, otherDrugs, allergies, catheters] =
    await Promise.all([
      listCommonMaster(14).catch(() => []),
      listCommonMaster(15).catch(() => []),
      listCommonMaster(17).catch(() => []),
      listCommonMaster(18).catch(() => []),
      listCommonMaster(19).catch(() => []),
      listCommonMaster(12).catch(() => []),
      listCommonMaster(9).catch(() => []),
    ]);

  const masters: TabMasters = {
    allergies,
    stimProtocols: [],
    fshDrugs,
    hmgDrugs,
    cloDrugs,
    antaDrugs,
    otherDrugs,
    catheters,
  };

  return {
    data: {
      day0,
      remDays: remDays.length ? remDays : [{ day: 1, date: '', fshDrug1: 0, fshDrug2: 0, hmgDrug1: 0, hmgDrug2: 0, cloDrug1: 0, antaDrug1: 0, othDrug1: 0, e2: 0, lh: 0, fsh: 0, gnrha: 0, follicleLeft: 0, follicleRight: 0, endometrium: '', remarks: '', hcg: false, hcgDose: 0, ultrasound: '' }],
    },
    chartValues,
    masters,
  };
}

export async function saveMonitoringChartForCycle(
  cycleId: string,
  patId: number,
  satId: number,
  payload: CycleMonitoring
): Promise<void> {
  const cleanId = (cycleId || '').trim();
  if (!cleanId) return;

  const now = new Date().toISOString().split('T')[0];

  // Save Day 0
  if (payload.day0) {
    const d0 = payload.day0;
    const d0Params = buildParams('@CycID,@PatID,@SatID', [cleanId, patId || 0, satId || 0]);
    await executeText(
      'DELETE FROM CycMonitoringChartCycleDay WHERE LTRIM(RTRIM(CycID)) = @CycID AND PatID = @PatID AND SatID = @SatID',
      d0Params
    ).catch(() => {});

    const insD0Params = buildParams(
      '@CycID,@PatID,@SatID,@CycMCCDDate,@CycMCCDDateOfCreation,@CycMCCDFSHDrug1,@CycMCCDFSHDrug1Dose,@CycMCCDFSHDrug2,@CycMCCDFSHDrug2Dose,@CycMCCDHMGDrug1,@CycMCCDHMGDrug1Dose,@CycMCCDHMGDrug2,@CycMCCDHMGDrug2Dose,@CycMCCDCloDrug1,@CycMCCDCloDrug1Dose,@CycMCCDAntaDrug1,@CycMCCDAntaDrug1Dose,@CycMCCDOthDrug1,@CycMCCDOthDrug1Dose,@CycMCCDFGnRHa,@CycMCCDFE2,@CycMCCDFLH,@CycMCCDFFSH,@CycMCCDFTSH,@CycMCCDFProl,@CycMCCDFProg,@CycMCCDFRemarks,@CycMCCDFUltraSound,@CycMCCDFEndometrium',
      [
        cleanId,
        patId || 0,
        satId || 0,
        d0.date || now,
        now,
        d0.fshDrug1 || 0,
        d0.fshDrug1Dose || 0,
        d0.fshDrug2 || 0,
        d0.fshDrug2Dose || 0,
        d0.hmgDrug1 || 0,
        d0.hmgDrug1Dose || 0,
        d0.hmgDrug2 || 0,
        d0.hmgDrug2Dose || 0,
        d0.cloDrug1 || 0,
        d0.cloDrug1Dose || 0,
        d0.antaDrug1 || 0,
        d0.antaDrug1Dose || 0,
        d0.othDrug1 || 0,
        d0.othDrug1Dose || 0,
        d0.gnrha || 0,
        d0.e2 || 0,
        d0.lh || 0,
        d0.fsh || 0,
        d0.tsh || 0,
        d0.prol || 0,
        d0.prog || 0,
        d0.remarks || '',
        d0.ultrasound || '',
        d0.endometrium || '',
      ]
    );

    await executeText(
      `INSERT INTO CycMonitoringChartCycleDay(
        CycID, PatID, SatID, CycMCCDDate, CycMCCDDateOfCreation, CycMCCDFSHDrug1, CycMCCDFSHDrug1Dose,
        CycMCCDFSHDrug2, CycMCCDFSHDrug2Dose, CycMCCDHMGDrug1, CycMCCDHMGDrug1Dose, CycMCCDHMGDrug2, CycMCCDHMGDrug2Dose,
        CycMCCDCloDrug1, CycMCCDCloDrug1Dose, CycMCCDAntaDrug1, CycMCCDAntaDrug1Dose, CycMCCDOthDrug1, CycMCCDOthDrug1Dose,
        CycMCCDFGnRHa, CycMCCDFE2, CycMCCDFLH, CycMCCDFFSH, CycMCCDFTSH, CycMCCDFProl, CycMCCDFProg, CycMCCDFRemarks,
        CycMCCDFUltraSound, CycMCCDFEndometrium
      ) VALUES (
        @CycID, @PatID, @SatID, @CycMCCDDate, @CycMCCDDateOfCreation, @CycMCCDFSHDrug1, @CycMCCDFSHDrug1Dose,
        @CycMCCDFSHDrug2, @CycMCCDFSHDrug2Dose, @CycMCCDHMGDrug1, @CycMCCDHMGDrug1Dose, @CycMCCDHMGDrug2, @CycMCCDHMGDrug2Dose,
        @CycMCCDCloDrug1, @CycMCCDCloDrug1Dose, @CycMCCDAntaDrug1, @CycMCCDAntaDrug1Dose, @CycMCCDOthDrug1, @CycMCCDOthDrug1Dose,
        @CycMCCDFGnRHa, @CycMCCDFE2, @CycMCCDFLH, @CycMCCDFFSH, @CycMCCDFTSH, @CycMCCDFProl, @CycMCCDFProg, @CycMCCDFRemarks,
        @CycMCCDFUltraSound, @CycMCCDFEndometrium
      )`,
      insD0Params
    );
  }

  // Save Remaining Days
  if (payload.remDays && payload.remDays.length > 0) {
    const remDelParams = buildParams('@CycID,@PatID,@SatID', [cleanId, patId || 0, satId || 0]);
    await executeText(
      'DELETE FROM CycMonitoringChartRemDay WHERE LTRIM(RTRIM(CycID)) = @CycID AND PatID = @PatID AND SatID = @SatID',
      remDelParams
    ).catch(() => {});

    for (const r of payload.remDays) {
      const insRemParams = buildParams(
        '@CycID,@PatID,@SatID,@CycMCRDDate,@CycMCRDDay,@CycMCRDFSHDrug1,@CycMCRDFSHDrug2,@CycMCRDHMGDrug1,@CycMCRDHMGDrug2,@CycMCRDCloDrug1,@CycMCRDAntaDrug1,@CycMCRDOthDrug1,@CycMCRDHCG,@CycMCRDHCGDose,@CycMCRDFGnRHa,@CycMCRDFE2,@CycMCRDFLH,@CycMCRDFFSH,@CycMCRDFRemarks,@CycMCRDFEndometrium,@CycMCRDFTLeft,@CycMCRDFTRight,@CycMCRDUltraSound',
        [
          cleanId,
          patId || 0,
          satId || 0,
          r.date || now,
          r.day || 1,
          r.fshDrug1 || 0,
          r.fshDrug2 || 0,
          r.hmgDrug1 || 0,
          r.hmgDrug2 || 0,
          r.cloDrug1 || 0,
          r.antaDrug1 || 0,
          r.othDrug1 || 0,
          r.hcg ? 1 : 0,
          r.hcgDose || 0,
          r.gnrha || 0,
          r.e2 || 0,
          r.lh || 0,
          r.fsh || 0,
          r.remarks || '',
          r.endometrium || '',
          r.follicleLeft || 0,
          r.follicleRight || 0,
          r.ultrasound || '',
        ]
      );

      await executeText(
        `INSERT INTO CycMonitoringChartRemDay(
          CycID, PatID, SatID, CycMCRDDate, CycMCRDDay, CycMCRDFSHDrug1, CycMCRDFSHDrug2,
          CycMCRDHMGDrug1, CycMCRDHMGDrug2, CycMCRDCloDrug1, CycMCRDAntaDrug1, CycMCRDOthDrug1,
          CycMCRDHCG, CycMCRDHCGDose, CycMCRDFGnRHa, CycMCRDFE2, CycMCRDFLH, CycMCRDFFSH,
          CycMCRDFRemarks, CycMCRDFEndometrium, CycMCRDFTLeft, CycMCRDFTRight, CycMCRDUltraSound
        ) VALUES (
          @CycID, @PatID, @SatID, @CycMCRDDate, @CycMCRDDay, @CycMCRDFSHDrug1, @CycMCRDFSHDrug2,
          @CycMCRDHMGDrug1, @CycMCRDHMGDrug2, @CycMCRDCloDrug1, @CycMCRDAntaDrug1, @CycMCRDOthDrug1,
          @CycMCRDHCG, @CycMCRDHCGDose, @CycMCRDFGnRHa, @CycMCRDFE2, @CycMCRDFLH, @CycMCRDFFSH,
          @CycMCRDFRemarks, @CycMCRDFEndometrium, @CycMCRDFTLeft, @CycMCRDFTRight, @CycMCRDUltraSound
        )`,
        insRemParams
      );
    }
  }
}
