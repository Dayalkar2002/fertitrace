import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  listFrozenOocyteLocations,
  updateFrozenOocyteLocation,
} from '@/lib/services-server/oocyte-freeze.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  const { searchParams } = new URL(req.url);
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;
  const rows = await listFrozenOocyteLocations(patId, satId, cycleId);
  return NextResponse.json({ success: true, data: rows });
}

export async function PATCH(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const body = (await req.json()) as { oocytesId?: number; location?: string };
    if (!body.oocytesId) {
      return NextResponse.json({ success: false, message: 'Oocyte row is required.' }, { status: 400 });
    }
    await updateFrozenOocyteLocation(body.oocytesId, body.location || '');
    return NextResponse.json({ success: true, message: 'Location saved.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to save location.' },
      { status: 500 }
    );
  }
}
