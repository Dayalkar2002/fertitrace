import { isDbConfigured } from '@/lib/db/pool';
import { buildParams, executeDML, executeDRL, executeText } from '@/lib/db/spExecutor';
import { rowNum, rowVal } from '@/lib/db/row';
import { normalizeCycleType } from '@/lib/cycle-utils';
import type { FreezeOocyteRow, RetrievalData, RetrievalRow } from '@/lib/types/cycle';

export interface FrozenOocyteLocation {
  oocytesId: number;
  source: string;
  location: string;
  cycleId: string;
  procDoneBy: string;
  sourceDonorCycleId: string;
}

export interface SaveOdFreezeResult {
  fzoCycleId: string;
  recipientPatientId: number;
  mii: number;
  mi: number;
  gv: number;
  locations: FrozenOocyteLocation[];
}

const FZO_TYPE = 'Frozen Oocyte (FZO)';
const OD_FREEZE_MIN = 10;

function freezeCounts(row?: FreezeOocyteRow | null) {
  const mii = Number(row?.mii || 0);
  const mi = Number(row?.mi || 0);
  const gv = Number(row?.gv || 0);
  return { mii, mi, gv, total: mii + mi + gv };
}

function donorMarker(donorCycId: string) {
  return `ODFREEZE:${donorCycId.trim()}`;
}

function adviceText(donorCycId: string, donorName: string, orCycId: string, mii: number, mi: number, gv: number) {
  let advice = `Donor freeze from ${donorCycId.trim()}`;
  if (donorName.trim()) advice += ` (${donorName.trim()})`;
  if (orCycId.trim()) advice += ` / OR cycle ${orCycId.trim()}`;
  if (mii + mi + gv > 0) advice += ` | MII=${mii};MI=${mi};GV=${gv}`;
  return advice;
}

function rowTotal(row?: RetrievalRow | null) {
  if (!row) return 0;
  if (row.total != null && Number(row.total) > 0) return Number(row.total);
  return Number(row.leftOvary || 0) + Number(row.rightOvary || 0);
}

export function validateOdFreeze(sections: RetrievalData): string {
  const donorTotal = rowTotal(sections.donorEggCount?.[0]);
  const recipientRow = (sections.donorToRecipient || []).find((row) => Number(row.recipientPatientId) > 0);
  const recipientTotal = rowTotal(recipientRow);
  const { total: freezeTotal } = freezeCounts(sections.freezeOocytes);
  const extra = Math.max(0, donorTotal - recipientTotal);

  if (donorTotal <= OD_FREEZE_MIN && freezeTotal > 0) {
    return 'Freeze Oocytes is allowed only when donor egg total is more than 10.';
  }
  if (freezeTotal > extra) {
    return `Freeze oocytes total (${freezeTotal}) cannot be more than ${extra} (Donor total ${donorTotal} minus Recipient total ${recipientTotal}).`;
  }
  if (donorTotal > OD_FREEZE_MIN && extra > 0 && freezeTotal !== extra) {
    return `Freeze oocytes total must be exactly ${extra} (Donor total ${donorTotal} minus Recipient total ${recipientTotal}).`;
  }
  if (extra <= 0 && freezeTotal > 0) {
    return 'Freeze oocyte counts should be zero when all eggs are allotted to the recipient.';
  }
  if (freezeTotal > 0 && !Number(recipientRow?.recipientPatientId)) {
    return 'Select recipient and recipient cycle before saving freeze oocyte counts.';
  }
  return '';
}

async function nextCycleId(patId: number, satId: number): Promise<string> {
  try {
    const result = await executeDRL<Record<string, unknown>>(
      'spCycOutComeExtDRL',
      buildParams('@PatID,@SatID,@QueryIndex', [patId, satId, 2])
    );
    const count = Number(Object.values(result.recordset?.[0] || {})[0] ?? 0) || 0;
    for (let attempt = 1; attempt <= 50; attempt += 1) {
      const candidate = `C${patId}${count + attempt}`;
      const exists = await executeText<{ Found: number }>(
        `SELECT TOP 1 1 AS Found FROM CycOutCome
         WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = LTRIM(RTRIM(@CycID))`,
        buildParams('@PatID,@SatID,@CycID', [patId, satId, candidate])
      );
      if (!exists.recordset?.length) return candidate;
    }
  } catch {
    /* fall through */
  }
  return `C${patId}${Date.now().toString().slice(-6)}`;
}

