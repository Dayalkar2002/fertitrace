import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import { getIvfIcsiOverview, getOocyteEmbryoData, updateOocyteEmbryoData } from '@/lib/services-server/oocyte-embryo.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const patId = Number(searchParams.get('patId') || 0);
    const satId = Number(searchParams.get('satId') || 0);

    if (patId && satId && isDbConfigured()) {
      const data = await getIvfIcsiOverview(patId, satId);
      return NextResponse.json({ success: true, data });
    }

    const patientId = searchParams.get('patientId') || undefined;
    const data = await getOocyteEmbryoData(patientId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Error fetching oocyte and embryo data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const body = await req.json();
    const updated = await updateOocyteEmbryoData(body);
    return NextResponse.json({
      success: true,
      message: 'Oocyte & Embryo data updated successfully',
      data: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Error saving oocyte and embryo data' },
      { status: 500 }
    );
  }
}
