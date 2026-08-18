import { Request, Response } from 'express';
import { processImage, generateUniqueFileName, uploadToR2, deleteFromR2 } from './media.service';
import { query } from '../../database/connection';
import { BadRequestError } from '../../errors/AppError';
import { env } from '../../config/env';

export const uploadMediaHandler = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('No file provided');
  }

  // 1. Process and compress the image
  const processedBuffer = await processImage(req.file.buffer);

  // 2. Generate unique key
  const fileName = generateUniqueFileName(req.file.originalname);
  const key = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

  // 3. Upload to Cloudflare R2
  const fileUrl = await uploadToR2(processedBuffer, key);

  // 4. Save metadata to DB
  const [asset] = await query(
    `INSERT INTO media_assets (
      id, url, storage_key, mime_type, size, entity_type
    ) VALUES (
      gen_random_uuid(), $1, $2, 'image/webp', $3, 'UPLOADS'
    )
    RETURNING *`,
    [fileUrl, key, processedBuffer.length]
  );

  return res.status(201).json({
    success: true,
    data: asset,
  });
};

export const deleteMediaHandler = async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    throw new BadRequestError('URL is required');
  }

  // Find by URL
  const rows = await query<{ storage_key: string }>(
    'SELECT storage_key FROM media_assets WHERE url = $1',
    [url]
  );
  const asset = rows[0];

  let key = '';
  if (asset) {
    key = asset.storage_key;
    // Delete from DB
    await query('DELETE FROM media_assets WHERE url = $1', [url]);
  } else {
    // Fallback: try to extract key from public URL
    const publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || '';
    if (publicUrl && url.startsWith(publicUrl)) {
      key = url.replace(`${publicUrl}/`, '');
    }
  }

  if (key) {
    try {
      await deleteFromR2(key);
    } catch (err) {
      console.error(`Failed to delete key ${key} from R2`, err);
    }
  }

  return res.json({
    success: true,
    message: 'Media deleted successfully',
  });
};