async function nextOid(patId: number, satId: number, cycId: string): Promise<number> {
  try {
    const result = await executeDRL<Record<string, unknown>>(
      'spCycRetrievalExtDRL',
      buildParams('@CycID,@PatID,@SatID,@QueryIndex', [cycId, patId, satId, 3])
    );
    return (Number(Object.values(result.recordset?.[0] || {})[0] ?? 0) || 0) + 1;
  } catch {
    return 1;
  }
}

async function findFzoCycle(recipientPatId: number, recipientSatId: number, donorCycId: string): Promise<string> {
  const marker = donorMarker(donorCycId);
  try {
    const byRows = await executeText<{ CycID: string }>(
      `SELECT TOP 1 o.CycID
       FROM CycOutCome o
       INNER JOIN CycOocytesLocation l
         ON LTRIM(RTRIM(l.CycId)) = LTRIM(RTRIM(o.CycID)) AND l.PatId = o.PatID AND l.SatId = o.SatID
       WHERE o.PatID = @PatID AND o.SatID = @SatID
         AND (o.CycOType LIKE '%Frozen Oocyte%' OR o.CycOType LIKE '%FrozenOocytes%' OR o.CycOType LIKE '%FZO%')
         AND (
           LTRIM(RTRIM(ISNULL(l.ProcDoneBy, ''))) = @Marker
           OR LTRIM(RTRIM(ISNULL(l.SourceDonorCycID, ''))) = @DonorCycId
         )
       ORDER BY o.CycOID DESC`,
      buildParams('@PatID,@SatID,@Marker,@DonorCycId', [recipientPatId, recipientSatId, marker, donorCycId.trim()])
    );
    if (byRows.recordset?.[0]?.CycID) return String(byRows.recordset[0].CycID).trim();

    const byAdvice = await executeText<{ CycID: string }>(
      `SELECT TOP 1 CycID FROM CycOutCome
       WHERE PatID = @PatID AND SatID = @SatID
         AND (CycOType LIKE '%Frozen Oocyte%' OR CycOType LIKE '%FrozenOocytes%' OR CycOType LIKE '%FZO%')
         AND LTRIM(RTRIM(ISNULL(CycOAdvice, ''))) LIKE @AdvicePrefix
       ORDER BY CycOID DESC`,
      buildParams('@PatID,@SatID,@AdvicePrefix', [recipientPatId, recipientSatId, `Donor freeze from ${donorCycId.trim()}%`])
    );
    if (byAdvice.recordset?.[0]?.CycID) return String(byAdvice.recordset[0].CycID).trim();
  } catch {
    /* table/SP may differ */
  }
  return '';
}

async function createFzoCycle(
  recipientPatId: number,
  recipientSatId: number,
  donorCycId: string,
  orCycId: string,
  donorName: string
): Promise<string> {
  const cycId = await nextCycleId(recipientPatId, recipientSatId);
  const oid = await nextOid(recipientPatId, recipientSatId, cycId);
  const now = new Date();
  await executeDML(
    'spCycOutCome',
    buildParams(
      '@CycID,@CycOID,@PatID,@SatID,@CycODate,@CycOBHCGDate,@CycODateOfCreation,@CycOValue,@CycONoSac,@CycOPTDay,@CycOOutcome,@CycOPregOpt,@CycOPregDelOpt,@CycOPostTreat,@CycOAdvice,@CycOTreatment,@QueryIndex,@CycOType',
      [
        cycId,
        oid,
        recipientPatId,
        recipientSatId,
        now,
        new Date(1901, 0, 1),
        now,
        0,
        0,
        0,
        0,
        0,
        0,
        '',
        adviceText(donorCycId, donorName, orCycId, 0, 0, 0),
        '',
        11,
        FZO_TYPE,
      ]
    )
  );
  return cycId;
}

