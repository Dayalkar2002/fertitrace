import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import { getSpermLocationDetails } from '@/lib/services-server/sperm-id-location.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const spermType = searchParams.get('spermType') || '';
    const data = await getSpermLocationDetails(id, spermType);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to load straw details.' },
      { status: 500 }
    );
  }
}
