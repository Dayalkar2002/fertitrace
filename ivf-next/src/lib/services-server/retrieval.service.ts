import { executeDRL, executeDML, buildParams, executeText } from '@/lib/db/spExecutor';
import type { FreezeOocyteRow, RetrievalData, RetrievalRow } from '@/lib/types/cycle';

export async function getRetrievalForCycle(
  cycleId: string,
  patId = 0,
  satId = 0
): Promise<RetrievalData> {
  const cleanId = (cycleId || '').trim();
  if (!cleanId) {
    return {
      selfToSelf: [],
      donorToRecipient: [],
      donorToSelf: [],
      donorEggCount: [],
      freezeOocytes: undefined,
    };
  }

  const query = `
    SELECT r.*,
           pDonor.PatName as DonorPatName,
           pRcpt.PatName as RcptPatName
    FROM CycRetrieval r
    LEFT JOIN PatientMaster pDonor ON pDonor.PatID = r.CycRDonPatID
    LEFT JOIN PatientMaster pRcpt ON pRcpt.PatID = r.CycRURcptPatID
    WHERE (LTRIM(RTRIM(r.CycID)) = @CycID AND (@PatID = 0 OR r.PatID = @PatID) AND (@SatID = 0 OR r.SatID = @SatID))
       OR (LTRIM(RTRIM(r.RecptCycId)) = @CycID AND (@PatID = 0 OR r.CycRURcptPatID = @PatID) AND (@SatID = 0 OR r.SatID = @SatID))
    ORDER BY r.CycRID ASC
  `;

  const params = buildParams('@CycID,@PatID,@SatID', [cleanId, patId || 0, satId || 0]);
  const res = await executeText<Record<string, unknown>>(query, params);
  const rows = res.recordset || [];

  const result: RetrievalData = {
    selfToSelf: [],
    donorToRecipient: [],
    donorToSelf: [],
    donorEggCount: [],
    freezeOocytes: undefined,
  };

  for (const r of rows) {
    const rowCycId = String(r.CycID || '').trim().toUpperCase();
    const rowRecptCycId = String(r.RecptCycId || '').trim().toUpperCase();
    const isThisCycleOwner = rowCycId === cleanId.toUpperCase();
    const isThisCycleRecipient = rowRecptCycId === cleanId.toUpperCase();

    const leftOvary = r.CycRFDLOvary != null ? Number(r.CycRFDLOvary) : null;
    const rightOvary = r.CycRFDROvary != null ? Number(r.CycRFDROvary) : null;
    const total =
      r.TotalEggCount != null
        ? Number(r.TotalEggCount)
        : (leftOvary || 0) + (rightOvary || 0);

    const mappedRow: RetrievalRow = {
      leftOvary,
      rightOvary,
      total,
      ivf: r.CycRIVF != null ? Number(r.CycRIVF) : null,
      icsi: r.CycRICSI != null ? Number(r.CycRICSI) : null,
      gift: r.CycRGift != null ? Number(r.CycRGift) : null,
      zift: r.CycRZift != null ? Number(r.CycRZift) : null,
      damaged: r.CycRDamaged != null ? Number(r.CycRDamaged) : null,
      recipientPatientId: r.CycRURcptPatID ? Number(r.CycRURcptPatID) : null,
      recipientCycleId: r.RecptCycId ? String(r.RecptCycId).trim() : '',
      recipientName: r.RcptPatName ? String(r.RcptPatName).trim() : '',
      fromDonor: r.DonorPatName
        ? String(r.DonorPatName).trim()
        : r.CycRDonPatID
        ? `Donor PatID: ${r.CycRDonPatID}`
        : '',
    };

    if (r.DonorFreezeMII != null || r.DonorFreezeMI != null || r.DonorFreezeGV != null) {
      const mii = Number(r.DonorFreezeMII || 0);
      const mi = Number(r.DonorFreezeMI || 0);
      const gv = Number(r.DonorFreezeGV || 0);
      result.freezeOocytes = { mii, mi, gv, total: mii + mi + gv };
    }

    if (isThisCycleRecipient) {
      // Current cycle is the recipient (e.g. C414 where eggs were donated from C215)
      result.donorToSelf = result.donorToSelf || [];
      result.donorToSelf.push(mappedRow);
      result.selfToSelf = result.selfToSelf || [];
      result.selfToSelf.push(mappedRow);
    } else if (isThisCycleOwner) {
      const isDonation =
        Boolean(r.CycRUToRcpt) ||
        Boolean(r.CycRURcptPatID && Number(r.CycRURcptPatID) > 0) ||
        Boolean(r.RecptCycId && String(r.RecptCycId).trim());

      if (isDonation) {
        // Current cycle is donor donating to recipient
        result.donorToRecipient = result.donorToRecipient || [];
        result.donorToRecipient.push(mappedRow);
      } else {
        // Self cycle
        result.selfToSelf = result.selfToSelf || [];
        result.selfToSelf.push(mappedRow);
        result.donorEggCount = result.donorEggCount || [];
        result.donorEggCount.push(mappedRow);
      }
    }
  }

  return result;
}

