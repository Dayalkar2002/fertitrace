import { NextResponse } from 'next/server';
import { isDbConfigured, getPool } from '@/lib/db/pool';

export async function GET() {
  const health: Record<string, unknown> = {
    success: true,
    message: 'FERTITRACE API (Next.js integrated) is running.',
    database: 'not_configured',
    routes: [
      'auth',
      'patients',
      'cycles',
      'sp',
      'masters',
      'iui',
      'ivf',
      'icsi',
      'et',
      'bt',
      'dashboard',
      'consent',
    ],
  };

  if (isDbConfigured()) {
    try {
      await getPool();
      health.database = 'connected';
    } catch (error: unknown) {
      health.database = 'error';
      health.databaseError = (error as Error).message;
    }
  }

  return NextResponse.json(health);
}
