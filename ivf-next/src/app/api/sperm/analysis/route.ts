import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  getCycleSemenAnalysis,
  getPatientSemenAnalysisList,
} from '@/lib/services-server/semen-analysis.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get('cycleId')?.trim() || '';
  const patId = Number(searchParams.get('patId') || searchParams.get('patientId') || 0);

  try {
    let currentAnalysis = null;
    if (cycleId) {
      currentAnalysis = await getCycleSemenAnalysis(cycleId, patId);
    } else if (patId) {
      currentAnalysis = await getCycleSemenAnalysis('', patId);
    }

    let history: unknown[] = [];
    if (patId) {
      history = await getPatientSemenAnalysisList(patId);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: currentAnalysis,
        history,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Failed to load semen analysis.',
      },
      { status: 500 }
    );
  }
}
