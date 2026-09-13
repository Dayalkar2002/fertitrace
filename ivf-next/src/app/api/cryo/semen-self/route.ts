import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import * as semenSelfService from '@/lib/services-server/semen-self.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const patientId = Number(searchParams.get('patientId')) || 0;
    const satId = Number(searchParams.get('satId')) || 0;
    const data = await semenSelfService.listSemenSelf(patientId, satId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const data = await semenSelfService.deleteSemenSelf(
      Number(body.patientId) || 0,
      Number(body.satId) || 0,
      Number(body.cycSSID) || 0,
      String(body.freezingId || '')
    );
    return NextResponse.json({ success: true, message: 'Record deleted.', data });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json({ success: false, message: (error as Error).message }, { status });
  }
}
