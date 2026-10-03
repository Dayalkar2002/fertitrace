import { executeDRL, executeText, buildParams } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface SelfFrozenOocyte {
  oocyteId: number;
  source: 'Metaphase II' | 'Metaphase I' | 'GV';
  patId: number;
  satId: number;
  location: string;
  inUse: boolean;
  cycleId: string;
  dateOfCreation: string;
  procDoneBy: string;
  mediaUsed: string;
  protocolUsed: string;
  postThaw: number; // 0=Frozen, 1=Survived, 2=Degenerated
  thawCycleId?: string;
  thawDate?: string;
}

export interface SelfOocyteFreezeInput {
  patId: number;
  satId: number;
  cycleId: string;
  counts: {
    metaII: number;
    metaI: number;
    gv: number;
  };
  strawLocation: string;
  procDoneBy: string;
  mediaUsed?: number;
  protocolUsed?: number;
}

export interface SelfOocyteThawInput {
  patId: number;
  satId: number;
  thawCycleId: string;
  thawProcDoneBy: string;
  thawMediaUsed?: number;
  thawProtocolUsed?: number;
  oocyteThawStatuses: Array<{
    oocyteId: number;
    survived: boolean;
  }>;
}

/**
 * 1. Freeze Self-Oocytes: Store retrieved oocytes into CycOocytesLocation
 */
export async function freezeSelfOocytes(input: SelfOocyteFreezeInput): Promise<{
  success: boolean;
  totalFrozen: number;
  cycleId: string;
}> {
  if (!isDbConfigured()) {
    return { success: true, totalFrozen: input.counts.metaII + input.counts.metaI + input.counts.gv, cycleId: input.cycleId };
  }

  const { patId, satId, cycleId, counts, strawLocation, procDoneBy, mediaUsed = 1, protocolUsed = 3 } = input;

  // Ensure CycOutCome has CycOType set to FrozenOocytes
  try {
    await executeText(`
      IF EXISTS (SELECT 1 FROM CycOutCome WHERE PatID = @patId AND CycID = @cycleId)
      BEGIN
        UPDATE CycOutCome 
        SET CycOType = 'FrozenOocytes' 
        WHERE PatID = @patId AND CycID = @cycleId
      END
      ELSE
      BEGIN
        INSERT INTO CycOutCome (PatID, SatID, CycID, CycOType, CycODate)
        VALUES (@patId, @satId, @cycleId, 'FrozenOocytes', GETDATE())
      END
    `, [
      { name: '@patId', value: patId },
      { name: '@satId', value: satId },
      { name: '@cycleId', value: cycleId },
    ]);
  } catch (err) {
    console.error('Error ensuring CycOutCome for self oocyte freeze:', err);
  }

  // Insert individual oocyte records into CycOocytesLocation
  const inserts: Array<{ source: string }> = [];
  for (let i = 0; i < counts.metaII; i++) inserts.push({ source: 'Metaphase II' });
  for (let i = 0; i < counts.metaI; i++) inserts.push({ source: 'Metaphase I' });
  for (let i = 0; i < counts.gv; i++) inserts.push({ source: 'GV' });

  for (const item of inserts) {
    await executeDRL(
      'spCycOocytesLocation',
      buildParams(
        '@PatId,@SatId,@Source,@Location,@CycId,@ProcDoneBy,@MediaUsed,@ProtocolUsed,@OocytesID,@QueryIndex',
        [patId, satId, item.source, strawLocation, cycleId, procDoneBy, mediaUsed, protocolUsed, 0, 2]
      )
    );
  }

  return {
    success: true,
    totalFrozen: inserts.length,
    cycleId,
  };
}

/**
 * 2. Get available self-frozen oocytes for a patient
 */
