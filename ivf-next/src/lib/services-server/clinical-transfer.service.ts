import { isDbConfigured } from '@/lib/db/pool';
import { executeText, buildParams, executeDRL } from '@/lib/db/spExecutor';
import { rowVal, rowNum } from '@/lib/db/row';

export async function loadClinicalTransferRecord(
  module: 'et' | 'bt',
  patId: number,
  satId: number,
  cycId: string,
  _cycleDate?: string
) {
  if (!isDbConfigured()) {
    return { exists: false, data: null };
  }

  const idCol = module === 'et' ? 'ETID' : 'BTID';
  const tnTable = module === 'et' ? 'ETTransferNote' : 'BTTransferNote';
  const gridTable = module === 'et' ? 'ETEmbryoDetailsGrid' : 'BTBlastocystDetailsGrid';
  const sumTable = module === 'et' ? 'ETEmbryoDetailsSummary' : 'BTBlastocystDetailsSummary';
  const prefix = module === 'et' ? 'ETED' : 'BTBD';

  try {
    const params = [
      { name: '@PatID', value: patId },
      { name: '@SatID', value: satId },
      { name: '@CycID', value: cycId.trim() },
    ];

    // 1. Transfer note
    const tnRes = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM ${tnTable} WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID ORDER BY ${idCol} DESC`,
      params
    );

    const tnRow = tnRes.recordset?.[0];
    if (!tnRow) {
      return { exists: false, data: null };
    }

    const recordId = rowVal(tnRow, idCol);

    // 2. Grid rows
    const gridRes = await executeText<Record<string, unknown>>(
      `SELECT * FROM ${gridTable} WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID ORDER BY ${prefix}ID ASC`,
      params
    );

    // 3. Summary
    const sumRes = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 * FROM ${sumTable} WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = @CycID ORDER BY ${idCol} DESC`,
      params
    );
    const sumRow = sumRes.recordset?.[0] || {};

    const rowsKey = module === 'et' ? 'embryoRows' : 'blastocystRows';

    return {
      exists: true,
      data: {
        [idCol]: recordId,
        transferNote: tnRow,
        [rowsKey]: gridRes.recordset || [],
        summary: sumRow,
      },
    };
  } catch (err) {
    console.error(`Error loading ${module} record:`, err);
    return { exists: false, data: null };
  }
}

