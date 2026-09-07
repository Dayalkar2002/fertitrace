import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { sendMessage } from '@/lib/services-server/communication.service';

export async function POST(req: NextRequest) {
  try {
    let user = getAuthenticatedUser(req);
    const allowDemo = process.env.ALLOW_DEMO_LOGIN !== 'false';
    if (!user) {
      if (allowDemo) {
        user = {
          userId: 1,
          userLoginName: 'admin',
          userName: 'Clinic Admin',
          roleId: 1,
          roleName: 'Admin',
        };
      } else {
        return authUnauthorizedResponse();
      }
    }

    const body = await req.json();
    if (!body.recipient || !body.messageText) {
      return NextResponse.json(
        { success: false, message: 'Recipient and message text are required.' },
        { status: 400 }
      );
    }

    const record = await sendMessage({
      patientId: body.patientId || 0,
      patientName: body.patientName || '',
      recipient: body.recipient,
      channel: body.channel || 'SMS',
      messageType: body.messageType || 'General Message',
      messageText: body.messageText,
      templateId: body.templateId,
      language: body.language || 'English',
      sentBy: user.userName || user.userLoginName || 'Administrator',
    });

    return NextResponse.json({
      success: true,
      message: `Message dispatched successfully via ${body.channel || 'SMS'}.`,
      data: record,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to send message.' },
      { status: 500 }
    );
  }
}
