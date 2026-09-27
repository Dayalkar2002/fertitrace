import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getStoredCycle, saveStoredRetrieval, upsertCycle } from '@/lib/cycle-store';
import { persistRetrievalFreeze } from '@/lib/services-server/oocyte-freeze.service';
import { saveRetrievalToDb } from '@/lib/services-server/retrieval.service';
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
    const patId = Number(body.patientId) || 0;
    const satId = Number(body.satelliteId) || 0;
    const cycleType = body.cycleType || 'Fresh';

    const cycle = getStoredCycle(cycleId) || upsertCycle({
      cycleId,
      patientId: patId,
      satelliteId: satId,
      oocyteSource: cycleType,
      semenSource: 'husband_fresh',
      cycleType,
      status: 'retrieval',
    });

    // 1. Save to SQL Server CycRetrieval
    await saveRetrievalToDb(cycleId, patId || cycle.patientId || 0, satId || cycle.satelliteId || 0, sections, cycleType);

    // 2. Persist freeze if needed
    const freeze = await persistRetrievalFreeze({
      cycleId,
      cycleType: cycleType || cycle.cycleType || cycle.oocyteSource,
      patientId: patId || cycle.patientId || 0,
      satelliteId: satId || cycle.satelliteId || 0,
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
