import { Router } from 'express';
import { getPublicProfileHandler, getPublicPropertiesHandler } from './users.controller';

const router = Router();

router.get('/profile/:username', getPublicProfileHandler);
router.get('/properties/:username', getPublicPropertiesHandler);

export default router;
