import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getStoredCycle, saveStoredRetrieval, upsertCycle } from '@/lib/cycle-store';
import { persistRetrievalFreeze } from '@/lib/services-server/oocyte-freeze.service';
import type { RetrievalData } from '@/lib/types/cycle';

export async function POST(req: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { cycleId } = await params;
  try {
    const body = (await req.json()) as {
      sections?: RetrievalData;
      patientId?: number;
      satelliteId?: number;
      cycleType?: string;
      donorName?: string;
    };
    const sections = body.sections || {};
    const saved = saveStoredRetrieval(cycleId, sections);
    const cycle = getStoredCycle(cycleId) || upsertCycle({
      cycleId,
      patientId: Number(body.patientId) || 0,
      satelliteId: Number(body.satelliteId) || 0,
      oocyteSource: body.cycleType || 'Fresh',
      semenSource: 'husband_fresh',
      cycleType: body.cycleType,
      status: 'retrieval',
    });

    const freeze = await persistRetrievalFreeze({
      cycleId,
      cycleType: body.cycleType || cycle.cycleType || cycle.oocyteSource,
      patientId: Number(body.patientId || cycle.patientId) || 0,
      satelliteId: Number(body.satelliteId || cycle.satelliteId) || 0,
      donorName: body.donorName || '',
      sections,
    });

    return NextResponse.json({
      success: true,
      message: freeze?.fzoCycleId
        ? `Retrieval saved. Freeze oocytes are on Frozen Oocyte cycle ${freeze.fzoCycleId}. Assign location there.`
        : 'Retrieval data saved.',
      data: { ...cycle, status: 'retrieval', existingRetrieval: saved, freeze },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to save retrieval.' },
      { status: 500 }
    );
  }
}
