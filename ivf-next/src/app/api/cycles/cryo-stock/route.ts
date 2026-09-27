import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getCryoStockSummary } from '@/lib/services-server/cycle-list.service';
import { getStoredCycle } from '@/lib/cycle-store';
import { executeText, buildParams } from '@/lib/db/spExecutor';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  let patId = Number(searchParams.get('patId')) || 0;
  let satId = Number(searchParams.get('satId')) || 0;
  const cycleId = searchParams.get('cycleId')?.trim() || '';

  if (!patId && cycleId) {
    const stored = getStoredCycle(cycleId);
    if (stored?.patientId) {
      patId = stored.patientId;
      satId = satId || stored.satelliteId || 0;
    } else {
      try {
        const q = `SELECT TOP 1 PatID, SatID FROM CycOutCome WHERE LTRIM(RTRIM(CycID)) = @CycID`;
        const res = await executeText<{ PatID: number; SatID: number }>(
          q,
          buildParams('@CycID', [cycleId])
        );
        const row = res.recordset?.[0];
        if (row) {
          patId = Number(row.PatID || 0);
          satId = satId || Number(row.SatID || 0);
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (!patId) {
    return NextResponse.json({
      success: true,
      data: {
        etFrozen: 0,
        btFrozen: 0,
        totalFrozenOocytes: 0,
        miiFrozen: 0,
        miFrozen: 0,
        gvFrozen: 0,
      },
    });
  }

  try {
    const data = await getCryoStockSummary(patId, satId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to load cryo stock.',
        data: {
          etFrozen: 0,
          btFrozen: 0,
          totalFrozenOocytes: 0,
          miiFrozen: 0,
          miFrozen: 0,
          gvFrozen: 0,
        },
      },
      { status: 500 }
    );
  }
}
