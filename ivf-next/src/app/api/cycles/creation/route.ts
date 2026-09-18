import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import { buildParams, executeDRL } from '@/lib/db/spExecutor';
import { upsertCycle } from '@/lib/cycle-store';
import { defaultSemenSource, oocyteSourceFromCreation } from '@/lib/cycle-utils';
import type { CycleCreationPayload } from '@/lib/types/cycle';

async function nextCycleId(patId: number, satId: number): Promise<string> {
  if (patId && isDbConfigured()) {
    try {
      const result = await executeDRL<Record<string, unknown>>(
        'spCycOutComeExtDRL',
        buildParams('@PatID,@SatID,@QueryIndex', [patId, satId || 0, 2])
      );
      const row = result.recordset?.[0] || {};
      const count = Number(Object.values(row)[0] ?? 0) || 0;
      return `C${patId}${count + 1}`;
    } catch {
      /* fall through */
    }
  }
  const stamp = String(Date.now()).slice(-4);
  return patId ? `C${patId}${stamp}` : `C${stamp}`;
}

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  const { searchParams } = new URL(req.url);
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;
  const cycleId = await nextCycleId(patId, satId);
  return NextResponse.json({ success: true, data: { cycleId } });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const body = (await req.json()) as CycleCreationPayload;
    if (!body.patientId) {
      return NextResponse.json({ success: false, message: 'Patient is required.' }, { status: 400 });
    }
    if (!body.startDate) {
      return NextResponse.json({ success: false, message: 'Start date is required.' }, { status: 400 });
    }
    if (!body.monitoringSheet) {
      return NextResponse.json(
        { success: false, message: 'Select a Monitoring Sheet option.' },
        { status: 400 }
      );
    }
    const cycleId = body.cycleId?.trim() || (await nextCycleId(body.patientId, body.satelliteId || 0));
    const oocyteSource = oocyteSourceFromCreation(body.cycleType);
    upsertCycle({
      ...body,
      cycleId,
      oocyteSource,
      semenSource: defaultSemenSource(body.cycleType, body.treatmentType),
      status: 'created',
    });
    return NextResponse.json({
      success: true,
      message: 'Cycle created.',
      data: { ...body, cycleId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to create cycle.' },
      { status: 500 }
    );
  }
}
