import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db/pool';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import * as masterService from '@/lib/services-server/master.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
  if (!user && !allowDemo) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const patient = await masterService.getPatientById(Number(id));
    if (!patient) {
      return NextResponse.json({ success: false, message: 'Patient not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: patient });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { id } = await params;
    await masterService.deletePatient(Number(id));
    return NextResponse.json({ success: true, message: 'Patient deleted.' });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
