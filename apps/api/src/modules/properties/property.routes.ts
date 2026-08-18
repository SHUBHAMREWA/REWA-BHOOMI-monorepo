import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertyFiltersSchema,
  ModeratePropertySchema,
  SetPopularPropertySchema,
} from '@rewa-bhoomi/validation';
import {
  listPropertiesHandler,
  getPropertyHandler,
  createPropertyHandler,
  updatePropertyHandler,
  deletePropertyHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
  getFavoritesHandler,
  getMyPropertiesHandler,
  getCategoriesHandler,
  getAmenitiesHandler,
  moderatePropertyHandler,
  setPopularHandler,
} from './property.controller';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/categories', getCategoriesHandler);
router.get('/amenities', getAmenitiesHandler);
router.get('/', optionalAuth, validate(PropertyFiltersSchema, 'query'), listPropertiesHandler);
router.get('/:slug', optionalAuth, getPropertyHandler);

// ─── Authenticated ────────────────────────────────────────────────────────────
router.use(authenticate);
router.post('/', validate(CreatePropertySchema), createPropertyHandler);
router.patch('/:id', validate(UpdatePropertySchema), updatePropertyHandler);
router.delete('/:id', deletePropertyHandler);
router.post('/:id/favorite', addFavoriteHandler);
router.delete('/:id/favorite', removeFavoriteHandler);
router.get('/me/listings', getMyPropertiesHandler);
router.get('/me/favorites', getFavoritesHandler);

// ─── Admin Only ───────────────────────────────────────────────────────────────
router.patch('/:id/moderate', requireRole('ADMIN', 'SUPER_ADMIN'), validate(ModeratePropertySchema), moderatePropertyHandler);
router.patch('/:id/popular', requireRole('ADMIN', 'SUPER_ADMIN'), validate(SetPopularPropertySchema), setPopularHandler);

export default router;
