import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getCommunicationHistory } from '@/lib/services-server/communication.service';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
    if (!user && !allowDemo) {
      return authUnauthorizedResponse();
    }

    const history = await getCommunicationHistory();
    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to fetch history.' },
      { status: 500 }
    );
  }
}
