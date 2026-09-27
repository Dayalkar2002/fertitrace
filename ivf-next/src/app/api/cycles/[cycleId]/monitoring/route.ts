import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  getMonitoringChartForCycle,
  saveMonitoringChartForCycle,
} from '@/lib/services-server/monitoring-chart.service';
import type { CycleMonitoring } from '@/lib/types/cycle-detail';

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
    const result = await getMonitoringChartForCycle(cycleId, patId, satId);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to load monitoring chart.',
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
  try {
    const body = (await req.json()) as CycleMonitoring & {
      patientId?: number;
      satelliteId?: number;
    };
    const patId = Number(body.patientId || 0);
    const satId = Number(body.satelliteId || 0);

    await saveMonitoringChartForCycle(cycleId, patId, satId, body);

    return NextResponse.json({
      success: true,
      message: 'Monitoring chart saved successfully.',
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to save monitoring chart.',
      },
      { status: 500 }
    );
  }
}
