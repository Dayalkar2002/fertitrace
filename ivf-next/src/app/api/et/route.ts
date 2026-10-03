import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getClinicalCycleDates, getClinicalDoctors } from '@/lib/services-server/clinical-cycle.service';
import { loadClinicalTransferRecord, saveClinicalTransferRecord, updateSingleEmbryoLocation } from '@/lib/services-server/clinical-transfer.service';

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

  if (action === 'load') {
    const cycId = searchParams.get('cycId') || '';
    const cycleDate = searchParams.get('cycleDate') || '';
    const res = await loadClinicalTransferRecord('et', patId, satId, cycId, cycleDate);
    return NextResponse.json(res);
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const payload = await req.json();
  const res = await saveClinicalTransferRecord('et', payload);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}

export async function PATCH(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { rowId, location, action, patId, satId } = await req.json();
  const res = await updateSingleEmbryoLocation('et', Number(rowId), location, action, patId, satId);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
