import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { buildRetrievalConfig, getStoredCycle, upsertCycle } from '@/lib/cycle-store';
import { oocyteSourceFromCreation } from '@/lib/cycle-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  const { searchParams } = new URL(req.url);
  const stored = getStoredCycle(cycleId);
  const cycle = stored
    ? stored
    : upsertCycle({
        cycleId,
        patientId: Number(searchParams.get('patId')) || 0,
        satelliteId: Number(searchParams.get('satId')) || 0,
        oocyteSource: oocyteSourceFromCreation(searchParams.get('cycleType') || searchParams.get('oocyteSource') || 'Fresh'),
        semenSource: searchParams.get('semenSource') || 'husband_fresh',
        cycleType: searchParams.get('cycleType') || 'Fresh',
        treatmentType: searchParams.get('treatmentType') || 'Fresh',
      });

  return NextResponse.json({ success: true, data: buildRetrievalConfig(cycle) });
}
