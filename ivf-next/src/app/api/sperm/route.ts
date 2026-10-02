import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import { getSpermSamples, saveSpermSample, SpermSampleRecord } from '@/lib/services-server/sperm.service';
import {
  getCycleSemenAnalysis,
  getPatientSemenAnalysisList,
  getSemenAnalysisById,
} from '@/lib/services-server/semen-analysis.service';
import {
  listSpermIdLocations,
  getSpermLocationDetails,
} from '@/lib/services-server/sperm-id-location.service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';

  // 1. Semen Analysis lookup
  if (action === 'analysis') {
    const user = getAuthenticatedUser(req);
    if (!user) return authUnauthorizedResponse();

    const cycleId = searchParams.get('cycleId')?.trim() || '';
    const patId = Number(searchParams.get('patId') || searchParams.get('patientId') || 0);
    const analysisId = Number(searchParams.get('analysisId') || 0);

    try {
      let currentAnalysis = null;
      if (analysisId) {
        currentAnalysis = await getSemenAnalysisById(analysisId);
      } else if (cycleId) {
        currentAnalysis = await getCycleSemenAnalysis(cycleId, patId);
      } else if (patId) {
        currentAnalysis = await getCycleSemenAnalysis('', patId);
      }

      const resolvedPatId = patId || currentAnalysis?.patientId || 0;
      let history: unknown[] = [];
      if (resolvedPatId) {
        history = await getPatientSemenAnalysisList(resolvedPatId);
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

  // 2. Frozen Sperm ID Locations
  if (action === 'id-locations') {
    const user = getAuthenticatedUser(req);
    if (!user) return authUnauthorizedResponse();
    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
    }

    try {
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

  // 3. Sperm Location / Straw Details
  if (action === 'location-details') {
    const user = getAuthenticatedUser(req);
    if (!user) return authUnauthorizedResponse();
    if (!isDbConfigured()) {
      return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
    }

    try {
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

  // Default: Get sperm samples
  try {
    const patientId = searchParams.get('patientId') || undefined;
    const samples = await getSpermSamples(patientId);
    return NextResponse.json({ success: true, data: samples });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Error fetching sperm samples' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    const body = (await req.json()) as SpermSampleRecord;

    if (!body.sampleId && !body.id) {
      return NextResponse.json(
        { success: false, message: 'Sample ID is required' },
        { status: 400 }
      );
    }

    if (user && !body.authorization?.authorizedBy) {
      if (body.status === 'VALIDATED') {
        body.authorization = {
          authorizedBy: user.userName || user.userLoginName || 'Lab Administrator',
          authorizedOn: new Date().toISOString(),
          status: 'AUTHORIZED',
        };
      }
    }

    const saved = await saveSpermSample(body);
    return NextResponse.json({
      success: true,
      message: 'Sperm sample witnessed and updated successfully',
      data: saved,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Error saving sperm record' },
      { status: 500 }
    );
  }
}
