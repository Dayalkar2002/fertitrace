import { NextRequest, NextResponse } from 'next/server';
import {
  createAndRegisterQR,
  validateScannedQR,
  allotPreassignedLabel,
  transitionLifecycleStatus,
  listConsumableInventory,
  listTraceabilityAuditLogs,
  listQRHistory,
} from '@/lib/services-server/fertitrace-qr.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  try {
    const body = await req.json();

    switch (action) {
      case 'generate': {
        const record = await createAndRegisterQR(body);
        return NextResponse.json({ success: true, record });
      }

      case 'validate': {
        const result = await validateScannedQR(body);
        return NextResponse.json({ success: true, ...result });
      }

      case 'preassigned': {
        const result = await allotPreassignedLabel(body);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, record: result.record });
      }

      case 'transition': {
        const result = await transitionLifecycleStatus(body);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, record: result.record });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid QR action: ${action}` }, { status: 404 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Failed to process QR ${action}`;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  try {
    const { searchParams } = new URL(req.url);

    switch (action) {
      case 'inventory': {
        const items = await listConsumableInventory();
        return NextResponse.json({ success: true, items });
      }

      case 'history': {
        const type = searchParams.get('type') || 'qr';
        const specimenId = searchParams.get('specimenId') || undefined;
        if (type === 'audit') {
          const audits = await listTraceabilityAuditLogs(specimenId);
          return NextResponse.json({ success: true, audits });
        }
        const records = await listQRHistory(50);
        return NextResponse.json({ success: true, records });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid QR action: ${action}` }, { status: 404 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Failed to fetch QR ${action}`;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
