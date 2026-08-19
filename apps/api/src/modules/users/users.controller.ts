import { Request, Response } from 'express';
import { asyncHandler, successResponse } from '../../middleware/errorHandler';
import { getUserByUsername, getUserProperties } from './users.service';

export const getPublicProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const user = await getUserByUsername(identifier);
  
  return successResponse(res, user);
});

export const getPublicPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  // Ensure user exists first
  await getUserByUsername(identifier);
  
  const isAdmin = req.user?.roles.includes('ADMIN') || false;
  const properties = await getUserProperties(identifier, isAdmin);
  return successResponse(res, properties);
});
