import { NextRequest, NextResponse } from 'next/server';
import { uploadToMinio, BUCKET_NAME } from '@/lib/minio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check size limit: max 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 25MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If MinIO access key isn't provided, return diagnostic notice
    if (!process.env.MINIO_ACCESS_KEY) {
      const mockUrl = `https://media.tamarind.co.ke/${BUCKET_NAME}/${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      return NextResponse.json({
        success: true,
        url: mockUrl,
        filename: file.name,
        size: file.size,
        note: 'MinIO credentials not yet configured in .env.local. Simulated URL returned.',
      });
    }

    const { url, key } = await uploadToMinio(buffer, file.name, file.type || 'image/jpeg', folder);

    return NextResponse.json({
      success: true,
      url,
      key,
      filename: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error('MinIO upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload media to MinIO storage' },
      { status: 500 }
    );
  }
}
