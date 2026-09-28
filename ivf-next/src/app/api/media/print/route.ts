import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getEmbryoPicturesReportData } from '@/lib/services-server/media.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const cycId = searchParams.get('cycId') || '';
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;

  if (!cycId || !patId) {
    return NextResponse.json(
      { success: false, message: 'Please provide cycId and patId.' },
      { status: 400 }
    );
  }

  try {
    const reportData = await getEmbryoPicturesReportData(cycId, patId, satId);
    return NextResponse.json({ success: true, data: reportData });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to prepare print report.' },
      { status: 500 }
    );
  }
}
