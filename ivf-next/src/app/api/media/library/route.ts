import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, authUnauthorizedResponse } from '@/lib/auth/verify-auth';
import {
  getLibraryFiles,
  saveUploadedFile,
  deleteLibraryFile,
} from '@/lib/services-server/media.service';

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const items = await getLibraryFiles();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to fetch library' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, message: 'Please select an image file to upload.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedFile(buffer, file.name);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded to library successfully.',
      data: saved,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to upload image.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) return authUnauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('fileName') || '';

  if (!fileName) {
    return NextResponse.json({ success: false, message: 'FileName is required.' }, { status: 400 });
  }

  try {
    await deleteLibraryFile(fileName);
    return NextResponse.json({ success: true, message: 'Image deleted from library.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Failed to delete file from library.' },
      { status: 500 }
    );
  }
}
