import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { upsertCycle } from '@/lib/cycle-store';
import type { CycleEntryPayload } from '@/lib/types/cycle';

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const body = (await req.json()) as CycleEntryPayload & { cycleId?: string };
    if (!body.patientId) {
      return NextResponse.json({ success: false, message: 'Patient is required.' }, { status: 400 });
    }
    const saved = upsertCycle({
      ...body,
      cycleId: body.cycleId,
      status: 'entry',
    });
    return NextResponse.json({ success: true, message: 'Cycle entry saved.', data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to save cycle entry.' },
      { status: 500 }
    );
  }
}
