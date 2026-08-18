import { Request, Response } from 'express';
import { asyncHandler, successResponse } from '../../middleware/errorHandler';
import { getUserByUsername, getUserProperties } from './users.service';

export const getPublicProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;
  const user = await getUserByUsername(username);
  
  return successResponse(res, user);
});

export const getPublicPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;
  // Ensure user exists first
  await getUserByUsername(username);
  
  const properties = await getUserProperties(username);
  return successResponse(res, properties);
});
