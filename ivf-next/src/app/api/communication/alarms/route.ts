import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { listAlarmEvents, raiseAlarm } from '@/lib/services-server/alarms.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
  if (!user && !allowDemo) {
    return authUnauthorizedResponse();
  }

  return NextResponse.json({ success: true, data: listAlarmEvents() });
}

export async function POST(req: NextRequest) {
  try {
    let user = getAuthenticatedUser(req);
    const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
    if (!user) {
      if (!allowDemo) return authUnauthorizedResponse();
      user = {
        userId: 1,
        userLoginName: 'admin',
        userName: 'Clinic Admin',
        roleId: 1,
        roleName: 'Admin',
      };
    }

    const body = await req.json();
    if (!body.eventId || !body.detail) {
      return NextResponse.json(
        { success: false, message: 'eventId and detail are required.' },
        { status: 400 }
      );
    }

    const event = await raiseAlarm({
      eventId: body.eventId,
      source: body.source,
      patientId: body.patientId,
      patientName: body.patientName,
      sampleId: body.sampleId,
      detail: body.detail,
      raisedBy: body.raisedBy || user.userName || user.userLoginName || 'System',
    });

    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to raise alarm.' },
      { status: 500 }
    );
  }
}
