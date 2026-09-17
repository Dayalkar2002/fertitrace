import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import * as reportsService from '@/lib/services-server/reports.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const patId = Number(searchParams.get('patId') || 0);
    const satId = Number(searchParams.get('satId') || 0);
    const iuiId = (searchParams.get('iuiId') || '').trim();
    const label = searchParams.get('label') || '';

    if (!patId || !satId) {
      return NextResponse.json({ success: false, message: 'Patient and satellite are required.' }, { status: 400 });
    }

    if (iuiId) {
      const data = await reportsService.loadIuiSummary(patId, satId, iuiId, label);
      return NextResponse.json({ success: true, data });
    }

    const data = await reportsService.listIuiReportIds(patId, satId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'IUI report failed.' },
      { status: 500 }
    );
  }
}
