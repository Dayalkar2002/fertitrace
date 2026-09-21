import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import { getLatestCycleAnalysisSemen } from '@/lib/services-server/cycle-sperm.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { cycleId } = await params;
    const { searchParams } = new URL(req.url);
    const patId = Number(searchParams.get('patId')) || 0;
    const data = await getLatestCycleAnalysisSemen(patId, cycleId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to load semen details.' },
      { status: 500 }
    );
  }
}
