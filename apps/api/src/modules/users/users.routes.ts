import { Router } from 'express';
import { getPublicProfileHandler, getPublicPropertiesHandler } from './users.controller';

import { optionalAuth } from '../../middleware/auth';

const router = Router();

router.get('/profile/:identifier', optionalAuth, getPublicProfileHandler);
router.get('/properties/:identifier', optionalAuth, getPublicPropertiesHandler);

export default router;
