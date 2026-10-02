import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getClinicalCycleDates, getClinicalDoctors } from '@/lib/services-server/clinical-cycle.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';
  const patId = Number(searchParams.get('patId') || 0);
  const satId = Number(searchParams.get('satId') || 0);

  if (action === 'lookups') {
    const doctors = await getClinicalDoctors();
    return NextResponse.json({ success: true, data: { doctors } });
  }

  if (action === 'cycle-dates') {
    const data = await getClinicalCycleDates(patId, satId);
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
