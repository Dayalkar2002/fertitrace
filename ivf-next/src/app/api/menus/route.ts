import { NextRequest, NextResponse } from 'next/server';
import { getLeftMenuItems, getTopMenuItems } from '@/lib/services-server/menu.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const allTop = searchParams.get('allTop') === '1';

    const [leftMenu, topMenu] = await Promise.all([
      getLeftMenuItems(),
      getTopMenuItems(!allTop),
    ]);

    return NextResponse.json({
      success: true,
      leftMenu,
      topMenu,
      data: {
        leftMenu,
        topMenu,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}