export async function saveRetrievalToDb(
  cycleId: string,
  patId: number,
  satId: number,
  data: RetrievalData,
  cycleType = 'Fresh'
): Promise<void> {
  const cleanId = (cycleId || '').trim();
  if (!cleanId) return;

  // Delete previous retrieval rows for this cycle to avoid duplicates
  const delParams = buildParams('@CycID,@PatID,@SatID', [cleanId, patId || 0, satId || 0]);
  await executeText(
    'DELETE FROM CycRetrieval WHERE LTRIM(RTRIM(CycID)) = @CycID AND PatID = @PatID AND SatID = @SatID',
    delParams
  ).catch(() => {});

  const now = new Date().toISOString().split('T')[0];

  // 1. Self to Self rows
  if (data.selfToSelf && data.selfToSelf.length > 0) {
    for (const row of data.selfToSelf) {
      const left = Number(row.leftOvary || 0);
      const right = Number(row.rightOvary || 0);
      const total = Number(row.total || left + right);
      const ivf = Number(row.ivf || 0);
      const icsi = Number(row.icsi || 0);
      const gift = Number(row.gift || 0);
      const zift = Number(row.zift || 0);
      const damaged = Number(row.damaged || 0);

      const insParams = buildParams(
        '@CycID,@PatID,@SatID,@CycDateOfCreation,@CycRSelf,@CycRFromDonor,@CycRDonPatID,@CycRUSelf,@CycRUToRcpt,@CycRURcptPatID,@CycRFD,@CycRFDLOvary,@CycRFDROvary,@CycRIVF,@CycRICSI,@CycRGift,@CycRZift,@CycRDamaged,@CycRToRcpt,@TotalEggCount,@RecptCycId',
        [
          cleanId,
          patId || 0,
          satId || 0,
          now,
          1, // CycRSelf
          0, // CycRFromDonor
          0, // CycRDonPatID
          1, // CycRUSelf
          0, // CycRUToRcpt
          0, // CycRURcptPatID
          0, // CycRFD
          left,
          right,
          ivf,
          icsi,
          gift,
          zift,
          damaged,
          0, // CycRToRcpt
          total,
          '',
        ]
      );
      await executeText(
        `INSERT INTO CycRetrieval(
          CycID, PatID, SatID, CycDateOfCreation, CycRSelf, CycRFromDonor, CycRDonPatID,
          CycRUSelf, CycRUToRcpt, CycRURcptPatID, CycRFD, CycRFDLOvary, CycRFDROvary,
          CycRIVF, CycRICSI, CycRGift, CycRZift, CycRDamaged, CycRToRcpt, TotalEggCount, RecptCycId
        ) VALUES (
          @CycID, @PatID, @SatID, @CycDateOfCreation, @CycRSelf, @CycRFromDonor, @CycRDonPatID,
          @CycRUSelf, @CycRUToRcpt, @CycRURcptPatID, @CycRFD, @CycRFDLOvary, @CycRFDROvary,
          @CycRIVF, @CycRICSI, @CycRGift, @CycRZift, @CycRDamaged, @CycRToRcpt, @TotalEggCount, @RecptCycId
        )`,
        insParams
      );
    }
  }

  // 2. Donor to Recipient rows
  if (data.donorToRecipient && data.donorToRecipient.length > 0) {
    for (const row of data.donorToRecipient) {
      const left = Number(row.leftOvary || 0);
      const right = Number(row.rightOvary || 0);
      const total = Number(row.total || left + right);
      const ivf = Number(row.ivf || 0);
      const icsi = Number(row.icsi || 0);
      const gift = Number(row.gift || 0);
      const zift = Number(row.zift || 0);
      const damaged = Number(row.damaged || 0);
      const rcptPatId = Number(row.recipientPatientId || 0);
      const rcptCycId = (row.recipientCycleId || '').trim();

      const mii = data.freezeOocytes ? Number(data.freezeOocytes.mii || 0) : null;
      const mi = data.freezeOocytes ? Number(data.freezeOocytes.mi || 0) : null;
      const gv = data.freezeOocytes ? Number(data.freezeOocytes.gv || 0) : null;

      const insParams = buildParams(
        '@CycID,@PatID,@SatID,@CycDateOfCreation,@CycRSelf,@CycRFromDonor,@CycRDonPatID,@CycRUSelf,@CycRUToRcpt,@CycRURcptPatID,@CycRFD,@CycRFDLOvary,@CycRFDROvary,@CycRIVF,@CycRICSI,@CycRGift,@CycRZift,@CycRDamaged,@CycRToRcpt,@TotalEggCount,@RecptCycId,@DonorFreezeMII,@DonorFreezeMI,@DonorFreezeGV',
        [
          cleanId,
          patId || 0,
          satId || 0,
          now,
          0, // CycRSelf
          1, // CycRFromDonor
          patId || 0, // CycRDonPatID (current patient is donor)
          0, // CycRUSelf
          1, // CycRUToRcpt
          rcptPatId,
          0,
          left,
          right,
          ivf,
          icsi,
          gift,
          zift,
          damaged,
          0,
          total,
          rcptCycId,
          mii,
          mi,
          gv,
        ]
      );
      await executeText(
        `INSERT INTO CycRetrieval(
          CycID, PatID, SatID, CycDateOfCreation, CycRSelf, CycRFromDonor, CycRDonPatID,
          CycRUSelf, CycRUToRcpt, CycRURcptPatID, CycRFD, CycRFDLOvary, CycRFDROvary,
          CycRIVF, CycRICSI, CycRGift, CycRZift, CycRDamaged, CycRToRcpt, TotalEggCount, RecptCycId,
          DonorFreezeMII, DonorFreezeMI, DonorFreezeGV
        ) VALUES (
          @CycID, @PatID, @SatID, @CycDateOfCreation, @CycRSelf, @CycRFromDonor, @CycRDonPatID,
          @CycRUSelf, @CycRUToRcpt, @CycRURcptPatID, @CycRFD, @CycRFDLOvary, @CycRFDROvary,
          @CycRIVF, @CycRICSI, @CycRGift, @CycRZift, @CycRDamaged, @CycRToRcpt, @TotalEggCount, @RecptCycId,
          @DonorFreezeMII, @DonorFreezeMI, @DonorFreezeGV
        )`,
        insParams
      );
    }
  }
}
