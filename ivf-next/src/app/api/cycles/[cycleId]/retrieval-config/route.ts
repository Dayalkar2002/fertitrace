import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { buildRetrievalConfig, getStoredCycle, upsertCycle } from '@/lib/cycle-store';
import { oocyteSourceFromCreation } from '@/lib/cycle-utils';
import { getRetrievalForCycle } from '@/lib/services-server/retrieval.service';
import { executeText, buildParams } from '@/lib/db/spExecutor';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  const { searchParams } = new URL(req.url);
  let patId = Number(searchParams.get('patId')) || 0;
  let satId = Number(searchParams.get('satId')) || 0;
  let cycleType = searchParams.get('cycleType') || searchParams.get('oocyteSource') || '';

  // If cycle is not stored in memory, check CycOutCome from database
  let stored = getStoredCycle(cycleId);
  if (!stored) {
    try {
      const q = `SELECT TOP 1 CycID, PatID, SatID, CycOType FROM CycOutCome WHERE LTRIM(RTRIM(CycID)) = @CycID`;
      const res = await executeText<{ CycID: string; PatID: number; SatID: number; CycOType: string }>(
        q,
        buildParams('@CycID', [cycleId.trim()])
      );
      const row = res.recordset?.[0];
      if (row) {
        if (!patId) patId = Number(row.PatID || 0);
        if (!satId) satId = Number(row.SatID || 0);
        if (!cycleType) cycleType = String(row.CycOType || '');
      }
    } catch {
      /* ignore DB read error */
    }
  }

  const cycle = stored
    ? stored
    : upsertCycle({
        cycleId,
        patientId: patId,
        satelliteId: satId,
        oocyteSource: oocyteSourceFromCreation(cycleType || 'Fresh'),
        semenSource: searchParams.get('semenSource') || 'husband_fresh',
        cycleType: cycleType || 'Fresh',
        treatmentType: searchParams.get('treatmentType') || 'Fresh',
      });

  const baseConfig = buildRetrievalConfig(cycle);

  // Fetch live retrieval data from database (CycRetrieval)
  try {
    const dbRetrieval = await getRetrievalForCycle(cycleId, cycle.patientId || patId, cycle.satelliteId || satId);
    const hasDbData =
      (dbRetrieval.selfToSelf && dbRetrieval.selfToSelf.length > 0) ||
      (dbRetrieval.donorToRecipient && dbRetrieval.donorToRecipient.length > 0) ||
      (dbRetrieval.donorToSelf && dbRetrieval.donorToSelf.length > 0) ||
      (dbRetrieval.donorEggCount && dbRetrieval.donorEggCount.length > 0) ||
      Boolean(dbRetrieval.freezeOocytes);

    if (hasDbData) {
      baseConfig.existingRetrieval = dbRetrieval;
    }
  } catch (err) {
    console.error('Failed to load DB retrieval for cycle', cycleId, err);
  }

  return NextResponse.json({ success: true, data: baseConfig });
}
