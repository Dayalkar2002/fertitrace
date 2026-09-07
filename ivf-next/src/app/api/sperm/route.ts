import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/verify-auth';
import { getSpermSamples, saveSpermSample, SpermSampleRecord } from '@/lib/services-server/sperm.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
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
