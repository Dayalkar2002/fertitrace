import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getStoredCycle, saveStoredRetrieval, upsertCycle } from '@/lib/cycle-store';
import type { RetrievalData } from '@/lib/types/cycle';

export async function POST(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  try {
    const body = (await req.json()) as { sections?: RetrievalData };
    const saved = saveStoredRetrieval(cycleId, body.sections || {});
    const cycle = getStoredCycle(cycleId) || upsertCycle({
      cycleId,
      patientId: 0,
      satelliteId: 0,
      oocyteSource: 'Fresh',
      semenSource: 'husband_fresh',
      status: 'retrieval',
    });
    return NextResponse.json({
      success: true,
      message: 'Retrieval data saved.',
      data: { ...cycle, status: 'retrieval', existingRetrieval: saved },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to save retrieval.' },
      { status: 500 }
    );
  }
}
