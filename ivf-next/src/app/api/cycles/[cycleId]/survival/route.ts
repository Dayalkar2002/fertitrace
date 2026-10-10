import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { loadSurvival, saveSurvival } from '@/lib/services-server/cycle-detail.service';
import type { CycleSurvival } from '@/lib/types/cycle-detail';

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

  try {
    const survivalData = await loadSurvival(cycleId, patId, satId);
    return NextResponse.json({
      success: true,
      data: {
        data: survivalData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to load survival report.',
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

  try {
    const body = (await req.json()) as CycleSurvival & {
      patientId?: number;
      satelliteId?: number;
    };
    const patId = Number(body.patientId || qPatId || 0);
    const satId = Number(body.satelliteId || qSatId || 0);

    const saved = await saveSurvival(cycleId, body, patId, satId);

    return NextResponse.json({
      success: true,
      message: 'Survival report saved successfully.',
      data: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to save survival report.',
      },
      { status: 500 }
    );
  }
}
