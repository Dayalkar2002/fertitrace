import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { acknowledgeAlarm } from '@/lib/services-server/alarms.service';

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
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Alarm id is required.' }, { status: 400 });
    }

    const event = acknowledgeAlarm(body.id, user.userName || user.userLoginName || 'Administrator');
    return NextResponse.json({ success: true, data: event });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to acknowledge alarm.' },
      { status: 500 }
    );
  }
}
