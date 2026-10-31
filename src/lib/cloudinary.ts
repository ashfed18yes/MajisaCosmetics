import 'server-only';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadImageResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Checks whether all required Cloudinary environment variables are set.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Initializes and returns the Cloudinary client using server-only environment variables.
 * Never exposes credentials to client bundles.
 */
export function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

/**
 * Uploads a validated image buffer directly to Cloudinary in the dedicated products folder.
 *
 * Security & Validation Rules:
 * - Max file size: 5 MB (5 * 1024 * 1024 bytes).
 * - Supported formats: JPEG, PNG, WEBP.
 * - Validates binary magic bytes to prevent forged file extensions.
 * - Uploads to dedicated folder: 'majisa-cosmetics/products'.
 */
export async function uploadProductImage(
  buffer: Buffer,
  _originalFilename?: string
): Promise<UploadImageResult> {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (buffer.length > MAX_SIZE) {
    throw new Error('Image exceeds the maximum allowed size of 5 MB.');
  }

  if (buffer.length < 12) {
    throw new Error('Invalid image file: file size is too small.');
  }

  // Validate binary magic bytes
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error(
      'Unsupported image format. Allowed formats are JPEG, PNG, and WEBP.'
    );
  }

  const client = getCloudinaryClient();

  return new Promise<UploadImageResult>((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: 'majisa-cosmetics/products',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        unique_filename: true,
        overwrite: false,
        // Disable unnecessary heavy analysis pipelines during upload for fastest response
        quality_analysis: false,
        colors: false,
        faces: false,
        phash: false,
        cinemagraph_analysis: false,
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          const safeMessage = error?.message || 'Failed to upload image to Cloudinary.';
          reject(new Error(safeMessage));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Securely deletes a product image asset from Cloudinary.
 *
 * Security Rule:
 * Strictly checks that publicId starts with 'majisa-cosmetics/products/'
 * to avoid deleting arbitrary or foreign Cloudinary assets.
 */
export async function deleteCloudinaryProductImage(publicId: string): Promise<boolean> {
  if (!publicId || typeof publicId !== 'string') {
    return false;
  }

  // Ensure asset is inside the designated Majisa products folder
  if (!publicId.startsWith('majisa-cosmetics/products/')) {
    return false;
  }

  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary is not configured; skipping asset deletion for:', publicId);
    return false;
  }

  try {
    const client = getCloudinaryClient();
    const result = await client.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary asset destruction error:', error instanceof Error ? error.message : error);
    return false;
  }
}

