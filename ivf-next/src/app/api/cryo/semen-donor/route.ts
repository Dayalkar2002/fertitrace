import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { isDbConfigured } from '@/lib/db/pool';
import * as donorService from '@/lib/services-server/semen-donor.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('labs') === '1') {
      const data = await donorService.listDonorLabs();
      return NextResponse.json({ success: true, data });
    }

    const aadhar = searchParams.get('aadhar');
    if (aadhar) {
      const data = await donorService.searchSemenDonorByAadhar(aadhar);
      return NextResponse.json({ success: true, data });
    }

    const data = await donorService.listSemenDonors();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const result = await donorService.saveSemenDonor(body);
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      message: result.duplicate
        ? 'This Aadhar already exists. Existing donor loaded for update.'
        : body.donorIdSrNo > 0
          ? 'Donor details updated successfully.'
          : 'Donor details submitted or added successfully.',
      data: result.detail,
      list: result.list,
    });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json({ success: false, message: (error as Error).message }, { status });
  }
}
