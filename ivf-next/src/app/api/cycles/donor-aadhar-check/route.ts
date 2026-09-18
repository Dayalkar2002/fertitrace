import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  const { searchParams } = new URL(req.url);
  return NextResponse.json({
    success: true,
    data: {
      donorAadhar: '',
      recipientAadhar: '',
      message: searchParams.get('recipientPatId') ? '' : 'Select a recipient.',
      isAllowed: true,
    },
  });
}
