import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import { listSpermIdLocations } from '@/lib/services-server/sperm-id-location.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const data = await listSpermIdLocations({
      spermId: searchParams.get('spermId') || '',
      semenType: searchParams.get('type') || 'Fresh',
      patId: Number(searchParams.get('patId')) || 0,
      satId: Number(searchParams.get('satId')) || 0,
      thawId: searchParams.get('thawId') || 'New',
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to load frozen IDs.' },
      { status: 500 }
    );
  }
}
