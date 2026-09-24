import { NextRequest, NextResponse } from 'next/server';
import { authUnauthorizedResponse, getAuthenticatedUser } from '@/lib/auth/verify-auth';
import { listRecipientCycles, listRetrievalRecipients } from '@/lib/services-server/retrieval-lookup.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;
  const cycleId = searchParams.get('cycleId') || '';
  const recipientId = Number(searchParams.get('recipientId')) || 0;

  if (!patId && !recipientId) {
    return NextResponse.json({ success: true, data: { recipients: [], cycles: [], lockedRecipientId: 0 } });
  }

  try {
    if (recipientId) {
      const cycles = await listRecipientCycles(recipientId, satId, cycleId);
      return NextResponse.json({ success: true, data: { cycles } });
    }
    const data = await listRetrievalRecipients(patId, satId, cycleId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to load recipients.', data: { recipients: [], cycles: [] } },
      { status: 500 }
    );
  }
}
