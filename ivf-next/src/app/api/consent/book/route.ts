import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db/pool';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import { getPatientConsentContext } from '@/lib/services-server/consent.service';
import { buildConsentBookFromWord } from '@/lib/consent/word-book';

function formatConsentDate(date: Date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')}/${months[date.getMonth()]}/${date.getFullYear()}`;
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();
  if (!isDbConfigured()) {
    return NextResponse.json({ success: false, message: 'Database not configured.' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const patId = Number(body?.patId);
  const satId = Number(body?.satId);
  const paths = Array.isArray(body?.paths) ? body.paths.map((item: unknown) => String(item)) : [];
  if (!patId || !satId) {
    return NextResponse.json({ success: false, message: 'Select a patient before generating the consent book.' }, { status: 400 });
  }
  if (paths.length === 0) {
    return NextResponse.json({ success: false, message: 'Tick at least one consent form.' }, { status: 400 });
  }

  try {
    const context = await getPatientConsentContext({ patId, satId });
    if (!context) {
      return NextResponse.json({ success: false, message: 'Patient not found.' }, { status: 404 });
    }
    const patient = context.patient;
    const cycle = context.cycles[0];
    const pdf = await buildConsentBookFromWord(paths, {
      patientName: patient.name || '',
      partnerName: patient.partner || '',
      uhid: patient.uhid || '',
      age: patient.age != null ? `${patient.age} Years` : '',
      dob: patient.dob || '',
      femaleAadhar: patient.aadhar || '',
      maleAadhar: patient.maleAadhar || '',
      mobile: patient.mobile || '',
      email: patient.email || '',
      address: [patient.address, patient.city].filter(Boolean).join(', '),
      registrationNo: patient.registrationNo || '',
      diagnosis: patient.diagnosis || '',
      cycleNo: cycle?.id || '',
      consentDate: formatConsentDate(new Date()),
      referredBy: patient.referredBy || '',
    });
    const safeName = (patient.name || 'patient').replace(/[^\w.-]+/g, '_');
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Consent-${safeName}.pdf"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Could not build the consent book.' },
      { status: 500 }
    );
  }
}
