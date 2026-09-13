import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import * as donorService from '@/lib/services-server/semen-donor.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const data = await donorService.getSemenDonor(Number(id));
    if (!data) {
      return NextResponse.json({ success: false, message: 'Donor not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
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
    const data = await donorService.deleteSemenDonor(Number(id));
    return NextResponse.json({ success: true, message: 'Donor deleted.', data });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json({ success: false, message: (error as Error).message }, { status });
  }
}
