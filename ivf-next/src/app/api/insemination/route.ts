import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getClinicalCycleDates, getClinicalDoctors } from '@/lib/services-server/clinical-cycle.service';
import {
  loadIvfRecord,
  loadIcsiRecord,
  loadMonitoringDrugs,
  saveIvfRecord,
  saveIcsiRecord,
} from '@/lib/services-server/ivf-icsi.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const moduleParam = (searchParams.get('module') || 'ivf').toLowerCase();
  const isIvf = moduleParam !== 'icsi';
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
    const res = isIvf
      ? await loadIvfRecord(patId, satId, cycId, cycleDate)
      : await loadIcsiRecord(patId, satId, cycId, cycleDate);
    return NextResponse.json({ success: true, ...res });
  }

  if (action === 'monitoring') {
    const cycId = searchParams.get('cycId') || '';
    const res = await loadMonitoringDrugs(patId, satId, cycId);
    return NextResponse.json({ success: true, data: res });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const payload = await req.json();
  const moduleParam = (searchParams.get('module') || payload.module || 'ivf').toLowerCase();
  const isIvf = moduleParam !== 'icsi';

  const res = isIvf ? await saveIvfRecord(payload) : await saveIcsiRecord(payload);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
