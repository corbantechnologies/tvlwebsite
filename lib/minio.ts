import * as Minio from 'minio';

const endPoint = process.env.MINIO_ENDPOINT || 'media.tamarind.co.ke';
const port = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : 443;
const useSSL = process.env.MINIO_USE_SSL !== 'false';
const accessKey = process.env.MINIO_ACCESS_KEY || '';
const secretKey = process.env.MINIO_SECRET_KEY || '';

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'tvl-website-assets';
export const PUBLIC_MEDIA_URL = process.env.MINIO_PUBLIC_URL || `https://${endPoint}/${BUCKET_NAME}`;

let minioClientInstance: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClientInstance) {
    minioClientInstance = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }
  return minioClientInstance;
}

/**
 * Upload a binary buffer to MinIO bucket
 */
export async function uploadToMinio(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> {
  const client = getMinioClient();
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${Date.now()}-${cleanName}`;

  // Directly upload to bucket without calling admin bucketExists/makeBucket
  // This prevents 401 / 403 AccessDenied errors on scoped S3 credentials


  // Upload buffer to MinIO bucket tvl-website-assets
  await client.putObject(BUCKET_NAME, key, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  // Construct resolved public URL
  // e.g. https://media.tamarind.co.ke/tvl-website-assets/uploads/123456-file.jpg
  const base = PUBLIC_MEDIA_URL.replace(/\/$/, '');
  const url = base.includes(BUCKET_NAME)
    ? `${base}/${key}`
    : `${base}/${BUCKET_NAME}/${key}`;

  return { url, key };
}
