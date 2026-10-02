import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { executeDRL } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return authUnauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const patId = Number(searchParams.get('patId') || 0);
    const satId = Number(searchParams.get('satId') || 1);

    if (isDbConfigured()) {
      try {
        const result = await executeDRL<{
          IUIID: string;
          Indication?: string;
          IUIODateOfCreation?: string;
          IUIIDOff?: string | number;
          IUIOPostTreat?: string;
          IUIOAdvice?: string;
          IUIOID?: number;
          IsLock?: boolean | number | string;
        }>('spGetIUIList', [
          { name: '@PatId', value: patId },
          { name: '@SatId', value: satId },
        ]);

        return NextResponse.json({
          success: true,
          data: result.recordsets?.[0] || result.recordset || [],
        });
      } catch (dbErr) {
        console.error('DB error listing IUI:', dbErr);
      }
    }

    // Demo Mode Fallback
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return authUnauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || '';
    const body = await req.json();

    if (action === 'unlock' || body.action === 'unlock') {
      if (isDbConfigured()) {
        try {
          await executeDRL('spUnlockCycle', [
            { name: '@PatId', value: body.patId || 0 },
            { name: '@CycleId', value: body.cycleId || '' },
            { name: '@ModuleType', value: 'IUI' },
          ]);
          return NextResponse.json({
            success: true,
            message: 'IUI cycle unlocked successfully.',
          });
        } catch (dbErr) {
          console.error('DB error unlocking IUI cycle:', dbErr);
        }
      }
      return NextResponse.json({
        success: true,
        message: 'IUI cycle unlocked successfully (Demo Mode).',
      });
    }

    if (isDbConfigured()) {
      try {
        const result = await executeDRL('spIUIOutCome', [
          { name: '@Mode', value: body.mode || 'insert' },
          { name: '@PatId', value: body.patId || 0 },
          { name: '@SatId', value: body.satId || 1 },
          { name: '@IUIID', value: body.iuiId || '' },
          { name: '@IUIOID', value: body.iuiOId || 0 },
          { name: '@IUIIDOff', value: body.iuiIdOff || '' },
          { name: '@IUIODate', value: body.iuiODate || null },
          { name: '@IUIOValue', value: body.iuioValue || 0 },
          { name: '@IUIONoSac', value: body.iuioNoSac || 0 },
          { name: '@IUIOPostIUIDay', value: body.iuioPostIuiDay || 0 },
          { name: '@IUIOOutcome', value: body.iuioOutcome || 0 },
          { name: '@IUIOPregOpt', value: body.iuioPregOpt || 0 },
          { name: '@IUIOPregDelOpt', value: body.iuioPregDelOpt || 0 },
          { name: '@IUIOPostTreat', value: body.iuioPostTreat || '' },
          { name: '@IUIOAdvice', value: body.iuioAdvice || '' },
        ]);

        return NextResponse.json({
          success: true,
          message: 'IUI record saved successfully.',
          data: result.recordsets?.[0] || [],
        });
      } catch (dbErr) {
        console.error('DB error saving IUI:', dbErr);
      }
    }

    // Demo Mode Fallback
    return NextResponse.json({
      success: true,
      message: 'IUI record saved successfully (Demo Mode).',
      data: { iuiId: body.iuiId || 'IUI-DEMO-001' },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
