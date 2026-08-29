import { query, queryOne } from '../../database/connection';
import { BadRequestError, NotFoundError } from '../../errors/AppError';
import { processImage, generateUniqueFileName, uploadToR2, deleteFromR2 } from '../media/media.service';
import type { Poster } from '@rewa-bhoomi/types';

export const MAX_POSTERS_COUNT = 6;

export async function getActivePosters(): Promise<Poster[]> {
  const posters = await query<Poster>(
    `SELECT * FROM posters 
     WHERE is_active = TRUE 
     ORDER BY sort_order ASC, created_at DESC`
  );
  return posters;
}

export async function getAllPostersAdmin(): Promise<Poster[]> {
  const posters = await query<Poster>(
    `SELECT * FROM posters 
     ORDER BY sort_order ASC, created_at DESC`
  );
  return posters;
}

export async function createPoster(
  desktopFile: { buffer: Buffer; originalName: string } | null,
  mobileFile: { buffer: Buffer; originalName: string } | null,
  data: {
    title?: string;
    redirectUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<Poster> {
  if (!desktopFile && !mobileFile) {
    throw new BadRequestError('At least one image (Desktop or Mobile) is required to create a poster.');
  }

  // Check maximum limit
  const countRes = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM posters`
  );
  const currentCount = parseInt(countRes?.count || '0', 10);
  if (currentCount >= MAX_POSTERS_COUNT) {
    throw new BadRequestError(`Maximum limit of ${MAX_POSTERS_COUNT} posters reached. Please remove an existing poster first.`);
  }

  let desktopImageUrl: string | null = null;
  let desktopKey: string | null = null;

  let mobileImageUrl: string | null = null;
  let mobileKey: string | null = null;

  // 1. Process Desktop Image
  if (desktopFile) {
    const processedDesktop = await processImage(desktopFile.buffer);
    const fileName = generateUniqueFileName(desktopFile.originalName);
    desktopKey = `posters/desktop/${new Date().getFullYear()}/${fileName}`;
    desktopImageUrl = await uploadToR2(processedDesktop, desktopKey, 'image/webp');
  }

  // 2. Process Mobile Image
  if (mobileFile) {
    const processedMobile = await processImage(mobileFile.buffer);
    const fileName = generateUniqueFileName(mobileFile.originalName);
    mobileKey = `posters/mobile/${new Date().getFullYear()}/${fileName}`;
    mobileImageUrl = await uploadToR2(processedMobile, mobileKey, 'image/webp');
  }

  // Fallback if only one is uploaded
  const primaryImageUrl = desktopImageUrl || mobileImageUrl!;
  const primaryStorageKey = desktopKey || mobileKey!;

  // 3. Save to posters table
  const sortOrder = data.sortOrder ?? currentCount;
  const isActive = data.isActive !== undefined ? data.isActive : true;

  const rows = await query<Poster>(
    `INSERT INTO posters (
       title, image_url, storage_key, mobile_image_url, mobile_storage_key, redirect_url, sort_order, is_active
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.title?.trim() || null,
      primaryImageUrl,
      primaryStorageKey,
      mobileImageUrl,
      mobileKey,
      data.redirectUrl?.trim() || null,
      sortOrder,
      isActive,
    ]
  );

  return rows[0];
}

export async function updatePoster(
  id: string,
  data: {
    title?: string | null;
    redirectUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<Poster> {
  const existing = await queryOne<Poster>(
    `SELECT * FROM posters WHERE id = $1`,
    [id]
  );

  if (!existing) {
    throw new NotFoundError('Poster not found');
  }

  const updatedTitle = data.title !== undefined ? (data.title ? data.title.trim() : null) : existing.title;
  const updatedRedirect = data.redirectUrl !== undefined ? (data.redirectUrl ? data.redirectUrl.trim() : null) : existing.redirect_url;
  const updatedSortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sort_order;
  const updatedIsActive = data.isActive !== undefined ? data.isActive : existing.is_active;

  const rows = await query<Poster>(
    `UPDATE posters 
     SET title = $1, redirect_url = $2, sort_order = $3, is_active = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [updatedTitle, updatedRedirect, updatedSortOrder, updatedIsActive, id]
  );

  return rows[0];
}

export async function deletePoster(id: string): Promise<void> {
  const existing = await queryOne<Poster>(
    `SELECT * FROM posters WHERE id = $1`,
    [id]
  );

  if (!existing) {
    throw new NotFoundError('Poster not found');
  }

  // 1. Delete Desktop image from Cloudflare R2
  if (existing.storage_key) {
    try {
      await deleteFromR2(existing.storage_key);
    } catch (err) {
      console.error(`Failed to delete poster asset ${existing.storage_key} from R2:`, err);
    }
  }

  // 2. Delete Mobile image from Cloudflare R2
  if (existing.mobile_storage_key) {
    try {
      await deleteFromR2(existing.mobile_storage_key);
    } catch (err) {
      console.error(`Failed to delete mobile poster asset ${existing.mobile_storage_key} from R2:`, err);
    }
  }

  // 3. Delete from Database
  await query(`DELETE FROM posters WHERE id = $1`, [id]);
}
