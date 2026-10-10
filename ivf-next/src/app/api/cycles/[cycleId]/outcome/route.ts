import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { loadOutcome, saveOutcome } from '@/lib/services-server/cycle-detail.service';
import type { CycleOutcome } from '@/lib/types/cycle-detail';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  const { searchParams } = new URL(req.url);
  const patId = Number(searchParams.get('patId') || 0);
  const satId = Number(searchParams.get('satId') || 0);
  const cycleType = searchParams.get('cycleType') || '';

  try {
    const outcomeData = await loadOutcome(cycleId, patId, satId, cycleType);
    return NextResponse.json({
      success: true,
      data: {
        data: outcomeData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to load outcome.',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  const { searchParams } = new URL(req.url);
  const qPatId = Number(searchParams.get('patId') || 0);
  const qSatId = Number(searchParams.get('satId') || 0);
  const qType = searchParams.get('cycleType') || '';

  try {
    const body = (await req.json()) as CycleOutcome & {
      patientId?: number;
      satelliteId?: number;
      cycleType?: string;
    };
    const patId = Number(body.patientId || qPatId || 0);
    const satId = Number(body.satelliteId || qSatId || 0);
    const cycleType = body.cycleType || qType || '';

    const saved = await saveOutcome(cycleId, body, patId, satId, cycleType);

    return NextResponse.json({
      success: true,
      message: 'Outcome saved successfully.',
      data: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to save outcome.',
      },
      { status: 500 }
    );
  }
}