async function saveDonorFreezeColumns(donorCycId: string, donorPatId: number, satId: number, mii: number, mi: number, gv: number) {
  try {
    await executeText(
      `IF COL_LENGTH('CycRetrieval', 'DonorFreezeMII') IS NOT NULL
       UPDATE CycRetrieval
       SET DonorFreezeMII = @MII, DonorFreezeMI = @MI, DonorFreezeGV = @GV
       WHERE LTRIM(RTRIM(CycID)) = LTRIM(RTRIM(@CycID)) AND PatID = @PatID AND SatID = @SatID AND CycRUToRcpt = 1`,
      buildParams('@MII,@MI,@GV,@CycID,@PatID,@SatID', [mii, mi, gv, donorCycId, donorPatId, satId])
    );
  } catch {
    /* DonorFreeze columns may not exist */
  }
}

async function insertOocyteRows(patId: number, satId: number, cycId: string, source: string, count: number, procDoneBy: string) {
  for (let i = 0; i < count; i += 1) {
    await executeDML(
      'spCycOocytesLocation',
      buildParams(
        '@PatId,@SatId,@Source,@Location,@CycId,@ProcDoneBy,@MediaUsed,@ProtocolUsed,@OocytesID,@QueryIndex',
        [patId, satId, source, '', cycId, procDoneBy, 0, 0, 0, 11]
      )
    );
  }
}

async function replaceUnlocatedRows(
  patId: number,
  satId: number,
  cycId: string,
  donorCycId: string,
  mii: number,
  mi: number,
  gv: number
) {
  const marker = donorMarker(donorCycId);
  try {
    await executeText(
      `DELETE FROM CycOocytesLocation
       WHERE PatId = @PatId AND SatId = @SatId AND LTRIM(RTRIM(CycId)) = LTRIM(RTRIM(@CycId))
         AND LTRIM(RTRIM(ISNULL(Location, ''))) = ''`,
      buildParams('@PatId,@SatId,@CycId', [patId, satId, cycId])
    );
  } catch {
    /* ignore */
  }
  await insertOocyteRows(patId, satId, cycId, 'Metaphase II', mii, marker);
  await insertOocyteRows(patId, satId, cycId, 'Metaphase I', mi, marker);
  await insertOocyteRows(patId, satId, cycId, 'GV', gv, marker);
  try {
    await executeText(
      `UPDATE CycOocytesLocation
       SET SourceDonorCycID = @DonorCycId
       WHERE PatId = @PatId AND SatId = @SatId AND LTRIM(RTRIM(CycId)) = LTRIM(RTRIM(@CycId))
         AND ProcDoneBy = @ProcDoneBy AND LTRIM(RTRIM(ISNULL(SourceDonorCycID, ''))) = ''`,
      buildParams('@DonorCycId,@PatId,@SatId,@CycId,@ProcDoneBy', [donorCycId.trim(), patId, satId, cycId, marker])
    );
  } catch {
    /* SourceDonorCycID may not exist */
  }
}

async function writeAdvice(fzoCycId: string, patId: number, satId: number, advice: string) {
  try {
    await executeText(
      `UPDATE CycOutCome SET CycOAdvice = @Advice
       WHERE PatID = @PatID AND SatID = @SatID AND LTRIM(RTRIM(CycID)) = LTRIM(RTRIM(@CycID))`,
      buildParams('@Advice,@PatID,@SatID,@CycID', [advice, patId, satId, fzoCycId])
    );
  } catch {
    /* ignore */
  }
}

