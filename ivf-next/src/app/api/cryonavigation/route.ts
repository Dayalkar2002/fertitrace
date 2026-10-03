import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  getCryoBarcodeInventory,
  validateCryoScan,
} from '@/lib/services-server/cryonavigation.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'inventory';
  const patId = Number(searchParams.get('patId') || -1);
  const query = searchParams.get('query') || '';

  if (action === 'inventory') {
    const data = await getCryoBarcodeInventory(patId, query);
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const body = await req.json();
    const action = body.action || 'validate';

    if (action === 'validate') {
      const scannedCode = String(body.scannedCode || '').trim();
      const expectedPatId = body.expectedPatId ? Number(body.expectedPatId) : undefined;
      const data = await validateCryoScan(scannedCode, expectedPatId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Cryonavigation scan validation failed.' },
      { status: 500 }
    );
  }
}
