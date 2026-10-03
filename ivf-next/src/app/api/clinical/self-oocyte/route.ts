import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  freezeSelfOocytes,
  getPatientSelfFrozenOocytes,
  thawSelfOocytesForIcsi,
  updateOocyteLocation,
} from '@/lib/services-server/self-oocyte.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'frozen-inventory';
  const patId = Number(searchParams.get('patId') || 0);
  const satId = Number(searchParams.get('satId') || 0);

  if (action === 'frozen-inventory') {
    if (!patId) {
      return NextResponse.json({ success: false, message: 'patId is required' }, { status: 400 });
    }
    const data = await getPatientSelfFrozenOocytes(patId, satId);
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const body = await req.json();
    const action = body.action || '';

    if (action === 'freeze') {
      const data = await freezeSelfOocytes({
        patId: Number(body.patId),
        satId: Number(body.satId || 0),
        cycleId: String(body.cycleId),
        counts: {
          metaII: Number(body.counts?.metaII || 0),
          metaI: Number(body.counts?.metaI || 0),
          gv: Number(body.counts?.gv || 0),
        },
        strawLocation: String(body.strawLocation || ''),
        procDoneBy: String(body.procDoneBy || user.userName || ''),
        mediaUsed: Number(body.mediaUsed || 1),
        protocolUsed: Number(body.protocolUsed || 3),
      });
      return NextResponse.json({ success: true, data });
    }

    if (action === 'thaw') {
      const data = await thawSelfOocytesForIcsi({
        patId: Number(body.patId),
        satId: Number(body.satId || 0),
        thawCycleId: String(body.thawCycleId),
        thawProcDoneBy: String(body.thawProcDoneBy || user.userName || ''),
        thawMediaUsed: Number(body.thawMediaUsed || 1),
        thawProtocolUsed: Number(body.thawProtocolUsed || 2),
        oocyteThawStatuses: Array.isArray(body.oocyteThawStatuses) ? body.oocyteThawStatuses : [],
      });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Self-oocyte operation failed.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const { oocyteId, location } = await req.json();
    const res = await updateOocyteLocation(Number(oocyteId), String(location || ''));
    return NextResponse.json(res, { status: res.success ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to update oocyte location' },
      { status: 500 }
    );
  }
}