export async function getPatientSelfFrozenOocytes(
  patId: number,
  satId: number
): Promise<SelfFrozenOocyte[]> {
  if (!isDbConfigured()) return [];

  try {
    // QueryIndex = 2 retrieves frozen oocytes with location != ''
    const result = await executeDRL<Record<string, unknown>>(
      'spUpdateCycOocytesLocation',
      buildParams(
        '@PatId,@SatId,@CycId,@OocytesID,@QueryIndex,@PostThaw,@ThawAction,@ThawCycleId,@Recipient,@RecipientCycId,@ThawProcDoneBy,@ThawMediaUsed,@ThawProtocolUsed,@Source,@InUse',
        [patId, satId, '', 0, 2, 0, 0, '', null, null, '', 0, 0, '', 0]
      )
    );

    const rows = result.recordset || [];
    return rows
      .filter((r) => !r.Recipient && !r.ThawCycleId && (!r.PostThaw || Number(r.PostThaw) === 0))
      .map((r) => ({
        oocyteId: Number(r.OocytesID || 0),
        source: (String(r.Source || 'Metaphase II') as 'Metaphase II' | 'Metaphase I' | 'GV'),
        patId: Number(r.PatId || patId),
        satId: Number(r.SatId || satId),
        location: String(r.Location || '').trim(),
        inUse: Boolean(r.InUse),
        cycleId: String(r.CycID || '').trim(),
        dateOfCreation: r.DateOfCreation ? String(r.DateOfCreation) : '',
        procDoneBy: String(r.ProcDoneBy || ''),
        mediaUsed: String(r.MediaUsed || 'Kitazato'),
        protocolUsed: String(r.ProtocolUsed || 'Vitrification'),
        postThaw: Number(r.PostThaw || 0),
        thawCycleId: r.ThawCycleId ? String(r.ThawCycleId) : undefined,
      }));
  } catch (err) {
    console.error('Error in getPatientSelfFrozenOocytes:', err);
    return [];
  }
}

/**
 * 3. Thaw Self-Oocytes for an ICSI cycle
 * Updates PostThaw = 1 (Survived) or 2 (Degenerated), assigns ThawCycleId, sets InUse = 1.
 * Returns count of survived Metaphase II oocytes ready for ICSI injection.
 */
export async function thawSelfOocytesForIcsi(input: SelfOocyteThawInput): Promise<{
  success: boolean;
  totalThawed: number;
  survivedMII: number;
  survivedMI: number;
  survivedGV: number;
  degenerated: number;
  thawCycleId: string;
}> {
  const { patId, satId, thawCycleId, thawProcDoneBy, thawMediaUsed = 1, thawProtocolUsed = 2, oocyteThawStatuses } = input;

  let survivedMII = 0;
  let survivedMI = 0;
  let survivedGV = 0;
  let degenerated = 0;

  for (const item of oocyteThawStatuses) {
    const postThaw = item.survived ? 1 : 2;
    if (item.survived) {
      // Check oocyte source to count survived MII vs MI vs GV
      try {
        const check = await executeText<{ Source: string }>(
          'SELECT Source FROM CycOocytesLocation WHERE OocytesID = @oocyteId',
          [{ name: '@oocyteId', value: item.oocyteId }]
        );
        const src = check.recordset?.[0]?.Source || 'Metaphase II';
        if (src.includes('II')) survivedMII++;
        else if (src.includes('I')) survivedMI++;
        else survivedGV++;
      } catch {
        survivedMII++;
      }
    } else {
      degenerated++;
    }

    // spUpdateCycOocytesLocation @QueryIndex = 14 updates PostThaw, InUse=1, ThawCycleId
    await executeDRL(
      'spUpdateCycOocytesLocation',
      buildParams(
        '@PatId,@SatId,@CycId,@OocytesID,@QueryIndex,@PostThaw,@ThawAction,@ThawCycleId,@Recipient,@RecipientCycId,@ThawProcDoneBy,@ThawMediaUsed,@ThawProtocolUsed,@Source,@InUse',
        [
          patId,
          satId,
          '',
          item.oocyteId,
          14,
          postThaw,
          1, // ThawAction
          thawCycleId,
          null,
          null,
          thawProcDoneBy,
          thawMediaUsed,
          thawProtocolUsed,
          '',
          1, // InUse = 1 (consumed from cryo storage)
        ]
      )
    );
  }

  return {
    success: true,
    totalThawed: oocyteThawStatuses.length,
    survivedMII,
    survivedMI,
    survivedGV,
    degenerated,
    thawCycleId,
  };
}

export async function updateOocyteLocation(oocyteId: number, location: string) {
  if (!isDbConfigured()) return { success: true, message: 'Mock location updated' };
  try {
    await executeText(
      'UPDATE CycOocytesLocation SET Location = @Location WHERE OocytesID = @OocytesID',
      [
        { name: '@Location', value: location },
        { name: '@OocytesID', value: oocyteId },
      ]
    );
    return { success: true, message: 'Oocyte location updated' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to update oocyte location' };
  }
}
