import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getCyclesForMedia } from '@/lib/services-server/media.service';

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
    const cycles = await getCyclesForMedia(patId, satId);
    return NextResponse.json({ success: true, data: cycles });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to fetch cycles' },
      { status: 500 }
    );
  }
}
