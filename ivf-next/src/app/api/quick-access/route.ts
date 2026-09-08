import { NextRequest, NextResponse } from 'next/server';
import {
  getQuickAccessForUser,
  getAllCatalogWithUserState,
  saveUserQuickAccess,
  resetUserQuickAccess,
} from '@/lib/services-server/quick-access.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get('userId') || 0);
    const loginName = searchParams.get('loginName') || 'admin';
    const includeCatalog = searchParams.get('includeCatalog') === 'true';

    const items = await getQuickAccessForUser(userId, loginName);
    const catalog = includeCatalog
      ? await getAllCatalogWithUserState(userId, loginName)
      : undefined;

    return NextResponse.json({
      success: true,
      items,
      catalog,
    });
  } catch (err: unknown) {
    console.error('API /api/quick-access GET error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch quick access modules',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = Number(body.userId || 0);
    const loginName = String(body.loginName || 'admin');
    const modules = Array.isArray(body.modules) ? body.modules : [];

    const updated = await saveUserQuickAccess(userId, loginName, modules);

    return NextResponse.json({
      success: true,
      items: updated,
      message: 'Quick access modules saved successfully',
    });
  } catch (err: unknown) {
    console.error('API /api/quick-access POST error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save quick access modules',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get('userId') || 0);
    const loginName = searchParams.get('loginName') || 'admin';

    const reset = await resetUserQuickAccess(userId, loginName);

    return NextResponse.json({
      success: true,
      items: reset,
      message: 'Quick access modules reset to default',
    });
  } catch (err: unknown) {
    console.error('API /api/quick-access DELETE error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reset quick access modules',
      },
      { status: 500 }
    );
  }
}
