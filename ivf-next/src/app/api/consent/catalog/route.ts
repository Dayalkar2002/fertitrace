import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { listConsentCatalog } from '@/lib/consent/word-book';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  const moduleName = new URL(req.url).searchParams.get('module') || 'IVF';
  try {
    return NextResponse.json({ success: true, data: listConsentCatalog(moduleName) });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Could not read consent forms.' },
      { status: 500 }
    );
  }
}