export async function listFrozenOocyteLocations(
  patId: number,
  satId: number,
  cycId: string
): Promise<FrozenOocyteLocation[]> {
  if (!patId || !cycId || !isDbConfigured()) return [];
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT OocytesID, Source, Location, CycId, ProcDoneBy, SourceDonorCycID
       FROM CycOocytesLocation
       WHERE PatId = @PatId AND SatId = @SatId AND LTRIM(RTRIM(CycId)) = LTRIM(RTRIM(@CycId))
       ORDER BY OocytesID`,
      buildParams('@PatId,@SatId,@CycId', [patId, satId, cycId])
    );
    return (result.recordset || []).map((row) => ({
      oocytesId: rowNum(row, 'OocytesID'),
      source: rowVal(row, 'Source'),
      location: rowVal(row, 'Location'),
      cycleId: rowVal(row, 'CycId', 'CycID'),
      procDoneBy: rowVal(row, 'ProcDoneBy'),
      sourceDonorCycleId: rowVal(row, 'SourceDonorCycID'),
    }));
  } catch {
    try {
      const result = await executeDRL<Record<string, unknown>>(
        'spCycOocytesLocation',
        buildParams(
          '@PatId,@SatId,@Source,@Location,@CycId,@ProcDoneBy,@MediaUsed,@ProtocolUsed,@OocytesID,@QueryIndex',
          [patId, satId, '', '', cycId, '', 0, 0, 0, 1]
        )
      );
      return (result.recordset || []).map((row) => ({
        oocytesId: rowNum(row, 'OocytesID'),
        source: rowVal(row, 'Source'),
        location: rowVal(row, 'Location'),
        cycleId: rowVal(row, 'CycId', 'CycID') || cycId,
        procDoneBy: rowVal(row, 'ProcDoneBy'),
        sourceDonorCycleId: rowVal(row, 'SourceDonorCycID'),
      }));
    } catch {
      return [];
    }
  }
}

export async function updateFrozenOocyteLocation(oocytesId: number, location: string): Promise<void> {
  if (!oocytesId) throw new Error('Oocyte row is missing.');
  await executeText(
    `UPDATE CycOocytesLocation SET Location = @Location WHERE OocytesID = @OocytesID`,
    buildParams('@Location,@OocytesID', [location.trim(), oocytesId])
  );
}

export async function persistRetrievalFreeze(input: {
  cycleId: string;
  cycleType?: string;
  patientId: number;
  satelliteId: number;
  donorName?: string;
  sections: RetrievalData;
}): Promise<SaveOdFreezeResult | null> {
  if (!isDbConfigured() || !input.cycleId || !input.patientId) return null;
  const type = normalizeCycleType(input.cycleType);
  const counts = freezeCounts(input.sections.freezeOocytes);
  if (counts.total <= 0) return null;

  if (type === 'FrozenOocytes') {
    await replaceUnlocatedRows(input.patientId, input.satelliteId, input.cycleId, input.cycleId, counts.mii, counts.mi, counts.gv);
    return {
      fzoCycleId: input.cycleId,
      recipientPatientId: input.patientId,
      ...counts,
      locations: await listFrozenOocyteLocations(input.patientId, input.satelliteId, input.cycleId),
    };
  }

  if (type !== 'OD') return null;

  const error = validateOdFreeze(input.sections);
  if (error) throw new Error(error);

  const recipient = (input.sections.donorToRecipient || []).find((row) => Number(row.recipientPatientId) > 0);
  const recipientPatId = Number(recipient?.recipientPatientId);
  const recipientCycId = String(recipient?.recipientCycleId || '').trim();
  if (!recipientPatId || !recipientCycId) {
    throw new Error('Select recipient and recipient cycle before saving freeze oocyte counts.');
  }

  await saveDonorFreezeColumns(input.cycleId, input.patientId, input.satelliteId, counts.mii, counts.mi, counts.gv);

  let fzoCycleId = await findFzoCycle(recipientPatId, input.satelliteId, input.cycleId);
  if (!fzoCycleId) {
    fzoCycleId = await createFzoCycle(
      recipientPatId,
      input.satelliteId,
      input.cycleId,
      recipientCycId,
      input.donorName || ''
    );
  }

  try {
    await executeDML(
      'spSyncDonorRecipientFrozenOocytes',
      buildParams(
        '@RecipientPatId,@RecipientSatId,@RecipientCycId,@DonorCycId,@MetaII,@MetaI,@GV,@ProcDoneByMarker',
        [recipientPatId, input.satelliteId, fzoCycleId, input.cycleId, counts.mii, counts.mi, counts.gv, donorMarker(input.cycleId)]
      )
    );
  } catch {
    await replaceUnlocatedRows(recipientPatId, input.satelliteId, fzoCycleId, input.cycleId, counts.mii, counts.mi, counts.gv);
  }

  await writeAdvice(
    fzoCycleId,
    recipientPatId,
    input.satelliteId,
    adviceText(input.cycleId, input.donorName || '', recipientCycId, counts.mii, counts.mi, counts.gv)
  );

  return {
    fzoCycleId,
    recipientPatientId: recipientPatId,
    ...counts,
    locations: await listFrozenOocyteLocations(recipientPatId, input.satelliteId, fzoCycleId),
  };
}