export async function saveClinicalTransferRecord(
  module: 'et' | 'bt',
  payload: Record<string, unknown>
) {
  if (!isDbConfigured()) {
    return {
      success: true,
      message: `${module.toUpperCase()} record saved (offline/demo mode).`,
      data: { [module === 'et' ? 'etId' : 'btId']: 'DEMO-1' },
    };
  }

  const patId = Number(payload.patId || 0);
  const satId = Number(payload.satId || 0);
  const cycId = String(payload.cycId || '').trim();
  const idCol = module === 'et' ? 'ETID' : 'BTID';
  const prefix = module === 'et' ? 'ETED' : 'BTBD';
  const gridTable = module === 'et' ? 'ETEmbryoDetailsGrid' : 'BTBlastocystDetailsGrid';
  const tn = (payload.transferNote as Record<string, unknown>) || {};
  const summary = (payload.summary as Record<string, unknown>) || {};
  const rowsKey = module === 'et' ? 'embryoRows' : 'blastocystRows';
  const rows = (payload[rowsKey] as Record<string, unknown>[]) || [];

  // Generate or reuse ID
  let recordId = String(payload[module === 'et' ? 'etId' : 'btId'] || '');
  if (!recordId) {
    recordId = `${module.toUpperCase()}${patId}${Date.now().toString().slice(-4)}`;
  }

  try {
    // Save grid rows
    for (const r of rows) {
      const source = String(r.source || 'IVF').toUpperCase();
      const celler = Number(r.celler || 0);
      const grade = Number(r.grade || 0);
      const teGrade = Number(r.teGrade || 0);
      const action = Number(r.action || 0);
      const remark = String(r.remark || '');
      const location = String(r.location || '');
      const recipient = String(r.recipient || '');
      const recipientCycle = String(r.recipientCycle || '');
      const rowId = Number(r[`${prefix}ID`] || r.btBdId || r.etEdId || 0);

      if (module === 'bt') {
        if (rowId > 0) {
          await executeText(
            `UPDATE BTBlastocystDetailsGrid SET
               BTBDSource = @Source, BTBDCeller = @Celler, BTBDGrade = @Grade, BTTEGrade = @TEGrade,
               BTBDAction = @Action, BTBDLocation = @Location, BTBDRecipientBT = @Recipient,
               BTBDRecipientCycleBT = @RecipientCycle, BTBDRemark = @Remark
             WHERE BTBDID = @RowID AND PatID = @PatID AND SatID = @SatID`,
            [
              { name: '@Source', value: source },
              { name: '@Celler', value: celler },
              { name: '@Grade', value: grade },
              { name: '@TEGrade', value: teGrade },
              { name: '@Action', value: action },
              { name: '@Location', value: location },
              { name: '@Recipient', value: recipient },
              { name: '@RecipientCycle', value: recipientCycle },
              { name: '@Remark', value: remark },
              { name: '@RowID', value: rowId },
              { name: '@PatID', value: patId },
              { name: '@SatID', value: satId },
            ]
          );
        } else {
          await executeText(
            `INSERT INTO BTBlastocystDetailsGrid
               (BTID, BTBDSource, BTBDCeller, BTBDGrade, BTTEGrade, BTBDAction, BTBDLocation, BTBDRecipientBT, BTBDRecipientCycleBT, BTBDRemark, CycID, PatID, SatID)
             VALUES
               (@BTID, @Source, @Celler, @Grade, @TEGrade, @Action, @Location, @Recipient, @RecipientCycle, @Remark, @CycID, @PatID, @SatID)`,
            [
              { name: '@BTID', value: recordId },
              { name: '@Source', value: source },
              { name: '@Celler', value: celler },
              { name: '@Grade', value: grade },
              { name: '@TEGrade', value: teGrade },
              { name: '@Action', value: action },
              { name: '@Location', value: location },
              { name: '@Recipient', value: recipient },
              { name: '@RecipientCycle', value: recipientCycle },
              { name: '@Remark', value: remark },
              { name: '@CycID', value: cycId },
              { name: '@PatID', value: patId },
              { name: '@SatID', value: satId },
            ]
          );
        }
      } else {
        // ET grid
        if (rowId > 0) {
          await executeText(
            `UPDATE ETEmbryoDetailsGrid SET
               ETEDSource = @Source, ETEDCeller = @Celler, ETEDGrade = @Grade,
               ETEDAction = @Action, ETEDLocation = @Location, ETEDRemark = @Remark
             WHERE ETEDID = @RowID AND PatID = @PatID AND SatID = @SatID`,
            [
              { name: '@Source', value: source },
              { name: '@Celler', value: celler },
              { name: '@Grade', value: grade },
              { name: '@Action', value: action },
              { name: '@Location', value: location },
              { name: '@Remark', value: remark },
              { name: '@RowID', value: rowId },
              { name: '@PatID', value: patId },
              { name: '@SatID', value: satId },
            ]
          );
        } else {
          await executeText(
            `INSERT INTO ETEmbryoDetailsGrid
               (ETID, ETEDSource, ETEDCeller, ETEDGrade, ETEDAction, ETEDLocation, ETEDRemark, CycID, PatID, SatID)
             VALUES
               (@ETID, @Source, @Celler, @Grade, @Action, @Location, @Remark, @CycID, @PatID, @SatID)`,
            [
              { name: '@ETID', value: recordId },
              { name: '@Source', value: source },
              { name: '@Celler', value: celler },
              { name: '@Grade', value: grade },
              { name: '@Action', value: action },
              { name: '@Location', value: location },
              { name: '@Remark', value: remark },
              { name: '@CycID', value: cycId },
              { name: '@PatID', value: patId },
              { name: '@SatID', value: satId },
            ]
          );
        }
      }
    }

    return {
      success: true,
      message: `${module.toUpperCase()} record saved successfully.`,
      data: { [module === 'et' ? 'etId' : 'btId']: recordId },
    };
  } catch (err) {
    console.error(`Error saving ${module} record:`, err);
    return {
      success: false,
      message: err instanceof Error ? err.message : `Failed to save ${module.toUpperCase()}`,
      data: {},
    };
  }
}
