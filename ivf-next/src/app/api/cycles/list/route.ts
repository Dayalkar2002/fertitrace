import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { listPatientCycles } from '@/lib/services-server/cycle-list.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;
  if (!patId) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const data = await listPatientCycles(patId, satId, user.userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to load cycles.', data: [] },
      { status: 500 }
    );
  }
}
