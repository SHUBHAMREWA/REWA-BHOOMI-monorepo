import { Request, Response } from 'express';
import { asyncHandler, successResponse } from '../../middleware/errorHandler';
import {
  listProperties,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  deleteProperty,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  getUserProperties,
  getCategories,
  getAmenities,
  moderateProperty,
  setPropertyPopular,
  togglePropertySoldStatus,
} from './property.service';

export const listPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await listProperties(req.query as unknown as Parameters<typeof listProperties>[0], req.user?.userId);
  return successResponse(res, result);
});

export const getPropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPER_ADMIN');
  const property = await getPropertyBySlug(req.params.slug, req.user?.userId, !!isAdmin);
  return successResponse(res, property);
});

export const createPropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user!.roles.includes('ADMIN') || req.user!.roles.includes('SUPER_ADMIN');
  const result = await createProperty(req.body, req.user!.userId, isAdmin ? 'ADMIN' : 'USER');
  return successResponse(res, result, 'Property created successfully', 201);
});

export const updatePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await updateProperty(req.params.id, req.body, req.user!.userId, req.user!.roles);
  return successResponse(res, result, 'Property updated successfully');
});

export const deletePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteProperty(req.params.id, req.user!.userId, req.user!.roles);
  return successResponse(res, null, 'Property deleted successfully');
});

export const addFavoriteHandler = asyncHandler(async (req: Request, res: Response) => {
  await addFavorite(req.user!.userId, req.params.id);
  return successResponse(res, null, 'Added to favorites');
});

export const removeFavoriteHandler = asyncHandler(async (req: Request, res: Response) => {
  await removeFavorite(req.user!.userId, req.params.id);
  return successResponse(res, null, 'Removed from favorites');
});

export const getFavoritesHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getUserFavorites(
    req.user!.userId,
    req.query.cursor as string | undefined,
    Number(req.query.limit) || 20,
  );
  return successResponse(res, result);
});

export const getMyPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getUserProperties(
    req.user!.userId,
    Number(req.query.page) || 1,
    Number(req.query.limit) || 20,
  );
  return successResponse(res, result);
});

export const getCategoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getCategories();
  return successResponse(res, data);
});

export const getAmenitiesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAmenities();
  return successResponse(res, data);
});

// ─── Admin handlers ───────────────────────────────────────────────────────────

export const moderatePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  await moderateProperty(req.params.id, req.body.status, req.body.rejectionReason);
  return successResponse(res, null, `Property ${req.body.status.toLowerCase()}`);
});

export const setPopularHandler = asyncHandler(async (req: Request, res: Response) => {
  await setPropertyPopular(req.params.id, req.body.isPopular, req.body.popularRank);
  return successResponse(res, null, 'Popular status updated');
});


export const togglePropertySoldStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  await togglePropertySoldStatus(req.params.id, req.body.isSold, req.user!.userId, req.user!.roles);
  return successResponse(res, null, `Property marked as ${req.body.isSold ? 'SOLD' : 'AVAILABLE'}`);
});
