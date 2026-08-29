import { Request, Response } from 'express';
import {
  getActivePosters,
  getAllPostersAdmin,
  createPoster,
  updatePoster,
  deletePoster,
} from './poster.service';
import { BadRequestError } from '../../errors/AppError';
import { successResponse } from '../../middleware/errorHandler';

async function resolveImageInput(
  file?: Express.Multer.File,
  imageUrl?: string,
  defaultName = 'image.jpg'
): Promise<{ buffer: Buffer; originalName: string } | null> {
  if (file) {
    return { buffer: file.buffer, originalName: file.originalname };
  }
  if (imageUrl) {
    const imageUrlStr = String(imageUrl).trim();
    if (imageUrlStr.startsWith('data:image/')) {
      const base64Data = imageUrlStr.split(',')[1];
      return { buffer: Buffer.from(base64Data, 'base64'), originalName: 'image.png' };
    }
    if (imageUrlStr.startsWith('http://') || imageUrlStr.startsWith('https://')) {
      const response = await fetch(imageUrlStr);
      if (!response.ok) {
        throw new BadRequestError(`Failed to download image from URL (${response.statusText})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const urlParts = imageUrlStr.split('/');
      const originalName = urlParts[urlParts.length - 1].split('?')[0] || defaultName;
      return { buffer: Buffer.from(arrayBuffer), originalName };
    }
  }
  return null;
}

export const listActivePosters = async (req: Request, res: Response) => {
  const posters = await getActivePosters();
  return successResponse(res, posters);
};

export const listAllPostersAdmin = async (req: Request, res: Response) => {
  const posters = await getAllPostersAdmin();
  return successResponse(res, posters);
};

export const createPosterHandler = async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const desktopMulterFile = files?.desktopImage?.[0] || files?.image?.[0] || (req.file as Express.Multer.File | undefined);
  const mobileMulterFile = files?.mobileImage?.[0];

  const desktopImageInput = await resolveImageInput(
    desktopMulterFile,
    req.body.desktopImageUrl || req.body.imageUrl,
    'desktop-poster.jpg'
  );

  const mobileImageInput = await resolveImageInput(
    mobileMulterFile,
    req.body.mobileImageUrl,
    'mobile-poster.jpg'
  );

  if (!desktopImageInput && !mobileImageInput) {
    throw new BadRequestError('Please provide at least a Desktop or Mobile poster image.');
  }

  const { title, redirectUrl, sortOrder, isActive } = req.body;

  const poster = await createPoster(desktopImageInput, mobileImageInput, {
    title: typeof title === 'string' ? title : undefined,
    redirectUrl: typeof redirectUrl === 'string' ? redirectUrl : undefined,
    sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
    isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
  });

  return successResponse(res, poster, 'Poster created successfully', 201);
};

export const updatePosterHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, redirectUrl, sortOrder, isActive } = req.body;

  const poster = await updatePoster(id, {
    title,
    redirectUrl,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    isActive: isActive !== undefined ? Boolean(isActive) : undefined,
  });

  return successResponse(res, poster, 'Poster updated successfully');
};

export const deletePosterHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  await deletePoster(id);
  return successResponse(res, null, 'Poster deleted successfully');
};
