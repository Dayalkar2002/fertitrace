import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { listAlarmMaster } from '@/lib/services-server/alarms.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
  if (!user && !allowDemo) {
    return authUnauthorizedResponse();
  }

  return NextResponse.json({ success: true, data: listAlarmMaster() });
}
