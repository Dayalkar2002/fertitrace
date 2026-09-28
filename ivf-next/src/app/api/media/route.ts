import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  getMediaList,
  saveMediaRecord,
  deleteMediaRecord,
  toggleMediaSelected,
  saveUploadedFile,
} from '@/lib/services-server/media.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const cycId = searchParams.get('cycId') || '';
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;
  const catId = Number(searchParams.get('catId')) || 0;

  if (!cycId || !patId) {
    return NextResponse.json({ success: true, data: { items: [], selectedCount: 0 } });
  }

  try {
    const data = await getMediaList(cycId, patId, satId, catId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to fetch media records' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body.action === 'toggle-selected') {
        const { mediaId, patId, satId, selected } = body;
        await toggleMediaSelected(Number(mediaId), Number(patId), Number(satId) || 0, Boolean(selected));
        return NextResponse.json({ success: true, message: 'Selection updated.' });
      }
    }

    // Multipart form data for file upload or saving record
    const formData = await req.formData();
    const mediaId = Number(formData.get('mediaId')) || 0;
    const cycId = String(formData.get('cycId') || '').trim();
    const patId = Number(formData.get('patId')) || 0;
    const satId = Number(formData.get('satId')) || 0;
    const fileName = String(formData.get('fileName') || '').trim();
    const catId = Number(formData.get('catId')) || 1;
    const dateOfCreation = String(formData.get('dateOfCreation') || '');
    let mediaFile = String(formData.get('mediaFile') || '').trim();

    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const saved = await saveUploadedFile(buffer, file.name);
      mediaFile = saved.fileName;
    }

    if (!cycId || !patId) {
      return NextResponse.json({ success: false, message: 'Cycle and Patient are required.' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ success: false, message: 'File Name is required.' }, { status: 400 });
    }

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, message: 'Please upload a file or select one from the library.' },
        { status: 400 }
      );
    }

    await saveMediaRecord({
      mediaId,
      cycId,
      patId,
      satId,
      dateOfCreation,
      fileName,
      catId,
      mediaFile,
    });

    return NextResponse.json({
      success: true,
      message: mediaId > 0 ? 'Media updated successfully.' : 'Media saved successfully.',
      mediaFile,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to save media.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const mediaId = Number(searchParams.get('mediaId')) || 0;
  const cycId = searchParams.get('cycId') || '';
  const patId = Number(searchParams.get('patId')) || 0;
  const satId = Number(searchParams.get('satId')) || 0;

  if (!mediaId || !cycId || !patId) {
    return NextResponse.json({ success: false, message: 'Missing parameters.' }, { status: 400 });
  }

  try {
    await deleteMediaRecord(mediaId, cycId, patId, satId);
    return NextResponse.json({ success: true, message: 'Media file deleted.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to delete media.' },
      { status: 500 }
    );
  }
}
