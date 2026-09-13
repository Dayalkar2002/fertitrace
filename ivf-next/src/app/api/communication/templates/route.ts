import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { SMS_TEMPLATES } from '@/lib/communication/sms-templates';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
  if (!user && !allowDemo) {
    return authUnauthorizedResponse();
  }

  return NextResponse.json({ success: true, data: SMS_TEMPLATES });
}
